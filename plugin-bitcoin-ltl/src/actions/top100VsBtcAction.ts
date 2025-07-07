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
import { AltcoinDataService } from "../services/AltcoinDataService";

export const top100VsBtcAction: Action = createActionTemplate({
  name: "TOP100_VS_BTC_ACTION",
  description:
    "Analysis of curated altcoins performance and market trends with Bitcoin comparison",
  similes: [
    "top 100 vs bitcoin",
    "altcoins vs bitcoin",
    "bitcoin dominance",
    "crypto vs btc",
    "relative performance",
    "outperforming bitcoin",
    "underperforming bitcoin",
    "bitcoin comparison",
    "altcoin performance",
    "crypto performance vs btc",
  ],

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "How are the top altcoins performing vs Bitcoin?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Curated altcoins analysis: ETH +2.5%, SOL +5.2%, PEPE -3.1%. Trending: ETH, SOL, PEPE. Bitcoin remains the benchmark. Focus on fundamentals over short-term performance.",
          thought:
            "User wants altcoin performance vs Bitcoin analysis. I need to analyze curated altcoins data, identify trends, and provide perspective on Bitcoin as the benchmark.",
          actions: ["TOP100_VS_BTC_ACTION"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Which coins are trending?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Trending coins: ETH (rank #2), SOL (rank #5), PEPE (rank #25). Market sentiment mixed. Bitcoin dominance strong. Quality projects with real utility outperform in the long run.",
          thought:
            "User asking about trending coins. I should identify trending coins, analyze market sentiment, and maintain perspective on Bitcoin as the benchmark.",
          actions: ["TOP100_VS_BTC_ACTION"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Is it altseason yet?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Not altseason yet. Bitcoin dominance remains strong. Curated altcoins showing mixed performance. True altseason needs sustained Bitcoin weakness and broad altcoin strength. Current: selective rotation only.",
          thought:
            "User asking about altseason timing. I need to analyze altcoin performance, check Bitcoin dominance, and provide perspective on market cycle timing.",
          actions: ["TOP100_VS_BTC_ACTION"],
        },
      },
    ],
  ],

  validateFn: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return ValidationPatterns.isBtcRelativePerformanceRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    logger.info("Altcoin analysis action triggered");

    const thoughtProcess =
      "User is requesting altcoin performance analysis. I need to analyze curated altcoins data, identify trends, and provide perspective on Bitcoin as the benchmark.";

    try {
      const altcoinService = runtime.getService(
        "altcoin-data",
      ) as AltcoinDataService;

      if (!altcoinService) {
        logger.warn("AltcoinDataService not available");

        const fallbackResponse = ResponseCreators.createErrorResponse(
          "TOP100_VS_BTC_ACTION",
          "Altcoin data service unavailable",
          "Altcoin data service unavailable. Bitcoin remains the benchmark regardless of data availability.",
        );

        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Get curated altcoins and trending data
      const curatedData = altcoinService.getCuratedAltcoinsData();
      const trendingData = altcoinService.getTrendingCoinsData();

      if (!curatedData && !trendingData) {
        logger.warn("Altcoin data not available");

        const noDataResponse = ResponseCreators.createErrorResponse(
          "TOP100_VS_BTC_ACTION",
          "Altcoin data unavailable",
          "Altcoin data unavailable. Bitcoin remains the measuring stick for all digital assets.",
        );

        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Analyze the data
      const analysis = analyzeAltcoinData(curatedData, trendingData);

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        analysis.responseText,
        "TOP100_VS_BTC_ACTION",
        {
          curatedCoinsCount: analysis.curatedCoinsCount,
          trendingCoinsCount: analysis.trendingCoinsCount,
          topPerformers: analysis.topPerformers,
          underperformers: analysis.underperformers,
          marketSentiment: analysis.marketSentiment,
          altseasonIndicator: analysis.altseasonIndicator,
        },
      );

      if (callback) {
        await callback(response);
      }

      logger.info("Altcoin analysis delivered successfully");
      return true;
    } catch (error) {
      logger.error(
        "Failed to analyze altcoins:",
        (error as Error).message,
      );

      const errorResponse = ResponseCreators.createErrorResponse(
        "TOP100_VS_BTC_ACTION",
        (error as Error).message,
        "Altcoin analysis failed. Bitcoin remains the ultimate benchmark for all digital assets.",
      );

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },
});

/**
 * Analyze altcoin data from simplified service
 */
function analyzeAltcoinData(
  curatedData: any,
  trendingData: any,
): {
  responseText: string;
  curatedCoinsCount: number;
  trendingCoinsCount: number;
  topPerformers: string[];
  underperformers: string[];
  marketSentiment: string;
  altseasonIndicator: string;
} {
  let responseText = "🟠 **Altcoin Market Analysis** 🟠\n\n";

  // Analyze curated altcoins
  if (curatedData && Object.keys(curatedData).length > 0) {
    const coins = Object.values(curatedData);
    const positivePerformers = coins.filter((coin: any) => coin.change24h > 0);
    const negativePerformers = coins.filter((coin: any) => coin.change24h < 0);

    const topPerformers = positivePerformers
      .sort((a: any, b: any) => b.change24h - a.change24h)
      .slice(0, 3)
      .map((coin: any) => `${coin.symbol} +${coin.change24h.toFixed(1)}%`);

    const underperformers = negativePerformers
      .sort((a: any, b: any) => a.change24h - b.change24h)
      .slice(0, 3)
      .map((coin: any) => `${coin.symbol} ${coin.change24h.toFixed(1)}%`);

    responseText += `**Curated Altcoins (${coins.length} tracked):**\n`;
    responseText += `📈 Top performers: ${topPerformers.join(", ")}\n`;
    responseText += `📉 Underperformers: ${underperformers.join(", ")}\n\n`;

    // Market sentiment
    const positiveRatio = positivePerformers.length / coins.length;
    let marketSentiment = "neutral";
    if (positiveRatio > 0.6) marketSentiment = "bullish";
    else if (positiveRatio < 0.4) marketSentiment = "bearish";

    // Altseason indicator
    let altseasonIndicator = "not altseason";
    if (positiveRatio > 0.7) altseasonIndicator = "potential altseason";
    else if (positiveRatio > 0.5) altseasonIndicator = "mixed signals";

    return {
      responseText,
      curatedCoinsCount: coins.length,
      trendingCoinsCount: trendingData?.coins?.length || 0,
      topPerformers,
      underperformers,
      marketSentiment,
      altseasonIndicator,
    };
  }

  // Fallback analysis
  responseText += "**Altcoin Market Overview:**\n";
  responseText += "📊 Limited data available\n";
  responseText += "🎯 Bitcoin remains the benchmark\n";
  responseText += "💡 Focus on fundamentals over short-term performance\n\n";

  return {
    responseText,
    curatedCoinsCount: 0,
    trendingCoinsCount: trendingData?.coins?.length || 0,
    topPerformers: [],
    underperformers: [],
    marketSentiment: "neutral",
    altseasonIndicator: "insufficient data",
  };
}
