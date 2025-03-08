package config

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	KafkaBrokers      string
	KafkaTopic        string
	KafkaGroupID      string  
	KafkaOffset       string
	HTTPPort          string
	HTTPReadTimeout   int
	HTTPWriteTimeout  int
	HTTPIdleTimeout   int
	ZookeeperNodes    string
	CreateTestTopic   bool
	AWSRegion         string
	AWSAccessKeyID    string
	AWSSecretAccessKey string
	KafkaUsername     string
	KafkaPassword     string
	UseSASL           bool
}

func NewConfig() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	viper.SetDefault("HTTP_READ_TIMEOUT", 10)
	viper.SetDefault("HTTP_WRITE_TIMEOUT", 10)
	viper.SetDefault("HTTP_IDLE_TIMEOUT", 10)
	viper.SetDefault("HTTP_PORT", "5001")
	viper.SetDefault("KAFKA_BROKERS", "localhost:9092")
	viper.SetDefault("KAFKA_TOPIC", "test-topic")
	viper.SetDefault("KAFKA_GROUP_ID", "test-group")
	viper.SetDefault("KAFKA_OFFSET", "latest")
	viper.SetDefault("ZOOKEEPER_NODES", "localhost:2181")
	viper.SetDefault("CREATE_TEST_TOPIC", true)
	viper.SetDefault("AWS_REGION", "")
	viper.SetDefault("AWS_ACCESS_KEY_ID", "")
	viper.SetDefault("AWS_SECRET_ACCESS_KEY", "")
	viper.SetDefault("KAFKA_USERNAME", "")
	viper.SetDefault("KAFKA_PASSWORD", "")
	viper.SetDefault("USE_SASL", false)

	viper.AutomaticEnv()

	return &Config{
		KafkaBrokers:      viper.GetString("KAFKA_BROKERS"),
		KafkaTopic:        viper.GetString("KAFKA_TOPIC"),
		KafkaGroupID:      viper.GetString("KAFKA_GROUP_ID"),
		KafkaOffset:       viper.GetString("KAFKA_OFFSET"),
		HTTPPort:          viper.GetString("HTTP_PORT"),
		HTTPReadTimeout:   viper.GetInt("HTTP_READ_TIMEOUT"),
		HTTPWriteTimeout:  viper.GetInt("HTTP_WRITE_TIMEOUT"),
		HTTPIdleTimeout:   viper.GetInt("HTTP_IDLE_TIMEOUT"),
		ZookeeperNodes:    viper.GetString("ZOOKEEPER_NODES"),
		CreateTestTopic:   viper.GetBool("CREATE_TEST_TOPIC"),
		AWSRegion:         viper.GetString("AWS_REGION"),
		AWSAccessKeyID:    viper.GetString("AWS_ACCESS_KEY_ID"),
		AWSSecretAccessKey: viper.GetString("AWS_SECRET_ACCESS_KEY"),
		KafkaUsername:     viper.GetString("KAFKA_USERNAME"),
		KafkaPassword:     viper.GetString("KAFKA_PASSWORD"),
		UseSASL:           viper.GetBool("USE_SASL"),
	}, nil
}