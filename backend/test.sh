#!/bin/bash

# NHH Backend API Testing Script

echo "🧪 NHH Backend API Tests"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:8080"

# Test 1: Health Check
echo -e "${GREEN}Test 1: Health Check${NC}"
curl -s $API_URL/api/health | jq .
echo ""

# Test 2: Get Statistics (before any predictions)
echo -e "${GREEN}Test 2: Get Statistics${NC}"
curl -s $API_URL/api/stats | jq .
echo ""

# Test 3: Get History (before any predictions)
echo -e "${GREEN}Test 3: Get History${NC}"
curl -s $API_URL/api/history | jq .
echo ""

# Test 4: Image Prediction (if test image exists)
if [ -f "test_image.jpg" ]; then
    echo -e "${GREEN}Test 4: Image Prediction${NC}"
    curl -s -X POST -F "file=@test_image.jpg" $API_URL/api/predict/image | jq .
    echo ""
else
    echo -e "${RED}Test 4: Skipped (test_image.jpg not found)${NC}"
    echo ""
fi

# Test 5: Video Prediction (if test video exists)
if [ -f "test_video.mp4" ]; then
    echo -e "${GREEN}Test 5: Video Prediction${NC}"
    curl -s -X POST -F "file=@test_video.mp4" -F "sample_frames=3" $API_URL/api/predict/video | jq .
    echo ""
else
    echo -e "${RED}Test 5: Skipped (test_video.mp4 not found)${NC}"
    echo ""
fi

# Test 6: Get Statistics (after predictions)
echo -e "${GREEN}Test 6: Get Statistics (Updated)${NC}"
curl -s $API_URL/api/stats | jq .
echo ""

# Test 7: Get History (after predictions)
echo -e "${GREEN}Test 7: Get History (Updated)${NC}"
curl -s $API_URL/api/history | jq .
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
