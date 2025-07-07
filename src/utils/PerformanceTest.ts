import { elizaLogger } from "@elizaos/core";
import { getPerformanceMonitor } from "./PerformanceMonitor";
import { createOptimizedServiceFactory } from "../services/OptimizedServiceFactory";

/**
 * Performance Test Utility
 * 
 * Provides comprehensive testing capabilities to measure
 * cold start time, memory usage, and service initialization performance.
 */
export class PerformanceTest {
  private logger = elizaLogger.child({ module: "PerformanceTest" });
  private performanceMonitor = getPerformanceMonitor();

  /**
   * Run comprehensive performance test
   */
  async runFullTest(runtime: any): Promise<{
    coldStartTime: number;
    memoryUsage: number;
    serviceInitTime: number;
    report: string;
  }> {
    this.logger.info("Starting comprehensive performance test...");
    
    // Reset performance monitor
    this.performanceMonitor.reset();
    
    // Take initial memory snapshot
    this.performanceMonitor.takeMemorySnapshot();
    
    // Test cold start with optimized service factory
    const startTime = performance.now();
    
    try {
      const serviceFactory = createOptimizedServiceFactory(runtime);
      
      // Initialize critical services
      await serviceFactory.initializeCriticalServices();
      
      // Initialize essential services
      await serviceFactory.initializeEssentialServices();
      
      // Preload optional services in background
      serviceFactory.preloadOptionalServices();
      
      const endTime = performance.now();
      const coldStartTime = endTime - startTime;
      
      // Take final memory snapshot
      this.performanceMonitor.takeMemorySnapshot();
      
      // Get performance reports
      const serviceReport = this.performanceMonitor.getServiceReport();
      const memoryReport = this.performanceMonitor.getMemoryReport();
      
      const report = this.generateTestReport({
        coldStartTime,
        memoryUsage: memoryReport.currentUsage,
        serviceInitTime: serviceReport.averageTime,
        serviceReport,
        memoryReport
      });
      
      this.logger.info("Performance test completed successfully");
      
      return {
        coldStartTime,
        memoryUsage: memoryReport.currentUsage,
        serviceInitTime: serviceReport.averageTime,
        report
      };
      
    } catch (error) {
      this.logger.error("Performance test failed", error);
      throw error;
    }
  }

  /**
   * Test cold start performance only
   */
  async testColdStart(runtime: any): Promise<number> {
    this.logger.info("Testing cold start performance...");
    
    this.performanceMonitor.reset();
    const startTime = performance.now();
    
    try {
      const serviceFactory = createOptimizedServiceFactory(runtime);
      await serviceFactory.initializeCriticalServices();
      
      const endTime = performance.now();
      const coldStartTime = endTime - startTime;
      
      this.logger.info(`Cold start time: ${coldStartTime.toFixed(2)}ms`);
      return coldStartTime;
      
    } catch (error) {
      this.logger.error("Cold start test failed", error);
      throw error;
    }
  }

  /**
   * Test memory usage
   */
  async testMemoryUsage(runtime: any): Promise<{
    initial: number;
    peak: number;
    final: number;
    growth: number;
  }> {
    this.logger.info("Testing memory usage...");
    
    this.performanceMonitor.reset();
    this.performanceMonitor.takeMemorySnapshot();
    
    try {
      const serviceFactory = createOptimizedServiceFactory(runtime);
      
      // Initialize services
      await serviceFactory.initializeCriticalServices();
      await serviceFactory.initializeEssentialServices();
      
      // Take multiple snapshots during operation
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        this.performanceMonitor.takeMemorySnapshot();
      }
      
      const memoryReport = this.performanceMonitor.getMemoryReport();
      
      this.logger.info(`Memory usage: ${memoryReport.currentUsage.toFixed(2)}MB`);
      
      return {
        initial: memoryReport.currentUsage,
        peak: memoryReport.peakUsage,
        final: memoryReport.currentUsage,
        growth: memoryReport.growthRate
      };
      
    } catch (error) {
      this.logger.error("Memory usage test failed", error);
      throw error;
    }
  }

  /**
   * Test service initialization performance
   */
  async testServiceInitialization(runtime: any): Promise<{
    totalServices: number;
    averageTime: number;
    slowestServices: Array<{ name: string; duration: number }>;
    fastestServices: Array<{ name: string; duration: number }>;
  }> {
    this.logger.info("Testing service initialization performance...");
    
    this.performanceMonitor.reset();
    
    try {
      const serviceFactory = createOptimizedServiceFactory(runtime);
      
      // Initialize all services
      await serviceFactory.initializeCriticalServices();
      await serviceFactory.initializeEssentialServices();
      
      const serviceReport = this.performanceMonitor.getServiceReport();
      
      this.logger.info(`Service initialization complete: ${serviceReport.totalServices} services`);
      
      return {
        totalServices: serviceReport.totalServices,
        averageTime: serviceReport.averageTime,
        slowestServices: serviceReport.slowestServices,
        fastestServices: serviceReport.fastestServices
      };
      
    } catch (error) {
      this.logger.error("Service initialization test failed", error);
      throw error;
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(data: {
    coldStartTime: number;
    memoryUsage: number;
    serviceInitTime: number;
    serviceReport: any;
    memoryReport: any;
  }): string {
    const { coldStartTime, memoryUsage, serviceInitTime, serviceReport, memoryReport } = data;
    
    return `
🧪 Performance Test Results
===========================

⏱️  Cold Start Performance
---------------------------
Cold Start Time: ${coldStartTime.toFixed(2)}ms
Target: < 2000ms
Status: ${coldStartTime < 2000 ? '✅ PASS' : '❌ FAIL'}
Performance: ${coldStartTime < 2000 ? 'Excellent' : 'Needs Improvement'}

🧠 Memory Usage
---------------
Current Usage: ${memoryUsage.toFixed(2)}MB
Peak Usage: ${memoryReport.peakUsage.toFixed(2)}MB
Growth Rate: ${memoryReport.growthRate.toFixed(2)}MB/s
Target: < 100MB
Status: ${memoryUsage < 100 ? '✅ PASS' : '❌ FAIL'}

🔧 Service Initialization
-------------------------
Total Services: ${serviceReport.totalServices}
Average Init Time: ${serviceInitTime.toFixed(2)}ms
Total Init Time: ${serviceReport.totalTime.toFixed(2)}ms
Target: < 500ms average
Status: ${serviceInitTime < 500 ? '✅ PASS' : '❌ FAIL'}

🐌 Slowest Services (Top 5):
${serviceReport.slowestServices.map((s: any, i: number) => 
  `  ${i + 1}. ${s.name}: ${s.duration.toFixed(2)}ms`
).join('\n')}

⚡ Fastest Services (Top 5):
${serviceReport.fastestServices.map((s: any, i: number) => 
  `  ${i + 1}. ${s.name}: ${s.duration.toFixed(2)}ms`
).join('\n')}

📊 Overall Assessment
--------------------
${this.getOverallAssessment(coldStartTime, memoryUsage, serviceInitTime)}

🎯 Optimization Recommendations
-------------------------------
${this.getOptimizationRecommendations(coldStartTime, memoryUsage, serviceInitTime, serviceReport)}
`;
  }

  /**
   * Get overall performance assessment
   */
  private getOverallAssessment(coldStartTime: number, memoryUsage: number, serviceInitTime: number): string {
    const coldStartScore = coldStartTime < 2000 ? 1 : 0;
    const memoryScore = memoryUsage < 100 ? 1 : 0;
    const serviceScore = serviceInitTime < 500 ? 1 : 0;
    const totalScore = coldStartScore + memoryScore + serviceScore;
    
    if (totalScore === 3) return "🟢 EXCELLENT - All targets met";
    if (totalScore === 2) return "🟡 GOOD - Most targets met";
    if (totalScore === 1) return "🟠 FAIR - Some targets met";
    return "🔴 POOR - No targets met";
  }

  /**
   * Get optimization recommendations
   */
  private getOptimizationRecommendations(
    coldStartTime: number, 
    memoryUsage: number, 
    serviceInitTime: number, 
    serviceReport: any
  ): string {
    const recommendations: string[] = [];
    
    if (coldStartTime >= 2000) {
      recommendations.push("• Implement more aggressive lazy loading for non-critical services");
      recommendations.push("• Consider code splitting to reduce initial bundle size");
    }
    
    if (memoryUsage >= 100) {
      recommendations.push("• Implement service cleanup for unused services");
      recommendations.push("• Optimize data structures and caching strategies");
    }
    
    if (serviceInitTime >= 500) {
      recommendations.push("• Optimize slowest services: " + 
        serviceReport.slowestServices.slice(0, 3).map((s: any) => s.name).join(", "));
      recommendations.push("• Implement parallel initialization where possible");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("• No immediate optimizations needed - performance targets met");
    }
    
    return recommendations.join('\n');
  }
}

/**
 * Convenience function to run performance tests
 */
export const runPerformanceTest = async (runtime: any) => {
  const test = new PerformanceTest();
  return test.runFullTest(runtime);
}; 