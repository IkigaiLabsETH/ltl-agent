import { elizaLogger } from "@elizaos/core";

/**
 * Performance Monitoring Utility
 * 
 * Tracks cold start time, memory usage, service initialization times,
 * and provides detailed performance metrics for optimization analysis.
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private startTime: number;
  private serviceTimings: Map<string, { start: number; end?: number; duration?: number }> = new Map();
  private memorySnapshots: Array<{ timestamp: number; usage: number }> = [];
  private logger = elizaLogger.child({ module: "PerformanceMonitor" });

  private constructor() {
    this.startTime = performance.now();
    this.logger.info("Performance monitoring started");
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing a service initialization
   */
  startServiceTimer(serviceName: string): void {
    this.serviceTimings.set(serviceName, { start: performance.now() });
    this.logger.debug(`Started timing service: ${serviceName}`);
  }

  /**
   * End timing a service initialization
   */
  endServiceTimer(serviceName: string): void {
    const timing = this.serviceTimings.get(serviceName);
    if (timing) {
      timing.end = performance.now();
      timing.duration = timing.end - timing.start;
      this.logger.debug(`Service ${serviceName} initialized in ${timing.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Take a memory usage snapshot
   */
  takeMemorySnapshot(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const totalUsage = usage.heapUsed + usage.external + usage.arrayBuffers;
      this.memorySnapshots.push({
        timestamp: performance.now(),
        usage: totalUsage
      });
      this.logger.debug(`Memory snapshot: ${(totalUsage / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  /**
   * Get cold start time
   */
  getColdStartTime(): number {
    return performance.now() - this.startTime;
  }

  /**
   * Get service initialization report
   */
  getServiceReport(): {
    totalServices: number;
    totalTime: number;
    averageTime: number;
    slowestServices: Array<{ name: string; duration: number }>;
    fastestServices: Array<{ name: string; duration: number }>;
  } {
    const services = Array.from(this.serviceTimings.entries())
      .filter(([_, timing]) => timing.duration !== undefined)
      .map(([name, timing]) => ({ name, duration: timing.duration! }))
      .sort((a, b) => b.duration - a.duration);

    const totalTime = services.reduce((sum, service) => sum + service.duration, 0);
    const averageTime = services.length > 0 ? totalTime / services.length : 0;

    return {
      totalServices: services.length,
      totalTime,
      averageTime,
      slowestServices: services.slice(0, 5),
      fastestServices: services.slice(-5).reverse()
    };
  }

  /**
   * Get memory usage report
   */
  getMemoryReport(): {
    currentUsage: number;
    peakUsage: number;
    averageUsage: number;
    growthRate: number;
  } {
    if (this.memorySnapshots.length === 0) {
      return { currentUsage: 0, peakUsage: 0, averageUsage: 0, growthRate: 0 };
    }

    const current = this.memorySnapshots[this.memorySnapshots.length - 1];
    const peak = Math.max(...this.memorySnapshots.map(s => s.usage));
    const average = this.memorySnapshots.reduce((sum, s) => sum + s.usage, 0) / this.memorySnapshots.length;
    
    // Calculate growth rate (MB per second)
    const timeSpan = (current.timestamp - this.startTime) / 1000;
    const growthRate = timeSpan > 0 ? (current.usage - this.memorySnapshots[0].usage) / 1024 / 1024 / timeSpan : 0;

    return {
      currentUsage: current.usage / 1024 / 1024, // Convert to MB
      peakUsage: peak / 1024 / 1024,
      averageUsage: average / 1024 / 1024,
      growthRate
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): string {
    const coldStartTime = this.getColdStartTime();
    const serviceReport = this.getServiceReport();
    const memoryReport = this.getMemoryReport();

    return `
🚀 Performance Report
====================

⏱️  Cold Start Time: ${coldStartTime.toFixed(2)}ms
🧠 Memory Usage: ${memoryReport.currentUsage.toFixed(2)}MB (peak: ${memoryReport.peakUsage.toFixed(2)}MB)
📈 Memory Growth: ${memoryReport.growthRate.toFixed(2)}MB/s

🔧 Service Initialization
-------------------------
Total Services: ${serviceReport.totalServices}
Total Time: ${serviceReport.totalTime.toFixed(2)}ms
Average Time: ${serviceReport.averageTime.toFixed(2)}ms

🐌 Slowest Services:
${serviceReport.slowestServices.map(s => `  ${s.name}: ${s.duration.toFixed(2)}ms`).join('\n')}

⚡ Fastest Services:
${serviceReport.fastestServices.map(s => `  ${s.name}: ${s.duration.toFixed(2)}ms`).join('\n')}

📊 Optimization Status:
${coldStartTime < 2000 ? '✅' : '❌'} Cold start < 2s (${coldStartTime < 2000 ? 'PASS' : 'FAIL'})
${memoryReport.currentUsage < 100 ? '✅' : '❌'} Memory < 100MB (${memoryReport.currentUsage < 100 ? 'PASS' : 'FAIL'})
${serviceReport.averageTime < 500 ? '✅' : '❌'} Avg service init < 500ms (${serviceReport.averageTime < 500 ? 'PASS' : 'FAIL'})
`;
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.startTime = performance.now();
    this.serviceTimings.clear();
    this.memorySnapshots = [];
    this.logger.info("Performance monitoring reset");
  }
}

/**
 * Convenience function to get the performance monitor instance
 */
export const getPerformanceMonitor = (): PerformanceMonitor => PerformanceMonitor.getInstance(); 