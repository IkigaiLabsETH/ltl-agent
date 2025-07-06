import { IAgentRuntime, elizaLogger } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';
import { LoggerWithContext, generateCorrelationId } from '../utils/helpers';
import { z } from 'zod';

/**
 * Centralized Configuration Schema
 * Validates all configuration values with proper types and constraints
 */
const ConfigSchema = z.object({
  // API Configuration
  apis: z.object({
    coingecko: z.object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      baseUrl: z.string().default('https://api.coingecko.com/api/v3'),
      rateLimit: z.number().default(50), // requests per minute
      timeout: z.number().default(10000),
    }),
    blockchain: z.object({
      enabled: z.boolean().default(true),
      baseUrl: z.string().default('https://api.blockchain.info'),
      timeout: z.number().default(10000),
    }),
    mempool: z.object({
      enabled: z.boolean().default(true),
      baseUrl: z.string().default('https://mempool.space/api'),
      timeout: z.number().default(10000),
    }),
    alternative: z.object({
      enabled: z.boolean().default(true),
      baseUrl: z.string().default('https://api.alternative.me'),
      timeout: z.number().default(10000),
    }),
    weather: z.object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      baseUrl: z.string().default('https://api.weatherapi.com/v1'),
      timeout: z.number().default(10000),
    }),
    stocks: z.object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      baseUrl: z.string().default('https://api.example.com/stocks'),
      timeout: z.number().default(10000),
    }),
    etfs: z.object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      baseUrl: z.string().default('https://api.example.com/etfs'),
      timeout: z.number().default(10000),
    }),
    travel: z.object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      baseUrl: z.string().default('https://api.example.com/travel'),
      timeout: z.number().default(10000),
    }),
    news: z.object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      baseUrl: z.string().default('https://newsapi.org/v2'),
      timeout: z.number().default(10000),
    }),
    opensea: z.object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      baseUrl: z.string().default('https://api.opensea.io/api/v1'),
      timeout: z.number().default(10000),
    }),
    twitter: z.object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      baseUrl: z.string().default('https://api.twitter.com/2'),
      timeout: z.number().default(10000),
    }),
    telegram: z.object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      baseUrl: z.string().default('https://api.telegram.org'),
      timeout: z.number().default(10000),
    }),
    discord: z.object({
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      baseUrl: z.string().default('https://discord.com/api'),
      timeout: z.number().default(10000),
    }),
  }),

  // Service Configuration
  services: z.object({
    bitcoinNetwork: z.object({
      enabled: z.boolean().default(true),
      updateInterval: z.number().default(180000), // 3 minutes
      cacheTimeout: z.number().default(60000), // 1 minute
      maxRetries: z.number().default(3),
      circuitBreakerThreshold: z.number().default(5),
      circuitBreakerTimeout: z.number().default(60000),
    }),
    marketData: z.object({
      enabled: z.boolean().default(true),
      updateInterval: z.number().default(300000), // 5 minutes
      cacheTimeout: z.number().default(300000), // 5 minutes
      maxRetries: z.number().default(3),
      circuitBreakerThreshold: z.number().default(5),
      circuitBreakerTimeout: z.number().default(60000),
    }),
    realTimeData: z.object({
      enabled: z.boolean().default(true),
      updateInterval: z.number().default(60000), // 1 minute
      cacheTimeout: z.number().default(30000), // 30 seconds
      maxRetries: z.number().default(3),
      circuitBreakerThreshold: z.number().default(5),
      circuitBreakerTimeout: z.number().default(60000),
    }),
    newsData: z.object({
      enabled: z.boolean().default(true),
      updateInterval: z.number().default(300000), // 5 minutes
      cacheTimeout: z.number().default(300000), // 5 minutes
      maxRetries: z.number().default(3),
      circuitBreakerThreshold: z.number().default(5),
      circuitBreakerTimeout: z.number().default(60000),
    }),
    nftData: z.object({
      enabled: z.boolean().default(true),
      updateInterval: z.number().default(300000), // 5 minutes
      cacheTimeout: z.number().default(60000), // 1 minute
      maxRetries: z.number().default(3),
      circuitBreakerThreshold: z.number().default(5),
      circuitBreakerTimeout: z.number().default(60000),
    }),
    socialSentiment: z.object({
      enabled: z.boolean().default(true),
      updateInterval: z.number().default(300000), // 5 minutes
      cacheTimeout: z.number().default(300000), // 5 minutes
      maxRetries: z.number().default(3),
      circuitBreakerThreshold: z.number().default(5),
      circuitBreakerTimeout: z.number().default(60000),
    }),
  }),

  // Request Batching Configuration
  batching: z.object({
    enabled: z.boolean().default(true),
    maxBatchSize: z.number().default(10),
    maxWaitTime: z.number().default(1000),
    maxConcurrentBatches: z.number().default(3),
    retryAttempts: z.number().default(3),
    retryDelay: z.number().default(1000),
  }),

  // Caching Configuration
  caching: z.object({
    enabled: z.boolean().default(true),
    defaultTtl: z.number().default(300000), // 5 minutes
    maxSize: z.number().default(1000),
    cleanupInterval: z.number().default(600000), // 10 minutes
    redis: z.object({
      enabled: z.boolean().default(false),
      url: z.string().optional(),
      password: z.string().optional(),
      db: z.number().default(0),
    }),
  }),

  // Logging Configuration
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    enableCorrelationIds: z.boolean().default(true),
    enablePerformanceTracking: z.boolean().default(true),
    logToFile: z.boolean().default(false),
    logFilePath: z.string().optional(),
  }),

  // Performance Configuration
  performance: z.object({
    enableMetrics: z.boolean().default(true),
    metricsInterval: z.number().default(60000), // 1 minute
    enableHealthChecks: z.boolean().default(true),
    healthCheckInterval: z.number().default(30000), // 30 seconds
    enableCircuitBreakers: z.boolean().default(true),
  }),

  // Security Configuration
  security: z.object({
    enableRateLimiting: z.boolean().default(true),
    maxRequestsPerMinute: z.number().default(100),
    enableRequestValidation: z.boolean().default(true),
    allowedOrigins: z.array(z.string()).default(['*']),
  }),

  // Feature Flags
  features: z.object({
    enableRealTimeUpdates: z.boolean().default(true),
    enablePredictiveAnalytics: z.boolean().default(false),
    enableAdvancedCharts: z.boolean().default(true),
    enableNotifications: z.boolean().default(true),
    enableDataExport: z.boolean().default(false),
  }),
});

export type PluginConfig = z.infer<typeof ConfigSchema>;

/**
 * Configuration change event
 */
export interface ConfigChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

/**
 * Configuration change listener
 */
export type ConfigChangeListener = (event: ConfigChangeEvent) => void;

/**
 * Centralized Configuration Service
 * Manages all plugin configuration with validation, hot reloading, and environment-specific settings
 */
export class CentralizedConfigService extends BaseDataService {
  static serviceType = 'centralized-config';
  
  private contextLogger: LoggerWithContext;
  private pluginConfig: PluginConfig;
  private configWatchers: Map<string, Set<ConfigChangeListener>> = new Map();
  private configFile: string;
  private lastModified: number = 0;

  constructor(runtime: IAgentRuntime) {
    super(runtime, 'bitcoinData');
    this.contextLogger = new LoggerWithContext(generateCorrelationId(), 'CentralizedConfigService');
    this.configFile = this.getSetting('CONFIG_FILE', './config/plugin-config.json');
    this.pluginConfig = this.getDefaultConfig();
  }

  public get capabilityDescription(): string {
    return 'Manages centralized configuration for all plugin services with validation, hot reloading, and environment-specific settings';
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info('Starting CentralizedConfigService...');
    return new CentralizedConfigService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info('Stopping CentralizedConfigService...');
    const service = runtime.getService('centralized-config') as unknown as CentralizedConfigService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info('CentralizedConfigService starting...');
    await this.loadConfiguration();
    this.startConfigWatcher();
  }

  async init() {
    this.contextLogger.info('CentralizedConfigService initialized');
  }

  async stop() {
    this.contextLogger.info('CentralizedConfigService stopping...');
    this.configWatchers.clear();
  }

  /**
   * Load configuration from file and environment variables
   */
  private async loadConfiguration(): Promise<void> {
    try {
      this.contextLogger.info('Loading configuration...');
      
      // Load from file if exists
      const fileConfig = await this.loadConfigFromFile();
      
      // Load from environment variables
      const envConfig = this.loadConfigFromEnvironment();
      
      // Merge configurations (env overrides file)
      const mergedConfig = this.mergeConfigurations(fileConfig, envConfig);
      
      // Validate configuration
      const validatedConfig = ConfigSchema.parse(mergedConfig);
      
      // Update configuration
      this.updateConfiguration(validatedConfig);
      
      this.contextLogger.info('Configuration loaded successfully');
    } catch (error) {
      this.contextLogger.error('Failed to load configuration', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Use default configuration
      this.pluginConfig = this.getDefaultConfig();
      this.contextLogger.warn('Using default configuration');
    }
  }

  /**
   * Load configuration from file
   */
  private async loadConfigFromFile(): Promise<Partial<PluginConfig>> {
    try {
      const fs = await import('fs/promises');
      const stats = await fs.stat(this.configFile);
      this.lastModified = stats.mtime.getTime();
      
      const content = await fs.readFile(this.configFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.contextLogger.warn('Config file not found or unreadable, using defaults', {
        file: this.configFile,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {};
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfigFromEnvironment(): Partial<PluginConfig> {
    const envConfig: Partial<PluginConfig> = {};
    
    // API Keys
    if (process.env.COINGECKO_API_KEY) {
      envConfig.apis = { ...envConfig.apis, coingecko: { apiKey: process.env.COINGECKO_API_KEY } };
    }
    if (process.env.WEATHER_API_KEY) {
      envConfig.apis = { ...envConfig.apis, weather: { apiKey: process.env.WEATHER_API_KEY } };
    }
    if (process.env.STOCKS_API_KEY) {
      envConfig.apis = { ...envConfig.apis, stocks: { apiKey: process.env.STOCKS_API_KEY } };
    }
    
    // Logging level
    if (process.env.LOG_LEVEL) {
      envConfig.logging = { level: process.env.LOG_LEVEL as any };
    }
    
    // Redis configuration
    if (process.env.REDIS_URL) {
      envConfig.caching = { 
        ...envConfig.caching, 
        redis: { 
          enabled: true, 
          url: process.env.REDIS_URL,
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0')
        } 
      };
    }
    
    return envConfig;
  }

  /**
   * Merge configurations with proper precedence
   */
  private mergeConfigurations(fileConfig: Partial<PluginConfig>, envConfig: Partial<PluginConfig>): Partial<PluginConfig> {
    // Deep merge function
    const deepMerge = (target: any, source: any): any => {
      const result = { ...target };
      
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      
      return result;
    };
    
    return deepMerge(fileConfig, envConfig);
  }

  /**
   * Update configuration and notify watchers
   */
  private updateConfiguration(newConfig: PluginConfig): void {
    const oldConfig = this.pluginConfig;
    this.pluginConfig = newConfig;
    
    // Notify watchers of changes
    this.notifyConfigChange('root', oldConfig, newConfig);
    
    this.contextLogger.info('Configuration updated');
  }

  /**
   * Start file watcher for hot reloading
   */
  private startConfigWatcher(): void {
    if (!this.configFile.startsWith('./')) {
      return; // Only watch local files
    }
    
    try {
      const fs = require('fs');
      fs.watch(this.configFile, async (eventType: string, filename: string) => {
        if (eventType === 'change') {
          this.contextLogger.info('Config file changed, reloading...');
          await this.loadConfiguration();
        }
      });
      
      this.contextLogger.info('Config file watcher started', { file: this.configFile });
    } catch (error) {
      this.contextLogger.warn('Failed to start config file watcher', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get default configuration
   */
  protected getDefaultConfig(): PluginConfig {
    return ConfigSchema.parse({});
  }

  /**
   * Get configuration value by path
   */
  get<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: any = this.pluginConfig;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue as T;
      }
    }
    
    return value as T;
  }

  /**
   * Set configuration value by path
   */
  set<T = any>(path: string, value: T): void {
    const keys = path.split('.');
    const oldValue = this.get(path);
    
    // Navigate to the parent object
    let current: any = this.pluginConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    // Set the value
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    
    // Validate the new configuration
    try {
      ConfigSchema.parse(this.pluginConfig);
      this.notifyConfigChange(path, oldValue, value);
    } catch (error) {
      // Revert the change
      current[lastKey] = oldValue;
      throw new Error(`Invalid configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Watch for configuration changes
   */
  watch(path: string, listener: ConfigChangeListener): () => void {
    if (!this.configWatchers.has(path)) {
      this.configWatchers.set(path, new Set());
    }
    
    this.configWatchers.get(path)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      const watchers = this.configWatchers.get(path);
      if (watchers) {
        watchers.delete(listener);
        if (watchers.size === 0) {
          this.configWatchers.delete(path);
        }
      }
    };
  }

  /**
   * Notify watchers of configuration changes
   */
  private notifyConfigChange(path: string, oldValue: any, newValue: any): void {
    const event: ConfigChangeEvent = {
      key: path,
      oldValue,
      newValue,
      timestamp: new Date()
    };
    
    // Notify specific path watchers
    const pathWatchers = this.configWatchers.get(path);
    if (pathWatchers) {
      pathWatchers.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          this.contextLogger.error('Error in config change listener', {
            path,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
    }
    
    // Notify parent path watchers
    const pathParts = path.split('.');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('.');
      const parentWatchers = this.configWatchers.get(parentPath);
      if (parentWatchers) {
        parentWatchers.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            this.contextLogger.error('Error in config change listener', {
              path: parentPath,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        });
      }
    }
  }

  /**
   * Get entire configuration
   */
  getAll(): PluginConfig {
    return { ...this.pluginConfig };
  }

  /**
   * Validate configuration
   */
  validate(config: Partial<PluginConfig>): { valid: boolean; errors: string[] } {
    try {
      ConfigSchema.parse(config);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return {
        valid: false,
        errors: ['Unknown validation error']
      };
    }
  }

  /**
   * Export configuration to file
   */
  async exportToFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, JSON.stringify(this.pluginConfig, null, 2));
      this.contextLogger.info('Configuration exported', { file: filePath });
    } catch (error) {
      this.contextLogger.error('Failed to export configuration', {
        file: filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get configuration statistics
   */
  getStats(): {
    totalWatchers: number;
    watchedPaths: string[];
    lastModified: number;
    configSize: number;
  } {
    return {
      totalWatchers: Array.from(this.configWatchers.values()).reduce((sum, set) => sum + set.size, 0),
      watchedPaths: Array.from(this.configWatchers.keys()),
      lastModified: this.lastModified,
      configSize: JSON.stringify(this.pluginConfig).length
    };
  }

  async updateData(): Promise<void> {
    // Configuration service doesn't need regular updates
  }

  async forceUpdate(): Promise<any> {
    await this.loadConfiguration();
    return this.pluginConfig;
  }
} 