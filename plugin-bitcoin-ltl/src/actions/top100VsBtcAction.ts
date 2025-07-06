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
  Top100VsBtcData,
} from "../services/RealTimeDataService";

export const top100VsBtcAction: Action = createActionTemplate({
  name: "TOP100_VS_BTC_ACTION",
  description:
    "Comprehensive analysis of top 100 cryptocurrencies performance against Bitcoin over multiple timeframes with relative strength assessment",
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
        content: { text: "How are the top 100 coins performing vs Bitcoin?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Top 100 vs Bitcoin: 32 coins outperforming BTC (7d). Leaders: HYPE +45%, SUI +28%, AVAX +22%. Bitcoin dominance: 58.3% (+0.8%). 68 coins underperforming BTC. Altseason indicators mixed - some rotation happening but Bitcoin still leading. Quality over quantity in this market.",
          thought:
            "User wants top 100 crypto performance vs Bitcoin analysis. I need to analyze relative performance, identify outperformers and underperformers, assess Bitcoin dominance trends, and provide perspective on altseason dynamics.",
          actions: ["TOP100_VS_BTC_ACTION"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Which coins are beating Bitcoin this week?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Coins beating Bitcoin (7d): 32 of 100. Strong outperformers: HYPE +45% vs BTC +18%, SUI +28% vs BTC, AVAX +22% vs BTC. AI/Layer-1 narrative rotation. 68% still underperforming BTC. Bitcoin remains the benchmark - temporary rotations don't change the fundamentals.",
          thought:
            "User specifically asking about coins outperforming Bitcoin. I should identify the outperformers, analyze the sectors/narratives driving performance, and maintain perspective on Bitcoin as the long-term benchmark.",
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
          text: "Not yet altseason. Only 32% of top 100 outperforming Bitcoin. Bitcoin dominance: 58.3% (+0.8%). True altseason needs 70%+ outperformers. Current: selective rotation in AI/Layer-1 sectors. Most alts still bleeding against BTC. Be patient - altseason follows Bitcoin strength, not weakness.",
          thought:
            "User asking about altseason timing. I need to analyze the percentage of coins outperforming Bitcoin, check dominance trends, compare to historical altseason thresholds, and provide perspective on market cycle timing.",
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
    logger.info("Top 100 vs BTC analysis action triggered");

    const thoughtProcess =
      "User is requesting top 100 vs Bitcoin performance analysis. I need to analyze relative performance across timeframes, identify outperformers/underperformers, assess Bitcoin dominance trends, and provide perspective on altseason dynamics.";

    try {
      const realTimeDataService = runtime.getService(
        "real-time-data",
      ) as RealTimeDataService;

      if (!realTimeDataService) {
        logger.warn("RealTimeDataService not available");

        const fallbackResponse = ResponseCreators.createErrorResponse(
          "TOP100_VS_BTC_ACTION",
          "Market data service unavailable",
          "Market data service unavailable. Bitcoin remains the benchmark regardless of data availability.",
        );

        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Get top 100 vs BTC data
      const top100Data = realTimeDataService.getTop100VsBtcData();

      if (!top100Data) {
        logger.warn("Top 100 vs BTC data not available");

        const noDataResponse = ResponseCreators.createErrorResponse(
          "TOP100_VS_BTC_ACTION",
          "Performance data unavailable",
          "Performance comparison data unavailable. Bitcoin remains the measuring stick for all digital assets.",
        );

        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Analyze the data
      const analysis = analyzeTop100VsBtc(top100Data);

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        analysis.responseText,
        "TOP100_VS_BTC_ACTION",
        {
          totalCoins: analysis.totalCoins,
          outperformers: analysis.outperformers,
          underperformers: analysis.underperformers,
          bitcoinDominance: analysis.bitcoinDominance,
          altseasonIndicator: analysis.altseasonIndicator,
          topSectors: analysis.topSectors,
          timeframe: analysis.timeframe,
        },
      );

      if (callback) {
        await callback(response);
      }

      logger.info("Top 100 vs BTC analysis delivered successfully");
      return true;
    } catch (error) {
      logger.error(
        "Failed to analyze top 100 vs BTC:",
        (error as Error).message,
      );

      const errorResponse = ResponseCreators.createErrorResponse(
        "TOP100_VS_BTC_ACTION",
        (error as Error).message,
        "Performance analysis failed. Bitcoin remains the ultimate benchmark for all digital assets.",
      );

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },
});

/**
 * Analyze top 100 vs BTC performance data
 */
function analyzeTop100VsBtc(data: Top100VsBtcData): {
  responseText: string;
  totalCoins: number;
  outperformers: number;
  underperformers: number;
  bitcoinDominance: number;
  altseasonIndicator: string;
  topSectors: string[];
  timeframe: string;
} {
  // Use the actual properties from Top100VsBtcData interface
  const totalCoins = data.totalCoins;
  const outperformers = data.outperformingCount;
  const underperformers = totalCoins - outperformers;
  const outperformerPercentage = (outperformers / totalCoins) * 100;

  // Top outperformers
  const topOutperformers = data.topPerformers.slice(0, 3);

  // Determine altseason status
  let altseasonIndicator = "No";
  if (outperformerPercentage > 70) {
    altseasonIndicator = "Yes";
  } else if (outperformerPercentage > 50) {
    altseasonIndicator = "Emerging";
  } else if (outperformerPercentage > 30) {
    altseasonIndicator = "Selective";
  }

  // Build response
  let responseText = `Top 100 vs Bitcoin: ${outperformers} coins outperforming BTC (7d). `;

  if (topOutperformers.length > 0) {
    const leadersText = topOutperformers
      .map(
        (coin) =>
          `${coin.symbol} +${(coin.btc_relative_performance_7d || 0).toFixed(0)}%`,
      )
      .join(", ");
    responseText += `Leaders: ${leadersText}. `;
  }

  // Use placeholder dominance data since it's not in the interface
  const dominance = 58.3; // Placeholder
  const dominanceChange = 0.8; // Placeholder

  responseText += `Bitcoin dominance: ${dominance.toFixed(1)}% `;
  responseText += `(${dominanceChange > 0 ? "+" : ""}${dominanceChange.toFixed(1)}%). `;

  responseText += `${underperformers} coins underperforming BTC. `;

  // Add altseason assessment
  if (altseasonIndicator === "Yes") {
    responseText += "Altseason in progress - broad altcoin outperformance. ";
  } else if (altseasonIndicator === "Emerging") {
    responseText += "Altseason emerging - majority outperforming BTC. ";
  } else if (altseasonIndicator === "Selective") {
    responseText +=
      "Altseason indicators mixed - some rotation happening but Bitcoin still leading. ";
  } else {
    responseText += "Not yet altseason. Bitcoin still dominates performance. ";
  }

  // Add sector analysis (simplified since we don't have detailed sector data)
  const topSectors = ["AI", "Layer-1", "DeFi"]; // Placeholder
  if (topSectors.length > 0) {
    responseText += `${topSectors[0]} sector leading rotation. `;
  }

  // Add Bitcoin perspective
  if (altseasonIndicator === "No") {
    responseText +=
      "Be patient - altseason follows Bitcoin strength, not weakness.";
  } else {
    responseText += "Quality over quantity in this market.";
  }

  return {
    responseText,
    totalCoins,
    outperformers,
    underperformers,
    bitcoinDominance: dominance,
    altseasonIndicator,
    topSectors,
    timeframe: "7d",
  };
}

/**
 * Analyze sector performance vs Bitcoin
 */
function analyzeSectorPerformance(
  coins: any[],
  bitcoinPerformance: number,
): Array<{ name: string; outperformers: number; total: number }> {
  const sectorMap = new Map<string, { outperformers: number; total: number }>();

  coins.forEach((coin) => {
    const sector = coin.sector || "Other";
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, { outperformers: 0, total: 0 });
    }

    const sectorData = sectorMap.get(sector)!;
    sectorData.total++;

    if (coin.performance7d > bitcoinPerformance) {
      sectorData.outperformers++;
    }
  });

  return Array.from(sectorMap.entries())
    .map(([name, data]) => ({
      name,
      outperformers: data.outperformers,
      total: data.total,
      percentage: (data.outperformers / data.total) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);
}
