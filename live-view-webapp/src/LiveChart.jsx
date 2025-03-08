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
    IconButton,
    useTheme,
    Switch,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { Delete, Add, Edit, Refresh, DarkMode, LightMode } from '@mui/icons-material';
import KafkaTopicTable from './KafkaTopicTable';
import { API_URL } from './config';

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
    const [darkMode, setDarkMode] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [newTopic, setNewTopic] = useState({ name: '', partitions: 1, replication: 1 });
    const intervalRef = useRef(null);
    const logBoxRef = useRef(null);
    const wsRef = useRef(null);
    const theme = useTheme();

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
            wsRef.current = new WebSocket(`${API_URL.replace('http', 'ws')}/ws/topics/${selectedTopic}`);

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
            const response = await fetch(`${API_URL}/`);
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
            const response = await fetch(`${API_URL}/topics`);
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
            const ws = new WebSocket(`${API_URL.replace('http', 'ws')}/ws?topic=${topic}`);
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

    const handleCreateTopic = async () => {
        try {
            const response = await fetch(`${API_URL}/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTopic),
            });
            if (!response.ok) throw new Error('Failed to create topic');
            fetchTopicList();
            setOpenDialog(false);
        } catch (error) {
            setError(error.message);
            setShowError(true);
        }
    };

    const handleDeleteTopic = async (topicName) => {
        try {
            const response = await fetch(`${API_URL}/topics/${topicName}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete topic');
            fetchTopicList();
        } catch (error) {
            setError(error.message);
            setShowError(true);
        }
    };

    if (!clusterStatus) {
        return <div>Loading...</div>;
    }

    return (
        <Grid container item xs={12}>
            <Container maxWidth={false} sx={{ maxWidth: '100%' }}>
                <Box my={6} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 12 }}>
                        KAFKA DASHBOARD
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={darkMode}
                                onChange={(e) => setDarkMode(e.target.checked)}
                                color="primary"
                            />
                        }
                        label={darkMode ? <DarkMode /> : <LightMode />}
                    />
                </Box>

                <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: darkMode ? '#1e1e1e' : '#fff' }}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Total Topics</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Active Topics</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Total Partitions</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Brokers</TableCell>
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
                </Paper>

                <Box my={8}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <Typography variant="h4" component="h2">
                            Topic Management
                        </Typography>
                        <div>
                            <IconButton onClick={() => setOpenDialog(true)} color="primary">
                                <Add />
                            </IconButton>
                            <IconButton onClick={fetchTopicList} color="primary">
                                <Refresh />
                            </IconButton>
                        </div>
                    </div>
                    
                    <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                        <DialogTitle>Create New Topic</DialogTitle>
                        <DialogContent>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Topic Name"
                                fullWidth
                                value={newTopic.name}
                                onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                            />
                            <TextField
                                margin="dense"
                                label="Partitions"
                                type="number"
                                fullWidth
                                value={newTopic.partitions}
                                onChange={(e) => setNewTopic({ ...newTopic, partitions: parseInt(e.target.value) })}
                            />
                            <TextField
                                margin="dense"
                                label="Replication Factor"
                                type="number"
                                fullWidth
                                value={newTopic.replication}
                                onChange={(e) => setNewTopic({ ...newTopic, replication: parseInt(e.target.value) })}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                            <Button onClick={handleCreateTopic} variant="contained">Create</Button>
                        </DialogActions>
                    </Dialog>

                    <TextField
                        label="Search Topics"
                        variant="outlined"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: searchTerm && (
                                <IconButton onClick={() => setSearchTerm('')} size="small">
                                    <Delete />
                                </IconButton>
                            ),
                        }}
                    />
                    <KafkaTopicTable onRowClick={connectWebSocket} topics={Object.values(clusterStatus?.Topics || {})} searchTerm={searchTerm} connectWebSocket={connectWebSocket} onDeleteTopic={handleDeleteTopic} darkMode={darkMode} />
                </Box>

                {selectedTopic && (
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }} 
                    >
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
                            <Typography variant="h6" gutterBottom>
                                Live Messages
                            </Typography>
                            <Paper
                                sx={{
                                    height: '300px',
                                    overflow: 'auto',
                                    border: '1px solid #ccc',
                                    padding: '10px',
                                    backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                                    color: darkMode ? '#0f0' : '#000',
                                }}
                                ref={logBoxRef}
                            >
                                {topicLogs.map((log, index) => (
                                    <Typography key={index} variant="body1" align="left" sx={{ fontFamily: 'monospace' }}>
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