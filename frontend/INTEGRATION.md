# 🔗 Frontend Integration Guide

Complete guide to integrate your React frontend with the Go backend for real-time violence detection.

---

## 📦 Installation

### Install Required Packages

```bash
cd /Users/amanswami/Desktop/NHH/frontend
npm install axios
```

---

## 🎯 Basic HTTP Integration

### Image Prediction Component

Create `src/components/ImagePredictor.jsx`:

```jsx
import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

function ImagePredictor() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handlePredict = async () => {
    if (!file) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/api/predict/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="predictor-container">
      <h2>🖼️ Image Prediction</h2>
      
      <div className="file-input">
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
        />
      </div>

      <button onClick={handlePredict} disabled={!file || loading}>
        {loading ? 'Processing...' : 'Predict'}
      </button>

      {error && <div className="error">❌ {error}</div>}

      {result && (
        <div className={`result ${result.class === 1 ? 'violence' : 'safe'}`}>
          <h3>Result</h3>
          <p><strong>Classification:</strong> {result.class_name}</p>
          <p><strong>Confidence:</strong> {result.confidence_percentage}</p>
          <p><strong>Time:</strong> {new Date(result.timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default ImagePredictor;
```

---

## 🎬 Video Prediction Component

Create `src/components/VideoPredictor.jsx`:

```jsx
import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

function VideoPredictor() {
  const [file, setFile] = useState(null);
  const [sampleFrames, setSampleFrames] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handlePredict = async () => {
    if (!file) {
      setError('Please select a video');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sample_frames', sampleFrames);

      const response = await axios.post(`${API_URL}/api/predict/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict) => {
    return verdict.includes('VIOLENCE') ? '#ff4444' : '#44ff44';
  };

  return (
    <div className="predictor-container">
      <h2>🎬 Video Prediction</h2>
      
      <div className="file-input">
        <input 
          type="file" 
          accept="video/*"
          onChange={handleFileChange}
          disabled={loading}
        />
      </div>

      <div className="param-input">
        <label>Sample Frames:</label>
        <input 
          type="number" 
          min="1" 
          max="20"
          value={sampleFrames}
          onChange={(e) => setSampleFrames(parseInt(e.target.value))}
          disabled={loading}
        />
      </div>

      <button onClick={handlePredict} disabled={!file || loading}>
        {loading ? 'Processing...' : 'Predict'}
      </button>

      {error && <div className="error">❌ {error}</div>}

      {result && (
        <div className="result" style={{ borderColor: getVerdictColor(result.verdict) }}>
          <h3>Result</h3>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: getVerdictColor(result.verdict) }}>
            {result.verdict}
          </p>
          <p><strong>Violence Frames:</strong> {result.violence_detected}/{result.total_sampled} ({result.violence_percentage}%)</p>
          <p><strong>Average Confidence:</strong> {result.average_confidence_percentage}</p>
          <p><strong>Total Frames:</strong> {result.total_frames}</p>
          <p><strong>FPS:</strong> {result.fps}</p>
          <p><strong>Time:</strong> {new Date(result.timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default VideoPredictor;
```

---

## 🔌 WebSocket Real-Time Component

Create `src/components/WebSocketPredictor.jsx`:

```jsx
import { useState, useEffect, useRef } from 'react';

const WS_URL = 'ws://localhost:8080/ws/predict';

function WebSocketPredictor() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('✓ WebSocket connected');
      setConnected(true);
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Message received:', message);

      if (message.status === 'processing') {
        setLoading(true);
      } else if (message.status === 'success') {
        setLoading(false);
        setResult(message.result);
      } else if (message.status === 'error') {
        setLoading(false);
        setError(message.error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
      setConnected(false);
    };

    ws.current.onclose = () => {
      console.log('✗ WebSocket disconnected');
      setConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const predictImage = async (file) => {
    if (!connected) {
      setError('WebSocket not connected');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = new Uint8Array(e.target.result);
      
      ws.current.send(JSON.stringify({
        type: 'predict_image',
        request_id: `img-${Date.now()}`,
        data: {
          file_data: Array.from(fileData),
          filename: file.name
        }
      }));
    };
    reader.readAsArrayBuffer(file);
  };

  const predictVideo = async (file, sampleFrames = 5) => {
    if (!connected) {
      setError('WebSocket not connected');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = new Uint8Array(e.target.result);
      
      ws.current.send(JSON.stringify({
        type: 'predict_video',
        request_id: `vid-${Date.now()}`,
        data: {
          file_data: Array.from(fileData),
          filename: file.name,
          sample_frames: sampleFrames
        }
      }));
    };
    reader.readAsArrayBuffer(file);
  };

  const sendPing = () => {
    ws.current.send(JSON.stringify({
      type: 'ping',
      request_id: `ping-${Date.now()}`
    }));
  };

  return (
    <div className="predictor-container">
      <h2>⚡ WebSocket Real-Time Prediction</h2>
      
      <div className="status">
        <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      {error && <div className="error">❌ {error}</div>}

      <div className="button-group">
        <button onClick={sendPing} disabled={!connected}>
          Ping Server
        </button>
      </div>

      {loading && <div className="loading">⏳ Processing...</div>}

      {result && (
        <div className="result">
          <h3>Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default WebSocketPredictor;
```

---

## 📊 Statistics Dashboard

Create `src/components/Statistics.jsx`:

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="statistics-container">
      <h2>📊 Statistics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Predictions</h3>
          <p className="big-number">{stats.total_predictions}</p>
        </div>

        <div className="stat-card">
          <h3>Image Predictions</h3>
          <p className="big-number">{stats.image_predictions}</p>
        </div>

        <div className="stat-card">
          <h3>Video Predictions</h3>
          <p className="big-number">{stats.video_predictions}</p>
        </div>

        <div className="stat-card" style={{ borderColor: '#ff4444' }}>
          <h3>Violence Detected</h3>
          <p className="big-number" style={{ color: '#ff4444' }}>
            {stats.violence_detected}
          </p>
        </div>

        <div className="stat-card" style={{ borderColor: '#44ff44' }}>
          <h3>No Violence</h3>
          <p className="big-number" style={{ color: '#44ff44' }}>
            {stats.no_violence}
          </p>
        </div>

        <div className="stat-card">
          <h3>Average Confidence</h3>
          <p className="big-number">
            {(stats.average_confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
```

---

## 📋 Main App Component

Update `src/App.jsx`:

```jsx
import { useState } from 'react';
import ImagePredictor from './components/ImagePredictor';
import VideoPredictor from './components/VideoPredictor';
import WebSocketPredictor from './components/WebSocketPredictor';
import Statistics from './components/Statistics';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('image');

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚨 Violence Detection System</h1>
        <p>Real-time image and video analysis</p>
      </header>

      <nav className="tab-nav">
        <button 
          className={activeTab === 'image' ? 'active' : ''}
          onClick={() => setActiveTab('image')}
        >
          🖼️ Image
        </button>
        <button 
          className={activeTab === 'video' ? 'active' : ''}
          onClick={() => setActiveTab('video')}
        >
          🎬 Video
        </button>
        <button 
          className={activeTab === 'websocket' ? 'active' : ''}
          onClick={() => setActiveTab('websocket')}
        >
          ⚡ WebSocket
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
      </nav>

      <div className="content">
        {activeTab === 'image' && <ImagePredictor />}
        {activeTab === 'video' && <VideoPredictor />}
        {activeTab === 'websocket' && <WebSocketPredictor />}
        {activeTab === 'stats' && <Statistics />}
      </div>

      <footer className="app-footer">
        <p>Backend: http://localhost:8080 | AI Server: http://localhost:5000</p>
      </footer>
    </div>
  );
}

export default App;
```

---

## 🎨 Styling

Create `src/App.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
  padding: 40px 0;
}

.app-header h1 {
  font-size: 48px;
  margin-bottom: 10px;
}

.app-header p {
  font-size: 18px;
  opacity: 0.9;
}

.tab-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background: white;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.tab-nav button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tab-nav button:hover {
  background: #e0e0e0;
}

.tab-nav button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.content {
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  margin-bottom: 40px;
}

.predictor-container {
  max-width: 600px;
  margin: 0 auto;
}

.predictor-container h2 {
  margin-bottom: 25px;
  color: #333;
}

.file-input {
  margin-bottom: 20px;
}

.file-input input {
  display: block;
  width: 100%;
  padding: 15px;
  border: 2px dashed #667eea;
  border-radius: 8px;
  cursor: pointer;
}

.file-input input:hover {
  border-color: #764ba2;
}

.param-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.param-input label {
  font-weight: 500;
}

.param-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

button {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result {
  margin-top: 30px;
  padding: 20px;
  background: #f5f5f5;
  border-left: 4px solid #667eea;
  border-radius: 8px;
}

.result.violence {
  border-left-color: #ff4444;
}

.result.safe {
  border-left-color: #44ff44;
}

.result h3 {
  margin-bottom: 15px;
  color: #333;
}

.result p {
  margin: 10px 0;
  color: #555;
}

.error {
  margin-top: 15px;
  padding: 15px;
  background: #ffe6e6;
  color: #cc0000;
  border-radius: 8px;
}

.loading {
  text-align: center;
  padding: 30px;
  color: #667eea;
  font-size: 18px;
  font-weight: 600;
}

.status {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-indicator {
  font-weight: 600;
}

.status-indicator.connected {
  color: #44ff44;
}

.status-indicator.disconnected {
  color: #ff4444;
}

.statistics-container {
  max-width: 1000px;
  margin: 0 auto;
}

.statistics-container h2 {
  margin-bottom: 30px;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.stat-card {
  padding: 25px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border: 2px solid #667eea;
  border-radius: 10px;
  text-align: center;
}

.stat-card h3 {
  color: #333;
  margin-bottom: 15px;
}

.big-number {
  font-size: 42px;
  font-weight: 700;
  color: #667eea;
}

.app-footer {
  text-align: center;
  color: white;
  padding: 20px;
  opacity: 0.9;
}
```

---

## 🚀 Running Everything

### Terminal 1: Python AI Server
```bash
cd /Users/amanswami/Desktop/NHH/ai
python3 scripts/api_server.py
```

### Terminal 2: Go Backend
```bash
cd /Users/amanswami/Desktop/NHH/backend
go run .
```

### Terminal 3: React Frontend
```bash
cd /Users/amanswami/Desktop/NHH/frontend
npm run dev
```

---

## ✅ Testing Checklist

- [ ] All 3 servers running
- [ ] Image upload and prediction works
- [ ] Video upload and prediction works
- [ ] WebSocket connection works
- [ ] Statistics update in real-time
- [ ] No CORS errors

---

Happy building! 🎯
