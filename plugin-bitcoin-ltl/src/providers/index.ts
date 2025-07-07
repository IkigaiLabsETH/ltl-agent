/**
 * ElizaOS Providers Export
 * Following ElizaOS documentation patterns
 */

// Import providers first
import { timeProvider } from "./timeProvider";
import { bitcoinMarketProvider } from "./bitcoinMarketProvider";
import { economicIndicatorsProvider } from "./economicIndicatorsProvider";
import { realTimeDataProvider } from "./realTimeDataProvider";
import { newsProvider } from "./newsProvider";
import { marketContextProvider } from "./marketContextProvider";
import { travelProvider } from "./travelProvider";
import { altcoinProvider } from "./altcoinProvider";
import { stockProvider } from "./stockProvider";
import { nftProvider } from "./nftProvider";
import { lifestyleProvider } from "./lifestyleProvider";
import { networkHealthProvider } from "./networkHealthProvider";
import { opportunityProvider } from "./opportunityProvider";
import { briefingProvider } from "./briefingProvider";
import { knowledgeContextProvider } from "./knowledge-context-provider";
import { travelKnowledgeProvider } from "./travelKnowledgeProvider";
import { alertProvider } from "./alertProvider";

// New Bitcoin Intelligence Providers
import { bitcoinNetworkProvider } from "./bitcoinNetworkProvider";
import { marketContextProvider as newMarketContextProvider } from "./marketContextProvider";
import { satoshiPhilosophyProvider } from "./satoshiPhilosophyProvider";
import { bitcoinKnowledgeProvider } from "./bitcoinKnowledgeProvider";
import { feedbackProvider } from "./feedbackProvider";
import { btcPerformanceProvider } from "./btcPerformanceProvider";

// Enhanced Bitcoin Intelligence Providers
import { bitcoinIntelligenceProvider } from "./bitcoinIntelligenceProvider";
import { bitcoinMarketIntelligenceProvider } from "./bitcoinMarketIntelligenceProvider";
import { bitcoinNetworkHealthProvider } from "./bitcoinNetworkHealthProvider";
import { bitcoinSelectiveAssetsProvider } from "./bitcoinSelectiveAssetsProvider";

// Re-export individual providers
export { timeProvider } from "./timeProvider";
export { bitcoinMarketProvider } from "./bitcoinMarketProvider";
export { economicIndicatorsProvider } from "./economicIndicatorsProvider";
export { realTimeDataProvider } from "./realTimeDataProvider";
export { newsProvider } from "./newsProvider";
export { marketContextProvider } from "./marketContextProvider";
export { travelProvider } from "./travelProvider";
export { altcoinProvider } from "./altcoinProvider";
export { stockProvider } from "./stockProvider";
export { nftProvider } from "./nftProvider";
export { lifestyleProvider } from "./lifestyleProvider";
export { networkHealthProvider } from "./networkHealthProvider";
export { opportunityProvider } from "./opportunityProvider";
export { briefingProvider } from "./briefingProvider";
export { knowledgeContextProvider } from "./knowledge-context-provider";
export { travelKnowledgeProvider } from "./travelKnowledgeProvider";
export { alertProvider } from "./alertProvider";

// Export new Bitcoin Intelligence Providers
export { bitcoinNetworkProvider } from "./bitcoinNetworkProvider";
export { marketContextProvider as newMarketContextProvider } from "./marketContextProvider";
export { satoshiPhilosophyProvider } from "./satoshiPhilosophyProvider";
export { bitcoinKnowledgeProvider } from "./bitcoinKnowledgeProvider";
export { feedbackProvider } from "./feedbackProvider";
export { btcPerformanceProvider } from "./btcPerformanceProvider";

// Export enhanced Bitcoin Intelligence Providers
export { bitcoinIntelligenceProvider } from "./bitcoinIntelligenceProvider";
export { bitcoinMarketIntelligenceProvider } from "./bitcoinMarketIntelligenceProvider";
export { bitcoinNetworkHealthProvider } from "./bitcoinNetworkHealthProvider";
export { bitcoinSelectiveAssetsProvider } from "./bitcoinSelectiveAssetsProvider";

// Provider collection for easy import
export const allProviders = [
  // Enhanced Bitcoin Intelligence Providers (Highest Priority)
  bitcoinIntelligenceProvider,
  bitcoinMarketIntelligenceProvider,
  bitcoinNetworkHealthProvider,
  bitcoinSelectiveAssetsProvider,
  
  // Core Bitcoin Intelligence Providers (High Priority)
  satoshiPhilosophyProvider,
  bitcoinNetworkProvider,
  newMarketContextProvider,
  bitcoinKnowledgeProvider,
  btcPerformanceProvider,
  alertProvider,
  
  // Existing Providers
  timeProvider,
  networkHealthProvider,
  bitcoinMarketProvider,
  stockProvider,
  economicIndicatorsProvider,
  realTimeDataProvider,
  altcoinProvider,
  nftProvider,
  newsProvider,
  travelProvider,
  lifestyleProvider,
  opportunityProvider,
  briefingProvider,
  marketContextProvider,
  knowledgeContextProvider,
  travelKnowledgeProvider,
  feedbackProvider,
];

// Provider groups for different use cases
export const fundamentalProviders = [
  timeProvider,
  networkHealthProvider,
  bitcoinMarketProvider,
  stockProvider,
  economicIndicatorsProvider,
];

export const dynamicProviders = [
  realTimeDataProvider,
  altcoinProvider,
  nftProvider,
  newsProvider,
  travelProvider,
  lifestyleProvider,
];

export const privateProviders = [
  opportunityProvider,
  briefingProvider,
  marketContextProvider,
  knowledgeContextProvider,
];

/**
 * Provider usage examples based on ElizaOS documentation:
 *
 * // Get state with all non-private, non-dynamic providers
 * const state = await runtime.composeState(message);
 *
 * // Get state with specific providers only
 * const basicState = await runtime.composeState(
 *   message,
 *   ['time', 'bitcoinMarket'], // Only include these providers
 *   null
 * );
 *
 * // Include private or dynamic providers
 * const enhancedState = await runtime.composeState(
 *   message,
 *   null,
 *   ['marketContext', 'realTimeData'] // Include these private/dynamic providers
 * );
 */
