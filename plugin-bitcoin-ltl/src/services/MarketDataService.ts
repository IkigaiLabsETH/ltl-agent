import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { LoggerWithContext, generateCorrelationId } from "../utils/helpers";
import {
  CoinGeckoSimplePriceResponse,
  CoinGeckoMarketDataResponse,
  CoinGeckoTrendingResponse,
  CoinGeckoGlobalDataResponse,
  CoinGeckoExchangeRatesResponse,
} from "../types/api-interfaces";

export interface MarketData {
  bitcoin: {
    price: number | null;
    change24h: number | null;
    marketCap: number | null;
    volume24h: number | null;
    dominance: number | null;
  };
  ethereum: {
    price: number | null;
    change24h: number | null;
    marketCap: number | null;
    volume24h: number | null;
  };
  global: {
    totalMarketCap: number | null;
    totalVolume24h: number | null;
    marketCapChange24h: number | null;
    activeCryptocurrencies: number | null;
    marketCapPercentage: number | null;
  };
  trending: Array<{
    id: string;
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    marketCap: number;
  }>;
  exchangeRates: Record<string, number>;
  lastUpdated: Date;
}

export interface CryptoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: any;
  last_updated: string;
}

export class MarketDataService extends BaseDataService {
  static serviceType = "market-data";

  private contextLogger: LoggerWithContext;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 300000; // 5 minutes
  private readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

  // API endpoints
  private readonly COINGECKO_API = "https://api.coingecko.com/api/v3";
  private readonly ALTERNATIVE_API = "https://api.alternative.me";

  private marketData: MarketData | null = null;
  private readonly CACHE_DURATION = 300 * 1000; // 5 minute cache

  private readonly MAX_CONSECUTIVE_FAILURES = 5;

  constructor(runtime: IAgentRuntime) {
    super(runtime, "bitcoinData");
    this.contextLogger = new LoggerWithContext(
      generateCorrelationId(),
      "MarketDataService",
    );
  }

  public get capabilityDescription(): string {
    return "Provides comprehensive cryptocurrency market data including prices, market caps, volumes, and trending coins";
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info("Starting MarketDataService...");
    return new MarketDataService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info("Stopping MarketDataService...");
    const service = runtime.getService("market-data") as MarketDataService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info("MarketDataService starting...");
    await this.startRealTimeUpdates();
  }

  async init() {
    this.contextLogger.info("MarketDataService initialized");
    await this.updateData();
  }

  async stop() {
    this.contextLogger.info("MarketDataService stopping...");
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async updateData(): Promise<void> {
    try {
      this.contextLogger.info("Updating market data...");
      await this.updateMarketData();
      this.consecutiveFailures = 0;
    } catch (error) {
      this.consecutiveFailures++;
      this.contextLogger.error("Failed to update market data", {
        error: error instanceof Error ? error.message : "Unknown error",
        consecutiveFailures: this.consecutiveFailures,
      });

      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        this.backoffUntil = Date.now() + 300000; // 5 minute backoff
        this.contextLogger.warn(
          "Maximum consecutive failures reached, backing off for 5 minutes",
        );
      }
    }
  }

  async forceUpdate(): Promise<void> {
    this.contextLogger.info("Forcing market data update...");
    await this.updateMarketData();
  }

  private async startRealTimeUpdates(): Promise<void> {
    this.contextLogger.info("Starting real-time market updates");

    // Initial update
    await this.updateData();

    // Set up interval for regular updates
    this.updateInterval = setInterval(async () => {
      if (Date.now() < this.backoffUntil) {
        this.contextLogger.debug("Skipping update due to backoff period");
        return;
      }
      await this.updateData();
    }, this.UPDATE_INTERVAL);
  }

  private async updateMarketData(): Promise<void> {
    this.contextLogger.debug("Updating comprehensive market data...");

    try {
      const [priceData, globalData, trendingData, exchangeRates] =
        await Promise.all([
          this.fetchPriceData(),
          this.fetchGlobalData(),
          this.fetchTrendingData(),
          this.fetchExchangeRates(),
        ]);

      this.marketData = {
        bitcoin: priceData?.bitcoin || {
          price: null,
          change24h: null,
          marketCap: null,
          volume24h: null,
          dominance: null,
        },
        ethereum: priceData?.ethereum || {
          price: null,
          change24h: null,
          marketCap: null,
          volume24h: null,
        },
        global: globalData || {
          totalMarketCap: null,
          totalVolume24h: null,
          marketCapChange24h: null,
          activeCryptocurrencies: null,
          marketCapPercentage: null,
        },
        trending: trendingData || [],
        exchangeRates: exchangeRates || {},
        lastUpdated: new Date(),
      };

      this.contextLogger.info("Market data updated successfully", {
        bitcoinPrice: this.marketData.bitcoin.price,
        totalMarketCap: this.marketData.global.totalMarketCap,
        trendingCount: this.marketData.trending.length,
      });
    } catch (error) {
      this.contextLogger.error("Failed to update comprehensive market data", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private async fetchPriceData(): Promise<{
    bitcoin: any;
    ethereum: any;
  } | null> {
    try {
      this.contextLogger.debug("Fetching price data...");

      const response = await this.fetchWithTimeout(
        `${this.COINGECKO_API}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
        { timeout: 10000 },
      );

      if (!response.ok) {
        throw new Error(
          `CoinGecko API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as CoinGeckoSimplePriceResponse;

      return {
        bitcoin: {
          price: data.bitcoin?.usd || null,
          change24h: data.bitcoin?.usd_24h_change || null,
          marketCap: data.bitcoin?.usd_market_cap || null,
          volume24h: data.bitcoin?.usd_24h_vol || null,
          dominance: null, // Would need additional API call
        },
        ethereum: {
          price: data.ethereum?.usd || null,
          change24h: data.ethereum?.usd_24h_change || null,
          marketCap: data.ethereum?.usd_market_cap || null,
          volume24h: data.ethereum?.usd_24h_vol || null,
        },
      };
    } catch (error) {
      this.contextLogger.warn("Failed to fetch price data", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  private async fetchGlobalData(): Promise<any> {
    try {
      this.contextLogger.debug("Fetching global market data...");

      const response = await this.fetchWithTimeout(
        `${this.COINGECKO_API}/global`,
        { timeout: 10000 },
      );

      if (!response.ok) {
        throw new Error(
          `CoinGecko API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as CoinGeckoGlobalDataResponse;

      return {
        totalMarketCap: data.data?.total_market_cap?.usd || null,
        totalVolume24h: data.data?.total_volume?.usd || null,
        marketCapChange24h:
          data.data?.market_cap_change_percentage_24h_usd || null,
        activeCryptocurrencies: data.data?.active_cryptocurrencies || null,
        marketCapPercentage: data.data?.market_cap_percentage?.btc || null,
      };
    } catch (error) {
      this.contextLogger.warn("Failed to fetch global market data", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  private async fetchTrendingData(): Promise<any[]> {
    try {
      this.contextLogger.debug("Fetching trending coins data...");

      const response = await this.fetchWithTimeout(
        `${this.COINGECKO_API}/search/trending`,
        { timeout: 10000 },
      );

      if (!response.ok) {
        throw new Error(
          `CoinGecko API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as CoinGeckoTrendingResponse;

      return (
        data.coins?.slice(0, 10).map((coin) => ({
          id: coin.item.id,
          name: coin.item.name,
          symbol: coin.item.symbol,
          price: coin.item.price_btc,
          change24h: coin.item.data?.price_change_percentage_24h?.usd || 0,
          marketCap: coin.item.data?.market_cap || 0,
        })) || []
      );
    } catch (error) {
      this.contextLogger.warn("Failed to fetch trending coins data", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  private async fetchExchangeRates(): Promise<Record<string, number>> {
    try {
      this.contextLogger.debug("Fetching exchange rates...");

      const response = await this.fetchWithTimeout(
        `${this.COINGECKO_API}/exchange_rates`,
        { timeout: 10000 },
      );

      if (!response.ok) {
        throw new Error(
          `CoinGecko API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as CoinGeckoExchangeRatesResponse;

      const rates: Record<string, number> = {};
      if (data.rates) {
        Object.entries(data.rates).forEach(([currency, rateData]) => {
          if (typeof rateData === "object" && "value" in rateData) {
            rates[currency] = (rateData as any).value;
          }
        });
      }

      return rates;
    } catch (error) {
      this.contextLogger.warn("Failed to fetch exchange rates", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {};
    }
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit & { timeout?: number } = {},
  ): Promise<Response> {
    const { timeout = 10000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  public getMarketData(): MarketData | null {
    return this.marketData;
  }

  public getBitcoinData(): any {
    return this.marketData?.bitcoin || null;
  }

  public getEthereumData(): any {
    return this.marketData?.ethereum || null;
  }

  public getGlobalData(): any {
    return this.marketData?.global || null;
  }

  public getTrendingData(): any[] {
    return this.marketData?.trending || [];
  }

  public getExchangeRates(): Record<string, number> {
    return this.marketData?.exchangeRates || {};
  }

  public isDataFresh(): boolean {
    if (!this.marketData?.lastUpdated) return false;
    return (
      Date.now() - this.marketData.lastUpdated.getTime() < this.CACHE_DURATION
    );
  }
}
