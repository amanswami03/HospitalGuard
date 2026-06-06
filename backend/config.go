package main

import (
	"log"
	"os"
	"strconv"
	"bufio"
	"strings"
)

// Config holds application configuration
type Config struct {
	Port         int
	AIServerURL  string
	HeliosAPIURL string
	Environment  string
	JWTSecret    string
	// PostgreSQL
	DBHost     string
	DBPort     int
	DBName     string
	DBUser     string
	DBPassword string
	// Twilio WhatsApp
	TwilioAccountSID   string
	TwilioAuthToken    string
	TwilioWhatsAppNum  string
	WhatsAppRecipient  string
}

// loadEnvFile loads environment variables from .env file
func loadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return // .env file not required
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" || strings.HasPrefix(line, "#") {
			continue
		}
		
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			if os.Getenv(key) == "" {
				os.Setenv(key, value)
			}
		}
	}
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	loadEnvFile(".env")

	config := &Config{
		Port:         getEnvInt("PORT", 8080),
		AIServerURL:  getEnv("AI_SERVER_URL", "http://localhost:5000"),
		HeliosAPIURL: getEnv("HELIOS_API_URL", "https://api.helios.earth"),
		Environment:  getEnv("ENVIRONMENT", "development"),
		JWTSecret:    getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		// PostgreSQL
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvInt("DB_PORT", 5432),
		DBName:     getEnv("DB_NAME", "nhh"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "1234"),
		// Twilio WhatsApp
		TwilioAccountSID:  getEnv("TWILIO_ACCOUNT_SID", ""),
		TwilioAuthToken:   getEnv("TWILIO_AUTH_TOKEN", ""),
		TwilioWhatsAppNum: getEnv("TWILIO_WHATSAPP_NUMBER", ""),
		WhatsAppRecipient: getEnv("WHATSAPP_RECIPIENT_NUMBER", ""),
	}

	log.Printf("✓ Config loaded: Port=%d, AI=%s, Env=%s, DB=%s@%s:%d", 
		config.Port, config.AIServerURL, config.Environment, config.DBUser, config.DBHost, config.DBPort)
	if config.TwilioAccountSID != "" {
		log.Printf("✓ Twilio WhatsApp configured: %s", config.TwilioWhatsAppNum)
	}
	
	return config
}

// Helper function to get env var as string
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Helper function to get env var as int
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
