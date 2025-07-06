import { IAgentRuntime, logger, Service } from "@elizaos/core";
import { BitcoinDataService } from "./BitcoinDataService";
import { BitcoinNetworkDataService } from "./BitcoinNetworkDataService";
import { StockDataService } from "./StockDataService";
import { AltcoinDataService } from "./AltcoinDataService";
import { ETFDataService } from "./ETFDataService";
import { NFTDataService } from "./NFTDataService";
import { LifestyleDataService } from "./LifestyleDataService";
import { TravelDataService } from "./TravelDataService";
import { RealTimeDataService } from "./RealTimeDataService";
import { MorningBriefingService } from "./MorningBriefingService";
import { OpportunityAlertService } from "./OpportunityAlertService";
import { PerformanceTrackingService } from "./PerformanceTrackingService";
import { KnowledgeDigestService } from "./KnowledgeDigestService";
import { SlackIngestionService } from "./SlackIngestionService";
import { SchedulerService } from "./SchedulerService";

/**
 * Service Factory for managing service lifecycle
 */
export class ServiceFactory {
  private static serviceInstances = new Map<string, Service>();
  private static isInitialized = false;

  /**
   * Initialize all services with proper dependency injection
   */
  static async initializeServices(
    runtime: IAgentRuntime,
    config: Record<string, any>,
  ): Promise<void> {
    if (this.isInitialized) {
      logger.warn("[ServiceFactory] Services already initialized, skipping...");
      return;
    }

    logger.info("[ServiceFactory] Initializing Bitcoin LTL services...");

    try {
      // Initialize configuration manager first
      const { initializeConfigurationManager } = await import(
        "./ConfigurationManager"
      );
      await initializeConfigurationManager(runtime);
      logger.info(
        "[ServiceFactory] Configuration manager initialized successfully",
      );

      // Set environment variables from config
      for (const [key, value] of Object.entries(config)) {
        if (value) process.env[key] = value;
      }
      // Initialize services in dependency order
      const serviceClasses = [
        // Core data services (no dependencies)
        BitcoinDataService,
        BitcoinNetworkDataService,

        // Market data services
        StockDataService,
        AltcoinDataService,
        ETFDataService,
        NFTDataService,

        // Lifestyle and travel services
        LifestyleDataService,
        TravelDataService,

        // Real-time and aggregation services
        RealTimeDataService,

        // Analysis and intelligence services
        MorningBriefingService,
        OpportunityAlertService,
        PerformanceTrackingService,

        // Knowledge and content services
        KnowledgeDigestService,
        SlackIngestionService,

        // Scheduler service (depends on other services)
        SchedulerService,
      ];

      // Start services sequentially to handle dependencies
      for (const ServiceClass of serviceClasses) {
        try {
          logger.info(`[ServiceFactory] Starting ${ServiceClass.name}...`);

          const service = await ServiceClass.start(runtime);
          this.serviceInstances.set(
            ServiceClass.serviceType || ServiceClass.name.toLowerCase(),
            service,
          );

          // Store service instance for internal management
          // Note: ElizaOS plugin system handles service registration through the plugin config

          logger.info(
            `[ServiceFactory] ✅ ${ServiceClass.name} started successfully`,
          );
        } catch (error) {
          logger.error(
            `[ServiceFactory] ❌ Failed to start ${ServiceClass.name}:`,
            error,
          );
          // Continue with other services even if one fails
        }
      }

      this.isInitialized = true;
      logger.info("[ServiceFactory] 🎉 All services initialized successfully");

      // Log service status
      this.logServiceStatus();
    } catch (error) {
      logger.error(
        "[ServiceFactory] Critical error during service initialization:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get a service instance by type
   */
  static getService<T extends Service>(serviceType: string): T | null {
    const service = this.serviceInstances.get(serviceType) as T;
    if (!service) {
      logger.warn(
        `[ServiceFactory] Service '${serviceType}' not found or not initialized`,
      );
    }
    return service || null;
  }

  /**
   * Stop all services gracefully
   */
  static async stopAllServices(): Promise<void> {
    logger.info("[ServiceFactory] Stopping all services...");

    const stopPromises = Array.from(this.serviceInstances.values()).map(
      async (service) => {
        try {
          if (service.stop && typeof service.stop === "function") {
            await service.stop();
            logger.info(
              `[ServiceFactory] ✅ ${service.constructor.name} stopped`,
            );
          }
        } catch (error) {
          logger.error(
            `[ServiceFactory] ❌ Error stopping ${service.constructor.name}:`,
            error,
          );
        }
      },
    );

    await Promise.allSettled(stopPromises);
    this.serviceInstances.clear();
    this.isInitialized = false;

    logger.info("[ServiceFactory] 🛑 All services stopped");
  }

  /**
   * Log current service status
   */
  static logServiceStatus(): void {
    const serviceStatus = Array.from(this.serviceInstances.entries()).map(
      ([type, service]) => ({
        type,
        name: service.constructor.name,
        status: "running",
      }),
    );

    logger.info("[ServiceFactory] Service Status Summary:", {
      totalServices: serviceStatus.length,
      services: serviceStatus,
    });
  }

  /**
   * Health check for all services
   */
  static async healthCheck(): Promise<{
    healthy: boolean;
    services: { [key: string]: { status: string; error?: string } };
  }> {
    const serviceHealth: { [key: string]: { status: string; error?: string } } =
      {};
    let allHealthy = true;

    for (const [type, service] of this.serviceInstances.entries()) {
      try {
        // Try to call a health check method if it exists
        if (
          "healthCheck" in service &&
          typeof service.healthCheck === "function"
        ) {
          await (service as any).healthCheck();
        }
        serviceHealth[type] = { status: "healthy" };
      } catch (error) {
        serviceHealth[type] = {
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
        };
        allHealthy = false;
      }
    }

    return {
      healthy: allHealthy,
      services: serviceHealth,
    };
  }
}
