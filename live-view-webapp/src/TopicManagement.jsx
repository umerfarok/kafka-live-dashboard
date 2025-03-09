import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    IconButton,
    useTheme,
    Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { API_URL } from './config';

const TopicManagement = () => {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [newTopicName, setNewTopicName] = useState('');
    const [partitions, setPartitions] = useState('1');
    const theme = useTheme();

    const fetchTopics = async () => {
        try {
            const response = await fetch(`${API_URL}/topics`);
            if (!response.ok) throw new Error('Failed to fetch topics');
            const data = await response.json();
            setTopics(data.map((topic, index) => ({ 
                id: index, 
                name: topic.name,
                partitions: topic.partitions,
                replicas: topic.replicas
            })));
            setError(null);
        } catch (err) {
            setError('Failed to fetch topics: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    const handleCreateTopic = async () => {
        try {
            const response = await fetch(`${API_URL}/topics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newTopicName,
                    partitions: parseInt(partitions),
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to create topic');
            }
            
            setOpenDialog(false);
            setNewTopicName('');
            setPartitions('1');
            fetchTopics();
        } catch (err) {
            setError('Failed to create topic: ' + err.message);
        }
    };

    const handleDeleteTopic = async (topicName) => {
        if (!confirm(`Are you sure you want to delete topic "${topicName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/topics/${topicName}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete topic');
            }
            
            fetchTopics();
        } catch (err) {
            setError('Failed to delete topic: ' + err.message);
        }
    };

    const columns = [
        { field: 'name', headerName: 'Topic Name', flex: 1 },
        { field: 'partitions', headerName: 'Partitions', width: 130 },
        { field: 'replicas', headerName: 'Replicas', width: 130 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 130,
            renderCell: (params) => (
                <IconButton
                    color="error"
                    onClick={() => handleDeleteTopic(params.row.name)}
                >
                    <DeleteIcon />
                </IconButton>
            ),
        },
    ];

    return (
        <Box sx={{ p: 3, mt: 8 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4">Topic Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Create Topic
                </Button>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper elevation={2}>
                <DataGrid
                    rows={topics}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    autoHeight
                    loading={loading}
                    disableSelectionOnClick
                    sx={{
                        '& .MuiDataGrid-cell': {
                            borderColor: theme.palette.divider,
                        },
                    }}
                />
            </Paper>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Create New Topic</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Topic Name"
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Number of Partitions"
                            type="number"
                            value={partitions}
                            onChange={(e) => setPartitions(e.target.value)}
                            fullWidth
                            inputProps={{ min: 1 }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handleCreateTopic}
                        variant="contained"
                        disabled={!newTopicName || parseInt(partitions) < 1}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TopicManagement;