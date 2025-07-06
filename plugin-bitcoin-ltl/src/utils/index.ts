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
  ElizaOSErrorHandler
} from './helpers';

export { 
  BitcoinDataError, 
  RateLimitError, 
  NetworkError 
} from './errors';

export {
  RequestBatcher,
  globalBatcher,
  batchRequest,
  type BatchRequest,
  type BatchResponse,
  type BatchConfig,
  type QueuedRequest
} from './request-batching'; 