/**
 * Root plugin.ts - Re-exports from main plugin for compatibility
 * 
 * This file re-exports the comprehensive Bitcoin plugin from plugin-bitcoin-ltl/src/plugin.ts
 * which contains:
 * 
 * Actions (20+):
 * - HELLO_WORLD, BITCOIN_MARKET_ANALYSIS, BITCOIN_THESIS_STATUS
 * - MORNING_BRIEFING, KNOWLEDGE_DIGEST, OPPORTUNITY_ALERTS
 * - FREEDOM_MATHEMATICS, SOVEREIGN_LIVING_ADVICE, INVESTMENT_STRATEGY_ADVICE
 * - And many more Bitcoin-focused actions
 * 
 * Services (15+):
 * - BitcoinDataService, RealTimeDataService, MorningBriefingService
 * - KnowledgeDigestService, OpportunityAlertService, PerformanceTrackingService
 * - And many more specialized services
 * 
 * API Routes (14):
 * - /bitcoin/price, /bitcoin/thesis, /bitcoin/freedom-math
 * - /bitcoin/comprehensive, /bitcoin/network, /bitcoin/mempool
 * - /dexscreener/trending, /dexscreener/top, and more
 * 
 * All functionality is implemented in plugin-bitcoin-ltl/src/
 */

// Re-export the comprehensive Bitcoin plugin
import plugin from '../plugin-bitcoin-ltl/src/plugin';
export default plugin;
