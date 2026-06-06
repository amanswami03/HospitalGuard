package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// User represents a user account
type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Hospital  string    `json:"hospital"`
	Number    string    `json:"number"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// AuthRequest for login/signup
type AuthRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Hospital string `json:"hospital"`
	Number   string `json:"number"`
	Role     string `json:"role"`
}

// AuthResponse returns user token and info
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
	Error string `json:"error,omitempty"`
}

// LoginHandler handles POST /api/auth/login
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	var req AuthRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Email and password required",
		})
		return
	}

	// Find user by email
	var user User
	var hashedPassword string

	query := `SELECT id, name, email, hospital, number, role, created_at FROM users WHERE email = $1`
	err = db.conn.QueryRow(query, req.Email).Scan(
		&user.ID, &user.Name, &user.Email, &user.Hospital, &user.Number, &user.Role, &user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid email or password",
			})
			return
		}
		log.Printf("❌ Database error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Database error",
		})
		return
	}

	// Get password hash
	queryPass := `SELECT password FROM users WHERE email = $1`
	err = db.conn.QueryRow(queryPass, req.Email).Scan(&hashedPassword)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Database error",
		})
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password))
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid email or password",
		})
		return
	}

	// Generate JWT token
	token, err := generateToken(user.ID, user.Email)
	if err != nil {
		log.Printf("❌ Token generation error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to generate token",
		})
		return
	}

	log.Printf("✓ User logged in: %s (%s)", user.Email, user.Name)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(AuthResponse{
		Token: token,
		User:  user,
	})
}

// SignupHandler handles POST /api/auth/signup
func SignupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	var req AuthRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" || req.Name == "" || req.Hospital == "" || req.Number == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "All fields required",
		})
		return
	}

	if len(req.Password) < 8 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Password must be at least 8 characters",
		})
		return
	}

	// Set default role if not provided
	if req.Role == "" {
		req.Role = "user"
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ Password hashing error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to create account",
		})
		return
	}

	// Insert user into database
	var userID int
	query := `
		INSERT INTO users (name, email, password, hospital, number, role)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`

	createdAt := time.Now()
	err = db.conn.QueryRow(
		query,
		req.Name,
		req.Email,
		string(hashedPassword),
		req.Hospital,
		req.Number,
		req.Role,
	).Scan(&userID, &createdAt)

	if err != nil {
		if err.Error() == "pq: duplicate key value violates unique constraint \"users_email_key\"" {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Email already registered",
			})
			return
		}
		log.Printf("❌ Database error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to create account",
		})
		return
	}

	// Create user object for response
	user := User{
		ID:        userID,
		Name:      req.Name,
		Email:     req.Email,
		Hospital:  req.Hospital,
		Number:    req.Number,
		Role:      req.Role,
		CreatedAt: createdAt,
	}

	// Generate JWT token
	token, err := generateToken(user.ID, user.Email)
	if err != nil {
		log.Printf("❌ Token generation error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to generate token",
		})
		return
	}

	log.Printf("✓ New user registered: %s (%s) - Employee: %s", user.Email, user.Name, user.Number)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(AuthResponse{
		Token: token,
		User:  user,
	})
}

// generateToken creates a JWT token
func generateToken(userID int, email string) (string, error) {
	// Get JWT secret from config
	config := LoadConfig()
	if config.JWTSecret == "" {
		config.JWTSecret = "your-secret-key-change-in-production"
	}

	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// VerifyToken verifies a JWT token
func VerifyToken(tokenString string) (int, error) {
	config := LoadConfig()
	if config.JWTSecret == "" {
		config.JWTSecret = "your-secret-key-change-in-production"
	}

	token, err := jwt.ParseWithClaims(tokenString, jwt.MapClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(config.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return 0, fmt.Errorf("invalid token")
	}

	claims := token.Claims.(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))
	return userID, nil
}
