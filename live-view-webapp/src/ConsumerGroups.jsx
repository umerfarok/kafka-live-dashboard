import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Collapse,
  IconButton,
  CircularProgress
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { API_URL } from './config';

const ConsumerGroupRow = ({ groupId, details }) => {
  const [open, setOpen] = useState(false);

  const getStateColor = (state) => {
    switch (state) {
      case 'Stable':
        return 'success';
      case 'Dead':
        return 'error';
      case 'PreparingRebalance':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">{groupId}</TableCell>
        <TableCell>
          <Chip 
            label={details.state} 
            color={getStateColor(details.state)}
            size="small"
          />
        </TableCell>
        <TableCell>{Object.keys(details.members).length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
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

function ConsumerGroups() {
  const [consumerGroups, setConsumerGroups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConsumerGroups = async () => {
      try {
        const response = await fetch(`${API_URL}/consumer-groups`);
        if (!response.ok) {
          throw new Error('Failed to fetch consumer groups');
        }
        const data = await response.json();
        setConsumerGroups(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConsumerGroups();
    const interval = setInterval(fetchConsumerGroups, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
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
            {Object.entries(consumerGroups).map(([groupId, details]) => (
              <ConsumerGroupRow key={groupId} groupId={groupId} details={details} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default ConsumerGroups;