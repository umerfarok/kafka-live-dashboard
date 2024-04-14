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
    TextField,
    Grid,
    Snackbar,
    Alert,
} from '@mui/material';
import KafkaTopicTable from './KafkaTopicTable';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const KafkaDashboard = () => {
    const [clusterStatus, setClusterStatus] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [websocket, setWebsocket] = useState(null);
    const [topicData, setTopicData] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [topicLogs, setTopicLogs] = useState([]);
    const [error, setError] = useState(null);
    const [showError, setShowError] = useState(false);
    const intervalRef = useRef(null);
    const logBoxRef = useRef(null);
    const wsRef = useRef(null);

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
            wsRef.current = new WebSocket(`ws://localhost:5001/ws/topics/${selectedTopic}`);

            wsRef.current.onmessage = (event) => {
                console.log('WebSocket message:', event.data);
                const data = JSON.parse(event.data);
                setTopicData([
                    data.Partitions,
                    data.Replication,
                    data.Messages,
                    data.Lag,
                    data.Throughput,
                ]);
            };

            wsRef.current.onerror = (error) => {
                console.log(`WebSocket error: ${error}`);
                setError(`WebSocket error: ${error}`);
                setShowError(true);
            };
            wsRef.current.onopen = () => {
                console.log('WebSocket connection opened');
            };
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [selectedTopic]);

    useEffect(() => {
        if (topicData.length > 0) {
            updateChartData();
        }
    }, [topicData]);

    const fetchClusterStatus = async () => {
        try {
            const response = await fetch('http://localhost:5001/');
            const data = await response.json();
            setClusterStatus(data);
        } catch (error) {
            console.error('Error fetching cluster status:', error);
            setError(`Error fetching cluster status: ${error.message}`);
            setShowError(true);
        }
    };

    const fetchTopicList = async () => {
        try {
            const response = await fetch('http://localhost:5001/topics');
            const data = await response.json();
            setClusterStatus((prevStatus) => ({
                ...prevStatus,
                Topics: data,
            }));
        } catch (error) {
            console.error('Error fetching topic list:', error);
            setError(`Error fetching topic list: ${error.message}`);
            setShowError(true);
        }
    };

    const connectWebSocket = (topic) => {
        try {
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
                setError(`WebSocket error: ${event}`);
                setShowError(true);
            };
            ws.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                setSelectedTopic(null);
            };
            setWebsocket(ws);
            setSelectedTopic(topic);
        } catch (error) {
            console.error('Error connecting to WebSocket:', error);
            setError(`Error connecting to WebSocket: ${error.message}`);
            setShowError(true);
        }
    };

    const updateChartData = () => {
        setChartData({
            labels: ['Partitions', 'Replication', 'Messages', 'Lag'],
            datasets: [
                {
                    label: `Topic: ${selectedTopic}`,
                    data: topicData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                },
            ],
        });
    
        setTimeout(() => {
            setChartData((prevData) => ({
                ...prevData,
                datasets: prevData.datasets.map((dataset) => ({
                    ...dataset,
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                })),
            }));
        }, 500);
    
        setTimeout(() => {
            setChartData((prevData) => ({
                ...prevData,
                datasets: prevData.datasets.map((dataset) => ({
                    ...dataset,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                })),
            }));
        }, 1000);
    };

    const scrollLogBox = () => {
        if (logBoxRef.current) {
            logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
        }
    };

    const handleCloseError = () => {
        setShowError(false);
    };

    if (!clusterStatus) {
        return <div>Loading...</div>;
    }

    return (
        <Grid container item xs={12}>
            <Container maxWidth={false} sx={{ maxWidth: '100%' }}>
                <Box my={6}>
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

                <Box my={8}>
                    <Typography variant="h4" component="h2" gutterBottom>
                        Topic List
                    </Typography>
                    <Button variant="contained" onClick={fetchTopicList}>
                        Refresh Topic List
                    </Button>
                    <TextField
                        label="Search Topics"
                        variant="outlined"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        fullWidth
                        style={{ marginBottom: '16px' }}
                    />
                    <KafkaTopicTable onRowClick={connectWebSocket} topics={Object.values(clusterStatus?.Topics || {})} searchTerm={searchTerm} connectWebSocket={connectWebSocket} />
                </Box>

                {selectedTopic && (
                    <Box my={8}>
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
                        <Typography variant="h5" component="h2" gutterBottom>
                            <Typography variant="h6" component="h4" gutterBottom>
                                Topic Live Messages
                            </Typography>
                        </Typography>
                        <Box my={8} sx={{ maxWidth: '100%' }}>
                            <Paper
                                sx={{
                                    height: '200px',
                                    overflow: 'auto',
                                    border: '1px solid #ccc',
                                    padding: '10px',
                                    backgroundColor: '#000',
                                    color: '#0f0',
                                }}
                                ref={logBoxRef}
                            >
                                {topicLogs.map((log, index) => (
                                    <Typography key={index} variant="body1" align="left">
                                        {new Date().toLocaleTimeString()} - {log}
                                    </Typography>
                                ))}
                            </Paper>
                        </Box>
                    </Box>
                )}
                <Snackbar open={showError} autoHideDuration={6000} onClose={handleCloseError}>
                    <Alert onClose={handleCloseError} severity="error">
                        {error}
                    </Alert>
                </Snackbar>
            </Container>
        </Grid>
    );
};

export default KafkaDashboard;