#!/bin/bash
# IndexNow: Notify Bing/Yandex of updated URLs after deploy
# ChatGPT uses Bing → IndexNow = instant ChatGPT visibility

set -euo pipefail

INDEXNOW_KEY="${INDEXNOW_KEY:-426a67efe405494f9da92670749a0f86}"
HOST="${SITE_HOST:-typelessity.com}"
KEY_LOCATION="https://${HOST}/${INDEXNOW_KEY}.txt"

echo "Submitting URLs to IndexNow..."
echo "Host: ${HOST}"
echo "Key location: ${KEY_LOCATION}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "'"${HOST}"'",
    "key": "'"${INDEXNOW_KEY}"'",
    "keyLocation": "'"${KEY_LOCATION}"'",
    "urlList": [
      "https://'"${HOST}"'/",
      "https://'"${HOST}"'/for-ai-agents"
    ]
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 202 ]; then
  echo "IndexNow submission successful (HTTP ${HTTP_CODE})"
else
  echo "IndexNow submission failed (HTTP ${HTTP_CODE}): ${BODY}"
  exit 1
fi
