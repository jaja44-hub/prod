#!/usr/bin/env node

/**
 * scripts/detect-serverless-functions.mjs
 * Test script to detect potential serverless functions that might leak to Vercel deployment
 * Scans for .js files in api/ directories and checks .vercelignore coverage
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Read .vercelignore file
function readVercelIgnore() {
  const ignorePath = join(projectRoot, '.vercelignore');
  if (!existsSync(ignorePath)) {
    return [];
  }
  
  const content = readFileSync(ignorePath, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.replace(/^\//, '')); // Remove leading slash
}

// Recursively find all .js files in a directory
function findJsFiles(dir, baseDir = dir) {
  const files = [];
  
  function scan(currentDir) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules
        if (entry.name === 'node_modules') continue;
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const relativePath = fullPath.replace(baseDir + '/', '');
        files.push(relativePath);
      }
    }
  }
  
  scan(dir);
  return files;
}

// Check if a path is ignored by .vercelignore
function isIgnored(path, ignorePatterns) {
  for (const pattern of ignorePatterns) {
    // Exact match
    if (path === pattern) return true;
    
    // Directory prefix match
    if (path.startsWith(pattern + '/')) return true;
    
    // Wildcard match (simple)
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(path)) return true;
    }
  }
  return false;
}

// Main detection logic
function detectServerlessFunctions() {
  console.log('🔍 Scanning for potential serverless functions...\n');
  
  const ignorePatterns = readVercelIgnore();
  console.log(`📋 .vercelignore patterns (${ignorePatterns.length}):`);
  ignorePatterns.forEach(p => console.log(`   - ${p}`));
  console.log();
  
  // Scan api/ directories
  const apiDirs = [
    join(projectRoot, 'api'),
    join(projectRoot, 'server', 'api'),
    join(projectRoot, 'odoo-backend', 'odoo', 'api'),
  ];
  
  let totalFunctions = 0;
  let ignoredFunctions = 0;
  let leakedFunctions = [];
  
  for (const apiDir of apiDirs) {
    if (!existsSync(apiDir)) {
      console.log(`⏭️  Skipping ${apiDir.replace(projectRoot, '')} (not found)`);
      continue;
    }
    
    const relativeDir = apiDir.replace(projectRoot, '');
    console.log(`\n📁 Scanning ${relativeDir}:`);
    
    const jsFiles = findJsFiles(apiDir, projectRoot);
    totalFunctions += jsFiles.length;
    
    console.log(`   Found ${jsFiles.length} .js files`);
    
    for (const file of jsFiles) {
      const ignored = isIgnored(file, ignorePatterns);
      if (ignored) {
        ignoredFunctions++;
        console.log(`   ✅ ${file} (ignored)`);
      } else {
        leakedFunctions.push(file);
        console.log(`   ❌ ${file} (LEAKED - will be deployed!)`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total .js files in api/ directories: ${totalFunctions}`);
  console.log(`Ignored by .vercelignore: ${ignoredFunctions}`);
  console.log(`LEAKED (will be deployed): ${leakedFunctions.length}`);
  
  if (leakedFunctions.length > 0) {
    console.log('\n⚠️  LEAKED FUNCTIONS (will be deployed to Vercel):');
    leakedFunctions.forEach(f => console.log(`   - ${f}`));
    console.log(`\nServerless functions to deploy: ${leakedFunctions.length}`);
    if (leakedFunctions.length <= 12) {
      console.log('✅ PASSED: Within Vercel free plan limit (≤ 12)');
    } else {
      console.log('❌ FAILED: Exceeds Vercel free plan limit (≤ 12)');
      process.exit(1);
    }
  } else {
    console.log('\n✅ PASSED: All api/ files are properly ignored');
    console.log(`   Serverless functions to deploy: ${totalFunctions - ignoredFunctions}`);
    if (totalFunctions - ignoredFunctions <= 12) {
      console.log('   Within Vercel free plan limit (≤ 12)');
    } else {
      console.log('   ⚠️  WARNING: Exceeds Vercel free plan limit (≤ 12)');
      process.exit(1);
    }
  }
}

detectServerlessFunctions();
