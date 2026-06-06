package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	// Initialize configuration
	config := LoadConfig()
	
	// Initialize AI client
	aiClient := NewAIClient(config.AIServerURL)
	
	// Initialize camera service
	cameraService := NewCameraService(config.HeliosAPIURL, aiClient)
	
	// Initialize alert WebSocket hub
	InitAlertHub()
	
	// Initialize router
	router := mux.NewRouter()
	
	// Register middleware
	router.Use(loggingMiddleware)
	
	// Health check endpoint
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok","service":"nhh-backend"}`)
	}).Methods(http.MethodGet)
	
	// ========== AUTHENTICATION ENDPOINTS ==========
	router.HandleFunc("/api/auth/login", LoginHandler).Methods(http.MethodPost)
	router.HandleFunc("/api/auth/signup", SignupHandler).Methods(http.MethodPost)
	
	// AI Image prediction endpoint
	router.HandleFunc("/api/predict/image", NewImagePredictionHandler(aiClient)).Methods(http.MethodPost)
	
	// AI Video prediction endpoint
	router.HandleFunc("/api/predict/video", NewVideoPredictionHandler(aiClient)).Methods(http.MethodPost)
	
	// WebSocket endpoint for real-time predictions
	router.HandleFunc("/ws/predict", NewWebSocketHandler(aiClient))
	
	// Get prediction history
	router.HandleFunc("/api/history", GetPredictionHistory).Methods(http.MethodGet)
	
	// Get statistics
	router.HandleFunc("/api/stats", GetStatistics).Methods(http.MethodGet)

	// Get dashboard statistics
	router.HandleFunc("/api/dashboard/stats", GetDashboardStats).Methods(http.MethodGet)
	
	// ========== ALERTS ENDPOINTS ==========
	// Get alerts history
	router.HandleFunc("/api/alerts", GetAlerts).Methods(http.MethodGet)
	
	// Send WhatsApp alert notification from frontend
	router.HandleFunc("/api/alerts/send-whatsapp", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		
		var alertData map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&alertData); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error": "Invalid request body",
			})
			return
		}
		
		notifier := GetWhatsAppNotifier()
		if notifier == nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error": "WhatsApp notifier not initialized",
			})
			return
		}
		
		// Extract alert details
		alertType := getStringValue(alertData, "type", "Threat Detection")
		cameraID := getStringValue(alertData, "camera_id", "Unknown")
		severity := getStringValue(alertData, "severity", "MEDIUM")
		confidence := getFloatValue(alertData, "confidence", 0.0)
		
		log.Printf("📱 WhatsApp Request - Type: %s, Camera: %s, Severity: %s, Confidence: %.2f", alertType, cameraID, severity, confidence)
		
		// Send WhatsApp notification
		err := notifier.SendAlertNotification(alertType, cameraID, severity, confidence)
		if err != nil {
			log.Printf("❌ Failed to send WhatsApp notification: %v", err)
			
			// Check if it's a Twilio rate limit error (429)
			errMsg := err.Error()
			if bytes.Contains([]byte(errMsg), []byte("429")) || bytes.Contains([]byte(errMsg), []byte("daily messages limit")) {
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error":   "Twilio rate limit exceeded - 50 messages per day limit",
					"details": errMsg,
					"status":  429,
				})
				return
			}
			
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":   "Failed to send WhatsApp notification",
				"details": errMsg,
			})
			return
		}
		
		log.Printf("✅ WhatsApp notification sent successfully")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "success",
			"message": "WhatsApp alert sent!",
		})
	}).Methods(http.MethodPost)
	
	// Test WhatsApp notification
	router.HandleFunc("/api/alerts/test-whatsapp", func(w http.ResponseWriter, r *http.Request) {
		notifier := GetWhatsAppNotifier()
		if notifier == nil {
			http.Error(w, "WhatsApp notifier not initialized", http.StatusServiceUnavailable)
			return
		}
		
		err := notifier.SendTestNotification()
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprintf(w, `{"error":"%s"}`, err.Error())
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"success","message":"Test WhatsApp message sent!"}`)
	}).Methods(http.MethodPost)
	
	// ========== CAMERA ENDPOINTS ==========
	
	// Get all cameras
	router.HandleFunc("/api/cameras", NewGetCamerasHandler(cameraService)).Methods(http.MethodGet)
	
	// Get camera alerts
	router.HandleFunc("/api/cameras/alerts", NewGetCameraAlertsHandler(cameraService)).Methods(http.MethodGet)
	
	// Detect threat in frame
	router.HandleFunc("/api/cameras/detect", NewDetectThreatHandler(aiClient, cameraService)).Methods(http.MethodPost)
	
	// Clear alerts
	router.HandleFunc("/api/cameras/alerts/clear", NewClearAlertsHandler(cameraService)).Methods(http.MethodPost)
	
	// WebSocket for live camera alerts
	router.HandleFunc("/ws/alerts", NewAlertWebSocketHandler())
	
	// ========== TEST STREAM ENDPOINTS (for demo/testing) ==========
	// Serve test MJPEG streams for development
	router.HandleFunc("/stream/{id}", NewTestMJPEGStreamHandler()).Methods(http.MethodGet)
	
	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		ExposedHeaders:   []string{"Content-Length", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	})
	handler := c.Handler(router)
	
	// Initialize database
	err := InitDatabase(config)
	if err != nil {
		log.Fatalf("❌ Failed to initialize database: %v", err)
	}
	defer CloseDatabase()
	
	// Initialize WhatsApp notifier
	InitWhatsApp(config)
	
	// Create HTTP server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", config.Port),
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	
	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Server starting on http://localhost:%d", config.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()
	
	// Test AI connection
	log.Println("🔗 Connecting to AI server...")
	if err := aiClient.TestConnection(); err != nil {
		log.Printf("⚠️  Warning: Could not connect to AI server: %v", err)
		log.Println("    Make sure to run: python3 /path/to/ai/scripts/api_server.py")
	} else {
		log.Println("✅ Connected to AI server!")
	}
	
	// Test Helios API connection
	log.Println("🔗 Connecting to Helios Earth API...")
	if _, err := cameraService.FetchCameras(); err != nil {
		log.Printf("⚠️  Warning: Could not connect to Helios API: %v", err)
	} else {
		log.Println("✅ Connected to Helios Earth API!")
	}
	
	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	
	<-sigChan
	log.Println("\n🛑 Shutting down server...")
	
	// Give outstanding requests 5 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	server.Shutdown(ctx)
	log.Println("✅ Server stopped")
}

// Logging middleware
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("[%s] %s %s", r.Method, r.RequestURI, r.RemoteAddr)
		next.ServeHTTP(w, r)
		log.Printf("    ✓ Completed in %v", time.Since(start))
	})
}
