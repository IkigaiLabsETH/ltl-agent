import { IAgentRuntime, elizaLogger } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';
import { LoggerWithContext, generateCorrelationId } from '../utils/helpers';
import { handleError, ErrorCategory } from '../utils/comprehensive-error-handling';

/**
 * Deployment status types
 */
export type DeploymentStatus = 'healthy' | 'degraded' | 'unhealthy' | 'deploying' | 'failed';

/**
 * Health check result
 */
export interface HealthCheckResult {
  service: string;
  status: DeploymentStatus;
  responseTime: number;
  lastCheck: Date;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Monitoring metrics
 */
export interface MonitoringMetrics {
  uptime: number;
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  cacheHitRate: number;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  endpoint: string;
  threshold: number;
  enabled: boolean;
  recipients?: string[];
}

/**
 * Deployment configuration
 */
export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  deploymentId: string;
  timestamp: Date;
  rollbackVersion?: string;
  healthCheckInterval: number;
  maxResponseTime: number;
  failureThreshold: number;
}

/**
 * Production Deployment Service
 * Manages production deployment, monitoring, health checks, and alerting
 */
export class ProductionDeploymentService extends BaseDataService {
  static serviceType = 'production-deployment';
  
  private contextLogger: LoggerWithContext;
  private deploymentConfig: DeploymentConfig;
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private monitoringMetrics: MonitoringMetrics;
  private alertConfigs: AlertConfig[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private startTime: number = Date.now();
  private alertCallbacks: ((alert: string, severity: 'warning' | 'critical') => void)[] = [];

  constructor(runtime: IAgentRuntime) {
    super(runtime, 'bitcoinData');
    this.contextLogger = new LoggerWithContext(generateCorrelationId(), 'ProductionDeployment');
    this.initializeDeploymentConfig();
    this.initializeMonitoringMetrics();
    this.initializeAlertConfigs();
  }

  public get capabilityDescription(): string {
    return 'Production deployment management with health monitoring, alerting, and automated rollback capabilities';
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
    this.startTime = Date.now();
    this.startHealthMonitoring();
    this.startMetricsCollection();
  }

  async init() {
    this.contextLogger.info('ProductionDeploymentService initialized');
  }

  async stop() {
    this.contextLogger.info('ProductionDeploymentService stopping...');
    this.stopHealthMonitoring();
    this.stopMetricsCollection();
  }

  /**
   * Initialize deployment configuration
   */
  private initializeDeploymentConfig(): void {
    this.deploymentConfig = {
      environment: (process.env.NODE_ENV as any) || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      deploymentId: process.env.DEPLOYMENT_ID || generateCorrelationId(),
      timestamp: new Date(),
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
      maxResponseTime: parseInt(process.env.MAX_RESPONSE_TIME || '5000'), // 5 seconds
      failureThreshold: parseInt(process.env.FAILURE_THRESHOLD || '3')
    };
  }

  /**
   * Initialize monitoring metrics
   */
  private initializeMonitoringMetrics(): void {
    this.monitoringMetrics = {
      uptime: 0,
      totalRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
      cacheHitRate: 0
    };
  }

  /**
   * Initialize alert configurations
   */
  private initializeAlertConfigs(): void {
    this.alertConfigs = [
      {
        type: 'webhook',
        endpoint: process.env.ALERT_WEBHOOK_URL || '',
        threshold: 0.05, // 5% error rate
        enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true',
        recipients: []
      },
      {
        type: 'email',
        endpoint: process.env.ALERT_EMAIL_ENDPOINT || '',
        threshold: 0.1, // 10% error rate
        enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
        recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || []
      }
    ];
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.deploymentConfig.healthCheckInterval);

    this.contextLogger.info('Health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    this.contextLogger.info('Health monitoring stopped');
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // Update metrics every minute
    setInterval(() => {
      this.updateMetrics();
    }, 60000);
  }

  /**
   * Stop metrics collection
   */
  private stopMetricsCollection(): void {
    // Cleanup handled by clearInterval
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    try {
      const services = [
        'bitcoin-network',
        'market-data',
        'nft-data',
        'news-data',
        'social-sentiment',
        'centralized-config',
        'cache',
        'performance-monitor'
      ];

      const healthChecks = await Promise.allSettled(
        services.map(serviceName => this.checkServiceHealth(serviceName))
      );

      // Process health check results
      healthChecks.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const healthCheck = result.value;
          this.healthChecks.set(healthCheck.service, healthCheck);
          
          // Check for unhealthy services
          if (healthCheck.status === 'unhealthy') {
            this.triggerAlert(`Service ${healthCheck.service} is unhealthy: ${healthCheck.error}`, 'critical');
          }
        } else {
          const serviceName = services[index];
          const healthCheck: HealthCheckResult = {
            service: serviceName,
            status: 'unhealthy',
            responseTime: 0,
            lastCheck: new Date(),
            error: result.reason?.message || 'Health check failed'
          };
          this.healthChecks.set(serviceName, healthCheck);
          this.triggerAlert(`Health check failed for ${serviceName}: ${healthCheck.error}`, 'critical');
        }
      });

      // Check overall deployment health
      this.checkDeploymentHealth();
    } catch (error) {
      this.contextLogger.error('Failed to perform health checks', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      handleError(error, { operation: 'Health check failure' });
    }
  }

  /**
   * Check health of a specific service
   */
  private async checkServiceHealth(serviceName: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const service = this.runtime.getService(serviceName);
      if (!service) {
        return {
          service: serviceName,
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          lastCheck: new Date(),
          error: 'Service not found'
        };
      }

      // Type guard for healthCheck method
      if (typeof (service as any).healthCheck === 'function') {
        const healthResult = await (service as any).healthCheck();
        return {
          service: serviceName,
          status: healthResult.healthy ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
          lastCheck: new Date(),
          details: healthResult
        };
      }

      // Fallback health check
      return {
        service: serviceName,
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        service: serviceName,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check overall deployment health
   */
  private checkDeploymentHealth(): void {
    const healthChecks = Array.from(this.healthChecks.values());
    const unhealthyServices = healthChecks.filter(h => h.status === 'unhealthy');
    const degradedServices = healthChecks.filter(h => h.status === 'degraded');

    if (unhealthyServices.length > 0) {
      this.triggerAlert(`Deployment unhealthy: ${unhealthyServices.length} services down`, 'critical');
    } else if (degradedServices.length > 0) {
      this.triggerAlert(`Deployment degraded: ${degradedServices.length} services degraded`, 'warning');
    }
  }

  /**
   * Update monitoring metrics
   */
  private updateMetrics(): void {
    try {
      const currentTime = Date.now();
      this.monitoringMetrics.uptime = currentTime - this.startTime;
      
      // Get memory usage
      const memUsage = process.memoryUsage();
      this.monitoringMetrics.memoryUsage = memUsage.heapUsed / memUsage.heapTotal;

      // Get CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      this.monitoringMetrics.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

      // Update other metrics from services
      this.updateServiceMetrics();

      this.contextLogger.debug('Metrics updated', {
        uptime: this.monitoringMetrics.uptime,
        memoryUsage: this.monitoringMetrics.memoryUsage,
        cpuUsage: this.monitoringMetrics.cpuUsage
      });
    } catch (error) {
      this.contextLogger.error('Failed to update metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update metrics from other services
   */
  private updateServiceMetrics(): void {
    try {
      // Get performance monitor metrics
      const performanceMonitor = this.runtime.getService('performance-monitor');
      if (performanceMonitor && typeof (performanceMonitor as any).getCurrentMetrics === 'function') {
        const metrics = (performanceMonitor as any).getCurrentMetrics();
        if (metrics && metrics.length > 0) {
          const apiMetrics = metrics.filter((m: any) => m.category === 'api');
          if (apiMetrics.length > 0) {
            this.monitoringMetrics.averageResponseTime = 
              apiMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / apiMetrics.length;
          }
        }
      }

      // Get cache metrics
      const cacheService = this.runtime.getService('cache');
      if (cacheService && typeof (cacheService as any).getStats === 'function') {
        const cacheStats = (cacheService as any).getStats();
        this.monitoringMetrics.cacheHitRate = cacheStats.hitRate || 0;
      }
    } catch (error) {
      this.contextLogger.error('Failed to update service metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(message: string, severity: 'warning' | 'critical'): Promise<void> {
    try {
      this.contextLogger.warn(`Alert triggered: ${message}`, { severity });

      // Call alert callbacks
      this.alertCallbacks.forEach(callback => {
        try {
          callback(message, severity);
        } catch (error) {
          this.contextLogger.error('Alert callback failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Send alerts based on configuration
      await this.sendAlerts(message, severity);
    } catch (error) {
      this.contextLogger.error('Failed to trigger alert', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send alerts through configured channels
   */
  private async sendAlerts(message: string, severity: 'warning' | 'critical'): Promise<void> {
    const enabledAlerts = this.alertConfigs.filter(alert => alert.enabled);

    for (const alert of enabledAlerts) {
      try {
        switch (alert.type) {
          case 'webhook':
            await this.sendWebhookAlert(alert, message, severity);
            break;
          case 'email':
            await this.sendEmailAlert(alert, message, severity);
            break;
          case 'slack':
            await this.sendSlackAlert(alert, message, severity);
            break;
          case 'sms':
            await this.sendSMSAlert(alert, message, severity);
            break;
        }
      } catch (error) {
        this.contextLogger.error(`Failed to send ${alert.type} alert`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: AlertConfig, message: string, severity: 'warning' | 'critical'): Promise<void> {
    if (!alert.endpoint) return;

    const payload = {
      message,
      severity,
      timestamp: new Date().toISOString(),
      deploymentId: this.deploymentConfig.deploymentId,
      environment: this.deploymentConfig.environment,
      version: this.deploymentConfig.version
    };

    const response = await fetch(alert.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook alert failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: AlertConfig, message: string, severity: 'warning' | 'critical'): Promise<void> {
    // Implementation would depend on email service (SendGrid, AWS SES, etc.)
    this.contextLogger.info('Email alert would be sent', {
      recipients: alert.recipients,
      message,
      severity
    });
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: AlertConfig, message: string, severity: 'warning' | 'critical'): Promise<void> {
    if (!alert.endpoint) return;

    const payload = {
      text: `[${severity.toUpperCase()}] ${message}`,
      attachments: [{
        color: severity === 'critical' ? 'danger' : 'warning',
        fields: [
          {
            title: 'Environment',
            value: this.deploymentConfig.environment,
            short: true
          },
          {
            title: 'Version',
            value: this.deploymentConfig.version,
            short: true
          },
          {
            title: 'Deployment ID',
            value: this.deploymentConfig.deploymentId,
            short: true
          }
        ],
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    const response = await fetch(alert.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack alert failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Send SMS alert
   */
  private async sendSMSAlert(alert: AlertConfig, message: string, severity: 'warning' | 'critical'): Promise<void> {
    // Implementation would depend on SMS service (Twilio, AWS SNS, etc.)
    this.contextLogger.info('SMS alert would be sent', {
      recipients: alert.recipients,
      message,
      severity
    });
  }

  /**
   * Get deployment status
   */
  getDeploymentStatus(): {
    status: DeploymentStatus;
    healthChecks: HealthCheckResult[];
    metrics: MonitoringMetrics;
    config: DeploymentConfig;
  } {
    const healthChecks = Array.from(this.healthChecks.values());
    const unhealthyCount = healthChecks.filter(h => h.status === 'unhealthy').length;
    const degradedCount = healthChecks.filter(h => h.status === 'degraded').length;

    let status: DeploymentStatus = 'healthy';
    if (unhealthyCount > 0) {
      status = 'unhealthy';
    } else if (degradedCount > 0) {
      status = 'degraded';
    }

    return {
      status,
      healthChecks,
      metrics: this.monitoringMetrics,
      config: this.deploymentConfig
    };
  }

  /**
   * Get health check results
   */
  getHealthChecks(): HealthCheckResult[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get monitoring metrics
   */
  getMonitoringMetrics(): MonitoringMetrics {
    return { ...this.monitoringMetrics };
  }

  /**
   * Get deployment configuration
   */
  getDeploymentConfig(): DeploymentConfig {
    return { ...this.deploymentConfig };
  }

  /**
   * Add alert callback
   */
  onAlert(callback: (alert: string, severity: 'warning' | 'critical') => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Remove alert callback
   */
  removeAlertCallback(callback: (alert: string, severity: 'warning' | 'critical') => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  /**
   * Update deployment configuration
   */
  updateDeploymentConfig(config: Partial<DeploymentConfig>): void {
    this.deploymentConfig = { ...this.deploymentConfig, ...config };
    this.contextLogger.info('Deployment configuration updated', { config });
  }

  /**
   * Add alert configuration
   */
  addAlertConfig(alertConfig: AlertConfig): void {
    this.alertConfigs.push(alertConfig);
    this.contextLogger.info('Alert configuration added', { alertConfig });
  }

  /**
   * Remove alert configuration
   */
  removeAlertConfig(type: string, endpoint: string): void {
    const index = this.alertConfigs.findIndex(alert => 
      alert.type === type && alert.endpoint === endpoint
    );
    if (index > -1) {
      this.alertConfigs.splice(index, 1);
      this.contextLogger.info('Alert configuration removed', { type, endpoint });
    }
  }

  /**
   * Force health check
   */
  async forceHealthCheck(): Promise<HealthCheckResult[]> {
    await this.performHealthChecks();
    return this.getHealthChecks();
  }

  /**
   * Get deployment statistics
   */
  getStats(): {
    uptime: number;
    totalHealthChecks: number;
    failedHealthChecks: number;
    totalAlerts: number;
    isMonitoring: boolean;
  } {
    const healthChecks = this.getHealthChecks();
    return {
      uptime: this.monitoringMetrics.uptime,
      totalHealthChecks: healthChecks.length,
      failedHealthChecks: healthChecks.filter(h => h.status === 'unhealthy').length,
      totalAlerts: this.alertCallbacks.length,
      isMonitoring: this.isMonitoring
    };
  }

  async updateData(): Promise<void> {
    // Update deployment metrics
    this.updateMetrics();
  }

  async forceUpdate(): Promise<any> {
    // Force health checks and return results
    return this.forceHealthCheck();
  }
} 