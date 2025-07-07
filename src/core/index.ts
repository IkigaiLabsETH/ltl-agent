/**
 * Core Plugin Modules
 * 
 * This module exports all the core plugin components in a modular structure.
 * Each component can be imported and used independently.
 */

export { bitcoinPlugin as default } from "./plugin-core";
export { getAllActions, getActionsByCategory, getEssentialActions, getActionsByType } from "./plugin-actions";
export { getAllProviders } from "./plugin-providers";
export { getAllServices } from "./plugin-services";
export { getAllRoutes } from "./plugin-routes";
export { getPluginConfig } from "./plugin-config"; 