﻿# 🚀 Kafka Live Dashboard

A real-time Kafka dashboard that displays cluster status, topic metrics, and live topic messages.
https://youtu.be/_Vi4dphAoec?si=Vqyat3nY7TgHcEK_&t=9

## Table of Contents
- [🚀 Kafka Live Dashboard](#-kafka-live-dashboard)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [API Endpoints](#api-endpoints)
  - [WebSocket API](#websocket-api)
- [Some Useful Commands for Kafka CLI 🔧](#some-useful-commands-for-kafka-cli-)
- [List all topics](#list-all-topics)
- [Describe a topic](#describe-a-topic) 
- [Increase the number of partitions of a topic](#increase-the-number-of-partitions-of-a-topic)
- [Delete a topic](#delete-a-topic)
- [Produce messages with keys (useful when testing partitioning)](#produce-messages-with-keys-useful-when-testing-partitioning)
- [Consume messages with keys](#consume-messages-with-keys)
- [Consume messages from a specific partition](#consume-messages-from-a-specific-partition)
  - [Contributing 🤝](#contributing-)
  - [License 📄](#license-)

## Introduction
The **Kafka Live Dashboard** is a web-based application that provides a real-time view of your Kafka cluster. It allows you to monitor the status of your Kafka cluster, including the number of topics, partitions, brokers, and various metrics for each topic.

## Features
- 🔍 Displays the overall Kafka cluster status, including the number of topics, partitions, and brokers.
- 📊 Provides detailed metrics for each topic, such as the number of partitions, replication factor, active status, message count, lag, and throughput.
- 🔭 Offers a live view of the messages being produced to a selected topic.
- 🔄 Supports real-time updates of the cluster status and topic metrics through WebSocket connections.
- 🖥️ Provides a user-friendly interface for easy monitoring and troubleshooting of the Kafka cluster.

## Installation
To install and run the Kafka Live Dashboard, follow these steps:

1. Clone the repository:
2. Navigate to the project directory:
3. Run `docker compose up -d`
4. Use `make` commands to run the application

## Configuration
The application reads its configuration from environment variables or a `.env` file. You can customize the following settings:

| Environment Variable | Default Value | Description |
| --- | --- | --- |
| `KAFKA_BROKERS` | `localhost:9092` | The comma-separated list of Kafka broker addresses. |
| `KAFKA_TOPIC` | `test-topic` | The Kafka topic to be monitored. |
| `KAFKA_GROUP_ID` | `test-group` | The Kafka consumer group ID. |
| `KAFKA_OFFSET` | `latest` | The Kafka consumer offset type (`earliest`, `latest`, or a specific offset value). |
| `HTTP_PORT` | `5001` | The port on which the HTTP server will listen. |
| `HTTP_READ_TIMEOUT` | `10` | The HTTP server read timeout in seconds. |
| `HTTP_WRITE_TIMEOUT` | `10` | The HTTP server write timeout in seconds. |
| `HTTP_IDLE_TIMEOUT` | `10` | The HTTP server idle timeout in seconds. |
| `ZOOKEEPER_NODES` | `localhost:2181` | The comma-separated list of Zookeeper node addresses. |
| `CREATE_TEST_TOPIC` | `false` | Whether to create a test Kafka topic if it doesn't exist. |

2. Open your web browser and navigate to `http://localhost:5001`.

3. The dashboard will display the current Kafka cluster status and the list of topics.

4. Click on a topic to view its detailed metrics and live message feed.

## API Endpoints
The Kafka Live Dashboard exposes the following API endpoints:

| Endpoint | Description |
| --- | --- |
| `GET /` | Returns the current Kafka cluster status. |
| `GET /topics` | Returns the list of Kafka topics. |
| `GET /topics/{topic}` | Returns the metrics for the specified Kafka topic. |
| `GET /ws/topics/{topic}` | Establishes a WebSocket connection to stream live topic metrics. |
| `GET /ws` | Establishes a WebSocket connection to stream live topic messages. |

## WebSocket API
The Kafka Live Dashboard provides two WebSocket endpoints:

1. `/ws/topics/{topic}`: This endpoint streams the real-time metrics for the specified Kafka topic, including the number of partitions, replication factor, active status, message count, lag, and throughput.

2. `/ws`: This endpoint streams the live messages being produced to the Kafka topic specified in the query parameter `?topic=<topic_name>`.

# Some Useful Commands for Kafka CLI 🔧
# List all topics
`kafka-topics.sh --list --bootstrap-server localhost:9092`

# Describe a topic
`kafka-topics.sh --describe --topic test-topic --bootstrap-server localhost:9092`

# Increase the number of partitions of a topic
`kafka-topics.sh --alter --topic test-topic --partitions 3 --bootstrap-server localhost:9092`

# Delete a topic
`kafka-topics.sh --delete --topic test-topic --bootstrap-server localhost:9092`

# Produce messages with keys (useful when testing partitioning)
`kafka-console-producer.sh --topic test-topic --bootstrap-server localhost:9092 --property "parse.key=true" --property "key.separator=:"`

# Consume messages with keys
`kafka-console-consumer.sh --topic test-topic --bootstrap-server localhost:9092 --from-beginning --property "print.key=true"`

# Consume messages from a specific partition
`kafka-console-consumer.sh --topic test-topic --bootstrap-server localhost:9092 --from-beginning --partition 0`

## Contributing 🤝
We welcome contributions to the Kafka Live Dashboard project. If you find any issues or have ideas for new features, please feel free to open an issue or submit a pull request.

## License 📄
This project is licensed under the [MIT License](LICENSE).
