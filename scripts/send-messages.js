const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'message-producer',
    brokers: ['localhost:9092']
});

const producer = kafka.producer();

// Sample data generators
const generateRandomValue = () => Math.round(Math.random() * 100);
const generateMessageType = () => ['info', 'warning', 'error', 'debug'][Math.floor(Math.random() * 4)];
const generateSource = () => ['sensor-1', 'sensor-2', 'api-gateway', 'database', 'cache'][Math.floor(Math.random() * 5)];

// Function to generate a message
const generateMessage = () => ({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    value: generateRandomValue(),
    type: generateMessageType(),
    source: generateSource()
});

// Function to send messages
async function sendMessages(topic, count = 10, interval = 1000) {
    try {
        await producer.connect();
        console.log('Producer connected');

        let messagesSent = 0;
        const intervalId = setInterval(async () => {
            const message = generateMessage();
            
            try {
                await producer.send({
                    topic,
                    messages: [
                        { 
                            value: JSON.stringify(message),
                            key: `key-${messagesSent % 10}`
                        }
                    ],
                });
                
                console.log(`Message sent to topic ${topic}:`, message);
                messagesSent++;

                if (messagesSent >= count) {
                    clearInterval(intervalId);
                    await producer.disconnect();
                    console.log(`\nCompleted sending ${count} messages to ${topic}`);
                    process.exit(0);
                }
            } catch (err) {
                console.error('Error sending message:', err);
            }
        }, interval);

    } catch (err) {
        console.error('Error connecting producer:', err);
        process.exit(1);
    }
}

// Get command line arguments
const topic = process.argv[2] || 'my-topic';
const messageCount = parseInt(process.argv[3]) || 10;
const intervalMs = parseInt(process.argv[4]) || 1000;

console.log(`Starting to send ${messageCount} messages to topic '${topic}' with ${intervalMs}ms interval`);
sendMessages(topic, messageCount, intervalMs);
sendMessages("test-topic", messageCount, intervalMs);