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
 * Freedom Mathematics Action
 * Calculates specific BTC amounts needed for financial freedom
 */
export const freedomMathematicsAction: Action = {
  name: "FREEDOM_MATHEMATICS",
  similes: [
    "CALCULATE_FREEDOM",
    "BTC_NEEDED",
    "FREEDOM_CALCULATION",
    "BITCOIN_MATH",
    "FREEDOM_TARGET",
  ],
  description:
    "Calculates Bitcoin amounts needed for financial freedom at different price targets",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      (text.includes("freedom") ||
        text.includes("mathematics") ||
        text.includes("calculate") ||
        text.includes("how much")) &&
      (text.includes("btc") ||
        text.includes("bitcoin") ||
        text.includes("need") ||
        text.includes("target"))
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
      const bitcoinDataService = runtime.getService(
        "bitcoin-data",
      ) as StarterService;

      if (!bitcoinDataService) {
        throw new Error("StarterService not available");
      }

      // Extract target freedom amount from message if specified
      const text = message.content.text;
      const millionMatch = text.match(/(\d+)\s*million/i);
      const targetFreedom = millionMatch
        ? parseInt(millionMatch[1]) * 1000000
        : 10000000;

      const freedomMath =
        await bitcoinDataService.calculateFreedomMathematics(targetFreedom);

      const analysis = `
🔢 **BITCOIN FREEDOM MATHEMATICS**

**Target Freedom:** $${targetFreedom.toLocaleString()}

**Current Analysis (Bitcoin at $${freedomMath.currentPrice.toLocaleString()}):**
• **Exact BTC Needed:** ${freedomMath.btcNeeded.toFixed(2)} BTC
• **Conservative Target:** ${freedomMath.safeLevels.conservative.toFixed(2)} BTC (50% safety buffer)
• **Moderate Target:** ${freedomMath.safeLevels.moderate.toFixed(2)} BTC (25% safety buffer)
• **Aggressive Target:** ${freedomMath.safeLevels.aggressive.toFixed(2)} BTC (exact calculation)

**Thesis Price Scenarios:**

**${freedomMath.scenarios.thesis250k.timeline} → $${freedomMath.scenarios.thesis250k.price.toLocaleString()} BTC:**
Need only **${freedomMath.scenarios.thesis250k.btc.toFixed(1)} BTC** for $${targetFreedom.toLocaleString()}

**${freedomMath.scenarios.thesis500k.timeline} → $${freedomMath.scenarios.thesis500k.price.toLocaleString()} BTC:**
Need only **${freedomMath.scenarios.thesis500k.btc.toFixed(1)} BTC** for $${targetFreedom.toLocaleString()}

**${freedomMath.scenarios.thesis1m.timeline} → $${freedomMath.scenarios.thesis1m.price.toLocaleString()} BTC:**
Need only **${freedomMath.scenarios.thesis1m.btc.toFixed(1)} BTC** for $${targetFreedom.toLocaleString()}

**Strategic Insight:**
The earlier you accumulate, the fewer Bitcoin needed for freedom. At thesis prices, single-digit Bitcoin holdings become generational wealth. Less than zero point three BTC per millionaire worldwide.

**Implementation Framework:**
• **Phase 1:** Accumulate toward conservative target
• **Phase 2:** Secure cold storage and custody
• **Phase 3:** Deploy yield strategies on portion
• **Phase 4:** Build sovereign living infrastructure

**Risk Considerations:**
These calculations assume thesis progression occurs. Bitcoin volatility means twenty to thirty percent drawdowns remain possible despite institutional adoption. Plan accordingly.

*Freedom is mathematical. Calculate your target, execute your plan, verify through accumulation.*
      `;

      const responseContent: Content = {
        text: analysis.trim(),
        actions: ["FREEDOM_MATHEMATICS"],
        source: message.content.source || "freedom-mathematics",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error("Error in freedom mathematics action:", error);

      const errorContent: Content = {
        text: "Unable to calculate freedom mathematics at this time. Mathematical certainty requires reliable data inputs.",
        actions: ["FREEDOM_MATHEMATICS"],
        source: message.content.source || "freedom-mathematics",
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: "user",
        content: {
          text: "How much Bitcoin do I need for financial freedom?",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "With Bitcoin's historical forty-four percent compound annual growth rate, six point one five plus BTC enables freedom by twenty twenty-five. At current thesis prices, single-digit Bitcoin holdings become generational wealth. Less than zero point three BTC per millionaire worldwide.",
          actions: ["FREEDOM_MATHEMATICS"],
        },
      },
    ],
    [
      {
        name: "user",
        content: {
          text: "Calculate freedom mathematics for 5 million dollars",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "🔢 **BITCOIN FREEDOM MATHEMATICS**\n\n**Target Freedom:** $5,000,000\n\n**Current Analysis (Bitcoin at $100,000):**\n• **Exact BTC Needed:** 50.00 BTC\n• **Conservative Target:** 75.00 BTC (50% safety buffer)\n\n**Thesis Price Scenarios:**\n• **2-3 years → $250,000 BTC:** Need only 20.0 BTC\n• **3-5 years → $500,000 BTC:** Need only 10.0 BTC\n• **5-10 years → $1,000,000 BTC:** Need only 5.0 BTC",
          actions: ["FREEDOM_MATHEMATICS"],
        },
      },
    ],
  ],
}; 