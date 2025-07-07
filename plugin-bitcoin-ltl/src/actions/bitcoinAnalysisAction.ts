import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
  logger,
} from "@elizaos/core";
import { StarterService } from "../services/StarterService";

/**
 * Bitcoin Market Analysis Action
 * Generates comprehensive Bitcoin market analysis based on current data
 */
export const bitcoinAnalysisAction: Action = {
  name: "BITCOIN_MARKET_ANALYSIS",
  similes: ["ANALYZE_BITCOIN", "BITCOIN_ANALYSIS", "MARKET_ANALYSIS", "BTC_ANALYSIS"],
  description: "Generates comprehensive Bitcoin market analysis including price, trends, and thesis progress",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("bitcoin") &&
      (text.includes("analysis") ||
        text.includes("market") ||
        text.includes("price") ||
        text.includes("thesis") ||
        text.includes("overview") ||
        text.includes("summary"))
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
      logger.info("Generating Bitcoin market analysis");

      // Get Bitcoin data service
      const bitcoinService = runtime.getService("bitcoin-data") as StarterService;
      
      if (!bitcoinService) {
        throw new Error("Bitcoin data service not available");
      }

      // Get current Bitcoin data
      const priceData = await bitcoinService.getEnhancedMarketData();
      const thesisData = await bitcoinService.calculateThesisMetrics(priceData.price);

      const analysis = `
📊 **BITCOIN MARKET ANALYSIS**

**Current Status:**
Bitcoin is currently trading at $${priceData.price.toLocaleString()} with a market cap of $${(priceData.marketCap / 1e12).toFixed(2)}T. 24h change: ${priceData.priceChange24h.toFixed(2)}%. Current supply: ${(priceData.circulatingSupply / 1e6).toFixed(2)}M BTC out of 21M max supply.

**Thesis Progress:**
${thesisData.progressPercentage.toFixed(1)}% progress toward $1M target. Estimated ${thesisData.estimatedHolders.toLocaleString()} addresses with 10+ BTC (${thesisData.holdersProgress.toFixed(1)}% of 100K target). Need ${thesisData.multiplierNeeded.toFixed(1)}x appreciation requiring ${thesisData.requiredCAGR.tenYear.toFixed(1)}% CAGR over 10 years.

**Key Catalysts Monitoring:**
• Sovereign Adoption: U.S. Strategic Bitcoin Reserve discussions ongoing
• Institutional Infrastructure: Major banks launching Bitcoin services
• Regulatory Clarity: EU MiCA framework enabling institutional adoption
• Market Dynamics: Institutional demand absorbing whale selling pressure

**Risk Factors:**
• Macroeconomic headwinds affecting risk assets
• Regulatory uncertainty in key markets
• Potential volatility during major appreciation phases

**Investment Implications:**
The 100K BTC Holders thesis remains on track with institutional adoption accelerating. Path to $1M BTC depends on continued sovereign and corporate adoption scaling faster than the 21M supply constraint.

*Analysis generated: ${new Date().toISOString()}*
      `;

      const responseContent: Content = {
        text: analysis.trim(),
        actions: ["BITCOIN_MARKET_ANALYSIS"],
        source: message.content.source || "bitcoin-analysis",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error("Error in Bitcoin market analysis:", error);
      
      const errorContent: Content = {
        text: "Unable to generate Bitcoin market analysis at this time. Please try again later.",
        actions: ["BITCOIN_MARKET_ANALYSIS"],
        source: message.content.source || "bitcoin-analysis",
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "Give me a Bitcoin market analysis",
        },
      },
      {
        name: "BitcoinExpert",
        content: {
          text: "📊 **BITCOIN MARKET ANALYSIS**\n\nBitcoin is currently trading at $95,432 with a market cap of $1.9T. 24h change: +2.15%. 10.0% progress toward $1M target. Estimated 75,000 addresses with 10+ BTC (75.0% of 100K target).\n\nKey Catalysts: Sovereign adoption, institutional infrastructure, regulatory clarity, market dynamics.\n\nInvestment Implications: Thesis on track with institutional adoption accelerating.",
          actions: ["BITCOIN_MARKET_ANALYSIS"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "What's the current Bitcoin market overview?",
        },
      },
      {
        name: "BitcoinExpert",
        content: {
          text: "📊 **BITCOIN MARKET ANALYSIS**\n\nCurrent price: $94,876, market cap: $1.9T, 24h change: -1.23%. Thesis progress: 9.5% toward $1M target. 75,000 addresses with 10+ BTC (75% of target).\n\nCatalysts: U.S. Strategic Reserve discussions, banking services expansion, EU MiCA framework.\n\nPath to $1M depends on sovereign and corporate adoption scaling faster than 21M supply constraint.",
          actions: ["BITCOIN_MARKET_ANALYSIS"],
        },
      },
    ],
  ],
}; 