package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, implement proper origin checking
		return true
	},
}

// WebSocketMessage represents messages sent over WebSocket
type WebSocketMessage struct {
	Type      string          `json:"type"` // "predict_image", "predict_video", "status"
	Data      json.RawMessage `json:"data"`
	RequestID string          `json:"request_id"`
}

// WebSocketResponse represents responses sent over WebSocket
type WebSocketResponse struct {
	Type      string      `json:"type"`
	Status    string      `json:"status"` // "processing", "success", "error"
	Result    interface{} `json:"result,omitempty"`
	Error     string      `json:"error,omitempty"`
	RequestID string      `json:"request_id"`
	Timestamp time.Time   `json:"timestamp"`
}

// NewWebSocketHandler creates a WebSocket handler for real-time predictions
func NewWebSocketHandler(aiClient *AIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Upgrade HTTP connection to WebSocket
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}
		defer conn.Close()

		log.Printf("✓ WebSocket connected: %s", r.RemoteAddr)

		// Handle incoming messages
		for {
			var msg WebSocketMessage
			err := conn.ReadJSON(&msg)
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("WebSocket error: %v", err)
				}
				break
			}

			// Process message asynchronously
			go handleWebSocketMessage(conn, aiClient, msg)
		}

		log.Printf("✗ WebSocket disconnected: %s", r.RemoteAddr)
	}
}

// handleWebSocketMessage processes incoming WebSocket messages
func handleWebSocketMessage(conn *websocket.Conn, aiClient *AIClient, msg WebSocketMessage) {
	switch msg.Type {
	case "predict_image":
		handleWebSocketImagePrediction(conn, aiClient, msg)
	case "predict_video":
		handleWebSocketVideoPrediction(conn, aiClient, msg)
	case "ping":
		conn.WriteJSON(WebSocketResponse{
			Type:      "pong",
			Status:    "success",
			RequestID: msg.RequestID,
			Timestamp: time.Now(),
		})
	default:
		conn.WriteJSON(WebSocketResponse{
			Type:      "error",
			Status:    "error",
			Error:     "Unknown message type",
			RequestID: msg.RequestID,
			Timestamp: time.Now(),
		})
	}
}

// handleWebSocketImagePrediction handles image prediction over WebSocket
func handleWebSocketImagePrediction(conn *websocket.Conn, aiClient *AIClient, msg WebSocketMessage) {
	// Parse image data from message
	var imageMsg struct {
		FileData []byte `json:"file_data"`
		Filename string `json:"filename"`
	}

	err := json.Unmarshal(msg.Data, &imageMsg)
	if err != nil {
		conn.WriteJSON(WebSocketResponse{
			Type:      "predict_image",
			Status:    "error",
			Error:     "Invalid message format",
			RequestID: msg.RequestID,
			Timestamp: time.Now(),
		})
		return
	}

	// Send processing status
	conn.WriteJSON(WebSocketResponse{
		Type:      "predict_image",
		Status:    "processing",
		RequestID: msg.RequestID,
		Timestamp: time.Now(),
	})

	// Get prediction from AI server
	prediction, err := aiClient.PredictImageFromBytes(imageMsg.FileData, imageMsg.Filename)
	if err != nil {
		conn.WriteJSON(WebSocketResponse{
			Type:      "predict_image",
			Status:    "error",
			Error:     err.Error(),
			RequestID: msg.RequestID,
			Timestamp: time.Now(),
		})
		return
	}

	// Store in database
	storePrediction("image", imageMsg.Filename, prediction.ClassName, prediction.Confidence)

	// Send result
	conn.WriteJSON(WebSocketResponse{
		Type:   "predict_image",
		Status: "success",
		Result: ImagePredictionReplyMessage{
			Success:           prediction.Success,
			Class:             prediction.Class,
			ClassName:         prediction.ClassName,
			Confidence:        prediction.Confidence,
			ConfidencePercent: prediction.Confidence2,
			Timestamp:         time.Now(),
		},
		RequestID: msg.RequestID,
		Timestamp: time.Now(),
	})
}

// handleWebSocketVideoPrediction handles video prediction over WebSocket
func handleWebSocketVideoPrediction(conn *websocket.Conn, aiClient *AIClient, msg WebSocketMessage) {
	// Parse video data from message
	var videoMsg struct {
		FileData     []byte `json:"file_data"`
		Filename     string `json:"filename"`
		SampleFrames int    `json:"sample_frames"`
	}

	// Set default sample frames
	videoMsg.SampleFrames = 5

	err := json.Unmarshal(msg.Data, &videoMsg)
	if err != nil {
		conn.WriteJSON(WebSocketResponse{
			Type:      "predict_video",
			Status:    "error",
			Error:     "Invalid message format",
			RequestID: msg.RequestID,
			Timestamp: time.Now(),
		})
		return
	}

	// Send processing status
	conn.WriteJSON(WebSocketResponse{
		Type:      "predict_video",
		Status:    "processing",
		RequestID: msg.RequestID,
		Timestamp: time.Now(),
	})

	// Get prediction from AI server
	prediction, err := aiClient.PredictVideoFromBytes(videoMsg.FileData, videoMsg.Filename, videoMsg.SampleFrames)
	if err != nil {
		conn.WriteJSON(WebSocketResponse{
			Type:      "predict_video",
			Status:    "error",
			Error:     err.Error(),
			RequestID: msg.RequestID,
			Timestamp: time.Now(),
		})
		return
	}

	// Store in database
	verdict := "No Violence"
	if prediction.ViolencePercentage > 50 {
		verdict = "Violence"
	}
	storePrediction("video", videoMsg.Filename, verdict, prediction.AverageConfidence)

	// Send result
	conn.WriteJSON(WebSocketResponse{
		Type:   "predict_video",
		Status: "success",
		Result: VideoPredictionReplyMessage{
			Success:                  prediction.Success,
			Verdict:                  prediction.Verdict,
			ViolenceDetected:         prediction.ViolenceDetected,
			TotalSampled:             prediction.TotalSampled,
			ViolencePercentage:       prediction.ViolencePercentage,
			AverageConfidence:        prediction.AverageConfidence,
			AverageConfidencePercent: prediction.AverageConfidencePercent,
			TotalFrames:              prediction.TotalFrames,
			FPS:                      prediction.FPS,
			Timestamp:                time.Now(),
		},
		RequestID: msg.RequestID,
		Timestamp: time.Now(),
	})
}
