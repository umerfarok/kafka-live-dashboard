import { useState, useEffect, useMemo } from 'react';
import { 
    Box, 
    Container, 
    Typography, 
    Card, 
    CardContent, 
    Grid, 
    useTheme,
    LinearProgress,
    Stack,
    Chip,
    Tooltip,
    IconButton
} from '@mui/material';
import { 
    Speed as SpeedIcon,
    Timer as TimerIcon,
    Storage as StorageIcon,
    Topic as TopicIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import KafkaGlobe from './KafkaGlobe';
import { API_URL } from './config';

const MetricCard = ({ title, value, icon, subtitle, color, progress }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    return (
        <Card sx={{ 
            height: '100%',
            background: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-4px)'
            }
        }}>
            <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                    <Box sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        bgcolor: `${color}22`
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="h6" color="textSecondary">
                        {title}
                    </Typography>
                </Stack>
                
                <Typography variant="h3" sx={{ mb: 1, color: color }}>
                    {value.toLocaleString()}
                </Typography>
                
                {subtitle && (
                    <Typography variant="body2" color="textSecondary">
                        {subtitle}
                    </Typography>
                )}
                
                {progress !== undefined && (
                    <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ 
                            mt: 2, 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: color
                            }
                        }} 
                    />
                )}
            </CardContent>
        </Card>
    );
};

const HomePage = () => {
    const [messages, setMessages] = useState([]);
    const [clusterMetrics, setClusterMetrics] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const handleRefresh = async () => {
        try {
            const response = await fetch(`${API_URL}/`);
            const data = await response.json();
            setClusterMetrics(data);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    };

    useEffect(() => {
        // Connect to WebSocket for real-time messages
        const ws = new WebSocket(`${API_URL.replace('http', 'ws')}/ws?topic=my-topic`);
        
        ws.onopen = () => console.log('WebSocket connection established');
        ws.onerror = (error) => console.error('WebSocket error:', error);
        ws.onclose = () => console.log('WebSocket connection closed');
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setMessages(prev => [...prev, data]);
            } catch (error) {
                console.error('Error parsing message:', error);
                setMessages(prev => [...prev, event.data]);
            }
        };

        handleRefresh();
        const interval = setInterval(handleRefresh, 5000);

        return () => {
            ws.close();
            clearInterval(interval);
        };
    }, []);

    const messageRate = useMemo(() => {
        if (messages.length < 2) return 0;
        const timeSpan = (new Date() - lastRefresh) / 1000; // in seconds
        return (messages.length / timeSpan).toFixed(1);
    }, [messages.length, lastRefresh]);

    return (
        <Box sx={{ 
            position: 'relative', 
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            pb: 4
        }}>
            <KafkaGlobe messages={messages} />
            
            <Container sx={{ 
                position: 'relative', 
                zIndex: 1, 
                pt: 12
            }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Typography
                        variant="h3"
                        sx={{
                            color: isDarkMode ? '#fff' : '#000',
                            textShadow: isDarkMode 
                                ? '2px 2px 4px rgba(0,0,0,0.5)' 
                                : '2px 2px 4px rgba(255,255,255,0.5)',
                            fontWeight: 'bold'
                        }}
                    >
                        Kafka Dashboard
                    </Typography>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip 
                            label={`Last updated: ${lastRefresh.toLocaleTimeString()}`}
                            color="primary"
                            variant="outlined"
                        />
                        <Tooltip title="Refresh Data">
                            <IconButton onClick={handleRefresh} color="primary">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                <Grid container spacing={3}>
                    {clusterMetrics && (
                        <>
                            <Grid item xs={12} md={6} lg={3}>
                                <MetricCard
                                    title="Total Topics"
                                    value={clusterMetrics.TotalTopics}
                                    icon={<TopicIcon sx={{ color: theme.palette.success.main }} />}
                                    subtitle={`${clusterMetrics.ActiveTopics} active topics`}
                                    color={theme.palette.success.main}
                                    progress={(clusterMetrics.ActiveTopics / clusterMetrics.TotalTopics) * 100}
                                />
                            </Grid>

                            <Grid item xs={12} md={6} lg={3}>
                                <MetricCard
                                    title="Messages"
                                    value={messages.length}
                                    icon={<StorageIcon sx={{ color: theme.palette.primary.main }} />}
                                    subtitle={`${messageRate} messages/sec`}
                                    color={theme.palette.primary.main}
                                />
                            </Grid>

                            <Grid item xs={12} md={6} lg={3}>
                                <MetricCard
                                    title="Total Partitions"
                                    value={clusterMetrics.Partitions}
                                    icon={<SpeedIcon sx={{ color: theme.palette.warning.main }} />}
                                    subtitle={`Across ${clusterMetrics.TotalTopics} topics`}
                                    color={theme.palette.warning.main}
                                />
                            </Grid>

                            <Grid item xs={12} md={6} lg={3}>
                                <MetricCard
                                    title="Brokers"
                                    value={clusterMetrics.Brokers.length}
                                    icon={<TimerIcon sx={{ color: theme.palette.info.main }} />}
                                    subtitle="Active cluster nodes"
                                    color={theme.palette.info.main}
                                />
                            </Grid>
                        </>
                    )}
                </Grid>

                {/* Activity Summary */}
                <Card sx={{ 
                    mt: 4,
                    background: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Recent Activity
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Message Types
                                    </Typography>
                                    {['info', 'warning', 'error', 'debug'].map(type => {
                                        const count = messages.filter(m => {
                                            try {
                                                const parsed = typeof m === 'string' ? JSON.parse(m) : m;
                                                return parsed.type === type;
                                            } catch {
                                                return false;
                                            }
                                        }).length;
                                        return (
                                            <Chip
                                                key={type}
                                                label={`${type}: ${count}`}
                                                size="small"
                                                color={
                                                    type === 'error' ? 'error' :
                                                    type === 'warning' ? 'warning' :
                                                    type === 'info' ? 'info' : 'default'
                                                }
                                                variant="outlined"
                                            />
                                        );
                                    })}
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Top Sources
                                    </Typography>
                                    {['sensor-1', 'sensor-2', 'api-gateway', 'database', 'cache']
                                        .map(source => {
                                            const count = messages.filter(m => {
                                                try {
                                                    const parsed = typeof m === 'string' ? JSON.parse(m) : m;
                                                    return parsed.source === source;
                                                } catch {
                                                    return false;
                                                }
                                            }).length;
                                            return (
                                                <Chip
                                                    key={source}
                                                    label={`${source}: ${count}`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            );
                                        })}
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Environment Distribution
                                    </Typography>
                                    {['production', 'staging', 'development', 'test'].map(env => {
                                        const count = messages.filter(m => {
                                            try {
                                                const parsed = typeof m === 'string' ? JSON.parse(m) : m;
                                                return parsed.tags?.includes(env);
                                            } catch {
                                                return false;
                                            }
                                        }).length;
                                        return (
                                            <Chip
                                                key={env}
                                                label={`${env}: ${count}`}
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                            />
                                        );
                                    })}
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default HomePage;