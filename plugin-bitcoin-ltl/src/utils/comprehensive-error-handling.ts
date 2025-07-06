import { elizaLogger } from "@elizaos/core";
import { LoggerWithContext, generateCorrelationId } from "./helpers";

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Error categories for better organization
 */
export enum ErrorCategory {
  NETWORK = "network",
  API = "api",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  RATE_LIMIT = "rate_limit",
  TIMEOUT = "timeout",
  CONFIGURATION = "configuration",
  DATABASE = "database",
  CACHE = "cache",
  BUSINESS_LOGIC = "business_logic",
  UNKNOWN = "unknown",
}

/**
 * Error context for better debugging
 */
export interface ErrorContext {
  correlationId: string;
  component: string;
  operation: string;
  timestamp: Date;
  params?: any;
  stack?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
}

/**
 * Error recovery strategy
 */
export interface RecoveryStrategy {
  name: string;
  description: string;
  shouldRetry: boolean;
  maxRetries: number;
  backoffStrategy: "fixed" | "exponential" | "linear";
  backoffDelay: number;
  fallbackAction?: string;
  circuitBreaker?: boolean;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
}

/**
 * Comprehensive error information
 */
export interface ComprehensiveError {
  id: string;
  message: string;
  originalError: Error;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  recoveryStrategy: RecoveryStrategy;
  metadata: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolutionTime?: Date;
  resolutionStrategy?: string;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  enableDetailedLogging: boolean;
  enableErrorReporting: boolean;
  enableRecoveryStrategies: boolean;
  enableCircuitBreakers: boolean;
  maxErrorHistory: number;
  errorReportingEndpoint?: string;
  errorReportingApiKey?: string;
}

/**
 * Circuit breaker state
 */
export enum CircuitBreakerState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open",
}

/**
 * Circuit breaker for error handling
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(
    private readonly name: string,
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000,
    private readonly successThreshold: number = 2,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
        elizaLogger.info(
          `[CircuitBreaker:${this.name}] Moving to HALF_OPEN state`,
        );
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
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

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
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

    if (
      this.state === CircuitBreakerState.CLOSED &&
      this.failureCount >= this.threshold
    ) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = Date.now() + this.timeout;
      elizaLogger.warn(
        `[CircuitBreaker:${this.name}] Moving to OPEN state due to ${this.failureCount} failures`,
      );
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = Date.now() + this.timeout;
      elizaLogger.warn(
        `[CircuitBreaker:${this.name}] Moving back to OPEN state due to failure`,
      );
    }
  }

  getState(): {
    state: CircuitBreakerState;
    failureCount: number;
    successCount: number;
    nextAttemptTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime,
    };
  }
}

/**
 * Comprehensive Error Handler
 * Provides advanced error handling with categorization, recovery strategies, and circuit breakers
 */
export class ComprehensiveErrorHandler {
  private config: ErrorHandlerConfig;
  private logger: LoggerWithContext;
  private errorHistory: ComprehensiveError[] = [];
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private recoveryStrategies: Map<ErrorCategory, RecoveryStrategy> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableDetailedLogging: true,
      enableErrorReporting: false,
      enableRecoveryStrategies: true,
      enableCircuitBreakers: true,
      maxErrorHistory: 1000,
      ...config,
    };

    this.logger = new LoggerWithContext(
      generateCorrelationId(),
      "ComprehensiveErrorHandler",
    );
    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies.set(ErrorCategory.NETWORK, {
      name: "Network Retry",
      description: "Retry network operations with exponential backoff",
      shouldRetry: true,
      maxRetries: 3,
      backoffStrategy: "exponential",
      backoffDelay: 1000,
      circuitBreaker: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
    });

    this.recoveryStrategies.set(ErrorCategory.API, {
      name: "API Retry",
      description: "Retry API calls with exponential backoff",
      shouldRetry: true,
      maxRetries: 3,
      backoffStrategy: "exponential",
      backoffDelay: 2000,
      circuitBreaker: true,
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 30000,
    });

    this.recoveryStrategies.set(ErrorCategory.RATE_LIMIT, {
      name: "Rate Limit Wait",
      description: "Wait for rate limit to reset",
      shouldRetry: true,
      maxRetries: 1,
      backoffStrategy: "fixed",
      backoffDelay: 60000,
      circuitBreaker: false,
    });

    this.recoveryStrategies.set(ErrorCategory.TIMEOUT, {
      name: "Timeout Retry",
      description: "Retry operations that timed out",
      shouldRetry: true,
      maxRetries: 2,
      backoffStrategy: "linear",
      backoffDelay: 5000,
      circuitBreaker: true,
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 30000,
    });

    this.recoveryStrategies.set(ErrorCategory.VALIDATION, {
      name: "Validation Error",
      description: "Validation errors should not be retried",
      shouldRetry: false,
      maxRetries: 0,
      backoffStrategy: "fixed",
      backoffDelay: 0,
      circuitBreaker: false,
    });

    this.recoveryStrategies.set(ErrorCategory.AUTHENTICATION, {
      name: "Authentication Error",
      description: "Authentication errors require re-authentication",
      shouldRetry: false,
      maxRetries: 0,
      backoffStrategy: "fixed",
      backoffDelay: 0,
      fallbackAction: "reauthenticate",
      circuitBreaker: false,
    });
  }

  /**
   * Handle an error with comprehensive analysis and recovery
   */
  async handleError(
    error: Error,
    context: Partial<ErrorContext>,
    operation?: () => Promise<any>,
  ): Promise<ComprehensiveError> {
    const errorId = generateCorrelationId();
    const timestamp = new Date();

    // Create comprehensive error context
    const fullContext: ErrorContext = {
      correlationId: context.correlationId || generateCorrelationId(),
      component: context.component || "unknown",
      operation: context.operation || "unknown",
      timestamp,
      params: context.params,
      stack: error.stack,
      userAgent: context.userAgent,
      requestId: context.requestId,
      sessionId: context.sessionId,
    };

    // Analyze error
    const category = this.categorizeError(error);
    const severity = this.determineSeverity(error, category);
    const recoveryStrategy = this.getRecoveryStrategy(category);

    // Create comprehensive error
    const comprehensiveError: ComprehensiveError = {
      id: errorId,
      message: error.message,
      originalError: error,
      category,
      severity,
      context: fullContext,
      recoveryStrategy,
      metadata: this.extractMetadata(error),
      timestamp,
      resolved: false,
    };

    // Log error
    this.logError(comprehensiveError);

    // Store in history
    this.addToHistory(comprehensiveError);

    // Attempt recovery if enabled
    if (
      this.config.enableRecoveryStrategies &&
      operation &&
      recoveryStrategy.shouldRetry
    ) {
      try {
        const result = await this.attemptRecovery(
          comprehensiveError,
          operation,
        );
        comprehensiveError.resolved = true;
        comprehensiveError.resolutionTime = new Date();
        comprehensiveError.resolutionStrategy = "retry_success";

        this.logger.info("Error resolved through recovery strategy", {
          errorId,
          strategy: recoveryStrategy.name,
          attempts: recoveryStrategy.maxRetries,
        });

        return comprehensiveError;
      } catch (recoveryError) {
        comprehensiveError.metadata.recoveryFailed = true;
        comprehensiveError.metadata.recoveryError =
          recoveryError instanceof Error
            ? recoveryError.message
            : "Unknown recovery error";

        this.logger.error("Recovery strategy failed", {
          errorId,
          strategy: recoveryStrategy.name,
          recoveryError:
            recoveryError instanceof Error
              ? recoveryError.message
              : "Unknown error",
        });
      }
    }

    // Report error if enabled
    if (this.config.enableErrorReporting) {
      await this.reportError(comprehensiveError);
    }

    return comprehensiveError;
  }

  /**
   * Categorize error based on its type and message
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (
      name.includes("network") ||
      message.includes("network") ||
      message.includes("fetch")
    ) {
      return ErrorCategory.NETWORK;
    }

    if (name.includes("timeout") || message.includes("timeout")) {
      return ErrorCategory.TIMEOUT;
    }

    if (message.includes("rate limit") || message.includes("429")) {
      return ErrorCategory.RATE_LIMIT;
    }

    if (message.includes("unauthorized") || message.includes("401")) {
      return ErrorCategory.AUTHENTICATION;
    }

    if (message.includes("forbidden") || message.includes("403")) {
      return ErrorCategory.AUTHORIZATION;
    }

    if (message.includes("validation") || message.includes("invalid")) {
      return ErrorCategory.VALIDATION;
    }

    if (message.includes("api") || message.includes("endpoint")) {
      return ErrorCategory.API;
    }

    if (message.includes("database") || message.includes("db")) {
      return ErrorCategory.DATABASE;
    }

    if (message.includes("cache")) {
      return ErrorCategory.CACHE;
    }

    if (message.includes("config")) {
      return ErrorCategory.CONFIGURATION;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(
    error: Error,
    category: ErrorCategory,
  ): ErrorSeverity {
    const message = error.message.toLowerCase();

    // Critical errors
    if (
      category === ErrorCategory.AUTHENTICATION ||
      category === ErrorCategory.AUTHORIZATION ||
      message.includes("critical") ||
      message.includes("fatal")
    ) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (
      category === ErrorCategory.DATABASE ||
      category === ErrorCategory.CONFIGURATION ||
      message.includes("connection") ||
      message.includes("timeout")
    ) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (
      category === ErrorCategory.API ||
      category === ErrorCategory.NETWORK ||
      message.includes("retry")
    ) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity errors
    if (
      category === ErrorCategory.VALIDATION ||
      category === ErrorCategory.RATE_LIMIT
    ) {
      return ErrorSeverity.LOW;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Get recovery strategy for error category
   */
  private getRecoveryStrategy(category: ErrorCategory): RecoveryStrategy {
    return (
      this.recoveryStrategies.get(category) ||
      this.recoveryStrategies.get(ErrorCategory.UNKNOWN)!
    );
  }

  /**
   * Extract metadata from error
   */
  private extractMetadata(error: Error): Record<string, any> {
    const metadata: Record<string, any> = {
      name: error.name,
      stack: error.stack,
      constructor: error.constructor.name,
    };

    // Extract additional properties
    Object.getOwnPropertyNames(error).forEach((prop) => {
      if (prop !== "name" && prop !== "message" && prop !== "stack") {
        metadata[prop] = (error as any)[prop];
      }
    });

    return metadata;
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: ComprehensiveError): void {
    if (!this.config.enableDetailedLogging) {
      return;
    }

    const logData = {
      errorId: error.id,
      category: error.category,
      severity: error.severity,
      component: error.context.component,
      operation: error.context.operation,
      correlationId: error.context.correlationId,
      strategy: error.recoveryStrategy?.name || "unknown",
      metadata: error.metadata,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        this.logger.error(`CRITICAL ERROR: ${error.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
        this.logger.error(`HIGH SEVERITY ERROR: ${error.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(`MEDIUM SEVERITY ERROR: ${error.message}`, logData);
        break;
      case ErrorSeverity.LOW:
        this.logger.info(`LOW SEVERITY ERROR: ${error.message}`, logData);
        break;
    }
  }

  /**
   * Add error to history
   */
  private addToHistory(error: ComprehensiveError): void {
    this.errorHistory.push(error);

    // Maintain history size
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
    }
  }

  /**
   * Attempt recovery using circuit breaker and retry logic
   */
  private async attemptRecovery(
    error: ComprehensiveError,
    operation: () => Promise<any>,
  ): Promise<any> {
    const strategy = error.recoveryStrategy;

    // Use circuit breaker if enabled
    if (strategy.circuitBreaker && this.config.enableCircuitBreakers) {
      const circuitBreaker = this.getCircuitBreaker(error.context.component);
      return await circuitBreaker.execute(operation);
    }

    // Simple retry logic
    let lastError: Error;

    for (let attempt = 0; attempt < strategy.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (retryError) {
        lastError = retryError as Error;

        if (attempt === strategy.maxRetries - 1) {
          throw lastError;
        }

        // Calculate delay based on strategy
        const delay = this.calculateBackoffDelay(strategy, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));

        this.logger.warn("Retry attempt failed, retrying", {
          errorId: error.id,
          attempt: attempt + 1,
          maxRetries: strategy.maxRetries,
          delay,
          error: lastError.message,
        });
      }
    }

    throw lastError!;
  }

  /**
   * Calculate backoff delay based on strategy
   */
  private calculateBackoffDelay(
    strategy: RecoveryStrategy,
    attempt: number,
  ): number {
    switch (strategy.backoffStrategy) {
      case "fixed":
        return strategy.backoffDelay;
      case "linear":
        return strategy.backoffDelay * (attempt + 1);
      case "exponential":
        return strategy.backoffDelay * Math.pow(2, attempt);
      default:
        return strategy.backoffDelay;
    }
  }

  /**
   * Get or create circuit breaker for component
   */
  private getCircuitBreaker(component: string): CircuitBreaker {
    if (!this.circuitBreakers.has(component)) {
      const strategy = this.recoveryStrategies.get(ErrorCategory.API)!;
      const circuitBreaker = new CircuitBreaker(
        component,
        strategy.circuitBreakerThreshold || 5,
        strategy.circuitBreakerTimeout || 60000,
      );
      this.circuitBreakers.set(component, circuitBreaker);
    }

    return this.circuitBreakers.get(component)!;
  }

  /**
   * Report error to external service
   */
  private async reportError(error: ComprehensiveError): Promise<void> {
    if (!this.config.errorReportingEndpoint) {
      return;
    }

    try {
      const reportData = {
        id: error.id,
        message: error.message,
        category: error.category,
        severity: error.severity,
        context: error.context,
        metadata: error.metadata,
        timestamp: error.timestamp.toISOString(),
      };

      const response = await fetch(this.config.errorReportingEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.errorReportingApiKey}`,
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        this.logger.warn("Failed to report error to external service", {
          errorId: error.id,
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (reportError) {
      this.logger.warn("Failed to report error to external service", {
        errorId: error.id,
        reportError:
          reportError instanceof Error ? reportError.message : "Unknown error",
      });
    }
  }

  /**
   * Get error statistics
   */
  getStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    resolutionRate: number;
    circuitBreakerStates: Record<string, CircuitBreakerState>;
  } {
    const errorsByCategory: Record<ErrorCategory, number> = {} as any;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any;

    // Initialize counters
    Object.values(ErrorCategory).forEach((category) => {
      errorsByCategory[category] = 0;
    });

    Object.values(ErrorSeverity).forEach((severity) => {
      errorsBySeverity[severity] = 0;
    });

    // Count errors
    this.errorHistory.forEach((error) => {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
    });

    const resolvedErrors = this.errorHistory.filter(
      (error) => error.resolved,
    ).length;
    const resolutionRate =
      this.errorHistory.length > 0
        ? resolvedErrors / this.errorHistory.length
        : 0;

    const circuitBreakerStates: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((breaker, name) => {
      circuitBreakerStates[name] = breaker.getState().state;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByCategory,
      errorsBySeverity,
      resolutionRate,
      circuitBreakerStates,
    };
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): ComprehensiveError[] {
    return this.errorHistory.slice(-count);
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ComprehensiveErrorHandler();

/**
 * Convenience function for handling errors
 */
export async function handleError(
  error: Error,
  context: Partial<ErrorContext>,
  operation?: () => Promise<any>,
): Promise<ComprehensiveError> {
  return globalErrorHandler.handleError(error, context, operation);
}
