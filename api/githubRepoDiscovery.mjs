import { getRepoTree } from './lib/githubAppClient.mjs';

const DEFAULT_REPOS = ['gibi-sales', 'legal-commerce'];
const REPO_OWNER = 'jaja44-hub';

function pathMatches(path, regex) {
  return regex.test(path);
}

function buildCandidateReport(tree) {
  const blobs = tree.filter((entry) => entry.type === 'blob');
  const topDirs = new Set();
  const candidateFiles = {
    serviceFiles: [],
    apiFiles: [],
    configFiles: [],
    workflowFiles: [],
    readmeFiles: [],
    moduleFiles: [],
    targetFiles: [],
  };

  blobs.forEach((entry) => {
    const path = entry.path;
    const firstSegment = path.split('/')[0];
    if (firstSegment) topDirs.add(firstSegment);

    if (pathMatches(path, /(^|\/)api\//i)) candidateFiles.apiFiles.push(path);
    if (pathMatches(path, /(^|\/)src\/.*(Service|service|Gateway|gateway|Logic|logic|Adapter|adapter)\.(js|mjs|ts|tsx)$/i)) {
      candidateFiles.serviceFiles.push(path);
    }
    if (pathMatches(path, /(^|\/)(package\.json|vercel\.json|vite\.config\.js|tsconfig\.json|dockerfile|\.github\/workflows\/.*\.(ya?ml))$/i)) {
      candidateFiles.configFiles.push(path);
    }
    if (pathMatches(path, /(^|\/)\.github\/workflows\//i)) candidateFiles.workflowFiles.push(path);
    if (pathMatches(path, /(^|\/)README(\.md|\.txt)?$/i)) candidateFiles.readmeFiles.push(path);
    if (pathMatches(path, /(gibi|legal|external|service|logic|gateway)/i)) candidateFiles.moduleFiles.push(path);
    if (pathMatches(path, /(lib|services|api|src|backend)\//i) && pathMatches(path, /\.(js|mjs|ts|tsx)$/i)) candidateFiles.targetFiles.push(path);
  });

  return {
    treeSize: blobs.length,
    topDirs: Array.from(topDirs).sort(),
    candidates: candidateFiles,
  };
}

function normalizeRepoList(reposQuery) {
  if (!reposQuery) return DEFAULT_REPOS;
  return String(reposQuery)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.GITHUB_REPO_DISCOVERY_SECRET;
  if (secret) {
    const headerSecret = req.headers['x-github-repo-discovery-secret'];
    if (!headerSecret || headerSecret !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const repos = normalizeRepoList(req.query?.repos);
  if (!repos.length) {
    return res.status(400).json({ error: 'No repositories requested' });
  }

  try {
    const promises = repos.map(async (repo) => {
      const { owner, repo: repoName, defaultBranch, tree } = await getRepoTree(REPO_OWNER, repo);
      return {
        owner,
        repo: repoName,
        defaultBranch,
        report: buildCandidateReport(tree),
      };
    });
    const results = await Promise.all(promises);
    return res.status(200).json({ scannedAt: new Date().toISOString(), results });
  } catch (error) {
    console.error('[githubRepoDiscovery] Error', error);
    return res.status(500).json({ error: error.message || 'Failed to scan repositories' });
  }
}
