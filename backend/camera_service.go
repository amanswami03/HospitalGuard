package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"
)

// CameraDevice represents a camera from Helios Earth API
type CameraDevice struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Location string `json:"location"`
	StreamURL string `json:"stream_url,omitempty"`
	Status   string `json:"status"`
	Type     string `json:"type"`
	Zone     string `json:"zone,omitempty"`
}

// CameraAlert represents a detected threat from camera feed
type CameraAlert struct {
	ID         int       `json:"id"`
	CameraID   string    `json:"camera_id"`
	CameraName string    `json:"camera_name"`
	Type       string    `json:"type"`
	Confidence float64   `json:"confidence"`
	Timestamp  time.Time `json:"timestamp"`
	Severity   string    `json:"severity"`
	FrameData  string    `json:"frame_data,omitempty"`
}

// CameraService handles CCTV camera operations
type CameraService struct {
	apiURL    string
	httpClient *http.Client
	aiClient  *AIClient
	cameras   map[string]*CameraDevice
	alerts    []CameraAlert
	alertID   int
}

// NewCameraService creates a new camera service
func NewCameraService(heliosAPIURL string, aiClient *AIClient) *CameraService {
	return &CameraService{
		apiURL: heliosAPIURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		aiClient: aiClient,
		cameras:  make(map[string]*CameraDevice),
		alerts:   make([]CameraAlert, 0),
		alertID:  1,
	}
}

// FetchCameras fetches cameras from Helios Earth API
func (cs *CameraService) FetchCameras() ([]CameraDevice, error) {
	// First try GET endpoint
	resp, err := cs.httpClient.Get(cs.apiURL + "/v1/cameras")
	if err != nil {
		log.Printf("⚠️  GET request failed: %v, trying POST...", err)
		return cs.searchCameras()
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("⚠️  GET returned status %d, trying POST...", resp.StatusCode)
		return cs.searchCameras()
	}

	var cameras []CameraDevice
	if err := json.NewDecoder(resp.Body).Decode(&cameras); err != nil {
		log.Printf("⚠️  Error decoding cameras: %v", err)
		return cs.searchCameras()
	}

	// Store cameras
	for i := range cameras {
		cs.cameras[cameras[i].ID] = &cameras[i]
	}

	log.Printf("✓ Fetched %d cameras from Helios API", len(cameras))
	return cameras, nil
}

// searchCameras searches cameras using POST method
func (cs *CameraService) searchCameras() ([]CameraDevice, error) {
	searchPayload := map[string]interface{}{
		"query": map[string]interface{}{},
	}

	body, err := json.Marshal(searchPayload)
	if err != nil {
		log.Printf("⚠️  Failed to marshal search payload, using sample cameras")
		return cs.getSampleCameras(), nil
	}

	resp, err := cs.httpClient.Post(
		cs.apiURL+"/v1/cameras/_search",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		log.Printf("⚠️  POST search failed: %v, using sample cameras", err)
		return cs.getSampleCameras(), nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("⚠️  API returned status %d: %s, using sample cameras", resp.StatusCode, string(bodyBytes))
		return cs.getSampleCameras(), nil
	}

	var result struct {
		Cameras []CameraDevice `json:"cameras"`
		Data    []CameraDevice `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("⚠️  Failed to decode response: %v, using sample cameras", err)
		return cs.getSampleCameras(), nil
	}

	cameras := result.Cameras
	if len(cameras) == 0 {
		cameras = result.Data
	}

	if len(cameras) == 0 {
		log.Printf("⚠️  No cameras returned from API, using sample cameras")
		return cs.getSampleCameras(), nil
	}

	// Store cameras
	for i := range cameras {
		cs.cameras[cameras[i].ID] = &cameras[i]
	}

	log.Printf("✓ Searched and fetched %d cameras from Helios API", len(cameras))
	return cameras, nil
}

// getSampleCameras returns sample camera data for testing
func (cs *CameraService) getSampleCameras() []CameraDevice {
	sampleCameras := []CameraDevice{
		{
			ID:       "cam_001",
			Name:     "Entrance Gate",
			Location: "Main Entrance",
			Zone:     "Zone A",
			StreamURL: "http://localhost:8080/stream/1",
			Status:   "ONLINE",
			Type:     "4K PTZ",
		},
		{
			ID:       "cam_002",
			Name:     "Lobby Monitor",
			Location: "Building Lobby",
			Zone:     "Zone B",
			StreamURL: "http://localhost:8080/stream/2",
			Status:   "ONLINE",
			Type:     "1080p Fixed",
		},
		{
			ID:       "cam_003",
			Name:     "Parking Lot",
			Location: "Level 1 Parking",
			Zone:     "Zone C",
			StreamURL: "http://localhost:8080/stream/3",
			Status:   "ONLINE",
			Type:     "2MP Dome",
		},
		{
			ID:       "cam_004",
			Name:     "Conference Room",
			Location: "Building 2 - Floor 3",
			Zone:     "Zone D",
			StreamURL: "http://localhost:8080/stream/4",
			Status:   "ONLINE",
			Type:     "4K Fixed",
		},
	}

	// Store sample cameras
	for i := range sampleCameras {
		cs.cameras[sampleCameras[i].ID] = &sampleCameras[i]
	}

	log.Printf("✓ Loaded %d sample cameras (Helios API unavailable)", len(sampleCameras))
	return sampleCameras
}

// GetCameras returns all cached cameras
func (cs *CameraService) GetCameras() []CameraDevice {
	cameras := make([]CameraDevice, 0, len(cs.cameras))
	for _, cam := range cs.cameras {
		cameras = append(cameras, *cam)
	}
	return cameras
}

// GetCamera returns a specific camera by ID
func (cs *CameraService) GetCamera(cameraID string) *CameraDevice {
	return cs.cameras[cameraID]
}

// AddAlert adds a new alert for a camera
func (cs *CameraService) AddAlert(cameraID string, threatType string, confidence float64) CameraAlert {
	severity := "LOW"
	if confidence > 0.8 {
		severity = "HIGH"
	} else if confidence > 0.6 {
		severity = "MEDIUM"
	}

	camera := cs.cameras[cameraID]
	cameraName := cameraID
	if camera != nil {
		cameraName = camera.Name
	}

	alert := CameraAlert{
		ID:         cs.alertID,
		CameraID:   cameraID,
		CameraName: cameraName,
		Type:       threatType,
		Confidence: confidence,
		Timestamp:  time.Now(),
		Severity:   severity,
	}

	cs.alerts = append(cs.alerts, alert)
	cs.alertID++

	// Keep only last 100 alerts
	if len(cs.alerts) > 100 {
		cs.alerts = cs.alerts[len(cs.alerts)-100:]
	}

	return alert
}

// GetAlerts returns recent alerts
func (cs *CameraService) GetAlerts(limit int) []CameraAlert {
	if limit <= 0 || limit > len(cs.alerts) {
		return cs.alerts
	}
	return cs.alerts[len(cs.alerts)-limit:]
}

// ClearAlerts clears all alerts
func (cs *CameraService) ClearAlerts() {
	cs.alerts = make([]CameraAlert, 0)
}
