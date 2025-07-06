import { IAgentRuntime, elizaLogger } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';
import { LoggerWithContext, generateCorrelationId } from '../utils/helpers';
import { handleError, ErrorCategory } from '../utils/comprehensive-error-handling';

/**
 * Health check status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Service health check interface
 */
export interface ServiceHealthCheck {
  serviceId: string;
  serviceName: string;
  status: HealthStatus;
  lastCheck: number;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * System health overview
 */
export interface SystemHealth {
  overall: HealthStatus;
  services: ServiceHealthCheck[];
  timestamp: number;
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  networkStats: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
}

/**
 * Deployment environment
 */
export type DeploymentEnvironment = 'development' | 'staging' | 'production';

/**
 * Deployment status
 */
export type DeploymentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';

/**
 * Deployment configuration
 */
export interface DeploymentConfig {
  environment: DeploymentEnvironment;
  version: string;
  autoRollback: boolean;
  healthCheckTimeout: number;
  maxRetries: number;
  canaryPercentage: number;
  rollbackThreshold: number;
}

/**
 * Deployment record
 */
export interface DeploymentRecord {
  id: string;
  environment: DeploymentEnvironment;
  version: string;
  status: DeploymentStatus;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  metadata: {
    deployedBy: string;
    commitHash?: string;
    branch?: string;
    description?: string;
  };
  healthChecks: ServiceHealthCheck[];
  rollbackReason?: string;
}

/**
 * Monitoring metric interface
 */
export interface MonitoringMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags: Record<string, string>;
}

/**
 * Alert threshold interface
 */
export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  duration: number; // seconds
  severity: 'warning' | 'critical';
}

/**
 * Production Deployment Service
 * Handles monitoring, health checks, and deployment automation
 */
export class ProductionDeploymentService extends BaseDataService {
  static serviceType = 'production-deployment';
  
  private contextLogger: LoggerWithContext;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private deployments: Map<string, DeploymentRecord> = new Map();
  private metrics: MonitoringMetric[] = [];
  private thresholds: AlertThreshold[] = [];
  private startTime: number;
  private config: DeploymentConfig;

  constructor(runtime: IAgentRuntime) {
    super(runtime, 'bitcoinData');
    this.contextLogger = new LoggerWithContext(generateCorrelationId(), 'ProductionDeployment');
    this.startTime = Date.now();
    this.config = this.getDefaultConfig();
  }

  public get capabilityDescription(): string {
    return 'Production deployment service with monitoring, health checks, and deployment automation';
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info('Starting ProductionDeploymentService...');
    return new ProductionDeploymentService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info('Stopping ProductionDeploymentService...');
    const service = runtime.getService('production-deployment') as ProductionDeploymentService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info('ProductionDeploymentService starting...');
    await this.initializeMonitoring();
    this.startHealthChecks();
    this.startMetricsCollection();
    await this.performInitialHealthCheck();
  }

  async init() {
    this.contextLogger.info('ProductionDeploymentService initialized');
  }

  async stop() {
    this.contextLogger.info('ProductionDeploymentService stopping...');
    this.stopHealthChecks();
    this.stopMetricsCollection();
  }

  /**
   * Get default deployment configuration
   */
  private getDefaultConfig(): DeploymentConfig {
    return {
      environment: this.getSetting('DEPLOYMENT_ENVIRONMENT', 'development') as DeploymentEnvironment,
      version: this.getSetting('APP_VERSION', '1.0.0'),
      autoRollback: this.getSetting('AUTO_ROLLBACK', 'true') === 'true',
      healthCheckTimeout: parseInt(this.getSetting('HEALTH_CHECK_TIMEOUT', '30000')),
      maxRetries: parseInt(this.getSetting('MAX_RETRIES', '3')),
      canaryPercentage: parseInt(this.getSetting('CANARY_PERCENTAGE', '10')),
      rollbackThreshold: parseInt(this.getSetting('ROLLBACK_THRESHOLD', '5'))
    };
  }

  /**
   * Initialize monitoring
   */
  private async initializeMonitoring(): Promise<void> {
    try {
      // Initialize default alert thresholds
      this.thresholds = [
        {
          metric: 'memory_usage_percentage',
          operator: 'gte',
          value: 85,
          duration: 300, // 5 minutes
          severity: 'warning'
        },
        {
          metric: 'memory_usage_percentage',
          operator: 'gte',
          value: 95,
          duration: 60, // 1 minute
          severity: 'critical'
        },
        {
          metric: 'cpu_usage_percentage',
          operator: 'gte',
          value: 80,
          duration: 300,
          severity: 'warning'
        },
        {
          metric: 'cpu_usage_percentage',
          operator: 'gte',
          value: 95,
          duration: 60,
          severity: 'critical'
        },
        {
          metric: 'error_rate',
          operator: 'gte',
          value: 5,
          duration: 300,
          severity: 'warning'
        },
        {
          metric: 'response_time_ms',
          operator: 'gte',
          value: 5000,
          duration: 300,
          severity: 'warning'
        }
      ];

      this.contextLogger.info('Monitoring initialized', {
        thresholds: this.thresholds.length
      });
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Failed to initialize monitoring'),
        {
          correlationId: this.correlationId,
          component: 'ProductionDeploymentService',
          operation: 'initializeMonitoring'
        }
      );
      
      this.contextLogger.error('Failed to initialize monitoring', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds

    this.contextLogger.info('Health checks started');
  }

  /**
   * Stop health checks
   */
  private stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.contextLogger.info('Health checks stopped');
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 10000); // Every 10 seconds

    this.contextLogger.info('Metrics collection started');
  }

  /**
   * Stop metrics collection
   */
  private stopMetricsCollection(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.contextLogger.info('Metrics collection stopped');
  }

  /**
   * Perform initial health check
   */
  private async performInitialHealthCheck(): Promise<void> {
    try {
      const health = await this.getSystemHealth();
      this.contextLogger.info('Initial health check completed', {
        status: health.overall,
        services: health.services.length
      });
    } catch (error) {
      this.contextLogger.error('Initial health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Perform health checks for all services
   */
  private async performHealthChecks(): Promise<void> {
    try {
      const services = [
        'bitcoin-network',
        'market-data',
        'real-time-streaming',
        'advanced-alerting',
        'predictive-analytics',
        'cache',
        'performance-monitor',
        'integration'
      ];

      const healthChecks: ServiceHealthCheck[] = [];

      for (const serviceId of services) {
        const startTime = Date.now();
        try {
          const service = this.runtime.getService(serviceId);
          const responseTime = Date.now() - startTime;

          healthChecks.push({
            serviceId,
            serviceName: this.getServiceName(serviceId),
            status: service ? 'healthy' : 'unhealthy',
            lastCheck: Date.now(),
            responseTime,
            metadata: {
              serviceType: service?.constructor.name
            }
          });
        } catch (error) {
          healthChecks.push({
            serviceId,
            serviceName: this.getServiceName(serviceId),
            status: 'unhealthy',
            lastCheck: Date.now(),
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Update metrics
      this.addMetric('health_check_count', healthChecks.length, 'count', {
        environment: this.config.environment
      });

      const healthyCount = healthChecks.filter(h => h.status === 'healthy').length;
      const healthPercentage = (healthyCount / healthChecks.length) * 100;

      this.addMetric('health_percentage', healthPercentage, 'percentage', {
        environment: this.config.environment
      });

      // Check for alerts
      await this.checkAlertThresholds();

    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Health checks failed'),
        {
          correlationId: this.correlationId,
          component: 'ProductionDeploymentService',
          operation: 'performHealthChecks'
        }
      );
      
      this.contextLogger.error('Failed to perform health checks', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = await this.getCpuUsage();
      const diskUsage = await this.getDiskUsage();
      const networkStats = await this.getNetworkStats();

      // Memory metrics
      this.addMetric('memory_usage_bytes', memUsage.heapUsed, 'bytes', {
        type: 'heap_used',
        environment: this.config.environment
      });

      this.addMetric('memory_usage_percentage', 
        (memUsage.heapUsed / memUsage.heapTotal) * 100, 'percentage', {
        environment: this.config.environment
      });

      // CPU metrics
      this.addMetric('cpu_usage_percentage', cpuUsage, 'percentage', {
        environment: this.config.environment
      });

      // Disk metrics
      this.addMetric('disk_usage_percentage', diskUsage.percentage, 'percentage', {
        environment: this.config.environment
      });

      // Network metrics
      this.addMetric('network_bytes_in', networkStats.bytesIn, 'bytes', {
        environment: this.config.environment
      });

      this.addMetric('network_bytes_out', networkStats.bytesOut, 'bytes', {
        environment: this.config.environment
      });

      this.addMetric('network_connections', networkStats.connections, 'count', {
        environment: this.config.environment
      });

      // Uptime metric
      const uptime = Date.now() - this.startTime;
      this.addMetric('uptime_seconds', uptime / 1000, 'seconds', {
        environment: this.config.environment
      });

      // Clean up old metrics (keep last 24 hours)
      this.cleanupOldMetrics();

    } catch (error) {
      this.contextLogger.error('Failed to collect metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get CPU usage
   */
  private async getCpuUsage(): Promise<number> {
    // In a real implementation, this would use a proper CPU monitoring library
    return Math.random() * 30 + 10; // Mock: 10-40%
  }

  /**
   * Get disk usage
   */
  private async getDiskUsage(): Promise<{ used: number; total: number; percentage: number }> {
    // In a real implementation, this would check actual disk usage
    const total = 1000000000000; // 1TB
    const used = Math.random() * total * 0.3; // 0-30% used
    return {
      used,
      total,
      percentage: (used / total) * 100
    };
  }

  /**
   * Get network statistics
   */
  private async getNetworkStats(): Promise<{ bytesIn: number; bytesOut: number; connections: number }> {
    // In a real implementation, this would get actual network stats
    return {
      bytesIn: Math.random() * 1000000,
      bytesOut: Math.random() * 500000,
      connections: Math.floor(Math.random() * 100)
    };
  }

  /**
   * Add a metric
   */
  private addMetric(name: string, value: number, unit: string, tags: Record<string, string>): void {
    const metric: MonitoringMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  /**
   * Check alert thresholds
   */
  private async checkAlertThresholds(): Promise<void> {
    try {
      for (const threshold of this.thresholds) {
        const recentMetrics = this.metrics.filter(metric => 
          metric.name === threshold.metric &&
          metric.timestamp > Date.now() - (threshold.duration * 1000)
        );

        if (recentMetrics.length === 0) {
          continue;
        }

        const averageValue = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
        let shouldAlert = false;

        switch (threshold.operator) {
          case 'gt':
            shouldAlert = averageValue > threshold.value;
            break;
          case 'lt':
            shouldAlert = averageValue < threshold.value;
            break;
          case 'eq':
            shouldAlert = averageValue === threshold.value;
            break;
          case 'gte':
            shouldAlert = averageValue >= threshold.value;
            break;
          case 'lte':
            shouldAlert = averageValue <= threshold.value;
            break;
        }

        if (shouldAlert) {
          await this.triggerAlert(threshold, averageValue);
        }
      }
    } catch (error) {
      this.contextLogger.error('Failed to check alert thresholds', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(threshold: AlertThreshold, value: number): Promise<void> {
    try {
      const alertingService = this.runtime.getService('advanced-alerting');
      if (alertingService && typeof alertingService.publishEvent === 'function') {
        alertingService.publishEvent('alert', {
          type: 'system_monitoring',
          severity: threshold.severity,
          metric: threshold.metric,
          value,
          threshold: threshold.value,
          operator: threshold.operator,
          duration: threshold.duration,
          timestamp: Date.now()
        });
      }

      this.contextLogger.warn('Alert threshold exceeded', {
        metric: threshold.metric,
        value,
        threshold: threshold.value,
        severity: threshold.severity
      });
    } catch (error) {
      this.contextLogger.error('Failed to trigger alert', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get service name
   */
  private getServiceName(serviceId: string): string {
    const nameMap: Record<string, string> = {
      'bitcoin-network': 'Bitcoin Network Service',
      'market-data': 'Market Data Service',
      'real-time-streaming': 'Real-Time Streaming Service',
      'advanced-alerting': 'Advanced Alerting Service',
      'predictive-analytics': 'Predictive Analytics Service',
      'cache': 'Cache Service',
      'performance-monitor': 'Performance Monitor Service',
      'integration': 'Integration Service'
    };

    return nameMap[serviceId] || serviceId;
  }

  /**
   * Public API methods
   */

  /**
   * Get system health overview
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const services = await this.getServiceHealthChecks();
      const memUsage = process.memoryUsage();
      const cpuUsage = await this.getCpuUsage();
      const diskUsage = await this.getDiskUsage();
      const networkStats = await this.getNetworkStats();

      // Determine overall health
      const unhealthyServices = services.filter(s => s.status === 'unhealthy');
      const degradedServices = services.filter(s => s.status === 'degraded');
      
      let overall: HealthStatus = 'healthy';
      if (unhealthyServices.length > 0) {
        overall = 'unhealthy';
      } else if (degradedServices.length > 0) {
        overall = 'degraded';
      }

      return {
        overall,
        services,
        timestamp: Date.now(),
        uptime: Date.now() - this.startTime,
        memoryUsage: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
        },
        cpuUsage,
        diskUsage,
        networkStats
      };
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Failed to get system health'),
        {
          correlationId: this.correlationId,
          component: 'ProductionDeploymentService',
          operation: 'getSystemHealth'
        }
      );
      
      throw error;
    }
  }

  /**
   * Get service health checks
   */
  async getServiceHealthChecks(): Promise<ServiceHealthCheck[]> {
    const services = [
      'bitcoin-network',
      'market-data',
      'real-time-streaming',
      'advanced-alerting',
      'predictive-analytics',
      'cache',
      'performance-monitor',
      'integration'
    ];

    const healthChecks: ServiceHealthCheck[] = [];

    for (const serviceId of services) {
      const startTime = Date.now();
      try {
        const service = this.runtime.getService(serviceId);
        const responseTime = Date.now() - startTime;

        healthChecks.push({
          serviceId,
          serviceName: this.getServiceName(serviceId),
          status: service ? 'healthy' : 'unhealthy',
          lastCheck: Date.now(),
          responseTime,
          metadata: {
            serviceType: service?.constructor.name
          }
        });
      } catch (error) {
        healthChecks.push({
          serviceId,
          serviceName: this.getServiceName(serviceId),
          status: 'unhealthy',
          lastCheck: Date.now(),
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return healthChecks;
  }

  /**
   * Start a deployment
   */
  async startDeployment(
    environment: DeploymentEnvironment,
    version: string,
    metadata: DeploymentRecord['metadata']
  ): Promise<DeploymentRecord> {
    try {
      const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const deployment: DeploymentRecord = {
        id: deploymentId,
        environment,
        version,
        status: 'in_progress',
        startedAt: Date.now(),
        metadata,
        healthChecks: []
      };

      this.deployments.set(deploymentId, deployment);

      this.contextLogger.info('Deployment started', {
        deploymentId,
        environment,
        version
      });

      // In a real implementation, this would trigger actual deployment steps
      await this.performDeployment(deployment);

      return deployment;
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Deployment failed'),
        {
          correlationId: this.correlationId,
          component: 'ProductionDeploymentService',
          operation: 'startDeployment',
          params: { environment, version }
        }
      );
      
      throw error;
    }
  }

  /**
   * Perform deployment steps
   */
  private async performDeployment(deployment: DeploymentRecord): Promise<void> {
    try {
      // Simulate deployment steps
      await this.simulateDeploymentStep('Preparing deployment', 2000);
      await this.simulateDeploymentStep('Building application', 5000);
      await this.simulateDeploymentStep('Running tests', 3000);
      await this.simulateDeploymentStep('Deploying to staging', 4000);
      await this.simulateDeploymentStep('Running health checks', 2000);
      await this.simulateDeploymentStep('Deploying to production', 6000);
      await this.simulateDeploymentStep('Final verification', 2000);

      // Update deployment status
      deployment.status = 'completed';
      deployment.completedAt = Date.now();
      deployment.duration = deployment.completedAt - deployment.startedAt;

      this.contextLogger.info('Deployment completed', {
        deploymentId: deployment.id,
        duration: deployment.duration
      });
    } catch (error) {
      deployment.status = 'failed';
      deployment.completedAt = Date.now();
      deployment.duration = deployment.completedAt - deployment.startedAt;

      this.contextLogger.error('Deployment failed', {
        deploymentId: deployment.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Auto rollback if enabled
      if (this.config.autoRollback) {
        await this.rollbackDeployment(deployment);
      }
    }
  }

  /**
   * Simulate deployment step
   */
  private async simulateDeploymentStep(step: string, duration: number): Promise<void> {
    this.contextLogger.info(`Deployment step: ${step}`);
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Rollback deployment
   */
  private async rollbackDeployment(deployment: DeploymentRecord): Promise<void> {
    try {
      deployment.status = 'rolled_back';
      deployment.rollbackReason = 'Automatic rollback due to deployment failure';

      this.contextLogger.info('Deployment rolled back', {
        deploymentId: deployment.id
      });
    } catch (error) {
      this.contextLogger.error('Failed to rollback deployment', {
        deploymentId: deployment.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get deployment history
   */
  getDeploymentHistory(): DeploymentRecord[] {
    return Array.from(this.deployments.values()).sort((a, b) => b.startedAt - a.startedAt);
  }

  /**
   * Get metrics for a specific time range
   */
  getMetrics(startTime: number, endTime: number, metricName?: string): MonitoringMetric[] {
    let filtered = this.metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );

    if (metricName) {
      filtered = filtered.filter(metric => metric.name === metricName);
    }

    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): Record<string, { current: number; average: number; min: number; max: number }> {
    const summary: Record<string, { current: number; average: number; min: number; max: number }> = {};
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const recentMetrics = this.metrics.filter(metric => metric.timestamp > oneHourAgo);

    // Group by metric name
    const grouped = new Map<string, MonitoringMetric[]>();
    for (const metric of recentMetrics) {
      if (!grouped.has(metric.name)) {
        grouped.set(metric.name, []);
      }
      grouped.get(metric.name)!.push(metric);
    }

    // Calculate statistics for each metric
    for (const [name, metrics] of grouped) {
      const values = metrics.map(m => m.value);
      const current = values[values.length - 1] || 0;
      const average = values.reduce((sum, v) => sum + v, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      summary[name] = { current, average, min, max };
    }

    return summary;
  }

  /**
   * Add alert threshold
   */
  addAlertThreshold(threshold: AlertThreshold): void {
    this.thresholds.push(threshold);
    this.contextLogger.info('Alert threshold added', { threshold });
  }

  /**
   * Remove alert threshold
   */
  removeAlertThreshold(metric: string, operator: string, value: number): boolean {
    const index = this.thresholds.findIndex(t => 
      t.metric === metric && t.operator === operator && t.value === value
    );

    if (index !== -1) {
      this.thresholds.splice(index, 1);
      this.contextLogger.info('Alert threshold removed', { metric, operator, value });
      return true;
    }

    return false;
  }

  /**
   * Get deployment configuration
   */
  getDeploymentConfig(): DeploymentConfig {
    return { ...this.config };
  }

  /**
   * Update deployment configuration
   */
  updateDeploymentConfig(updates: Partial<DeploymentConfig>): DeploymentConfig {
    this.config = { ...this.config, ...updates };
    this.contextLogger.info('Deployment configuration updated', { updates });
    return this.config;
  }

  async updateData(): Promise<void> {
    // Trigger health checks and metrics collection
    await this.performHealthChecks();
    await this.collectMetrics();
  }

  async forceUpdate(): Promise<any> {
    return {
      systemHealth: await this.getSystemHealth(),
      deploymentHistory: this.getDeploymentHistory(),
      metricsSummary: this.getMetricsSummary(),
      deploymentConfig: this.getDeploymentConfig(),
      alertThresholds: this.thresholds,
      uptime: Date.now() - this.startTime
    };
  }
} 