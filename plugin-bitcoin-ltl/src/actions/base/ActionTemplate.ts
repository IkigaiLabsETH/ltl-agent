import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
} from "@elizaos/core";

export interface ActionConfig {
  name: string;
  description: string;
  similes?: string[];
  validateFn: (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
  ) => Promise<boolean>;
  handlerFn: (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback,
  ) => Promise<unknown>;
  examples?: Array<Array<{ name: string; content: Content }>>;
}

export const createActionTemplate = (config: ActionConfig): Action => ({
  name: config.name,
  description: config.description,
  similes: config.similes || [],
  examples: config.examples || [],

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
  ): Promise<boolean> => {
    try {
      return await config.validateFn(runtime, message, state);
    } catch (error) {
      console.error(`Validation error in ${config.name}:`, error);
      return false;
    }
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback,
  ): Promise<unknown> => {
    try {
      return await config.handlerFn(runtime, message, state, options, callback);
    } catch (error) {
      console.error(`Handler error in ${config.name}:`, error);

      const errorResponse: Content = {
        thought: `An error occurred while executing ${config.name}: ${(error as Error).message}`,
        text: "I encountered an issue processing your request. Please try again later.",
        actions: [config.name],
      };

      if (callback) {
        await callback(errorResponse);
      }

      return { success: false, error: (error as Error).message };
    }
  },
});

// Common validation patterns for reuse across actions
export const ValidationPatterns = {
  isMarketRequest: (text: string): boolean => {
    const keywords = [
      "market",
      "price",
      "chart",
      "trading",
      "analysis",
      "performance",
    ];
    return keywords.some((keyword) => text.toLowerCase().includes(keyword));
  },

  isCryptoRequest: (text: string): boolean => {
    const keywords = [
      "bitcoin",
      "btc",
      "crypto",
      "altcoin",
      "token",
      "eth",
      "sol",
    ];
    return keywords.some((keyword) => text.toLowerCase().includes(keyword));
  },

  isTravelRequest: (text: string): boolean => {
    const keywords = [
      "hotel",
      "travel",
      "booking",
      "flight",
      "accommodation",
      "trip",
    ];
    return keywords.some((keyword) => text.toLowerCase().includes(keyword));
  },

  isWeatherRequest: (text: string): boolean => {
    const keywords = [
      "weather",
      "temperature",
      "forecast",
      "climate",
      "rain",
      "sunny",
    ];
    return keywords.some((keyword) => text.toLowerCase().includes(keyword));
  },

  isMorningRequest: (text: string): boolean => {
    const patterns = [
      /^gm\b/i,
      /^good morning\b/i,
      /morning.*briefing/i,
      /^brief.*me\b/i,
      /what.*latest/i,
      /morning.*intel/i,
      /daily.*update/i,
      /^status.*report/i,
    ];
    return patterns.some((pattern) => pattern.test(text));
  },

  isNetworkHealthRequest: (text: string): boolean => {
    const keywords = [
      "bitcoin health",
      "bitcoin network",
      "btc health",
      "btc network",
      "bitcoin status",
      "bitcoin stats",
      "bitcoin metrics",
      "bitcoin overview",
      "bitcoin dashboard",
      "network health",
      "bitcoin security",
      "bitcoin mining",
      "bitcoin hashrate",
      "bitcoin difficulty",
      "bitcoin mempool",
      "bitcoin block",
      "bitcoin fees",
      "bitcoin miner",
      "bitcoin node",
      "how is bitcoin",
      "bitcoin network stats",
      "bitcoin performance",
      "bitcoin fundamentals",
      "bitcoin on chain",
      "bitcoin analysis",
      "hashrate",
      "difficulty",
      "mempool",
      "network status",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isKnowledgeDigestRequest: (text: string): boolean => {
    const keywords = [
      "digest",
      "knowledge digest",
      "daily digest",
      "research summary",
      "knowledge summary",
      "generate digest",
      "create digest",
      "research digest",
      "summarize research",
      "show insights",
      "what have we learned",
      "intelligence summary",
      "insights digest",
      "recent learnings",
      "knowledge synthesis",
      "research intelligence",
      "intelligence digest",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isOpportunityAlertsRequest: (text: string): boolean => {
    const keywords = [
      "alerts",
      "opportunities",
      "opportunity alerts",
      "check alerts",
      "show alerts",
      "any alerts",
      "investment alerts",
      "market alerts",
      "what opportunities",
      "any opportunities",
      "signals",
      "market signals",
      "investment signals",
      "what should i watch",
      "watchlist",
      "immediate opportunities",
      "active alerts",
      "current opportunities",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isAltcoinRequest: (text: string): boolean => {
    const keywords = [
      "altcoin",
      "altcoins",
      "eth",
      "ethereum",
      "solana",
      "sol",
      "sui",
      "hyperliquid",
      "hype",
      "chainlink",
      "link",
      "uniswap",
      "uni",
      "aave",
      "ondo",
      "ethena",
      "ena",
      "berachain",
      "bera",
      "avalanche",
      "avax",
      "stacks",
      "stx",
      "dogecoin",
      "doge",
      "pepe",
      "mog",
      "bittensor",
      "tao",
      "render",
      "rndr",
      "fartcoin",
      "railgun",
      "portfolio",
      "curated",
      "performance",
      "gains",
      "pumping",
      "mooning",
      "defi",
      "memecoins",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isTopMoversRequest: (text: string): boolean => {
    const keywords = [
      "top gainers",
      "top losers",
      "biggest movers",
      "market winners",
      "market losers",
      "daily gainers",
      "daily losers",
      "crypto winners",
      "crypto losers",
      "best performers",
      "worst performers",
      "pumping coins",
      "dumping coins",
      "green coins",
      "red coins",
      "market movers",
      "gainers",
      "losers",
      "movers",
      "pumping",
      "dumping",
      "winners",
      "losers",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isBtcRelativePerformanceRequest: (text: string): boolean => {
    const keywords = [
      "outperforming",
      "outperform",
      "vs btc",
      "vs bitcoin",
      "altcoins",
      "altcoin",
      "beating bitcoin",
      "beat bitcoin",
      "relative performance",
      "performance vs bitcoin",
      "which coins",
      "top performers",
      "altseason",
      "bitcoin dominance",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isNFTRequest: (text: string): boolean => {
    const keywords = [
      "nft",
      "nfts",
      "digital art",
      "opensea",
      "cryptopunks",
      "fidenza",
      "generative art",
      "art blocks",
      "blue chip",
      "floor price",
      "collection",
      "curated nft",
      "digital collection",
      "art collection",
      "nft market",
      "archetype",
      "terraforms",
      "meridian",
      "sightseers",
      "progression",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isDexScreenerRequest: (text: string): boolean => {
    const keywords = [
      "trending tokens",
      "dex screener",
      "dexscreener",
      "top tokens",
      "solana gems",
      "new tokens",
      "boosted tokens",
      "trending solana",
      "dex trends",
      "token discovery",
      "memecoin radar",
      "solana trending",
      "hot tokens",
      "liquid tokens",
      "token screener",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isETFRequest: (text: string): boolean => {
    const keywords = [
      "etf flow",
      "etf flows",
      "bitcoin etf",
      "btc etf",
      "etf inflow",
      "etf outflow",
      "etf tracking",
      "etf data",
      "etf market",
      "etf holdings",
      "etf premium",
      "etf volume",
      "etf analysis",
      "institutional flow",
      "institutional flows",
      "ibit",
      "fbtc",
      "arkb",
      "bitb",
      "gbtc",
      "hodl",
      "ezbc",
      "brrr",
      "btco",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isStockMarketRequest: (text: string): boolean => {
    const keywords = [
      "stock",
      "stocks",
      "tsla",
      "tesla",
      "mstr",
      "microstrategy",
      "nvda",
      "nvidia",
      "mag7",
      "magnificent 7",
      "s&p 500",
      "spy",
      "market",
      "equity",
      "equities",
      "coin",
      "coinbase",
      "hood",
      "robinhood",
      "mara",
      "riot",
      "mining stocks",
      "bitcoin stocks",
      "crypto stocks",
      "performance",
      "outperform",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isTop100VsBtcRequest: (text: string): boolean => {
    const keywords = [
      "top 100",
      "altcoins vs bitcoin",
      "outperforming bitcoin",
      "underperforming bitcoin",
      "bitcoin dominance",
      "altcoin performance",
      "btc pairs",
      "altseason",
      "bitcoin relative performance",
      "crypto vs bitcoin",
      "outperformers",
      "underperformers",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isTrendingCoinsRequest: (text: string): boolean => {
    const keywords = [
      "trending",
      "trending crypto",
      "trending coins",
      "hot coins",
      "whats trending",
      "what is trending",
      "popular coins",
      "viral coins",
      "buzz coins",
      "hype coins",
      "social trending",
      "most searched",
      "community favorites",
      "trending altcoins",
      "hottest coins",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },

  isBookingOptimizationRequest: (text: string): boolean => {
    const keywords = [
      "optimize",
      "compare",
      "best",
      "better",
      "analysis",
      "recommendation",
      "versus",
      "vs",
      "choose",
      "decide",
      "which hotel",
      "what's better",
      "smart booking",
      "strategy",
      "value",
      "worth it",
      "hotel comparison",
    ];
    const hotelKeywords = [
      "hotel",
      "hotels",
      "accommodation",
      "booking",
      "stay",
      "property",
    ];
    return (
      keywords.some((keyword) => text.includes(keyword)) &&
      hotelKeywords.some((keyword) => text.includes(keyword))
    );
  },

  isHotelDealRequest: (text: string): boolean => {
    const keywords = [
      "deal",
      "deals",
      "alert",
      "alerts",
      "notification",
      "notify",
      "monitor",
      "watch",
      "track",
      "savings",
      "discount",
      "price drop",
      "bargain",
      "special",
    ];
    const hotelKeywords = [
      "hotel",
      "hotels",
      "accommodation",
      "booking",
      "stay",
      "room",
      "suite",
    ];
    return (
      keywords.some((keyword) => text.includes(keyword)) &&
      hotelKeywords.some((keyword) => text.includes(keyword))
    );
  },

  isHotelSearchRequest: (text: string): boolean => {
    const keywords = [
      "find",
      "search",
      "look for",
      "show me",
      "available",
      "book",
      "reserve",
    ];
    const hotelKeywords = [
      "hotel",
      "hotels",
      "accommodation",
      "booking",
      "stay",
      "property",
    ];
    const locationKeywords = [
      "biarritz",
      "bordeaux",
      "monaco",
      "french riviera",
      "southwestern france",
    ];

    const hasHotelKeyword = hotelKeywords.some((keyword) =>
      text.includes(keyword),
    );
    const hasSearchKeyword = keywords.some((keyword) => text.includes(keyword));
    const hasLocationKeyword = locationKeywords.some((keyword) =>
      text.includes(keyword),
    );

    return hasHotelKeyword && (hasSearchKeyword || hasLocationKeyword);
  },

  isTravelInsightsRequest: (text: string): boolean => {
    const insightKeywords = [
      "insights",
      "analysis",
      "trends",
      "patterns",
      "advice",
      "strategy",
      "planning",
      "forecast",
      "outlook",
      "overview",
      "summary",
    ];
    const travelKeywords = [
      "travel",
      "seasonal",
      "season",
      "weather",
      "timing",
      "when to",
      "best time",
      "worst time",
      "market",
      "booking",
      "vacation",
    ];
    const specificKeywords = [
      "what's the best",
      "when should i",
      "how do prices",
      "trends in",
      "seasonal patterns",
      "market conditions",
      "booking advice",
      "travel tips",
    ];

    const hasInsightKeyword = insightKeywords.some((keyword) =>
      text.includes(keyword),
    );
    const hasTravelKeyword = travelKeywords.some((keyword) =>
      text.includes(keyword),
    );
    const hasSpecificKeyword = specificKeywords.some((keyword) =>
      text.includes(keyword),
    );

    return (hasInsightKeyword && hasTravelKeyword) || hasSpecificKeyword;
  },
};

// Standard response creators
export const ResponseCreators = {
  createStandardResponse: (
    thought: string,
    text: string,
    actionName: string,
    data?: any,
  ): Content => ({
    thought,
    text,
    actions: [actionName],
    ...(data && { data }),
  }),

  createErrorResponse: (
    actionName: string,
    errorMessage: string,
    fallbackText?: string,
  ): Content => ({
    thought: `An error occurred in ${actionName}: ${errorMessage}`,
    text:
      fallbackText ||
      "I encountered an issue processing your request. Please try again later.",
    actions: [actionName],
  }),

  createLoadingResponse: (
    actionName: string,
    loadingText: string = "Processing your request...",
  ): Content => ({
    thought: `Initiating ${actionName} to fulfill the user's request.`,
    text: loadingText,
    actions: [actionName],
  }),
};
