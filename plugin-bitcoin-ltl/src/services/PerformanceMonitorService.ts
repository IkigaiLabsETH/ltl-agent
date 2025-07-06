import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { LoggerWithContext, generateCorrelationId } from "../utils/helpers";
import {
  handleError,
  ErrorCategory,
} from "../utils/comprehensive-error-handling";

/**
 * Performance metric types
 */
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category:
    | "api"
    | "database"
    | "cache"
    | "memory"
    | "cpu"
    | "network"
    | "custom";
  metadata?: Record<string, any>;
}

/**
 * Performance threshold configuration
 */
export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  action?: "alert" | "restart" | "scale";
}

/**
 * Performance report
 */
export interface PerformanceReport {
  timestamp: number;
  duration: number;
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  metrics: PerformanceMetric[];
  alerts: string[];
  recommendations: string[];
}

/**
 * Service performance data
 */
export interface ServicePerformance {
  serviceName: string;
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  lastRequestTime: number;
  uptime: number;
}

/**
 * Performance Monitor Service
 * Tracks system performance, provides real-time insights, and generates reports
 */
export class PerformanceMonitorService extends BaseDataService {
  static serviceType = "performance-monitor";

  private contextLogger: LoggerWithContext;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private thresholds: PerformanceThreshold[] = [];
  private servicePerformance: Map<string, ServicePerformance> = new Map();
  private startTime: number = Date.now();
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertCallbacks: ((alert: string) => void)[] = [];

  constructor(runtime: IAgentRuntime) {
    super(runtime, "bitcoinData");
    this.contextLogger = new LoggerWithContext(
      generateCorrelationId(),
      "PerformanceMonitor",
    );
    this.initializeThresholds();
  }

  public get capabilityDescription(): string {
    return "Comprehensive performance monitoring with real-time metrics, threshold alerts, and performance reporting";
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info("Starting PerformanceMonitorService...");
    return new PerformanceMonitorService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info("Stopping PerformanceMonitorService...");
    const service = runtime.getService(
      "performance-monitor",
    ) as PerformanceMonitorService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info("PerformanceMonitorService starting...");
    this.startTime = Date.now();
    this.startMonitoring();
  }

  async init() {
    this.contextLogger.info("PerformanceMonitorService initialized");
  }

  async stop() {
    this.contextLogger.info("PerformanceMonitorService stopping...");
    this.stopMonitoring();
  }

  /**
   * Initialize default performance thresholds
   */
  private initializeThresholds(): void {
    this.thresholds = [
      {
        metric: "api_response_time",
        warning: 1000,
        critical: 5000,
        action: "alert",
      },
      { metric: "error_rate", warning: 0.05, critical: 0.1, action: "alert" },
      { metric: "memory_usage", warning: 0.8, critical: 0.95, action: "alert" },
      { metric: "cpu_usage", warning: 0.7, critical: 0.9, action: "alert" },
      {
        metric: "cache_hit_rate",
        warning: 0.7,
        critical: 0.5,
        action: "alert",
      },
    ];
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkThresholds();
    }, 30000); // Collect metrics every 30 seconds

    this.contextLogger.info("Performance monitoring started");
  }

  /**
   * Stop performance monitoring
   */
  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.contextLogger.info("Performance monitoring stopped");
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, "timestamp">): void {
    try {
      const fullMetric: PerformanceMetric = {
        ...metric,
        timestamp: Date.now(),
      };

      if (!this.metrics.has(metric.id)) {
        this.metrics.set(metric.id, []);
      }

      const metricHistory = this.metrics.get(metric.id)!;
      metricHistory.push(fullMetric);

      // Keep only last 1000 metrics per type
      if (metricHistory.length > 1000) {
        metricHistory.splice(0, metricHistory.length - 1000);
      }

      this.contextLogger.debug("Performance metric recorded", {
        metric: metric.id,
        value: metric.value,
        category: metric.category,
      });
    } catch (error) {
      this.contextLogger.error("Failed to record performance metric", {
        metric: metric.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Record API performance
   */
  recordApiPerformance(
    serviceName: string,
    responseTime: number,
    success: boolean,
  ): void {
    // Record response time
    this.recordMetric({
      id: `${serviceName}_response_time`,
      name: `${serviceName} Response Time`,
      value: responseTime,
      unit: "ms",
      category: "api",
      metadata: { serviceName, success },
    });

    // Update service performance
    this.updateServicePerformance(serviceName, responseTime, success);

    // Record error if applicable
    if (!success) {
      this.recordMetric({
        id: `${serviceName}_error`,
        name: `${serviceName} Error`,
        value: 1,
        unit: "count",
        category: "api",
        metadata: { serviceName },
      });
    }
  }

  /**
   * Record cache performance
   */
  recordCachePerformance(hit: boolean, key: string): void {
    this.recordMetric({
      id: "cache_hit",
      name: "Cache Hit",
      value: hit ? 1 : 0,
      unit: "boolean",
      category: "cache",
      metadata: { key },
    });
  }

  /**
   * Record database performance
   */
  recordDatabasePerformance(
    operation: string,
    duration: number,
    success: boolean,
  ): void {
    this.recordMetric({
      id: `db_${operation}`,
      name: `Database ${operation}`,
      value: duration,
      unit: "ms",
      category: "database",
      metadata: { operation, success },
    });
  }

  /**
   * Update service performance data
   */
  private updateServicePerformance(
    serviceName: string,
    responseTime: number,
    success: boolean,
  ): void {
    const current = this.servicePerformance.get(serviceName) || {
      serviceName,
      requestCount: 0,
      averageResponseTime: 0,
      errorCount: 0,
      lastRequestTime: 0,
      uptime: 0,
    };

    current.requestCount++;
    current.lastRequestTime = Date.now();
    current.uptime = Date.now() - this.startTime;

    // Update average response time
    current.averageResponseTime =
      (current.averageResponseTime * (current.requestCount - 1) +
        responseTime) /
      current.requestCount;

    if (!success) {
      current.errorCount++;
    }

    this.servicePerformance.set(serviceName, current);
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      // Memory usage
      const memoryUsage = process.memoryUsage();
      this.recordMetric({
        id: "memory_usage",
        name: "Memory Usage",
        value: memoryUsage.heapUsed / memoryUsage.heapTotal,
        unit: "percentage",
        category: "memory",
        metadata: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
        },
      });

      // CPU usage (approximation)
      const cpuUsage = process.cpuUsage();
      this.recordMetric({
        id: "cpu_usage",
        name: "CPU Usage",
        value: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
        unit: "seconds",
        category: "cpu",
        metadata: { user: cpuUsage.user, system: cpuUsage.system },
      });

      // Uptime
      this.recordMetric({
        id: "uptime",
        name: "Uptime",
        value: process.uptime(),
        unit: "seconds",
        category: "custom",
        metadata: { startTime: this.startTime },
      });

      // Active connections (if available)
      if (process.env.NODE_ENV === "production") {
        this.recordMetric({
          id: "active_connections",
          name: "Active Connections",
          value: 0, // Would need to be implemented based on server type
          unit: "count",
          category: "network",
        });
      }
    } catch (error) {
      await handleError(
        error instanceof Error
          ? error
          : new Error("System metrics collection failed"),
        {
          correlationId: this.correlationId,
          component: "PerformanceMonitorService",
          operation: "collectSystemMetrics",
        },
      );

      this.contextLogger.error("Failed to collect system metrics", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check performance thresholds
   */
  private async checkThresholds(): Promise<void> {
    try {
      for (const threshold of this.thresholds) {
        const recentMetrics = this.getRecentMetrics(threshold.metric, 5); // Last 5 metrics

        if (recentMetrics.length === 0) {
          continue;
        }

        const averageValue =
          recentMetrics.reduce((sum, m) => sum + m.value, 0) /
          recentMetrics.length;

        if (averageValue >= threshold.critical) {
          await this.triggerAlert(
            `CRITICAL: ${threshold.metric} is ${averageValue} (threshold: ${threshold.critical})`,
            "critical",
          );
        } else if (averageValue >= threshold.warning) {
          await this.triggerAlert(
            `WARNING: ${threshold.metric} is ${averageValue} (threshold: ${threshold.warning})`,
            "warning",
          );
        }
      }
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error("Threshold check failed"),
        {
          correlationId: this.correlationId,
          component: "PerformanceMonitorService",
          operation: "checkThresholds",
        },
      );

      this.contextLogger.error("Failed to check performance thresholds", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get recent metrics for a specific metric type
   */
  private getRecentMetrics(
    metricId: string,
    count: number,
  ): PerformanceMetric[] {
    const metrics = this.metrics.get(metricId) || [];
    return metrics.slice(-count);
  }

  /**
   * Trigger performance alert
   */
  private async triggerAlert(
    message: string,
    severity: "warning" | "critical",
  ): Promise<void> {
    try {
      this.contextLogger.warn(`Performance Alert: ${message}`, { severity });

      // Notify alert callbacks
      for (const callback of this.alertCallbacks) {
        try {
          callback(message);
        } catch (error) {
          this.contextLogger.error("Alert callback failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Record alert metric
      this.recordMetric({
        id: "performance_alert",
        name: "Performance Alert",
        value: severity === "critical" ? 2 : 1,
        unit: "severity",
        category: "custom",
        metadata: { message, severity },
      });
    } catch (error) {
      this.contextLogger.error("Failed to trigger performance alert", {
        message,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(duration: number = 3600000): Promise<PerformanceReport> {
    // Default 1 hour
    try {
      const endTime = Date.now();
      const startTime = endTime - duration;

      const allMetrics: PerformanceMetric[] = [];
      for (const metrics of this.metrics.values()) {
        allMetrics.push(...metrics.filter((m) => m.timestamp >= startTime));
      }

      // Calculate summary statistics
      const apiMetrics = allMetrics.filter((m) => m.category === "api");
      const errorMetrics = allMetrics.filter((m) => m.id.includes("error"));
      const cacheMetrics = allMetrics.filter((m) => m.category === "cache");
      const memoryMetrics = allMetrics.filter((m) => m.id === "memory_usage");

      const summary = {
        totalRequests: apiMetrics.length,
        averageResponseTime:
          apiMetrics.length > 0
            ? apiMetrics.reduce((sum, m) => sum + m.value, 0) /
              apiMetrics.length
            : 0,
        errorRate:
          apiMetrics.length > 0 ? errorMetrics.length / apiMetrics.length : 0,
        cacheHitRate:
          cacheMetrics.length > 0
            ? cacheMetrics.filter((m) => m.value === 1).length /
              cacheMetrics.length
            : 0,
        memoryUsage:
          memoryMetrics.length > 0
            ? memoryMetrics[memoryMetrics.length - 1].value
            : 0,
        cpuUsage: 0, // Would need to be calculated from CPU metrics
      };

      // Generate alerts and recommendations
      const alerts: string[] = [];
      const recommendations: string[] = [];

      if (summary.errorRate > 0.1) {
        alerts.push("High error rate detected");
        recommendations.push(
          "Investigate API endpoints and external service dependencies",
        );
      }

      if (summary.averageResponseTime > 2000) {
        alerts.push("Slow response times detected");
        recommendations.push(
          "Consider implementing caching or optimizing database queries",
        );
      }

      if (summary.memoryUsage > 0.8) {
        alerts.push("High memory usage detected");
        recommendations.push(
          "Consider implementing memory cleanup or scaling resources",
        );
      }

      if (summary.cacheHitRate < 0.7) {
        recommendations.push(
          "Consider expanding cache coverage for frequently accessed data",
        );
      }

      return {
        timestamp: endTime,
        duration,
        summary,
        metrics: allMetrics,
        alerts,
        recommendations,
      };
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error("Report generation failed"),
        {
          correlationId: this.correlationId,
          component: "PerformanceMonitorService",
          operation: "generateReport",
          params: { duration },
        },
      );

      throw new Error("Failed to generate performance report");
    }
  }

  /**
   * Get service performance data
   */
  getServicePerformance(): ServicePerformance[] {
    return Array.from(this.servicePerformance.values());
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): PerformanceMetric[] {
    const currentMetrics: PerformanceMetric[] = [];
    for (const metrics of this.metrics.values()) {
      if (metrics.length > 0) {
        currentMetrics.push(metrics[metrics.length - 1]);
      }
    }
    return currentMetrics;
  }

  /**
   * Add alert callback
   */
  onAlert(callback: (alert: string) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Remove alert callback
   */
  removeAlertCallback(callback: (alert: string) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  /**
   * Add custom threshold
   */
  addThreshold(threshold: PerformanceThreshold): void {
    this.thresholds.push(threshold);
  }

  /**
   * Remove threshold
   */
  removeThreshold(metric: string): void {
    this.thresholds = this.thresholds.filter((t) => t.metric !== metric);
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalMetrics: number;
    activeServices: number;
    uptime: number;
    isMonitoring: boolean;
  } {
    let totalMetrics = 0;
    for (const metrics of this.metrics.values()) {
      totalMetrics += metrics.length;
    }

    return {
      totalMetrics,
      activeServices: this.servicePerformance.size,
      uptime: Date.now() - this.startTime,
      isMonitoring: this.isMonitoring,
    };
  }

  async updateData(): Promise<void> {
    // Performance monitor doesn't need regular updates
  }

  async forceUpdate(): Promise<any> {
    return this.generateReport();
  }
}
