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
} from "../services/RealTimeDataService";

export const btcRelativePerformanceAction: Action = createActionTemplate({
  name: "BTC_RELATIVE_PERFORMANCE",
  description:
    "Comprehensive analysis of altcoins outperforming Bitcoin on 7-day basis, showing relative performance in percentage points across top 100 altcoins",
  similes: [
    "BITCOIN_RELATIVE_PERFORMANCE",
    "ALTCOINS_VS_BTC",
    "COINS_OUTPERFORMING_BITCOIN",
    "BTC_OUTPERFORMERS",
    "RELATIVE_PERFORMANCE_VS_BITCOIN",
  ],

  examples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "Show me which altcoins are outperforming Bitcoin this week",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "Based on 7-day performance data: ETH +5.32% vs BTC (ETH: +8.45%, BTC: +3.13%). SOL +12.87% vs BTC (SOL: +15.98%, BTC: +3.11%). BNB +3.21% vs BTC. 67/86 altcoins outperforming Bitcoin - moderate altcoin momentum but Bitcoin still the monetary base layer.",
          thought:
            "User wants to see altcoins outperforming Bitcoin. I need to analyze 7-day relative performance data, identify the strongest outperformers, and provide context about whether this indicates altseason or Bitcoin dominance continuation.",
          actions: ["BTC_RELATIVE_PERFORMANCE"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "What coins are beating Bitcoin performance right now?",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "Current BTC outperformers (7d): SOL +15.34% vs BTC, ETH +7.89% vs BTC, ADA +4.23% vs BTC. 73/89 altcoins outperforming Bitcoin. Average relative performance: +1.87%. These coins show stronger momentum than Bitcoin, indicating potential alpha opportunities.",
          thought:
            "User asking about current Bitcoin outperformers. I should focus on the strongest performers with their relative performance data and assess if this is altseason territory or normal market rotation.",
          actions: ["BTC_RELATIVE_PERFORMANCE"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "Are we in altseason? Check altcoin vs Bitcoin performance",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "Not altseason yet. Only 34/86 altcoins outperforming Bitcoin (40% vs 50%+ threshold). Bitcoin dominance strong with average -2.4% underperformance across top 100. Most altcoins are venture capital plays - Bitcoin remains the monetary base layer.",
          thought:
            "User asking about altseason status. I need to analyze the percentage of altcoins outperforming Bitcoin and compare it to the traditional 50%+ altseason threshold, then provide perspective on Bitcoin's role as sound money.",
          actions: ["BTC_RELATIVE_PERFORMANCE"],
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
    logger.info("BTC relative performance action triggered");

    const thoughtProcess =
      "User is requesting Bitcoin relative performance analysis. I need to analyze which altcoins are outperforming Bitcoin on a 7-day basis, assess if this indicates altseason, and provide context about Bitcoin's role as the monetary base layer.";

    try {
      // Get unified BTC performance data if available
      let btcPerformanceData = null;
      try {
        const btcPerformanceService = runtime.getService("btc-performance") as any;
        if (btcPerformanceService && typeof btcPerformanceService.getBenchmarkData === 'function') {
          btcPerformanceData = await btcPerformanceService.getBenchmarkData();
        }
      } catch (error) {
        logger.debug("Unified BTC performance data not available, using fallback");
      }

      // Fallback to RealTimeDataService if unified data not available
      let btcData = null;
      if (!btcPerformanceData) {
        const realTimeDataService = runtime.getService(
          "real-time-data",
        ) as RealTimeDataService;

        if (!realTimeDataService) {
          logger.warn(
            "Neither BTC performance service nor RealTimeDataService available",
          );

          const fallbackResponse = ResponseCreators.createErrorResponse(
            "BTC_RELATIVE_PERFORMANCE",
            "BTC performance services unavailable",
            "Market data services unavailable. Bitcoin relative performance analysis requires live data to assess altcoin vs Bitcoin momentum properly.",
          );

          if (callback) {
            await callback(fallbackResponse);
          }
          return false;
        }

        // Get curated altcoins data as fallback
        const altcoinService = runtime.getService("altcoin-data") as any;
        if (altcoinService) {
          btcData = altcoinService.getCuratedAltcoinsData();
        }
      }

      if (!btcPerformanceData && !btcData) {
        logger.warn("No BTC relative performance data available");

        const noDataResponse = ResponseCreators.createErrorResponse(
          "BTC_RELATIVE_PERFORMANCE",
          "BTC relative performance data unavailable",
          "Unable to fetch BTC relative performance data. The altcoin casino operates independently of our monitoring capabilities.",
        );

        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Generate response using unified data or fallback
      let responseText: string;
      let responseData: any;

      if (btcPerformanceData) {
        // Use unified BTC performance data
        const altcoinSeasonIndex = btcPerformanceData.marketIntelligence.altcoinSeasonIndex;
        const isAltseason = altcoinSeasonIndex > 75;
        const topPerformers = btcPerformanceData.assetClasses.altcoins.topPerformers.slice(0, 8);
        const totalOutperforming = btcPerformanceData.assetClasses.altcoins.topPerformers.length;
        const totalCoins = btcPerformanceData.assetClasses.altcoins.topPerformers.length + btcPerformanceData.assetClasses.altcoins.underperformers.length;
        const outperformingPercent = (totalOutperforming / totalCoins) * 100;
        const averagePerformance = btcPerformanceData.assetClasses.altcoins.aggregatePerformance.performance7d || 0;

        responseText = formatBtcRelativeResponse(
          topPerformers,
          totalOutperforming,
          totalCoins,
          outperformingPercent,
          isAltseason,
          averagePerformance,
          btcPerformanceData,
        );

        responseData = {
          outperformingCount: totalOutperforming,
          totalCoins: totalCoins,
          outperformingPercent,
          isAltseason,
          averageRelativePerformance: averagePerformance,
          topPerformers: topPerformers.map((coin: any) => ({
            name: coin.name,
            symbol: coin.symbol,
            relativePerformance: coin.vsBTC?.performance7d || 0,
            price: coin.price,
            rank: coin.market_cap_rank,
          })),
          lastUpdated: btcPerformanceData.lastUpdated,
        };
      } else {
        // Use fallback data
        const topPerformers = btcData.outperforming.slice(0, 8);
        const totalOutperforming = btcData.outperformingCount;
        const totalCoins = btcData.totalCoins;
        const outperformingPercent = (totalOutperforming / totalCoins) * 100;
        const isAltseason = outperformingPercent > 50;

        responseText = formatBtcRelativeResponse(
          topPerformers,
          totalOutperforming,
          totalCoins,
          outperformingPercent,
          isAltseason,
          btcData.averagePerformance,
        );

        responseData = {
          outperformingCount: totalOutperforming,
          totalCoins: totalCoins,
          outperformingPercent,
          isAltseason,
          averageRelativePerformance: btcData.averagePerformance,
          topPerformers: topPerformers.map((coin) => ({
            name: coin.name,
            symbol: coin.symbol,
            relativePerformance: coin.btc_relative_performance_7d,
            price: coin.current_price,
            rank: coin.market_cap_rank,
          })),
          lastUpdated: btcData.lastUpdated,
        };
      }

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        responseText,
        "BTC_RELATIVE_PERFORMANCE",
        responseData,
      );

      if (callback) {
        await callback(response);
      }

      logger.info("BTC relative performance analysis delivered successfully");
      return true;
    } catch (error) {
      logger.error(
        "Failed to analyze BTC relative performance:",
        (error as Error).message,
      );

      const errorResponse = ResponseCreators.createErrorResponse(
        "BTC_RELATIVE_PERFORMANCE",
        (error as Error).message,
        "BTC relative performance analysis failed. Market dynamics continue regardless of our monitoring systems.",
      );

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },
});

/**
 * Format BTC relative performance response using unified BTC performance data
 */
function formatBtcRelativeResponse(
  topPerformers: any[],
  totalOutperforming: number,
  totalCoins: number,
  outperformingPercent: number,
  isAltseason: boolean,
  averagePerformance: number,
  btcPerformanceData?: any,
): string {
  let response = "";

  // Use unified BTC performance data if available
  if (btcPerformanceData?.marketIntelligence) {
    const altcoinSeasonIndex = btcPerformanceData.marketIntelligence.altcoinSeasonIndex;
    const marketSentiment = btcPerformanceData.marketIntelligence.overallMarketSentiment;
    const topAltcoins = btcPerformanceData.assetClasses.altcoins.topPerformers.slice(0, 3);
    
    // Market sentiment from unified data
    if (altcoinSeasonIndex > 75) {
      response += `🚀 ALTSEASON DETECTED! Altcoin Season Index: ${altcoinSeasonIndex} (${marketSentiment}). `;
    } else {
      response += `₿ Bitcoin dominance - Altcoin Season Index: ${altcoinSeasonIndex} (${marketSentiment}). `;
    }

    // Top performers from unified data
    if (topAltcoins.length > 0) {
      const topPerformersText = topAltcoins
        .map((coin: any) => {
          const performance = coin.vsBTC?.performance7d || 0;
          const rank = coin.market_cap_rank || "?";
          return `${coin.symbol.toUpperCase()} +${performance.toFixed(2)}% vs BTC (#${rank})`;
        })
        .join(", ");

      response += `Top outperformers (7d): ${topPerformersText}. `;
    }

    // Summary stats from unified data
    const avgPerformance = btcPerformanceData.assetClasses.altcoins.aggregatePerformance.performance7d || 0;
    response += `Average relative performance: ${avgPerformance >= 0 ? "+" : ""}${avgPerformance.toFixed(2)}%. `;

    // Satoshi's perspective
    if (altcoinSeasonIndex > 75) {
      response +=
        "Altcoin momentum building, but remember: most altcoins are venture capital plays. Bitcoin remains the monetary base layer. Use this strength to accumulate more Bitcoin.";
    } else {
      response +=
        "Bitcoin dominance continues as digital gold thesis strengthens. The market recognizes store of value over speculation. Stack sats.";
    }

    return response;
  }

  // Fallback to original logic if unified data not available
  if (isAltseason) {
    response += `🚀 ALTSEASON DETECTED! ${totalOutperforming}/${totalCoins} (${outperformingPercent.toFixed(1)}%) altcoins beating Bitcoin. `;
  } else {
    response += `₿ Bitcoin dominance - ${totalOutperforming}/${totalCoins} (${outperformingPercent.toFixed(1)}%) altcoins outperforming. `;
  }

  // Show top performers with detailed data
  if (topPerformers.length > 0) {
    const topPerformersText = topPerformers
      .slice(0, 3)
      .map((coin) => {
        const relativePerf = coin.btc_relative_performance_7d || 0;
        const rank = coin.market_cap_rank || "?";
        return `${coin.symbol.toUpperCase()} +${relativePerf.toFixed(2)}% vs BTC (#${rank})`;
      })
      .join(", ");

    response += `Top outperformers (7d): ${topPerformersText}. `;
  }

  // Summary stats
  response += `Average relative performance: ${averagePerformance >= 0 ? "+" : ""}${averagePerformance.toFixed(2)}%. `;

  // Satoshi's perspective
  if (isAltseason) {
    response +=
      "Altcoin momentum building, but remember: most altcoins are venture capital plays. Bitcoin remains the monetary base layer. Use this strength to accumulate more Bitcoin.";
  } else {
    response +=
      "Bitcoin dominance continues as digital gold thesis strengthens. The market recognizes store of value over speculation. Stack sats.";
  }

  return response;
}
