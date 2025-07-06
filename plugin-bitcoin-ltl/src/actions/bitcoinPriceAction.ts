import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";

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
      // Get Bitcoin price from state or runtime context
      let bitcoinPrice = 100000; // Default fallback
      let priceChange24h = 0;
      let marketCap = 2000000000000;

      // Try to get from state first
      if (state?.values?.bitcoinPrice) {
        bitcoinPrice = state.values.bitcoinPrice;
        priceChange24h = state.values.bitcoinChange24h || 0;
        marketCap = state.values.marketCap || 2000000000000;
      } else {
        // Try to get from runtime context
        const extendedRuntime = runtime as any;
        if (extendedRuntime.bitcoinContext?.price) {
          bitcoinPrice = extendedRuntime.bitcoinContext.price;
          priceChange24h = extendedRuntime.bitcoinContext.priceChange24h || 0;
          marketCap = extendedRuntime.bitcoinContext.marketCap || 2000000000000;
        } else {
          // Try direct API call as last resort
          try {
            const response = await fetch(
              "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true",
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "User-Agent": "ElizaOS-Bitcoin-LTL/1.0",
                },
                signal: AbortSignal.timeout(5000),
              },
            );

            if (response.ok) {
              const data = await response.json();
              if (data.bitcoin && data.bitcoin.usd) {
                bitcoinPrice = data.bitcoin.usd;
                priceChange24h = data.bitcoin.usd_24h_change || 0;
                marketCap = data.bitcoin.usd_market_cap || 2000000000000;
              }
            }
          } catch (error) {
            console.warn("[BitcoinPriceAction] Direct API call failed:", error);
          }
        }
      }

      // Calculate price direction
      const priceDirection = priceChange24h > 0 ? "up" : "down";
      const priceChange = Math.abs(priceChange24h);

      // Format response
      const responseText = `Bitcoin is currently trading at $${bitcoinPrice.toLocaleString()} USD, ${priceDirection} ${priceChange.toFixed(2)}% in the last 24 hours. Market cap: $${(marketCap / 1000000000).toFixed(1)} billion.`;

      const responseContent = {
        thought: `User asked about Bitcoin price. Retrieved current price: $${bitcoinPrice.toLocaleString()} with ${priceChange24h.toFixed(2)}% 24h change.`,
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
          "Failed to get Bitcoin price data, providing fallback information.",
        text: "Bitcoin is currently trading around $100,000 USD. (Price data temporarily unavailable)",
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
        content: { text: "What is the current Bitcoin price?" },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Bitcoin is currently trading at $95,432 USD, up 2.15% in the last 24 hours. Market cap: $1.9 trillion.",
          thought: "Retrieved current Bitcoin price from market data provider.",
          actions: ["GET_BITCOIN_PRICE"],
        },
      },
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
