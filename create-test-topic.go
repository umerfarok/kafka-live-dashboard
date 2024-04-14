package main

import (
	"log"

	"github.com/IBM/sarama"
)

// this is implemented because we want to create a test topic if it is required to do so
// this is done by checking the config file and if the value is true then we create the test topic
// this is done by creating a new cluster admin from the kafka connection and then creating a topic with the name test-topic
func (s *Server) createTestTopicIfRequired() {

	createTestTopic := s.config.CreateTestTopic
	if !createTestTopic {
		return
	}

	admin, err := sarama.NewClusterAdminFromClient(s.kafkaConn)
	if err != nil {
		log.Println("Failed to create Kafka admin client:", err)
		return
	}
	topicDetail := &sarama.TopicDetail{
		NumPartitions:     1,
		ReplicationFactor: 1,
	}

	err = admin.CreateTopic("test-topic", topicDetail, false)
	if err != nil {
		log.Println("Failed to create test topic:", err)
		return
	}

	log.Println("Test topic created successfully %v", "test-topic")
}
