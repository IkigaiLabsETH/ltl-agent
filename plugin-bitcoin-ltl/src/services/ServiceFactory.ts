import { IAgentRuntime, logger, Service } from "@elizaos/core";
import { BitcoinDataService } from "./BitcoinDataService";
import { BitcoinNetworkDataService } from "./BitcoinNetworkDataService";
import { StockDataService } from "./StockDataService";
import { AltcoinDataService } from "./AltcoinDataService";
import { ETFDataService } from "./ETFDataService";
import { NFTDataService } from "./NFTDataService";
import { LifestyleDataService } from "./LifestyleDataService";
import { TravelDataService } from "./TravelDataService";
import { CulturalContextService } from "./CulturalContextService";
import { RealTimeDataService } from "./RealTimeDataService";
import { MorningBriefingService } from "./MorningBriefingService";
import { OpportunityAlertService } from "./OpportunityAlertService";
import { PerformanceTrackingService } from "./PerformanceTrackingService";
import { KnowledgeDigestService } from "./KnowledgeDigestService";
import { SlackIngestionService } from "./SlackIngestionService";
import { SchedulerService } from "./SchedulerService";

// New Bitcoin Intelligence Services
import { BitcoinIntelligenceService } from "./BitcoinIntelligenceService";
import { MarketIntelligenceService } from "./MarketIntelligenceService";
import { InstitutionalAdoptionService } from "./InstitutionalAdoptionService";
import { ConfigurationService } from "./ConfigurationService";
import { KnowledgeBaseService } from "./KnowledgeBaseService";

// Pretty formatting
import { 
  success, 
  info, 
  warning, 
  error as errorFormat,
  serviceStartup,
  serviceStarted,
  serviceError,
  sectionHeader,
  subsectionHeader,
  progressBar,
  divider
} from "../utils/terminal-formatting";

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
    console.log("[DEBUG] ServiceFactory.initializeServices() - Starting");
    console.log("[DEBUG] Runtime provided:", !!runtime);
    console.log("[DEBUG] Config keys:", Object.keys(config));
    
    if (this.isInitialized) {
      logger.warn(warning("Services already initialized, skipping..."));
      return;
    }

    console.log(sectionHeader("Service Initialization", "🔧"));

    try {
      // Initialize configuration manager first
      console.log("[DEBUG] Importing ConfigurationManager...");
      const { initializeConfigurationManager } = await import(
        "./ConfigurationManager"
      );
      console.log("[DEBUG] ConfigurationManager imported successfully");
      console.log("[DEBUG] initializeConfigurationManager function:", typeof initializeConfigurationManager);
      
      console.log("[DEBUG] Calling initializeConfigurationManager...");
      await initializeConfigurationManager(runtime);
      console.log("[DEBUG] initializeConfigurationManager completed successfully");
      logger.info(success("Configuration manager initialized successfully"));

      // Set environment variables from config
      console.log("[DEBUG] Setting environment variables from config...");
      for (const [key, value] of Object.entries(config)) {
        if (value) process.env[key] = value;
      }
      console.log("[DEBUG] Environment variables set");
      
      // Initialize services in dependency order
      const serviceClasses = [
        // Core data services (no dependencies)
        BitcoinDataService,
        BitcoinNetworkDataService,

        // New Bitcoin Intelligence Services (Phase 2 & 3)
        ConfigurationService,
        BitcoinIntelligenceService,
        MarketIntelligenceService,
        InstitutionalAdoptionService,
        KnowledgeBaseService,

        // Market data services
        StockDataService,
        AltcoinDataService,
        ETFDataService,
        NFTDataService,

        // Lifestyle and travel services
        LifestyleDataService,
        TravelDataService,
        CulturalContextService,

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

      console.log(subsectionHeader(`Starting ${serviceClasses.length} Services`, "▶️"));

      // Start services sequentially to handle dependencies
      for (let i = 0; i < serviceClasses.length; i++) {
        const ServiceClass = serviceClasses[i];
        try {
          const serviceName = ServiceClass.name;
          console.log(serviceStartup(serviceName));
          console.log(progressBar(i + 1, serviceClasses.length, 30));

          const service = await ServiceClass.start(runtime);
          this.serviceInstances.set(
            ServiceClass.serviceType || ServiceClass.name.toLowerCase(),
            service,
          );

          console.log(serviceStarted(serviceName));

        } catch (error) {
          console.log(serviceError(ServiceClass.name, error instanceof Error ? error.message : String(error)));
          // Continue with other services even if one fails
        }
      }

      this.isInitialized = true;
      console.log(divider());
      logger.info(success("All services initialized successfully"));

      // Log service status
      this.logServiceStatus();
    } catch (error) {
      console.log("[DEBUG] ServiceFactory.initializeServices() - Error occurred:", error);
      console.log("[DEBUG] Error type:", typeof error);
      console.log("[DEBUG] Error name:", error instanceof Error ? error.name : 'Not an Error object');
      console.log("[DEBUG] Error message:", error instanceof Error ? error.message : String(error));
      console.log("[DEBUG] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      logger.error(errorFormat("Critical error during service initialization:"), error);
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
