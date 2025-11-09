#!/usr/bin/env node

/**
 * GitHub PR Creation Helper
 * Uses the local git proxy to create pull requests
 */

const http = require('http');
const { execSync } = require('child_process');

function createPR(options) {
  const { title, head, base, body } = options;

  // Try to create PR through git proxy
  const data = JSON.stringify({
    title,
    head,
    base,
    body
  });

  const proxyUrl = 'http://127.0.0.1:59655';
  const paths = [
    '/api/github/pulls',
    '/github/pulls',
    '/api/pr',
    '/pr/create',
    '/pulls/create'
  ];

  console.log('Attempting to create PR through git proxy...');

  for (const path of paths) {
    try {
      const options = {
        hostname: '127.0.0.1',
        port: 59655,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          console.log(`Path ${path}: Status ${res.statusCode}`);
          console.log(`Response: ${responseData}`);
        });
      });

      req.on('error', (error) => {
        console.log(`Path ${path}: Error - ${error.message}`);
      });

      req.write(data);
      req.end();

      // Wait a bit for response
      execSync('sleep 0.5');
    } catch (e) {
      console.log(`Path ${path}: Exception - ${e.message}`);
    }
  }
}

// Get PR details from command line
const args = process.argv.slice(2);
if (args.length < 4) {
  console.log('Usage: node .github-cli-helper.js <title> <head> <base> <body>');
  process.exit(1);
}

createPR({
  title: args[0],
  head: args[1],
  base: args[2],
  body: args[3]
});
