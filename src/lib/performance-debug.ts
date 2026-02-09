/**
 * Performance debugging utilities
 * Add timing logs to diagnose admin panel timeouts and slow page loads
 */

export class PerformanceTimer {
  private startTime: number;
  private checkpoints: { name: string; time: number; duration: number }[] = [];
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
    console.log(`🔍 [PERF] Starting: ${operation}`);
  }

  checkpoint(name: string) {
    const now = Date.now();
    const duration = now - (this.checkpoints.length > 0 ? this.checkpoints[this.checkpoints.length - 1].time : this.startTime);
    
    this.checkpoints.push({
      name,
      time: now,
      duration
    });

    console.log(`⏱️  [PERF] ${this.operation} - ${name}: ${duration}ms`);
  }

  async timeAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      console.log(`⚡ [PERF] ${this.operation} - ${name}: ${duration}ms (async)`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ [PERF] ${this.operation} - ${name}: ${duration}ms (failed)`, error);
      throw error;
    }
  }

  complete(): number {
    const totalTime = Date.now() - this.startTime;
    console.log(`✅ [PERF] Completed: ${this.operation} - Total: ${totalTime}ms`);
    
    // Show breakdown
    if (this.checkpoints.length > 1) {
      console.log(`📊 [PERF] Breakdown for ${this.operation}:`);
      this.checkpoints.forEach(checkpoint => {
        const percentage = ((checkpoint.duration / totalTime) * 100).toFixed(1);
        console.log(`   - ${checkpoint.name}: ${checkpoint.duration}ms (${percentage}%)`);
      });
    }
    
    return totalTime;
  }
}

// Simple timing utility for quick measurements
export const timeFunction = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`⚡ [PERF] ${name}: ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ [PERF] ${name}: ${duration}ms (failed)`, error);
    throw error;
  }
};

// Database query timing wrapper
export const timeQuery = async <T>(queryName: string, query: Promise<T>): Promise<T> => {
  return timeFunction(`DB Query: ${queryName}`, () => query);
};

// Client-side performance measurement
export const measurePageLoad = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      console.log('🌐 [PERF] Page Load Metrics:');
      console.log(`   - DNS Lookup: ${navigation.domainLookupEnd - navigation.domainLookupStart}ms`);
      console.log(`   - TCP Connect: ${navigation.connectEnd - navigation.connectStart}ms`);
      console.log(`   - Server Response: ${navigation.responseEnd - navigation.requestStart}ms`);
      console.log(`   - DOM Content Loaded: ${navigation.domContentLoadedEventEnd - navigation.fetchStart}ms`);
      console.log(`   - Full Load: ${navigation.loadEventEnd - navigation.fetchStart}ms`);
    }

    // Measure Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`🎨 [PERF] Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  });
};

// Memory usage tracking (for investigating relationship query impacts)
export const logMemoryUsage = (context: string) => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memory = process.memoryUsage();
    console.log(`💾 [PERF] Memory Usage (${context}):`);
    console.log(`   - RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Heap Total: ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  }
};