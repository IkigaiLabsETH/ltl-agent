import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { RealTimeDataService } from "../services/RealTimeDataService";
import { sanitizeProviderResult } from "../utils/helpers";

/**
 * Real-Time Data Provider - Market trends and real-time information
 * Following ElizaOS documentation patterns
 * Dynamic provider: Only used when explicitly requested
 */
export const realTimeDataProvider: Provider = {
  name: "realTimeData",
  description:
    "Provides real-time market data, trending coins, and market sentiment",
  dynamic: true, // Only used when explicitly requested

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    try {
      const realTimeService = runtime.getService(
        "real-time-data",
      ) as RealTimeDataService;

      if (!realTimeService) {
        return {
          text: "Real-time data service not available",
          values: { realTimeDataError: true },
        };
      }

      // Get various real-time data
      const trendingCoins = realTimeService.getTrendingCoinsData();
      const topMovers = realTimeService.getTopMoversData();
      const dexScreenerData = realTimeService.getDexScreenerData();
      const curatedAltcoins = realTimeService.getCuratedAltcoinsData();
      const alerts = realTimeService.getAlerts();

      // Format trending context
      let context = "Real-time market data: ";

      if (trendingCoins?.coins?.length > 0) {
        const topTrending = trendingCoins.coins
          .slice(0, 3)
          .map((coin) => coin.symbol)
          .join(", ");
        context += `Trending: ${topTrending}. `;
      }

      if (topMovers?.topGainers?.length > 0) {
        const topGainer = topMovers.topGainers[0];
        context += `Top gainer: ${topGainer.symbol} (+${topGainer.price_change_percentage_24h.toFixed(1)}%). `;
      }

      if (topMovers?.topLosers?.length > 0) {
        const topLoser = topMovers.topLosers[0];
        context += `Top loser: ${topLoser.symbol} (${topLoser.price_change_percentage_24h.toFixed(1)}%). `;
      }

      if (dexScreenerData?.trendingTokens?.length > 0) {
        const solanaTokens = dexScreenerData.trendingTokens.filter(
          (t) => t.chainId === "solana",
        );
        context += `DEX trending: ${solanaTokens.length} Solana tokens. `;
      }

      if (curatedAltcoins && Object.keys(curatedAltcoins).length > 0) {
        context += `Curated altcoins: ${Object.keys(curatedAltcoins).length} coins tracked. `;
      }

      if (alerts?.length > 0) {
        const criticalAlerts = alerts.filter(
          (a) => a.severity === "critical" || a.severity === "high",
        );
        context += `Active alerts: ${criticalAlerts.length} critical/high priority. `;
      }

      const result = {
        text: context,
        values: {
          // Trending data
          trendingCoinsCount: trendingCoins?.coins?.length || 0,
          trendingCoins:
            trendingCoins?.coins
              ?.slice(0, 5)
              ?.map((c) => ({
                symbol: c.symbol,
                name: c.name,
                rank: c.market_cap_rank,
              })) || [],

          // Top movers
          topGainer: topMovers?.topGainers?.[0]?.symbol || null,
          topGainerChange:
            topMovers?.topGainers?.[0]?.price_change_percentage_24h || 0,
          topLoser: topMovers?.topLosers?.[0]?.symbol || null,
          topLoserChange:
            topMovers?.topLosers?.[0]?.price_change_percentage_24h || 0,

          // DEX data
          dexTrendingCount: dexScreenerData?.trendingTokens?.length || 0,
          solanaTrendingCount:
            dexScreenerData?.trendingTokens?.filter(
              (t) => t.chainId === "solana",
            ).length || 0,

          // Curated altcoins
          curatedAltcoinsCount: curatedAltcoins
            ? Object.keys(curatedAltcoins).length
            : 0,

          // Alerts
          alertsCount: alerts?.length || 0,
          criticalAlertsCount:
            alerts?.filter(
              (a) => a.severity === "critical" || a.severity === "high",
            ).length || 0,

          lastUpdated: new Date().toISOString(),
        },
        data: {
          trendingCoins: trendingCoins,
          topMovers: topMovers,
          dexScreenerData: dexScreenerData,
          curatedAltcoins: curatedAltcoins,
          alerts: alerts,
        },
      };

      // Sanitize the result to prevent JSON.stringify errors
      return sanitizeProviderResult(result);

    } catch (error) {
      return {
        text: "❌ Error fetching real-time data",
        values: { realTimeDataError: true },
        data: { error: error instanceof Error ? error.message : "Unknown error" },
      };
    }
  },
};
