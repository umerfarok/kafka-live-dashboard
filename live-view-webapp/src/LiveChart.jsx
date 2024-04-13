import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js/auto';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const KafkaDashboard = () => {
    const [clusterStatus, setClusterStatus] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [websocket, setWebsocket] = useState(null);
    const [topicData, setTopicData] = useState([]);

    const [chartData, setChartData] = useState(null);
    const [topicLogs, setTopicLogs] = useState([]);
    const intervalRef = useRef(null);
    const logBoxRef = useRef(null);

    useEffect(() => {
        fetchClusterStatus();
        return () => {
            if (websocket) {
                websocket.close();
            }
            clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (selectedTopic) {
            intervalRef.current = setInterval(() => {
                fetchTopicMetrics(selectedTopic);
            }, 10000);
        } else {
            clearInterval(intervalRef.current);
        }
    }, [selectedTopic]);

    useEffect(() => {
        if (topicData.length > 0) {
            updateChartData();
        }
    }, [topicData]);

    const fetchClusterStatus = async () => {
        const response = await fetch('http://localhost:5001/');
        const data = await response.json();
        setClusterStatus(data);
    };
    const fetchTopicList = async () => {
        const response = await fetch('http://localhost:5001/topics');
        const data = await response.json();
        setClusterStatus((prevStatus) => ({
            ...prevStatus,
            Topics: data,
        }));
    };

    const fetchTopicMetrics = async (topic) => {
        const response = await fetch(`http://localhost:5001/topics/${topic}`);
        const data = await response.json();
        setTopicData([
            data.Partitions,
            data.Replication,
            data.Messages,
            data.Lag,
            data.Throughput,
        ]);
    };

    const connectWebSocket = (topic) => {
        const ws = new WebSocket(`ws://localhost:5001/ws?topic=${topic}`);
        ws.onopen = () => {
            console.log('WebSocket connection opened');
        };
        ws.onmessage = (event) => {
            console.log('WebSocket message:', event.data);
            setTopicLogs((prevLogs) => [...prevLogs, event.data]);
            scrollLogBox();
        };
        ws.onerror = (event) => {
            console.error('WebSocket error:', event);
        };
        ws.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            setSelectedTopic(null);
        };
        setWebsocket(ws);
        setSelectedTopic(topic);
    };

    const updateChartData = () => {
        setChartData({
            labels: ['Partitions', 'Replication', 'Messages', 'Lag', 'Throughput'],
            datasets: [
                {
                    label: `Topic: ${selectedTopic}`,
                    data: topicData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        });
    };

    const scrollLogBox = () => {
        if (logBoxRef.current) {
            logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
        }
    };

    if (!clusterStatus) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Kafka Dashboard</h1>
            <h2>Cluster Status</h2>
            <p>Total Topics: {clusterStatus.TotalTopics}</p>
            <p>Active Topics: {clusterStatus.ActiveTopics}</p>
            <p>Total Partitions: {clusterStatus.Partitions}</p>
            <p>Brokers: {clusterStatus.Brokers.length}</p>

            <h2>Topic List</h2>
            <button onClick={fetchTopicList}>Refresh Topic List</button>
            <br />
            <ul>
                {clusterStatus?.Topics.map((topic) => (
                    <li key={topic.Name}>
                        <a href="#" onClick={() => connectWebSocket(topic.Name)}>
                            {topic.Name}
                        </a>
                    </li>
                ))}
            </ul>

            {selectedTopic && (
                <div>
                    <h2>Topic: {selectedTopic}</h2>
                    <div style={{ width: '80%', height: '400px' }}>
                        {chartData && (
                            <Line
                                data={chartData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: `Topic Metrics - ${selectedTopic}`,
                                        },
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                        },
                                    },
                                }}
                            />
                        )}
                    </div>
                    <h2>Topic Logs</h2>
                    <div
                        style={{
                            height: '200px',
                            overflow: 'auto',
                            border: '1px solid #ccc',
                            padding: '10px',
                        }}
                        ref={logBoxRef}
                    >
                        {topicLogs.map((log, index) => (
                            <div key={index}>{log}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default KafkaDashboard;