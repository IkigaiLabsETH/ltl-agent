import type { Action } from "@elizaos/core";

/**
 * Plugin Actions Module
 * 
 * This module organizes all actions by category and provides functions
 * to retrieve them for plugin registration.
 * 
 * This establishes the modular structure for Phase 2 refactoring.
 * Actions will be imported and organized here once the module structure is complete.
 */

/**
 * Get all actions for plugin registration
 * 
 * @returns Array of all actions available in the plugin
 */
export function getAllActions(): Action[] {
  // TODO: Import and return actual actions once module structure is established
  // This will include: bitcoin actions, market actions, lifestyle actions, core actions, philosophy actions
  return [];
}

/**
 * Get actions organized by category for selective loading
 * 
 * @returns Object with actions grouped by functionality
 */
export function getActionsByCategory() {
  return {
    bitcoin: [] as Action[],      // Bitcoin price, analysis, thesis, network health, etc.
    market: [] as Action[],       // Market data, altcoins, stocks, ETFs, etc.
    lifestyle: [] as Action[],    // Travel, health, culinary, weather, etc.
    core: [] as Action[],         // System actions like hello world, memory management
    philosophy: [] as Action[],   // Sovereign living, investment strategy, freedom math
  };
}

/**
 * Get essential actions for minimal plugin loading
 * 
 * @returns Array of core actions needed for basic functionality
 */
export function getEssentialActions(): Action[] {
  // TODO: Return essential actions once imports are resolved
  // Will include: helloWorldAction, bitcoinPriceAction, bitcoinAnalysisAction, morningBriefingAction
  return [];
}

/**
 * Get actions by specific functionality area
 * 
 * @param category - The category of actions to retrieve
 * @returns Array of actions for the specified category
 */
export function getActionsByType(category: 'bitcoin' | 'market' | 'lifestyle' | 'core' | 'philosophy'): Action[] {
  const categories = getActionsByCategory();
  return categories[category] || [];
} 