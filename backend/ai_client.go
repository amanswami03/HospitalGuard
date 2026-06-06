package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

// AIClient represents the client for the AI server
type AIClient struct {
	baseURL string
	client  *http.Client
}

// PredictionResponse from AI server
type PredictionResponse struct {
	Success     bool    `json:"success"`
	Class       int     `json:"class"`
	ClassName   string  `json:"class_name"`
	Confidence  float64 `json:"confidence"`
	Confidence2 string  `json:"confidence_percentage"`
	Error       string  `json:"error"`
}

// VideoPredictionResponse from AI server
type VideoPredictionResponse struct {
	Success                   bool    `json:"success"`
	Verdict                   string  `json:"verdict"`
	ViolenceDetected          int     `json:"violence_detected"`
	TotalSampled              int     `json:"total_sampled"`
	ViolencePercentage        float64 `json:"violence_percentage"`
	AverageConfidence         float64 `json:"average_confidence"`
	AverageConfidencePercent  string  `json:"average_confidence_percentage"`
	TotalFrames               int     `json:"total_frames"`
	FPS                       float64 `json:"fps"`
	Error                     string  `json:"error"`
}

// NewAIClient creates a new AI client
func NewAIClient(baseURL string) *AIClient {
	return &AIClient{
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 5 * time.Minute,
		},
	}
}

// TestConnection tests if AI server is reachable
func (ac *AIClient) TestConnection() error {
	resp, err := ac.client.Get(fmt.Sprintf("%s/api/health", ac.baseURL))
	if err != nil {
		return fmt.Errorf("connection failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	return nil
}

// PredictImage sends an image to the AI server for prediction
func (ac *AIClient) PredictImage(imagePath string) (*PredictionResponse, error) {
	// Open image file
	file, err := os.Open(imagePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open image: %w", err)
	}
	defer file.Close()

	// Create multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", "image.jpg")
	if err != nil {
		return nil, fmt.Errorf("failed to create form: %w", err)
	}

	_, err = io.Copy(part, file)
	if err != nil {
		return nil, fmt.Errorf("failed to write to form: %w", err)
	}

	writer.Close()

	// Send request
	req, err := http.NewRequest(
		http.MethodPost,
		fmt.Sprintf("%s/api/predict/image", ac.baseURL),
		body,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := ac.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Parse response
	var result *PredictionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if !result.Success && result.Error != "" {
		return nil, fmt.Errorf("AI error: %s", result.Error)
	}

	return result, nil
}

// PredictImageFromBytes sends image bytes to the AI server
func (ac *AIClient) PredictImageFromBytes(imageData []byte, filename string) (*PredictionResponse, error) {
	// Create multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, fmt.Errorf("failed to create form: %w", err)
	}

	_, err = part.Write(imageData)
	if err != nil {
		return nil, fmt.Errorf("failed to write to form: %w", err)
	}

	writer.Close()

	// Send request
	req, err := http.NewRequest(
		http.MethodPost,
		fmt.Sprintf("%s/api/predict/image", ac.baseURL),
		body,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := ac.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Parse response
	var result *PredictionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if !result.Success && result.Error != "" {
		return nil, fmt.Errorf("AI error: %s", result.Error)
	}

	return result, nil
}

// PredictVideo sends a video to the AI server for prediction
func (ac *AIClient) PredictVideo(videoPath string, sampleFrames int) (*VideoPredictionResponse, error) {
	// Open video file
	file, err := os.Open(videoPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open video: %w", err)
	}
	defer file.Close()

	// Create multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", "video.mp4")
	if err != nil {
		return nil, fmt.Errorf("failed to create form: %w", err)
	}

	_, err = io.Copy(part, file)
	if err != nil {
		return nil, fmt.Errorf("failed to write to form: %w", err)
	}

	// Add sample_frames parameter
	writer.WriteField("sample_frames", fmt.Sprintf("%d", sampleFrames))
	writer.Close()

	// Send request
	req, err := http.NewRequest(
		http.MethodPost,
		fmt.Sprintf("%s/api/predict/video", ac.baseURL),
		body,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := ac.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Parse response
	var result *VideoPredictionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if !result.Success && result.Error != "" {
		return nil, fmt.Errorf("AI error: %s", result.Error)
	}

	return result, nil
}

// PredictVideoFromBytes sends video bytes to the AI server
func (ac *AIClient) PredictVideoFromBytes(videoData []byte, filename string, sampleFrames int) (*VideoPredictionResponse, error) {
	// Create multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, fmt.Errorf("failed to create form: %w", err)
	}

	_, err = part.Write(videoData)
	if err != nil {
		return nil, fmt.Errorf("failed to write to form: %w", err)
	}

	// Add sample_frames parameter
	writer.WriteField("sample_frames", fmt.Sprintf("%d", sampleFrames))
	writer.Close()

	// Send request
	req, err := http.NewRequest(
		http.MethodPost,
		fmt.Sprintf("%s/api/predict/video", ac.baseURL),
		body,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := ac.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Parse response
	var result *VideoPredictionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if !result.Success && result.Error != "" {
		return nil, fmt.Errorf("AI error: %s", result.Error)
	}

	return result, nil
}
