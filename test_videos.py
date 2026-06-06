#!/usr/bin/env python3
"""
Test violence detection on videos
"""
import sys
from pathlib import Path

# Add AI module to path
sys.path.insert(0, str(Path(__file__).parent / "ai"))

from scripts.video_inference import VideoViolenceDetector
import os

# Video files to test
videos = [
    "/Users/amanswami/Desktop/NHH/048057717-maidan-riots-kiev-protesters-f.mp4",
    "/Users/amanswami/Desktop/NHH/117519535-istanbul-turkey-june-1-2013-hu.mp4",
    "/Users/amanswami/Desktop/NHH/126985517-izmir-turkey-1962-crowd-tries-.mp4",
    "/Users/amanswami/Desktop/NHH/221812620-street-fight-halloween-night-d.mp4",
]

# Model path
model_path = "/Users/amanswami/Desktop/NHH/ai/data/processed/resnet50_best.pth"

print("=" * 70)
print("🎬 VIOLENCE DETECTION VIDEO TEST")
print("=" * 70)
print()

# Initialize detector
print("📦 Loading model...")
detector = VideoViolenceDetector(model_path)
print()

# Test each video
for i, video_path in enumerate(videos, 1):
    if not os.path.exists(video_path):
        print(f"❌ Video {i}: {video_path}")
        print(f"   File not found!\n")
        continue
    
    print(f"🎥 Testing Video {i}: {Path(video_path).name}")
    print(f"   Path: {video_path}")
    
    try:
        # Run inference
        results = detector.detect_in_video(video_path, sample_frames=10)
        
        if results is None:
            print(f"   ❌ Could not process video\n")
            continue
        
        print(f"\n   ✓ Analysis Complete")
        print(f"   ├─ Total Frames: {results['total_frames']}")
        print(f"   ├─ Sampled Frames: {results['sampled_frames']}")
        print(f"   ├─ Violence Detected: {results['violence_detected']}")
        print(f"   ├─ Violence Percentage: {results['violence_percentage']:.1f}%")
        print(f"   ├─ Average Confidence: {results['average_confidence']:.4f}")
        print(f"   ├─ Verdict: {results['verdict']}")
        print(f"   └─ FPS: {results['fps']:.2f}")
        
        # Detailed results
        if results['violence_detected'] > 0:
            print(f"\n   ⚠️  VIOLENCE DETECTED IN {results['violence_detected']}/{results['sampled_frames']} FRAMES!")
            print(f"   Detailed frame-by-frame analysis:")
            for idx, pred in enumerate(results['predictions'], 1):
                status = "🔴" if pred['class'] == 1 else "🟢"
                print(f"      {status} Frame {pred['frame']} ({pred['timestamp']:.2f}s): {pred['class_name']} ({pred['confidence']:.2%})")
        else:
            print(f"\n   ✓ No violence detected")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()

print("=" * 70)
print("✓ Test Complete")
print("=" * 70)
