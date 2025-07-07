import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
  logger,
} from "@elizaos/core";

/**
 * Altcoin BTC Performance Analysis Action
 * Analyzes which altcoins are outperforming Bitcoin and provides market insights
 */
export const altcoinBTCPerformanceAction: Action = {
  name: "ALTCOIN_BTC_PERFORMANCE",
  similes: [
    "ALTCOIN_ANALYSIS",
    "ALTCOIN_OUTPERFORMANCE",
    "CRYPTO_PERFORMANCE",
    "ALTSEASON_CHECK",
    "ALTCOIN_VS_BTC",
  ],
  description:
    "Analyzes altcoin performance denominated in Bitcoin to identify outperformers and market trends",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      (text.includes("altcoin") ||
        text.includes("altseason") ||
        text.includes("outperform") ||
        text.includes("crypto") ||
        text.includes("vs btc") ||
        text.includes("against bitcoin")) &&
      (text.includes("performance") ||
        text.includes("analysis") ||
        text.includes("tracking") ||
        text.includes("monitor") ||
        text.includes("compare"))
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[],
  ) => {
    try {
      logger.info("Generating altcoin BTC performance analysis");

      // Get altcoin BTC performance data from providers
      const providers = runtime.providers || [];
      const altcoinProvider = providers.find(
        (p) => p.name === "ALTCOIN_BTC_PERFORMANCE_PROVIDER",
      );

      if (!altcoinProvider) {
        throw new Error("Altcoin BTC performance provider not available");
      }

      const performanceData = await altcoinProvider.get(runtime, message, state);

      const analysis = `
🪙 **ALTCOIN BTC OUTPERFORMANCE ANALYSIS**

${performanceData.text}

**Market Context:**
${
  performanceData.values.summary.outperforming24h >
  performanceData.values.summary.totalTracked / 2
    ? `🚀 **ALTSEASON SIGNALS DETECTED**
• ${performanceData.values.summary.outperforming24h}/${performanceData.values.summary.totalTracked} coins beating Bitcoin (24h)
• Market breadth suggests risk-on sentiment
• Consider this a temporary deviation from Bitcoin dominance
• Altcoins often outperform in late bull market phases`
    : `₿ **BITCOIN DOMINANCE CONTINUES**
• Only ${performanceData.values.summary.outperforming24h}/${performanceData.values.summary.totalTracked} coins beating Bitcoin (24h)
• Flight to quality favoring Bitcoin as digital gold
• Institutional demand absorbing altcoin volatility
• Classic pattern: Bitcoin leads, altcoins follow`
}

**Strategic Implications:**
• **Bitcoin-First Strategy**: Altcoin outperformance often temporary
• **Risk Management**: Most altcoins are beta plays on Bitcoin
• **Exit Strategy**: Altcoin gains best rotated back into Bitcoin
• **Market Timing**: Use outperformance data for portfolio rebalancing

**Investment Philosophy:**
Altcoins are venture capital plays on crypto infrastructure and applications. Bitcoin is monetary infrastructure. Track altcoin performance for market sentiment, but remember: the exit is always Bitcoin.

**Performance Trends:**
• 7-day outperformers: ${performanceData.values.summary.outperforming7d}/${performanceData.values.summary.totalTracked}
• 30-day outperformers: ${performanceData.values.summary.outperforming30d}/${performanceData.values.summary.totalTracked}
• Average vs BTC: ${performanceData.values.summary.avgBTCPerformance24h.toFixed(2)}%

*Analysis generated: ${new Date().toISOString()}*
      `;

      const responseContent: Content = {
        text: analysis.trim(),
        actions: ["ALTCOIN_BTC_PERFORMANCE"],
        source: message.content.source || "altcoin-performance",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error("Error in altcoin BTC performance analysis:", error);

      const errorContent: Content = {
        text: "Unable to analyze altcoin BTC performance at this time. Remember: altcoins are distractions from the main event—Bitcoin. The exit is, and always has been, Bitcoin.",
        actions: ["ALTCOIN_BTC_PERFORMANCE"],
        source: message.content.source || "altcoin-performance",
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: "{{name1}}",
        content: { text: "Which altcoins are outperforming Bitcoin?" }
      },
      {
        name: "{{name2}}",
        content: {
          text: "🪙 **ALTCOIN BTC OUTPERFORMANCE ANALYSIS**\n\n**Bitcoin Price:** [Real-time data]\n\n**Top Outperformers (24h vs BTC):**\n• ETH (Ethereum): [change]% vs BTC\n• SOL (Solana): [change]% vs BTC\n• ADA (Cardano): [change]% vs BTC\n\n**Summary:**\n• [N]/[N] coins outperforming BTC (24h)\n• [N] coins outperforming BTC (7d)\n• [N] coins outperforming BTC (30d)",
          actions: ["ALTCOIN_BTC_PERFORMANCE"]
        }
      }
    ]
  ],
}; 