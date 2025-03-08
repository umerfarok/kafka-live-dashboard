import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Box,
    Collapse,
    IconButton,
    Chip,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { API_URL } from './config';

const ConsumerGroupRow = ({ group, details, darkMode }) => {
    const [open, setOpen] = useState(false);
    
    return (
        <>
            <TableRow 
                sx={{ 
                    '& > *': { borderBottom: 'unset' },
                    backgroundColor: darkMode ? '#1e1e1e' : 'inherit',
                    color: darkMode ? '#fff' : 'inherit',
                }}
            >
                <TableCell>
                    <IconButton
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">{group}</TableCell>
                <TableCell>
                    <Chip 
                        label={details.state} 
                        color={details.state === 'Stable' ? 'success' : 'warning'}
                        size="small"
                    />
                </TableCell>
                <TableCell>{Object.keys(details.members).length}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Members
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Client ID</TableCell>
                                        <TableCell>Host</TableCell>
                                        <TableCell>Topics</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(details.members).map(([clientId, member]) => (
                                        <TableRow key={clientId}>
                                            <TableCell component="th" scope="row">
                                                {clientId}
                                            </TableCell>
                                            <TableCell>{member.clientHost}</TableCell>
                                            <TableCell>
                                                {member.topics.map(topic => (
                                                    <Chip
                                                        key={topic}
                                                        label={topic}
                                                        size="small"
                                                        sx={{ mr: 0.5, mb: 0.5 }}
                                                    />
                                                ))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const ConsumerGroups = ({ darkMode }) => {
    const [consumerGroups, setConsumerGroups] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchConsumerGroups = async () => {
            try {
                const response = await fetch(`${API_URL}/consumer-groups`);
                const data = await response.json();
                setConsumerGroups(data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchConsumerGroups();
        const interval = setInterval(fetchConsumerGroups, 5000);
        return () => clearInterval(interval);
    }, []);

    if (error) {
        return (
            <Typography color="error" sx={{ mt: 2 }}>
                Error loading consumer groups: {error}
            </Typography>
        );
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Consumer Groups
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>Group ID</TableCell>
                            <TableCell>State</TableCell>
                            <TableCell>Members</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(consumerGroups).map(([group, details]) => (
                            <ConsumerGroupRow 
                                key={group} 
                                group={group} 
                                details={details}
                                darkMode={darkMode}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ConsumerGroups;