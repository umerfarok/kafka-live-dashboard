import { useState, useEffect, useRef, useMemo } from 'react';
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
    alpha,
    Tooltip as MuiTooltip,
    Card,
    CardContent,
    CardHeader,
    Divider,
    LinearProgress,
    Chip,
    Stack,
    Badge,
} from '@mui/material';
import { Delete, Add, Edit, Refresh, DarkMode, LightMode, Speed, Message, Memory, Storage } from '@mui/icons-material';
import KafkaTopicTable from './KafkaTopicTable';
import { API_URL } from './config';
import { useColorMode } from './ThemeContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Utility function to generate random hex color based on string
const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
};

// Activity Heatmap Component for GitHub-like commit visualization
const MessageActivityHeatmap = ({ messages }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    
    // Create a map of the last 30 days' activity
    const activityData = useMemo(() => {
        // Initialize empty data for 30 days
        const days = 30;
        const data = Array(days).fill(0);
        
        // Fill with message count based on their timestamp
        messages.forEach(msg => {
            try {
                // Assume message format includes a timestamp in first 30 chars
                const msgText = typeof msg === 'string' ? msg : JSON.stringify(msg);
                // Extract timestamp from message (simplified)
                const dateMatch = msgText.match(/\d{4}-\d{2}-\d{2}/);
                if (dateMatch) {
                    const msgDate = new Date(dateMatch[0]);
                    const now = new Date();
                    const diffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));
                    if (diffDays >= 0 && diffDays < days) {
                        data[days - diffDays - 1]++;
                    }
                } else {
                    // If no date format, just count as today
                    data[days - 1]++;
                }
            } catch (e) {
                // If parsing fails, increment today's count
                data[days - 1]++;
            }
        });
        
        return data;
    }, [messages]);

    const getIntensityColor = (count, isDarkMode) => {
        // Define color scale based on activity intensity
        if (count === 0) return isDarkMode ? '#1e1e1e' : '#ebedf0';
        if (count < 3) return isDarkMode ? '#0e4429' : '#c6e48b';
        if (count < 6) return isDarkMode ? '#006d32' : '#7bc96f';
        if (count < 10) return isDarkMode ? '#26a641' : '#239a3b';
        return isDarkMode ? '#39d353' : '#196127';
    };

    return (
        <Card elevation={3} sx={{ mt: 2, backgroundColor: theme.palette.background.paper }}>
            <CardHeader 
                title="Message Activity" 
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ color: theme.palette.text.primary, pb: 0 }}
            />
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '3px' }}>
                    {activityData.map((count, idx) => (
                        <MuiTooltip 
                            key={idx} 
                            title={`${count} messages on day ${idx + 1}`}
                            arrow
                            placement="top"
                        >
                            <Box
                                sx={{
                                    width: `calc(100% / ${activityData.length})`,
                                    height: `${Math.min(100, Math.max(20, count * 7 + 20))}%`,
                                    backgroundColor: getIntensityColor(count, isDarkMode),
                                    borderRadius: '2px',
                                }}
                            />
                        </MuiTooltip>
                    ))}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                        Less
                    </Box>
                    {[0, 2, 5, 9, 15].map(level => (
                        <Box
                            key={level}
                            sx={{
                                width: '10px',
                                height: '10px',
                                backgroundColor: getIntensityColor(level, isDarkMode),
                                borderRadius: '2px',
                            }}
                        />
                    ))}
                    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                        More
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

// Message Visualization Component
const MessageVisualizer = ({ message, index }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    
    // Try to detect if the message is JSON
    const isJson = typeof message === 'string' && 
        ((message.startsWith('{') && message.endsWith('}')) || 
         (message.startsWith('[') && message.endsWith(']')));
         
    let parsedMessage = message;
    let messageType = 'text';
    
    try {
        if (isJson) {
            parsedMessage = JSON.parse(message);
            messageType = 'json';
        }
    } catch (e) {
        // If parsing fails, keep as string
    }

    return (
        <Box 
            sx={{ 
                p: 1, 
                borderLeft: '4px solid',
                borderColor: stringToColor(typeof message === 'string' ? message : JSON.stringify(message)),
                backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
                borderRadius: '0 4px 4px 0',
                mb: 1,
                maxWidth: '100%',
                overflowX: 'auto',
            }}
        >
            <Typography 
                variant="caption" 
                sx={{ 
                    display: 'block', 
                    mb: 0.5, 
                    color: isDarkMode ? '#aaa' : '#666' 
                }}
            >
                {new Date().toLocaleTimeString()} - Message #{index + 1}
            </Typography>
            
            {messageType === 'json' ? (
                <pre style={{ 
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: isDarkMode ? '#0f0' : '#000',
                }}>
                    {JSON.stringify(parsedMessage, null, 2)}
                </pre>
            ) : (
                <Typography 
                    variant="body2" 
                    sx={{ 
                        fontFamily: 'monospace',
                        color: isDarkMode ? '#0f0' : '#000'
                    }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );
};

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
    const [openDialog, setOpenDialog] = useState(false);
    const [newTopic, setNewTopic] = useState({ name: '', partitions: 1, replication: 1 });
    const intervalRef = useRef(null);
    const logBoxRef = useRef(null);
    const wsRef = useRef(null);
    const theme = useTheme();
    const { toggleColorMode, mode } = useColorMode();
    const isDarkMode = mode === 'dark';

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
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: 2
            }}>
                <Typography variant="h5">Loading Kafka Dashboard</Typography>
                <LinearProgress sx={{ width: '300px' }} />
            </Box>
        );
    }

    return (
        <Grid container item xs={12} sx={{ backgroundColor: theme.palette.background.default }}>
            <Container maxWidth={false} sx={{ maxWidth: '100%' }}>
                <Box my={6} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                        variant="h4" 
                        component="h1" 
                        gutterBottom 
                        sx={{ 
                            mt: 12, 
                            fontWeight: 'bold',
                            color: theme.palette.text.primary,
                        }}
                    >
                        KAFKA DASHBOARD
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isDarkMode}
                                onChange={toggleColorMode}
                                color="primary"
                            />
                        }
                        label={isDarkMode ? <DarkMode /> : <LightMode />}
                    />
                </Box>

                {/* Cluster Status Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{ backgroundColor: theme.palette.background.paper, height: '100%' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <Badge 
                                        badgeContent={clusterStatus.TotalTopics} 
                                        color="primary"
                                        sx={{ '& .MuiBadge-badge': { fontSize: '1.2rem', height: '1.8rem', minWidth: '1.8rem' } }}
                                    >
                                        <Storage fontSize="large" sx={{ color: theme.palette.primary.main }} />
                                    </Badge>
                                </Box>
                                <Typography variant="h5" sx={{ color: theme.palette.text.primary }}>
                                    Total Topics
                                </Typography>
                                <Chip 
                                    label={`${clusterStatus.ActiveTopics} active`} 
                                    color="success" 
                                    size="small" 
                                    sx={{ mt: 1 }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{ backgroundColor: theme.palette.background.paper, height: '100%' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <Badge 
                                        badgeContent={clusterStatus.Partitions} 
                                        color="secondary"
                                        sx={{ '& .MuiBadge-badge': { fontSize: '1.2rem', height: '1.8rem', minWidth: '1.8rem' } }}
                                    >
                                        <Memory fontSize="large" sx={{ color: theme.palette.secondary.main }} />
                                    </Badge>
                                </Box>
                                <Typography variant="h5" sx={{ color: theme.palette.text.primary }}>
                                    Total Partitions
                                </Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(100, (clusterStatus.Partitions / (clusterStatus.TotalTopics * 3)) * 100)} 
                                    sx={{ mt: 2, height: 8, borderRadius: 4 }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{ backgroundColor: theme.palette.background.paper, height: '100%' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <Badge 
                                        badgeContent={clusterStatus.Brokers.length} 
                                        color="warning"
                                        sx={{ '& .MuiBadge-badge': { fontSize: '1.2rem', height: '1.8rem', minWidth: '1.8rem' } }}
                                    >
                                        <Message fontSize="large" color="warning" />
                                    </Badge>
                                </Box>
                                <Typography variant="h5" sx={{ color: theme.palette.text.primary }}>
                                    Active Brokers
                                </Typography>
                                <Stack 
                                    direction="row" 
                                    spacing={1} 
                                    sx={{ mt: 1, justifyContent: 'center' }}
                                >
                                    {clusterStatus.Brokers.slice(0, 3).map(broker => (
                                        <Chip 
                                            key={broker.ID}
                                            label={`ID: ${broker.ID}`} 
                                            variant="outlined" 
                                            size="small" 
                                            color="warning"
                                        />
                                    ))}
                                    {clusterStatus.Brokers.length > 3 && (
                                        <Chip 
                                            label={`+${clusterStatus.Brokers.length - 3}`} 
                                            variant="outlined" 
                                            size="small"
                                        />
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={3} sx={{ backgroundColor: theme.palette.background.paper, height: '100%' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <Speed 
                                        fontSize="large" 
                                        color="info"
                                    />
                                </Box>
                                <Typography variant="h5" sx={{ color: theme.palette.text.primary }}>
                                    System Status
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Chip 
                                        label="Healthy" 
                                        color="success" 
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Topic Management Section */}
                <Card elevation={3} sx={{ mb: 4, backgroundColor: theme.palette.background.paper }}>
                    <CardHeader 
                        title={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h5" component="h2" sx={{ color: theme.palette.text.primary }}>
                                    Topic Management
                                </Typography>
                                <Box>
                                    <IconButton onClick={() => setOpenDialog(true)} color="primary">
                                        <Add />
                                    </IconButton>
                                    <IconButton onClick={fetchTopicList} color="primary">
                                        <Refresh />
                                    </IconButton>
                                </Box>
                            </Box>
                        }
                    />
                    <Divider />
                    <CardContent>
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
                                sx: { 
                                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'inherit',
                                    color: theme.palette.text.primary,
                                }
                            }}
                        />
                        <KafkaTopicTable 
                            onRowClick={connectWebSocket} 
                            topics={Object.values(clusterStatus?.Topics || {})} 
                            searchTerm={searchTerm} 
                            onDeleteTopic={handleDeleteTopic}
                        />
                    </CardContent>
                </Card>

                {/* Create Topic Dialog */}
                <Dialog 
                    open={openDialog} 
                    onClose={() => setOpenDialog(false)}
                    PaperProps={{
                        sx: {
                            backgroundColor: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                        }
                    }}
                >
                    <DialogTitle>Create New Topic</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Topic Name"
                            fullWidth
                            value={newTopic.name}
                            onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                            sx={{ 
                                mb: 2,
                                '& .MuiInputBase-root': {
                                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'inherit',
                                    color: theme.palette.text.primary,
                                },
                                '& .MuiInputLabel-root': {
                                    color: theme.palette.text.secondary,
                                }
                            }}
                        />
                        <TextField
                            margin="dense"
                            label="Partitions"
                            type="number"
                            fullWidth
                            value={newTopic.partitions}
                            onChange={(e) => setNewTopic({ ...newTopic, partitions: parseInt(e.target.value) })}
                            sx={{ 
                                mb: 2,
                                '& .MuiInputBase-root': {
                                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'inherit',
                                    color: theme.palette.text.primary,
                                },
                                '& .MuiInputLabel-root': {
                                    color: theme.palette.text.secondary,
                                }
                            }}
                        />
                        <TextField
                            margin="dense"
                            label="Replication Factor"
                            type="number"
                            fullWidth
                            value={newTopic.replication}
                            onChange={(e) => setNewTopic({ ...newTopic, replication: parseInt(e.target.value) })}
                            sx={{ 
                                '& .MuiInputBase-root': {
                                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'inherit',
                                    color: theme.palette.text.primary,
                                },
                                '& .MuiInputLabel-root': {
                                    color: theme.palette.text.secondary,
                                }
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)} sx={{ color: theme.palette.text.secondary }}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleCreateTopic} 
                            variant="contained" 
                            color="primary"
                        >
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Topic Details and Charts */}
                {selectedTopic && (
                    <Card elevation={3} sx={{ width: '100%', mb: 4, backgroundColor: theme.palette.background.paper }}>
                        <CardHeader 
                            title={
                                <Typography variant="h5" component="h2" sx={{ color: theme.palette.text.primary }}>
                                    Topic: {selectedTopic}
                                </Typography>
                            }
                        />
                        <Divider />
                        <CardContent>
                            <Grid container spacing={4}>
                                {/* Metrics Chart */}
                                <Grid item xs={12} md={7}>
                                    <Box sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {chartData ? (
                                            <Line
                                                data={chartData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        title: {
                                                            display: true,
                                                            text: `Topic Metrics - ${selectedTopic}`,
                                                            color: theme.palette.text.primary
                                                        },
                                                        legend: {
                                                            labels: {
                                                                color: theme.palette.text.primary
                                                            }
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            ticks: {
                                                                color: theme.palette.text.secondary
                                                            },
                                                            grid: {
                                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                                            }
                                                        },
                                                        x: {
                                                            ticks: {
                                                                color: theme.palette.text.secondary
                                                            },
                                                            grid: {
                                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <LinearProgress sx={{ width: '80%' }} />
                                        )}
                                    </Box>
                                </Grid>
                                
                                {/* Message Activity Chart (GitHub-like) */}
                                <Grid item xs={12} md={5}>
                                    <MessageActivityHeatmap messages={topicLogs} />
                                    
                                    {/* Topic Statistics */}
                                    <Card elevation={2} sx={{ mt: 3, backgroundColor: theme.palette.background.card }}>
                                        <CardContent>
                                            <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary }}>
                                                Topic Statistics
                                            </Typography>
                                            
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                        Messages Received:
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                                                        {topicLogs.length}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                        Last Message:
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                                                        {topicLogs.length > 0 ? new Date().toLocaleTimeString() : '-'}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                        Avg Message Size:
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                                                        {topicLogs.length > 0 
                                                            ? `${Math.round(topicLogs.reduce((acc, msg) => acc + (typeof msg === 'string' ? msg.length : JSON.stringify(msg).length), 0) / topicLogs.length)} bytes` 
                                                            : '0 bytes'}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                        Messages/sec:
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                                                        {(topicData[4] || 0).toFixed(2)}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Live Messages */}
                            <Box mt={4}>
                                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                                    Live Messages
                                </Typography>
                                <Paper
                                    sx={{
                                        height: '350px',
                                        overflow: 'auto',
                                        border: isDarkMode ? '1px solid #333' : '1px solid #eee',
                                        p: 2,
                                        backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                                    }}
                                    ref={logBoxRef}
                                >
                                    {topicLogs.length > 0 ? (
                                        topicLogs.map((log, index) => (
                                            <MessageVisualizer 
                                                key={index} 
                                                message={log} 
                                                index={index}
                                            />
                                        ))
                                    ) : (
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'center', 
                                            alignItems: 'center',
                                            height: '100%',
                                            color: theme.palette.text.secondary,
                                            flexDirection: 'column',
                                            gap: 2
                                        }}>
                                            <Message sx={{ fontSize: '3rem', opacity: 0.5 }} />
                                            <Typography>Waiting for messages...</Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Box>
                        </CardContent>
                    </Card>
                )}
                
                {/* Error Snackbar */}
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