import { IAgentRuntime, Service } from "@elizaos/core";

interface KnowledgeMetrics {
  searchCount: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  totalEmbeddings: number;
  indexSize: number;
  lastIndexUpdate: Date;
}

interface SearchMetric {
  timestamp: Date;
  query: string;
  responseTime: number;
  resultsCount: number;
  cacheHit: boolean;
  error?: string;
}

export class KnowledgePerformanceMonitor extends Service {
  static serviceType = "knowledge-performance-monitor";
  capabilityDescription =
    "Knowledge system performance monitoring and metrics tracking";

  private metrics: KnowledgeMetrics = {
    searchCount: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    totalEmbeddings: 0,
    indexSize: 0,
    lastIndexUpdate: new Date(),
  };

  private searchHistory: SearchMetric[] = [];
  private maxHistorySize = 1000;
  private performanceInterval?: NodeJS.Timeout;

  constructor(runtime: IAgentRuntime) {
    super();
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    console.log("🔄 Initializing Knowledge Performance Monitor...");

    // Get initial metrics from knowledge service
    const knowledgeService = runtime.getService("knowledge");
    if (knowledgeService) {
      await this.updateIndexMetrics(knowledgeService);
    }

    // Log performance metrics every 5 minutes
    this.performanceInterval = setInterval(
      () => {
        this.logPerformanceMetrics();
      },
      5 * 60 * 1000,
    );

    console.log("✅ Knowledge Performance Monitor initialized");
  }

  async stop(): Promise<void> {
    console.log("🛑 Stopping Knowledge Performance Monitor...");

    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = undefined;
    }

    // Final metrics log
    this.logPerformanceMetrics();

    console.log("✅ Knowledge Performance Monitor stopped");
  }

  // Track search performance
  recordSearch(
    query: string,
    responseTime: number,
    resultsCount: number,
    cacheHit: boolean = false,
    error?: string,
  ): void {
    const searchMetric: SearchMetric = {
      timestamp: new Date(),
      query,
      responseTime,
      resultsCount,
      cacheHit,
      error,
    };

    this.searchHistory.push(searchMetric);

    // Keep history size manageable
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory.shift();
    }

    // Update metrics
    this.updateMetrics();
  }

  // Get current performance metrics
  getMetrics(): KnowledgeMetrics {
    return { ...this.metrics };
  }

  // Get recent search history
  getRecentSearches(limit: number = 10): SearchMetric[] {
    return this.searchHistory.slice(-limit);
  }

  // Update metrics from knowledge service
  private async updateIndexMetrics(knowledgeService: any): Promise<void> {
    try {
      // This would depend on the actual knowledge service API
      const stats = await knowledgeService.getStats?.();
      if (stats) {
        this.metrics.totalEmbeddings = stats.totalEmbeddings || 0;
        this.metrics.indexSize = stats.indexSize || 0;
        this.metrics.lastIndexUpdate = stats.lastUpdate || new Date();
      }
    } catch (error) {
      console.error("Error updating index metrics:", error);
    }
  }

  // Update calculated metrics
  private updateMetrics(): void {
    if (this.searchHistory.length === 0) return;

    const recentSearches = this.searchHistory.slice(-100); // Last 100 searches

    // Calculate averages
    this.metrics.searchCount = this.searchHistory.length;
    this.metrics.averageResponseTime =
      recentSearches.reduce((sum, s) => sum + s.responseTime, 0) /
      recentSearches.length;

    // Calculate cache hit rate
    const cacheHits = recentSearches.filter((s) => s.cacheHit).length;
    this.metrics.cacheHitRate = (cacheHits / recentSearches.length) * 100;

    // Calculate error rate
    const errors = recentSearches.filter((s) => s.error).length;
    this.metrics.errorRate = (errors / recentSearches.length) * 100;
  }

  // Log performance metrics
  private logPerformanceMetrics(): void {
    console.log("📊 Knowledge System Performance Metrics:");
    console.log(`  • Total Searches: ${this.metrics.searchCount}`);
    console.log(
      `  • Average Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms`,
    );
    console.log(`  • Cache Hit Rate: ${this.metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`  • Error Rate: ${this.metrics.errorRate.toFixed(1)}%`);
    console.log(`  • Total Embeddings: ${this.metrics.totalEmbeddings}`);
    console.log(`  • Index Size: ${this.formatBytes(this.metrics.indexSize)}`);
    console.log(
      `  • Last Index Update: ${this.metrics.lastIndexUpdate.toISOString()}`,
    );
  }

  // Get performance report
  getPerformanceReport(): string {
    const metrics = this.getMetrics();
    const recentSearches = this.getRecentSearches(5);

    let report = "# Knowledge System Performance Report\n\n";

    report += "## Overall Metrics\n";
    report += `- **Total Searches**: ${metrics.searchCount}\n`;
    report += `- **Average Response Time**: ${metrics.averageResponseTime.toFixed(2)}ms\n`;
    report += `- **Cache Hit Rate**: ${metrics.cacheHitRate.toFixed(1)}%\n`;
    report += `- **Error Rate**: ${metrics.errorRate.toFixed(1)}%\n`;
    report += `- **Total Embeddings**: ${metrics.totalEmbeddings}\n`;
    report += `- **Index Size**: ${this.formatBytes(metrics.indexSize)}\n`;
    report += `- **Last Index Update**: ${metrics.lastIndexUpdate.toISOString()}\n\n`;

    report += "## Recent Searches\n";
    recentSearches.forEach((search, index) => {
      report += `${index + 1}. **Query**: "${search.query}"\n`;
      report += `   - Response Time: ${search.responseTime}ms\n`;
      report += `   - Results: ${search.resultsCount}\n`;
      report += `   - Cache Hit: ${search.cacheHit ? "Yes" : "No"}\n`;
      if (search.error) {
        report += `   - Error: ${search.error}\n`;
      }
      report += "\n";
    });

    return report;
  }

  // Format bytes for display
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Health check
  getHealthStatus(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.metrics.errorRate > 10) {
      issues.push(`High error rate: ${this.metrics.errorRate.toFixed(1)}%`);
    }

    if (this.metrics.averageResponseTime > 5000) {
      issues.push(
        `Slow response times: ${this.metrics.averageResponseTime.toFixed(2)}ms`,
      );
    }

    if (this.metrics.cacheHitRate < 20) {
      issues.push(
        `Low cache hit rate: ${this.metrics.cacheHitRate.toFixed(1)}%`,
      );
    }

    const daysSinceUpdate =
      (Date.now() - this.metrics.lastIndexUpdate.getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 7) {
      issues.push(`Index not updated for ${daysSinceUpdate.toFixed(1)} days`);
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }
}

/**
 * KnowledgePerformanceMonitor2 - Stub implementation for core ElizaOS compatibility
 * This fixes the "Not implemented" error from the core system
 */
export class KnowledgePerformanceMonitor2 extends KnowledgePerformanceMonitor {
  static serviceType = "knowledge-performance-monitor-2";
  capabilityDescription = "Knowledge system performance monitoring and metrics tracking (v2)";

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    console.log("🔄 Initializing Knowledge Performance Monitor 2...");
    await super.initialize(runtime);
    console.log("✅ Knowledge Performance Monitor 2 initialized");
  }

  async stop(): Promise<void> {
    console.log("🛑 Stopping Knowledge Performance Monitor 2...");
    await super.stop();
    console.log("✅ Knowledge Performance Monitor 2 stopped");
  }
}
