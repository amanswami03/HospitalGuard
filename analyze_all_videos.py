#!/usr/bin/env python3
"""
Comprehensive violence detection analysis for all 5 videos
"""
import sys
from pathlib import Path
import os
import json

# Add AI module to path
sys.path.insert(0, str(Path(__file__).parent / "ai"))

from ai.scripts.video_inference import VideoViolenceDetector

# All 5 videos
videos = [
    "/Users/amanswami/Desktop/NHH/048057717-maidan-riots-kiev-protesters-f.mp4",
    "/Users/amanswami/Desktop/NHH/10644471-uhd_2160_3840_24fps.mp4",
    "/Users/amanswami/Desktop/NHH/117519535-istanbul-turkey-june-1-2013-hu.mp4",
    "/Users/amanswami/Desktop/NHH/126985517-izmir-turkey-1962-crowd-tries-.mp4",
    "/Users/amanswami/Desktop/NHH/221812620-street-fight-halloween-night-d.mp4",
]

# Model path
model_path = "/Users/amanswami/Desktop/NHH/ai/data/processed/resnet50_best.pth"

print("=" * 80)
print(" " * 20 + "🎬 VIOLENCE DETECTION ANALYSIS - ALL 5 VIDEOS")
print("=" * 80)
print()

# Check if model exists
if not os.path.exists(model_path):
    print(f"❌ ERROR: Model not found at {model_path}")
    sys.exit(1)

# Initialize detector
print("📦 Loading ResNet50 Violence Detection Model...")
detector = VideoViolenceDetector(model_path)
print()

# Store all results for summary
all_results = []

# Test each video
for i, video_path in enumerate(videos, 1):
    print(f"\n{'─' * 80}")
    print(f"🎥 VIDEO {i}/5: {Path(video_path).name}")
    print(f"{'─' * 80}")
    
    if not os.path.exists(video_path):
        print(f"❌ File not found: {video_path}\n")
        continue
    
    try:
        # Run inference with 15 sample frames for thorough analysis
        results = detector.detect_in_video(video_path, sample_frames=15)
        
        if results is None:
            print(f"❌ Could not process this video\n")
            continue
        
        all_results.append(results)
        
        # Summary statistics
        print(f"\n   ✓ ANALYSIS COMPLETE")
        print(f"   ├─ Total Frames in Video: {results['total_frames']}")
        print(f"   ├─ Frames Analyzed: {results['sampled_frames']}")
        print(f"   ├─ Video Duration: {results['total_frames'] / results['fps']:.1f}s (@ {results['fps']:.2f} FPS)")
        print(f"   ├─ Violence Frames Detected: {results['violence_detected']}/{results['sampled_frames']}")
        print(f"   ├─ Violence Percentage: {results['violence_percentage']:.1f}%")
        print(f"   ├─ Average Confidence Score: {results['average_confidence']:.4f}")
        print(f"   └─ VERDICT: {results['verdict']}")
        
        # Detailed frame-by-frame analysis
        print(f"\n   📊 Frame-by-Frame Analysis:")
        violent_frames = [p for p in results['predictions'] if p['class'] == 1]
        peaceful_frames = [p for p in results['predictions'] if p['class'] == 0]
        
        print(f"   • Violent Frames ({len(violent_frames)}):")
        if violent_frames:
            for pred in violent_frames:
                print(f"     🔴 Frame {pred['frame']:5d} ({pred['timestamp']:6.2f}s): VIOLENCE ({pred['confidence']:.1%})")
        else:
            print(f"     (None)")
        
        print(f"\n   • Peaceful Frames ({len(peaceful_frames)}):")
        if peaceful_frames:
            for pred in peaceful_frames[:3]:  # Show first 3
                print(f"     🟢 Frame {pred['frame']:5d} ({pred['timestamp']:6.2f}s): No Violence ({pred['confidence']:.1%})")
            if len(peaceful_frames) > 3:
                print(f"     ... and {len(peaceful_frames)-3} more peaceful frames")
        else:
            print(f"     (None)")
        
    except Exception as e:
        print(f"❌ Error processing video: {e}")
        import traceback
        traceback.print_exc()

# Print comprehensive summary
print(f"\n\n{'=' * 80}")
print(" " * 25 + "📊 COMPREHENSIVE SUMMARY")
print(f"{'=' * 80}\n")

if all_results:
    summary_data = {
        'total_videos_processed': len(all_results),
        'videos': []
    }
    
    for i, result in enumerate(all_results, 1):
        video_name = Path(result['video']).name
        summary_data['videos'].append({
            'number': i,
            'name': video_name,
            'violence_percentage': result['violence_percentage'],
            'violence_frames': result['violence_detected'],
            'total_frames_analyzed': result['sampled_frames'],
            'verdict': result['verdict'].replace(' ⚠️', '').replace(' ✓', '')
        })
        
        status = "🔴 VIOLENCE" if result['violence_percentage'] > 50 else "🟢 SAFE"
        print(f"{i}. {video_name}")
        print(f"   Status: {status}")
        print(f"   Violence Score: {result['violence_percentage']:.1f}% ({result['violence_detected']}/{result['sampled_frames']} frames)")
        print()
    
    # Overall statistics
    total_violence_pct = sum(r['violence_percentage'] for r in all_results) / len(all_results)
    high_threat_videos = sum(1 for r in all_results if r['violence_percentage'] > 50)
    
    print(f"{'─' * 80}")
    print(f"📈 OVERALL STATISTICS:")
    print(f"   • Average Violence Score: {total_violence_pct:.1f}%")
    print(f"   • High Threat Videos (>50%): {high_threat_videos}/{len(all_results)}")
    print(f"   • Safe Videos: {len(all_results) - high_threat_videos}/{len(all_results)}")
    print(f"{'─' * 80}\n")
    
    # Save results to JSON
    output_file = "/Users/amanswami/Desktop/NHH/violence_detection_results.json"
    with open(output_file, 'w') as f:
        json.dump(summary_data, f, indent=2)
    print(f"✓ Results saved to: {output_file}")
    
else:
    print("❌ No videos were successfully processed")

print("\n" + "=" * 80)
print("✓ Analysis Complete")
print("=" * 80)
