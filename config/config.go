package config

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	KafkaBrokers     string
	KafkaTopic       string
	KafkaGroupID     string
	KafkaOffset      string
	HTTPPort         string
	HTTPReadTimeout  int
	HTTPWriteTimeout int
	HTTPIdleTimeout  int
	ZookeeperNodes   string
	CreateTestTopic  bool
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
	viper.SetDefault("CREATE_TEST_TOPIC", false)

	viper.AutomaticEnv()

	return &Config{
		KafkaBrokers:     viper.GetString("KAFKA_BROKERS"),
		KafkaTopic:       viper.GetString("KAFKA_TOPIC"),
		KafkaGroupID:     viper.GetString("KAFKA_GROUP_ID"),
		KafkaOffset:      viper.GetString("KAFKA_OFFSET"),
		HTTPPort:         viper.GetString("HTTP_PORT"),
		HTTPReadTimeout:  viper.GetInt("HTTP_READ_TIMEOUT"),
		HTTPWriteTimeout: viper.GetInt("HTTP_WRITE_TIMEOUT"),
		HTTPIdleTimeout:  viper.GetInt("HTTP_IDLE_TIMEOUT"),
		ZookeeperNodes:   viper.GetString("ZOOKEEPER_NODES"),
		CreateTestTopic:  viper.GetBool("CREATE_TEST_TOPIC"),
	}, nil
}
