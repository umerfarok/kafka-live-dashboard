import { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Box, 
    Stack,
    Card, 
    CardContent, 
    Typography, 
    useTheme,
    Chip,
    IconButton,
    Tooltip,
    AppBar,
    Toolbar,
} from '@mui/material';
import { 
    Refresh as RefreshIcon,
    Circle as CircleIcon,
    DragHandle as DragHandleIcon
} from '@mui/icons-material';
import KafkaGlobe from './KafkaGlobe';
import { API_URL } from './config';

// Resizable SidePanel component
const SidePanel = ({ children, side = 'left', initialWidth = 320 }) => {
    const theme = useTheme();
    const [width, setWidth] = useState(initialWidth);
    const isDragging = useRef(false);
    const sidebarRef = useRef(null);
    
    const handleMouseDown = (e) => {
        e.preventDefault();
        isDragging.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
    
    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        
        if (side === 'left') {
            const newWidth = Math.max(200, Math.min(600, e.clientX));
            setWidth(newWidth);
        } else {
            const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX));
            setWidth(newWidth);
        }
    };
    
    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <Box
            ref={sidebarRef}
            sx={{
                position: 'fixed',
                top: 128,
                [side]: 0,
                width: `${width}px`,
                height: 'calc(100vh - 128px)',
                overflowY: 'auto',
                background: theme.palette.mode === 'dark' 
                    ? 'rgba(0,0,0,0.7)' 
                    : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)',
                borderRight: side === 'left' ? 1 : 0,
                borderLeft: side === 'right' ? 1 : 0,
                borderColor: theme.palette.divider,
                p: 2,
                zIndex: 2,
                transition: 'width 0.1s',
                '&::-webkit-scrollbar': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.2)' 
                        : 'rgba(0,0,0,0.2)',
                    borderRadius: '3px',
                },
            }}
        >
            {children}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    [side === 'left' ? 'right' : 'left']: 0,
                    width: '5px',
                    height: '100%',
                    cursor: 'col-resize',
                    userSelect: 'none',
                    '&:hover': {
                        backgroundColor: theme.palette.primary.main,
                        opacity: 0.2,
                    },
                    '&:active': {
                        backgroundColor: theme.palette.primary.main,
                        opacity: 0.4,
                    }
                }}
                onMouseDown={handleMouseDown}
            />
            <IconButton
                sx={{
                    position: 'absolute',
                    top: '50%',
                    [side === 'left' ? 'right' : 'left']: '-12px',
                    transform: 'translateY(-50%)',
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                    },
                    padding: '4px',
                    width: '24px',
                    height: '50px',
                }}
                onMouseDown={handleMouseDown}
            >
                <DragHandleIcon fontSize="small" />
            </IconButton>
        </Box>
    );
};

const ActivityItem = ({ message }) => {
    const theme = useTheme();
    const data = typeof message === 'string' ? JSON.parse(message) : message;
    
    return (
        <Box sx={{ 
            mb: 1,
            p: 1,
            borderRadius: 1,
            backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.05)' 
                : 'rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: theme.palette.divider,
            '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.1)',
            }
        }}>
            <Typography 
                variant="body2" 
                component="pre" 
                sx={{ 
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    fontSize: '0.75rem'
                }}
            >
                {JSON.stringify(data, null, 2)}
            </Typography>
        </Box>
    );
};

// Smaller and more compact Stats Card Component
const StatsCard = ({ title, value, icon, color }) => {
    const theme = useTheme();
    return (
        <Card sx={{ 
            background: 'transparent',
            boxShadow: 'none',
            border: `1px solid ${theme.palette.divider}`,
            mb: 1,
            borderRadius: 1
        }}>
            <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    {icon}
                    <Typography variant="body2" fontWeight="medium">
                        {title}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ ml: 'auto', color }}>
                        {value}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
};

const HomePage = () => {
    const [messages, setMessages] = useState([]);
    const [clusterMetrics, setClusterMetrics] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [leftPanelWidth, setLeftPanelWidth] = useState(320);
    const [rightPanelWidth, setRightPanelWidth] = useState(320);
    const theme = useTheme();

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
        const timeSpan = (new Date() - lastRefresh) / 1000;
        return (messages.length / timeSpan).toFixed(1);
    }, [messages.length, lastRefresh]);

    return (
        <Box sx={{ 
            height: '100vh',
            backgroundColor: theme.palette.background.default,
            pt: 16 // Increased padding top to account for both app bars
        }}>
            {/* Main Globe Container */}
            <Box sx={{ 
                position: 'fixed',
                left: `${leftPanelWidth}px`,
                right: `${rightPanelWidth}px`,
                top: 128,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
            }}>
                <Box sx={{ 
                    width: '100%', 
                    height: '100%', 
                    maxWidth: '1000px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <KafkaGlobe 
                        messages={messages} 
                        topicsData={clusterMetrics?.Topics || {}}
                    />
                </Box>
            </Box>

            {/* Left Panel - Message Feed */}
            <SidePanel side="left" initialWidth={leftPanelWidth}>
                <Typography variant="h6" gutterBottom>
                    Live Messages
                </Typography>
                <Stack spacing={0.5}>
                    {messages.slice(-15).reverse().map((msg, idx) => (
                        <ActivityItem key={idx} message={msg} />
                    ))}
                </Stack>
            </SidePanel>

            {/* Right Panel - Metrics */}
            <SidePanel side="right" initialWidth={rightPanelWidth}>
                <Typography variant="h6" gutterBottom>
                    Kafka Metrics
                </Typography>
                {clusterMetrics && (
                    <Stack spacing={1}>
                        <StatsCard
                            title="Message Rate"
                            value={`${messageRate}/sec`}
                            icon={<CircleIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />}
                            color={theme.palette.success.main}
                        />
                        <StatsCard
                            title="Total Topics"
                            value={clusterMetrics.TotalTopics}
                            icon={<CircleIcon sx={{ color: theme.palette.primary.main, fontSize: 16 }} />}
                            color={theme.palette.primary.main}
                        />
                        <StatsCard
                            title="Active Topics"
                            value={clusterMetrics.ActiveTopics}
                            icon={<CircleIcon sx={{ color: theme.palette.warning.main, fontSize: 16 }} />}
                            color={theme.palette.warning.main}
                        />
                        <StatsCard
                            title="Total Partitions"
                            value={clusterMetrics.Partitions}
                            icon={<CircleIcon sx={{ color: theme.palette.info.main, fontSize: 16 }} />}
                            color={theme.palette.info.main}
                        />
                        <StatsCard
                            title="Brokers"
                            value={clusterMetrics.Brokers.length}
                            icon={<CircleIcon sx={{ color: theme.palette.secondary.main, fontSize: 16 }} />}
                            color={theme.palette.secondary.main}
                        />
                    </Stack>
                )}
            </SidePanel>

            {/* Top AppBar */}
            <AppBar 
                position="fixed" 
                color="transparent" 
                sx={{ 
                    backdropFilter: 'blur(10px)',
                    backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(0,0,0,0.7)' 
                        : 'rgba(255,255,255,0.7)',
                    borderBottom: 1,
                    borderColor: 'divider',
                    top: 64, // Position below the main app bar
                }}
            >
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Kafka Live Dashboard
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip 
                            label={`Messages: ${messages.length}`}
                            color="primary"
                            variant="outlined"
                            size="small"
                        />
                        <Tooltip title="Refresh Metrics">
                            <IconButton onClick={handleRefresh} color="primary" size="small">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default HomePage;