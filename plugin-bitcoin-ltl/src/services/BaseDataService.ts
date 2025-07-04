import { IAgentRuntime, Service, logger } from '@elizaos/core';

export abstract class BaseDataService extends Service {
  // Rate limiting properties (shared across all services)
  protected lastRequestTime = 0;
  protected readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
  protected requestQueue: Array<() => Promise<any>> = [];
  protected isProcessingQueue = false;
  protected consecutiveFailures = 0;
  protected readonly MAX_CONSECUTIVE_FAILURES = 5;
  protected backoffUntil = 0;

  constructor(runtime: IAgentRuntime) {
    super();
    this.runtime = runtime;
  }

  /**
   * Queue a request to be processed with rate limiting
   */
  protected async makeQueuedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.isProcessingQueue) {
        this.processRequestQueue();
      }
    });
  }

  /**
   * Process the request queue with rate limiting and backoff
   */
  protected async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      // Check if we're in backoff period
      if (this.backoffUntil > Date.now()) {
        const backoffTime = this.backoffUntil - Date.now();
        console.log(`[BaseDataService] In backoff period, waiting ${backoffTime}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        this.backoffUntil = 0;
      }
      
      // Ensure minimum interval between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }
      
      const request = this.requestQueue.shift();
      if (request) {
        try {
          this.lastRequestTime = Date.now();
          await request();
          this.consecutiveFailures = 0; // Reset failures on success
        } catch (error) {
          this.consecutiveFailures++;
          console.error(`[BaseDataService] Request failed (${this.consecutiveFailures}/${this.MAX_CONSECUTIVE_FAILURES}):`, error);
          
          if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            // Implement exponential backoff
            const backoffTime = Math.min(Math.pow(2, this.consecutiveFailures - this.MAX_CONSECUTIVE_FAILURES) * 30000, 300000); // Max 5 minutes
            this.backoffUntil = Date.now() + backoffTime;
            console.log(`[BaseDataService] Too many consecutive failures, backing off for ${backoffTime}ms`);
          }
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Fetch with retry logic and exponential backoff
   */
  protected async fetchWithRetry(url: string, options: any = {}, maxRetries = 3): Promise<any> {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (response.status === 429) {
          // Rate limited - exponential backoff
          const waitTime = Math.min(Math.pow(2, i) * 5000, 60000); // 5s, 10s, 20s, up to 60s
          console.warn(`[BaseDataService] Rate limited, waiting ${waitTime}ms before retry ${i + 1}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          const waitTime = Math.min(Math.pow(2, i) * 3000, 30000); // 3s, 6s, 12s, up to 30s
          console.warn(`[BaseDataService] Request failed, waiting ${waitTime}ms before retry ${i + 1}:`, error);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Check if cache is still valid
   */
  protected isCacheValid(timestamp: number, duration: number): boolean {
    return Date.now() - timestamp < duration;
  }

  /**
   * Abstract methods that must be implemented by subclasses
   */
  abstract updateData(): Promise<void>;
  abstract forceUpdate(): Promise<any>;
} 