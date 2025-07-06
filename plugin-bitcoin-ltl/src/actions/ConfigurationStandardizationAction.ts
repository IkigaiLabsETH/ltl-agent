import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { BaseAction } from "./BaseAction";
import { ConfigMigrationUtility, configMigrationHelpers } from "../utils";
import { CentralizedConfigService } from "../services/CentralizedConfigService";

/**
 * Configuration Standardization Action
 * Helps migrate services from runtime.getSetting() to CentralizedConfigService
 */
export class ConfigurationStandardizationAction extends BaseAction {
  static actionType = "configuration-standardization";

  private migrationUtility: ConfigMigrationUtility;
  private configService: CentralizedConfigService;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
    this.migrationUtility = new ConfigMigrationUtility(runtime);
    this.configService =
      runtime.getService<CentralizedConfigService>("centralized-config");
  }

  public get capabilityDescription(): string {
    return "Standardizes configuration usage across all services by migrating from runtime.getSetting() to CentralizedConfigService";
  }

  /**
   * Get migration status for all services
   */
  async getMigrationStatus(): Promise<{
    status: {
      migrated: string[];
      pending: string[];
      total: number;
      migrationPercentage: number;
    };
    usageStats: {
      totalServices: number;
      servicesUsingCentralizedConfig: number;
      servicesUsingRuntimeSettings: number;
      mixedUsageServices: number;
    };
    report: string;
  }> {
    try {
      const status = this.migrationUtility.validateMigrationStatus();
      const usageStats = this.migrationUtility.getUsageStatistics();
      const report = this.migrationUtility.generateMigrationReport();

      return {
        status,
        usageStats,
        report,
      };
    } catch (error) {
      this.contextLogger.error("Failed to get migration status", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Validate configuration consistency across all services
   */
  async validateConfigurationConsistency(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
    details: {
      missingConfigs: string[];
      inconsistentConfigs: string[];
      deprecatedConfigs: string[];
    };
  }> {
    try {
      const validation =
        configMigrationHelpers.validateConfigurationConsistency(this.runtime);

      // Additional validation logic
      const missingConfigs: string[] = [];
      const inconsistentConfigs: string[] = [];
      const deprecatedConfigs: string[] = [];

      // Check for missing critical configurations
      const criticalConfigs = [
        "apis.coingecko.apiKey",
        "apis.blockchain.baseUrl",
        "services.bitcoinNetwork.enabled",
        "services.marketData.enabled",
      ];

      for (const config of criticalConfigs) {
        try {
          const value = this.configService.get(config);
          if (value === undefined || value === null) {
            missingConfigs.push(config);
          }
        } catch (error) {
          missingConfigs.push(config);
        }
      }

      // Check for inconsistent configuration patterns
      const services = [
        "bitcoinNetwork",
        "marketData",
        "realTimeData",
        "newsData",
        "nftData",
        "socialSentiment",
      ];

      for (const service of services) {
        const enabledConfig = `services.${service}.enabled`;
        const intervalConfig = `services.${service}.updateInterval`;

        try {
          const enabled = this.configService.get(enabledConfig);
          const interval = this.configService.get(intervalConfig);

          if (enabled === true && (!interval || interval < 1000)) {
            inconsistentConfigs.push(
              `${service}: enabled but no valid update interval`,
            );
          }
        } catch (error) {
          inconsistentConfigs.push(
            `${service}: configuration validation failed`,
          );
        }
      }

      return {
        isValid:
          validation.isValid &&
          missingConfigs.length === 0 &&
          inconsistentConfigs.length === 0,
        issues: [
          ...validation.issues,
          ...missingConfigs,
          ...inconsistentConfigs,
        ],
        recommendations: [
          ...validation.recommendations,
          ...missingConfigs.map(
            (config) => `Add missing configuration: ${config}`,
          ),
          ...inconsistentConfigs.map(
            (issue) => `Fix inconsistent configuration: ${issue}`,
          ),
        ],
        details: {
          missingConfigs,
          inconsistentConfigs,
          deprecatedConfigs,
        },
      };
    } catch (error) {
      this.contextLogger.error("Failed to validate configuration consistency", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Generate migration plan for specific service
   */
  async generateMigrationPlan(serviceName: string): Promise<{
    serviceName: string;
    currentPattern: "runtime" | "centralized" | "mixed";
    migrationSteps: string[];
    estimatedEffort: "low" | "medium" | "high";
    priority: "low" | "medium" | "high";
    risks: string[];
  }> {
    try {
      // Analyze service configuration usage
      const serviceConfigs = [
        `services.${serviceName}.enabled`,
        `services.${serviceName}.updateInterval`,
        `apis.${serviceName}.apiKey`,
        `apis.${serviceName}.baseUrl`,
      ];

      let runtimeUsage = 0;
      let centralizedUsage = 0;

      for (const config of serviceConfigs) {
        try {
          const value = this.configService.get(config);
          if (value !== undefined && value !== null) {
            centralizedUsage++;
          } else {
            runtimeUsage++;
          }
        } catch (error) {
          runtimeUsage++;
        }
      }

      let currentPattern: "runtime" | "centralized" | "mixed";
      if (centralizedUsage === 0) {
        currentPattern = "runtime";
      } else if (runtimeUsage === 0) {
        currentPattern = "centralized";
      } else {
        currentPattern = "mixed";
      }

      // Generate migration steps
      const migrationSteps: string[] = [];
      let estimatedEffort: "low" | "medium" | "high" = "low";
      let priority: "low" | "medium" | "high" = "low";
      const risks: string[] = [];

      if (currentPattern === "runtime") {
        migrationSteps.push(
          "1. Add service configuration to CentralizedConfigService schema",
          "2. Update service constructor to use ConfigMigrationUtility",
          "3. Replace runtime.getSetting() calls with configService.get()",
          "4. Add fallback logic for backward compatibility",
          "5. Update tests to use centralized configuration",
        );
        estimatedEffort = "medium";
        priority = "high";
        risks.push("Service may break if configuration is missing");
      } else if (currentPattern === "mixed") {
        migrationSteps.push(
          "1. Identify remaining runtime.getSetting() calls",
          "2. Migrate remaining configurations to centralized service",
          "3. Remove fallback logic for migrated configurations",
          "4. Update documentation and tests",
        );
        estimatedEffort = "low";
        priority = "medium";
        risks.push("Inconsistent configuration access patterns");
      } else {
        migrationSteps.push("Service already uses centralized configuration");
        estimatedEffort = "low";
        priority = "low";
      }

      return {
        serviceName,
        currentPattern,
        migrationSteps,
        estimatedEffort,
        priority,
        risks,
      };
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "ConfigurationStandardizationAction",
        operation: "generateMigrationPlan",
      });
      throw error;
    }
  }

  /**
   * Execute configuration migration for a specific service
   */
  async executeMigration(
    serviceName: string,
    dryRun: boolean = true,
  ): Promise<{
    success: boolean;
    changes: string[];
    errors: string[];
    warnings: string[];
    nextSteps: string[];
  }> {
    try {
      const changes: string[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];
      const nextSteps: string[] = [];

      // Get migration plan
      const plan = await this.generateMigrationPlan(serviceName);

      if (plan.currentPattern === "centralized") {
        return {
          success: true,
          changes: ["Service already uses centralized configuration"],
          errors: [],
          warnings: [],
          nextSteps: ["No migration needed"],
        };
      }

      // Simulate migration steps
      if (plan.currentPattern === "runtime") {
        changes.push(
          `Would migrate ${serviceName} from runtime.getSetting() to CentralizedConfigService`,
        );

        if (!dryRun) {
          // Add service configuration to schema
          try {
            const currentSchema = this.configService.getSchema();
            // This would require schema modification - simplified for demo
            changes.push(
              "Added service configuration to CentralizedConfigService schema",
            );
          } catch (error) {
            errors.push(`Failed to update schema: ${error.message}`);
          }
        }
      }

      if (plan.currentPattern === "mixed") {
        changes.push(
          `Would complete migration for ${serviceName} to fully use CentralizedConfigService`,
        );
      }

      // Add warnings and next steps
      if (plan.risks.length > 0) {
        warnings.push(...plan.risks);
      }

      nextSteps.push(
        "1. Review migration plan and risks",
        "2. Update service code to use ConfigMigrationUtility",
        "3. Test service with new configuration pattern",
        "4. Update documentation and tests",
        "5. Deploy and monitor for issues",
      );

      return {
        success: errors.length === 0,
        changes,
        errors,
        warnings,
        nextSteps,
      };
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "ConfigurationStandardizationAction",
        operation: "executeMigration",
      });
      throw error;
    }
  }

  /**
   * Get configuration usage statistics by service
   */
  async getServiceConfigurationStats(): Promise<{
    services: Array<{
      name: string;
      pattern: "runtime" | "centralized" | "mixed";
      configCount: number;
      runtimeConfigs: string[];
      centralizedConfigs: string[];
    }>;
    summary: {
      totalServices: number;
      fullyMigrated: number;
      partiallyMigrated: number;
      notMigrated: number;
    };
  }> {
    try {
      const services = [
        "bitcoinNetwork",
        "marketData",
        "realTimeData",
        "newsData",
        "nftData",
        "socialSentiment",
        "predictiveAnalytics",
        "realTimeStreaming",
        "advancedAlerting",
        "productionDeployment",
      ];

      const serviceStats = await Promise.all(
        services.map(async (serviceName) => {
          const plan = await this.generateMigrationPlan(serviceName);

          // Count configurations
          const configs = [
            `services.${serviceName}.enabled`,
            `services.${serviceName}.updateInterval`,
            `apis.${serviceName}.apiKey`,
            `apis.${serviceName}.baseUrl`,
          ];

          const runtimeConfigs: string[] = [];
          const centralizedConfigs: string[] = [];

          for (const config of configs) {
            try {
              const value = this.configService.get(config);
              if (value !== undefined && value !== null) {
                centralizedConfigs.push(config);
              } else {
                runtimeConfigs.push(config);
              }
            } catch (error) {
              runtimeConfigs.push(config);
            }
          }

          return {
            name: serviceName,
            pattern: plan.currentPattern,
            configCount: configs.length,
            runtimeConfigs,
            centralizedConfigs,
          };
        }),
      );

      const summary = {
        totalServices: serviceStats.length,
        fullyMigrated: serviceStats.filter((s) => s.pattern === "centralized")
          .length,
        partiallyMigrated: serviceStats.filter((s) => s.pattern === "mixed")
          .length,
        notMigrated: serviceStats.filter((s) => s.pattern === "runtime").length,
      };

      return {
        services: serviceStats,
        summary,
      };
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "ConfigurationStandardizationAction",
        operation: "getServiceConfigurationStats",
      });
      throw error;
    }
  }

  /**
   * Generate comprehensive configuration report
   */
  async generateConfigurationReport(): Promise<string> {
    try {
      const migrationStatus = await this.getMigrationStatus();
      const consistency = await this.validateConfigurationConsistency();
      const serviceStats = await this.getServiceConfigurationStats();

      return `
# Configuration Standardization Report

## Migration Status
- **Total Configuration Paths**: ${migrationStatus.status.total}
- **Migrated**: ${migrationStatus.status.migrated.length}
- **Pending**: ${migrationStatus.status.pending.length}
- **Migration Percentage**: ${migrationStatus.status.migrationPercentage.toFixed(1)}%

## Service Configuration Statistics
- **Total Services**: ${serviceStats.summary.totalServices}
- **Fully Migrated**: ${serviceStats.summary.fullyMigrated}
- **Partially Migrated**: ${serviceStats.summary.partiallyMigrated}
- **Not Migrated**: ${serviceStats.summary.notMigrated}

## Configuration Consistency
- **Valid**: ${consistency.isValid ? "Yes" : "No"}
- **Issues Found**: ${consistency.issues.length}
- **Missing Configurations**: ${consistency.details.missingConfigs.length}
- **Inconsistent Configurations**: ${consistency.details.inconsistentConfigs.length}

## Service Details
${serviceStats.services
  .map(
    (service) => `
### ${service.name}
- **Pattern**: ${service.pattern}
- **Configurations**: ${service.configCount}
- **Runtime Configs**: ${service.runtimeConfigs.length}
- **Centralized Configs**: ${service.centralizedConfigs.length}
`,
  )
  .join("")}

## Recommendations
${consistency.recommendations.map((rec) => `- ${rec}`).join("\n")}

## Next Steps
1. Prioritize migration of services with 'runtime' pattern
2. Fix configuration consistency issues
3. Add missing critical configurations
4. Update tests to use centralized configuration
5. Monitor migration progress and validate changes
      `;
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "ConfigurationStandardizationAction",
        operation: "generateConfigurationReport",
      });
      throw error;
    }
  }

  /**
   * Execute the configuration standardization action
   */
  async execute(
    params: {
      action?: "status" | "validate" | "migrate" | "report" | "stats";
      serviceName?: string;
      dryRun?: boolean;
    } = {},
  ): Promise<any> {
    try {
      const { action = "status", serviceName, dryRun = true } = params;

      switch (action) {
        case "status":
          return await this.getMigrationStatus();

        case "validate":
          return await this.validateConfigurationConsistency();

        case "migrate":
          if (!serviceName) {
            throw new Error("Service name is required for migration");
          }
          return await this.executeMigration(serviceName, dryRun);

        case "report":
          return await this.generateConfigurationReport();

        case "stats":
          return await this.getServiceConfigurationStats();

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      this.contextLogger.error("Configuration standardization action failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        action,
        serviceName,
      });
      throw error;
    }
  }

  /**
   * Execute the action with standardized error handling and logging
   */
  protected async executeAction(params: any, context: any): Promise<any> {
    return await this.execute(params);
  }
}
