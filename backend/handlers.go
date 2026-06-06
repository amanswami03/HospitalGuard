package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// ImagePredictionRequest represents the request for image prediction
type ImagePredictionRequest struct {
	Filename string `json:"filename"`
}

// ImagePredictionReplyMessage represents the response for image prediction
type ImagePredictionReplyMessage struct {
	Success             bool      `json:"success"`
	Class               int       `json:"class"`
	ClassName           string    `json:"class_name"`
	Confidence          float64   `json:"confidence"`
	ConfidencePercent   string    `json:"confidence_percentage"`
	Timestamp           time.Time `json:"timestamp"`
	Error               string    `json:"error,omitempty"`
}

// VideoPredictionReplyMessage represents the response for video prediction
type VideoPredictionReplyMessage struct {
	Success                  bool      `json:"success"`
	Verdict                  string    `json:"verdict"`
	ViolenceDetected         int       `json:"violence_detected"`
	TotalSampled             int       `json:"total_sampled"`
	ViolencePercentage       float64   `json:"violence_percentage"`
	AverageConfidence        float64   `json:"average_confidence"`
	AverageConfidencePercent string    `json:"average_confidence_percentage"`
	TotalFrames              int       `json:"total_frames"`
	FPS                      float64   `json:"fps"`
	Timestamp                time.Time `json:"timestamp"`
	Error                    string    `json:"error,omitempty"`
}

// NewImagePredictionHandler creates a handler for image prediction
func NewImagePredictionHandler(aiClient *AIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Parse multipart form (image upload)
		err := r.ParseMultipartForm(32 << 20) // 32 MB max
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to parse form"})
			return
		}

		file, handler, err := r.FormFile("file")
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "No file provided"})
			return
		}
		defer file.Close()

		// Read file data
		fileData, err := io.ReadAll(file)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to read file"})
			return
		}

		// Get prediction from AI server
		prediction, err := aiClient.PredictImageFromBytes(fileData, handler.Filename)
		if err != nil {
			log.Printf("AI prediction error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ImagePredictionReplyMessage{
				Success:   false,
				Error:     err.Error(),
				Timestamp: time.Now(),
			})
			return
		}

		// Store in database
		storePrediction("image", handler.Filename, prediction.ClassName, prediction.Confidence)

		// Send WhatsApp alert/warning if violence detected
		if prediction.ClassName == "Violence" && prediction.Confidence > 0.5 {
			cameraNum := r.FormValue("camera_id")
			if cameraNum == "" {
				cameraNum = "CAM-01"
			}
			
			var severity string
			if prediction.Confidence >= 0.8 {
				severity = "High"
			} else if prediction.Confidence >= 0.7 {
				severity = "Medium"
			} else {
				severity = "Low"
			}
			
			message := "Violence detected in image: " + handler.Filename
			go StoreAlertWithNotification(
				cameraNum,
				"Camera-"+cameraNum,
				"Violence Detection",
				severity,
				message,
				prediction.Confidence,
			)
		}

		// Return response
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(ImagePredictionReplyMessage{
			Success:           prediction.Success,
			Class:             prediction.Class,
			ClassName:         prediction.ClassName,
			Confidence:        prediction.Confidence,
			ConfidencePercent: prediction.Confidence2,
			Timestamp:         time.Now(),
		})
	}
}

// NewVideoPredictionHandler creates a handler for video prediction
func NewVideoPredictionHandler(aiClient *AIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Parse multipart form (video upload)
		err := r.ParseMultipartForm(500 << 20) // 500 MB max
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to parse form"})
			return
		}

		file, handler, err := r.FormFile("file")
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "No file provided"})
			return
		}
		defer file.Close()

		// Get sample_frames parameter
		sampleFrames := 5
		if sf := r.FormValue("sample_frames"); sf != "" {
			json.Unmarshal([]byte(sf), &sampleFrames)
		}

		fileData, err := io.ReadAll(file)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to read file"})
			return
		}

		// Get prediction from AI server
		prediction, err := aiClient.PredictVideoFromBytes(fileData, handler.Filename, sampleFrames)
		if err != nil {
			log.Printf("AI prediction error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(VideoPredictionReplyMessage{
				Success:   false,
				Error:     err.Error(),
				Timestamp: time.Now(),
			})
			return
		}

		// Store in database
		verdict := "No Violence"
		if prediction.ViolencePercentage > 50 {
			verdict = "Violence"
		}
		storePrediction("video", handler.Filename, verdict, prediction.AverageConfidence)

		// Send WhatsApp alert/warning if violence detected
		if verdict == "Violence" && prediction.AverageConfidence > 0.5 {
			cameraNum := r.FormValue("camera_id")
			if cameraNum == "" {
				cameraNum = "CAM-01"
			}
			
			var severity string
			if prediction.AverageConfidence >= 0.8 {
				severity = "High"
			} else if prediction.AverageConfidence >= 0.7 {
				severity = "Medium"
			} else {
				severity = "Low"
			}
			
			message := "Violence detected in video: " + handler.Filename
			go StoreAlertWithNotification(
				cameraNum,
				"Camera-"+cameraNum,
				"Violence Detection",
				severity,
				message,
				prediction.AverageConfidence,
			)
		}

		// Return response
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(VideoPredictionReplyMessage{
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
		})
	}
}

// ==================== CAMERA HANDLERS ====================

// NewGetCamerasHandler handles fetching cameras from Helios API
func NewGetCamerasHandler(cameraService *CameraService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Try to fetch fresh cameras from API
		cameras, err := cameraService.FetchCameras()
		if err != nil {
			log.Printf("⚠️  Could not fetch fresh cameras from API: %v", err)
			// If API fails, return cached cameras
			cameras = cameraService.GetCameras()
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"cameras": cameras,
			"total":   len(cameras),
		})
	}
}

// NewGetCameraAlertsHandler returns alerts from detected threats
func NewGetCameraAlertsHandler(cameraService *CameraService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Get limit from query params
		limit := 20
		if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
			json.Unmarshal([]byte(limitStr), &limit)
		}

		alerts := cameraService.GetAlerts(limit)

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"alerts":  alerts,
			"total":   len(alerts),
		})
	}
}

// NewDetectThreatHandler processes frame for threat detection
func NewDetectThreatHandler(aiClient *AIClient, cameraService *CameraService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Parse multipart form (frame upload)
		err := r.ParseMultipartForm(32 << 20) // 32 MB max
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to parse form"})
			return
		}

		cameraID := r.FormValue("camera_id")
		if cameraID == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "camera_id parameter required"})
			return
		}

		file, handler, err := r.FormFile("frame")
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "No frame provided"})
			return
		}
		defer file.Close()

		// Read file data
		fileData, err := io.ReadAll(file)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to read frame"})
			return
		}

		// Get prediction from AI server
		prediction, err := aiClient.PredictImageFromBytes(fileData, handler.Filename)
		if err != nil {
			log.Printf("AI prediction error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ImagePredictionReplyMessage{
				Success:   false,
				Error:     err.Error(),
				Timestamp: time.Now(),
			})
			return
		}

		// If threat detected, add alert and send WhatsApp notification
		var alert *CameraAlert
		if (prediction.ClassName == "Violence" || prediction.Class == 1) && prediction.Confidence > 0.60 {
			a := cameraService.AddAlert(cameraID, "Physical Aggression", prediction.Confidence)
			alert = &a
			log.Printf("🚨 THREAT DETECTED: Camera %s, Confidence: %.2f%%", cameraID, prediction.Confidence*100)
			
			// Determine severity
			var severity string
			if prediction.Confidence >= 0.8 {
				severity = "High"
			} else if prediction.Confidence >= 0.7 {
				severity = "Medium"
			} else {
				severity = "Low"
			}
			
			// Store alert with WhatsApp notification
			go StoreAlertWithNotification(
				cameraID,
				fmt.Sprintf("Camera %s", cameraID),
				"Violence Detection",
				severity,
				fmt.Sprintf("Violence detected in frame: %s", handler.Filename),
				prediction.Confidence,
			)
			
			// Broadcast alert in real-time via WebSocket
			BroadcastAlert(&a)
		}

		// Store prediction
		storePrediction("camera", cameraID, prediction.ClassName, prediction.Confidence)

		// Return response
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":    prediction.Success,
			"class_name": prediction.ClassName,
			"confidence": prediction.Confidence,
			"threat_detected": alert != nil,
			"alert":      alert,
			"timestamp":  time.Now(),
		})
	}
}

// NewClearAlertsHandler clears all alerts
func NewClearAlertsHandler(cameraService *CameraService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		cameraService.ClearAlerts()

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "All alerts cleared",
		})
	}
}

// ==================== HELPER FUNCTIONS ====================

// getStringValue extracts a string value from a map with a default fallback
func getStringValue(data map[string]interface{}, key, defaultValue string) string {
	if val, ok := data[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return defaultValue
}

// getFloatValue extracts a float64 value from a map with a default fallback
func getFloatValue(data map[string]interface{}, key string, defaultValue float64) float64 {
	if val, ok := data[key]; ok {
		switch v := val.(type) {
		case float64:
			return v
		case int:
			return float64(v)
		case string:
			if f := parseFloat(v); f >= 0 {
				return f
			}
		}
	}
	return defaultValue
}

// parseFloat tries to parse a string as float64
func parseFloat(s string) float64 {
	var f float64
	fmt.Sscanf(s, "%f", &f)
	return f
}
