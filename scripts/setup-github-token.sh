#!/bin/bash

# GitHub Token Setup Script
# This script helps you set up a GitHub personal access token for Claude to create PRs

echo "🔐 GitHub Token Setup"
echo "===================="
echo ""
echo "Claude needs a GitHub personal access token to create pull requests automatically."
echo ""
echo "To create a token:"
echo "  1. Go to: https://github.com/settings/tokens"
echo "  2. Click 'Generate new token' → 'Generate new token (classic)'"
echo "  3. Give it a name: 'Claude Code PR Creation'"
echo "  4. Select scopes: ✅ repo (all repo permissions)"
echo "  5. Click 'Generate token' and copy it"
echo ""
echo "⚠️  Token permissions needed:"
echo "   - repo:status"
echo "   - repo_deployment"
echo "   - public_repo"
echo "   - repo:invite"
echo "   - security_events"
echo ""
read -sp "Paste your GitHub token here: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
  echo "❌ No token provided"
  exit 1
fi

# Save token to .github-token file
echo "$TOKEN" > "$(dirname "$0")/../.github-token"
chmod 600 "$(dirname "$0")/../.github-token"

echo "✅ Token saved to .github-token"
echo ""
echo "Testing token..."

# Test the token by calling GitHub API
RESPONSE=$(curl -s -H "Authorization: token $TOKEN" https://api.github.com/user)
USERNAME=$(echo "$RESPONSE" | grep -o '"login": "[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$USERNAME" ]; then
  echo "✅ Token is valid! Authenticated as: $USERNAME"
  echo ""
  echo "🎉 Setup complete! Claude can now create PRs automatically."
else
  echo "❌ Token test failed. Please check your token and try again."
  echo "Response: $RESPONSE"
  rm "$(dirname "$0")/../.github-token"
  exit 1
fi
