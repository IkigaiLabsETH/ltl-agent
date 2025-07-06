import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from "@elizaos/core";
import {
  createActionTemplate,
  ValidationPatterns,
  ResponseCreators,
} from "./base/ActionTemplate";
import {
  RealTimeDataService,
  type CuratedAltcoinsData,
} from "../services/RealTimeDataService";

export const curatedAltcoinsAction: Action = createActionTemplate({
  name: "CURATED_ALTCOINS",
  description:
    "Comprehensive analysis of curated altcoin portfolio performance including ETH, SOL, SUI, HYPE, DeFi tokens, memecoins, and Layer 1 categorization",
  similes: [
    "ALTCOIN_ANALYSIS",
    "PORTFOLIO_COINS",
    "ALTCOIN_PERFORMANCE",
    "CURATED_COINS",
    "DEFI_TOKENS",
  ],

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "How are the altcoins performing?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "ETH: $3,420 (+2.1%). SOL: $198 (+5.7%). SUI: $4.32 (+12.3%). HYPE: $28.91 (+8.4%). The degenerates are pumping while Bitcoin consolidates. DeFi season building momentum. Portfolio avg: +4.2%.",
          thought:
            "User is asking about altcoin performance. I need to analyze the curated portfolio covering major Layer 1s, DeFi tokens, and memecoins, then provide performance metrics with market sentiment analysis and categorical insights.",
          actions: ["CURATED_ALTCOINS"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "What's pumping in our portfolio?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "PEPE: +15.7%, MOG: +23.1%, FARTCOIN: +89.4%. Meme season in full swing. ETH and SOL holding steady while the casino coins print. Memecoins pumping hard - degeneracy in full swing. Risk accordingly.",
          thought:
            "User wants to know about top performers. I should focus on the strongest performers in the curated portfolio, identify if it's meme season or DeFi season, and provide context about market rotation and risk management.",
          actions: ["CURATED_ALTCOINS"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Show me Hyperliquid performance" },
      },
      {
        name: "Satoshi",
        content: {
          text: "HYPE: $28.91 (+8.4% 24h). The Hyperliquid thesis playing out - decentralized perps exchange capturing market share from centralized casinos. DeFi infrastructure proving its value in the new financial system.",
          thought:
            "User is asking specifically about Hyperliquid. I should provide detailed performance data and contextualize it within the broader DeFi narrative and thesis validation for decentralized perpetual exchanges.",
          actions: ["CURATED_ALTCOINS"],
        },
      },
    ],
  ],

  validateFn: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return ValidationPatterns.isAltcoinRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    logger.info("Curated altcoins action triggered");

    // Initial thought process
    const thoughtProcess =
      "User is requesting altcoin analysis. I need to analyze the curated portfolio performance covering Layer 1s, DeFi protocols, and memecoins, then categorize performance trends and provide market sentiment analysis with actionable insights.";

    try {
      const service = runtime.getService(
        "real-time-data",
      ) as RealTimeDataService;

      if (!service) {
        logger.warn("RealTimeDataService not available for curated altcoins");

        const fallbackResponse = ResponseCreators.createErrorResponse(
          "CURATED_ALTCOINS",
          "Real-time data service unavailable",
          "Curated altcoins data service temporarily unavailable. Markets updating every minute - the casino never sleeps. Price discovery continues independently.",
        );

        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      const curatedData = service.getCuratedAltcoinsData();

      if (!curatedData) {
        logger.warn("No curated altcoins data available");

        const noDataResponse = ResponseCreators.createErrorResponse(
          "CURATED_ALTCOINS",
          "Curated altcoins data unavailable",
          "Curated altcoins data not available right now. Markets updating every minute. The portfolio continues performing regardless of our monitoring.",
        );

        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Analyze the curated data
      const analysis = analyzeCuratedAltcoins(curatedData);

      // Format analysis for delivery
      const responseText = formatCuratedAnalysis(analysis, curatedData);

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        responseText,
        "CURATED_ALTCOINS",
        {
          analysis,
          timestamp: new Date().toISOString(),
          source: "curated-altcoins",
          portfolioMetrics: {
            totalPositive: analysis.totalPositive,
            totalNegative: analysis.totalNegative,
            avgPerformance: analysis.avgPerformance,
            marketSentiment: analysis.marketSentiment,
          },
          categoryPerformance: {
            memecoins: analysis.memecoinsPerformance,
            defi: analysis.defiPerformance,
            layer1: analysis.layer1Performance,
          },
        },
      );

      if (callback) {
        await callback(response);
      }

      logger.info("Curated altcoins analysis delivered successfully");
      return true;
    } catch (error) {
      logger.error(
        "Failed to analyze curated altcoins:",
        (error as Error).message,
      );

      // Enhanced error handling with context-specific responses
      let errorMessage =
        "Altcoin analysis systems operational. Markets are volatile beasts - price discovery continues.";

      const errorMsg = (error as Error).message.toLowerCase();
      if (
        errorMsg.includes("rate limit") ||
        errorMsg.includes("429") ||
        errorMsg.includes("too many requests")
      ) {
        errorMessage =
          "Market data rate limited. The casino is overwhelmed with degenerates. Analysis will resume shortly.";
      } else if (
        errorMsg.includes("network") ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("fetch")
      ) {
        errorMessage =
          "Market data connectivity issues. Altcoins pump and dump independently of our monitoring. Price discovery decentralized.";
      } else if (
        errorMsg.includes("service") ||
        errorMsg.includes("unavailable")
      ) {
        errorMessage =
          "Portfolio analysis service temporarily down. The degenerates continue trading regardless of our monitoring systems.";
      }

      const errorResponse = ResponseCreators.createErrorResponse(
        "CURATED_ALTCOINS",
        (error as Error).message,
        errorMessage,
      );

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },
});

interface CuratedAnalysis {
  topPerformers: Array<{ symbol: string; price: number; change24h: number }>;
  worstPerformers: Array<{ symbol: string; price: number; change24h: number }>;
  totalPositive: number;
  totalNegative: number;
  avgPerformance: number;
  marketSentiment: "bullish" | "bearish" | "mixed" | "consolidating";
  memecoinsPerformance: number;
  defiPerformance: number;
  layer1Performance: number;
}

function analyzeCuratedAltcoins(data: CuratedAltcoinsData): CuratedAnalysis {
  const coins = Object.entries(data);

  // Sort by performance
  const sorted = coins.sort((a, b) => b[1].change24h - a[1].change24h);

  const topPerformers = sorted.slice(0, 3).map(([symbol, data]) => ({
    symbol: symbol.toUpperCase(),
    price: data.price,
    change24h: data.change24h,
  }));

  const worstPerformers = sorted.slice(-3).map(([symbol, data]) => ({
    symbol: symbol.toUpperCase(),
    price: data.price,
    change24h: data.change24h,
  }));

  const totalPositive = coins.filter(([, data]) => data.change24h > 0).length;
  const totalNegative = coins.filter(([, data]) => data.change24h < 0).length;

  const avgPerformance =
    coins.reduce((sum, [, data]) => sum + data.change24h, 0) / coins.length;

  // Categorize performance
  const memecoins = ["dogecoin", "pepe", "mog-coin", "fartcoin"];
  const defiCoins = ["uniswap", "aave", "chainlink", "ethena", "ondo-finance"];
  const layer1s = ["ethereum", "solana", "sui", "avalanche-2", "blockstack"];

  const memecoinsPerformance = calculateCategoryPerformance(data, memecoins);
  const defiPerformance = calculateCategoryPerformance(data, defiCoins);
  const layer1Performance = calculateCategoryPerformance(data, layer1s);

  let marketSentiment: "bullish" | "bearish" | "mixed" | "consolidating";
  if (avgPerformance > 5) marketSentiment = "bullish";
  else if (avgPerformance < -5) marketSentiment = "bearish";
  else if (Math.abs(avgPerformance) < 2) marketSentiment = "consolidating";
  else marketSentiment = "mixed";

  return {
    topPerformers,
    worstPerformers,
    totalPositive,
    totalNegative,
    avgPerformance,
    marketSentiment,
    memecoinsPerformance,
    defiPerformance,
    layer1Performance,
  };
}

function calculateCategoryPerformance(
  data: CuratedAltcoinsData,
  category: string[],
): number {
  const categoryCoins = category.filter((coin) => data[coin]);
  if (categoryCoins.length === 0) return 0;

  return (
    categoryCoins.reduce((sum, coin) => sum + data[coin].change24h, 0) /
    categoryCoins.length
  );
}

function formatCuratedAnalysis(
  analysis: CuratedAnalysis,
  data: CuratedAltcoinsData,
): string {
  const { topPerformers, marketSentiment, avgPerformance } = analysis;

  // Format top performers
  const topPerformersText = topPerformers
    .map(
      (p) =>
        `${getCoinSymbol(p.symbol)}: $${p.price.toFixed(2)} (${p.change24h > 0 ? "+" : ""}${p.change24h.toFixed(1)}%)`,
    )
    .join(", ");

  // Market sentiment context
  let sentimentText = "";
  switch (marketSentiment) {
    case "bullish":
      sentimentText = "Altcoin season building momentum.";
      break;
    case "bearish":
      sentimentText = "Altcoins bleeding. Bitcoin dominance rising.";
      break;
    case "mixed":
      sentimentText = "Mixed signals across altcoins.";
      break;
    case "consolidating":
      sentimentText = "Altcoins consolidating. Waiting for next move.";
      break;
  }

  // Add category insights
  let categoryInsights = "";
  if (analysis.memecoinsPerformance > 10) {
    categoryInsights += " Memecoins pumping hard - degeneracy in full swing.";
  } else if (analysis.defiPerformance > 5) {
    categoryInsights += " DeFi showing strength - protocol value accruing.";
  } else if (analysis.layer1Performance > 3) {
    categoryInsights += " Layer 1s leading - infrastructure adoption.";
  }

  return `${topPerformersText}. ${sentimentText}${categoryInsights} Portfolio avg: ${avgPerformance > 0 ? "+" : ""}${avgPerformance.toFixed(1)}%.`;
}

function getCoinSymbol(coinId: string): string {
  const symbolMap: { [key: string]: string } = {
    ETHEREUM: "ETH",
    CHAINLINK: "LINK",
    UNISWAP: "UNI",
    AAVE: "AAVE",
    "ONDO-FINANCE": "ONDO",
    ETHENA: "ENA",
    SOLANA: "SOL",
    SUI: "SUI",
    HYPERLIQUID: "HYPE",
    "BERACHAIN-BERA": "BERA",
    "INFRAFRED-BGT": "BGT",
    "AVALANCHE-2": "AVAX",
    BLOCKSTACK: "STX",
    DOGECOIN: "DOGE",
    PEPE: "PEPE",
    "MOG-COIN": "MOG",
    BITTENSOR: "TAO",
    "RENDER-TOKEN": "RNDR",
    FARTCOIN: "FART",
    RAILGUN: "RAIL",
  };

  return symbolMap[coinId] || coinId;
}
