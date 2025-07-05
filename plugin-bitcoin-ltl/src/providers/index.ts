/**
 * ElizaOS Providers Export
 * Following ElizaOS documentation patterns
 */

// Import providers first
import { timeProvider } from './timeProvider';
import { bitcoinMarketProvider } from './bitcoinMarketProvider';
import { economicIndicatorsProvider } from './economicIndicatorsProvider';
import { realTimeDataProvider } from './realTimeDataProvider';
import { newsProvider } from './newsProvider';
import { marketContextProvider } from './marketContextProvider';
import { travelProvider } from './travelProvider';
import { altcoinProvider } from './altcoinProvider';
import { stockProvider } from './stockProvider';
import { nftProvider } from './nftProvider';
import { lifestyleProvider } from './lifestyleProvider';
import { networkHealthProvider } from './networkHealthProvider';
import { opportunityProvider } from './opportunityProvider';
import { briefingProvider } from './briefingProvider';
import { knowledgeContextProvider } from './knowledge-context-provider';

// Re-export individual providers
export { timeProvider } from './timeProvider';
export { bitcoinMarketProvider } from './bitcoinMarketProvider';
export { economicIndicatorsProvider } from './economicIndicatorsProvider';
export { realTimeDataProvider } from './realTimeDataProvider';
export { newsProvider } from './newsProvider';
export { marketContextProvider } from './marketContextProvider';
export { travelProvider } from './travelProvider';
export { altcoinProvider } from './altcoinProvider';
export { stockProvider } from './stockProvider';
export { nftProvider } from './nftProvider';
export { lifestyleProvider } from './lifestyleProvider';
export { networkHealthProvider } from './networkHealthProvider';
export { opportunityProvider } from './opportunityProvider';
export { briefingProvider } from './briefingProvider';
export { knowledgeContextProvider } from './knowledge-context-provider';

// Provider collection for easy import
export const allProviders = [
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