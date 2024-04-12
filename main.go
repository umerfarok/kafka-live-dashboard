package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/IBM/sarama"
	"github.com/gorilla/websocket"
	"github.com/samuel/go-zookeeper/zk"
	"github.com/umerfarok/kafka-live-dashboard/config"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type TopicStatus struct {
	Name    string
	Alive   bool
	Message string
}

type Server struct {
	config    *config.Config
	kafkaConn sarama.Client
	zkConn    *zk.Conn
	topics    []string
	mu        sync.Mutex
}

func NewServer(config *config.Config) (*Server, error) {
	kafkaConfig := sarama.NewConfig()
	kafkaConfig.Version = sarama.V2_6_0_0
	kafkaConn, err := sarama.NewClient(strings.Split(config.KafkaBrokers, ","), kafkaConfig)
	if err != nil {
		return nil, err
	}

	zkConn, _, err := zk.Connect(strings.Split(config.ZookeeperNodes, ","), time.Second)
	if err != nil {
		return nil, err
	}

	return &Server{
		config:    config,
		kafkaConn: kafkaConn,
		zkConn:    zkConn,
	}, nil
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/" {
		fmt.Fprintf(w, "Hello World")
		return
	} else if r.URL.Path == "/topics" {
		topics := s.GetTopics()
		jsonBytes, err := json.Marshal(topics)
		if err != nil {
			http.Error(w, "Failed to marshal topics", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonBytes)
		return
	} else if r.URL.Path == "/ws" {
		s.ServeWebSocket(w, r)
		return
	}

	http.NotFound(w, r)
}

func (s *Server) GetTopics() []string {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.topics == nil {
		topics, _, err := s.zkConn.Children("/brokers/topics")
		if err != nil {
			log.Println("Failed to get topics from Zookeeper:", err)
			return nil
		}
		s.topics = topics
	}
	return s.topics
}

func (s *Server) ServeWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("WebSocket read error:", err)
			return
		}
		topic := string(msg)
		s.HandleWebSocket(conn, topic)
	}
}

func (s *Server) HandleWebSocket(conn *websocket.Conn, topic string) {
	consumer, err := sarama.NewConsumerFromClient(s.kafkaConn)
	if err != nil {
		log.Println("Failed to create consumer:", err)
		return
	}
	partitionConsumer, err := consumer.ConsumePartition(topic, 0, sarama.OffsetNewest)
	if err != nil {
		log.Println("Failed to start consumer for partition:", err)
		return
	}
	defer partitionConsumer.Close()

	for message := range partitionConsumer.Messages() {
		err := conn.WriteMessage(websocket.TextMessage, message.Value)
		if err != nil {
			log.Println("WebSocket write error:", err)
			return
		}
	}
}

func main() {
	config, err := config.NewConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	server, err := NewServer(config)
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	http.Handle("/", server)
	log.Printf("Starting server on :%s\n", config.HTTPPort)
	if err := http.ListenAndServe(":"+config.HTTPPort, nil); err != nil {
		log.Fatalf("ListenAndServe error: %v", err)
	}
	
}
