#!/usr/bin/env node

/**
 * GitHub PR Creation Tool using Octokit
 * Allows Claude to create PRs programmatically
 *
 * Usage:
 *   node scripts/pr-create.js --title "PR Title" --body "PR Body" --head branch-name --base main
 *
 * Token can be provided via:
 *   1. --token argument
 *   2. GITHUB_TOKEN environment variable
 *   3. .github-token file in repo root
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    title: null,
    body: null,
    head: null,
    base: 'main',
    token: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--title':
        parsed.title = next;
        i++;
        break;
      case '--body':
        parsed.body = next;
        i++;
        break;
      case '--head':
        parsed.head = next;
        i++;
        break;
      case '--base':
        parsed.base = next;
        i++;
        break;
      case '--token':
        parsed.token = next;
        i++;
        break;
      case '--help':
      case '-h':
        parsed.help = true;
        break;
    }
  }

  return parsed;
}

// Get GitHub token from various sources
function getToken(cliToken) {
  // Priority 1: CLI argument
  if (cliToken) {
    return cliToken;
  }

  // Priority 2: Environment variable
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  // Priority 3: .github-token file
  const tokenFile = path.join(__dirname, '..', '.github-token');
  if (fs.existsSync(tokenFile)) {
    return fs.readFileSync(tokenFile, 'utf-8').trim();
  }

  return null;
}

// Save token to file for future use
function saveToken(token) {
  const tokenFile = path.join(__dirname, '..', '.github-token');
  fs.writeFileSync(tokenFile, token, { mode: 0o600 });
  console.log('✅ Token saved to .github-token for future use');
}

// Show usage help
function showHelp() {
  console.log(`
GitHub PR Creation Tool

Usage:
  node scripts/pr-create.js [options]

Options:
  --title <title>     PR title (required)
  --body <body>       PR body/description (required)
  --head <branch>     Head branch (source branch)
  --base <branch>     Base branch (default: main)
  --token <token>     GitHub personal access token
  --help, -h          Show this help message

Token Priority:
  1. --token argument
  2. GITHUB_TOKEN environment variable
  3. .github-token file in repo root

Examples:
  # Create PR with token argument
  node scripts/pr-create.js \\
    --title "feat: New Feature" \\
    --body "Description of changes" \\
    --head feature-branch \\
    --base main \\
    --token ghp_xxxxx

  # Create PR using saved token
  node scripts/pr-create.js \\
    --title "fix: Bug Fix" \\
    --body "Fixed the bug" \\
    --head bugfix-branch

  # Create PR using environment variable
  export GITHUB_TOKEN=ghp_xxxxx
  node scripts/pr-create.js \\
    --title "chore: Update" \\
    --body "Updates" \\
    --head update-branch
`);
}

// Get repository info from git
function getRepoInfo() {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();

    // Parse GitHub repo from URL
    // Format: http://...github.../owner/repo or git@github.com:owner/repo.git
    let match = remoteUrl.match(/[:/]([^/]+)\/([^/.]+)/);

    if (!match) {
      // Try alternate format
      match = remoteUrl.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
    }

    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace('.git', '')
      };
    }

    // Fallback to hardcoded values
    return {
      owner: 'iamfilip98',
      repo: 'the-london-sudoku'
    };
  } catch (error) {
    console.error('⚠️  Could not detect repository from git config, using defaults');
    return {
      owner: 'iamfilip98',
      repo: 'the-london-sudoku'
    };
  }
}

// Get current branch
function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch (error) {
    return null;
  }
}

// Main function
async function createPullRequest() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    return;
  }

  // Get token
  const token = getToken(args.token);

  if (!token) {
    console.error(`
❌ Error: GitHub token required

Please provide a token using one of these methods:
  1. --token argument
  2. GITHUB_TOKEN environment variable
  3. Create .github-token file

To create a GitHub token:
  1. Go to https://github.com/settings/tokens
  2. Click "Generate new token" → "Generate new token (classic)"
  3. Select scopes: repo (all)
  4. Copy the token and use it with this script

Use --help for more information.
`);
    process.exit(1);
  }

  // Save token if provided via CLI
  if (args.token && !fs.existsSync(path.join(__dirname, '..', '.github-token'))) {
    saveToken(token);
  }

  // Get repo info
  const { owner, repo } = getRepoInfo();

  // Set defaults
  if (!args.head) {
    args.head = getCurrentBranch();
    if (!args.head) {
      console.error('❌ Error: Could not detect current branch. Please specify --head');
      process.exit(1);
    }
    console.log(`ℹ️  Using current branch as head: ${args.head}`);
  }

  // Validate required fields
  if (!args.title || !args.body) {
    console.error('❌ Error: --title and --body are required');
    console.error('Use --help for more information');
    process.exit(1);
  }

  // Create Octokit instance
  const octokit = new Octokit({
    auth: token,
    request: {
      agent: process.env.https_proxy ? new (require('https-proxy-agent').HttpsProxyAgent)(process.env.https_proxy) : undefined
    }
  });

  try {
    console.log(`\n🔍 Creating PR...`);
    console.log(`   Repository: ${owner}/${repo}`);
    console.log(`   From: ${args.head}`);
    console.log(`   To: ${args.base}`);
    console.log(`   Title: ${args.title}`);
    console.log('');

    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: args.title,
      body: args.body,
      head: args.head,
      base: args.base
    });

    console.log(`✅ Pull Request created successfully!`);
    console.log(`\n📋 PR Details:`);
    console.log(`   Number: #${pr.number}`);
    console.log(`   URL: ${pr.html_url}`);
    console.log(`   State: ${pr.state}`);
    console.log('');
    console.log(`🔗 View PR: ${pr.html_url}`);
    console.log('');

    return pr;
  } catch (error) {
    console.error(`\n❌ Failed to create PR:`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message}`);
      if (error.response.data.errors) {
        console.error(`   Errors:`, JSON.stringify(error.response.data.errors, null, 2));
      }
    } else {
      console.error(`   Error: ${error.message}`);
    }
    console.error('');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createPullRequest().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { createPullRequest, parseArgs, getToken };
