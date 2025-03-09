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
  useTheme,
  Stack
} from "@mui/material";
import { Brightness4, Brightness7, Home } from "@mui/icons-material";
import LiveKafkaDashbord from "./LiveChart.jsx";
import KafkaMetrics from "./cluster-metrics.jsx";
import ConsumerGroups from "./ConsumerGroups.jsx";
import HomePage from "./HomePage.jsx";
import TopicManagement from "./TopicManagement.jsx";
import { useColorMode } from "./ThemeContext";

function App() {
  const theme = useTheme();
  const colorMode = useColorMode();

  return (
    <Router>
      <AppBar position="fixed" sx={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{ mr: 2 }}
          >
            <Home />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Kafka Dashboard
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              color="inherit"
              component={RouterLink}
              to="/live-kafka-dashboard"
              sx={{
                border: "1px solid transparent",
                borderRadius: "5px",
                "&:hover": { border: "1px solid white" },
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
              }}
            >
              Consumer Groups
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/topic-management"
              sx={{
                border: "1px solid transparent",
                borderRadius: "5px",
                "&:hover": { border: "1px solid white" },
              }}
            >
              Topics
            </Button>
            <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/live-kafka-dashboard" element={<LiveKafkaDashbord />} />
        <Route path="/kafka-metrics" element={<KafkaMetrics />} />
        <Route path="/consumer-groups" element={<ConsumerGroups />} />
        <Route path="/topic-management" element={<TopicManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
