#!/bin/bash

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '#' | sed 's/\r$//' | xargs)
fi

echo "Testing Kafka connectivity..."
echo "Security Protocol: $SECURITY_PROTOCOL"
echo "Broker(s): $KAFKA_BROKERS"

# Build kafkacat command based on security protocol
KAFKACAT_CMD="kafkacat -b $KAFKA_BROKERS -L"

if [ "$USE_SSL" = "true" ]; then
    echo "SSL is enabled"
    if [ -f "$SSL_CA_LOCATION" ]; then
        KAFKACAT_CMD="$KAFKACAT_CMD -X security.protocol=$SECURITY_PROTOCOL \
                     -X ssl.ca.location=$SSL_CA_LOCATION"
        
        if [ -f "$SSL_CERT_LOCATION" ] && [ -f "$SSL_KEY_LOCATION" ]; then
            KAFKACAT_CMD="$KAFKACAT_CMD \
                         -X ssl.certificate.location=$SSL_CERT_LOCATION \
                         -X ssl.key.location=$SSL_KEY_LOCATION"
        fi
    else
        echo "Error: SSL CA certificate not found at $SSL_CA_LOCATION"
        exit 1
    fi
fi

if [ "$USE_SASL" = "true" ]; then
    echo "SASL is enabled ($SASL_MECHANISM)"
    if [ -n "$KAFKA_USERNAME" ] && [ -n "$KAFKA_PASSWORD" ]; then
        KAFKACAT_CMD="$KAFKACAT_CMD \
                     -X security.protocol=$SECURITY_PROTOCOL \
                     -X sasl.mechanism=$SASL_MECHANISM \
                     -X sasl.username=$KAFKA_USERNAME \
                     -X sasl.password=$KAFKA_PASSWORD"
    else
        echo "Error: SASL credentials not provided"
        exit 1
    fi
fi

echo "Testing connection..."
if $KAFKACAT_CMD; then
    echo "✅ Connection successful!"
    echo "Dashboard should work with these settings."
else
    echo "❌ Connection failed!"
    echo "Please check your configuration and try again."
    exit 1
fi