#!/bin/bash
# Automated PR creation and merge script for Claude deployments
# Usage: ./scripts/create-pr.sh <GITHUB_TOKEN>

set -e

GITHUB_TOKEN=$1
REPO="iamfilip98/the-london-sudoku"
HEAD_BRANCH=$(git branch --show-current)
BASE_BRANCH="main"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GitHub token required"
  echo "Usage: ./scripts/create-pr.sh <GITHUB_TOKEN>"
  exit 1
fi

echo "🔍 Creating PR from $HEAD_BRANCH to $BASE_BRANCH..."

# Get latest commit info for PR body
COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_AUTHOR=$(git log -1 --pretty=%an)

# Create PR
PR_RESPONSE=$(curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/pulls" \
  -d "{
    \"title\": \"Phase 0 Month 1: Neon Database Migration\",
    \"head\": \"$HEAD_BRANCH\",
    \"base\": \"$BASE_BRANCH\",
    \"body\": \"## Phase 0 Month 1 Complete\n\n### Changes:\n- ✅ Neon database integration\n- ✅ Fixed test infrastructure\n- ✅ Input validation with Zod\n- ✅ Privacy Policy & Terms of Service\n- ✅ CI/CD Pipeline\n- ✅ Error monitoring (PostHog)\n- ✅ Database schema created\n- ✅ Migration scripts ready\n\n### Testing:\n- All non-API tests passing\n- Schema deployed to Neon\n- Environment variables configured\n\n### Next Steps:\n- Verify deployment\n- Test database connectivity\n- Create initial users\n\n---\n\nLatest commit by $COMMIT_AUTHOR:\n\`\`\`\n$COMMIT_MSG\n\`\`\`\"
  }")

# Extract PR number
PR_NUMBER=$(echo "$PR_RESPONSE" | grep -o '"number": [0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$PR_NUMBER" ]; then
  echo "❌ Failed to create PR"
  echo "$PR_RESPONSE"
  exit 1
fi

echo "✅ PR #$PR_NUMBER created successfully"
echo "🔗 https://github.com/$REPO/pull/$PR_NUMBER"

# Merge PR
echo ""
echo "🔄 Merging PR #$PR_NUMBER..."

MERGE_RESPONSE=$(curl -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/pulls/$PR_NUMBER/merge" \
  -d "{
    \"commit_title\": \"Merge PR #$PR_NUMBER: Phase 0 Month 1 - Neon Database Migration\",
    \"commit_message\": \"Automated merge by Claude deployment workflow\",
    \"merge_method\": \"merge\"
  }")

MERGE_STATUS=$(echo "$MERGE_RESPONSE" | grep -o '"merged": true')

if [ -z "$MERGE_STATUS" ]; then
  echo "❌ Failed to merge PR"
  echo "$MERGE_RESPONSE"
  exit 1
fi

echo "✅ PR #$PR_NUMBER merged successfully"
echo ""
echo "🚀 Deployment triggered! Vercel will auto-deploy to production."
echo ""
echo "📊 Check deployment status:"
echo "   - Vercel: https://vercel.com/dashboard"
echo "   - GitHub Actions: https://github.com/$REPO/actions"
