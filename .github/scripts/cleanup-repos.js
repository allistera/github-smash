#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DRY_RUN = process.env.DRY_RUN === 'true';

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function getCurrentUser() {
  const options = {
    hostname: 'api.github.com',
    path: '/user',
    method: 'GET',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'GitHub-Repo-Cleanup',
      'Accept': 'application/vnd.github.v3+json'
    }
  };

  const response = await makeRequest(options);
  return response.data.login;
}

async function getAllRepositories(username) {
  let allRepos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const options = {
      hostname: 'api.github.com',
      path: `/user/repos?per_page=${perPage}&page=${page}&affiliation=owner`,
      method: 'GET',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'GitHub-Repo-Cleanup',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const response = await makeRequest(options);
    const repos = response.data;

    if (repos.length === 0) break;

    allRepos = allRepos.concat(repos);

    if (repos.length < perPage) break;
    page++;
  }

  return allRepos;
}

async function deleteRepository(owner, repo) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}`,
    method: 'DELETE',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'GitHub-Repo-Cleanup',
      'Accept': 'application/vnd.github.v3+json'
    }
  };

  await makeRequest(options);
}

function parseYAML(content) {
  const lines = content.split('\n');
  const repositories = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') && !trimmed.startsWith('- username/')) {
      const repo = trimmed.substring(2).trim();
      if (repo && !repo.startsWith('#')) {
        repositories.push(repo);
      }
    }
  }

  return { repositories };
}

function loadWhitelist() {
  const whitelistPath = path.join(__dirname, '..', 'repo-whitelist.yml');

  if (!fs.existsSync(whitelistPath)) {
    console.error(`Error: Whitelist file not found at ${whitelistPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(whitelistPath, 'utf8');
  const config = parseYAML(content);

  return new Set(config.repositories.map(repo => repo.toLowerCase()));
}

async function main() {
  console.log('=== GitHub Repository Cleanup ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'DELETE'}`);
  console.log('');

  try {
    const username = await getCurrentUser();
    console.log(`Authenticated as: ${username}`);
    console.log('');

    console.log('Loading whitelist...');
    const whitelist = loadWhitelist();
    console.log(`Whitelist contains ${whitelist.size} repositories`);
    console.log('');

    console.log('Fetching all repositories...');
    const repos = await getAllRepositories(username);
    console.log(`Found ${repos.length} total repositories`);
    console.log('');

    const toDelete = [];
    const toKeep = [];

    for (const repo of repos) {
      const fullName = repo.full_name.toLowerCase();

      if (whitelist.has(fullName)) {
        toKeep.push(repo);
      } else {
        toDelete.push(repo);
      }
    }

    console.log('=== Summary ===');
    console.log(`Repositories to keep: ${toKeep.length}`);
    console.log(`Repositories to delete: ${toDelete.length}`);
    console.log('');

    if (toKeep.length > 0) {
      console.log('Keeping:');
      toKeep.forEach(repo => {
        console.log(`  ✓ ${repo.full_name} (${repo.private ? 'private' : 'public'})`);
      });
      console.log('');
    }

    if (toDelete.length === 0) {
      console.log('No repositories to delete.');
      return;
    }

    console.log('Will delete:');
    toDelete.forEach(repo => {
      console.log(`  ✗ ${repo.full_name} (${repo.private ? 'private' : 'public'})`);
    });
    console.log('');

    if (DRY_RUN) {
      console.log('DRY RUN: No repositories were deleted.');
      console.log('Set dry_run to "false" to actually delete these repositories.');
    } else {
      console.log('⚠️  DELETING REPOSITORIES...');
      console.log('');

      for (const repo of toDelete) {
        try {
          await deleteRepository(repo.owner.login, repo.name);
          console.log(`  ✓ Deleted: ${repo.full_name}`);
        } catch (error) {
          console.error(`  ✗ Failed to delete ${repo.full_name}: ${error.message}`);
        }
      }

      console.log('');
      console.log('Cleanup complete.');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
