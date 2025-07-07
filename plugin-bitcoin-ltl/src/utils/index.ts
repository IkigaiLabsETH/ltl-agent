/**
 * Utils Index - Export all utility functions and classes
 */

export {
  LoggerWithContext,
  PerformanceTracker,
  generateCorrelationId,
  ProviderCache,
  providerCache,
  fetchWithTimeout,
  retryOperation,
  validateElizaOSEnvironment,
  ElizaOSErrorHandler,
} from "./helpers";

export { BitcoinDataError, RateLimitError, NetworkError } from "./errors";

export {
  RequestBatcher,
  globalBatcher,
  batchRequest,
  type BatchRequest,
  type BatchResponse,
  type BatchConfig,
  type QueuedRequest,
} from "./request-batching";

export {
  ComprehensiveErrorHandler,
  globalErrorHandler,
  type ErrorSeverity,
  type ErrorCategory,
  type RecoveryStrategy,
} from "./comprehensive-error-handling";

export {
  ConfigMigrationUtility,
  configMigrationHelpers,
} from "./config-migration";

// Network utilities
export * from "./networkUtils";

// Environment utilities
export * from "./environmentUtils";

// Logging utilities
export * from "./loggingUtils";

// Cache utilities
export * from "./cacheUtils";

// Performance optimization utilities
export {
  PerformanceMonitor,
  getPerformanceMonitor,
} from "./PerformanceMonitor";

export {
  LazyLoader,
  ServiceLazyLoader,
  getLazyLoader,
  getServiceLazyLoader,
  LOADING_PRIORITIES,
} from "./LazyLoader";

export {
  PerformanceTest,
  runPerformanceTest,
} from "./PerformanceTest";
