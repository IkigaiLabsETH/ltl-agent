import { IAgentRuntime, Service, elizaLogger } from "@elizaos/core";
import { v4 as uuidv4 } from "uuid";
import { getConfigurationManager, ServiceConfig } from "./ConfigurationManager";
import { getPerformanceMonitor } from "../utils/PerformanceMonitor";

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
  
  // Enhanced rate limiting properties
  protected adaptiveRateLimitDelay = 15000; // Start with 15s, will adapt
  protected rateLimitHistory: number[] = []; // Track recent response times
  protected lastRateLimitReset = Date.now();
  protected rateLimitWindow = 60000; // 1 minute window
  protected requestsInWindow = 0;
  protected maxRequestsPerWindow = 10; // Very conservative limit for public API
  
  // Circuit breaker for rate limiting
  protected rateLimitCircuitBreaker = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: 0,
    openUntil: 0,
    threshold: 3, // Open circuit after 3 consecutive rate limit errors
    timeout: 300000, // 5 minutes timeout
  };

  // Enhanced error handling and monitoring
  protected circuitBreaker: CircuitBreaker;
  protected serviceHealth: ServiceHealth;
  protected correlationId: string;

  // Configuration
  protected configKey: keyof ServiceConfig;
  protected serviceConfig: any;

  // Performance monitoring
  protected performanceMonitor = getPerformanceMonitor();

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

    // Initialize enhanced rate limiting
    this.adaptiveRateLimitDelay = this.serviceConfig.rateLimitDelay || 15000;
    this.maxRequestsPerWindow = this.serviceConfig.maxRequestsPerWindow || 10;
    this.rateLimitWindow = this.serviceConfig.rateLimitWindow || 60000;

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

    // Start performance monitoring for this service
    const serviceName = this.constructor.name;
    this.performanceMonitor.startServiceTimer(serviceName);
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

    // End performance monitoring for this service
    const serviceName = this.constructor.name;
    this.performanceMonitor.endServiceTimer(serviceName);
    this.performanceMonitor.takeMemorySnapshot();

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

    // Check if rate limit circuit breaker is open
    if (this.isRateLimitCircuitOpen()) {
      const remainingTime = this.rateLimitCircuitBreaker.openUntil - Date.now();
      throw new DataServiceError(
        `Rate limit circuit breaker is open, retry after ${Math.round(remainingTime)}ms`,
        "RATE_LIMIT_CIRCUIT_OPEN",
        true,
        this.constructor.name,
      );
    }

    return new Promise((resolve, reject) => {
      const requestWrapper = async () => {
        const startTime = Date.now();

        try {
          // Check rate limits before making request
          if (!this.canMakeRequest()) {
            const waitTime = this.rateLimitWindow - (Date.now() - this.lastRateLimitReset);
            elizaLogger.warn(
              `[${this.constructor.name}:${this.correlationId}] Rate limit exceeded, waiting ${waitTime}ms`,
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            this.resetRateLimitWindow();
          }

          this.incrementRequestCount();

          // Execute through circuit breaker
          const result = await this.circuitBreaker.execute(requestFn);

          // Update metrics
          this.serviceHealth.totalRequests++;
          this.serviceHealth.lastSuccessTime = Date.now();
          const responseTime = Date.now() - startTime;
          this.updateResponseTime(responseTime);
          this.updateAdaptiveRateLimit(responseTime, false);
          this.recordRateLimitSuccess(); // Record success

          resolve(result);
        } catch (error) {
          this.serviceHealth.totalRequests++;
          this.serviceHealth.totalFailures++;
          this.serviceHealth.lastFailureTime = Date.now();
          const responseTime = Date.now() - startTime;
          this.updateAdaptiveRateLimit(responseTime, true);

          // Check if this is a rate limit error
          if (error instanceof Error && error.message.includes('429')) {
            this.recordRateLimitFailure();
          }

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

      // Ensure minimum interval between requests using adaptive delay
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.adaptiveRateLimitDelay) {
        const waitTime = this.adaptiveRateLimitDelay - timeSinceLastRequest;
        elizaLogger.debug(
          `[${this.constructor.name}:${this.correlationId}] Rate limiting: waiting ${waitTime}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
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

  /**
   * Reset rate limit window if needed
   */
  private resetRateLimitWindow(): void {
    const now = Date.now();
    if (now - this.lastRateLimitReset >= this.rateLimitWindow) {
      this.requestsInWindow = 0;
      this.lastRateLimitReset = now;
      elizaLogger.debug(
        `[${this.constructor.name}:${this.correlationId}] Rate limit window reset`,
      );
    }
  }

  /**
   * Update adaptive rate limiting based on response time and errors
   */
  private updateAdaptiveRateLimit(responseTime: number, wasError: boolean): void {
    // Track response times (keep last 10)
    this.rateLimitHistory.push(responseTime);
    if (this.rateLimitHistory.length > 10) {
      this.rateLimitHistory.shift();
    }

    if (wasError) {
      // Increase delay more aggressively on errors
      this.adaptiveRateLimitDelay = Math.min(
        this.adaptiveRateLimitDelay * 2, // Double the delay on errors
        120000, // Max 2 minutes
      );
      elizaLogger.warn(
        `[${this.constructor.name}:${this.correlationId}] Rate limit delay increased to ${this.adaptiveRateLimitDelay}ms due to error`,
      );
    } else {
      // Gradually decrease delay on success, but be more conservative
      const avgResponseTime = this.rateLimitHistory.reduce((a, b) => a + b, 0) / this.rateLimitHistory.length;
      if (avgResponseTime < 2000 && this.adaptiveRateLimitDelay > 10000) {
        this.adaptiveRateLimitDelay = Math.max(
          this.adaptiveRateLimitDelay * 0.8, // Reduce by 20% on success
          10000, // Min 10s for public API
        );
        elizaLogger.debug(
          `[${this.constructor.name}:${this.correlationId}] Rate limit delay decreased to ${this.adaptiveRateLimitDelay}ms`,
        );
      }
    }
  }

  /**
   * Check if we can make a request within rate limits
   */
  private canMakeRequest(): boolean {
    this.resetRateLimitWindow();
    return this.requestsInWindow < this.maxRequestsPerWindow;
  }

  /**
   * Increment request counter
   */
  private incrementRequestCount(): void {
    this.requestsInWindow++;
  }

  /**
   * Check if rate limit circuit breaker is open
   */
  private isRateLimitCircuitOpen(): boolean {
    if (!this.rateLimitCircuitBreaker.isOpen) {
      return false;
    }

    // Check if timeout has passed
    if (Date.now() > this.rateLimitCircuitBreaker.openUntil) {
      this.rateLimitCircuitBreaker.isOpen = false;
      this.rateLimitCircuitBreaker.failureCount = 0;
      elizaLogger.info(
        `[${this.constructor.name}:${this.correlationId}] Rate limit circuit breaker closed`,
      );
      return false;
    }

    return true;
  }

  /**
   * Record a rate limit failure
   */
  private recordRateLimitFailure(): void {
    this.rateLimitCircuitBreaker.failureCount++;
    this.rateLimitCircuitBreaker.lastFailureTime = Date.now();

    if (this.rateLimitCircuitBreaker.failureCount >= this.rateLimitCircuitBreaker.threshold) {
      this.rateLimitCircuitBreaker.isOpen = true;
      this.rateLimitCircuitBreaker.openUntil = Date.now() + this.rateLimitCircuitBreaker.timeout;
      elizaLogger.warn(
        `[${this.constructor.name}:${this.correlationId}] Rate limit circuit breaker opened for ${this.rateLimitCircuitBreaker.timeout}ms`,
      );
    }
  }

  /**
   * Record a successful request (reset circuit breaker)
   */
  private recordRateLimitSuccess(): void {
    this.rateLimitCircuitBreaker.failureCount = 0;
    this.rateLimitCircuitBreaker.isOpen = false;
  }

  // Abstract methods that must be implemented by subclasses
  abstract updateData(): Promise<void>;
  abstract forceUpdate(): Promise<any>;
}
