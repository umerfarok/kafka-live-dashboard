import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link as RouterLink,
} from "react-router-dom";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton,
  useTheme
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import LiveKafkaDashbord from "./LiveChart.jsx";
import KafkaMetrics from "./cluster-metrics.jsx";
import ConsumerGroups from "./ConsumerGroups.jsx";
import { useColorMode } from "./ThemeContext";

function App() {
  const theme = useTheme();
  const colorMode = useColorMode();

  return (
    <Router>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Kafka Dashboard
          </Typography> 
          <Box display="flex" justifyContent="space-around" alignItems="center">
            <Button
              color="inherit"
              component={RouterLink}
              to="/live-kafka-dashboard"
              sx={{
                border: "1px solid transparent",
                borderRadius: "5px",
                "&:hover": { border: "1px solid white" },
                mx: 1
              }}
            >
              Live Dashboard
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/kafka-metrics"
              sx={{
                border: "1px solid transparent",
                borderRadius: "5px",
                "&:hover": { border: "1px solid white" },
                mx: 1
              }}
            >
              Metrics
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/consumer-groups"
              sx={{
                border: "1px solid transparent",
                borderRadius: "5px",
                "&:hover": { border: "1px solid white" },
                mx: 1
              }}
            >
              Consumer Groups
            </Button>
            <IconButton sx={{ ml: 2 }} onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<LiveKafkaDashbord />} />
        <Route path="/live-kafka-dashboard" element={<LiveKafkaDashbord />} />
        <Route path="/kafka-metrics" element={<KafkaMetrics />} />
        <Route path="/consumer-groups" element={<ConsumerGroups />} />
      </Routes>
    </Router>
  );
}

export default App;
