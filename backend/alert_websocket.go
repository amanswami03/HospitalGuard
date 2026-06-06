package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// AlertWebSocketHub manages WebSocket connections for live camera alerts
type AlertWebSocketHub struct {
	clients   map[*AlertWebSocketClient]bool
	broadcast chan *CameraAlert
	register  chan *AlertWebSocketClient
	mu        sync.RWMutex
}

// AlertWebSocketClient represents a WebSocket client connection
type AlertWebSocketClient struct {
	conn *websocket.Conn
	send chan *CameraAlert
}

var alertHub *AlertWebSocketHub

// InitAlertHub initializes the alert WebSocket hub
func InitAlertHub() {
	alertHub = &AlertWebSocketHub{
		clients:   make(map[*AlertWebSocketClient]bool),
		broadcast: make(chan *CameraAlert, 256),
		register:  make(chan *AlertWebSocketClient),
	}

	go alertHub.run()
}

// run manages the hub
func (h *AlertWebSocketHub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("✓ Alert WebSocket client connected. Total clients: %d", len(h.clients))

		case alert := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- alert:
				default:
					// Client send channel full, close it
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastAlert broadcasts an alert to all connected clients
func BroadcastAlert(alert *CameraAlert) {
	if alertHub != nil {
		select {
		case alertHub.broadcast <- alert:
		default:
			log.Println("Alert broadcast channel full")
		}
	}
}

// NewAlertWebSocketHandler creates a WebSocket handler for live alerts
func NewAlertWebSocketHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("Alert WebSocket upgrade error: %v", err)
			return
		}

		client := &AlertWebSocketClient{
			conn: conn,
			send: make(chan *CameraAlert, 256),
		}

		alertHub.register <- client

		// Start sending alerts to client
		go func() {
			defer func() {
				alertHub.mu.Lock()
				delete(alertHub.clients, client)
				alertHub.mu.Unlock()
				close(client.send)
			}()

			for alert := range client.send {
				if err := conn.WriteJSON(map[string]interface{}{
					"type":   "alert",
					"data":   alert,
					"timestamp": alert.Timestamp,
				}); err != nil {
					return
				}
			}
		}()

		// Read keep-alive messages from client
		go func() {
			for {
				var msg map[string]interface{}
				if err := conn.ReadJSON(&msg); err != nil {
					if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
						log.Printf("Alert WebSocket error: %v", err)
					}
					conn.Close()
					return
				}
				// Handle ping/keep-alive messages
				if msgType, ok := msg["type"].(string); ok && msgType == "ping" {
					conn.WriteJSON(map[string]string{"type": "pong"})
				}
			}
		}()
	}
}
