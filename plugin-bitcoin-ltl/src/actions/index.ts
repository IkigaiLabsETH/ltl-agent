import { Action } from "@elizaos/core";

// Import actions
import { morningBriefingAction } from "./morningBriefingAction";
import { knowledgeDigestAction } from "./knowledgeDigestAction";
import { opportunityAlertsAction } from "./opportunityAlertsAction";
import { bitcoinNetworkHealthAction } from "./bitcoinNetworkHealthAction";
import { bitcoinPriceAction } from "./bitcoinPriceAction";
import { altcoinPriceAction } from "./altcoinPriceAction";
import { weatherAction } from "./weatherAction";
import { curatedAltcoinsAction } from "./curatedAltcoinsAction";
import { top100VsBtcAction } from "./top100VsBtcAction";
import { btcRelativePerformanceAction } from "./btcRelativePerformanceAction";
import { dexScreenerAction } from "./dexScreenerAction";
import { topMoversAction } from "./topMoversAction";
import { trendingCoinsAction } from "./trendingCoinsAction";
import { stockMarketAction } from "./stockMarketAction";
import { etfFlowAction } from "./etfFlowAction";
import { curatedNFTsAction } from "./curatedNFTsAction";
import { hotelSearchAction } from "./hotelSearchAction";
import { hotelDealAlertAction } from "./hotelDealAlertAction";
import { bookingOptimizationAction } from "./bookingOptimizationAction";
import { travelInsightsAction } from "./travelInsightsAction";
import { hotelRateIntelligenceAction } from "./hotelRateIntelligenceAction";
import { enhancedKnowledgeSearchAction } from "./enhanced-knowledge-search";

// Core Actions - Newly refactored
import { helloWorldAction } from "./helloWorldAction";
import { bitcoinAnalysisAction } from "./bitcoinAnalysisAction";
import { bitcoinThesisStatusAction } from "./bitcoinThesisStatusAction";
import { resetMemoryAction, checkMemoryHealthAction } from "./memoryManagementActions";
import { sovereignLivingAction } from "./sovereignLivingAction";
import { investmentStrategyAction } from "./investmentStrategyAction";
import { validateEnvironmentAction } from "./validateEnvironmentAction";
import { freedomMathematicsAction } from "./freedomMathematicsAction";
import { altcoinBTCPerformanceAction } from "./altcoinBTCPerformanceAction";
import { cryptoPriceLookupAction } from "./cryptoPriceLookupAction";

// Core Actions
export { morningBriefingAction };
export { knowledgeDigestAction };
export { opportunityAlertsAction };
export { bitcoinNetworkHealthAction };
export { bitcoinPriceAction };
export { altcoinPriceAction };
export { weatherAction };
export { enhancedKnowledgeSearchAction };

// Newly refactored core actions
export { helloWorldAction };
export { bitcoinAnalysisAction };
export { bitcoinThesisStatusAction };
export { resetMemoryAction };
export { checkMemoryHealthAction };
export { sovereignLivingAction };
export { investmentStrategyAction };
export { validateEnvironmentAction };
export { freedomMathematicsAction };
export { altcoinBTCPerformanceAction };
export { cryptoPriceLookupAction };

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
export { hotelRateIntelligenceAction };

// Action Registry with Metadata
export interface ActionRegistryEntry {
  action: Action;
  category: string;
  priority: "high" | "medium" | "low";
  description: string;
  tags: string[];
  isCore?: boolean;
  dependencies?: string[];
}

// Organized Action Registry
export const actionRegistry: Record<string, ActionRegistryEntry> = {
  // Core Actions - High Priority
  HELLO_WORLD: {
    action: helloWorldAction,
    category: "core",
    priority: "high",
    description: "Simple greeting action for testing and demonstration purposes",
    tags: ["greeting", "hello", "introduction", "test"],
    isCore: true,
  },

  BITCOIN_MARKET_ANALYSIS: {
    action: bitcoinAnalysisAction,
    category: "core",
    priority: "high",
    description: "Comprehensive Bitcoin market analysis including price, trends, and thesis progress",
    tags: ["bitcoin", "analysis", "market", "thesis", "price"],
    isCore: true,
    dependencies: ["bitcoin-data-service"],
  },

  BITCOIN_THESIS_STATUS: {
    action: bitcoinThesisStatusAction,
    category: "core",
    priority: "high",
    description: "Detailed status update on the 100K BTC Holders wealth creation thesis",
    tags: ["bitcoin", "thesis", "100k", "holders", "wealth"],
    isCore: true,
    dependencies: ["bitcoin-data-service"],
  },

  RESET_AGENT_MEMORY: {
    action: resetMemoryAction,
    category: "system",
    priority: "high",
    description: "Resets the agent's memory following ElizaOS best practices",
    tags: ["memory", "reset", "database", "system"],
    isCore: true,
    dependencies: ["bitcoin-data-service"],
  },

  CHECK_MEMORY_HEALTH: {
    action: checkMemoryHealthAction,
    category: "system",
    priority: "medium",
    description: "Checks the health and status of the agent's memory system",
    tags: ["memory", "health", "database", "system"],
    isCore: true,
    dependencies: ["bitcoin-data-service"],
  },

  SOVEREIGN_LIVING_ADVICE: {
    action: sovereignLivingAction,
    category: "lifestyle",
    priority: "medium",
    description: "Sovereign living advice including biohacking protocols, nutrition, and lifestyle optimization",
    tags: ["sovereign", "biohacking", "health", "lifestyle", "nutrition"],
    isCore: true,
  },

  INVESTMENT_STRATEGY_ADVICE: {
    action: investmentStrategyAction,
    category: "investment",
    priority: "high",
    description: "Bitcoin-focused investment strategy and portfolio optimization guidance",
    tags: ["investment", "strategy", "portfolio", "bitcoin", "msty", "freedom"],
    isCore: true,
    dependencies: ["bitcoin-data-service"],
  },

  MORNING_BRIEFING: {
    action: morningBriefingAction,
    category: "core",
    priority: "high",
    description:
      "Proactive morning intelligence briefing with market data and insights",
    tags: ["briefing", "market", "daily", "intelligence"],
    isCore: true,
    dependencies: ["morning-briefing-service", "weather-service"],
  },

  ENHANCED_KNOWLEDGE_SEARCH: {
    action: enhancedKnowledgeSearchAction,
    category: "core",
    priority: "high",
    description:
      "Enhanced RAG-powered knowledge search with relevance scoring and source attribution",
    tags: ["knowledge", "search", "rag", "semantic", "research"],
    isCore: true,
    dependencies: ["knowledge-service", "knowledge-performance-monitor"],
  },

  BITCOIN_NETWORK_HEALTH: {
    action: bitcoinNetworkHealthAction,
    category: "core",
    priority: "high",
    description: "Comprehensive Bitcoin network health and security metrics",
    tags: ["bitcoin", "network", "hashrate", "security", "health"],
    isCore: true,
    dependencies: ["real-time-data-service"],
  },

  BITCOIN_PRICE: {
    action: bitcoinPriceAction,
    category: "core",
    priority: "high",
    description: "Get current Bitcoin price and market data",
    tags: ["bitcoin", "price", "market", "crypto"],
    isCore: true,
    dependencies: ["bitcoin-data-service"],
  },

  ALTCOIN_PRICE: {
    action: altcoinPriceAction,
    category: "market",
    priority: "high",
    description:
      "Get current prices for specific altcoins or curated portfolio overview",
    tags: ["altcoin", "price", "crypto", "market"],
    dependencies: ["real-time-data-service"],
  },

  KNOWLEDGE_DIGEST: {
    action: knowledgeDigestAction,
    category: "core",
    priority: "high",
    description: "Curated research insights and knowledge synthesis",
    tags: ["research", "insights", "knowledge", "digest"],
    isCore: true,
    dependencies: ["slack-ingestion-service"],
  },

  OPPORTUNITY_ALERTS: {
    action: opportunityAlertsAction,
    category: "core",
    priority: "high",
    description: "Real-time market opportunity identification and alerts",
    tags: ["opportunities", "alerts", "trading", "market"],
    isCore: true,
    dependencies: ["real-time-data-service"],
  },

  WEATHER: {
    action: weatherAction,
    category: "core",
    priority: "medium",
    description: "Weather information and forecasts",
    tags: ["weather", "forecast", "environment"],
    isCore: true,
    dependencies: ["weather-service"],
  },

  // Market Analysis Actions
  CURATED_ALTCOINS: {
    action: curatedAltcoinsAction,
    category: "market",
    priority: "medium",
    description: "Analysis of curated altcoin selections and performance",
    tags: ["altcoins", "analysis", "curation", "performance"],
    dependencies: ["real-time-data-service"],
  },

  TOP_100_VS_BTC: {
    action: top100VsBtcAction,
    category: "market",
    priority: "medium",
    description: "Top 100 cryptocurrencies performance vs Bitcoin",
    tags: ["top100", "bitcoin", "comparison", "relative-performance"],
    dependencies: ["real-time-data-service"],
  },

  BTC_RELATIVE_PERFORMANCE: {
    action: btcRelativePerformanceAction,
    category: "market",
    priority: "medium",
    description: "Bitcoin relative performance analysis across timeframes",
    tags: ["bitcoin", "performance", "relative", "analysis"],
    dependencies: ["real-time-data-service"],
  },

  DEX_SCREENER: {
    action: dexScreenerAction,
    category: "market",
    priority: "medium",
    description: "DEX token screening and discovery",
    tags: ["dex", "tokens", "screening", "discovery"],
    dependencies: ["dex-service"],
  },

  TOP_MOVERS: {
    action: topMoversAction,
    category: "market",
    priority: "medium",
    description: "Top performing and declining assets identification",
    tags: ["movers", "performance", "trending", "market"],
    dependencies: ["real-time-data-service"],
  },

  TRENDING_COINS: {
    action: trendingCoinsAction,
    category: "market",
    priority: "medium",
    description: "Trending cryptocurrency analysis and insights",
    tags: ["trending", "crypto", "analysis", "market"],
    dependencies: ["real-time-data-service"],
  },

  STOCK_MARKET: {
    action: stockMarketAction,
    category: "market",
    priority: "medium",
    description: "Stock market data and analysis",
    tags: ["stocks", "market", "analysis", "equities"],
    dependencies: ["stock-data-service"],
  },

  ETF_FLOW: {
    action: etfFlowAction,
    category: "market",
    priority: "medium",
    description: "ETF flow analysis and institutional movement tracking",
    tags: ["etf", "flow", "institutional", "analysis"],
    dependencies: ["etf-data-service"],
  },

  // NFT Actions
  CURATED_NFTS: {
    action: curatedNFTsAction,
    category: "nft",
    priority: "medium",
    description: "Curated NFT collections and market analysis",
    tags: ["nft", "collections", "curation", "market"],
    dependencies: ["nft-data-service"],
  },

  // Travel & Booking Actions
  HOTEL_SEARCH: {
    action: hotelSearchAction,
    category: "travel",
    priority: "medium",
    description: "Hotel search and booking assistance",
    tags: ["hotel", "search", "booking", "travel"],
    dependencies: ["travel-data-service"],
  },

  HOTEL_DEAL_ALERT: {
    action: hotelDealAlertAction,
    category: "travel",
    priority: "medium",
    description: "Hotel deal alerts and price monitoring",
    tags: ["hotel", "deals", "alerts", "travel"],
    dependencies: ["travel-data-service"],
  },

  BOOKING_OPTIMIZATION: {
    action: bookingOptimizationAction,
    category: "travel",
    priority: "medium",
    description: "Travel booking optimization and recommendations",
    tags: ["booking", "optimization", "travel", "recommendations"],
    dependencies: ["travel-data-service"],
  },

  TRAVEL_INSIGHTS: {
    action: travelInsightsAction,
    category: "travel",
    priority: "medium",
    description: "Travel insights and destination analysis",
    tags: ["travel", "insights", "destinations", "analysis"],
    dependencies: ["travel-data-service"],
  },

  HOTEL_RATE_INTELLIGENCE: {
    action: hotelRateIntelligenceAction,
    category: "travel",
    priority: "high",
    description: "Hotel rate intelligence and perfect day opportunity detection",
    tags: ["hotel", "rates", "intelligence", "perfect-days", "opportunities", "luxury"],
    dependencies: ["travel-data-service"],
  },
};

// Utility functions for action management
export const getActionsByCategory = (
  category: string,
): ActionRegistryEntry[] => {
  return Object.values(actionRegistry).filter(
    (entry) => entry.category === category,
  );
};

export const getActionsByPriority = (
  priority: "high" | "medium" | "low",
): ActionRegistryEntry[] => {
  return Object.values(actionRegistry).filter(
    (entry) => entry.priority === priority,
  );
};

export const getCoreActions = (): ActionRegistryEntry[] => {
  return Object.values(actionRegistry).filter((entry) => entry.isCore);
};

export const getActionsByTag = (tag: string): ActionRegistryEntry[] => {
  return Object.values(actionRegistry).filter((entry) =>
    entry.tags.includes(tag),
  );
};

export const getAllActions = (): Action[] => {
  return Object.values(actionRegistry).map((entry) => entry.action);
};

export const getActionMetadata = (
  actionName: string,
): ActionRegistryEntry | undefined => {
  return actionRegistry[actionName];
};

// Export action categories for easy access
export const ACTION_CATEGORIES = {
  CORE: "core",
  MARKET: "market",
  NFT: "nft",
  TRAVEL: "travel",
} as const;

export const ACTION_PRIORITIES = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

// Default export - all actions for easy import
export default getAllActions();
