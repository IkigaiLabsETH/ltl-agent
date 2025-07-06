import { logger } from '@elizaos/core';

/**
 * Logging utilities with correlation IDs and performance tracking
 */
export class LoggerWithContext {
  constructor(private correlationId: string, private component: string) {}

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] [${this.component}] [${this.correlationId}] ${message}${logData}`;
  }

  info(message: string, data?: any) {
    logger.info(this.formatMessage('INFO', message, data));
  }

  warn(message: string, data?: any) {
    logger.warn(this.formatMessage('WARN', message, data));
  }

  error(message: string, data?: any) {
    logger.error(this.formatMessage('ERROR', message, data));
  }

  debug(message: string, data?: any) {
    logger.debug(this.formatMessage('DEBUG', message, data));
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceTracker {
  private startTime: number;
  private logger: LoggerWithContext;

  constructor(logger: LoggerWithContext, private operation: string) {
    this.logger = logger;
    this.startTime = Date.now();
    this.logger.debug(`Starting operation: ${operation}`);
  }

  finish(success: boolean = true, additionalData?: any) {
    const duration = Date.now() - this.startTime;
    const status = success ? 'SUCCESS' : 'FAILURE';
    this.logger.info(`Operation ${this.operation} completed`, {
      status,
      duration_ms: duration,
      ...additionalData
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