import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";

/**
 * Configuration service for Bitcoin Intelligence Plugin
 * Manages environment variables, API keys, and feature flags
 */
export class ConfigurationService extends BaseDataService {
  static serviceType = "bitcoin-configuration";
  capabilityDescription = "Configuration management service for Bitcoin intelligence plugin";

  // API Configuration
  private apiConfig = {
    coingecko: {
      apiKey: process.env.COINGECKO_API_KEY || "",
      baseUrl: process.env.COINGECKO_BASE_URL || "https://api.coingecko.com/api/v3",
      rateLimit: parseInt(process.env.COINGECKO_RATE_LIMIT || "50")
    },
    blockchain: {
      apiKey: process.env.BLOCKCHAIN_API_KEY || "",
      baseUrl: process.env.BLOCKCHAIN_BASE_URL || "https://api.blockchain.info",
      rateLimit: parseInt(process.env.BLOCKCHAIN_RATE_LIMIT || "30")
    },
    mempool: {
      baseUrl: process.env.MEMPOOL_BASE_URL || "https://mempool.space/api",
      rateLimit: parseInt(process.env.MEMPOOL_RATE_LIMIT || "60")
    },
    alternative: {
      baseUrl: process.env.ALTERNATIVE_BASE_URL || "https://api.alternative.me",
      rateLimit: parseInt(process.env.ALTERNATIVE_RATE_LIMIT || "30")
    },
    glassnode: {
      apiKey: process.env.GLASSNODE_API_KEY || "",
      baseUrl: process.env.GLASSNODE_BASE_URL || "https://api.glassnode.com/v1/metrics",
      rateLimit: parseInt(process.env.GLASSNODE_RATE_LIMIT || "10")
    },
    yahooFinance: {
      baseUrl: process.env.YAHOO_FINANCE_BASE_URL || "https://query1.finance.yahoo.com/v8/finance/chart",
      rateLimit: parseInt(process.env.YAHOO_FINANCE_RATE_LIMIT || "100")
    },
    alphaVantage: {
      apiKey: process.env.ALPHA_VANTAGE_API_KEY || "",
      baseUrl: process.env.ALPHA_VANTAGE_BASE_URL || "https://www.alphavantage.co/query",
      rateLimit: parseInt(process.env.ALPHA_VANTAGE_RATE_LIMIT || "5")
    },
    fred: {
      apiKey: process.env.FRED_API_KEY || "",
      baseUrl: process.env.FRED_BASE_URL || "https://api.stlouisfed.org/fred/series/observations",
      rateLimit: parseInt(process.env.FRED_RATE_LIMIT || "120")
    }
  };

  // Cache Configuration
  private cacheConfig = {
    networkData: parseInt(process.env.NETWORK_DATA_CACHE_TIMEOUT || "300"),
    marketData: parseInt(process.env.MARKET_DATA_CACHE_TIMEOUT || "600"),
    institutionalData: parseInt(process.env.INSTITUTIONAL_DATA_CACHE_TIMEOUT || "3600"),
    sentimentData: parseInt(process.env.SENTIMENT_DATA_CACHE_TIMEOUT || "1800")
  };

  // Feature Flags
  private featureFlags = {
    enableRealTimeUpdates: process.env.ENABLE_REALTIME_UPDATES === "true",
    enableOpportunityDetection: process.env.ENABLE_OPPORTUNITY_DETECTION === "true",
    enableCycleAnalysis: process.env.ENABLE_CYCLE_ANALYSIS === "true",
    enableInstitutionalTracking: process.env.ENABLE_INSTITUTIONAL_TRACKING === "true",
    enableOnchainAnalytics: process.env.ENABLE_ONCHAIN_ANALYTICS === "true"
  };

  // Thresholds
  private thresholds = {
    network: {
      highFeeRate: parseInt(process.env.HIGH_FEE_RATE_THRESHOLD || "50"),
      congestedMempool: parseInt(process.env.CONGESTED_MEMPOOL_THRESHOLD || "50"),
      extremeMVRV: parseFloat(process.env.EXTREME_MVRV_THRESHOLD || "3.5"),
      significantFlow: parseInt(process.env.SIGNIFICANT_FLOW_THRESHOLD || "1000")
    },
    market: {
      altcoinSeason: parseInt(process.env.ALTCOIN_SEASON_THRESHOLD || "75"),
      fearGreedExtreme: parseInt(process.env.FEAR_GREED_EXTREME_THRESHOLD || "25"),
      correlation: parseFloat(process.env.CORRELATION_THRESHOLD || "0.7")
    },
    institutional: {
      corporateAdoption: parseInt(process.env.CORPORATE_ADOPTION_THRESHOLD || "70"),
      sovereignAdoption: parseInt(process.env.SOVEREIGN_ADOPTION_THRESHOLD || "30"),
      bankingAdoption: parseInt(process.env.BANKING_ADOPTION_THRESHOLD || "60")
    }
  };

  // Logging Configuration
  private loggingConfig = {
    level: process.env.LOG_LEVEL || "info",
    enableApiLogging: process.env.ENABLE_API_LOGGING === "true",
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === "true"
  };

  // Development Configuration
  private devConfig = {
    useMockData: process.env.USE_MOCK_DATA === "true",
    testMode: process.env.TEST_MODE === "true"
  };

  constructor(runtime: IAgentRuntime) {
    super(runtime, "bitcoinData");
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("ConfigurationService starting...");
    const service = new ConfigurationService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("ConfigurationService stopping...");
    const service = runtime.getService("bitcoin-configuration");
    if (service && typeof service.stop === "function") {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    logger.info("ConfigurationService starting...");
    await this.validateConfiguration();
    logger.info("ConfigurationService started successfully");
  }

  async init() {
    logger.info("ConfigurationService initialized");
    await this.validateConfiguration();
  }

  async stop() {
    logger.info("ConfigurationService stopped");
  }

  // Required BaseDataService methods
  async updateData(): Promise<void> {
    // Configuration service doesn't need data updates
    logger.debug("ConfigurationService updateData called - no action needed");
  }

  async forceUpdate(): Promise<any> {
    // Configuration service doesn't need data updates
    logger.debug("ConfigurationService forceUpdate called - no action needed");
    return null;
  }

  // ============================================================================
  // CONFIGURATION GETTERS
  // ============================================================================

  /**
   * Get API configuration
   */
  getAPIConfig() {
    return this.apiConfig;
  }

  /**
   * Get cache configuration
   */
  getCacheConfig() {
    return this.cacheConfig;
  }

  /**
   * Get feature flags
   */
  getFeatureFlags() {
    return this.featureFlags;
  }

  /**
   * Get thresholds
   */
  getThresholds() {
    return this.thresholds;
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return this.loggingConfig;
  }

  /**
   * Get development configuration
   */
  getDevConfig() {
    return this.devConfig;
  }

  /**
   * Get specific API configuration
   */
  getAPIConfigFor(apiName: string) {
    const config = this.apiConfig[apiName as keyof typeof this.apiConfig];
    return config;
  }

  /**
   * Get specific cache timeout
   */
  getCacheTimeout(dataType: string): number {
    return this.cacheConfig[dataType as keyof typeof this.cacheConfig] || 300;
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: string): boolean {
    return this.featureFlags[feature as keyof typeof this.featureFlags] || false;
  }

  /**
   * Get threshold value
   */
  getThreshold(category: string, threshold: string): number {
    const categoryThresholds = this.thresholds[category as keyof typeof this.thresholds];
    if (!categoryThresholds) return 0;
    return categoryThresholds[threshold as keyof typeof categoryThresholds] || 0;
  }

  // ============================================================================
  // CONFIGURATION VALIDATION
  // ============================================================================

  /**
   * Validate configuration and log warnings for missing API keys
   */
  private async validateConfiguration() {
    logger.info("Validating Bitcoin Intelligence configuration...");

    // Check for required API keys
    const missingKeys: string[] = [];
    
    if ('apiKey' in this.apiConfig.coingecko && !this.apiConfig.coingecko.apiKey) {
      missingKeys.push("COINGECKO_API_KEY (optional - free tier available)");
    }
    
    if ('apiKey' in this.apiConfig.blockchain && !this.apiConfig.blockchain.apiKey) {
      missingKeys.push("BLOCKCHAIN_API_KEY (optional - free tier available)");
    }
    
    if ('apiKey' in this.apiConfig.glassnode && !this.apiConfig.glassnode.apiKey) {
      missingKeys.push("GLASSNODE_API_KEY (required for on-chain analytics)");
    }
    
    if ('apiKey' in this.apiConfig.alphaVantage && !this.apiConfig.alphaVantage.apiKey) {
      missingKeys.push("ALPHA_VANTAGE_API_KEY (optional - free tier available)");
    }
    
    if ('apiKey' in this.apiConfig.fred && !this.apiConfig.fred.apiKey) {
      missingKeys.push("FRED_API_KEY (optional - free tier available)");
    }

    if (missingKeys.length > 0) {
      logger.warn("Missing API keys detected:");
      missingKeys.forEach(key => logger.warn(`  - ${key}`));
      logger.warn("Some features may be limited. See env.example for configuration options.");
    }

    // Check feature flags
    if (this.featureFlags.enableOnchainAnalytics && 'apiKey' in this.apiConfig.glassnode && !this.apiConfig.glassnode.apiKey) {
      logger.warn("On-chain analytics enabled but GLASSNODE_API_KEY not provided. Feature will be disabled.");
      this.featureFlags.enableOnchainAnalytics = false;
    }

    // Log configuration summary
    logger.info("Configuration validation complete", {
      apisConfigured: Object.keys(this.apiConfig).length,
      featuresEnabled: Object.values(this.featureFlags).filter(Boolean).length,
      cacheTimeouts: Object.keys(this.cacheConfig).length,
      thresholds: Object.keys(this.thresholds).length
    });
  }

  // ============================================================================
  // CONFIGURATION UPDATES
  // ============================================================================

  /**
   * Update configuration at runtime
   */
  updateConfiguration(updates: Partial<{
    apiConfig: Partial<typeof this.apiConfig>;
    cacheConfig: Partial<typeof this.cacheConfig>;
    featureFlags: Partial<typeof this.featureFlags>;
    thresholds: Partial<typeof this.thresholds>;
    loggingConfig: Partial<typeof this.loggingConfig>;
    devConfig: Partial<typeof this.devConfig>;
  }>) {
    if (updates.apiConfig) {
      this.apiConfig = { ...this.apiConfig, ...updates.apiConfig };
    }
    
    if (updates.cacheConfig) {
      this.cacheConfig = { ...this.cacheConfig, ...updates.cacheConfig };
    }
    
    if (updates.featureFlags) {
      this.featureFlags = { ...this.featureFlags, ...updates.featureFlags };
    }
    
    if (updates.thresholds) {
      this.thresholds = { ...this.thresholds, ...updates.thresholds };
    }
    
    if (updates.loggingConfig) {
      this.loggingConfig = { ...this.loggingConfig, ...updates.loggingConfig };
    }
    
    if (updates.devConfig) {
      this.devConfig = { ...this.devConfig, ...updates.devConfig };
    }

    logger.info("Configuration updated", updates);
  }

  /**
   * Get configuration summary for debugging
   */
  getConfigurationSummary() {
    return {
      apis: Object.keys(this.apiConfig).map(api => {
        const config = this.apiConfig[api as keyof typeof this.apiConfig];
        return {
          name: api,
          configured: 'apiKey' in config ? !!config.apiKey : false,
          rateLimit: config.rateLimit
        };
      }),
      features: Object.entries(this.featureFlags).map(([feature, enabled]) => ({
        feature,
        enabled
      })),
      cache: this.cacheConfig,
      thresholds: this.thresholds,
      logging: this.loggingConfig,
      development: this.devConfig
    };
  }
} 