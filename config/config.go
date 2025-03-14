package config

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	// Basic Kafka Configuration
	KafkaBrokers    string
	KafkaTopic      string
	KafkaGroupID    string
	KafkaOffset     string
	ZookeeperNodes  string
	CreateTestTopic bool

	// HTTP Configuration
	HTTPPort         string
	HTTPReadTimeout  int
	HTTPWriteTimeout int
	HTTPIdleTimeout  int

	// AWS MSK Configuration
	AWSRegion          string
	AWSAccessKeyID     string
	AWSSecretAccessKey string

	// Security Configuration
	SecurityProtocol string // PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL

	// SSL Configuration
	UseSSL          bool
	SSLCALocation   string
	SSLCertLocation string
	SSLKeyLocation  string
	SSLKeyPassword  string
	SSLVerifyCerts  bool

	// SASL Configuration
	UseSASL       bool
	SASLMechanism string // PLAIN, SCRAM-SHA-256, SCRAM-SHA-512
	KafkaUsername string
	KafkaPassword string
}

func NewConfig() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	setDefaults()

	viper.AutomaticEnv()

	// Determine security protocol based on configuration
	securityProtocol := "PLAINTEXT"
	if viper.GetBool("USE_SSL") && viper.GetBool("USE_SASL") {
		securityProtocol = "SASL_SSL"
	} else if viper.GetBool("USE_SSL") {
		securityProtocol = "SSL"
	} else if viper.GetBool("USE_SASL") {
		securityProtocol = "SASL_PLAINTEXT"
	}

	return &Config{
		// Basic Kafka Configuration
		KafkaBrokers:    viper.GetString("KAFKA_BROKERS"),
		KafkaTopic:      viper.GetString("KAFKA_TOPIC"),
		KafkaGroupID:    viper.GetString("KAFKA_GROUP_ID"),
		KafkaOffset:     viper.GetString("KAFKA_OFFSET"),
		ZookeeperNodes:  viper.GetString("ZOOKEEPER_NODES"),
		CreateTestTopic: viper.GetBool("CREATE_TEST_TOPIC"),

		// HTTP Configuration
		HTTPPort:         viper.GetString("HTTP_PORT"),
		HTTPReadTimeout:  viper.GetInt("HTTP_READ_TIMEOUT"),
		HTTPWriteTimeout: viper.GetInt("HTTP_WRITE_TIMEOUT"),
		HTTPIdleTimeout:  viper.GetInt("HTTP_IDLE_TIMEOUT"),

		// Security Protocol
		SecurityProtocol: securityProtocol,

		// SSL Configuration
		UseSSL:          viper.GetBool("USE_SSL"),
		SSLCALocation:   viper.GetString("SSL_CA_LOCATION"),
		SSLCertLocation: viper.GetString("SSL_CERT_LOCATION"),
		SSLKeyLocation:  viper.GetString("SSL_KEY_LOCATION"),
		SSLKeyPassword:  viper.GetString("SSL_KEY_PASSWORD"),
		SSLVerifyCerts:  viper.GetBool("SSL_VERIFY_CERTIFICATES"),

		// SASL Configuration
		UseSASL:       viper.GetBool("USE_SASL"),
		SASLMechanism: viper.GetString("SASL_MECHANISM"),
		KafkaUsername: viper.GetString("KAFKA_USERNAME"),
		KafkaPassword: viper.GetString("KAFKA_PASSWORD"),

		// AWS Configuration
		AWSRegion:          viper.GetString("AWS_REGION"),
		AWSAccessKeyID:     viper.GetString("AWS_ACCESS_KEY_ID"),
		AWSSecretAccessKey: viper.GetString("AWS_SECRET_ACCESS_KEY"),
	}, nil
}

func setDefaults() {
	// Basic Kafka Configuration
	viper.SetDefault("KAFKA_BROKERS", "localhost:9092")
	viper.SetDefault("KAFKA_TOPIC", "test-topic")
	viper.SetDefault("KAFKA_GROUP_ID", "kafka-dashboard-group")
	viper.SetDefault("KAFKA_OFFSET", "latest")
	viper.SetDefault("ZOOKEEPER_NODES", "localhost:2181")
	viper.SetDefault("CREATE_TEST_TOPIC", false)

	// HTTP Configuration
	viper.SetDefault("HTTP_PORT", "5001")
	viper.SetDefault("HTTP_READ_TIMEOUT", 10)
	viper.SetDefault("HTTP_WRITE_TIMEOUT", 10)
	viper.SetDefault("HTTP_IDLE_TIMEOUT", 10)

	// Security Configuration
	viper.SetDefault("USE_SSL", false)
	viper.SetDefault("USE_SASL", false)
	viper.SetDefault("SSL_VERIFY_CERTIFICATES", true)
	viper.SetDefault("SASL_MECHANISM", "PLAIN")

	// SSL Configuration
	viper.SetDefault("SSL_CA_LOCATION", "/app/certs/ca.crt")
	viper.SetDefault("SSL_CERT_LOCATION", "/app/certs/client.crt")
	viper.SetDefault("SSL_KEY_LOCATION", "/app/certs/client.key")
	viper.SetDefault("SSL_KEY_PASSWORD", "")

	// SASL Configuration
	viper.SetDefault("KAFKA_USERNAME", "")
	viper.SetDefault("KAFKA_PASSWORD", "")

	// AWS Configuration
	viper.SetDefault("AWS_REGION", "")
	viper.SetDefault("AWS_ACCESS_KEY_ID", "")
	viper.SetDefault("AWS_SECRET_ACCESS_KEY", "")
}
