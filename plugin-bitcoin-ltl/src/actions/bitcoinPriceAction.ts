import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { BitcoinNetworkDataService } from "../services/BitcoinNetworkDataService";

/**
 * Bitcoin Price Action - Simple action to get current Bitcoin price
 * This action demonstrates how to access Bitcoin price data
 */
export const bitcoinPriceAction: Action = {
  name: "GET_BITCOIN_PRICE",
  similes: ["BITCOIN_PRICE", "BTC_PRICE", "CHECK_BITCOIN", "BITCOIN_STATUS"],
  description: "Get the current Bitcoin price and market data",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("bitcoin") ||
      text.includes("btc") ||
      text.includes("price") ||
      text.includes("how much") ||
      text.includes("what is bitcoin worth")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback,
  ) => {
    try {
      // Use the real-time backend service for Bitcoin price
      const bitcoinService = runtime.getService("bitcoin-network-data") as BitcoinNetworkDataService;
      let bitcoinPrice: number | null | undefined = null;
      let priceChange24h: number | null | undefined = null;
      let marketCap: number | null | undefined = null;

      if (bitcoinService && typeof bitcoinService.getComprehensiveBitcoinData === "function") {
        const data = bitcoinService.getComprehensiveBitcoinData();
        bitcoinPrice = data?.price?.usd;
        priceChange24h = data?.price?.change24h;
        marketCap = data?.network?.marketCap;
      }

      // Fallbacks if data is missing
      let priceDisplay = bitcoinPrice && !isNaN(bitcoinPrice) ? `$${bitcoinPrice.toLocaleString()}` : "priceless";
      let changeDisplay = (typeof priceChange24h === "number" && !isNaN(priceChange24h)) ? `${priceChange24h > 0 ? "+" : ""}${priceChange24h.toFixed(2)}%` : "N/A";
      let marketCapDisplay = marketCap && !isNaN(marketCap) ? `$${(marketCap / 1e9).toFixed(1)} billion` : "N/A";

      // Format response
      const responseText = bitcoinPrice && !isNaN(bitcoinPrice)
        ? `Bitcoin is currently trading at ${priceDisplay} USD, 24h change: ${changeDisplay}. Market cap: ${marketCapDisplay}.`
        : `Bitcoin is priceless.`;

      const responseContent = {
        thought: `User asked about Bitcoin price. Retrieved current price: ${priceDisplay} with ${changeDisplay} 24h change from backend service.`,
        text: responseText,
        actions: ["GET_BITCOIN_PRICE"],
      };

      if (callback) {
        await callback(responseContent);
      }

      return true;
    } catch (error) {
      console.error("[BitcoinPriceAction] Error:", error);

      const errorResponse = {
        thought:
          "Failed to get Bitcoin price data from backend service, providing fallback information.",
        text: "Bitcoin price data is temporarily unavailable.",
        actions: ["GET_BITCOIN_PRICE"],
      };

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },

  examples: [
    [
      {
        name: "{{name1}}",
        content: { text: "What is the current Bitcoin price?" }
      },
      {
        name: "{{name2}}",
        content: {
          text: "Bitcoin is currently trading at [Real-time data] USD, [change] in the last 24 hours. Market cap: [Real-time data].",
          actions: ["BITCOIN_PRICE"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: { text: "How much is Bitcoin worth right now?" },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Bitcoin is currently worth $94,876 USD, down 1.23% in the last 24 hours. Market cap: $1.9 trillion.",
          thought:
            "User asked for current Bitcoin value, provided price and market data.",
          actions: ["GET_BITCOIN_PRICE"],
        },
      },
    ],
  ],
};
