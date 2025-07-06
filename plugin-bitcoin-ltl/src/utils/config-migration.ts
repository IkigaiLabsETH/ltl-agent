import { IAgentRuntime } from '@elizaos/core';
import { CentralizedConfigService } from '../services/CentralizedConfigService';

/**
 * Configuration Migration Utility
 * Helps migrate services from runtime.getSetting() to CentralizedConfigService
 */
export class ConfigMigrationUtility {
  private configService: CentralizedConfigService;

  constructor(runtime: IAgentRuntime) {
    this.configService = runtime.getService<CentralizedConfigService>('centralized-config');
  }

  /**
   * Get configuration value with fallback to runtime.getSetting()
   * This allows gradual migration of services
   */
  getConfigWithFallback(
    configPath: string, 
    runtime: IAgentRuntime, 
    runtimeKey: string, 
    defaultValue?: any
  ): any {
    try {
      // Try centralized config first
      const configValue = this.configService.get(configPath);
      if (configValue !== undefined && configValue !== null) {
        return configValue;
      }
    } catch (error) {
      // Fallback to runtime.getSetting()
    }

    // Fallback to runtime.getSetting()
    const runtimeValue = runtime.getSetting(runtimeKey);
    if (runtimeValue !== undefined && runtimeValue !== null) {
      return runtimeValue;
    }

    return defaultValue;
  }

  /**
   * Get API key with fallback
   */
  getApiKey(apiName: string, runtime: IAgentRuntime, runtimeKey: string): string | undefined {
    return this.getConfigWithFallback(`apis.${apiName}.apiKey`, runtime, runtimeKey);
  }

  /**
   * Get API base URL with fallback
   */
  getApiBaseUrl(apiName: string, runtime: IAgentRuntime, runtimeKey: string, defaultValue: string): string {
    return this.getConfigWithFallback(`apis.${apiName}.baseUrl`, runtime, runtimeKey, defaultValue);
  }

  /**
   * Get service configuration with fallback
   */
  getServiceConfig(serviceName: string, configKey: string, runtime: IAgentRuntime, runtimeKey: string, defaultValue: any): any {
    return this.getConfigWithFallback(`services.${serviceName}.${configKey}`, runtime, runtimeKey, defaultValue);
  }

  /**
   * Get feature flag with fallback
   */
  getFeatureFlag(featureName: string, runtime: IAgentRuntime, runtimeKey: string, defaultValue: boolean = false): boolean {
    const value = this.getConfigWithFallback(`features.${featureName}`, runtime, runtimeKey, defaultValue);
    return typeof value === 'string' ? value === 'true' : Boolean(value);
  }

  /**
   * Get performance configuration with fallback
   */
  getPerformanceConfig(configKey: string, runtime: IAgentRuntime, runtimeKey: string, defaultValue: any): any {
    return this.getConfigWithFallback(`performance.${configKey}`, runtime, runtimeKey, defaultValue);
  }

  /**
   * Get security configuration with fallback
   */
  getSecurityConfig(configKey: string, runtime: IAgentRuntime, runtimeKey: string, defaultValue: any): any {
    return this.getConfigWithFallback(`security.${configKey}`, runtime, runtimeKey, defaultValue);
  }

  /**
   * Get caching configuration with fallback
   */
  getCachingConfig(configKey: string, runtime: IAgentRuntime, runtimeKey: string, defaultValue: any): any {
    return this.getConfigWithFallback(`caching.${configKey}`, runtime, runtimeKey, defaultValue);
  }

  /**
   * Get logging configuration with fallback
   */
  getLoggingConfig(configKey: string, runtime: IAgentRuntime, runtimeKey: string, defaultValue: any): any {
    return this.getConfigWithFallback(`logging.${configKey}`, runtime, runtimeKey, defaultValue);
  }

  /**
   * Validate configuration migration status
   */
  validateMigrationStatus(): {
    migrated: string[];
    pending: string[];
    total: number;
    migrationPercentage: number;
  } {
    const configPaths = [
      // API configurations
      'apis.coingecko.apiKey',
      'apis.coingecko.baseUrl',
      'apis.blockchain.baseUrl',
      'apis.mempool.baseUrl',
      'apis.alternative.baseUrl',
      'apis.news.apiKey',
      'apis.news.baseUrl',
      'apis.opensea.apiKey',
      'apis.opensea.baseUrl',
      'apis.twitter.apiKey',
      'apis.twitter.baseUrl',
      'apis.telegram.apiKey',
      'apis.telegram.baseUrl',
      'apis.discord.apiKey',
      'apis.discord.baseUrl',
      
      // Service configurations
      'services.bitcoinNetwork.enabled',
      'services.bitcoinNetwork.updateInterval',
      'services.marketData.enabled',
      'services.marketData.updateInterval',
      'services.realTimeData.enabled',
      'services.realTimeData.updateInterval',
      'services.newsData.enabled',
      'services.newsData.updateInterval',
      'services.nftData.enabled',
      'services.nftData.updateInterval',
      'services.socialSentiment.enabled',
      'services.socialSentiment.updateInterval',
      
      // Feature flags
      'features.enableRealTimeUpdates',
      'features.enablePredictiveAnalytics',
      'features.enableAdvancedCharts',
      'features.enableNotifications',
      'features.enableDataExport',
      
      // Performance configurations
      'performance.enableMetrics',
      'performance.enableHealthChecks',
      'performance.enableCircuitBreakers',
      
      // Security configurations
      'security.enableRateLimiting',
      'security.enableRequestValidation',
      
      // Caching configurations
      'caching.enabled',
      'caching.defaultTtl',
      'caching.redis.enabled',
      
      // Logging configurations
      'logging.level',
      'logging.enableCorrelationIds',
      'logging.enablePerformanceTracking'
    ];

    const migrated: string[] = [];
    const pending: string[] = [];

    configPaths.forEach(path => {
      try {
        const value = this.configService.get(path);
        if (value !== undefined && value !== null) {
          migrated.push(path);
        } else {
          pending.push(path);
        }
      } catch (error) {
        pending.push(path);
      }
    });

    const total = configPaths.length;
    const migrationPercentage = (migrated.length / total) * 100;

    return {
      migrated,
      pending,
      total,
      migrationPercentage
    };
  }

  /**
   * Generate migration report
   */
  generateMigrationReport(): string {
    const status = this.validateMigrationStatus();
    
    return `
# Configuration Migration Report

## Summary
- **Total Configuration Paths**: ${status.total}
- **Migrated**: ${status.migrated.length}
- **Pending**: ${status.pending.length}
- **Migration Percentage**: ${status.migrationPercentage.toFixed(1)}%

## Migrated Configurations
${status.migrated.map(path => `- ✅ ${path}`).join('\n')}

## Pending Migrations
${status.pending.map(path => `- ⏳ ${path}`).join('\n')}

## Recommendations
${status.migrationPercentage >= 80 ? 
  '🎉 Excellent progress! Most configurations are migrated.' :
  status.migrationPercentage >= 50 ?
  '📈 Good progress! Continue migrating remaining configurations.' :
  '🚧 Migration in progress. Focus on high-priority configurations first.'
}
    `;
  }

  /**
   * Get configuration usage statistics
   */
  getUsageStatistics(): {
    totalServices: number;
    servicesUsingCentralizedConfig: number;
    servicesUsingRuntimeSettings: number;
    mixedUsageServices: number;
  } {
    // This would be populated by scanning the codebase
    // For now, returning estimated values based on our analysis
    return {
      totalServices: 15,
      servicesUsingCentralizedConfig: 3, // NFTDataService, NewsDataService, SocialSentimentService
      servicesUsingRuntimeSettings: 10, // Most existing services
      mixedUsageServices: 2 // Services using both patterns
    };
  }
}

/**
 * Configuration migration helper functions
 */
export const configMigrationHelpers = {
  /**
   * Create a migration helper for a specific service
   */
  createServiceHelper(runtime: IAgentRuntime, serviceName: string) {
    const migrationUtility = new ConfigMigrationUtility(runtime);
    
    return {
      getApiKey: (apiName: string, runtimeKey: string) => 
        migrationUtility.getApiKey(apiName, runtime, runtimeKey),
      
      getApiBaseUrl: (apiName: string, runtimeKey: string, defaultValue: string) => 
        migrationUtility.getApiBaseUrl(apiName, runtime, runtimeKey, defaultValue),
      
      getServiceConfig: (configKey: string, runtimeKey: string, defaultValue: any) => 
        migrationUtility.getServiceConfig(serviceName, configKey, runtime, runtimeKey, defaultValue),
      
      getFeatureFlag: (featureName: string, runtimeKey: string, defaultValue: boolean = false) => 
        migrationUtility.getFeatureFlag(featureName, runtime, runtimeKey, defaultValue),
      
      getPerformanceConfig: (configKey: string, runtimeKey: string, defaultValue: any) => 
        migrationUtility.getPerformanceConfig(configKey, runtime, runtimeKey, defaultValue),
      
      getSecurityConfig: (configKey: string, runtimeKey: string, defaultValue: any) => 
        migrationUtility.getSecurityConfig(configKey, runtime, runtimeKey, defaultValue),
      
      getCachingConfig: (configKey: string, runtimeKey: string, defaultValue: any) => 
        migrationUtility.getCachingConfig(configKey, runtime, runtimeKey, defaultValue),
      
      getLoggingConfig: (configKey: string, runtimeKey: string, defaultValue: any) => 
        migrationUtility.getLoggingConfig(configKey, runtime, runtimeKey, defaultValue)
    };
  },

  /**
   * Validate configuration consistency
   */
  validateConfigurationConsistency(runtime: IAgentRuntime): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check for common configuration issues
    const configService = runtime.getService<CentralizedConfigService>('centralized-config');
    
    if (!configService) {
      issues.push('CentralizedConfigService not found');
      recommendations.push('Ensure CentralizedConfigService is properly registered');
    }
    
    // Add more validation logic as needed
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}; 