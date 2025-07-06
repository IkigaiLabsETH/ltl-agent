import { IAgentRuntime, Action, elizaLogger } from "@elizaos/core";
import {
  LoggerWithContext,
  generateCorrelationId,
  PerformanceTracker,
} from "../utils/helpers";
import { z } from "zod";

/**
 * Base action configuration schema
 */
const BaseActionConfigSchema = z.object({
  enabled: z.boolean().default(true),
  timeout: z.number().default(30000), // 30 seconds
  maxRetries: z.number().default(3),
  requireValidation: z.boolean().default(true),
  enableLogging: z.boolean().default(true),
  enableMetrics: z.boolean().default(true),
  cacheEnabled: z.boolean().default(true),
  cacheTtl: z.number().default(300000), // 5 minutes
});

export type BaseActionConfig = z.infer<typeof BaseActionConfigSchema>;

/**
 * Action execution context
 */
export interface ActionContext {
  correlationId: string;
  startTime: number;
  config: BaseActionConfig;
  logger: LoggerWithContext;
  performanceTracker: PerformanceTracker;
  runtime: IAgentRuntime;
}

/**
 * Action execution result
 */
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  timestamp: Date;
  correlationId: string;
  metadata?: Record<string, any>;
}

/**
 * Action validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Base Action Class
 * Provides standardized patterns for all actions with common functionality
 */
export abstract class BaseAction implements Action {
  protected contextLogger: LoggerWithContext;
  protected config: BaseActionConfig;
  protected correlationId: string;
  protected runtime: IAgentRuntime;

  constructor(runtime: IAgentRuntime, config?: Partial<BaseActionConfig>) {
    this.runtime = runtime;
    this.correlationId = generateCorrelationId();
    this.contextLogger = new LoggerWithContext(
      this.correlationId,
      this.constructor.name,
    );

    // Merge default config with provided config
    this.config = BaseActionConfigSchema.parse({
      ...this.getDefaultConfig(),
      ...config,
    });
  }

  // Action interface implementation
  get name(): string {
    return this.constructor.name;
  }

  get description(): string {
    return this.getActionDescription();
  }

  get handler() {
    return this.execute.bind(this);
  }

  get validate() {
    return this.validateParams.bind(this);
  }

  /**
   * Get action description - override in subclasses
   */
  protected getActionDescription(): string {
    return `Base action for ${this.constructor.name}`;
  }

  /**
   * Get default configuration for this action
   */
  protected getDefaultConfig(): BaseActionConfig {
    return BaseActionConfigSchema.parse({});
  }

  /**
   * Execute the action with standardized error handling and logging
   */
  async execute(params: any): Promise<ActionResult> {
    const startTime = Date.now();
    const context: ActionContext = {
      correlationId: this.correlationId,
      startTime,
      config: this.config,
      logger: this.contextLogger,
      performanceTracker: new PerformanceTracker(
        this.contextLogger,
        this.constructor.name,
      ),
      runtime: this.runtime,
    };

    try {
      // Validate parameters if required
      if (this.config.requireValidation) {
        const validation = await this.validateParams(params, context);
        if (!validation.valid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(", ")}`,
            duration: Date.now() - startTime,
            timestamp: new Date(),
            correlationId: this.correlationId,
            metadata: {
              validationErrors: validation.errors,
              warnings: validation.warnings,
            },
          };
        }
      }

      // Log action start
      if (this.config.enableLogging) {
        this.contextLogger.info("Action execution started", {
          action: this.constructor.name,
          params: this.sanitizeParams(params),
          config: this.config,
        });
      }

      // Execute the action
      const result = await this.executeAction(params, context);

      // Log successful completion
      if (this.config.enableLogging) {
        this.contextLogger.info("Action execution completed successfully", {
          action: this.constructor.name,
          duration: Date.now() - startTime,
          resultSize: this.getResultSize(result),
        });
      }

      // Track performance
      context.performanceTracker.finish(true, {
        resultSize: this.getResultSize(result),
        params: this.sanitizeParams(params),
      });

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        correlationId: this.correlationId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      if (this.config.enableLogging) {
        this.contextLogger.error("Action execution failed", {
          action: this.constructor.name,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          duration,
          params: this.sanitizeParams(params),
        });
      }

      // Track performance failure
      context.performanceTracker.finish(false, {
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
        timestamp: new Date(),
        correlationId: this.correlationId,
        metadata: {
          errorType:
            error instanceof Error ? error.constructor.name : "Unknown",
          stack: error instanceof Error ? error.stack : undefined,
        },
      };
    }
  }

  /**
   * Abstract method that subclasses must implement
   */
  protected abstract executeAction(
    params: any,
    context: ActionContext,
  ): Promise<any>;

  /**
   * Validate action parameters
   * Override in subclasses to add specific validation
   */
  protected async validateParams(
    params: any,
    context: ActionContext,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!params) {
      errors.push("Parameters are required");
    }

    // Add specific validation in subclasses
    const specificValidation = await this.validateSpecificParams(
      params,
      context,
    );
    errors.push(...specificValidation.errors);
    warnings.push(...specificValidation.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate specific parameters for this action
   * Override in subclasses
   */
  protected async validateSpecificParams(
    params: any,
    context: ActionContext,
  ): Promise<ValidationResult> {
    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Sanitize parameters for logging (remove sensitive data)
   */
  protected sanitizeParams(params: any): any {
    if (!params) return params;

    const sanitized = { ...params };

    // Remove sensitive fields
    const sensitiveFields = ["password", "apiKey", "token", "secret", "key"];
    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  /**
   * Get result size for metrics
   */
  protected getResultSize(result: any): number {
    if (!result) return 0;

    try {
      return JSON.stringify(result).length;
    } catch {
      return 0;
    }
  }

  /**
   * Get cached result if available
   */
  protected async getCachedResult<T>(key: string): Promise<T | null> {
    if (!this.config.cacheEnabled) return null;

    try {
      const cacheService = this.runtime.getService("cache-manager") as any;
      if (cacheService && typeof cacheService.get === "function") {
        return await cacheService.get(key);
      }
    } catch (error) {
      this.contextLogger.warn("Failed to get cached result", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return null;
  }

  /**
   * Cache result for future use
   */
  protected async cacheResult<T>(key: string, data: T): Promise<void> {
    if (!this.config.cacheEnabled) return;

    try {
      const cacheService = this.runtime.getService("cache-manager") as any;
      if (cacheService && typeof cacheService.set === "function") {
        await cacheService.set(key, data, this.config.cacheTtl);
      }
    } catch (error) {
      this.contextLogger.warn("Failed to cache result", {
        key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Generate cache key for this action
   */
  protected generateCacheKey(params: any): string {
    const paramsHash = JSON.stringify(params);
    return `${this.constructor.name}_${this.hashString(paramsHash)}`;
  }

  /**
   * Simple string hashing function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get configuration value
   */
  protected getConfig<T = any>(key: string, defaultValue?: T): T {
    const keys = key.split(".");
    let value: any = this.config;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  /**
   * Get setting from runtime
   */
  protected getSetting(key: string, defaultValue?: string): string | undefined {
    return this.runtime.getSetting(key) || defaultValue;
  }

  /**
   * Retry operation with exponential backoff
   */
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    context: ActionContext,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.config.maxRetries - 1) {
          throw lastError;
        }

        // Wait before retry with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        this.contextLogger.warn("Operation failed, retrying", {
          attempt: attempt + 1,
          maxRetries: this.config.maxRetries,
          delay,
          error: lastError.message,
        });
      }
    }

    throw lastError!;
  }

  /**
   * Get action statistics
   */
  getStats(): {
    name: string;
    config: BaseActionConfig;
    correlationId: string;
  } {
    return {
      name: this.constructor.name,
      config: this.config,
      correlationId: this.correlationId,
    };
  }
}
