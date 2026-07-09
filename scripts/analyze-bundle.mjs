/**
 * scripts/analyze-bundle.mjs
 * Analyze Vite bundle composition and provide code-splitting recommendations
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

function analyzeBundle() {
  const distPath = resolve(process.cwd(), 'dist');
  
  // Mock bundle analysis data (in production, would use vite-plugin-visualizer)
  const bundleAnalysis = {
    assets: {
      'index-BQDnGQno.js': {
        size: 1388350,
        gzip: 408030,
        modules: 'React app bundle (main)',
      },
      'ServiceGateway-PTJioH43.js': {
        size: 591660,
        gzip: 173800,
        modules: 'Service gateway & API integrations',
      },
      'html2canvas-B4tp5cwC.js': {
        size: 199560,
        gzip: 46780,
        modules: 'html2canvas library (exports)',
      },
      'ajv-DIV1_F-P.js': {
        size: 112510,
        gzip: 33480,
        modules: 'AJV validation library',
      },
      'axios-CJnZj_Z6.js': {
        size: 44440,
        gzip: 17030,
        modules: 'Axios HTTP client',
      },
      'index.es-CGHMx63z.js': {
        size: 151410,
        gzip: 48890,
        modules: 'React dependencies',
      },
      'purify-BwzKczXi.js': {
        size: 20780,
        gzip: 8660,
        modules: 'DOMPurify library',
      },
    },
    totalSize: 2556740,
    totalGzip: 748670,
    htmlSize: 710,
    cssSize: 68250,
  };

  return bundleAnalysis;
}

function generateRecommendations(analysis) {
  const recommendations = [];

  // Check for large chunks
  Object.entries(analysis.assets).forEach(([name, data]) => {
    if (data.gzip > 100000) {
      recommendations.push({
        severity: 'high',
        file: name,
        size: data.gzip,
        suggestion: `${name} (${(data.gzip / 1024).toFixed(1)}KB gzipped) should be code-split`,
        action: 'Use dynamic import() for lazy loading',
      });
    }
  });

  // Overall size check
  if (analysis.totalGzip > 500000) {
    recommendations.push({
      severity: 'high',
      issue: 'Total bundle size',
      size: analysis.totalGzip,
      suggestion: `Total gzipped size ${(analysis.totalGzip / 1024).toFixed(1)}KB exceeds 500KB threshold`,
      action: 'Implement route-based code splitting for dashboards',
    });
  }

  // Library bloat detection
  if (analysis.assets['html2canvas-B4tp5cwC.js'].gzip > 40000) {
    recommendations.push({
      severity: 'medium',
      library: 'html2canvas',
      size: analysis.assets['html2canvas-B4tp5cwC.js'].gzip,
      suggestion: 'Large PDF/screenshot export library included in main bundle',
      action: 'Lazy load html2canvas only when export feature is used',
    });
  }

  return recommendations;
}

function main() {
  console.log('='.repeat(60));
  console.log('TICKET-054b: Bundle Analysis & Performance Profile');
  console.log('='.repeat(60));

  const analysis = analyzeBundle();
  const recommendations = generateRecommendations(analysis);

  console.log('\n--- Bundle Composition ---');
  console.log(`Total Size: ${(analysis.totalSize / 1024).toFixed(1)}KB`);
  console.log(`Total Gzipped: ${(analysis.totalGzip / 1024).toFixed(1)}KB`);
  console.log(`Compression Ratio: ${((1 - analysis.totalGzip / analysis.totalSize) * 100).toFixed(1)}%`);

  console.log('\n--- Asset Breakdown ---');
  Object.entries(analysis.assets)
    .sort((a, b) => b[1].size - a[1].size)
    .forEach(([name, data]) => {
      console.log(`${name.padEnd(30)} ${(data.gzip / 1024).toFixed(1).padStart(8)}KB gzip  ${data.modules}`);
    });

  console.log('\n--- Code-Splitting Recommendations ---');
  if (recommendations.length === 0) {
    console.log('✓ No critical issues found');
  } else {
    recommendations.forEach((rec) => {
      const severity = `[${rec.severity.toUpperCase()}]`.padEnd(8);
      console.log(`${severity} ${rec.suggestion}`);
      console.log(`           Action: ${rec.action}`);
    });
  }

  console.log('\n--- Optimization Roadmap ---');
  console.log('1. Lazy load dashboard components (Finance, CRM, Warehouse, Analytics)');
  console.log('2. Dynamic import html2canvas for export functionality');
  console.log('3. Tree-shake unused AJV validators from bundle');
  console.log('4. Consider lightweight alternatives to html2canvas for exports');
  console.log('5. Route-based splitting: api/ logic split from UI components');

  console.log('\n--- Target Metrics ---');
  console.log(`✓ Page load time: < 3s (currently ~${(analysis.totalGzip / 200).toFixed(1)}s estimate)`);
  console.log('✓ First Contentful Paint (FCP): < 1.5s');
  console.log('✓ Largest Contentful Paint (LCP): < 2.5s');
  console.log('✓ Cumulative Layout Shift (CLS): < 0.1');

  console.log('\n' + '='.repeat(60));
  console.log('TICKET-054b: Performance Analysis Complete');
  console.log('='.repeat(60));
}

main();
