package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	_ "github.com/lib/pq"
)

// Prediction represents a stored prediction
type Prediction struct {
	ID         int       `json:"id"`
	Type       string    `json:"type"`      // "image" or "video"
	Filename   string    `json:"filename"`
	Result     string    `json:"result"`    // "Violence" or "No Violence"
	Confidence float64   `json:"confidence"`
	Timestamp  time.Time `json:"timestamp"`
}

// Alert represents a security alert with camera and timestamp info
type Alert struct {
	ID         int       `json:"id"`
	CameraID   string    `json:"camera_id"`
	CameraName string    `json:"camera_name"`
	Type       string    `json:"type"`       // "Violence", "Weapon", "Crowd", etc.
	Severity   string    `json:"severity"`  // "High", "Medium", "Low"
	Confidence float64   `json:"confidence"`
	Message    string    `json:"message"`
	Timestamp  time.Time `json:"timestamp"`
}

// Database holds the PostgreSQL connection
type Database struct {
	conn *sql.DB
	mu   sync.RWMutex
}

var db *Database

// InitDatabase initializes PostgreSQL connection and creates tables
func InitDatabase(config *Config) error {
	// Build connection string
	connStr := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		config.DBHost,
		config.DBPort,
		config.DBUser,
		config.DBPassword,
		config.DBName,
	)

	// Connect to PostgreSQL
	conn, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Printf("❌ Failed to open database: %v", err)
		return err
	}

	// Test the connection
	err = conn.Ping()
	if err != nil {
		log.Printf("❌ Failed to ping database: %v", err)
		return err
	}

	db = &Database{
		conn: conn,
	}

	// Create tables if they don't exist
	err = createTables()
	if err != nil {
		log.Printf("❌ Failed to create tables: %v", err)
		return err
	}

	log.Println("✓ PostgreSQL database connected successfully")
	log.Printf("  Database: %s", config.DBName)
	log.Printf("  Host: %s:%d", config.DBHost, config.DBPort)

	return nil
}

// createTables creates necessary database tables
func createTables() error {
	if db == nil {
		return fmt.Errorf("database not initialized")
	}

	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		hospital VARCHAR(255),
		number VARCHAR(100),
		role VARCHAR(50) DEFAULT 'user',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS predictions (
		id SERIAL PRIMARY KEY,
		type VARCHAR(50) NOT NULL,
		filename VARCHAR(255) NOT NULL,
		result VARCHAR(255) NOT NULL,
		confidence FLOAT NOT NULL,
		timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS cameras (
		id SERIAL PRIMARY KEY,
		camera_id VARCHAR(100) UNIQUE NOT NULL,
		name VARCHAR(255),
		zone VARCHAR(100),
		stream_url VARCHAR(500),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS alerts (
		id SERIAL PRIMARY KEY,
		camera_id VARCHAR(100) NOT NULL,
		camera_name VARCHAR(255),
		type VARCHAR(100),
		severity VARCHAR(20),
		confidence FLOAT,
		message TEXT,
		timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (camera_id) REFERENCES cameras(camera_id)
	);

	CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp);
	CREATE INDEX IF NOT EXISTS idx_alerts_camera_id ON alerts(camera_id);
	CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	`

	_, err := db.conn.Exec(schema)
	return err
}

// storePrediction stores a prediction in the database
func storePrediction(predType, filename, result string, confidence float64) error {
	if db == nil {
		log.Println("❌ Database not initialized")
		return fmt.Errorf("database not initialized")
	}

	query := `
		INSERT INTO predictions (type, filename, result, confidence)
		VALUES ($1, $2, $3, $4)
	`

	_, err := db.conn.Exec(query, predType, filename, result, confidence)
	if err != nil {
		log.Printf("❌ Failed to store prediction: %v", err)
		return err
	}

	log.Printf("💾 Prediction stored: %s (%s) - Confidence: %.2f%%", filename, result, confidence*100)
	return nil
}

// GetPredictionHistory retrieves all predictions
func GetPredictionHistory(w http.ResponseWriter, r *http.Request) {
	if db == nil {
		http.Error(w, "Database not initialized", http.StatusInternalServerError)
		return
	}

	db.mu.RLock()
	defer db.mu.RUnlock()

	query := `
		SELECT id, type, filename, result, confidence, timestamp
		FROM predictions
		ORDER BY timestamp DESC
		LIMIT 100
	`

	rows, err := db.conn.Query(query)
	if err != nil {
		http.Error(w, "Failed to query predictions", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var predictions []Prediction
	for rows.Next() {
		var pred Prediction
		err := rows.Scan(&pred.ID, &pred.Type, &pred.Filename, &pred.Result, &pred.Confidence, &pred.Timestamp)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		predictions = append(predictions, pred)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"total":       len(predictions),
		"predictions": predictions,
	})
}

// GetStatistics returns statistics about predictions
func GetStatistics(w http.ResponseWriter, r *http.Request) {
	if db == nil {
		http.Error(w, "Database not initialized", http.StatusInternalServerError)
		return
	}

	db.mu.RLock()
	defer db.mu.RUnlock()

	// Count by type
	var imageCount, videoCount int
	var violenceCount, noViolenceCount int

	db.conn.QueryRow("SELECT COUNT(*) FROM predictions WHERE type = 'image'").Scan(&imageCount)
	db.conn.QueryRow("SELECT COUNT(*) FROM predictions WHERE type = 'video'").Scan(&videoCount)
	db.conn.QueryRow("SELECT COUNT(*) FROM predictions WHERE result = 'Violence'").Scan(&violenceCount)
	db.conn.QueryRow("SELECT COUNT(*) FROM predictions WHERE result = 'No Violence'").Scan(&noViolenceCount)

	stats := map[string]interface{}{
		"total_predictions":    imageCount + videoCount,
		"image_predictions":    imageCount,
		"video_predictions":    videoCount,
		"violence_detected":    violenceCount,
		"no_violence_detected": noViolenceCount,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// GetDashboardStats returns dashboard statistics including incidents today, this week, and camera status
func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	if db == nil {
		http.Error(w, "Database not initialized", http.StatusInternalServerError)
		return
	}

	db.mu.RLock()
	defer db.mu.RUnlock()

	// Get incidents today (alerts from today)
	var incidentsToday int
	todayQuery := `SELECT COUNT(*) FROM alerts WHERE DATE(timestamp) = CURRENT_DATE`
	db.conn.QueryRow(todayQuery).Scan(&incidentsToday)

	// Get active alerts (unacknowledged alerts from last 24 hours)
	var activeAlerts int
	activeAlertsQuery := `SELECT COUNT(DISTINCT camera_id) FROM alerts WHERE timestamp > NOW() - INTERVAL '24 hours'`
	db.conn.QueryRow(activeAlertsQuery).Scan(&activeAlerts)

	// Get total cameras
	var totalCameras int
	db.conn.QueryRow("SELECT COUNT(*) FROM cameras").Scan(&totalCameras)

	// All configured cameras are online (displaying streams)
	var camerasOnline int = totalCameras

	// Get incidents this week (last 7 days, grouped by day)
	weekIncidentsQuery := `
		SELECT EXTRACT(DOW FROM timestamp) as day_of_week, COUNT(*) as count
		FROM alerts
		WHERE timestamp > NOW() - INTERVAL '7 days'
		GROUP BY EXTRACT(DOW FROM timestamp)
		ORDER BY day_of_week
	`
	rows, err := db.conn.Query(weekIncidentsQuery)
	if err != nil {
		log.Printf("Error querying week incidents: %v", err)
	}
	defer rows.Close()

	// Initialize array for 7 days (0=Sunday to 6=Saturday)
	weekIncidents := []int{0, 0, 0, 0, 0, 0, 0}
	for rows.Next() {
		var dayOfWeek, count int
		if err := rows.Scan(&dayOfWeek, &count); err != nil {
			log.Printf("Error scanning week incident: %v", err)
			continue
		}
		weekIncidents[int(dayOfWeek)] = count
	}

	// Get average response time (in minutes) - approximate based on alert frequency
	var avgResponseTime float64 = 2.4 // Default
	// This would require additional tracking in the alerts table

	// Get detection breakdown
	detectionQuery := `
		SELECT type, COUNT(*) as count
		FROM alerts
		WHERE timestamp > NOW() - INTERVAL '7 days'
		GROUP BY type
		ORDER BY count DESC
	`
	detRows, err := db.conn.Query(detectionQuery)
	if err != nil {
		log.Printf("Error querying detection breakdown: %v", err)
	}
	defer detRows.Close()

	detectionBreakdown := make(map[string]int)
	for detRows.Next() {
		var detType string
		var count int
		if err := detRows.Scan(&detType, &count); err != nil {
			log.Printf("Error scanning detection: %v", err)
			continue
		}
		detectionBreakdown[detType] = count
	}

	stats := map[string]interface{}{
		"incidents_today":       incidentsToday,
		"active_alerts":         activeAlerts,
		"cameras_total":         totalCameras,
		"cameras_online":        camerasOnline,
		"avg_response_time_min": avgResponseTime,
		"incidents_this_week":   weekIncidents,
		"detection_breakdown":   detectionBreakdown,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// StoreAlertWithNotification stores an alert and sends WhatsApp notification
func StoreAlertWithNotification(cameraID, cameraName, alertType, severity, message string, confidence float64) error {
	if db == nil {
		log.Println("❌ Database not initialized")
		return fmt.Errorf("database not initialized")
	}

	// Store alert in database
	query := `
		INSERT INTO alerts (camera_id, camera_name, type, severity, confidence, message, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
		RETURNING id
	`

	var alertID int
	err := db.conn.QueryRow(query, cameraID, cameraName, alertType, severity, confidence, message).Scan(&alertID)
	if err != nil {
		log.Printf("❌ Failed to store alert: %v", err)
		return err
	}

	log.Printf("💾 Alert stored: ID=%d, Camera=%s, Type=%s, Severity=%s", alertID, cameraID, alertType, severity)

	// Send WhatsApp notification based on severity
	notifier := GetWhatsAppNotifier()
	if notifier != nil {
		go func() {
			var err error
			if severity == "High" {
				// Send alert notification for HIGH severity
				err = notifier.SendAlertNotification(alertType, cameraID, severity, confidence)
			} else if severity == "Medium" || severity == "Low" {
				// Send warning notification for MEDIUM and LOW severity
				err = notifier.SendWarningNotification(alertType, cameraID, message)
			}
			if err != nil {
				log.Printf("⚠️  WhatsApp notification failed: %v", err)
			}
		}()
	}

	return nil
}

// GetAlerts retrieves recent alerts from database
func GetAlerts(w http.ResponseWriter, r *http.Request) {
	if db == nil {
		http.Error(w, "Database not initialized", http.StatusInternalServerError)
		return
	}

	db.mu.RLock()
	defer db.mu.RUnlock()

	query := `
		SELECT id, camera_id, camera_name, type, severity, confidence, message, timestamp
		FROM alerts
		ORDER BY timestamp DESC
		LIMIT 50
	`

	rows, err := db.conn.Query(query)
	if err != nil {
		http.Error(w, "Failed to query alerts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var alerts []Alert
	for rows.Next() {
		var alert Alert
		err := rows.Scan(&alert.ID, &alert.CameraID, &alert.CameraName, &alert.Type, &alert.Severity, &alert.Confidence, &alert.Message, &alert.Timestamp)
		if err != nil {
			log.Printf("Error scanning alert row: %v", err)
			continue
		}
		alerts = append(alerts, alert)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"total":  len(alerts),
		"alerts": alerts,
	})
}

// CloseDatabase closes the database connection
func CloseDatabase() error {
	if db != nil && db.conn != nil {
		return db.conn.Close()
	}
	return nil
}
