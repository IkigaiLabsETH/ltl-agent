import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
  logger,
} from "@elizaos/core";
import { retryOperation, fetchWithTimeout } from "../utils/networkUtils";
import { generateCorrelationId } from "../utils/loggingUtils";
import { CoinMarketData } from "../types/marketTypes";

/**
 * Individual Cryptocurrency Price Lookup Action
 * Gets current price for a specific cryptocurrency using public CoinGecko API
 */
export const cryptoPriceLookupAction: Action = {
  name: "CRYPTO_PRICE_LOOKUP",
  similes: [
    "CRYPTO_PRICE",
    "COIN_PRICE",
    "ETH_PRICE",
    "TOKEN_PRICE",
    "PRICE_CHECK",
    "CRYPTO_VALUE",
  ],
  description:
    "Gets current price for a specific cryptocurrency using public CoinGecko API",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    const hasSymbol =
      /\b(eth|ethereum|btc|bitcoin|ada|cardano|sol|solana|dot|polkadot|link|chainlink|uni|uniswap|aave|comp|compound|mkr|maker|snx|synthetix|doge|dogecoin|ltc|litecoin|bch|bitcoin cash|xrp|ripple|bnb|binance|usdt|tether|usdc|usd coin|dai|shib|shiba|matic|polygon|avax|avalanche|ftm|fantom|atom|cosmos|algo|algorand)\b/.test(
        text,
      );

    const hasPriceQuery =
      text.includes("price") ||
      text.includes("cost") ||
      text.includes("value") ||
      text.includes("worth");
    const hasCurrentQuery =
      text.includes("current") ||
      text.includes("now") ||
      text.includes("today") ||
      text.includes("latest");

    return (
      hasSymbol &&
      (hasPriceQuery ||
        hasCurrentQuery ||
        text.includes("what's") ||
        text.includes("how much"))
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
      const text = message.content.text.toLowerCase();
      logger.info("Processing crypto price lookup request");

      // Extract coin symbol from text
      const coinMatch = text.match(
        /\b(eth|ethereum|btc|bitcoin|ada|cardano|sol|solana|dot|polkadot|link|chainlink|uni|uniswap|aave|comp|compound|mkr|maker|snx|synthetix|doge|dogecoin|ltc|litecoin|bch|bitcoin cash|xrp|ripple|bnb|binance|usdt|tether|usdc|usd coin|dai|shib|shiba|matic|polygon|avax|avalanche|ftm|fantom|atom|cosmos|algo|algorand)\b/,
      );

      if (!coinMatch) {
        const responseContent: Content = {
          text: "Unable to identify the cryptocurrency. Please specify a valid coin symbol (e.g., ETH, BTC, SOL, ADA, etc.)",
          actions: ["CRYPTO_PRICE_LOOKUP"],
          source: message.content.source || "crypto-price-lookup",
        };
        await callback(responseContent);
        return responseContent;
      }

      const coinSymbol = coinMatch[1];

      // Map common names to CoinGecko IDs
      const coinIdMap: Record<string, string> = {
        eth: "ethereum",
        ethereum: "ethereum",
        btc: "bitcoin",
        bitcoin: "bitcoin",
        ada: "cardano",
        cardano: "cardano",
        sol: "solana",
        solana: "solana",
        dot: "polkadot",
        polkadot: "polkadot",
        link: "chainlink",
        chainlink: "chainlink",
        uni: "uniswap",
        uniswap: "uniswap",
        aave: "aave",
        comp: "compound-governance-token",
        compound: "compound-governance-token",
        mkr: "maker",
        maker: "maker",
        snx: "havven",
        synthetix: "havven",
        doge: "dogecoin",
        dogecoin: "dogecoin",
        ltc: "litecoin",
        litecoin: "litecoin",
        bch: "bitcoin-cash",
        "bitcoin cash": "bitcoin-cash",
        xrp: "ripple",
        ripple: "ripple",
        bnb: "binancecoin",
        binance: "binancecoin",
        usdt: "tether",
        tether: "tether",
        usdc: "usd-coin",
        "usd coin": "usd-coin",
        dai: "dai",
        shib: "shiba-inu",
        shiba: "shiba-inu",
        matic: "matic-network",
        polygon: "matic-network",
        avax: "avalanche-2",
        avalanche: "avalanche-2",
        ftm: "fantom",
        fantom: "fantom",
        atom: "cosmos",
        cosmos: "cosmos",
        algo: "algorand",
        algorand: "algorand",
      };

      const coinId = coinIdMap[coinSymbol] || coinSymbol;

      // Fetch price data from CoinGecko public API
      const correlationId = generateCorrelationId();

      const result = await retryOperation(async () => {
        const baseUrl = "https://api.coingecko.com/api/v3";
        const headers: Record<string, string> = { Accept: "application/json" };

        const response = await fetchWithTimeout(
          `${baseUrl}/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`,
          { headers, timeout: 10000 },
        );

        if (!response.ok) {
          throw new Error(
            `CoinGecko API error: ${response.status} ${response.statusText}`,
          );
        }

        const data = (await response.json()) as CoinMarketData[];
        if (!data.length) {
          throw new Error("Cryptocurrency not found");
        }
        return data[0];
      });

      const price = result.current_price;
      const priceChange24h = result.price_change_percentage_24h || 0;
      const marketCap = result.market_cap || 0;
      const volume24h = result.total_volume || 0;
      const marketCapRank = result.market_cap_rank || 0;

      // Get Bitcoin price for comparison
      let bitcoinPrice = 100000; // Fallback
      try {
        const btcBaseUrl = "https://api.coingecko.com/api/v3";
        const btcHeaders: Record<string, string> = {
          Accept: "application/json",
        };
        const btcResponse = await fetchWithTimeout(
          `${btcBaseUrl}/simple/price?ids=bitcoin&vs_currencies=usd`,
          { headers: btcHeaders, timeout: 5000 },
        );
        const btcData = (await btcResponse.json()) as any;
        bitcoinPrice = btcData.bitcoin?.usd || 100000;
      } catch (error) {
        logger.warn(
          "Failed to fetch Bitcoin price for comparison, using fallback",
        );
      }
      const btcPrice = price / bitcoinPrice;

      const responseText = `
**${result.name?.toUpperCase() || coinSymbol.toUpperCase()}**: $${price.toLocaleString()}

**24h Change**: ${priceChange24h >= 0 ? "+" : ""}${priceChange24h.toFixed(2)}%
**Market Cap**: $${(marketCap / 1e9).toFixed(2)}B
**Volume (24h)**: $${(volume24h / 1e9).toFixed(2)}B
**Market Rank**: #${marketCapRank}
**BTC Price**: ₿${btcPrice.toFixed(8)}

*But price is vanity, protocol fundamentals are sanity. Focus on sound money principles.*
      `.trim();

      const responseContent: Content = {
        text: responseText,
        actions: ["CRYPTO_PRICE_LOOKUP"],
        source: message.content.source || "crypto-price-lookup",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error("Error in crypto price lookup:", error);

      const errorContent: Content = {
        text: `Unable to fetch price data. Remember: prices are temporary, Bitcoin is forever. Focus on building wealth through sound money principles, not price tracking.`,
        actions: ["CRYPTO_PRICE_LOOKUP"],
        source: message.content.source || "crypto-price-lookup",
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
          text: "What's the current price of ETH?",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "ETH: $3,500. 24h Change: +2.5%. Market Cap: $420B. But price is vanity, protocol fundamentals are sanity. Focus on sound money principles.",
          actions: ["CRYPTO_PRICE_LOOKUP"],
        },
      },
    ],
    [
      {
        name: "user",
        content: {
          text: "How much is Solana worth?",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "SOL: $150. 24h Change: +1.8%. Market Cap: $65B. Market Rank: #5. BTC Price: ₿0.00150000. But price is vanity, protocol fundamentals are sanity.",
          actions: ["CRYPTO_PRICE_LOOKUP"],
        },
      },
    ],
  ],
}; 