import { logger } from "@elizaos/core";
import {
  BitcoinDataError,
  ElizaOSError,
  EmbeddingDimensionError,
  DatabaseConnectionError,
  PortInUseError,
  MissingAPIKeyError,
  NetworkError,
} from "./errors";

/**
 * ElizaOS-specific error handling for common framework issues
 */
export class ElizaOSErrorHandler {
  static handleCommonErrors(error: Error, context: string): Error {
    const message = error.message.toLowerCase();

    // Check for embedding dimension mismatch
    if (message.includes("embedding") && message.includes("dimension")) {
      const match = message.match(/expected (\d+), got (\d+)/);
      if (match) {
        return new EmbeddingDimensionError(
          parseInt(match[1]),
          parseInt(match[2]),
        );
      }
    }

    // Check for database connection issues
    if (
      message.includes("database") ||
      message.includes("connection") ||
      message.includes("pglite")
    ) {
      return new DatabaseConnectionError(error);
    }

    // Check for port conflicts
    if (message.includes("port") && message.includes("already in use")) {
      const match = message.match(/port (\d+)/);
      if (match) {
        return new PortInUseError(parseInt(match[1]));
      }
    }

    // Check for missing API keys
    if (message.includes("api key") || message.includes("unauthorized")) {
      return new MissingAPIKeyError("REQUIRED_API_KEY", context);
    }

    return error;
  }

  static logStructuredError(
    error: Error,
    contextLogger: LoggerWithContext,
    context: any = {},
  ) {
    if (error instanceof ElizaOSError) {
      contextLogger.error(`[${error.code}] ${error.message}`, {
        ...context,
        resolution: error.resolution,
        errorType: error.name,
      });
    } else {
      contextLogger.error(`Unexpected error: ${error.message}`, {
        ...context,
        errorType: error.name,
        stack: error.stack,
      });
    }
  }
}

/**
 * Environment validation utility
 */
export function validateElizaOSEnvironment(): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const env = process.env;

  // Check for common configuration issues
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    issues.push(
      "No LLM provider API key found (OPENAI_API_KEY or ANTHROPIC_API_KEY)",
    );
  }

  if (
    env.OPENAI_EMBEDDING_DIMENSIONS &&
    isNaN(parseInt(env.OPENAI_EMBEDDING_DIMENSIONS))
  ) {
    issues.push("OPENAI_EMBEDDING_DIMENSIONS must be a number");
  }

  if (env.SERVER_PORT && isNaN(parseInt(env.SERVER_PORT))) {
    issues.push("SERVER_PORT must be a number");
  }

  if (env.DATABASE_URL && !env.DATABASE_URL.startsWith("postgresql://")) {
    issues.push("DATABASE_URL must be a valid PostgreSQL connection string");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Retry operation utility with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry non-retryable errors
      if (error instanceof BitcoinDataError && !error.retryable) {
        throw error;
      }

      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Fetch with timeout utility
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new NetworkError(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Provider cache utility
 */
export class ProviderCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  set(key: string, data: any, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Logging utilities with correlation IDs and performance tracking
 */
export class LoggerWithContext {
  constructor(
    private correlationId: string,
    private component: string,
  ) {}

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logData = data ? ` | Data: ${this.safeStringify(data)}` : "";
    return `[${timestamp}] [${level}] [${this.component}] [${this.correlationId}] ${message}${logData}`;
  }

  /**
   * Safely stringify data, handling circular references
   */
  private safeStringify(obj: any): string {
    try {
      return JSON.stringify(obj);
    } catch (error) {
      // If JSON.stringify fails due to circular references, create a safe version
      try {
        return JSON.stringify(this.removeCircularReferences(obj));
      } catch (fallbackError) {
        return `[Object with circular references: ${typeof obj}]`;
      }
    }
  }

  /**
   * Remove circular references from an object
   */
  private removeCircularReferences(obj: any, seen = new WeakSet()): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (seen.has(obj)) {
      return '[Circular Reference]';
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeCircularReferences(item, seen));
    }

    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        try {
          result[key] = this.removeCircularReferences(obj[key], seen);
        } catch (error) {
          result[key] = '[Error accessing property]';
        }
      }
    }

    return result;
  }

  info(message: string, data?: any) {
    logger.info(this.formatMessage("INFO", message, data));
  }

  warn(message: string, data?: any) {
    logger.warn(this.formatMessage("WARN", message, data));
  }

  error(message: string, data?: any) {
    logger.error(this.formatMessage("ERROR", message, data));
  }

  debug(message: string, data?: any) {
    logger.debug(this.formatMessage("DEBUG", message, data));
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceTracker {
  private startTime: number;
  private logger: LoggerWithContext;

  constructor(
    logger: LoggerWithContext,
    private operation: string,
  ) {
    this.logger = logger;
    this.startTime = Date.now();
    this.logger.debug(`Starting operation: ${operation}`);
  }

  finish(success: boolean = true, additionalData?: any) {
    const duration = Date.now() - this.startTime;
    const status = success ? "SUCCESS" : "FAILURE";
    this.logger.info(`Operation ${this.operation} completed`, {
      status,
      duration_ms: duration,
      ...additionalData,
    });
    return duration;
  }
}

/**
 * Generate correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `btc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize provider results to prevent JSON.stringify errors
 * This function removes circular references and limits object sizes
 */
export function sanitizeProviderResult(result: any, maxDepth: number = 3, maxArrayLength: number = 100): any {
  return sanitizeObject(result, maxDepth, maxArrayLength, new WeakSet());
}

/**
 * Recursively sanitize an object to prevent circular references and size issues
 */
function sanitizeObject(obj: any, maxDepth: number, maxArrayLength: number, seen: WeakSet<any>, currentDepth: number = 0): any {
  // Handle null, undefined, and primitives
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // Prevent circular references
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }

  // Limit recursion depth
  if (currentDepth >= maxDepth) {
    return '[Max Depth Reached]';
  }

  seen.add(obj);

  try {
    // Handle arrays
    if (Array.isArray(obj)) {
      if (obj.length > maxArrayLength) {
        return obj.slice(0, maxArrayLength).map(item => 
          sanitizeObject(item, maxDepth, maxArrayLength, seen, currentDepth + 1)
        ).concat([`[${obj.length - maxArrayLength} more items...]`]);
      }
      return obj.map(item => 
        sanitizeObject(item, maxDepth, maxArrayLength, seen, currentDepth + 1)
      );
    }

    // Handle objects
    const result: any = {};
    const keys = Object.keys(obj);
    
    // Limit number of properties for very large objects
    const maxKeys = 50;
    const keysToProcess = keys.length > maxKeys ? keys.slice(0, maxKeys) : keys;
    
    for (const key of keysToProcess) {
      try {
        result[key] = sanitizeObject(obj[key], maxDepth, maxArrayLength, seen, currentDepth + 1);
      } catch (error) {
        result[key] = '[Error accessing property]';
      }
    }

    if (keys.length > maxKeys) {
      result['[additional_properties]'] = `${keys.length - maxKeys} more properties...`;
    }

    return result;
  } catch (error) {
    return '[Error sanitizing object]';
  } finally {
    seen.delete(obj);
  }
}

// Global cache instance for providers
export const providerCache = new ProviderCache();
