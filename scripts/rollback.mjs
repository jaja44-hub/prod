#!/usr/bin/env node

/**
 * scripts/rollback.mjs
 * Emergency rollback procedure for production deployments
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function getPreviousTag() {
  try {
    return execSync('git describe --tags --abbrev=0 HEAD~1', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function performRollback(targetTag) {
  console.log(`\n=== Production Rollback Procedure ===\n`);

  if (!targetTag) {
    console.error('✗ No rollback target specified');
    process.exit(1);
  }

  try {
    console.log(`1. Current HEAD: ${execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()}`);
    console.log(`2. Rolling back to: ${targetTag}`);

    // Create rollback checkpoint
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const checkpointTag = `rollback-checkpoint-${timestamp}`;
    execSync(`git tag -a ${checkpointTag} -m "Rollback checkpoint before reverting to ${targetTag}"`, { stdio: 'inherit' });
    console.log(`3. ✓ Checkpoint created: ${checkpointTag}`);

    // Checkout target commit
    execSync(`git checkout ${targetTag}`, { stdio: 'inherit' });
    console.log(`4. ✓ Checked out: ${targetTag}`);

    // Force push to main
    console.log(`5. Force pushing to main (this will trigger Vercel re-deployment)...`);
    execSync(`git push -f origin main`, { stdio: 'inherit' });
    console.log(`6. ✓ Pushed to origin/main`);

    console.log(`\n✓ Rollback Complete`);
    console.log(`  - Previous version: ${targetTag}`);
    console.log(`  - Checkpoint saved: ${checkpointTag}`);
    console.log(`  - Vercel will auto-deploy from ${targetTag}`);
    console.log(`  - Monitor at: https://vercel.com/dashboard`);

    // Show recovery commands
    console.log(`\nRecovery Commands:`);
    console.log(`  # If you need to go back further:`);
    console.log(`  git checkout ${getPreviousTag() || 'v<version>'}`);
    console.log(`  git push -f origin main`);
    console.log(`\n  # To view rollback history:`);
    console.log(`  git log --oneline --decorate | grep rollback-checkpoint`);

  } catch (err) {
    console.error(`✗ Rollback failed: ${err.message}`);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Show available tags
    console.log('\n=== Available Rollback Targets ===\n');

    try {
      const allTags = execSync('git tag -l --sort=-version:refname | head -5', { encoding: 'utf-8' });
      if (allTags) {
        console.log('Recent Tags:');
        allTags.split('\n').forEach((tag) => {
          if (tag) console.log(`  - ${tag}`);
        });
      }
    } catch {
      console.log('No tags found');
    }

    const latestTag = getLatestTag();
    const previousTag = getPreviousTag();

    console.log('\nUsage:');
    console.log(`  node scripts/rollback.mjs ${latestTag || 'v1.0.0'}     # Rollback to specific tag`);
    console.log(`  node scripts/rollback.mjs --auto              # Rollback to previous tag`);

    if (previousTag) {
      console.log(`\nQuick Rollback:`);
      console.log(`  node scripts/rollback.mjs ${previousTag}`);
    }

    process.exit(0);
  }

  if (args[0] === '--auto') {
    const previousTag = getPreviousTag();
    if (!previousTag) {
      console.error('✗ No previous tag found for automatic rollback');
      process.exit(1);
    }
    performRollback(previousTag);
  } else {
    performRollback(args[0]);
  }
}

main();
