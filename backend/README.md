# 🚀 NHH Backend - Violence Detection System

Go backend server with WebSocket support for real-time violence detection predictions.

## 📋 Architecture

```
Frontend (React)
     ↓
Backend (Go)
     ↓
AI Server (Python Flask)
     ↓
Trained Model (ResNet50)
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd /Users/amanswami/Desktop/NHH/backend
go mod download
go mod tidy
```

### 2. Start the Python AI Server

In a separate terminal:

```bash
cd /Users/amanswami/Desktop/NHH/ai
pip3 install -r requirements.txt
python3 scripts/api_server.py
```

You should see:
```
🚀 VIOLENCE DETECTION API
Starting server...
Open http://localhost:5000/api/health
```

### 3. Start the Go Backend

```bash
cd /Users/amanswami/Desktop/NHH/backend
go run .
```

You should see:
```
✓ Config loaded: Port=8080, AI=http://localhost:5000, Env=development
✓ Server starting on http://localhost:8080
✓ Database initialized
✓ Connected to AI server!
```

## 📡 API Endpoints

### REST API

#### 1️⃣ Health Check
```bash
curl http://localhost:8080/api/health
```

Response:
```json
{"status":"ok","service":"nhh-backend"}
```

---

#### 2️⃣ Predict on Image (REST)
```bash
curl -X POST -F "file=@image.jpg" http://localhost:8080/api/predict/image
```

Response:
```json
{
  "success": true,
  "class": 1,
  "class_name": "Violence",
  "confidence": 0.9542,
  "confidence_percentage": "95.4%",
  "timestamp": "2024-03-29T10:30:45Z"
}
```

---

#### 3️⃣ Predict on Video (REST)
```bash
curl -X POST -F "file=@video.mp4" -F "sample_frames=5" http://localhost:8080/api/predict/video
```

Response:
```json
{
  "success": true,
  "verdict": "VIOLENCE DETECTED ⚠️",
  "violence_detected": 3,
  "total_sampled": 5,
  "violence_percentage": 60.0,
  "average_confidence": 0.8765,
  "average_confidence_percentage": "87.7%",
  "total_frames": 250,
  "fps": 30.0,
  "timestamp": "2024-03-29T10:30:45Z"
}
```

---

#### 4️⃣ Get Prediction History
```bash
curl http://localhost:8080/api/history
```

Response:
```json
{
  "total": 10,
  "predictions": [
    {
      "id": 1,
      "type": "image",
      "filename": "test.jpg",
      "result": "Violence",
      "confidence": 0.92,
      "timestamp": "2024-03-29T10:30:45Z"
    }
  ]
}
```

---

#### 5️⃣ Get Statistics
```bash
curl http://localhost:8080/api/stats
```

Response:
```json
{
  "total_predictions": 15,
  "image_predictions": 8,
  "video_predictions": 7,
  "violence_detected": 5,
  "no_violence": 10,
  "average_confidence": 0.87
}
```

---

### 🔌 WebSocket API

Connect to: `ws://localhost:8080/ws/predict`

#### Image Prediction via WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8080/ws/predict');

ws.onopen = () => {
  // Read file as base64
  const formData = new FormData();
  formData.append('file', imageFile);
  
  // Send prediction request
  ws.send(JSON.stringify({
    type: 'predict_image',
    request_id: 'req1',
    data: {
      file_data: fileDataBytes,
      filename: 'test.jpg'
    }
  }));
};

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('Status:', response.status);
  if (response.status === 'success') {
    console.log('Result:', response.result);
  }
};
```

#### Video Prediction via WebSocket
```javascript
ws.send(JSON.stringify({
  type: 'predict_video',
  request_id: 'req2',
  data: {
    file_data: videoFileBytes,
    filename: 'test.mp4',
    sample_frames: 5
  }
}));
```

#### Ping/Pong
```javascript
ws.send(JSON.stringify({
  type: 'ping',
  request_id: 'req0'
}));

// Response:
// {"type":"pong","status":"success","request_id":"req0",...}
```

---

## 🔗 Integration Examples

### React Frontend

```jsx
import { useState } from 'react';

function ViolenceDetector() {
  const [result, setResult] = useState(null);

  const predictImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8080/api/predict/image', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    setResult(data);
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => predictImage(e.target.files[0])}
      />
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

export default ViolenceDetector;
```

### Python Client

```python
import requests
import json

# Image prediction
files = {'file': open('image.jpg', 'rb')}
response = requests.post('http://localhost:8080/api/predict/image', files=files)
print(json.dumps(response.json(), indent=2))

# Video prediction
files = {'file': open('video.mp4', 'rb')}
data = {'sample_frames': 5}
response = requests.post('http://localhost:8080/api/predict/video', files=files, data=data)
print(json.dumps(response.json(), indent=2))

# Get stats
response = requests.get('http://localhost:8080/api/stats')
print(json.dumps(response.json(), indent=2))
```

### Node.js Client

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Image prediction
const imageForm = new FormData();
imageForm.append('file', fs.createReadStream('image.jpg'));

axios.post('http://localhost:8080/api/predict/image', imageForm, {
  headers: imageForm.getHeaders()
}).then(res => console.log(res.data));

// Video prediction
const videoForm = new FormData();
videoForm.append('file', fs.createReadStream('video.mp4'));
videoForm.append('sample_frames', '5');

axios.post('http://localhost:8080/api/predict/video', videoForm, {
  headers: videoForm.getHeaders()
}).then(res => console.log(res.data));
```

---

## 📁 Project Structure

```
backend/
├── main.go              # Server setup and routes
├── config.go            # Configuration management
├── ai_client.go         # AI server communication
├── handlers.go          # HTTP request handlers
├── websocket.go         # WebSocket handlers
├── database.go          # Data storage and statistics
├── go.mod              # Dependencies
└── README.md
```

---

## 🔧 Configuration

Set environment variables to customize:

```bash
export PORT=8080                           # Server port (default: 8080)
export AI_SERVER_URL=http://localhost:5000 # AI server URL
export ENVIRONMENT=production              # development or production
export DB_PATH=./data/predictions.db       # Database path
```

Or create a `.env` file:

```env
PORT=8080
AI_SERVER_URL=http://localhost:5000
ENVIRONMENT=development
DB_PATH=./data/predictions.db
```

---

## 🚀 Production Deployment

### Using Docker

```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o backend .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/backend .
EXPOSE 8080
CMD ["./backend"]
```

### Using systemd

Create `/etc/systemd/system/nhh-backend.service`:

```ini
[Unit]
Description=NHH Backend Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/nhh/backend
ExecStart=/usr/local/go/bin/go run .
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment="PORT=8080"
Environment="AI_SERVER_URL=http://localhost:5000"

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl start nhh-backend
sudo systemctl status nhh-backend
sudo journalctl -u nhh-backend -f
```

---

## 📊 Monitoring

### Log Levels

Logs are printed to console with timestamps:

```
2024/03/29 10:30:45 ✓ Config loaded: Port=8080, AI=http://localhost:5000, Env=development
2024/03/29 10:30:45 ✓ Server starting on http://localhost:8080
2024/03/29 10:30:45 🔗 Connecting to AI server...
2024/03/29 10:30:45 ✅ Connected to AI server!
2024/03/29 10:30:50 [POST] /api/predict/image 192.168.1.1
2024/03/29 10:30:51 💾 Prediction stored: image.jpg (Violence)
```

---

## 🐛 Troubleshooting

### "connection refused" to AI server
- Make sure Python API is running: `python3 /path/to/ai/scripts/api_server.py`
- Check AI_SERVER_URL environment variable

### WebSocket connection fails
- Check CORS settings in main.go
- Ensure frontend origin is allowed

### File upload size limit exceeded
- Image limit: 32 MB
- Video limit: 500 MB
- Modify in `handlers.go` if needed

---

## 📚 Dependencies

```
github.com/gorilla/websocket v1.5.0
github.com/gorilla/mux v1.8.0
github.com/rs/cors v1.9.0
```

Install: `go mod download`

---

## ✅ Testing Checklist

- [ ] Python AI server running
- [ ] Backend server running
- [ ] Health check returns 200
- [ ] Image prediction works
- [ ] Video prediction works
- [ ] WebSocket connects
- [ ] History endpoint returns data
- [ ] Statistics endpoint returns data

---

## 📞 Support

Check logs:
```bash
# See all logs
go run . 2>&1 | tee server.log

# Test connectivity
curl http://localhost:8080/api/health
curl http://localhost:8080/api/stats
```

---

## 🎯 Next Steps

1. ✅ Start Python AI server
2. ✅ Start Go backend
3. ✅ Test with curl/Postman
4. ✅ Connect frontend (React)
5. ✅ Deploy to production

Happy detecting! 🎯
