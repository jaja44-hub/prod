import fs from 'fs/promises';
import crypto from 'crypto';
import https from 'https';

const APP_ID = process.env.GITHUB_APP_ID;
const INSTALLATION_ID = process.env.GITHUB_INSTALLATION_ID;
const PRIVATE_KEY_PATH = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
const OWNER = process.env.GITHUB_REPO_OWNER || 'jaja44-hub';
const REPO = process.env.GITHUB_REPO || 'legal-commerce';

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
    'User-Agent': 'addis-crown-branch-checker/1.0',
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

async function main() {
  const privateKey = await fs.readFile(PRIVATE_KEY_PATH, 'utf8');
  const token = await getInstallationToken(privateKey);

  // list branches
  const branches = await request(`/repos/${OWNER}/${REPO}/branches`, 'GET', token);
  const branchNames = Array.isArray(branches) ? branches.map(b => b.name) : [];

  const results = [];
  for (const name of branchNames) {
    try {
      const branchInfo = await request(`/repos/${OWNER}/${REPO}/branches/${encodeURIComponent(name)}`, 'GET', token);
      const treeSha = branchInfo.commit?.commit?.tree?.sha || branchInfo.commit?.commit?.sha;
      if (!treeSha) {
        results.push({ branch: name, note: 'no tree SHA' });
        continue;
      }
      const treeInfo = await request(`/repos/${OWNER}/${REPO}/git/trees/${treeSha}?recursive=1`, 'GET', token);
      const tree = Array.isArray(treeInfo.tree) ? treeInfo.tree : [];
      results.push({ branch: name, treeSize: tree.length, sample: tree.slice(0,20).map(i=>i.path) });
    } catch (err) {
      results.push({ branch: name, error: err.message });
    }
  }

  console.log(JSON.stringify({ scannedAt: new Date().toISOString(), repo: `${OWNER}/${REPO}`, branches: results }, null, 2));
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
