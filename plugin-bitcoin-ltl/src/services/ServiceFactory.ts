import type { IAgentRuntime } from '@elizaos/core';
import { Service, elizaLogger } from '@elizaos/core';
import { ConfigurationManager } from './ConfigurationManager';
import { 
  BitcoinDataService, 
  SlackIngestionService, 
  MorningBriefingService,
  KnowledgeDigestService,
  OpportunityAlertService,
  PerformanceTrackingService,
  SchedulerService,
  RealTimeDataService,
  StockDataService,
  LifestyleDataService,
  ETFDataService,
  TravelDataService,
  NFTDataService,
  AltcoinDataService,
  BitcoinNetworkDataService,
  ContentIngestionService
} from './index';

/**
 * ServiceFactory class for managing service lifecycle and dependency injection
 */
export class ServiceFactory {
  private static serviceInstances = new Map<string, Service>();
  private static isInitialized = false;
  private static configManager: ConfigurationManager;

  /**
   * Initialize all services in the correct order
   */
  static async initializeServices(runtime: IAgentRuntime, config: Record<string, string>): Promise<void> {
    if (this.isInitialized) {
      elizaLogger.warn('[ServiceFactory] Services already initialized');
      return;
    }

    elizaLogger.info('[ServiceFactory] Initializing Bitcoin LTL services...');

    try {
      // Initialize configuration manager first
      this.configManager = new ConfigurationManager(runtime);
      await this.configManager.initialize();
      elizaLogger.info('[ServiceFactory] Configuration manager initialized successfully');

      // Initialize services in dependency order
      const serviceConfigs = [
        { serviceClass: BitcoinDataService, configKey: 'bitcoinData' },
        { serviceClass: BitcoinNetworkDataService, configKey: 'bitcoinNetwork' },
        { serviceClass: StockDataService, configKey: 'stockData' },
        { serviceClass: AltcoinDataService, configKey: 'altcoinData' },
        { serviceClass: ETFDataService, configKey: 'etfData' },
        { serviceClass: NFTDataService, configKey: 'nftData' },
        { serviceClass: LifestyleDataService, configKey: 'lifestyleData' },
        { serviceClass: TravelDataService, configKey: 'travelData' },
        { serviceClass: RealTimeDataService, configKey: 'realTimeData' },
        { serviceClass: MorningBriefingService, configKey: 'morningBriefing' },
        { serviceClass: OpportunityAlertService, configKey: 'opportunityAlert' },
        { serviceClass: PerformanceTrackingService, configKey: 'performanceTracking' },
        { serviceClass: KnowledgeDigestService, configKey: 'knowledgeDigest' },
        { serviceClass: SchedulerService, configKey: 'scheduler' },
        { serviceClass: SlackIngestionService, configKey: 'slackIngestion' }
      ];

      for (const { serviceClass: ServiceClass, configKey } of serviceConfigs) {
        const serviceName = ServiceClass.serviceType;
        
        if (!this.configManager.isServiceEnabled(configKey as any)) {
          elizaLogger.info(`[ServiceFactory] Skipping disabled service: ${serviceName}`);
          continue;
        }

        try {
          elizaLogger.info(`[ServiceFactory] Starting ${serviceName}...`);
          const instance = new ServiceClass(runtime);
          
          // Initialize service if it has an init method
          if (typeof (instance as any).init === 'function') {
            await (instance as any).init();
          }
          
          this.serviceInstances.set(serviceName, instance);
          elizaLogger.info(`[ServiceFactory] ✅ ${serviceName} started successfully`);
        } catch (error) {
          elizaLogger.error(`[ServiceFactory] Failed to start ${serviceName}:`, error);
          throw error;
        }
      }

      this.isInitialized = true;
      elizaLogger.info('[ServiceFactory] All services initialized successfully');
      this.logServiceStatus();
    } catch (error) {
      elizaLogger.error('[ServiceFactory] Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * Get a service instance by type
   */
  static getService<T extends Service>(serviceType: string): T | null {
    const service = this.serviceInstances.get(serviceType);
    if (!service) {
      elizaLogger.warn(`[ServiceFactory] Service not found: ${serviceType}`);
      return null;
    }
    return service as T;
  }

  /**
   * Stop all services gracefully
   */
  static async stopAllServices(): Promise<void> {
    elizaLogger.info('[ServiceFactory] Stopping all services...');
    
    const services = Array.from(this.serviceInstances.entries());
    for (const [serviceName, service] of services) {
      try {
        await service.stop?.();
        elizaLogger.info(`[ServiceFactory] ✅ ${serviceName} stopped successfully`);
      } catch (error) {
        elizaLogger.error(`[ServiceFactory] Failed to stop ${serviceName}:`, error);
      }
    }
    
    this.serviceInstances.clear();
    this.isInitialized = false;
    elizaLogger.info('[ServiceFactory] All services stopped');
  }

  /**
   * Log status of all services
   */
  static logServiceStatus(): void {
    elizaLogger.info('[ServiceFactory] Service Status:');
    if (this.serviceInstances.size === 0) {
      elizaLogger.info('  No services running');
      return;
    }
    
    for (const [serviceName, service] of this.serviceInstances) {
      const status = service ? 'RUNNING' : 'STOPPED';
      elizaLogger.info(`  ${serviceName}: ${status}`);
    }
  }

  /**
   * Health check for all services
   */
  static async healthCheck(): Promise<{
    healthy: boolean;
    services: { [key: string]: { status: string; error?: string } };
  }> {
    const result = {
      healthy: true,
      services: {} as { [key: string]: { status: string; error?: string } }
    };

    for (const [serviceName, service] of this.serviceInstances) {
      try {
        // Check if service has a health check method
        if (service && typeof (service as any).healthCheck === 'function') {
          const health = await (service as any).healthCheck();
          result.services[serviceName] = { status: health.healthy ? 'healthy' : 'unhealthy' };
          if (!health.healthy) {
            result.healthy = false;
            result.services[serviceName].error = health.error || 'Unknown error';
          }
        } else {
          // Basic health check - just verify service exists
          result.services[serviceName] = { status: service ? 'running' : 'stopped' };
          if (!service) {
            result.healthy = false;
          }
        }
      } catch (error) {
        result.services[serviceName] = { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
        result.healthy = false;
      }
    }

    return result;
  }

  /**
   * Get configuration manager instance
   */
  static getConfigManager(): ConfigurationManager {
    return this.configManager;
  }

  /**
   * Check if services are initialized
   */
  static isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get all service instances
   */
  static getAllServices(): Map<string, Service> {
    return new Map(this.serviceInstances);
  }
} 