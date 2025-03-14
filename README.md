# Kafka Live Dashboard

A real-time monitoring dashboard for Apache Kafka clusters, supporting multiple authentication methods (PLAINTEXT, SSL, SASL) and compatible with AWS MSK.

![Kafka Dashboard Screenshot]

## 🚀 Quick Start

```bash
# Pull the container
docker pull ghcr.io/umerfarok/kafka-live-dashboard:latest

# Create your environment file
cp example.env .env

# Start the dashboard
docker run -d \
  --name kafka-dashboard \
  -p 3000:3000 \
  -p 5001:5001 \
  --env-file .env \
  -v ./certs:/app/certs \
  ghcr.io/umerfarok/kafka-live-dashboard:latest
```

Visit http://localhost:3000 to access the dashboard.

## 🔒 Authentication Methods

### 1. PLAINTEXT (Default)
```env
SECURITY_PROTOCOL=PLAINTEXT
KAFKA_BROKERS=localhost:9092
```

### 2. SSL
```env
SECURITY_PROTOCOL=SSL
KAFKA_BROKERS=localhost:9093
USE_SSL=true
SSL_CA_LOCATION=/app/certs/ca.crt
SSL_CERT_LOCATION=/app/certs/client.crt
SSL_KEY_LOCATION=/app/certs/client.key
SSL_VERIFY_CERTIFICATES=true
```

### 3. SASL/PLAINTEXT
```env
SECURITY_PROTOCOL=SASL_PLAINTEXT
KAFKA_BROKERS=localhost:9094
USE_SASL=true
SASL_MECHANISM=PLAIN
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
```

### 4. SASL/SSL (AWS MSK)
```env
SECURITY_PROTOCOL=SASL_SSL
KAFKA_BROKERS=broker1.kafka.region.amazonaws.com:9096,broker2.kafka.region.amazonaws.com:9096
USE_SSL=true
USE_SASL=true
SASL_MECHANISM=SCRAM-SHA-512
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
SSL_CA_LOCATION=/app/certs/ca.crt
SSL_VERIFY_CERTIFICATES=true
AWS_REGION=your-region
```

## 📊 Features

- Real-time metrics visualization
- Topic management (create/delete topics)
- Consumer group monitoring
- Message lag tracking
- Partition distribution view
- Broker health monitoring
- Live message consumption
- Interactive metrics graphs
- Dark/Light theme support

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| KAFKA_BROKERS | Kafka broker list | localhost:9092 | Yes |
| KAFKA_TOPIC | Default topic | test-topic | No |
| SECURITY_PROTOCOL | PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL | PLAINTEXT | Yes |
| USE_SSL | Enable SSL | false | No |
| USE_SASL | Enable SASL | false | No |
| SASL_MECHANISM | PLAIN, SCRAM-SHA-256, SCRAM-SHA-512 | PLAIN | When USE_SASL=true |
| SSL_CA_LOCATION | Path to CA certificate | /app/certs/ca.crt | When USE_SSL=true |
| SSL_VERIFY_CERTIFICATES | Verify SSL certificates | true | No |
| CREATE_TEST_TOPIC | Create test topic on startup | false | No |

### Ports

- 3000: Frontend UI
- 5001: Backend API

### Volume Mounts

- `/app/certs`: SSL certificates directory
  ```bash
  -v ./certs:/app/certs
  ```

## 🌐 Common Deployments

### 1. Local Development
```bash
docker-compose -f docker-compose.dev.yaml up
```

### 2. AWS MSK
```bash
# 1. Download MSK certificates
aws kafka get-bootstrap-brokers --cluster-arn YOUR_CLUSTER_ARN
aws kafka get-cluster-certs --cluster-arn YOUR_CLUSTER_ARN

# 2. Save certificate to ./certs/ca.crt

# 3. Create .env file with MSK configuration
cp template.env .env
# Edit .env with your MSK details

# 4. Run the container
docker-compose -f docker-compose.prod.yaml up -d
```

### 3. Confluent Cloud
```env
SECURITY_PROTOCOL=SASL_SSL
USE_SSL=true
USE_SASL=true
SASL_MECHANISM=PLAIN
KAFKA_BROKERS=your-broker.confluent.cloud:9092
KAFKA_USERNAME=your-api-key
KAFKA_PASSWORD=your-api-secret
```

## 📝 Logs

View container logs:
```bash
docker logs -f kafka-dashboard
```

## 🔍 Health Check

The dashboard includes a health check endpoint:
```bash
curl http://localhost:5001/health
```

## 🚨 Troubleshooting

1. SSL Certificate Issues
```bash
# Verify certificates are mounted correctly
docker exec kafka-dashboard ls -la /app/certs

# Check certificate permissions
docker exec kafka-dashboard cat /app/certs/ca.crt
```

2. Connection Issues
```bash
# Test Kafka connectivity
docker exec kafka-dashboard kafkacat -b $KAFKA_BROKERS -L

# View detailed logs
docker logs kafka-dashboard
```

3. Common Problems
- Certificate path mismatch
- Wrong broker ports
- Missing SASL credentials
- Incorrect security protocol

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Sarama](https://github.com/Shopify/sarama) - The Kafka client library
- [React](https://reactjs.org/) - The UI framework
- [Material-UI](https://mui.com/) - The component library

## 🌟 Show your support

Give a ⭐️ if this project helped you!