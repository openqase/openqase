#!/usr/bin/env tsx

/**
 * Performance Monitoring Script
 * Run this to continuously monitor your app's performance in various scenarios
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface PerformanceReport {
  timestamp: string;
  scenario: string;
  metrics: {
    buildTime?: number;
    serverStartTime?: number;
    pageLoadTimes?: Record<string, number>;
    adminOperationTimes?: Record<string, number>;
    memoryUsage?: NodeJS.MemoryUsage;
  };
  errors?: string[];
}

class PerformanceMonitor {
  private reports: PerformanceReport[] = [];
  private outputDir = './performance-reports';

  constructor() {
    this.ensureOutputDir();
  }

  private async ensureOutputDir() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  async measureBuildTime(): Promise<number> {
    console.log('📊 Measuring build time...');
    const startTime = Date.now();
    
    try {
      // Clean build
      await execAsync('npm run build');
      const buildTime = Date.now() - startTime;
      console.log(`✅ Build completed in ${buildTime}ms`);
      return buildTime;
    } catch (error) {
      console.error('❌ Build failed:', error);
      throw error;
    }
  }

  async measureServerStartTime(): Promise<number> {
    console.log('🚀 Measuring server start time...');
    const startTime = Date.now();
    
    // Start the server in the background
    const serverProcess = exec('npm run start');
    
    return new Promise((resolve, reject) => {
      let resolved = false;
      
      serverProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        // Look for server ready indicators
        if ((output.includes('ready') || output.includes('started')) && !resolved) {
          resolved = true;
          const startupTime = Date.now() - startTime;
          console.log(`✅ Server started in ${startupTime}ms`);
          serverProcess.kill();
          resolve(startupTime);
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          serverProcess.kill();
          reject(new Error('Server start timeout'));
        }
      }, 60000);
    });
  }

  async measurePageLoadTimes(): Promise<Record<string, number>> {
    console.log('🌐 Measuring page load times...');
    
    const testPages = [
      '/case-study/quantum-annealing-d-wave',
      '/paths/algorithm/quantum-phase-estimation',
      '/paths/persona/quantum-software-developer',
      '/paths/industry/finance'
    ];

    const results: Record<string, number> = {};

    for (const page of testPages) {
      try {
        const startTime = Date.now();
        // Using curl to measure basic response times
        await execAsync(`curl -s -o /dev/null -w "%{time_total}" http://localhost:3000${page}`);
        const loadTime = Date.now() - startTime;
        results[page] = loadTime;
        console.log(`📄 ${page}: ${loadTime}ms`);
      } catch (error) {
        console.error(`❌ Failed to load ${page}:`, error);
        results[page] = -1; // Indicate failure
      }
    }

    return results;
  }

  async runFullPerformanceTest(): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      scenario: 'full-performance-test',
      metrics: {},
      errors: []
    };

    try {
      // 1. Measure build time
      report.metrics.buildTime = await this.measureBuildTime();
      
      // 2. Measure server start time
      report.metrics.serverStartTime = await this.measureServerStartTime();
      
      // 3. Wait a moment for server to be fully ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 4. Measure page load times
      report.metrics.pageLoadTimes = await this.measurePageLoadTimes();
      
      // 5. Capture memory usage
      report.metrics.memoryUsage = process.memoryUsage();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.errors?.push(errorMessage);
      console.error('❌ Performance test failed:', errorMessage);
    }

    this.reports.push(report);
    await this.saveReport(report);
    return report;
  }

  async runAdminPerformanceTest(): Promise<PerformanceReport> {
    console.log('🔧 Running admin performance test...');
    
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      scenario: 'admin-operations',
      metrics: {
        adminOperationTimes: {}
      },
      errors: []
    };

    // This would require more complex setup with database operations
    // For now, we'll focus on the build and page load measurements
    
    return report;
  }

  private async saveReport(report: PerformanceReport) {
    const filename = `performance-report-${Date.now()}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`📊 Report saved to ${filepath}`);
  }

  async generateSummaryReport() {
    console.log('\n📈 Performance Summary:');
    console.log('=====================');

    if (this.reports.length === 0) {
      console.log('No performance data available.');
      return;
    }

    const latest = this.reports[this.reports.length - 1];
    
    console.log(`Build Time: ${latest.metrics.buildTime}ms`);
    console.log(`Server Start: ${latest.metrics.serverStartTime}ms`);
    
    if (latest.metrics.pageLoadTimes) {
      console.log('\nPage Load Times:');
      Object.entries(latest.metrics.pageLoadTimes).forEach(([page, time]) => {
        const status = time === -1 ? '❌ FAILED' : `✅ ${time}ms`;
        console.log(`  ${page}: ${status}`);
      });
    }

    if (latest.metrics.memoryUsage) {
      const memory = latest.metrics.memoryUsage;
      console.log('\nMemory Usage:');
      console.log(`  RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Heap Total: ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    }

    if (latest.errors && latest.errors.length > 0) {
      console.log('\n❌ Errors:');
      latest.errors.forEach(error => console.log(`  - ${error}`));
    }
  }
}

// CLI interface
async function main() {
  const monitor = new PerformanceMonitor();
  const args = process.argv.slice(2);
  const command = args[0] || 'full';

  console.log('🔍 OpenQase Performance Monitor');
  console.log('================================\n');

  try {
    switch (command) {
      case 'build':
        await monitor.measureBuildTime();
        break;
      case 'server':
        await monitor.measureServerStartTime();
        break;
      case 'pages':
        await monitor.measurePageLoadTimes();
        break;
      case 'admin':
        await monitor.runAdminPerformanceTest();
        await monitor.generateSummaryReport();
        break;
      case 'full':
      default:
        await monitor.runFullPerformanceTest();
        await monitor.generateSummaryReport();
        break;
    }
  } catch (error) {
    console.error('💥 Performance monitoring failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { PerformanceMonitor };