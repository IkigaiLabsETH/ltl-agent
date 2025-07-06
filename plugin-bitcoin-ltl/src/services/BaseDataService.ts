import { IAgentRuntime, Service, elizaLogger } from "@elizaos/core";
import { v4 as uuidv4 } from "uuid";
import { getConfigurationManager, ServiceConfig } from "./ConfigurationManager";

/**
 * Custom error types for better error handling
 */
export class DataServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly service: string = "BaseDataService",
  ) {
    super(message);
    this.name = "DataServiceError";
  }
}

export class RateLimitError extends DataServiceError {
  constructor(service: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${service}`, "RATE_LIMIT", true, service);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
  retryAfter?: number;
}

export class NetworkError extends DataServiceError {
  constructor(service: string, originalError?: Error) {
    super(
      `Network error in ${service}: ${originalError?.message || "Unknown"}`,
      "NETWORK_ERROR",
      true,
      service,
    );
    this.name = "NetworkError";
    this.originalError = originalError;
  }
  originalError?: Error;
}

export class ValidationError extends DataServiceError {
  constructor(service: string, field: string, value: any) {
    super(
      `Validation error in ${service}: Invalid ${field} value: ${value}`,
      "VALIDATION_ERROR",
      false,
      service,
    );
    this.name = "ValidationError";
  }
}

export class CircuitBreakerError extends DataServiceError {
  constructor(service: string) {
    super(
      `Circuit breaker open for ${service}`,
      "CIRCUIT_BREAKER_OPEN",
      false,
      service,
    );
    this.name = "CircuitBreakerError";
  }
}

/**
 * Circuit breaker implementation for failing services
 */
class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private readonly name: string,
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly successThreshold: number = 2,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = "HALF_OPEN";
        this.successCount = 0;
        elizaLogger.info(
          `[CircuitBreaker:${this.name}] Moving to HALF_OPEN state`,
        );
      } else {
        throw new CircuitBreakerError(this.name);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;

    if (this.state === "HALF_OPEN") {
      if (this.successCount >= this.successThreshold) {
        this.state = "CLOSED";
        this.failureCount = 0;
        elizaLogger.info(
          `[CircuitBreaker:${this.name}] Moving to CLOSED state`,
        );
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "CLOSED" && this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      elizaLogger.warn(
        `[CircuitBreaker:${this.name}] Moving to OPEN state due to ${this.failureCount} failures`,
      );
    } else if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      elizaLogger.warn(
        `[CircuitBreaker:${this.name}] Moving back to OPEN state due to failure`,
      );
    }
  }

  getState(): { state: string; failureCount: number; successCount: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }
}

/**
 * Service health status tracking
 */
interface ServiceHealth {
  healthy: boolean;
  lastSuccessTime: number;
  lastFailureTime: number;
  totalRequests: number;
  totalFailures: number;
  averageResponseTime: number;
  circuitBreakerState: string;
}

export abstract class BaseDataService extends Service {
  // Required ElizaOS service properties
  static serviceType: string = "base-data"; // Will be overridden by subclasses
  abstract capabilityDescription: string;

  // Configuration-driven properties
  protected lastRequestTime = 0;
  protected requestQueue: Array<() => Promise<any>> = [];
  protected isProcessingQueue = false;
  protected consecutiveFailures = 0;
  protected backoffUntil = 0;

  // Enhanced error handling and monitoring
  protected circuitBreaker: CircuitBreaker;
  protected serviceHealth: ServiceHealth;
  protected correlationId: string;

  // Configuration
  protected configKey: keyof ServiceConfig;
  protected serviceConfig: any;

  constructor(runtime: IAgentRuntime, configKey: keyof ServiceConfig) {
    super();
    this.runtime = runtime;
    this.configKey = configKey;
    this.correlationId = uuidv4();

    // Initialize with default configuration
    this.initializeConfiguration();

    // Initialize circuit breaker with configured values
    this.circuitBreaker = new CircuitBreaker(
      this.constructor.name,
      this.serviceConfig.circuitBreakerThreshold || 5,
      this.serviceConfig.circuitBreakerTimeout || 60000,
    );

    this.serviceHealth = {
      healthy: true,
      lastSuccessTime: Date.now(),
      lastFailureTime: 0,
      totalRequests: 0,
      totalFailures: 0,
      averageResponseTime: 0,
      circuitBreakerState: "CLOSED",
    };

    // Watch for configuration changes
    this.watchConfiguration();
  }

  /**
   * Initialize service configuration
   */
  private initializeConfiguration(): void {
    try {
      const configManager = getConfigurationManager();
      this.serviceConfig = configManager.getServiceConfig(this.configKey);
    } catch (error) {
      elizaLogger.warn(
        `[${this.constructor.name}:${this.correlationId}] Configuration manager not available, using defaults`,
      );
      this.serviceConfig = this.getDefaultConfig();
    }
  }

  /**
   * Watch for configuration changes
   */
  private watchConfiguration(): void {
    try {
      const configManager = getConfigurationManager();
      configManager.watchConfig(this.configKey, (newConfig: any) => {
        elizaLogger.info(
          `[${this.constructor.name}:${this.correlationId}] Configuration updated`,
        );
        this.serviceConfig = newConfig;
        this.onConfigurationChanged(newConfig);
      });
    } catch (error) {
      elizaLogger.debug(
        `[${this.constructor.name}:${this.correlationId}] Configuration watching not available`,
      );
    }
  }

  /**
   * Get default configuration (override in subclasses)
   */
  protected getDefaultConfig(): any {
    return {
      enabled: true,
      cacheTimeout: 60000,
      rateLimitDelay: 3000,
      maxRetries: 3,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
    };
  }

  /**
   * Handle configuration changes (override in subclasses)
   */
  protected onConfigurationChanged(newConfig: any): void {
    // Update circuit breaker configuration
    this.circuitBreaker = new CircuitBreaker(
      this.constructor.name,
      newConfig.circuitBreakerThreshold || 5,
      newConfig.circuitBreakerTimeout || 60000,
    );
  }

  /**
   * Get current service configuration
   */
  protected getConfig(): any {
    return this.serviceConfig;
  }

  /**
   * Check if service is enabled
   */
  protected isEnabled(): boolean {
    return this.serviceConfig.enabled !== false;
  }

  /**
   * Required ElizaOS service lifecycle method
   */
  static async start(runtime: IAgentRuntime): Promise<BaseDataService> {
    throw new Error("start() method must be implemented by subclasses");
  }

  /**
   * Required ElizaOS service lifecycle method
   */
  async stop(): Promise<void> {
    elizaLogger.info(
      `[${this.constructor.name}:${this.correlationId}] Stopping service...`,
    );

    // Clear any pending requests
    this.requestQueue = [];
    this.isProcessingQueue = false;

    // Reset counters
    this.consecutiveFailures = 0;
    this.backoffUntil = 0;

    elizaLogger.info(
      `[${this.constructor.name}:${this.correlationId}] Service stopped successfully`,
    );
  }

  /**
   * Health check method for service monitoring
   */
  async healthCheck(): Promise<ServiceHealth> {
    const circuitState = this.circuitBreaker.getState();
    const maxFailures = this.serviceConfig.circuitBreakerThreshold || 5;

    this.serviceHealth.healthy =
      circuitState.state === "CLOSED" &&
      this.consecutiveFailures < maxFailures &&
      this.isEnabled();
    this.serviceHealth.circuitBreakerState = circuitState.state;

    return { ...this.serviceHealth };
  }

  /**
   * Store data in ElizaOS memory system with enhanced error handling
   */
  protected async storeInMemory(data: any, type: string): Promise<void> {
    // Memory storage disabled to prevent database errors
    elizaLogger.debug(
      `[${this.constructor.name}:${this.correlationId}] Memory storage disabled for ${type}`,
    );
  }

  /**
   * Retrieve recent data from ElizaOS memory system with enhanced error handling
   */
  protected async getFromMemory(
    type: string,
    count: number = 10,
  ): Promise<any[]> {
    // Memory retrieval disabled to prevent database errors
    elizaLogger.debug(
      `[${this.constructor.name}:${this.correlationId}] Memory retrieval disabled for ${type}`,
    );
    return [];
  }

  /**
   * Queue a request to be processed with rate limiting and circuit breaker
   */
  protected async makeQueuedRequest<T>(
    requestFn: () => Promise<T>,
  ): Promise<T> {
    if (!this.isEnabled()) {
      throw new DataServiceError(
        `Service ${this.constructor.name} is disabled`,
        "SERVICE_DISABLED",
        false,
        this.constructor.name,
      );
    }

    return new Promise((resolve, reject) => {
      const requestWrapper = async () => {
        const startTime = Date.now();

        try {
          // Execute through circuit breaker
          const result = await this.circuitBreaker.execute(requestFn);

          // Update metrics
          this.serviceHealth.totalRequests++;
          this.serviceHealth.lastSuccessTime = Date.now();
          this.updateResponseTime(Date.now() - startTime);

          resolve(result);
        } catch (error) {
          this.serviceHealth.totalRequests++;
          this.serviceHealth.totalFailures++;
          this.serviceHealth.lastFailureTime = Date.now();

          // Enhanced error logging with correlation
          elizaLogger.error(
            `[${this.constructor.name}:${this.correlationId}] Request failed:`,
            {
              error: error.message,
              type: error.constructor.name,
              correlationId: this.correlationId,
              timestamp: new Date().toISOString(),
            },
          );

          reject(error);
        }
      };

      this.requestQueue.push(requestWrapper);

      if (!this.isProcessingQueue) {
        this.processRequestQueue();
      }
    });
  }

  /**
   * Update average response time metric
   */
  private updateResponseTime(responseTime: number): void {
    const count = this.serviceHealth.totalRequests;
    this.serviceHealth.averageResponseTime =
      (this.serviceHealth.averageResponseTime * (count - 1) + responseTime) /
      count;
  }

  /**
   * Process the request queue with rate limiting and enhanced backoff
   */
  protected async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;
    const rateLimitDelay = this.serviceConfig.rateLimitDelay || 3000;

    while (this.requestQueue.length > 0) {
      // Check if we're in backoff period
      if (this.backoffUntil > Date.now()) {
        const backoffTime = this.backoffUntil - Date.now();
        elizaLogger.warn(
          `[${this.constructor.name}:${this.correlationId}] In backoff period, waiting ${backoffTime}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
        this.backoffUntil = 0;
      }

      // Ensure minimum interval between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < rateLimitDelay) {
        await new Promise((resolve) =>
          setTimeout(resolve, rateLimitDelay - timeSinceLastRequest),
        );
      }

      const request = this.requestQueue.shift();
      if (request) {
        try {
          this.lastRequestTime = Date.now();
          await request(); // This will call the wrapper which handles resolve/reject
          this.consecutiveFailures = 0; // Reset failures on success
        } catch (error) {
          this.consecutiveFailures++;
          const maxFailures = this.serviceConfig.circuitBreakerThreshold || 5;
          elizaLogger.error(
            `[${this.constructor.name}:${this.correlationId}] Request failed (${this.consecutiveFailures}/${maxFailures}):`,
            error,
          );

          if (this.consecutiveFailures >= maxFailures) {
            // Implement exponential backoff with jitter
            const baseBackoff = Math.min(
              Math.pow(2, this.consecutiveFailures - maxFailures) * 30000,
              300000,
            );
            const jitter = Math.random() * 10000; // 0-10s jitter
            const backoffTime = baseBackoff + jitter;
            this.backoffUntil = Date.now() + backoffTime;
            elizaLogger.warn(
              `[${this.constructor.name}:${this.correlationId}] Too many consecutive failures, backing off for ${Math.round(backoffTime)}ms`,
            );
          }
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Check if cached data is still valid
   */
  protected isCacheValid(timestamp: number, duration?: number): boolean {
    const cacheTimeout = duration || this.serviceConfig.cacheTimeout || 60000;
    return Date.now() - timestamp < cacheTimeout;
  }

  /**
   * Get a setting from runtime configuration
   */
  protected getSetting(key: string, defaultValue?: string): string | undefined {
    return this.runtime.getSetting(key) || defaultValue;
  }

  // Abstract methods that must be implemented by subclasses
  abstract updateData(): Promise<void>;
  abstract forceUpdate(): Promise<any>;
}
