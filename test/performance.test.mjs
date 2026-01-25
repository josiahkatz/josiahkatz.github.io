/**
 * Performance Testing with Lighthouse
 *
 * Run this script to generate a performance report.
 * Usage: npm run test:perf
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_URL = 'http://127.0.0.1:8788';
const REPORTS_DIR = path.join(__dirname, '../lighthouse-reports');

// Lighthouse configuration
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

async function runLighthouse() {
  console.log('🚀 Starting Lighthouse performance test...\n');
  console.log(`📊 Testing URL: ${TEST_URL}`);
  console.log('⚠️  Make sure your dev server is running: npm run serve\n');

  // Create reports directory if it doesn't exist
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  let chrome;
  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

    // Run Lighthouse
    const runnerResult = await lighthouse(TEST_URL, {
      port: chrome.port,
      output: ['html', 'json'],
    }, config);

    // Generate timestamp for file names
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    // Save HTML report
    const htmlReportPath = path.join(REPORTS_DIR, `report-${timestamp}.html`);
    fs.writeFileSync(htmlReportPath, runnerResult.report[0]);

    // Save JSON report
    const jsonReportPath = path.join(REPORTS_DIR, `report-${timestamp}.json`);
    fs.writeFileSync(jsonReportPath, runnerResult.report[1]);

    // Extract key metrics
    const { lhr } = runnerResult;
    const metrics = lhr.audits.metrics.details.items[0];

    console.log('✅ Lighthouse test complete!\n');
    console.log('📈 Performance Metrics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Performance Score: ${Math.round(lhr.categories.performance.score * 100)}/100`);
    console.log(`   First Contentful Paint: ${Math.round(metrics.firstContentfulPaint)}ms`);
    console.log(`   Largest Contentful Paint: ${Math.round(metrics.largestContentfulPaint)}ms`);
    console.log(`   Total Blocking Time: ${Math.round(metrics.totalBlockingTime)}ms`);
    console.log(`   Cumulative Layout Shift: ${metrics.cumulativeLayoutShift.toFixed(3)}`);
    console.log(`   Speed Index: ${Math.round(metrics.speedIndex)}ms`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show key opportunities
    const opportunities = Object.values(lhr.audits)
      .filter(audit => audit.score !== null && audit.score < 1 && audit.details?.overallSavingsMs > 100)
      .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
      .slice(0, 5);

    if (opportunities.length > 0) {
      console.log('💡 Top Improvement Opportunities:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      opportunities.forEach((audit, i) => {
        console.log(`   ${i + 1}. ${audit.title}`);
        console.log(`      Potential savings: ${Math.round(audit.details.overallSavingsMs)}ms`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    console.log(`📄 HTML Report: ${htmlReportPath}`);
    console.log(`📄 JSON Report: ${jsonReportPath}\n`);

    return lhr;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Error: Could not connect to', TEST_URL);
      console.error('   Make sure the dev server is running: npm run serve');
    } else {
      console.error('❌ Error running Lighthouse:', error.message);
    }
    process.exit(1);
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

// Run the test
runLighthouse().catch(console.error);
