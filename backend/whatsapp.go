package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time"
)

// WhatsAppNotifier handles WhatsApp alert notifications
type WhatsAppNotifier struct {
	accountSID  string
	authToken   string
	fromNumber  string
	toNumber    string
}

// NewWhatsAppNotifier creates a new WhatsApp notifier
func NewWhatsAppNotifier(config *Config) *WhatsAppNotifier {
	if config.TwilioAccountSID == "" || config.TwilioAuthToken == "" {
		log.Println("⚠️  Twilio credentials not configured - WhatsApp alerts disabled")
		return nil
	}

	notifier := &WhatsAppNotifier{
		accountSID: config.TwilioAccountSID,
		authToken:  config.TwilioAuthToken,
		fromNumber: config.TwilioWhatsAppNum,
		toNumber:   config.WhatsAppRecipient,
	}

	log.Printf("✓ WhatsApp notifier initialized: %s → %s", notifier.fromNumber, notifier.toNumber)
	return notifier
}

// SendAlertNotification sends a WhatsApp alert message via Twilio API
func (w *WhatsAppNotifier) SendAlertNotification(alertType, cameraNumber string, severity string, confidence float64) error {
	if w == nil {
		return fmt.Errorf("WhatsApp notifier not initialized")
	}

	// Format timestamp
	currentTime := time.Now().Format("Jan 02, 2006 03:04:05 PM")

	// Build alert message
	message := fmt.Sprintf(
		"🚨 *ALERT DETECTED*\n\n"+
			"*Type:* %s\n"+
			"*Camera:* %s\n"+
			"*Severity:* %s\n"+
			"*Confidence:* %.1f%%\n"+
			"*Time:* %s\n\n"+
			"⚠️ Check dashboard for details.\n\n"+
			"#HospitalGuard #SecurityAlert",
		alertType, cameraNumber, severity, confidence*100, currentTime,
	)

	return w.sendMessage(message)
}

// SendWarningNotification sends a WhatsApp warning message
func (w *WhatsAppNotifier) SendWarningNotification(warningType, cameraNumber string, details string) error {
	if w == nil {
		return fmt.Errorf("WhatsApp notifier not initialized")
	}

	// Format timestamp
	currentTime := time.Now().Format("Jan 02, 2006 03:04:05 PM")

	// Build warning message
	message := fmt.Sprintf(
		"⚠️ *WARNING*\n\n"+
			"*Type:* %s\n"+
			"*Camera:* %s\n"+
			"*Details:* %s\n"+
			"*Time:* %s\n\n"+
			"Please review the incident.\n\n"+
			"#HospitalGuard #SecurityWarning",
		warningType, cameraNumber, details, currentTime,
	)

	return w.sendMessage(message)
}

// SendTestNotification sends a test WhatsApp message
func (w *WhatsAppNotifier) SendTestNotification() error {
	if w == nil {
		return fmt.Errorf("WhatsApp notifier not initialized")
	}

	message := fmt.Sprintf(
		"✅ *HospitalGuard Test Alert*\n\n"+
			"System is connected and working!\n"+
			"Alerts will arrive at this number when incidents are detected.\n\n"+
			"Time: %s",
		time.Now().Format("Jan 02, 2006 03:04:05 PM"),
	)

	return w.sendMessage(message)
}

// sendMessage is the core function that sends WhatsApp messages via Twilio REST API
func (w *WhatsAppNotifier) sendMessage(messageText string) error {
	// Twilioendpoint
	apiURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", w.accountSID)

	// Prepare request data
	data := url.Values{}
	data.Set("From", fmt.Sprintf("whatsapp:%s", w.fromNumber))
	data.Set("To", fmt.Sprintf("whatsapp:%s", w.toNumber))
	data.Set("Body", messageText)

	// Create POST request
	req, err := http.NewRequest("POST", apiURL, bytes.NewBufferString(data.Encode()))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(w.accountSID, w.authToken)

	// Send request
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("❌ Failed to send WhatsApp message: %v", err)
		return err
	}
	defer resp.Body.Close()

	// Parse response
	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	if resp.StatusCode >= 400 {
		errMsg := fmt.Sprintf("Twilio error: %s", string(body))
		log.Printf("❌ %s", errMsg)
		return fmt.Errorf(errMsg)
	}

	// Log success
	if sid, ok := result["sid"]; ok {
		log.Printf("✓ WhatsApp message sent: %v", sid)
	}

	return nil
}

// Global WhatsApp notifier instance
var whatsAppNotifier *WhatsAppNotifier

// InitWhatsApp initializes the global WhatsApp notifier
func InitWhatsApp(config *Config) {
	whatsAppNotifier = NewWhatsAppNotifier(config)
}

// GetWhatsAppNotifier returns the global notifier
func GetWhatsAppNotifier() *WhatsAppNotifier {
	return whatsAppNotifier
}
