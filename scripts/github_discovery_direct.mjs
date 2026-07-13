import fs from 'fs/promises';
import crypto from 'crypto';
import https from 'https';

const APP_ID = process.env.GITHUB_APP_ID;
const INSTALLATION_ID = process.env.GITHUB_INSTALLATION_ID;
const PRIVATE_KEY_PATH = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
const OWNER = process.env.GITHUB_REPO_OWNER || 'jaja44-hub';
// Format: repo:branch,repo:branch or just repo for default branch
const REPOS = (process.env.GITHUB_REPO_LIST || 'gibi-sales,legal-commerce:jafer-legal-services').split(',').map((r) => {
  const parts = r.trim().split(':');
  return parts.length === 2 ? { repo: parts[0], branch: parts[1] } : { repo: parts[0], branch: null };
}).filter(Boolean);

if (!APP_ID || !INSTALLATION_ID || !PRIVATE_KEY_PATH) {
  throw new Error('Missing required env vars: GITHUB_APP_ID, GITHUB_INSTALLATION_ID, GITHUB_APP_PRIVATE_KEY_PATH');
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createJwt(privateKey) {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({ iat: now, exp: now + 540, iss: APP_ID }));
  const signed = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signed);
  signer.end();
  const signature = base64url(signer.sign(privateKey));
  return `${signed}.${signature}`;
}

function request(path, method = 'GET', token = null, body = null) {
  const payload = body ? JSON.stringify(body) : null;
  const headers = {
    'User-Agent': 'addis-crown-erp-connector/1.0',
    Accept: 'application/vnd.github+json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (payload) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(payload);
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          const status = res.statusCode || 0;
          if (status < 200 || status >= 300) {
            return reject(new Error(`GitHub API ${method} ${path} failed ${status}: ${data}`));
          }
          try {
            resolve(JSON.parse(data || '{}'));
          } catch (err) {
            reject(new Error(`GitHub API ${method} ${path} parse error: ${err.message}`));
          }
        });
      },
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getInstallationToken(privateKey) {
  const jwt = createJwt(privateKey);
  const response = await request(`/app/installations/${INSTALLATION_ID}/access_tokens`, 'POST', jwt);
  if (!response.token) throw new Error('Installation token not returned by GitHub');
  return response.token;
}

function buildCandidates(tree) {
  const candidates = {
    serviceFiles: [],
    apiFiles: [],
    configFiles: [],
    workflowFiles: [],
    readmeFiles: [],
    targetDirs: new Set(),
  };

  tree.forEach((entry) => {
    const path = entry.path;
    if (/\.(js|mjs|ts|tsx)$/.test(path)) {
      if (/\b(api|services|lib|backend|src)\b/i.test(path)) candidates.serviceFiles.push(path);
      if (/\bservice|gateway|adapter|logic|engine|oracles?\b/i.test(path)) candidates.serviceFiles.push(path);
    }
    if (/\b(github|vercel|docker|package\.json|vite\.config\.js|tsconfig\.json)\b/i.test(path)) candidates.configFiles.push(path);
    if (/^\.github\/workflows\//i.test(path)) candidates.workflowFiles.push(path);
    if (/^README(\.|$)/i.test(path)) candidates.readmeFiles.push(path);
    const top = path.split('/')[0];
    if (top) candidates.targetDirs.add(top);
  });

  return {
    serviceFiles: Array.from(new Set(candidates.serviceFiles)).slice(0, 50),
    configFiles: Array.from(new Set(candidates.configFiles)).slice(0, 50),
    workflowFiles: Array.from(new Set(candidates.workflowFiles)).slice(0, 50),
    readmeFiles: Array.from(new Set(candidates.readmeFiles)).slice(0, 20),
    topDirs: Array.from(candidates.targetDirs).sort(),
  };
}

async function scanRepo(owner, repo, token, branch = null) {
  const repoInfo = await request(`/repos/${owner}/${repo}`, 'GET', token);
  const targetBranch = branch || repoInfo.default_branch;
  const branchInfo = await request(`/repos/${owner}/${repo}/branches/${targetBranch}`, 'GET', token);
  const treeSha = branchInfo.commit.commit.tree.sha;
  const treeInfo = await request(`/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, 'GET', token);
  return {
    owner,
    repo,
    defaultBranch: repoInfo.default_branch,
    scannedBranch: targetBranch,
    treeSize: Array.isArray(treeInfo.tree) ? treeInfo.tree.length : 0,
    samplePaths: Array.isArray(treeInfo.tree) ? treeInfo.tree.slice(0, 20).map((item) => item.path) : [],
    candidates: Array.isArray(treeInfo.tree) ? buildCandidates(treeInfo.tree) : {},
  };
}

async function main() {
  const privateKey = await fs.readFile(PRIVATE_KEY_PATH, 'utf8');
  const token = await getInstallationToken(privateKey);
  const results = [];
  for (const { repo, branch } of REPOS) {
    const summary = await scanRepo(OWNER, repo, token, branch);
    results.push(summary);
  }
  console.log(JSON.stringify({ scannedAt: new Date().toISOString(), results }, null, 2));
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
