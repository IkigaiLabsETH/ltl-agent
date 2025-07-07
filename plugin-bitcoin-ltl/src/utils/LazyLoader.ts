import { elizaLogger } from "@elizaos/core";
import { getPerformanceMonitor } from "./PerformanceMonitor";

/**
 * Lazy Loading Utility
 * 
 * Provides dynamic loading capabilities for services and components
 * to reduce initial bundle size and improve cold start performance.
 */
export class LazyLoader {
  private static instance: LazyLoader;
  private loadedModules: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private logger = elizaLogger.child({ module: "LazyLoader" });

  private constructor() {}

  static getInstance(): LazyLoader {
    if (!LazyLoader.instance) {
      LazyLoader.instance = new LazyLoader();
    }
    return LazyLoader.instance;
  }

  /**
   * Load a module dynamically with caching
   */
  async loadModule<T>(modulePath: string, moduleName?: string): Promise<T> {
    const key = moduleName || modulePath;
    
    // Return cached module if already loaded
    if (this.loadedModules.has(key)) {
      this.logger.debug(`Returning cached module: ${key}`);
      return this.loadedModules.get(key);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(key)) {
      this.logger.debug(`Waiting for existing load: ${key}`);
      return this.loadingPromises.get(key);
    }

    // Start loading the module
    const loadPromise = this.loadModuleInternal<T>(modulePath, key);
    this.loadingPromises.set(key, loadPromise);

    try {
      const module = await loadPromise;
      this.loadedModules.set(key, module);
      this.loadingPromises.delete(key);
      return module;
    } catch (error) {
      this.loadingPromises.delete(key);
      throw error;
    }
  }

  /**
   * Internal method to load a module
   */
  private async loadModuleInternal<T>(modulePath: string, key: string): Promise<T> {
    const monitor = getPerformanceMonitor();
    monitor.startServiceTimer(`lazy-load-${key}`);

    try {
      this.logger.info(`Loading module: ${modulePath}`);
      
      // Dynamic import with error handling
      const module = await import(modulePath);
      
      monitor.endServiceTimer(`lazy-load-${key}`);
      this.logger.info(`Successfully loaded module: ${modulePath}`);
      
      return module.default || module;
    } catch (error) {
      monitor.endServiceTimer(`lazy-load-${key}`);
      this.logger.error(`Failed to load module: ${modulePath}`, error);
      throw new Error(`Failed to load module ${modulePath}: ${error}`);
    }
  }

  /**
   * Preload multiple modules in parallel
   */
  async preloadModules(modules: Array<{ path: string; name?: string }>): Promise<void> {
    this.logger.info(`Preloading ${modules.length} modules`);
    
    const loadPromises = modules.map(({ path, name }) => 
      this.loadModule(path, name).catch(error => {
        this.logger.warn(`Failed to preload module ${path}:`, error);
        return null;
      })
    );

    await Promise.all(loadPromises);
    this.logger.info(`Preloading complete`);
  }

  /**
   * Check if a module is loaded
   */
  isLoaded(moduleName: string): boolean {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Get list of loaded modules
   */
  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  /**
   * Clear cache for a specific module
   */
  clearModule(moduleName: string): void {
    this.loadedModules.delete(moduleName);
    this.logger.debug(`Cleared module cache: ${moduleName}`);
  }

  /**
   * Clear all cached modules
   */
  clearAll(): void {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    this.logger.info("Cleared all module caches");
  }

  /**
   * Get loading statistics
   */
  getStats(): {
    loadedModules: number;
    loadingModules: number;
    cacheSize: number;
  } {
    return {
      loadedModules: this.loadedModules.size,
      loadingModules: this.loadingPromises.size,
      cacheSize: this.loadedModules.size
    };
  }
}

/**
 * Service-specific lazy loading helpers
 */
export class ServiceLazyLoader {
  private lazyLoader = LazyLoader.getInstance();

  /**
   * Load a service dynamically
   */
  async loadService(serviceName: string): Promise<any> {
    const servicePath = `../services/${serviceName}`;
    return this.lazyLoader.loadModule(servicePath, serviceName);
  }

  /**
   * Load a component dynamically
   */
  async loadComponent(componentName: string): Promise<any> {
    const componentPath = `../services/components/${componentName}`;
    return this.lazyLoader.loadModule(componentPath, componentName);
  }

  /**
   * Load an action dynamically
   */
  async loadAction(actionName: string): Promise<any> {
    const actionPath = `../actions/${actionName}`;
    return this.lazyLoader.loadModule(actionPath, actionName);
  }

  /**
   * Load a provider dynamically
   */
  async loadProvider(providerName: string): Promise<any> {
    const providerPath = `../providers/${providerName}`;
    return this.lazyLoader.loadModule(providerPath, providerName);
  }
}

/**
 * Convenience functions
 */
export const getLazyLoader = (): LazyLoader => LazyLoader.getInstance();
export const getServiceLazyLoader = (): ServiceLazyLoader => new ServiceLazyLoader();

/**
 * Priority-based loading configuration
 */
export const LOADING_PRIORITIES = {
  CRITICAL: ['ConfigurationManager', 'BaseDataService', 'MarketDataService'],
  ESSENTIAL: ['RealTimeDataComponent', 'StockDataComponent', 'ETFDataComponent'],
  OPTIONAL: ['WeatherService', 'HotelService', 'CulinaryService', 'PhilosophyService']
} as const; 