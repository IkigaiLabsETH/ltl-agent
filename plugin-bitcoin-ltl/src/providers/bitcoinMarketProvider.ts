import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

// Type for Bitcoin service
interface BitcoinService {
  getBitcoinPrice(): Promise<number>;
}

// Extend runtime type to include bitcoinContext
interface ExtendedRuntime extends IAgentRuntime {
  bitcoinContext?: {
    price: number;
    priceChange24h: number;
    marketCap: number;
    volume24h: number;
    lastUpdated: string;
  };
}

/**
 * Bitcoin Market Provider - Core Bitcoin market data
 * Bulletproof implementation with multiple fallbacks
 * Position: 0 (standard position for market data)
 */
export const bitcoinMarketProvider: Provider = {
  name: "bitcoinMarket",
  description:
    "Provides Bitcoin price, network health, and market sentiment data",
  position: 0, // Standard position for market data

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    try {
      // Get the Bitcoin service
      const bitcoinService = runtime.getService(
        "bitcoin-data",
      ) as unknown as BitcoinService;
      const extendedRuntime = runtime as ExtendedRuntime;

      let bitcoinPrice = 0; // Start with 0 to force real data fetch
      let priceChange24h = 0;
      let marketCap = 0;
      let volume24h = 0;

      // Try to get price from service first
      if (
        bitcoinService &&
        typeof bitcoinService.getBitcoinPrice === "function"
      ) {
        try {
          bitcoinPrice = await bitcoinService.getBitcoinPrice();
          console.log(
            `[BitcoinProvider] Got price from service: $${bitcoinPrice.toLocaleString()}`,
          );
        } catch (error) {
          console.warn(
            "[BitcoinProvider] Service price fetch failed, using fallback:",
            error.message,
          );
        }
      }

      // If service failed or returned invalid price, try direct API call
      if (!bitcoinPrice || bitcoinPrice <= 0 || bitcoinPrice > 1000000) {
        try {
          console.log(
            "[BitcoinProvider] Attempting direct CoinGecko API call...",
          );

          // Direct CoinGecko API call - no API key needed
          const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true",
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "User-Agent": "ElizaOS-Bitcoin-LTL/1.0",
              },
              signal: AbortSignal.timeout(10000), // 10 second timeout
            },
          );

          if (response.ok) {
            const data = await response.json();
            if (data.bitcoin && data.bitcoin.usd) {
              bitcoinPrice = data.bitcoin.usd;
              priceChange24h = data.bitcoin.usd_24h_change || 0;
              marketCap = data.bitcoin.usd_market_cap || 2000000000000;
              volume24h = data.bitcoin.usd_24h_vol || 50000000000;
              console.log(
                `[BitcoinProvider] Direct API success: $${bitcoinPrice.toLocaleString()}`,
              );
            }
          } else {
            console.warn(
              `[BitcoinProvider] Direct API failed with status: ${response.status}`,
            );
          }
        } catch (error) {
          console.warn(
            "[BitcoinProvider] Direct API call failed:",
            error.message,
          );
        }
      }

      // Final fallback: use cached price from runtime if available
      if (!bitcoinPrice || bitcoinPrice <= 0 || bitcoinPrice > 1000000) {
        if (
          extendedRuntime.bitcoinContext &&
          extendedRuntime.bitcoinContext.price &&
          extendedRuntime.bitcoinContext.price > 0
        ) {
          bitcoinPrice = extendedRuntime.bitcoinContext.price;
          console.log(
            `[BitcoinProvider] Using cached price: $${bitcoinPrice.toLocaleString()}`,
          );
        } else {
          // No valid price available - return error state
          console.warn(
            "[BitcoinProvider] No valid Bitcoin price available from any source",
          );
          throw new Error("Unable to fetch valid Bitcoin price data");
        }
      }

      // Calculate price direction
      const priceDirection = priceChange24h > 0 ? "up" : "down";
      const priceChange = Math.abs(priceChange24h);

      // Format market context
      const marketContext = `Bitcoin: $${bitcoinPrice.toLocaleString()} (${priceDirection} ${priceChange.toFixed(2)}% 24h). Market cap: $${(marketCap / 1000000000).toFixed(1)}B. Volume: $${(volume24h / 1000000000).toFixed(1)}B.`;

      // Store in runtime context for other components to use
      extendedRuntime.bitcoinContext = {
        price: bitcoinPrice,
        priceChange24h: priceChange24h,
        marketCap: marketCap,
        volume24h: volume24h,
        lastUpdated: new Date().toISOString(),
      };

      return {
        text: `Current Bitcoin status: ${marketContext}`,
        values: {
          bitcoinPrice: bitcoinPrice,
          bitcoinChange24h: priceChange24h,
          bitcoinPriceDirection: priceDirection,
          marketCap: marketCap,
          volume24h: volume24h,
          lastUpdated: new Date().toISOString(),
        },
        data: {
          bitcoinData: {
            price: bitcoinPrice,
            change24h: priceChange24h,
            marketCap: marketCap,
            volume24h: volume24h,
            lastUpdated: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      console.error("[BitcoinProvider] Critical error:", error);

      // Return error state instead of fake data
      return {
        text: "Bitcoin price data temporarily unavailable - please try again in a moment",
        values: {
          bitcoinPrice: null,
          bitcoinChange24h: null,
          bitcoinPriceDirection: "unknown",
          marketCap: null,
          volume24h: null,
          lastUpdated: new Date().toISOString(),
          bitcoinDataError: true,
        },
        data: {
          bitcoinData: {
            price: null,
            change24h: null,
            marketCap: null,
            volume24h: null,
            lastUpdated: new Date().toISOString(),
            error: error.message,
          },
        },
      };
    }
  },
};
