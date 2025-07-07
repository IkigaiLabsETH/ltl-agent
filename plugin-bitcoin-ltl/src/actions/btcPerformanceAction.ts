/**
 * BTC Performance Actions
 * Actions for analyzing and reporting BTC-relative performance
 */

import { Action, IAgentRuntime, Memory, State, HandlerCallback, Content } from "@elizaos/core";
import { BTCPerformanceService } from "../services/BTCPerformanceService";

/**
 * Get complete BTC performance benchmark
 */
export const getBTCBenchmarkAction: Action = {
  name: "GET_BTC_BENCHMARK",
  similes: ["BTC_BENCHMARK", "BITCOIN_BENCHMARK", "PERFORMANCE_BENCHMARK"],
  description: "Get comprehensive BTC performance benchmark with all asset classes and market intelligence.",

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return text.includes("benchmark") || text.includes("performance") || text.includes("vs btc") || text.includes("vs bitcoin");
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[],
  ) => {
    try {
      const btcPerformanceService = runtime.getService("btc-performance") as unknown as BTCPerformanceService;
      
      if (!btcPerformanceService) {
        const errorContent: Content = {
          text: "❌ BTC Performance Service not available",
          actions: ["GET_BTC_BENCHMARK"],
          source: "btc-performance-action",
        };
        await callback(errorContent);
        return errorContent;
      }

      const benchmark = await btcPerformanceService.getBTCBenchmark();

      if (!benchmark.success || !benchmark.data) {
        const errorContent: Content = {
          text: `❌ Failed to fetch benchmark data: ${benchmark.error || "Unknown error"}`,
          actions: ["GET_BTC_BENCHMARK"],
          source: "btc-performance-action",
        };
        await callback(errorContent);
        return errorContent;
      }

      const data = benchmark.data;
      
      const responseText = `🟠 **Bitcoin Performance Benchmark** 🟠\n\n**Bitcoin Status:**\n• Price: $${data.btcPrice.toLocaleString()} (${data.btcChange24h > 0 ? '+' : ''}${data.btcChange24h.toFixed(2)}% 24h)\n• Market Cap: $${(data.btcMarketCap / 1e9).toFixed(2)}B\n• Dominance: ${data.btcDominance.toFixed(2)}%\n\n**Market Intelligence:**\n• Altcoin Season Index: ${data.marketIntelligence.altcoinSeasonIndex.toFixed(1)} (${data.marketIntelligence.altcoinSeasonIndex < 40 ? 'Bitcoin-dominated' : data.marketIntelligence.altcoinSeasonIndex > 70 ? 'Altcoin season' : 'Neutral'})\n• Market Sentiment: ${data.marketIntelligence.overallMarketSentiment}\n• BTC Outperformance Trend: ${data.marketIntelligence.btcOutperformanceTrend.direction}\n\n**Asset Class Performance vs BTC (YTD):**\n• Stocks: ${data.assetClasses.stocks.aggregatePerformance.performanceYTD > 0 ? '+' : ''}${data.assetClasses.stocks.aggregatePerformance.performanceYTD.toFixed(2)}%\n• Altcoins: ${data.assetClasses.altcoins.aggregatePerformance.performanceYTD > 0 ? '+' : ''}${data.assetClasses.altcoins.aggregatePerformance.performanceYTD.toFixed(2)}%\n• Commodities: ${data.assetClasses.commodities.aggregatePerformance.performanceYTD > 0 ? '+' : ''}${data.assetClasses.commodities.aggregatePerformance.performanceYTD.toFixed(2)}%\n• Indices: ${data.assetClasses.indices.aggregatePerformance.performanceYTD > 0 ? '+' : ''}${data.assetClasses.indices.aggregatePerformance.performanceYTD.toFixed(2)}%\n\n**Key Assets vs BTC (YTD):**\n${data.keyAssets.mstr ? `• MicroStrategy (MSTR): ${data.keyAssets.mstr.vsBTC.performanceYTD > 0 ? '+' : ''}${data.keyAssets.mstr.vsBTC.performanceYTD.toFixed(2)}% (${data.keyAssets.mstr.btcHoldings.toLocaleString()} BTC treasury)\n` : ''}${data.keyAssets.ethereum ? `• Ethereum (ETH): ${data.keyAssets.ethereum.vsBTC.performanceYTD > 0 ? '+' : ''}${data.keyAssets.ethereum.vsBTC.performanceYTD.toFixed(2)}%\n` : ''}${data.keyAssets.gold ? `• Gold: ${data.keyAssets.gold.vsBTC.performanceYTD > 0 ? '+' : ''}${data.keyAssets.gold.vsBTC.performanceYTD.toFixed(2)}%\n` : ''}\n**Historical Context:**\n• Bitcoin vs All Assets Since Inception: +${data.historical.inceptionToDate.btcOutperformance.toLocaleString()}%\n• ${data.historical.inceptionToDate.narrative}\n\n**Key Narratives:**\n${data.marketIntelligence.keyNarratives.map(narrative => `• ${narrative}`).join('\n')}\n\n*Last Updated: ${data.lastUpdated.toLocaleString()}*`;

      const content: Content = {
        text: responseText,
        actions: ["GET_BTC_BENCHMARK"],
        source: "btc-performance-action",
      };

      await callback(content);
      return content;
    } catch (error) {
      const errorContent: Content = {
        text: `❌ BTC Benchmark failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        actions: ["GET_BTC_BENCHMARK"],
        source: "btc-performance-action",
      };
      await callback(errorContent);
      return errorContent;
    }
  },
};

/**
 * Get specific asset performance vs BTC
 */
export const getAssetPerformanceAction: Action = {
  name: "GET_ASSET_PERFORMANCE",
  similes: ["ASSET_PERFORMANCE", "STOCK_PERFORMANCE", "CRYPTO_PERFORMANCE"],
  description: "Get detailed performance analysis of a specific asset vs Bitcoin.",

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    const assetSymbols = ['mstr', 'tsla', 'eth', 'btc', 'gold', 'spy', 'qqq', 'aapl', 'msft', 'googl'];
    return assetSymbols.some(symbol => text.includes(symbol)) && (text.includes("performance") || text.includes("vs btc") || text.includes("vs bitcoin"));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[],
  ) => {
    try {
      // Extract symbol from message
      const text = message.content?.text?.toLowerCase() || "";
      const assetSymbols = ['mstr', 'tsla', 'eth', 'btc', 'gold', 'spy', 'qqq', 'aapl', 'msft', 'googl'];
      const symbol = assetSymbols.find(s => text.includes(s))?.toUpperCase();
      
      if (!symbol) {
        const errorContent: Content = {
          text: "❌ Please specify an asset symbol (e.g., MSTR, TSLA, ETH, BTC, GOLD)",
          actions: ["GET_ASSET_PERFORMANCE"],
          source: "btc-performance-action",
        };
        await callback(errorContent);
        return errorContent;
      }

      const btcPerformanceService = runtime.getService("btc-performance") as unknown as BTCPerformanceService;
      
      if (!btcPerformanceService) {
        const errorContent: Content = {
          text: "❌ BTC Performance Service not available",
          actions: ["GET_ASSET_PERFORMANCE"],
          source: "btc-performance-action",
        };
        await callback(errorContent);
        return errorContent;
      }

      const response = await btcPerformanceService.getAssetPerformance(symbol);
      
      if (!response.success || !response.data) {
        const errorContent: Content = {
          text: `❌ Asset ${symbol} not found: ${response.error || "Unknown error"}`,
          actions: ["GET_ASSET_PERFORMANCE"],
          source: "btc-performance-action",
        };
        await callback(errorContent);
        return errorContent;
      }

      const asset = response.data;
      
      const performanceMessage = asset.vsBTC.outperformingBTC 
        ? `${asset.symbol} is outperforming Bitcoin by ${asset.vsBTC.performanceYTD.toFixed(2)}% YTD`
        : `${asset.symbol} is underperforming Bitcoin by ${Math.abs(asset.vsBTC.performanceYTD).toFixed(2)}% YTD`;

      const responseText = `📊 **${asset.symbol} vs Bitcoin Analysis** 📊\n\n**Asset Info:**\n• Name: ${asset.name}\n• Price: $${asset.price.toLocaleString()}\n• Market Cap: $${(asset.marketCap / 1e9).toFixed(2)}B\n• Category: ${asset.category}\n\n**Performance vs BTC:**\n• 24h: ${asset.vsBTC.performance24h > 0 ? '+' : ''}${asset.vsBTC.performance24h.toFixed(2)}%\n• 7d: ${asset.vsBTC.performance7d > 0 ? '+' : ''}${asset.vsBTC.performance7d.toFixed(2)}%\n• 30d: ${asset.vsBTC.performance30d > 0 ? '+' : ''}${asset.vsBTC.performance30d.toFixed(2)}%\n• YTD: ${asset.vsBTC.performanceYTD > 0 ? '+' : ''}${asset.vsBTC.performanceYTD.toFixed(2)}%\n• Since BTC Inception: ${asset.vsBTC.performanceInception > 0 ? '+' : ''}${asset.vsBTC.performanceInception.toFixed(2)}%\n\n**Metrics:**\n• Outperforming BTC: ${asset.vsBTC.outperformingBTC ? 'Yes' : 'No'}\n• Rank vs Tracked Assets: #${asset.vsBTC.rank}\n• Volatility vs BTC: ${asset.vsBTC.volatilityVsBTC.toFixed(2)}x\n• Correlation with BTC: ${(asset.vsBTC.correlationWithBTC * 100).toFixed(1)}%\n\n**Analysis:**\n• ${asset.vsBTC.narrative}\n• ${asset.narrative}\n\n**Key Drivers:**\n${asset.vsBTC.keyDrivers.map(driver => `• ${driver}`).join('\n')}\n\n*Last Updated: ${asset.lastUpdated.toLocaleString()}*`;

      const content: Content = {
        text: responseText,
        actions: ["GET_ASSET_PERFORMANCE"],
        source: "btc-performance-action",
      };

      await callback(content);
      return content;
    } catch (error) {
      const errorContent: Content = {
        text: `❌ Asset Performance failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        actions: ["GET_ASSET_PERFORMANCE"],
        source: "btc-performance-action",
      };
      await callback(errorContent);
      return errorContent;
    }
  },
};

/**
 * Get top performers vs BTC
 */
export const getTopPerformersAction: Action = {
  name: "GET_TOP_PERFORMERS",
  similes: ["TOP_PERFORMERS", "BEST_PERFORMERS", "OUTPERFORMERS"],
  description: "Get list of top performing assets vs Bitcoin.",

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return text.includes("top") && (text.includes("performer") || text.includes("best") || text.includes("outperform"));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[],
  ) => {
    try {
      const btcPerformanceService = runtime.getService("btc-performance") as unknown as BTCPerformanceService;
      
      if (!btcPerformanceService) {
        const errorContent: Content = {
          text: "❌ BTC Performance Service not available",
          actions: ["GET_TOP_PERFORMERS"],
          source: "btc-performance-action",
        };
        await callback(errorContent);
        return errorContent;
      }

      const topPerformers = await btcPerformanceService.getTopPerformers(10);
      
      if (topPerformers.length === 0) {
        const errorContent: Content = {
          text: "❌ No top performers data available",
          actions: ["GET_TOP_PERFORMERS"],
          source: "btc-performance-action",
        };
        await callback(errorContent);
        return errorContent;
      }

      const averagePerformance = (topPerformers.reduce((sum, asset) => sum + asset.vsBTC.performanceYTD, 0) / topPerformers.length).toFixed(2);

      const responseText = `🏆 **Top 10 Performers vs Bitcoin (YTD)** 🏆\n\n${topPerformers.map((asset, index) => {
        const emoji = asset.vsBTC.performanceYTD > 20 ? '🚀' : asset.vsBTC.performanceYTD > 10 ? '🟢' : '📈';
        return `${index + 1}. ${emoji} **${asset.symbol}** (${asset.name}): ${asset.vsBTC.performanceYTD > 0 ? '+' : ''}${asset.vsBTC.performanceYTD.toFixed(2)}%`;
      }).join('\n')}\n\n**Summary:**\n• Best Performer: ${topPerformers[0].symbol} (+${topPerformers[0].vsBTC.performanceYTD.toFixed(2)}%)\n• Average Outperformance: ${averagePerformance}%\n• Categories: ${[...new Set(topPerformers.map(asset => asset.category))].join(', ')}\n\n**Insight:** These assets are outperforming Bitcoin in the current market cycle. Consider whether this represents sustainable outperformance or temporary rotation.`;

      const content: Content = {
        text: responseText,
        actions: ["GET_TOP_PERFORMERS"],
        source: "btc-performance-action",
      };

      await callback(content);
      return content;
    } catch (error) {
      const errorContent: Content = {
        text: `❌ Top Performers failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        actions: ["GET_TOP_PERFORMERS"],
        source: "btc-performance-action",
      };
      await callback(errorContent);
      return errorContent;
    }
  },
};

/**
 * Get underperformers vs BTC
 */
export const getUnderperformersAction: Action = {
  name: "GET_UNDERPERFORMERS",
  similes: ["UNDERPERFORMERS", "WORST_PERFORMERS", "LAGGARDS"],
  description: "Get list of assets underperforming vs Bitcoin.",

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return text.includes("underperform") || text.includes("worst") || text.includes("laggard");
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[],
  ) => {
    try {
      const btcPerformanceService = runtime.getService("btc-performance") as unknown as BTCPerformanceService;
      
      if (!btcPerformanceService) {
        const errorContent: Content = {
          text: "❌ BTC Performance Service not available",
          actions: ["GET_UNDERPERFORMERS"],
          source: "btc-performance-action",
        };
        await callback(errorContent);
        return errorContent;
      }

      const underperformers = await btcPerformanceService.getUnderperformers(10);
      
      if (underperformers.length === 0) {
        const errorContent: Content = {
          text: "❌ No underperformers data available",
          actions: ["GET_UNDERPERFORMERS"],
          source: "btc-performance-action",
        };
        await callback(errorContent);
        return errorContent;
      }

      const averageUnderperformance = (underperformers.reduce((sum, asset) => sum + asset.vsBTC.performanceYTD, 0) / underperformers.length).toFixed(2);

      const responseText = `📉 **Top 10 Underperformers vs Bitcoin (YTD)** 📉\n\n${underperformers.map((asset, index) => {
        const emoji = asset.vsBTC.performanceYTD < -20 ? '💥' : asset.vsBTC.performanceYTD < -10 ? '🔴' : '📉';
        return `${index + 1}. ${emoji} **${asset.symbol}** (${asset.name}): ${asset.vsBTC.performanceYTD.toFixed(2)}%`;
      }).join('\n')}\n\n**Summary:**\n• Worst Performer: ${underperformers[0].symbol} (${underperformers[0].vsBTC.performanceYTD.toFixed(2)}%)\n• Average Underperformance: ${averageUnderperformance}%\n• Categories: ${[...new Set(underperformers.map(asset => asset.category))].join(', ')}\n\n**Insight:** These assets are underperforming Bitcoin significantly. This demonstrates Bitcoin's strength as the benchmark asset.`;

      const content: Content = {
        text: responseText,
        actions: ["GET_UNDERPERFORMERS"],
        source: "btc-performance-action",
      };

      await callback(content);
      return content;
    } catch (error) {
      const errorContent: Content = {
        text: `❌ Underperformers failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        actions: ["GET_UNDERPERFORMERS"],
        source: "btc-performance-action",
      };
      await callback(errorContent);
      return errorContent;
    }
  },
}; 