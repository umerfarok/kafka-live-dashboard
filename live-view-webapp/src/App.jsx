import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css'
import LiveKafkaDashbord from './LiveChart.jsx'
import KafkaMetrics from './cluster-metrics.jsx';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/live-kafka-dashboard">Live Kafka Dashboard</Link>
            </li>
            <li>
              <Link to="/kafka-metrics">Kafka Metrics</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/live-kafka-dashboard" element={<LiveKafkaDashbord />} />
          <Route path="/kafka-metrics" element={<KafkaMetrics />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;