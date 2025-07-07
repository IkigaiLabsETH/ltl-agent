import { IAgentRuntime, elizaLogger, Service } from "@elizaos/core";
import { getPerformanceMonitor } from "../utils/PerformanceMonitor";
import { getServiceLazyLoader, getLazyLoader, LOADING_PRIORITIES } from "../utils/LazyLoader";

/**
 * Optimized Service Factory
 * 
 * Implements lazy loading and parallel initialization to improve
 * cold start performance and reduce memory usage.
 */
export class OptimizedServiceFactory {
  private runtime: IAgentRuntime;
  private logger = elizaLogger.child({ module: "OptimizedServiceFactory" });
  private performanceMonitor = getPerformanceMonitor();
  private lazyLoader = getServiceLazyLoader();
  
  // Service instances cache
  private serviceInstances: Map<string, Service> = new Map();
  private initializationPromises: Map<string, Promise<Service>> = new Map();

  constructor(runtime: IAgentRuntime) {
    this.runtime = runtime;
  }

  /**
   * Initialize critical services immediately (synchronous)
   */
  async initializeCriticalServices(): Promise<void> {
    this.logger.info("Initializing critical services...");
    this.performanceMonitor.startServiceTimer("critical-services-init");

    try {
      // Load critical services in parallel
      const criticalServices = LOADING_PRIORITIES.CRITICAL;
      const initPromises = criticalServices.map(serviceName => 
        this.initializeService(serviceName)
      );

      await Promise.all(initPromises);
      this.performanceMonitor.endServiceTimer("critical-services-init");
      this.logger.info("Critical services initialized successfully");
    } catch (error) {
      this.performanceMonitor.endServiceTimer("critical-services-init");
      this.logger.error("Failed to initialize critical services", error);
      throw error;
    }
  }

  /**
   * Initialize essential services on demand
   */
  async initializeEssentialServices(): Promise<void> {
    this.logger.info("Initializing essential services...");
    this.performanceMonitor.startServiceTimer("essential-services-init");

    try {
      const essentialServices = LOADING_PRIORITIES.ESSENTIAL;
      const initPromises = essentialServices.map(serviceName => 
        this.initializeService(serviceName)
      );

      await Promise.all(initPromises);
      this.performanceMonitor.endServiceTimer("essential-services-init");
      this.logger.info("Essential services initialized successfully");
    } catch (error) {
      this.performanceMonitor.endServiceTimer("essential-services-init");
      this.logger.error("Failed to initialize essential services", error);
      throw error;
    }
  }

  /**
   * Get a service instance with lazy loading
   */
  async getService<T extends Service>(serviceName: string): Promise<T> {
    // Return cached instance if available
    if (this.serviceInstances.has(serviceName)) {
      return this.serviceInstances.get(serviceName) as T;
    }

    // Return existing initialization promise if already initializing
    if (this.initializationPromises.has(serviceName)) {
      return this.initializationPromises.get(serviceName) as Promise<T>;
    }

    // Initialize the service
    const initPromise = this.initializeService(serviceName);
    this.initializationPromises.set(serviceName, initPromise);

    try {
      const service = await initPromise;
      this.initializationPromises.delete(serviceName);
      return service as T;
    } catch (error) {
      this.initializationPromises.delete(serviceName);
      throw error;
    }
  }

  /**
   * Initialize a single service with performance monitoring
   */
  private async initializeService(serviceName: string): Promise<Service> {
    this.performanceMonitor.startServiceTimer(serviceName);

    try {
      this.logger.debug(`Initializing service: ${serviceName}`);

      // Load the service module dynamically
      const ServiceClass = await this.lazyLoader.loadService(serviceName);
      
      if (!ServiceClass) {
        throw new Error(`Service class not found: ${serviceName}`);
      }

      // Create service instance
      const serviceInstance = new ServiceClass(this.runtime);
      
      // Initialize the service if it has an init method
      if (typeof serviceInstance.init === 'function') {
        await serviceInstance.init();
      }

      // Cache the instance
      this.serviceInstances.set(serviceName, serviceInstance);
      
      this.performanceMonitor.endServiceTimer(serviceName);
      this.logger.debug(`Service initialized: ${serviceName}`);
      
      return serviceInstance;
    } catch (error) {
      this.performanceMonitor.endServiceTimer(serviceName);
      this.logger.error(`Failed to initialize service: ${serviceName}`, error);
      throw error;
    }
  }

  /**
   * Preload optional services in background
   */
  async preloadOptionalServices(): Promise<void> {
    this.logger.info("Preloading optional services in background...");
    
    const optionalServices = LOADING_PRIORITIES.OPTIONAL;
    
    // Load in background without blocking
    Promise.allSettled(
      optionalServices.map(serviceName => 
        this.getService(serviceName).catch(error => {
          this.logger.warn(`Failed to preload optional service ${serviceName}:`, error);
          return null;
        })
      )
    ).then(results => {
      const successful = results.filter(r => r.status === 'fulfilled').length;
      this.logger.info(`Optional services preloaded: ${successful}/${optionalServices.length}`);
    });
  }

  /**
   * Get all initialized services
   */
  getAllServices(): Service[] {
    return Array.from(this.serviceInstances.values());
  }

  /**
   * Get service initialization status
   */
  getServiceStatus(): {
    initialized: string[];
    initializing: string[];
    total: number;
  } {
    return {
      initialized: Array.from(this.serviceInstances.keys()),
      initializing: Array.from(this.initializationPromises.keys()),
      total: this.serviceInstances.size + this.initializationPromises.size
    };
  }

  /**
   * Clean up unused services
   */
  async cleanup(): Promise<void> {
    this.logger.info("Cleaning up service factory...");
    
    // Stop all services
    const stopPromises = Array.from(this.serviceInstances.values()).map(service => {
      if (typeof service.stop === 'function') {
        return service.stop().catch(error => {
          this.logger.warn(`Failed to stop service:`, error);
        });
      }
      return Promise.resolve();
    });

    await Promise.all(stopPromises);
    
    // Clear caches
    this.serviceInstances.clear();
    this.initializationPromises.clear();
    
    this.logger.info("Service factory cleanup complete");
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalServices: number;
    loadedServices: number;
    loadingServices: number;
    lazyLoaderStats: any;
  } {
    return {
      totalServices: this.serviceInstances.size + this.initializationPromises.size,
      loadedServices: this.serviceInstances.size,
      loadingServices: this.initializationPromises.size,
      lazyLoaderStats: getLazyLoader().getStats()
    };
  }
}

/**
 * Factory function to create an optimized service factory
 */
export const createOptimizedServiceFactory = (runtime: IAgentRuntime): OptimizedServiceFactory => {
  return new OptimizedServiceFactory(runtime);
}; 