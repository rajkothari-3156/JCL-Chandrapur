#!/bin/bash

# Script to check Redis data for JCL quizzes
# Usage: ./scripts/check-redis.sh [quiz-id]

QUIZ_ID=${1:-"jcl-quiz-2025-wk3"}

echo "=== Checking Redis Data for Quiz: $QUIZ_ID ==="
echo ""

# Check if REDIS_URL is set
if [ -z "$REDIS_URL" ]; then
    echo "❌ REDIS_URL environment variable is not set"
    echo "Please set it with: export REDIS_URL='your-redis-url'"
    exit 1
fi

echo "✅ REDIS_URL is set"
echo ""

# Install redis-cli if not available
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  redis-cli not found. Install it with:"
    echo "   macOS: brew install redis"
    echo "   Ubuntu: sudo apt-get install redis-tools"
    exit 1
fi

echo "=== Quiz Results ==="
redis-cli -u "$REDIS_URL" GET "quiz:${QUIZ_ID}:results" | jq '.'

echo ""
echo "=== Quiz Active Status ==="
redis-cli -u "$REDIS_URL" GET "quiz:${QUIZ_ID}:active"

echo ""
echo "=== All Quiz Keys ==="
redis-cli -u "$REDIS_URL" KEYS "quiz:${QUIZ_ID}:*"

echo ""
echo "=== Total Keys in Redis ==="
redis-cli -u "$REDIS_URL" DBSIZE
