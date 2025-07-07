import type { Plugin } from "@elizaos/core";
import { logger } from "@elizaos/core";

// Import modular components
import { getAllActions } from "./plugin-actions";
import { getAllProviders } from "./plugin-providers";
import { getAllServices } from "./plugin-services";
import { getAllRoutes } from "./plugin-routes";
import { getPluginConfig } from "./plugin-config";

// Import test suite
import bitcoinTestSuite from "../tests";

/**
 * Core Bitcoin LTL Plugin Definition
 * 
 * This is the main plugin definition that combines all modular components.
 * Follows the service composition pattern established in Phase 1.
 */
export const bitcoinPlugin: Plugin = {
  name: "bitcoin-ltl",
  description: "Comprehensive Bitcoin-native AI agent for LiveTheLifeTV with market intelligence, thesis tracking, and sovereign living insights",
  
  // Modular component registration
  providers: getAllProviders(),
  actions: getAllActions(),
  services: getAllServices(),
  routes: getAllRoutes(),
  
  // Plugin configuration and lifecycle
  config: getPluginConfig(),
  tests: [bitcoinTestSuite],
  
  // Plugin initialization
  init: async (config: Record<string, string>, runtime: any) => {
    try {
      logger.info("🚀 Initializing Bitcoin LTL Plugin...");
      
      // Initialize configuration
      await initializePluginConfig(config, runtime);
      
      // Validate environment
      await validatePluginEnvironment(runtime);
      
      // Initialize services in dependency order
      await initializeServicesInOrder(runtime);
      
      logger.info("✅ Bitcoin LTL Plugin initialized successfully");
      
    } catch (error) {
      logger.error("❌ Failed to initialize Bitcoin LTL Plugin:", error);
      throw error;
    }
  },
};

/**
 * Initialize plugin configuration
 */
async function initializePluginConfig(config: Record<string, string>, runtime: any): Promise<void> {
  logger.debug("Initializing plugin configuration...");
  // Configuration initialization logic will be moved here
}

/**
 * Validate plugin environment and dependencies
 */
async function validatePluginEnvironment(runtime: any): Promise<void> {
  logger.debug("Validating plugin environment...");
  // Environment validation logic will be moved here
}

/**
 * Initialize services in proper dependency order
 */
async function initializeServicesInOrder(runtime: any): Promise<void> {
  logger.debug("Initializing services in dependency order...");
  // Service initialization logic will be moved here
}

export default bitcoinPlugin; 