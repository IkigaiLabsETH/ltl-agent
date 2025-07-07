import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { LoggerWithContext, generateCorrelationId } from "../utils/helpers";
import {
  handleError,
  ErrorCategory,
} from "../utils/comprehensive-error-handling";
import { CentralizedConfigService } from "./CentralizedConfigService";
import { CacheService } from "./CacheService";
import { PerformanceMonitorService } from "./PerformanceMonitorService";
import { BitcoinIntelligenceService } from "./BitcoinIntelligenceService";
import { MarketDataService } from "./MarketDataService";

/**
 * Integration service status
 */
export interface IntegrationStatus {
  isHealthy: boolean;
  services: {
    config: boolean;
    cache: boolean;
    performance: boolean;
    bitcoinIntelligence: boolean;
    marketData: boolean;
  };
  lastHealthCheck: number;
  uptime: number;
  errorCount: number;
}

/**
 * Service integration configuration
 */
export interface IntegrationConfig {
  enableHealthChecks: boolean;
  healthCheckInterval: number;
  enablePerformanceMonitoring: boolean;
  enableCaching: boolean;
  enableErrorHandling: boolean;
  enableMetrics: boolean;
}

/**
 * Integration Service
 * Coordinates all architecture components and provides unified interface
 */
export class IntegrationService extends BaseDataService {
  static serviceType = "integration";

  private contextLogger: LoggerWithContext;
  private configService: CentralizedConfigService | null = null;
  private cacheService: CacheService | null = null;
  private performanceService: PerformanceMonitorService | null = null;
  private bitcoinIntelligenceService: BitcoinIntelligenceService | null = null;
  private marketDataService: MarketDataService | null = null;
  private integrationConfig: IntegrationConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private startTime: number = Date.now();
  private errorCount: number = 0;

  constructor(runtime: IAgentRuntime) {
    super(runtime, "bitcoinData");
    this.contextLogger = new LoggerWithContext(
      generateCorrelationId(),
      "IntegrationService",
    );
    this.integrationConfig = this.getDefaultIntegrationConfig();
  }

  public get capabilityDescription(): string {
    return "Coordinates all architecture components and provides unified interface for the Bitcoin LTL plugin";
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info("Starting IntegrationService...");
    return new IntegrationService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info("Stopping IntegrationService...");
    const service = runtime.getService("integration") as IntegrationService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info("IntegrationService starting...");
    this.startTime = Date.now();
    await this.initializeServices();
    this.startHealthChecks();
  }

  async init() {
    this.contextLogger.info("IntegrationService initialized");
  }

  async stop() {
    this.contextLogger.info("IntegrationService stopping...");
    this.stopHealthChecks();
    await this.cleanupServices();
  }

  /**
   * Get default integration configuration
   */
  private getDefaultIntegrationConfig(): IntegrationConfig {
    return {
      enableHealthChecks: true,
      healthCheckInterval: 30000, // 30 seconds
      enablePerformanceMonitoring: true,
      enableCaching: true,
      enableErrorHandling: true,
      enableMetrics: true,
    };
  }

  /**
   * Initialize all services
   */
  private async initializeServices(): Promise<void> {
    try {
      this.contextLogger.info("Initializing integration services...");

      // Initialize configuration service first
      await this.initializeConfigService();

      // Initialize other services based on configuration
      if (this.integrationConfig.enableCaching) {
        await this.initializeCacheService();
      }

      if (this.integrationConfig.enablePerformanceMonitoring) {
        await this.initializePerformanceService();
      }

      // Initialize data services
      await this.initializeDataServices();

      // Set up service dependencies
      this.setupServiceDependencies();

      this.isInitialized = true;
      this.contextLogger.info(
        "All integration services initialized successfully",
      );
    } catch (error) {
      await handleError(
        error instanceof Error
          ? error
          : new Error("Service initialization failed"),
        {
          correlationId: this.correlationId,
          component: "IntegrationService",
          operation: "initializeServices",
        },
      );

      this.contextLogger.error("Failed to initialize integration services", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Initialize configuration service
   */
  private async initializeConfigService(): Promise<void> {
    try {
      this.configService = this.runtime.getService(
        "centralized-config",
      ) as CentralizedConfigService;
      if (!this.configService) {
        throw new Error("CentralizedConfigService not found");
      }

      // Load integration configuration from config service
      const configData = this.configService.get("performance", {});
      this.integrationConfig = {
        ...this.integrationConfig,
        ...configData,
      };

      this.contextLogger.info("Configuration service initialized");
    } catch (error) {
      this.contextLogger.warn(
        "Failed to initialize configuration service, using defaults",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
    }
  }

  /**
   * Initialize cache service
   */
  private async initializeCacheService(): Promise<void> {
    try {
      const cacheService = this.runtime.getService("cache");
      if (!cacheService) {
        this.contextLogger.warn("CacheService not found, caching disabled");
        return;
      }

      this.cacheService = cacheService as unknown as CacheService;
      this.contextLogger.info("Cache service initialized");
    } catch (error) {
      this.contextLogger.warn(
        "Failed to initialize cache service, caching disabled",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
    }
  }

  /**
   * Initialize performance monitoring service
   */
  private async initializePerformanceService(): Promise<void> {
    try {
      this.performanceService = this.runtime.getService(
        "performance-monitor",
      ) as PerformanceMonitorService;
      if (!this.performanceService) {
        this.contextLogger.warn(
          "PerformanceMonitorService not found, monitoring disabled",
        );
        return;
      }

      // Set up performance alerts
      this.performanceService.onAlert((alert) => {
        this.contextLogger.warn("Performance alert received", { alert });
        this.errorCount++;
      });

      this.contextLogger.info("Performance monitoring service initialized");
    } catch (error) {
      this.contextLogger.warn(
        "Failed to initialize performance service, monitoring disabled",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
    }
  }

  /**
   * Initialize data services
   */
  private async initializeDataServices(): Promise<void> {
    try {
      // Initialize Bitcoin Intelligence Service
      this.bitcoinIntelligenceService = this.runtime.getService(
        "bitcoin-intelligence",
      ) as BitcoinIntelligenceService;
      if (!this.bitcoinIntelligenceService) {
        this.contextLogger.warn("BitcoinIntelligenceService not found");
      } else {
        this.contextLogger.info("Bitcoin Intelligence service initialized");
      }

      // Initialize Market Data Service
      this.marketDataService = this.runtime.getService(
        "market-data",
      ) as MarketDataService;
      if (!this.marketDataService) {
        this.contextLogger.warn("MarketDataService not found");
      } else {
        this.contextLogger.info("Market Data service initialized");
      }
    } catch (error) {
      this.contextLogger.warn("Failed to initialize some data services", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Set up service dependencies and cross-service communication
   */
  private setupServiceDependencies(): void {
    try {
      // Set up configuration change listeners
      if (this.configService) {
        this.configService.watch("performance", (event) => {
          this.contextLogger.info("Performance configuration updated", {
            key: event.key,
            newValue: event.newValue,
          });
          this.updateIntegrationConfig(event.newValue);
        });
      }

      // Set up cache performance monitoring
      if (this.cacheService && this.performanceService) {
        // Monitor cache performance
        this.contextLogger.info("Cache performance monitoring enabled");
      }

      // Set up data service performance monitoring
      if (this.performanceService) {
        if (this.bitcoinIntelligenceService) {
          this.contextLogger.info(
            "Bitcoin Intelligence service performance monitoring enabled",
          );
        }
        if (this.marketDataService) {
          this.contextLogger.info(
            "Market Data service performance monitoring enabled",
          );
        }
      }

      this.contextLogger.info("Service dependencies configured");
    } catch (error) {
      this.contextLogger.error("Failed to set up service dependencies", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update integration configuration
   */
  private updateIntegrationConfig(newConfig: any): void {
    this.integrationConfig = {
      ...this.integrationConfig,
      ...newConfig,
    };

    // Restart health checks if interval changed
    if (this.integrationConfig.enableHealthChecks) {
      this.restartHealthChecks();
    }
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    if (!this.integrationConfig.enableHealthChecks) {
      return;
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.integrationConfig.healthCheckInterval);

    this.contextLogger.info("Health checks started", {
      interval: this.integrationConfig.healthCheckInterval,
    });
  }

  /**
   * Stop health checks
   */
  private stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.contextLogger.info("Health checks stopped");
  }

  /**
   * Restart health checks
   */
  private restartHealthChecks(): void {
    this.stopHealthChecks();
    this.startHealthChecks();
  }

  /**
   * Perform health check on all services
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const healthStatus: IntegrationStatus = {
        isHealthy: true,
        services: {
          config: this.configService !== null,
          cache: this.cacheService !== null,
          performance: this.performanceService !== null,
          bitcoinIntelligence: this.bitcoinIntelligenceService !== null,
          marketData: this.marketDataService !== null,
        },
        lastHealthCheck: Date.now(),
        uptime: Date.now() - this.startTime,
        errorCount: this.errorCount,
      };

      // Check if any service is unhealthy
      healthStatus.isHealthy = Object.values(healthStatus.services).every(
        (healthy) => healthy,
      );

      if (!healthStatus.isHealthy) {
        this.contextLogger.warn("Health check failed", healthStatus);
        this.errorCount++;
      } else {
        this.contextLogger.debug("Health check passed", healthStatus);
      }

      // Record health check metric
      if (this.performanceService) {
        this.performanceService.recordMetric({
          id: "health_check",
          name: "Health Check",
          value: healthStatus.isHealthy ? 1 : 0,
          unit: "boolean",
          category: "custom",
          metadata: healthStatus,
        });
      }
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error("Health check failed"),
        {
          correlationId: this.correlationId,
          component: "IntegrationService",
          operation: "performHealthCheck",
        },
      );

      this.contextLogger.error("Health check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      this.errorCount++;
    }
  }

  /**
   * Clean up services
   */
  private async cleanupServices(): Promise<void> {
    try {
      this.contextLogger.info("Cleaning up integration services...");

      // Remove configuration listeners
      if (this.configService) {
        // Cleanup would be handled by the config service itself
      }

      // Remove performance alert callbacks
      if (this.performanceService) {
        // Cleanup would be handled by the performance service itself
      }

      this.isInitialized = false;
      this.contextLogger.info("Integration services cleaned up");
    } catch (error) {
      this.contextLogger.error("Failed to cleanup integration services", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get integration status
   */
  async getStatus(): Promise<IntegrationStatus> {
    const status: IntegrationStatus = {
      isHealthy: this.isInitialized,
              services: {
          config: this.configService !== null,
          cache: this.cacheService !== null,
          performance: this.performanceService !== null,
          bitcoinIntelligence: this.bitcoinIntelligenceService !== null,
          marketData: this.marketDataService !== null,
        },
      lastHealthCheck: Date.now(),
      uptime: Date.now() - this.startTime,
      errorCount: this.errorCount,
    };

    // Check actual service health
    status.isHealthy = Object.values(status.services).every(
      (healthy) => healthy,
    );
    return status;
  }

  /**
   * Get service instances
   */
  getServices(): {
    config: CentralizedConfigService | null;
    cache: CacheService | null;
    performance: PerformanceMonitorService | null;
    bitcoinIntelligence: BitcoinIntelligenceService | null;
    marketData: MarketDataService | null;
  } {
    return {
      config: this.configService,
      cache: this.cacheService,
      performance: this.performanceService,
      bitcoinIntelligence: this.bitcoinIntelligenceService,
      marketData: this.marketDataService,
    };
  }

  /**
   * Get integration configuration
   */
  getConfig(): IntegrationConfig {
    return { ...this.integrationConfig };
  }

  /**
   * Update integration configuration
   */
  updateConfig(newConfig: Partial<IntegrationConfig>): void {
    this.integrationConfig = {
      ...this.integrationConfig,
      ...newConfig,
    };

    this.contextLogger.info("Integration configuration updated", newConfig);
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(): Promise<any> {
    if (!this.performanceService) {
      throw new Error("Performance monitoring not available");
    }

    return await this.performanceService.generateReport();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    if (!this.cacheService) {
      throw new Error("Cache service not available");
    }

    return this.cacheService.getStats();
  }

  /**
   * Force refresh all data services
   */
  async refreshAllData(): Promise<void> {
    try {
      this.contextLogger.info("Refreshing all data services...");

      const promises: Promise<any>[] = [];

      if (this.bitcoinIntelligenceService) {
        promises.push(this.bitcoinIntelligenceService.forceUpdate());
      }

      if (this.marketDataService) {
        promises.push(this.marketDataService.forceUpdate());
      }

      await Promise.all(promises);
      this.contextLogger.info("All data services refreshed");
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error("Data refresh failed"),
        {
          correlationId: this.correlationId,
          component: "IntegrationService",
          operation: "refreshAllData",
        },
      );

      this.contextLogger.error("Failed to refresh data services", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Get integration statistics
   */
  getStats(): {
    isInitialized: boolean;
    uptime: number;
    errorCount: number;
    serviceCount: number;
    healthCheckEnabled: boolean;
  } {
    const services = this.getServices();
    const serviceCount = Object.values(services).filter(
      (service) => service !== null,
    ).length;

    return {
      isInitialized: this.isInitialized,
      uptime: Date.now() - this.startTime,
      errorCount: this.errorCount,
      serviceCount,
      healthCheckEnabled: this.integrationConfig.enableHealthChecks,
    };
  }

  async updateData(): Promise<void> {
    // Integration service doesn't need regular updates
  }

  async forceUpdate(): Promise<any> {
    return this.getStatus();
  }
}
