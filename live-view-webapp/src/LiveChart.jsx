import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js/auto';
import {
    Container,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Box,
} from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


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
        <Container maxWidth="lg">
            <Box my={4}>
                <Typography variant="h3" component="h1" gutterBottom>
                    Kafka Dashboard
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Total Topics</TableCell>
                                <TableCell>Active Topics</TableCell>
                                <TableCell>Total Partitions</TableCell>
                                <TableCell>Brokers</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>{clusterStatus.TotalTopics}</TableCell>
                                <TableCell>{clusterStatus.ActiveTopics}</TableCell>
                                <TableCell>{clusterStatus.Partitions}</TableCell>
                                <TableCell>{clusterStatus.Brokers.length}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box my={4}>
                <Typography variant="h4" component="h2" gutterBottom>
                    Topic List
                </Typography>
                <Button variant="contained" onClick={fetchTopicList}>
                    Refresh Topic List
                </Button>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Topic Name</TableCell>
                                <TableCell>Partitions</TableCell>
                                <TableCell>Replication</TableCell>
                                <TableCell>Active</TableCell>
                                <TableCell>Messages</TableCell>
                                <TableCell>Lag</TableCell>
                                <TableCell>Throughput</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.values(clusterStatus.Topics).map((topic) => (
                                <TableRow
                                    key={topic.Name}
                                    onClick={() => connectWebSocket(topic.Name)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <TableCell>{topic.Name}</TableCell>
                                    <TableCell>{topic.Partitions}</TableCell>
                                    <TableCell>{topic.Replication}</TableCell>
                                    <TableCell>{topic.Active.toString()}</TableCell>
                                    <TableCell>{topic.Messages}</TableCell>
                                    <TableCell>{topic.Lag}</TableCell>
                                    <TableCell>{topic.Throughput.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {selectedTopic && (
                <Box my={4}>
                    <Typography variant="h4" component="h2" gutterBottom>
                        Topic: {selectedTopic}
                    </Typography>
                    <Box sx={{ width: '80%', height: '400px' }}>
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
                    </Box>
                    <Box my={4}>
                        <Typography variant="h4" component="h2" gutterBottom>
                            Topic Logs
                        </Typography>
                        <Box
                            sx={{
                                height: '200px',
                                overflow: 'auto',
                                border: '1px solid #ccc',
                                padding: '10px',
                            }}
                            ref={logBoxRef}
                        >
                            {topicLogs.map((log, index) => (
                                <Typography key={index} variant="body1">
                                    {log}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                </Box>
            )}
        </Container>
    );
};


export default KafkaDashboard;