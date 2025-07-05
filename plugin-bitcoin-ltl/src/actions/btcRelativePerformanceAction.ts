import { Action, IAgentRuntime, Memory, State, HandlerCallback, ActionExample } from '@elizaos/core';
import { RealTimeDataService } from '../services/RealTimeDataService';
import { Top100VsBtcData } from '../services/RealTimeDataService';

export const btcRelativePerformanceAction: Action = {
  name: "BTC_RELATIVE_PERFORMANCE",
  similes: [
    "BITCOIN_RELATIVE_PERFORMANCE",
    "ALTCOINS_VS_BTC",
    "COINS_OUTPERFORMING_BITCOIN",
    "BTC_OUTPERFORMERS",
    "RELATIVE_PERFORMANCE_VS_BITCOIN"
  ],
  description: `Get altcoins that are outperforming Bitcoin on 7-day basis, showing relative performance in percentage points. 
  Similar to the website's most-watched page showing which top 200 altcoins are beating Bitcoin.
  Excludes stablecoins and focuses on meaningful relative performance data.`,
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return true;
  },
  
  examples: [
    [
      {
        name: "{{user1}}",
        content: {
          text: "Show me which altcoins are outperforming Bitcoin this week"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "Based on the latest 7-day performance data, here are the top altcoins outperforming Bitcoin:\n\n📊 **Top BTC Outperformers (7d)**\n\n1. **Ethereum (ETH)** - Rank #2\n   • +5.32% vs BTC (ETH: +8.45%, BTC: +3.13%)\n   • Current Price: $3,245\n\n2. **Solana (SOL)** - Rank #5\n   • +12.87% vs BTC (SOL: +15.98%, BTC: +3.11%)\n   • Current Price: $198.45\n\n3. **Binance Coin (BNB)** - Rank #4\n   • +3.21% vs BTC (BNB: +6.34%, BTC: +3.13%)\n   • Current Price: $652.92\n\n**Summary:** 67 out of 186 altcoins are outperforming Bitcoin this week, with an average relative performance of +2.15%",
          actions: ["BTC_RELATIVE_PERFORMANCE"]
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "What coins are beating Bitcoin performance right now?"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "Here are the current BTC outperformers based on 7-day relative performance:\n\n🚀 **Bitcoin Outperformers**\n\n• **Top Performer:** Solana (SOL) - +15.34% vs BTC\n• **Strong Performer:** Ethereum (ETH) - +7.89% vs BTC\n• **Solid Performer:** Cardano (ADA) - +4.23% vs BTC\n\n📈 **Market Overview:**\n• 73/189 altcoins outperforming Bitcoin\n• Average relative performance: +1.87%\n• Bitcoin 7d: +2.34%\n\n💡 These coins are showing stronger momentum than Bitcoin over the past week, indicating potential alpha opportunities.",
          actions: ["BTC_RELATIVE_PERFORMANCE"]
        }
      }
    ]
  ],

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: { [key: string]: unknown },
    callback: HandlerCallback
  ) => {
    try {
      const realTimeDataService = runtime.getService('real-time-data') as RealTimeDataService;
      
      if (!realTimeDataService) {
        callback({
          text: "❌ Market data service unavailable",
          content: { error: "Service not found" }
        });
        return;
      }

      // Get the Top 200 vs BTC data (same as website)
      let btcData = realTimeDataService.getTop100VsBtcData();
      if (!btcData) {
        btcData = await realTimeDataService.forceTop100VsBtcUpdate();
      }

      if (!btcData) {
        callback({
          text: "❌ Unable to fetch BTC relative performance data",
          content: { error: "Data unavailable" }
        });
        return;
      }

      // Get top performers (outperforming BTC over 7d)
      const topPerformers = btcData.outperforming.slice(0, 8); // Show top 8 like website
      const totalOutperforming = btcData.outperformingCount;
      const totalCoins = btcData.totalCoins;
      const outperformingPercent = (totalOutperforming / totalCoins) * 100;

      const summary = {
        outperformingCount: totalOutperforming,
        totalCoins: totalCoins,
        averageRelativePerformance: btcData.averagePerformance,
        lastUpdated: btcData.lastUpdated
      };

      let response = `**🪙 ALTCOINS OUTPERFORMING BITCOIN (7D)**\n\n`;
      
      // Market sentiment
      if (outperformingPercent > 50) {
        response += `🚀 **ALTSEASON DETECTED!** ${totalOutperforming}/${totalCoins} (${outperformingPercent.toFixed(1)}%) altcoins beating Bitcoin\n\n`;
      } else {
        response += `₿ **Bitcoin Dominance** - ${totalOutperforming}/${totalCoins} (${outperformingPercent.toFixed(1)}%) altcoins outperforming\n\n`;
      }

      // Show top performers with detailed data
      response += `**🏆 TOP OUTPERFORMERS (vs BTC 7d):**\n`;
      topPerformers.forEach((coin, index) => {
        const relativePerf = coin.btc_relative_performance_7d || 0;
        const coinPerf7d = coin.price_change_percentage_7d_in_currency || 0;
        const price = coin.current_price || 0;
        const rank = coin.market_cap_rank || '?';

        response += `${index + 1}. **${coin.name} (${coin.symbol.toUpperCase()})** - #${rank}\n`;
        response += `   • **+${relativePerf.toFixed(2)}%** vs BTC (7d)\n`;
        response += `   • ${coin.symbol.toUpperCase()}: ${coinPerf7d >= 0 ? '+' : ''}${coinPerf7d.toFixed(2)}% (7d USD)\n`;
        response += `   • Price: $${price >= 1 ? price.toLocaleString() : price.toFixed(6)}\n\n`;
      });

      // Summary stats
      response += `📊 **MARKET SUMMARY:**\n`;
      response += `• **${totalOutperforming}/${totalCoins}** altcoins outperforming Bitcoin (7d)\n`;
      response += `• **Average relative performance:** ${summary.averageRelativePerformance >= 0 ? '+' : ''}${summary.averageRelativePerformance.toFixed(2)}%\n`;
      
      // Satoshi's perspective
      response += `\n**🧠 SATOSHI'S ANALYSIS:**\n`;
      if (outperformingPercent > 50) {
        response += `Altcoin momentum building, but remember: most altcoins are venture capital plays. `;
        response += `Bitcoin remains the monetary base layer. Use this strength to accumulate more Bitcoin.`;
      } else {
        response += `Bitcoin dominance continues as digital gold thesis strengthens. `;
        response += `The market recognizes store of value over speculation. Stack sats.`;
      }

      response += `\n\n*Updated: ${summary.lastUpdated.toLocaleString()}*`;

      callback({
        text: response,
        content: {
          btcRelativePerformance: {
            topPerformers,
            summary,
            data: btcData
          }
        }
      });

    } catch (error) {
      console.error('Error in BTC relative performance action:', error);
      callback({
        text: "❌ Error fetching BTC relative performance data",
        content: { error: error.message }
      });
    }
  }
}; 