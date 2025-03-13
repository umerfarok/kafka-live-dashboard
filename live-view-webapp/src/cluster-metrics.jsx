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
    Grid,
    Stack
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
        <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mt: 2, mb: 2 }}>
                Kafka Metrics
            </Typography>
            
            {/* Summary Cards - Now more compact */}
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ mb: 3 }}>
                <Card sx={{ flex: 1, borderRadius: 1 }} variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body2" color="textSecondary">Topics</Typography>
                        <Typography variant="h5">{totalTopics}</Typography>
                    </CardContent>
                </Card>
                
                <Card sx={{ flex: 1, borderRadius: 1 }} variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body2" color="textSecondary">Partitions</Typography>
                        <Typography variant="h5">{totalPartitions}</Typography>
                    </CardContent>
                </Card>
                
                <Card sx={{ flex: 1, borderRadius: 1 }} variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body2" color="textSecondary">Brokers</Typography>
                        <Typography variant="h5">{totalBrokers}</Typography>
                    </CardContent>
                </Card>
                
                <Card sx={{ flex: 1, borderRadius: 1 }} variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body2" color="textSecondary">Total Messages</Typography>
                        <Typography variant="h5">{totalMessages.toLocaleString()}</Typography>
                    </CardContent>
                </Card>
            </Stack>
            
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                            <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Topic</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Partition</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Newest Offset</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Oldest Offset</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Messages</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Leader</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Replicas</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', py: 1 }}>In-Sync</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(data.topics).map(([topic, partitions]) =>
                            Object.entries(partitions).map(([partition, details], index) => {
                                const messageCount = details.offsetNewest - details.offsetOldest;
                                return (
                                    <TableRow key={`${topic}-${partition}`} 
                                        sx={{ 
                                            '&:nth-of-type(odd)': {
                                                backgroundColor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(255,255,255,0.03)' 
                                                    : 'rgba(0,0,0,0.01)',
                                            },
                                            '&:hover': {
                                                backgroundColor: theme.palette.mode === 'dark'
                                                    ? 'rgba(255,255,255,0.05)'
                                                    : 'rgba(0,0,0,0.03)',
                                            }
                                        }}
                                    >
                                        {index === 0 && (
                                            <TableCell 
                                                rowSpan={Object.keys(partitions).length} 
                                                sx={{ 
                                                    fontWeight: 'bold', 
                                                    color: theme.palette.primary.main,
                                                    py: 1,
                                                    verticalAlign: 'top'
                                                }}
                                            >
                                                {topic}
                                            </TableCell>
                                        )}
                                        <TableCell sx={{ py: 1 }}>{partition}</TableCell>
                                        <TableCell sx={{ py: 1 }}>{details.offsetNewest.toLocaleString()}</TableCell>
                                        <TableCell sx={{ py: 1 }}>{details.offsetOldest.toLocaleString()}</TableCell>
                                        <TableCell sx={{ py: 1 }}>{messageCount.toLocaleString()}</TableCell>
                                        <TableCell sx={{ py: 1 }}>{details.leader}</TableCell>
                                        <TableCell sx={{ py: 1 }}>{details.replicas.join(', ')}</TableCell>
                                        <TableCell sx={{ py: 1 }}>{details.isr.join(', ')}</TableCell>
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
