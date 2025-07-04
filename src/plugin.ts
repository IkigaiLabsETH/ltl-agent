/**
 * Root plugin.ts - Re-exports from plugin for compatibility
 * This plugin contains multiple actions for Bitcoin data and analysis
 */

// Re-export the plugin which includes actions, providers, and services
import plugin from '../plugin-bitcoin-ltl/src/plugin';
export default plugin;

// This plugin contains comprehensive actions for Bitcoin analysis
const actions = [
  'HELLO_WORLD',
  'BITCOIN_MARKET_ANALYSIS', 
  'BITCOIN_THESIS_STATUS',
  'MORNING_BRIEFING',
  // ... and many more actions defined in the main plugin
]; 