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
 * Bitcoin Thesis Status Action
 * Provides detailed status update on the 100K BTC Holders thesis
 */
export const bitcoinThesisStatusAction: Action = {
  name: "BITCOIN_THESIS_STATUS",
  similes: ["THESIS_STATUS", "THESIS_UPDATE", "BITCOIN_THESIS", "100K_THESIS"],
  description: "Provides detailed status update on the 100K BTC Holders wealth creation thesis",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("thesis") ||
      text.includes("100k") ||
      text.includes("millionaire") ||
      text.includes("holders") ||
      text.includes("wealth creation") ||
      text.includes("bitcoin holders")
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
      logger.info("Generating Bitcoin thesis status update");

      // Get Bitcoin data service
      const bitcoinService = runtime.getService("bitcoin-data") as StarterService;
      
      if (!bitcoinService) {
        throw new Error("Bitcoin data service not available");
      }

      // Get current Bitcoin data
      const currentPrice = await bitcoinService.getBitcoinPrice();
      const thesisData = await bitcoinService.calculateThesisMetrics(currentPrice);

      const statusUpdate = `
🎯 **BITCOIN THESIS STATUS UPDATE**

**The 100K BTC Holders Wealth Creation Thesis**

**Current Progress:**
${thesisData.progressPercentage.toFixed(1)}% progress toward $1M target. Estimated ${thesisData.estimatedHolders.toLocaleString()} addresses with 10+ BTC (${thesisData.holdersProgress.toFixed(1)}% of 100K target). Need ${thesisData.multiplierNeeded.toFixed(1)}x appreciation requiring ${thesisData.requiredCAGR.tenYear.toFixed(1)}% CAGR over 10 years.

**Thesis Framework:**
• **Target**: 100,000 people with 10+ BTC → $10M+ net worth
• **Price Target**: $1,000,000 BTC (10x from current $${currentPrice.toLocaleString()})
• **Timeline**: 5-10 years
• **Wealth Creation**: New class of decentralized HNWIs

**Key Catalysts Tracking:**
1. **Sovereign Adoption** 🏛️
   - U.S. Strategic Bitcoin Reserve proposals
   - Nation-state competition for Bitcoin reserves
   - Central bank digital currency alternatives

2. **Institutional Infrastructure** 🏦
   - Banking Bitcoin services expansion
   - Corporate treasury adoption (MicroStrategy model)
   - Bitcoin ETF ecosystem growth

3. **Regulatory Clarity** ⚖️
   - EU MiCA framework implementation
   - U.S. crypto-friendly policies
   - Institutional custody regulations

4. **Market Dynamics** 📈
   - OG whale distribution to institutions
   - Supply scarcity (21M cap, 4M lost)
   - New buyer categories entering

**Risk Assessment:**
• Execution risk on sovereign adoption
• Macroeconomic headwinds
• Regulatory reversal potential
• Market volatility during appreciation

**Bottom Line:**
Thesis tracking ahead of schedule with institutional adoption accelerating. Multiple catalysts converging could accelerate timeline to $1M BTC target.

*Status update: ${new Date().toISOString()}*
      `;

      const responseContent: Content = {
        text: statusUpdate.trim(),
        actions: ["BITCOIN_THESIS_STATUS"],
        source: message.content.source || "bitcoin-thesis",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error("Error in Bitcoin thesis status:", error);
      
      const errorContent: Content = {
        text: "Unable to provide Bitcoin thesis status at this time. Please try again later.",
        actions: ["BITCOIN_THESIS_STATUS"],
        source: message.content.source || "bitcoin-thesis",
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
          text: "What is the current status of the Bitcoin thesis?",
        },
      },
      {
        name: "BitcoinExpert",
        content: {
          text: "🎯 **BITCOIN THESIS STATUS UPDATE**\n\nThe 100K BTC Holders Wealth Creation Thesis\n\nCurrent Progress: 10.0% progress toward $1M target. Estimated 75,000 addresses with 10+ BTC (75.0% of 100K target). Need 10.0x appreciation requiring 25.9% CAGR over 10 years.\n\nThesis Framework: 100,000 people with 10+ BTC → $10M+ net worth. Price Target: $1,000,000 BTC. Timeline: 5-10 years.\n\nKey Catalysts: Sovereign adoption, institutional infrastructure, regulatory clarity, market dynamics.\n\nBottom Line: Thesis tracking ahead of schedule with institutional adoption accelerating.",
          actions: ["BITCOIN_THESIS_STATUS"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "How is the 100K Bitcoin holders thesis progressing?",
        },
      },
      {
        name: "BitcoinExpert",
        content: {
          text: "🎯 **BITCOIN THESIS STATUS UPDATE**\n\n100K BTC Holders Wealth Creation Thesis\n\nProgress: 9.5% toward $1M target. 75,000 addresses with 10+ BTC (75% of target). Need 10.5x appreciation requiring 26.2% CAGR over 10 years.\n\nFramework: 100K people with 10+ BTC → $10M+ net worth. Target: $1M BTC in 5-10 years.\n\nCatalysts: U.S. Strategic Reserve, banking services, EU MiCA, institutional demand.\n\nStatus: Ahead of schedule with accelerating institutional adoption.",
          actions: ["BITCOIN_THESIS_STATUS"],
        },
      },
    ],
  ],
}; 