import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { z } from "zod";
import { 
  configSummary, 
  serviceStatus, 
  success, 
  info, 
  warning, 
  error,
  startupBanner,
  sectionHeader,
  subsectionHeader,
  listItem,
  keyValue,
  divider
} from "../utils/terminal-formatting";

/**
 * Configuration schema for Bitcoin LTL plugin services
 */
const ServiceConfigSchema = z.object({
  // Bitcoin Data Service Configuration
  bitcoinData: z
    .object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      cacheTimeout: z.number().default(60000), // 1 minute
      rateLimitDelay: z.number().default(3000), // 3 seconds
      maxRetries: z.number().default(3),
      circuitBreakerThreshold: z.number().default(5),
      circuitBreakerTimeout: z.number().default(60000), // 1 minute
    })
    .default({}),

  // Bitcoin Network Service Configuration
  bitcoinNetwork: z
    .object({
      enabled: z.boolean().default(true),
      mempoolSpaceBaseUrl: z.string().default("https://mempool.space/api"),
      cacheTimeout: z.number().default(30000), // 30 seconds
      rateLimitDelay: z.number().default(2000), // 2 seconds
      maxRetries: z.number().default(3),
    })
    .default({}),

  // Stock Data Service Configuration
  stockData: z
    .object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      provider: z
        .enum(["alpha_vantage", "fmp", "polygon"])
        .default("alpha_vantage"),
      cacheTimeout: z.number().default(300000), // 5 minutes
      rateLimitDelay: z.number().default(5000), // 5 seconds
      maxRetries: z.number().default(3),
    })
    .default({}),

  // Altcoin Data Service Configuration
  altcoinData: z
    .object({
      enabled: z.boolean().default(true),
      coinGeckoApiKey: z.string().optional(),
      cacheTimeout: z.number().default(60000), // 1 minute
      rateLimitDelay: z.number().default(3000), // 3 seconds
      maxRetries: z.number().default(3),
      trackedCoins: z
        .array(z.string())
        .default(["ethereum", "chainlink", "solana", "cardano", "polygon"]),
    })
    .default({}),

  // ETF Data Service Configuration
  etfData: z
    .object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      cacheTimeout: z.number().default(300000), // 5 minutes
      rateLimitDelay: z.number().default(5000), // 5 seconds
      maxRetries: z.number().default(3),
      trackedETFs: z
        .array(z.string())
        .default(["GBTC", "IBIT", "FBTC", "BITB", "EZBC"]),
    })
    .default({}),

  // NFT Data Service Configuration
  nftData: z
    .object({
      enabled: z.boolean().default(true),
      openSeaApiKey: z.string().optional(),
      cacheTimeout: z.number().default(600000), // 10 minutes
      rateLimitDelay: z.number().default(5000), // 5 seconds
      maxRetries: z.number().default(3),
      trackedCollections: z
        .array(z.string())
        .default(["bitcoin-nfts", "ordinals", "runes"]),
    })
    .default({}),

  // Lifestyle Data Service Configuration
  lifestyleData: z
    .object({
      enabled: z.boolean().default(true),
      weatherApiKey: z.string().optional(),
      cacheTimeout: z.number().default(600000), // 10 minutes
      rateLimitDelay: z.number().default(2000), // 2 seconds
      maxRetries: z.number().default(3),
      defaultLocation: z.string().default("New York"),
    })
    .default({}),

  // Home Cooking Service Configuration
  homeCooking: z
    .object({
      enabled: z.boolean().default(true),
      cacheTimeout: z.number().default(86400000), // 24 hours
      maxRetries: z.number().default(3),
    })
    .default({}),

  // Beverage Knowledge Service Configuration
  beverageKnowledge: z
    .object({
      enabled: z.boolean().default(true),
      cacheTimeout: z.number().default(86400000), // 24 hours
      maxRetries: z.number().default(3),
    })
    .default({}),

  // Daily Culinary Service Configuration
  dailyCulinary: z
    .object({
      enabled: z.boolean().default(true),
      cacheTimeout: z.number().default(3600000), // 1 hour
      maxRetries: z.number().default(3),
    })
    .default({}),

  // Travel Data Service Configuration
  travelData: z
    .object({
      enabled: z.boolean().default(true),
      bookingApiKey: z.string().optional(),
      cacheTimeout: z.number().default(3600000), // 1 hour
      rateLimitDelay: z.number().default(3000), // 3 seconds
      maxRetries: z.number().default(3),
      defaultCurrency: z.string().default("USD"),
    })
    .default({}),

  // Real-time Data Service Configuration
  realTimeData: z
    .object({
      enabled: z.boolean().default(true),
      dexScreenerApiKey: z.string().optional(),
      cacheTimeout: z.number().default(300000), // 5 minutes
      rateLimitDelay: z.number().default(2000), // 2 seconds
      maxRetries: z.number().default(3),
      updateInterval: z.number().default(300000), // 5 minutes
    })
    .default({}),

  // Analysis Services Configuration
  morningBriefing: z
    .object({
      enabled: z.boolean().default(true),
      schedule: z.string().default("0 7 * * *"), // 7 AM daily
      timezone: z.string().default("America/New_York"),
      includeSections: z
        .array(z.string())
        .default([
          "bitcoin_price",
          "thesis_progress",
          "market_summary",
          "news_highlights",
        ]),
    })
    .default({}),

  opportunityAlert: z
    .object({
      enabled: z.boolean().default(true),
      priceThreshold: z.number().default(0.05), // 5% price change
      volumeThreshold: z.number().default(0.2), // 20% volume change
      checkInterval: z.number().default(300000), // 5 minutes
    })
    .default({}),

  performanceTracking: z
    .object({
      enabled: z.boolean().default(true),
      trackingInterval: z.number().default(3600000), // 1 hour
      retentionPeriod: z.number().default(2592000000), // 30 days
      includeMetrics: z
        .array(z.string())
        .default(["price_performance", "thesis_progress", "market_metrics"]),
    })
    .default({}),

  // BTC Performance Service Configuration
  btcPerformance: z
    .object({
      enabled: z.boolean().default(true),
      cacheTimeout: z.number().default(300000), // 5 minutes
      updateInterval: z.number().default(300000), // 5 minutes
      maxRetries: z.number().default(3),
      includeAssetClasses: z
        .array(z.string())
        .default(["STOCK", "ALTCOIN", "COMMODITY", "INDEX"]),
    })
    .default({}),

  // Content Services Configuration
  knowledgeDigest: z
    .object({
      enabled: z.boolean().default(true),
      digestInterval: z.number().default(86400000), // 24 hours
      maxArticles: z.number().default(10),
      sources: z
        .array(z.string())
        .default(["bitcoin_magazine", "coindesk", "cointelegraph"]),
    })
    .default({}),

  slackIngestion: z
    .object({
      enabled: z.boolean().default(false),
      webhookUrl: z.string().optional(),
      channels: z.array(z.string()).default([]),
      includeThreads: z.boolean().default(true),
    })
    .default({}),

  // Scheduler Service Configuration
  scheduler: z
    .object({
      enabled: z.boolean().default(true),
      maxConcurrentJobs: z.number().default(5),
      jobTimeout: z.number().default(300000), // 5 minutes
      retryFailedJobs: z.boolean().default(true),
      maxRetries: z.number().default(3),
    })
    .default({}),

  // Global Configuration
  global: z
    .object({
      enableHealthChecks: z.boolean().default(true),
      healthCheckInterval: z.number().default(60000), // 1 minute
      enableMetrics: z.boolean().default(true),
      metricsRetentionPeriod: z.number().default(604800000), // 7 days
      logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
      corsEnabled: z.boolean().default(true),
      corsOrigins: z.array(z.string()).default(["*"]),
    })
    .default({}),

  // Cache Service Configuration
  "cache-service": z.object({
    defaultTtl: z.number().default(300000).optional(),
    maxSize: z.number().default(1000).optional(),
    cleanupInterval: z.number().default(600000).optional(),
    enableRedis: z.boolean().default(false).optional(),
    redisUrl: z.string().optional(),
    redisPassword: z.string().optional(),
    redisDb: z.number().optional(),
    compressionEnabled: z.boolean().default(true).optional(),
    compressionThreshold: z.number().default(1024).optional(),
  }).default({}),
});

export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;

/**
 * Configuration Manager for Bitcoin LTL plugin services
 */
export class ConfigurationManager {
  private config: ServiceConfig;
  private runtime: IAgentRuntime;
  private lastUpdated: number = 0;
  private configWatchers: Map<string, (config: any) => void> = new Map();

  constructor(runtime: IAgentRuntime) {
    this.runtime = runtime;
    this.config = this.loadDefaultConfig();
  }

  /**
   * Initialize configuration from runtime settings and environment variables
   */
  async initialize(): Promise<void> {
    try {
      console.log("[DEBUG] ConfigurationManager.initialize() - Starting initialization");
      
      // Load configuration from multiple sources
      console.log("[DEBUG] Loading default configuration...");
      const defaultConfig = this.loadDefaultConfig();
      console.log("[DEBUG] Default config loaded:", Object.keys(defaultConfig));
      
      console.log("[DEBUG] Loading environment configuration...");
      const envConfig = this.loadFromEnvironment();
      console.log("[DEBUG] Environment config loaded:", Object.keys(envConfig));
      
      console.log("[DEBUG] Loading runtime configuration...");
      const runtimeConfig = this.loadFromRuntime();
      console.log("[DEBUG] Runtime config loaded:", Object.keys(runtimeConfig));

      // Merge configurations with priority: runtime > environment > default
      console.log("[DEBUG] Merging configurations...");
      const mergedConfig = this.mergeConfigs(
        defaultConfig,
        envConfig,
        runtimeConfig,
      );
      console.log("[DEBUG] Configs merged successfully");

      // Validate and set configuration
      console.log("[DEBUG] Validating configuration with schema...");
      this.config = ServiceConfigSchema.parse(mergedConfig);
      console.log("[DEBUG] Configuration validated successfully");
      
      this.lastUpdated = Date.now();
      console.log("[DEBUG] Configuration timestamp updated");

      // Log startup banner
      console.log("[DEBUG] Logging startup banner...");
      console.log(startupBanner());

      // Log configuration summary
      console.log("[DEBUG] Logging configuration summary...");
      this.logConfigurationSummary();

      console.log("[DEBUG] ConfigurationManager.initialize() - Initialization completed successfully");
      elizaLogger.info(success("Service configuration loaded successfully"));
    } catch (error) {
      console.log("[DEBUG] ConfigurationManager.initialize() - Error occurred:", error);
      console.log("[DEBUG] Error type:", typeof error);
      console.log("[DEBUG] Error name:", error instanceof Error ? error.name : 'Not an Error object');
      console.log("[DEBUG] Error message:", error instanceof Error ? error.message : String(error));
      console.log("[DEBUG] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      // Check if error3 is being referenced somewhere
      console.log("[DEBUG] Checking for error3 references...");
      try {
        // This is just to see if error3 exists in scope
        console.log("[DEBUG] typeof error3:", typeof (globalThis as any).error3);
        if ((globalThis as any).error3) {
          console.log("[DEBUG] error3 found in global scope:", (globalThis as any).error3);
        }
      } catch (e) {
        console.log("[DEBUG] No error3 in global scope");
      }
      
      elizaLogger.error(error("Failed to initialize configuration manager:"), error);
      throw error;
    }
  }

  /**
   * Get configuration for a specific service
   */
  getServiceConfig<T extends keyof ServiceConfig>(
    serviceName: T,
  ): ServiceConfig[T] {
    return this.config[serviceName];
  }

  /**
   * Get global configuration
   */
  getGlobalConfig(): ServiceConfig["global"] {
    return this.config.global;
  }

  /**
   * Update configuration for a specific service
   */
  updateServiceConfig<T extends keyof ServiceConfig>(
    serviceName: T,
    updates: Partial<ServiceConfig[T]>,
  ): void {
    try {
      this.config[serviceName] = { ...this.config[serviceName], ...updates };
      this.lastUpdated = Date.now();

      // Notify watchers
      const watcher = this.configWatchers.get(serviceName);
      if (watcher) {
        watcher(this.config[serviceName]);
      }

      elizaLogger.info(
        `[ConfigurationManager] Updated configuration for ${serviceName}`,
      );
    } catch (error) {
      elizaLogger.error(
        `[ConfigurationManager] Failed to update configuration for ${serviceName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Watch for configuration changes
   */
  watchConfig<T extends keyof ServiceConfig>(
    serviceName: T,
    callback: (config: ServiceConfig[T]) => void,
  ): void {
    this.configWatchers.set(serviceName, callback);
  }

  /**
   * Check if a service is enabled
   */
  isServiceEnabled(serviceName: keyof ServiceConfig): boolean {
    const serviceConfig = this.config[serviceName] as any;
    return serviceConfig?.enabled !== false;
  }

  /**
   * Get configuration status
   */
  getConfigurationStatus(): {
    lastUpdated: number;
    servicesEnabled: number;
    servicesDisabled: number;
    hasValidConfiguration: boolean;
  } {
    const services = Object.keys(this.config).filter((key) => key !== "global");
    const enabledServices = services.filter((service) =>
      this.isServiceEnabled(service as keyof ServiceConfig),
    );

    return {
      lastUpdated: this.lastUpdated,
      servicesEnabled: enabledServices.length,
      servicesDisabled: services.length - enabledServices.length,
      hasValidConfiguration: this.lastUpdated > 0,
    };
  }

  /**
   * Load default configuration
   */
  private loadDefaultConfig(): ServiceConfig {
    return ServiceConfigSchema.parse({});
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): Partial<ServiceConfig> {
    const envConfig: any = {};

    // Bitcoin Data Service
    if (process.env.BITCOIN_DATA_ENABLED !== undefined) {
      envConfig.bitcoinData = {
        enabled: process.env.BITCOIN_DATA_ENABLED === "true",
      };
    }
    if (process.env.COINGECKO_API_KEY) {
      envConfig.bitcoinData = {
        ...envConfig.bitcoinData,
        apiKey: process.env.COINGECKO_API_KEY,
      };
    }

    // Stock Data Service
    if (process.env.STOCK_DATA_ENABLED !== undefined) {
      envConfig.stockData = {
        enabled: process.env.STOCK_DATA_ENABLED === "true",
      };
    }
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      envConfig.stockData = {
        ...envConfig.stockData,
        apiKey: process.env.ALPHA_VANTAGE_API_KEY,
      };
    }

    // Altcoin Data Service
    if (process.env.ALTCOIN_DATA_ENABLED !== undefined) {
      envConfig.altcoinData = {
        enabled: process.env.ALTCOIN_DATA_ENABLED === "true",
      };
    }
    if (process.env.COINGECKO_API_KEY) {
      envConfig.altcoinData = {
        ...envConfig.altcoinData,
        coinGeckoApiKey: process.env.COINGECKO_API_KEY,
      };
    }

    // Lifestyle Data Service
    if (process.env.LIFESTYLE_DATA_ENABLED !== undefined) {
      envConfig.lifestyleData = {
        enabled: process.env.LIFESTYLE_DATA_ENABLED === "true",
      };
    }
    if (process.env.WEATHER_API_KEY) {
      envConfig.lifestyleData = {
        ...envConfig.lifestyleData,
        weatherApiKey: process.env.WEATHER_API_KEY,
      };
    }

    // Travel Data Service
    if (process.env.TRAVEL_DATA_ENABLED !== undefined) {
      envConfig.travelData = {
        enabled: process.env.TRAVEL_DATA_ENABLED === "true",
      };
    }
    if (process.env.BOOKING_API_KEY) {
      envConfig.travelData = {
        ...envConfig.travelData,
        bookingApiKey: process.env.BOOKING_API_KEY,
      };
    }

    // Real-time Data Service
    if (process.env.REALTIME_DATA_ENABLED !== undefined) {
      envConfig.realTimeData = {
        enabled: process.env.REALTIME_DATA_ENABLED === "true",
      };
    }
    if (process.env.DEXSCREENER_API_KEY) {
      envConfig.realTimeData = {
        ...envConfig.realTimeData,
        dexScreenerApiKey: process.env.DEXSCREENER_API_KEY,
      };
    }

    // Slack Ingestion Service
    if (process.env.SLACK_INGESTION_ENABLED !== undefined) {
      envConfig.slackIngestion = {
        enabled: process.env.SLACK_INGESTION_ENABLED === "true",
      };
    }
    if (process.env.SLACK_WEBHOOK_URL) {
      envConfig.slackIngestion = {
        ...envConfig.slackIngestion,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
      };
    }

    // Global Configuration
    if (process.env.LOG_LEVEL) {
      envConfig.global = { logLevel: process.env.LOG_LEVEL };
    }
    if (process.env.HEALTH_CHECK_INTERVAL) {
      envConfig.global = {
        ...envConfig.global,
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL),
      };
    }

    return envConfig;
  }

  /**
   * Load configuration from runtime settings
   */
  private loadFromRuntime(): Partial<ServiceConfig> {
    const runtimeConfig: any = {};

    try {
      // Load from runtime settings if available
      const settings = this.runtime.character?.settings;
      if (settings && typeof settings === "object") {
        const pluginSettings = (settings as any).plugins?.["bitcoin-ltl"];
        if (pluginSettings) {
          Object.assign(runtimeConfig, pluginSettings);
        }
      }
    } catch (error) {
      elizaLogger.warn(
        "[ConfigurationManager] Failed to load runtime configuration:",
        error,
      );
    }

    return runtimeConfig;
  }

  /**
   * Merge multiple configuration sources
   */
  private mergeConfigs(
    ...configs: Partial<ServiceConfig>[]
  ): Partial<ServiceConfig> {
    const merged: any = {};

    for (const config of configs) {
      for (const [key, value] of Object.entries(config)) {
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          merged[key] = { ...merged[key], ...value };
        } else {
          merged[key] = value;
        }
      }
    }

    return merged;
  }

  /**
   * Log configuration summary
   */
  private logConfigurationSummary(): void {
    const status = this.getConfigurationStatus();
    const enabledServices = Object.keys(this.config).filter(
      (key) =>
        key !== "global" && this.isServiceEnabled(key as keyof ServiceConfig),
    );
    const disabledServices = Object.keys(this.config).filter(
      (key) =>
        key !== "global" && !this.isServiceEnabled(key as keyof ServiceConfig),
    );

    const summary = configSummary({
      servicesEnabled: status.servicesEnabled,
      servicesDisabled: status.servicesDisabled,
      servicesWarning: 0, // No warning services in current implementation
      servicesError: 0, // No error services in current implementation
      enabledServices,
      disabledServices,
      warningServices: [], // No warning services in current implementation
      errorServices: [], // No error services in current implementation
      globalConfig: this.config.global,
    });

    console.log(summary);
  }
}

/**
 * Global configuration manager instance
 */
let configurationManager: ConfigurationManager | null = null;

/**
 * Get the global configuration manager instance
 */
export function getConfigurationManager(): ConfigurationManager {
  if (!configurationManager) {
    throw new Error(
      "Configuration manager not initialized. Call initializeConfigurationManager() first.",
    );
  }
  return configurationManager;
}

/**
 * Initialize the global configuration manager
 */
export async function initializeConfigurationManager(
  runtime: IAgentRuntime,
): Promise<ConfigurationManager> {
  console.log("[DEBUG] initializeConfigurationManager() - Starting");
  console.log("[DEBUG] Runtime provided:", !!runtime);
  console.log("[DEBUG] ConfigurationManager class:", typeof ConfigurationManager);
  
  if (!configurationManager) {
    console.log("[DEBUG] Creating new ConfigurationManager instance...");
    try {
      configurationManager = new ConfigurationManager(runtime);
      console.log("[DEBUG] ConfigurationManager instance created successfully");
      
      console.log("[DEBUG] Calling configurationManager.initialize()...");
      await configurationManager.initialize();
      console.log("[DEBUG] configurationManager.initialize() completed successfully");
    } catch (error) {
      console.log("[DEBUG] Error in initializeConfigurationManager:", error);
      console.log("[DEBUG] Error type:", typeof error);
      console.log("[DEBUG] Error message:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  } else {
    console.log("[DEBUG] ConfigurationManager already exists, returning existing instance");
  }
  
  console.log("[DEBUG] initializeConfigurationManager() - Completed successfully");
  return configurationManager;
}

/**
 * Reset the global configuration manager (for testing)
 */
export function resetConfigurationManager(): void {
  configurationManager = null;
}
