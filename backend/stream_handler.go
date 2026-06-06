package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

// NewTestMJPEGStreamHandler creates a handler for test MJPEG streams
func NewTestMJPEGStreamHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		streamID := vars["id"]

		// Set MJPEG headers
		w.Header().Set("Content-Type", "multipart/x-mixed-replace; boundary=frame")
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
		w.Header().Set("Expires", "0")
		w.Header().Set("Pragma", "no-cache")

		// Stream frames continuously
		ticker := time.NewTicker(100 * time.Millisecond) // 10 FPS
		defer ticker.Stop()

		// Get the flusher to write data in chunks
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming not supported", http.StatusInternalServerError)
			return
		}

		log.Printf("📹 Test stream started: %s", streamID)

		for {
			select {
			case <-r.Context().Done():
				log.Printf("📹 Test stream ended: %s", streamID)
				return
			case <-ticker.C:
				// Generate a test frame
				frameData := generateTestFrame(streamID)

				// Write MJPEG frame boundary
				fmt.Fprintf(w, "--frame\r\n")
				fmt.Fprintf(w, "Content-Type: image/jpeg\r\n")
				fmt.Fprintf(w, "Content-Length: %d\r\n\r\n", len(frameData))
				w.Write(frameData)
				fmt.Fprintf(w, "\r\n")

				// Flush the data
				flusher.Flush()
			}
		}
	}
}

// generateTestFrame creates a test JPEG frame with camera info
func generateTestFrame(cameraID string) []byte {
	// Create a new image (640x480 for performance)
	width, height := 640, 480
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	// Fill with a gradient background
	gradientColor := func(y int) color.RGBA {
		// Create a blue-ish gradient
		intensity := uint8((y * 255) / height)
		return color.RGBA{
			R: intensity / 4,
			G: intensity / 3,
			B: 200 + intensity/2,
			A: 255,
		}
	}

	for y := 0; y < height; y++ {
		c := gradientColor(y)
		for x := 0; x < width; x++ {
			img.SetRGBA(x, y, c)
		}
	}

	// Add some random "details" to make it look like live activity
	for i := 0; i < 20; i++ {
		x := rand.Intn(width)
		y := rand.Intn(height)
		// Draw some rectangles
		for dx := -10; dx < 10; dx++ {
			for dy := -10; dy < 10; dy++ {
				if x+dx >= 0 && x+dx < width && y+dy >= 0 && y+dy < height {
					img.SetRGBA(x+dx, y+dy, color.RGBA{
						R: uint8(rand.Intn(255)),
						G: uint8(rand.Intn(255)),
						B: uint8(rand.Intn(100)),
						A: 200,
					})
				}
			}
		}
	}

	// Add timestamp text (simple representation)
	addText := func(img *image.RGBA, x, y int, text string) {
		// Draw text by creating white rectangles in the shape of characters
		// This is a simplified approach
		for i, c := range text {
			xx := x + i*8
			if c == ':' || c == '-' || c >= '0' && c <= '9' {
				// Draw simple white rectangles for numbers/colons/dashes
				for px := 0; px < 6; px++ {
					for py := 0; py < 10; py++ {
						if xx+px < width && y+py < height {
							img.SetRGBA(xx+px, y+py, color.RGBA{255, 255, 255, 255})
						}
					}
				}
			}
		}
	}

	// Add camera ID text
	timestamp := time.Now().Format("15:04:05")
	addText(img, 10, 20, "CAM:"+cameraID)
	addText(img, 10, 40, timestamp)

	// Add a moving box to simulate detection
	timeVal := time.Now().UnixNano() / int64(time.Millisecond)
	boxX := int((timeVal / 10) % int64(width-50))
	boxY := int((timeVal / 20) % int64(height-50))

	for bx := boxX; bx < boxX+50; bx++ {
		for by := boxY; by < boxY+50; by++ {
			if bx >= 0 && bx < width && by >= 0 && by < height {
				if bx == boxX || bx == boxX+49 || by == boxY || by == boxY+49 {
					img.SetRGBA(bx, by, color.RGBA{0, 255, 0, 255})
				}
			}
		}
	}

	// Encode to JPEG
	var buf bytes.Buffer
	jpeg.Encode(&buf, img, &jpeg.Options{Quality: 80})

	return buf.Bytes()
}

// OptimizedGenerateTestFrame creates a more realistic test frame
func OptimizedGenerateTestFrame(cameraID string) []byte {
	// For better performance, use a simpler approach
	width, height := 640, 480
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	// Simple color fill
	fillColor := color.RGBA{20, 30, 60, 255}
	for x := 0; x < width; x++ {
		for y := 0; y < height; y++ {
			img.SetRGBA(x, y, fillColor)
		}
	}

	// Add a simple border
	borderColor := color.RGBA{0, 180, 255, 255}
	for x := 0; x < width; x++ {
		img.SetRGBA(x, 10, borderColor)
		img.SetRGBA(x, height-10, borderColor)
	}
	for y := 0; y < height; y++ {
		img.SetRGBA(10, y, borderColor)
		img.SetRGBA(width-10, y, borderColor)
	}

	// Add center crosshair
	for i := -20; i < 20; i++ {
		x, y := width/2, height/2
		if x+i >= 0 && x+i < width {
			img.SetRGBA(x+i, y, color.RGBA{0, 255, 0, 255})
		}
		if y+i >= 0 && y+i < height {
			img.SetRGBA(x, y+i, color.RGBA{0, 255, 0, 255})
		}
	}

	// Encode to JPEG
	var buf bytes.Buffer
	opts := &jpeg.Options{Quality: 75}
	_ = jpeg.Encode(&buf, img, opts)

	return buf.Bytes()
}

// SerializeInt32 serializes an int32 to bytes (for potential binary formats)
func SerializeInt32(val int32) []byte {
	b := make([]byte, 4)
	binary.BigEndian.PutUint32(b, uint32(val))
	return b
}
