import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Typography, 
    useTheme, 
    Container,
    Box,
    LinearProgress,
    Card, 
    CardContent,
    Grid
} from '@mui/material';
import { API_URL } from './config';

function KafkaMetrics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    useEffect(() => {
        const fetchData = () => {
            setLoading(true);
            axios.get(`${API_URL}/kafka_metrics`)
                .then(response => {
                    setData(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching data: ', error);
                    setError(error.message);
                    setLoading(false);
                });
        };

        fetchData();
        // Refresh every 10 seconds
        const interval = setInterval(fetchData, 10000);
        
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h5">Loading Kafka Metrics</Typography>
                <LinearProgress sx={{ width: '300px' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <Typography variant="h5" color="error">Error Loading Metrics</Typography>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    if (!data) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography variant="h5">No data available</Typography>
            </Box>
        );
    }

    // Calculate metrics summary
    const totalTopics = Object.keys(data.topics).length;
    const totalPartitions = Object.values(data.topics).reduce(
        (sum, partitions) => sum + Object.keys(partitions).length, 
        0
    );
    const totalBrokers = data.brokers.length;
    
    // Calculate total messages across all topics and partitions
    let totalMessages = 0;
    Object.values(data.topics).forEach(partitions => {
        Object.values(partitions).forEach(details => {
            totalMessages += (details.offsetNewest - details.offsetOldest);
        });
    });

    return (
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 3, mb: 3 }}>
                Kafka Metrics
            </Typography>
            
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Topics
                            </Typography>
                            <Typography variant="h4" component="div">
                                {totalTopics}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Partitions
                            </Typography>
                            <Typography variant="h4" component="div">
                                {totalPartitions}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Brokers
                            </Typography>
                            <Typography variant="h4" component="div">
                                {totalBrokers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Messages
                            </Typography>
                            <Typography variant="h4" component="div">
                                {totalMessages.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            
            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Topic</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Partition</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Newest Offset</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Oldest Offset</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Messages</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Leader</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Replicas</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>In-Sync Replicas</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(data.topics).map(([topic, partitions]) =>
                            Object.entries(partitions).map(([partition, details], index) => {
                                const messageCount = details.offsetNewest - details.offsetOldest;
                                return (
                                    <TableRow key={`${topic}-${partition}`}>
                                        {index === 0 && (
                                            <TableCell 
                                                rowSpan={Object.keys(partitions).length} 
                                                sx={{ 
                                                    fontWeight: 'bold', 
                                                    color: theme.palette.primary.main 
                                                }}
                                            >
                                                {topic}
                                            </TableCell>
                                        )}
                                        <TableCell>{partition}</TableCell>
                                        <TableCell>{details.offsetNewest.toLocaleString()}</TableCell>
                                        <TableCell>{details.offsetOldest.toLocaleString()}</TableCell>
                                        <TableCell>{messageCount.toLocaleString()}</TableCell>
                                        <TableCell>{details.leader}</TableCell>
                                        <TableCell>{details.replicas.join(', ')}</TableCell>
                                        <TableCell>{details.isr.join(', ')}</TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
}

export default KafkaMetrics;
