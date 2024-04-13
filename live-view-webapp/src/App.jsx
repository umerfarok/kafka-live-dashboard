import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css'
import LiveKafkaDashbord from './LiveChart.jsx'

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/live-kafka-dashboard">Live Kafka Dashboard</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/live-kafka-dashboard" element={<LiveKafkaDashbord />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;