package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"

	"github.com/IBM/sarama"
	"github.com/umerfarok/kafka-live-dashboard/config"
)

var (
	messageTypes = []string{"info", "warning", "error", "debug"}
	sources      = []string{"sensor-1", "sensor-2", "api-gateway", "database", "cache"}
)

type ExampleMessage struct {
	ID        int64     `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Value     float64   `json:"value"`
	Type      string    `json:"type"`
	Source    string    `json:"source"`
}

// CreateTestTopicIfRequired creates a test topic with sample data if specified in config
func CreateTestTopicIfRequired(config *config.Config) error {
	if !config.CreateTestTopic {
		log.Println("Test topic creation is disabled")
		return nil
	}

	// Create admin client
	adminClient, err := createAdminClient(config.KafkaBrokers)
	if err != nil {
		return fmt.Errorf("failed to create admin client: %w", err)
	}
	defer adminClient.Close()

	// Create topic if it doesn't exist
	err = createTopicIfNotExists(adminClient, config.KafkaTopic, 3, 1)
	if err != nil {
		return fmt.Errorf("failed to create test topic: %w", err)
	}

	// Create producer
	producer, err := createProducer(config.KafkaBrokers)
	if err != nil {
		return fmt.Errorf("failed to create producer: %w", err)
	}
	defer producer.Close()

	// Generate and send some initial messages
	return sendSampleMessages(producer, config.KafkaTopic, 50)
}

// SendSampleMessages sends sample messages to a topic
func SendSampleMessages(brokers string, topic string, messageCount int) error {
	producer, err := createProducer(brokers)
	if err != nil {
		return fmt.Errorf("failed to create producer: %w", err)
	}
	defer producer.Close()

	return sendSampleMessages(producer, topic, messageCount)
}

func sendSampleMessages(producer sarama.SyncProducer, topic string, messageCount int) error {
	log.Printf("Producing %d sample messages to topic %s", messageCount, topic)

	count := 0
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	for count < messageCount {
		message := ExampleMessage{
			ID:        time.Now().UnixNano(),
			Timestamp: time.Now(),
			Value:     r.Float64() * 100,
			Type:      messageTypes[r.Intn(len(messageTypes))],
			Source:    sources[r.Intn(len(sources))],
		}

		messageBytes, err := json.Marshal(message)
		if err != nil {
			log.Printf("Failed to marshal message: %v", err)
			continue
		}

		msg := &sarama.ProducerMessage{
			Topic: topic,
			Value: sarama.StringEncoder(messageBytes),
			Key:   sarama.StringEncoder(fmt.Sprintf("key-%d", count%10)),
		}

		partition, offset, err := producer.SendMessage(msg)
		if err != nil {
			log.Printf("Failed to send message: %v", err)
		} else {
			log.Printf("Message sent to partition %d at offset %d", partition, offset)
		}

		count++
		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("Finished producing %d messages", count)
	return nil
}

func createAdminClient(brokers string) (sarama.ClusterAdmin, error) {
	config := sarama.NewConfig()
	config.Version = sarama.V2_6_0_0

	return sarama.NewClusterAdmin(strings.Split(brokers, ","), config)
}

func createTopicIfNotExists(adminClient sarama.ClusterAdmin, topic string, partitions int, replication int) error {
	topics, err := adminClient.ListTopics()
	if err != nil {
		return fmt.Errorf("failed to list topics: %w", err)
	}

	if _, exists := topics[topic]; exists {
		log.Printf("Topic %s already exists", topic)
		return nil
	}

	log.Printf("Creating topic %s with %d partitions and replication factor %d", topic, partitions, replication)

	err = adminClient.CreateTopic(topic, &sarama.TopicDetail{
		NumPartitions:     int32(partitions),
		ReplicationFactor: int16(replication),
	}, false)

	if err != nil {
		return fmt.Errorf("failed to create topic: %w", err)
	}

	log.Printf("Topic %s created successfully", topic)
	return nil
}

func createProducer(brokers string) (sarama.SyncProducer, error) {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 5
	config.Producer.Return.Successes = true

	return sarama.NewSyncProducer(strings.Split(brokers, ","), config)
}
