package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
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

func createAdminClient(config *config.Config) (sarama.ClusterAdmin, error) {
	kafkaConfig := sarama.NewConfig()
	kafkaConfig.Version = sarama.V2_6_0_0

	switch config.SecurityProtocol {
	case "PLAINTEXT":
		// Default configuration is fine for plaintext

	case "SSL":
		kafkaConfig.Net.TLS.Enable = true
		tlsConfig := &tls.Config{
			MinVersion:         tls.VersionTLS12,
			InsecureSkipVerify: !config.SSLVerifyCerts,
		}

		if config.SSLVerifyCerts && config.SSLCALocation != "" {
			caCert, err := os.ReadFile(config.SSLCALocation)
			if err != nil {
				return nil, fmt.Errorf("failed to read CA certificate: %v", err)
			}
			caCertPool := x509.NewCertPool()
			caCertPool.AppendCertsFromPEM(caCert)
			tlsConfig.RootCAs = caCertPool
		}

		if config.SSLCertLocation != "" && config.SSLKeyLocation != "" {
			cert, err := tls.LoadX509KeyPair(config.SSLCertLocation, config.SSLKeyLocation)
			if err != nil {
				return nil, fmt.Errorf("failed to load client certificate/key: %v", err)
			}
			tlsConfig.Certificates = []tls.Certificate{cert}
		}

		kafkaConfig.Net.TLS.Config = tlsConfig

	case "SASL_PLAINTEXT":
		kafkaConfig.Net.SASL.Enable = true
		kafkaConfig.Net.SASL.User = config.KafkaUsername
		kafkaConfig.Net.SASL.Password = config.KafkaPassword
		kafkaConfig.Net.SASL.Handshake = true

		switch config.SASLMechanism {
		case "PLAIN":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypePlaintext
		case "SCRAM-SHA-256":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypeSCRAMSHA256
		case "SCRAM-SHA-512":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypeSCRAMSHA512
		default:
			return nil, fmt.Errorf("unsupported SASL mechanism: %s", config.SASLMechanism)
		}

	case "SASL_SSL":
		kafkaConfig.Net.TLS.Enable = true
		kafkaConfig.Net.SASL.Enable = true
		kafkaConfig.Net.SASL.User = config.KafkaUsername
		kafkaConfig.Net.SASL.Password = config.KafkaPassword
		kafkaConfig.Net.SASL.Handshake = true

		// Configure TLS
		tlsConfig := &tls.Config{
			MinVersion:         tls.VersionTLS12,
			InsecureSkipVerify: !config.SSLVerifyCerts,
		}

		if config.SSLVerifyCerts && config.SSLCALocation != "" {
			caCert, err := os.ReadFile(config.SSLCALocation)
			if err != nil {
				return nil, fmt.Errorf("failed to read CA certificate: %v", err)
			}
			caCertPool := x509.NewCertPool()
			caCertPool.AppendCertsFromPEM(caCert)
			tlsConfig.RootCAs = caCertPool
		}

		if config.SSLCertLocation != "" && config.SSLKeyLocation != "" {
			cert, err := tls.LoadX509KeyPair(config.SSLCertLocation, config.SSLKeyLocation)
			if err != nil {
				return nil, fmt.Errorf("failed to load client certificate/key: %v", err)
			}
			tlsConfig.Certificates = []tls.Certificate{cert}
		}

		kafkaConfig.Net.TLS.Config = tlsConfig

		// Configure SASL
		switch config.SASLMechanism {
		case "PLAIN":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypePlaintext
		case "SCRAM-SHA-256":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypeSCRAMSHA256
		case "SCRAM-SHA-512":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypeSCRAMSHA512
		default:
			return nil, fmt.Errorf("unsupported SASL mechanism: %s", config.SASLMechanism)
		}

	default:
		return nil, fmt.Errorf("unsupported security protocol: %s", config.SecurityProtocol)
	}

	return sarama.NewClusterAdmin(strings.Split(config.KafkaBrokers, ","), kafkaConfig)
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

func createProducer(config *config.Config) (sarama.SyncProducer, error) {
	kafkaConfig := sarama.NewConfig()
	kafkaConfig.Producer.RequiredAcks = sarama.WaitForAll
	kafkaConfig.Producer.Retry.Max = 5
	kafkaConfig.Producer.Return.Successes = true

	switch config.SecurityProtocol {
	case "PLAINTEXT":
		// Default configuration is fine for plaintext

	case "SSL":
		kafkaConfig.Net.TLS.Enable = true
		tlsConfig := &tls.Config{
			MinVersion:         tls.VersionTLS12,
			InsecureSkipVerify: !config.SSLVerifyCerts,
		}

		if config.SSLVerifyCerts && config.SSLCALocation != "" {
			caCert, err := os.ReadFile(config.SSLCALocation)
			if err != nil {
				return nil, fmt.Errorf("failed to read CA certificate: %v", err)
			}
			caCertPool := x509.NewCertPool()
			caCertPool.AppendCertsFromPEM(caCert)
			tlsConfig.RootCAs = caCertPool
		}

		if config.SSLCertLocation != "" && config.SSLKeyLocation != "" {
			cert, err := tls.LoadX509KeyPair(config.SSLCertLocation, config.SSLKeyLocation)
			if err != nil {
				return nil, fmt.Errorf("failed to load client certificate/key: %v", err)
			}
			tlsConfig.Certificates = []tls.Certificate{cert}
		}

		kafkaConfig.Net.TLS.Config = tlsConfig

	case "SASL_PLAINTEXT":
		kafkaConfig.Net.SASL.Enable = true
		kafkaConfig.Net.SASL.User = config.KafkaUsername
		kafkaConfig.Net.SASL.Password = config.KafkaPassword
		kafkaConfig.Net.SASL.Handshake = true

		switch config.SASLMechanism {
		case "PLAIN":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypePlaintext
		case "SCRAM-SHA-256":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypeSCRAMSHA256
		case "SCRAM-SHA-512":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypeSCRAMSHA512
		default:
			return nil, fmt.Errorf("unsupported SASL mechanism: %s", config.SASLMechanism)
		}

	case "SASL_SSL":
		kafkaConfig.Net.TLS.Enable = true
		kafkaConfig.Net.SASL.Enable = true
		kafkaConfig.Net.SASL.User = config.KafkaUsername
		kafkaConfig.Net.SASL.Password = config.KafkaPassword
		kafkaConfig.Net.SASL.Handshake = true

		// Configure TLS
		tlsConfig := &tls.Config{
			MinVersion:         tls.VersionTLS12,
			InsecureSkipVerify: !config.SSLVerifyCerts,
		}

		if config.SSLVerifyCerts && config.SSLCALocation != "" {
			caCert, err := os.ReadFile(config.SSLCALocation)
			if err != nil {
				return nil, fmt.Errorf("failed to read CA certificate: %v", err)
			}
			caCertPool := x509.NewCertPool()
			caCertPool.AppendCertsFromPEM(caCert)
			tlsConfig.RootCAs = caCertPool
		}

		if config.SSLCertLocation != "" && config.SSLKeyLocation != "" {
			cert, err := tls.LoadX509KeyPair(config.SSLCertLocation, config.SSLKeyLocation)
			if err != nil {
				return nil, fmt.Errorf("failed to load client certificate/key: %v", err)
			}
			tlsConfig.Certificates = []tls.Certificate{cert}
		}

		kafkaConfig.Net.TLS.Config = tlsConfig

		// Configure SASL
		switch config.SASLMechanism {
		case "PLAIN":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypePlaintext
		case "SCRAM-SHA-256":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypeSCRAMSHA256
		case "SCRAM-SHA-512":
			kafkaConfig.Net.SASL.Mechanism = sarama.SASLTypeSCRAMSHA512
		default:
			return nil, fmt.Errorf("unsupported SASL mechanism: %s", config.SASLMechanism)
		}

	default:
		return nil, fmt.Errorf("unsupported security protocol: %s", config.SecurityProtocol)
	}

	return sarama.NewSyncProducer(strings.Split(config.KafkaBrokers, ","), kafkaConfig)
}

func CreateTestTopicIfRequired(config *config.Config) error {
	if !config.CreateTestTopic {
		log.Println("Test topic creation is disabled")
		return nil
	}

	// Create admin client with security configuration
	adminClient, err := createAdminClient(config)
	if err != nil {
		return fmt.Errorf("failed to create admin client: %w", err)
	}
	defer adminClient.Close()

	// Create topic if it doesn't exist
	err = createTopicIfNotExists(adminClient, config.KafkaTopic, 3, 1)
	if err != nil {
		return fmt.Errorf("failed to create test topic: %w", err)
	}

	// Create producer with security configuration
	producer, err := createProducer(config)
	if err != nil {
		return fmt.Errorf("failed to create producer: %w", err)
	}
	defer producer.Close()

	// Generate and send some initial messages
	return sendSampleMessages(producer, config.KafkaTopic, 50)
}

// SendSampleMessages sends sample messages to a topic
func SendSampleMessages(config *config.Config, messageCount int) error {
	producer, err := createProducer(config)
	if err != nil {
		return fmt.Errorf("failed to create producer: %w", err)
	}
	defer producer.Close()

	return sendSampleMessages(producer, config.KafkaTopic, messageCount)
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
