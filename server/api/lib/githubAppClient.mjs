import { Octokit } from '@octokit/core';
import { createAppAuth } from '@octokit/auth-app';

const APP_ID = Number(process.env.GITHUB_APP_ID || '');
const INSTALLATION_ID = Number(process.env.GITHUB_INSTALLATION_ID || '');
const PRIVATE_KEY_RAW = process.env.GITHUB_APP_PRIVATE_KEY || '';
const PRIVATE_KEY = PRIVATE_KEY_RAW.includes('-----BEGIN') ? PRIVATE_KEY_RAW : PRIVATE_KEY_RAW.replace(/\\n/g, '\n');

function requireEnv(name, value) {
  if (!value || value === 'undefined') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAppAuth() {
  requireEnv('GITHUB_APP_ID', APP_ID);
  requireEnv('GITHUB_INSTALLATION_ID', INSTALLATION_ID);
  requireEnv('GITHUB_APP_PRIVATE_KEY', PRIVATE_KEY);

  return createAppAuth({
    appId: APP_ID,
    privateKey: PRIVATE_KEY,
  });
}

let cachedOctokit = null;
export async function getInstallationOctokit() {
  if (cachedOctokit) return cachedOctokit;

  const auth = getAppAuth();
  const installationAuth = await auth({ type: 'installation', installationId: INSTALLATION_ID });
  if (!installationAuth?.token) {
    throw new Error('GitHub App installation auth did not return a token');
  }

  cachedOctokit = new Octokit({ auth: installationAuth.token });
  return cachedOctokit;
}

export async function getRepositoryInfo(owner, repo) {
  const octokit = await getInstallationOctokit();
  const response = await octokit.request('GET /repos/{owner}/{repo}', { owner, repo });
  return response.data;
}

export async function getRepoTree(owner, repo, branch = undefined) {
  const repoInfo = await getRepositoryInfo(owner, repo);
  const ref = branch || repoInfo.default_branch;
  const octokit = await getInstallationOctokit();

  let treeBaseSha = ref;
  if (!/^[0-9a-f]{40}$/i.test(ref)) {
    const branchResp = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
      owner,
      repo,
      branch: ref,
    });
    treeBaseSha = branchResp?.data?.commit?.commit?.tree?.sha || branchResp?.data?.commit?.sha || ref;
  }

  const treeResponse = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
    owner,
    repo,
    tree_sha: treeBaseSha,
    recursive: '1',
  });
  if (!treeResponse?.data?.tree) {
    throw new Error(`Failed to load repository tree for ${owner}/${repo}@${ref}`);
  }
  return {
    owner,
    repo,
    defaultBranch: ref,
    tree: treeResponse.data.tree.map((entry) => ({
      path: entry.path,
      type: entry.type,
      mode: entry.mode,
      sha: entry.sha,
    })),
  };
}
