import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { LoggerWithContext, generateCorrelationId } from "../../utils";

/**
 * Base class for data components used in consolidated services
 * Provides common functionality for data fetching, caching, and health monitoring
 */
export abstract class BaseDataComponent {
  protected runtime: IAgentRuntime;
  protected contextLogger: LoggerWithContext;
  protected isInitialized = false;
  protected lastUpdateTime: Date | null = null;
  
  // Performance metrics
  protected metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastError: null as string | null
  };

  constructor(runtime: IAgentRuntime, componentName: string) {
    this.runtime = runtime;
    this.contextLogger = new LoggerWithContext(generateCorrelationId(), componentName);
  }

  /**
   * Initialize the component
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.contextLogger.warn("Component already initialized");
      return;
    }

    try {
      await this.doInitialize();
      this.isInitialized = true;
      this.contextLogger.info("Component initialized successfully");
    } catch (error) {
      this.contextLogger.error("Failed to initialize component:", error);
      throw error;
    }
  }

  /**
   * Stop the component and cleanup resources
   */
  async stop(): Promise<void> {
    this.contextLogger.info("Stopping component...");
    await this.doStop();
    this.isInitialized = false;
    this.contextLogger.info("Component stopped successfully");
  }

  /**
   * Update component data
   */
  async update(): Promise<void> {
    if (!this.isInitialized) {
      this.contextLogger.warn("Component not initialized, skipping update");
      return;
    }

    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      await this.doUpdate();
      this.lastUpdateTime = new Date();
      this.metrics.successfulRequests++;
      this.updateResponseTime(Date.now() - startTime);
      this.contextLogger.debug("Component updated successfully");
    } catch (error) {
      this.metrics.failedRequests++;
      this.metrics.lastError = error.message;
      this.updateResponseTime(Date.now() - startTime);
      this.contextLogger.error("Failed to update component:", error);
      throw error;
    }
  }

  /**
   * Check if component is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      return await this.doHealthCheck();
    } catch (error) {
      this.contextLogger.error("Health check failed:", error);
      return false;
    }
  }

  /**
   * Get component metrics
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  /**
   * Get last update time
   */
  getLastUpdateTime(): Date | null {
    return this.lastUpdateTime;
  }

  /**
   * Update average response time
   */
  private updateResponseTime(responseTime: number): void {
    const totalRequests = this.metrics.totalRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  protected abstract doInitialize(): Promise<void>;
  protected abstract doStop(): Promise<void>;
  protected abstract doUpdate(): Promise<void>;
  protected abstract doHealthCheck(): Promise<boolean>;
} 