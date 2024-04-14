import { BrowserRouter as Router, Route, Routes, Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import LiveKafkaDashbord from './LiveChart.jsx'
import KafkaMetrics from './cluster-metrics.jsx';

function App() {
  return (
    <Router>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Kafka Dashboard
          </Typography>
          <Box display="flex" justifyContent="space-between" width="30%">
            <Button color="inherit" component={RouterLink} to="/live-kafka-dashboard">Live Kafka Dashboard</Button>
            <Button color="inherit" component={RouterLink} to="/kafka-metrics">Kafka Metrics</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/live-kafka-dashboard" element={<LiveKafkaDashbord />} />
        <Route path="/kafka-metrics" element={<KafkaMetrics />} />
      </Routes>
    </Router>
  );
}

export default App;