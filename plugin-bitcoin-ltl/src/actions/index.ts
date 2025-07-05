import { Action } from '@elizaos/core';

// Import actions
import { morningBriefingAction } from './morningBriefingAction';
import { knowledgeDigestAction } from './knowledgeDigestAction';
import { opportunityAlertsAction } from './opportunityAlertsAction';
import { bitcoinNetworkHealthAction } from './bitcoinNetworkHealthAction';
import { weatherAction } from './weatherAction';
import { curatedAltcoinsAction } from './curatedAltcoinsAction';
import { top100VsBtcAction } from './top100VsBtcAction';
import { btcRelativePerformanceAction } from './btcRelativePerformanceAction';
import { dexScreenerAction } from './dexScreenerAction';
import { topMoversAction } from './topMoversAction';
import { trendingCoinsAction } from './trendingCoinsAction';
import { stockMarketAction } from './stockMarketAction';
import { etfFlowAction } from './etfFlowAction';
import { curatedNFTsAction } from './curatedNFTsAction';
import { hotelSearchAction } from './hotelSearchAction';
import { hotelDealAlertAction } from './hotelDealAlertAction';
import { bookingOptimizationAction } from './bookingOptimizationAction';
import { travelInsightsAction } from './travelInsightsAction';

// Core Actions
export { morningBriefingAction };
export { knowledgeDigestAction };
export { opportunityAlertsAction };
export { bitcoinNetworkHealthAction };
export { weatherAction };

// Market Analysis Actions
export { curatedAltcoinsAction };
export { top100VsBtcAction };
export { btcRelativePerformanceAction };
export { dexScreenerAction };
export { topMoversAction };
export { trendingCoinsAction };
export { stockMarketAction };
export { etfFlowAction };

// NFT Actions
export { curatedNFTsAction };

// Travel & Booking Actions
export { hotelSearchAction };
export { hotelDealAlertAction };
export { bookingOptimizationAction };
export { travelInsightsAction };

// Action Registry with Metadata
export interface ActionRegistryEntry {
  action: Action;
  category: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  tags: string[];
  isCore?: boolean;
  dependencies?: string[];
}

// Organized Action Registry
export const actionRegistry: Record<string, ActionRegistryEntry> = {
  // Core Actions - High Priority
  MORNING_BRIEFING: {
    action: morningBriefingAction,
    category: 'core',
    priority: 'high',
    description: 'Proactive morning intelligence briefing with market data and insights',
    tags: ['briefing', 'market', 'daily', 'intelligence'],
    isCore: true,
    dependencies: ['morning-briefing-service', 'weather-service']
  },
  
  BITCOIN_NETWORK_HEALTH: {
    action: bitcoinNetworkHealthAction,
    category: 'core',
    priority: 'high',
    description: 'Comprehensive Bitcoin network health and security metrics',
    tags: ['bitcoin', 'network', 'hashrate', 'security', 'health'],
    isCore: true,
    dependencies: ['real-time-data-service']
  },
  
  KNOWLEDGE_DIGEST: {
    action: knowledgeDigestAction,
    category: 'core',
    priority: 'high',
    description: 'Curated research insights and knowledge synthesis',
    tags: ['research', 'insights', 'knowledge', 'digest'],
    isCore: true,
    dependencies: ['slack-ingestion-service']
  },
  
  OPPORTUNITY_ALERTS: {
    action: opportunityAlertsAction,
    category: 'core',
    priority: 'high',
    description: 'Real-time market opportunity identification and alerts',
    tags: ['opportunities', 'alerts', 'trading', 'market'],
    isCore: true,
    dependencies: ['real-time-data-service']
  },
  
  WEATHER: {
    action: weatherAction,
    category: 'core',
    priority: 'medium',
    description: 'Weather information and forecasts',
    tags: ['weather', 'forecast', 'environment'],
    isCore: true,
    dependencies: ['weather-service']
  },
  
  // Market Analysis Actions
  CURATED_ALTCOINS: {
    action: curatedAltcoinsAction,
    category: 'market',
    priority: 'medium',
    description: 'Analysis of curated altcoin selections and performance',
    tags: ['altcoins', 'analysis', 'curation', 'performance'],
    dependencies: ['real-time-data-service']
  },
  
  TOP_100_VS_BTC: {
    action: top100VsBtcAction,
    category: 'market',
    priority: 'medium',
    description: 'Top 100 cryptocurrencies performance vs Bitcoin',
    tags: ['top100', 'bitcoin', 'comparison', 'relative-performance'],
    dependencies: ['real-time-data-service']
  },
  
  BTC_RELATIVE_PERFORMANCE: {
    action: btcRelativePerformanceAction,
    category: 'market',
    priority: 'medium',
    description: 'Bitcoin relative performance analysis across timeframes',
    tags: ['bitcoin', 'performance', 'relative', 'analysis'],
    dependencies: ['real-time-data-service']
  },
  
  DEX_SCREENER: {
    action: dexScreenerAction,
    category: 'market',
    priority: 'medium',
    description: 'DEX token screening and discovery',
    tags: ['dex', 'tokens', 'screening', 'discovery'],
    dependencies: ['dex-service']
  },
  
  TOP_MOVERS: {
    action: topMoversAction,
    category: 'market',
    priority: 'medium',
    description: 'Top performing and declining assets identification',
    tags: ['movers', 'performance', 'trending', 'market'],
    dependencies: ['real-time-data-service']
  },
  
  TRENDING_COINS: {
    action: trendingCoinsAction,
    category: 'market',
    priority: 'medium',
    description: 'Trending cryptocurrency identification and analysis',
    tags: ['trending', 'coins', 'momentum', 'analysis'],
    dependencies: ['real-time-data-service']
  },
  
  STOCK_MARKET: {
    action: stockMarketAction,
    category: 'market',
    priority: 'medium',
    description: 'Stock market analysis and watchlist monitoring',
    tags: ['stocks', 'market', 'watchlist', 'analysis'],
    dependencies: ['stock-data-service']
  },
  
  ETF_FLOW: {
    action: etfFlowAction,
    category: 'market',
    priority: 'medium',
    description: 'ETF flow tracking and analysis',
    tags: ['etf', 'flows', 'institutional', 'analysis'],
    dependencies: ['etf-service']
  },
  
  // NFT Actions
  CURATED_NFTS: {
    action: curatedNFTsAction,
    category: 'nft',
    priority: 'low',
    description: 'Curated NFT collections and market analysis',
    tags: ['nft', 'collections', 'curation', 'analysis'],
    dependencies: ['nft-service']
  },
  
  // Travel Actions
  HOTEL_SEARCH: {
    action: hotelSearchAction,
    category: 'travel',
    priority: 'low',
    description: 'Hotel search and booking assistance',
    tags: ['hotel', 'search', 'booking', 'travel'],
    dependencies: ['hotel-service']
  },
  
  HOTEL_DEAL_ALERT: {
    action: hotelDealAlertAction,
    category: 'travel',
    priority: 'low',
    description: 'Hotel deal monitoring and alerts',
    tags: ['hotel', 'deals', 'alerts', 'savings'],
    dependencies: ['hotel-service']
  },
  
  BOOKING_OPTIMIZATION: {
    action: bookingOptimizationAction,
    category: 'travel',
    priority: 'low',
    description: 'Travel booking optimization and recommendations',
    tags: ['booking', 'optimization', 'travel', 'recommendations'],
    dependencies: ['travel-service']
  },
  
  TRAVEL_INSIGHTS: {
    action: travelInsightsAction,
    category: 'travel',
    priority: 'low',
    description: 'Travel insights and destination analysis',
    tags: ['travel', 'insights', 'destinations', 'analysis'],
    dependencies: ['travel-service']
  },
};

// Utility Functions for Action Management
export const getActionsByCategory = (category: string): ActionRegistryEntry[] => {
  return Object.values(actionRegistry).filter(entry => entry.category === category);
};

export const getActionsByPriority = (priority: 'high' | 'medium' | 'low'): ActionRegistryEntry[] => {
  return Object.values(actionRegistry).filter(entry => entry.priority === priority);
};

export const getCoreActions = (): ActionRegistryEntry[] => {
  return Object.values(actionRegistry).filter(entry => entry.isCore === true);
};

export const getActionsByTag = (tag: string): ActionRegistryEntry[] => {
  return Object.values(actionRegistry).filter(entry => entry.tags.includes(tag));
};

export const getAllActions = (): Action[] => {
  return Object.values(actionRegistry).map(entry => entry.action);
};

export const getActionMetadata = (actionName: string): ActionRegistryEntry | undefined => {
  return actionRegistry[actionName];
};

// Export action categories for easy access
export const ACTION_CATEGORIES = {
  CORE: 'core',
  MARKET: 'market',
  NFT: 'nft',
  TRAVEL: 'travel',
} as const;

export const ACTION_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

// Default export - all actions for easy import
export default getAllActions(); 