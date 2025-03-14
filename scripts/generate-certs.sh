#!/bin/bash

# Create directories
mkdir -p ../certs
cd ../certs

# Generate CA key and certificate
openssl req -new -x509 -keyout ca.key -out ca.crt -days 365 -subj "/CN=kafka-ca" -nodes

# Generate server keystore
keytool -genkey -keystore kafka.keystore.jks -validity 365 -storepass kafkadashboard \
  -keypass kafkadashboard -dname "CN=kafka" -storetype pkcs12

# Generate server certificate signing request
keytool -certreq -keystore kafka.keystore.jks -file server.csr -storepass kafkadashboard \
  -keypass kafkadashboard

# Sign server certificate with CA
openssl x509 -req -CA ca.crt -CAkey ca.key -in server.csr -out server.crt \
  -days 365 -CAcreateserial

# Import CA and signed certificate into server keystore
keytool -importcert -keystore kafka.keystore.jks -alias CARoot -file ca.crt \
  -storepass kafkadashboard -noprompt
keytool -importcert -keystore kafka.keystore.jks -alias localhost -file server.crt \
  -storepass kafkadashboard -noprompt

# Create truststore and import CA certificate
keytool -importcert -keystore kafka.truststore.jks -alias CARoot -file ca.crt \
  -storepass kafkadashboard -noprompt -storetype pkcs12

# Generate client key and certificate
openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 \
  -subj "/CN=kafka-client" \
  -keyout kafka.key -out kafka.crt

echo "SSL certificates generated successfully in the certs directory"
echo "You can now use these certificates for local development with SSL enabled"