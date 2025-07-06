/**
 * Request Batching Utility
 * Optimizes API calls by batching multiple requests together
 */

export interface BatchRequest {
  id: string;
  url: string;
  options?: RequestInit;
  priority: 'high' | 'medium' | 'low';
  timeout?: number;
}

export interface QueuedRequest extends BatchRequest {
  resolve: (response: BatchResponse) => void;
}

export interface BatchResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  statusCode?: number;
}

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  maxConcurrentBatches: number;
  retryAttempts: number;
  retryDelay: number;
}

export class RequestBatcher {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private activeBatches = 0;
  private config: BatchConfig;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: config.maxBatchSize || 10,
      maxWaitTime: config.maxWaitTime || 1000,
      maxConcurrentBatches: config.maxConcurrentBatches || 3,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
  }

  /**
   * Add a request to the batch queue
   */
  async addRequest(request: Omit<BatchRequest, 'id'>): Promise<BatchResponse> {
    const id = this.generateRequestId();
    const batchRequest: BatchRequest = { ...request, id };
    
    return new Promise((resolve) => {
      this.queue.push({
        ...batchRequest,
        resolve
      });
      
      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.activeBatches >= this.config.maxConcurrentBatches) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeBatches < this.config.maxConcurrentBatches) {
      const batch = this.createBatch();
      if (batch.length === 0) break;

      this.activeBatches++;
      this.executeBatch(batch).finally(() => {
        this.activeBatches--;
        this.processQueue();
      });
    }

    this.processing = false;
  }

  /**
   * Create a batch from the queue
   */
  private createBatch(): QueuedRequest[] {
    const batch: QueuedRequest[] = [];
    
    // Sort by priority and take up to maxBatchSize
    const sortedQueue = this.queue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    while (batch.length < this.config.maxBatchSize && sortedQueue.length > 0) {
      const request = sortedQueue.shift()!;
      batch.push(request);
    }

    return batch;
  }

  /**
   * Execute a batch of requests
   */
  private async executeBatch(batch: QueuedRequest[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Execute requests in parallel with individual timeouts
      const promises = batch.map(async (request) => {
        const requestStart = Date.now();
        
        try {
          const response = await this.executeSingleRequest(request);
          const duration = Date.now() - requestStart;
          
          request.resolve({
            id: request.id,
            success: true,
            data: response,
            duration,
            statusCode: 200
          });
        } catch (error) {
          const duration = Date.now() - requestStart;
          
          request.resolve({
            id: request.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration,
            statusCode: error instanceof Response ? error.status : undefined
          });
        }
      });

      await Promise.all(promises);
      
    } catch (error) {
      // Handle batch-level errors
      batch.forEach(request => {
        request.resolve({
          id: request.id,
          success: false,
          error: 'Batch execution failed',
          duration: Date.now() - startTime
        });
      });
    }
  }

  /**
   * Execute a single request with retry logic
   */
  private async executeSingleRequest(request: BatchRequest): Promise<any> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), request.timeout || 10000);
        
        const response = await fetch(request.url, {
          ...request.options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timeout after ${request.timeout || 10000}ms`);
        }
        
        if (attempt === this.config.retryAttempts - 1) {
          throw lastError;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt)));
      }
    }
    
    throw lastError!;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueLength: number;
    activeBatches: number;
    processing: boolean;
  } {
    return {
      queueLength: this.queue.length,
      activeBatches: this.activeBatches,
      processing: this.processing
    };
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue.forEach(request => {
      request.resolve({
        id: request.id,
        success: false,
        error: 'Queue cleared',
        duration: 0
      });
    });
    this.queue = [];
  }
}

/**
 * Global batcher instance for shared use
 */
export const globalBatcher = new RequestBatcher();

/**
 * Convenience function for batching requests
 */
export async function batchRequest(
  url: string, 
  options?: RequestInit, 
  priority: 'high' | 'medium' | 'low' = 'medium',
  timeout?: number
): Promise<BatchResponse> {
  return globalBatcher.addRequest({ url, options, priority, timeout });
} 