import { getRepoTree } from '../api/lib/githubAppClient.mjs';

const owner = 'jaja44-hub';
const repos = ['gibi-sales', 'legal-commerce'];

async function main() {
  try {
    for (const repo of repos) {
      console.log(`Scanning ${owner}/${repo}...`);
      const result = await getRepoTree(owner, repo);
      console.log(`  defaultBranch: ${result.defaultBranch}`);
      console.log(`  files in tree: ${result.tree.length}`);
      const sample = result.tree.slice(0, 12).map((entry) => entry.path);
      console.log('  sample:', sample.join('\n    '));
      console.log('');
    }
  } catch (error) {
    console.error('GitHub repo discovery failed:', error.message);
    process.exit(1);
  }
}

main();
