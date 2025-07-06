import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { LoggerWithContext, generateCorrelationId } from "../utils";
import axios from "axios";

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdate: Date;
  source: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: Date;
  sentiment: "positive" | "negative" | "neutral";
  relevanceScore: number;
  keywords: string[];
}

export interface SocialSentiment {
  platform: string;
  symbol: string;
  sentiment: number; // -1 to 1
  mentions: number;
  timestamp: Date;
  trendingKeywords: string[];
}

export interface EconomicIndicator {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  unit: string;
  releaseDate: Date;
  nextRelease: Date;
}

export interface MarketAlert {
  id: string;
  type:
    | "price_threshold"
    | "volume_spike"
    | "news_sentiment"
    | "technical_indicator";
  symbol: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  data: any;
}

export interface BitcoinNetworkData {
  hashRate: number | null;
  difficulty: number | null;
  blockHeight: number | null;
  avgBlockTime: number | null;
  avgBlockSize: number | null;
  totalBTC: number | null;
  marketCap: number | null;
  nextHalving: {
    blocks: number | null;
    estimatedDate: string | null;
  };
  mempoolSize: number | null;
  mempoolFees: {
    fastestFee: number | null;
    halfHourFee: number | null;
    economyFee: number | null;
  };
  mempoolTxs: number | null;
  miningRevenue: number | null;
  miningRevenue24h: number | null;
  lightningCapacity: number | null;
  lightningChannels: number | null;
  liquidity: number | null;
}

export interface BitcoinSentimentData {
  fearGreedIndex: number | null;
  fearGreedValue: string | null;
}

export interface BitcoinNodesData {
  total: number | null;
  countries: number | null;
}

export interface ComprehensiveBitcoinData {
  price: {
    usd: number | null;
    change24h: number | null;
  };
  network: BitcoinNetworkData;
  sentiment: BitcoinSentimentData;
  nodes: BitcoinNodesData;
  lastUpdated: Date;
}

export interface CuratedCoinData {
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

export interface CuratedAltcoinsData {
  [coinId: string]: CuratedCoinData;
}

export interface CuratedAltcoinsCache {
  data: CuratedAltcoinsData;
  timestamp: number;
}

// Top 100 vs BTC interfaces moved to AltcoinDataService to avoid duplication

export interface BoostedToken {
  tokenAddress: string;
  chainId: string;
  icon?: string;
  label?: string;
  symbol?: string;
}

export interface DexScreenerPool {
  liquidity?: { usd?: string | number };
  volume?: { h24?: string | number };
  priceUsd?: string;
  marketCap?: string | number;
  info?: { imageUrl?: string };
}

export interface TrendingToken {
  address: string;
  chainId: string;
  image: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  marketCap: number | null;
  totalLiquidity: number;
  totalVolume: number;
  poolsCount: number;
  liquidityRatio: number | null;
}

export interface DexScreenerData {
  topTokens: BoostedToken[];
  trendingTokens: TrendingToken[];
  lastUpdated: Date;
}

export interface DexScreenerCache {
  data: DexScreenerData;
  timestamp: number;
}

export interface TopMoverCoin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  market_cap_rank: number;
  price_change_percentage_24h: number;
}

export interface TopMoversData {
  topGainers: TopMoverCoin[];
  topLosers: TopMoverCoin[];
  lastUpdated: Date;
}

export interface TopMoversCache {
  data: TopMoversData;
  timestamp: number;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  score: number;
}

export interface CoinGeckoTrendingItem {
  item: {
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    score: number;
  };
}

export interface TrendingCoinsData {
  coins: TrendingCoin[];
  lastUpdated: Date;
}

export interface TrendingCoinsCache {
  data: TrendingCoinsData;
  timestamp: number;
}

export interface NFTCollectionStats {
  total_supply: number;
  num_owners: number;
  average_price: number;
  floor_price: number;
  market_cap: number;
  one_day_volume: number;
  one_day_change: number;
  one_day_sales: number;
  seven_day_volume: number;
  seven_day_change: number;
  seven_day_sales: number;
  thirty_day_volume: number;
  thirty_day_change: number;
  thirty_day_sales: number;
}

export interface NFTCollection {
  collection: string;
  name: string;
  description: string;
  image_url: string;
  banner_image_url: string;
  owner: string;
  category: string;
  is_disabled: boolean;
  is_nsfw: boolean;
  trait_offers_enabled: boolean;
  collection_offers_enabled: boolean;
  opensea_url: string;
  project_url: string;
  wiki_url: string;
  discord_url: string;
  telegram_url: string;
  twitter_username: string;
  instagram_username: string;
  contracts: Array<{
    address: string;
    chain: string;
  }>;
  editors: string[];
  fees: Array<{
    fee: number;
    recipient: string;
    required: boolean;
  }>;
  rarity: {
    strategy_id: string;
    strategy_version: string;
    rank_at: string;
    max_rank: number;
    tokens_scored: number;
  };
  total_supply: number;
  created_date: string;
}

export interface NFTCollectionData {
  slug: string;
  collection: NFTCollection;
  stats: NFTCollectionStats;
  lastUpdated: Date;
  category: "blue-chip" | "generative-art" | "digital-art" | "pfp" | "utility";
  floorItems?: NFTFloorItem[];
  recentSales?: NFTSaleEvent[];
  contractAddress?: string;
  blockchain?: string;
}

export interface NFTFloorItem {
  token_id: string;
  name: string;
  image_url: string;
  price_eth: number;
  price_usd: number;
  rarity_rank?: number;
  listing_time: string;
  opensea_url: string;
}

export interface NFTSaleEvent {
  token_id: string;
  name: string;
  image_url: string;
  price_eth: number;
  price_usd: number;
  buyer: string;
  seller: string;
  transaction_hash: string;
  timestamp: string;
  event_type: "sale" | "transfer" | "mint";
}

export interface NFTTraitFloor {
  trait_type: string;
  trait_value: string;
  floor_price: number;
  count: number;
}

export interface CuratedNFTsData {
  collections: NFTCollectionData[];
  summary: {
    totalVolume24h: number;
    totalMarketCap: number;
    avgFloorPrice: number;
    topPerformers: NFTCollectionData[];
    worstPerformers: NFTCollectionData[];
    totalCollections: number;
  };
  lastUpdated: Date;
}

export interface CuratedNFTsCache {
  data: CuratedNFTsData;
  timestamp: number;
}

// At the top, after imports
const USE_OPENSEA_API = typeof process !== 'undefined' && process.env.USE_OPENSEA_API !== undefined
  ? process.env.USE_OPENSEA_API === 'true'
  : true;

export class RealTimeDataService extends BaseDataService {
  static serviceType = "real-time-data";

  private contextLogger: LoggerWithContext;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 180000; // 3 minutes - prioritize Bitcoin data freshness
  private readonly symbols = [
    "BTC",
    "ETH",
    "SOL",
    "MATIC",
    "ADA",
    "4337",
    "8958",
  ]; // Include MetaPlanet (4337) and Hyperliquid (8958)

  // Rate limiting properties
  protected lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 3000; // 3 seconds between requests to avoid rate limits
  protected requestQueue: Array<() => Promise<any>> = [];
  protected isProcessingQueue = false;
  protected consecutiveFailures = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  protected backoffUntil = 0;

  // API endpoints
  private readonly BLOCKCHAIN_API = "https://api.blockchain.info";
  private readonly COINGECKO_API = "https://api.coingecko.com/api/v3";
  private readonly ALTERNATIVE_API = "https://api.alternative.me";
  private readonly MEMPOOL_API = "https://mempool.space/api";
  private readonly DEXSCREENER_API = "https://api.dexscreener.com";

  // Curated altcoins list (matching LiveTheLifeTV website)
  private readonly curatedCoinIds = [
    "ethereum",
    "chainlink",
    "uniswap",
    "aave",
    "ethena",
    "solana",
    "sui",
    "hyperliquid",
    "fartcoin"
  ];

  // Data storage
  private marketData: MarketData[] = [];
  private newsItems: NewsItem[] = [];
  private socialSentiment: SocialSentiment[] = [];
  private economicIndicators: EconomicIndicator[] = [];
  private alerts: MarketAlert[] = [];
  // Bitcoin data is now handled by BitcoinNetworkDataService to avoid duplication
  private curatedAltcoinsCache: CuratedAltcoinsCache | null = null;
  private readonly CURATED_CACHE_DURATION = 60 * 1000; // 1 minute
  // Top 100 vs BTC data is now handled by AltcoinDataService to avoid duplication
  private dexScreenerCache: DexScreenerCache | null = null;
  private readonly DEXSCREENER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for trending data
  private topMoversCache: TopMoversCache | null = null;
  private readonly TOP_MOVERS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - reduce API calls
  private trendingCoinsCache: TrendingCoinsCache | null = null;
  private readonly TRENDING_COINS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - reduce API calls
  private curatedNFTsCache: CuratedNFTsCache | null = null;
  private readonly CURATED_NFTS_CACHE_DURATION = 60 * 1000; // 1 minute (matches website caching)

  // Curated NFT collections (focused on high-value generative art)
  private readonly curatedNFTCollections = [
    { slug: "qql", category: "generative-art" as const },
    {
      slug: "meridian-by-matt-deslauriers",
      category: "generative-art" as const,
    },
  ];

  // In the RealTimeDataService class constructor, add:
  private useOpenSeaApi: boolean;

  constructor(runtime: IAgentRuntime) {
    super(runtime, "realTimeData");
    this.contextLogger = new LoggerWithContext(
      generateCorrelationId(),
      "RealTimeDataService",
    );

    // Adjust rate limiting based on API key availability
    const coingeckoApiKey = this.runtime.getSetting("COINGECKO_API_KEY");
    if (!coingeckoApiKey || coingeckoApiKey.startsWith("REPLACE_WITH_YOUR_ACTUAL") || coingeckoApiKey.startsWith("your_")) {
      // Use very conservative rate limiting for public API
      this.serviceConfig.rateLimitDelay = 15000; // 15 seconds between requests
      this.serviceConfig.maxRequestsPerWindow = 10; // 10 requests per minute
      this.serviceConfig.rateLimitWindow = 60000; // 1 minute window
      console.log("[RealTimeDataService] Using public CoinGecko API with very conservative rate limiting (15s delay, 10 req/min)");
    } else {
      // Use standard rate limiting for pro API
      this.serviceConfig.rateLimitDelay = 2000; // 2 seconds between requests
      this.serviceConfig.maxRequestsPerWindow = 50; // 50 requests per minute
      this.serviceConfig.rateLimitWindow = 60000; // 1 minute window
      console.log("[RealTimeDataService] Using CoinGecko Pro API with standard rate limiting (2s delay, 50 req/min)");
    }

    this.useOpenSeaApi = this.runtime?.getSetting?.('USE_OPENSEA_API') ?? USE_OPENSEA_API;
  }

  public get capabilityDescription(): string {
    return "Provides real-time market data, news feeds, and social sentiment analysis";
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info("RealTimeDataService starting...");
    const service = new RealTimeDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info("RealTimeDataService stopping...");
    const service = runtime.getService("real-time-data");
    if (service && service.stop) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    elizaLogger.info("RealTimeDataService starting...");
    await this.updateData();
    elizaLogger.info("RealTimeDataService started successfully");
  }

  async init() {
    elizaLogger.info("RealTimeDataService initialized");

    // Start real-time updates
    await this.startRealTimeUpdates();
  }

  async stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    elizaLogger.info("RealTimeDataService stopped");
  }

  // Required abstract methods from BaseDataService
  async updateData(): Promise<void> {
    try {
      await this.updateAllData();

      // Store current state in memory
      await this.storeInMemory(
        {
          marketData: this.marketData,
          curatedAltcoinsCache: this.curatedAltcoinsCache,
          // Top 100 vs BTC data is now handled by AltcoinDataService to avoid duplication
          newsItems: this.newsItems.slice(-50), // Keep last 50 news items
          socialSentiment: this.socialSentiment.slice(-20), // Keep last 20 sentiment items
          alerts: this.alerts.slice(-100), // Keep last 100 alerts
          timestamp: Date.now(),
        },
        "real-time-data-state",
      );

      this.contextLogger.info(
        `Updated real-time data: ${this.marketData.length} market items, ${this.newsItems.length} news items`,
      );
    } catch (error) {
      this.contextLogger.error(
        "Failed to update real-time data:",
        (error as Error).message,
      );
      throw error;
    }
  }

  async forceUpdate(): Promise<void> {
    this.contextLogger.info("Forcing real-time data update");
    await this.updateData();
  }

  private async startRealTimeUpdates(): Promise<void> {
    // Initial data load
    await this.updateAllData();

    // Set up periodic updates
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateAllData();
      } catch (error) {
        console.error("Error updating real-time data:", error);
      }
    }, this.UPDATE_INTERVAL);
  }

  private async updateAllData(): Promise<void> {
    try {
      // Update market data (crypto + stocks)
      await this.updateMarketData();
      
      // Update news and sentiment data
      await this.updateNews();
      await this.updateSocialSentiment();
      await this.updateEconomicIndicators();
      
      // Update curated data (with caching)
      await this.updateCuratedAltcoinsData();
      await this.updateDexScreenerData();
      await this.updateTopMoversData();
      await this.updateTrendingCoinsData();
      await this.updateCuratedNFTsData();
      
      // Generate alerts based on updated data
      this.alerts = this.generateAlerts(
        this.marketData,
        this.newsItems,
        this.socialSentiment,
      );
      
      console.log(
        `[RealTimeDataService] ✅ Updated all data: ${this.marketData.length} market items, ${this.newsItems.length} news items, ${this.alerts.length} alerts`,
      );
    } catch (error) {
      console.error("[RealTimeDataService] ❌ Error updating all data:", error);
    }
  }

  private async updateMarketData(): Promise<void> {
    try {
      this.marketData = await this.fetchMarketData();
    } catch (error) {
      console.error("Error updating market data:", error);
    }
  }

  // Bitcoin data is now handled by BitcoinNetworkDataService to avoid duplication

  private async updateNews(): Promise<void> {
    try {
      this.newsItems = await this.fetchNewsData();
    } catch (error) {
      console.error("Error updating news data:", error);
    }
  }

  private async updateSocialSentiment(): Promise<void> {
    try {
      this.socialSentiment = await this.fetchSocialSentiment();
    } catch (error) {
      console.error("Error updating social sentiment:", error);
    }
  }

  private async updateEconomicIndicators(): Promise<void> {
    try {
      this.economicIndicators = await this.fetchEconomicIndicators();
    } catch (error) {
      console.error("Error updating economic indicators:", error);
    }
  }

  private async fetchMarketData(): Promise<MarketData[]> {
    try {
      const coingeckoApiKey = this.runtime.getSetting("COINGECKO_API_KEY");
      const baseUrl = coingeckoApiKey
        ? "https://pro-api.coingecko.com/api/v3"
        : "https://api.coingecko.com/api/v3";

      const headers = coingeckoApiKey
        ? { "x-cg-pro-api-key": coingeckoApiKey }
        : {};

      // Fetch crypto data using queued request (Bitcoin handled by BitcoinNetworkDataService)
      const cryptoIds = "ethereum,solana,polygon,cardano";
      const cryptoData = await this.makeQueuedRequest(async () => {
        const params = new URLSearchParams({
          ids: cryptoIds,
          vs_currencies: "usd",
          include_24hr_change: "true",
          include_24hr_vol: "true",
          include_market_cap: "true",
          include_last_updated_at: "true",
        });
        const url = `${baseUrl}/simple/price?${params.toString()}`;
        const response = await fetch(url, {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          if (response.status === 429) {
            // Handle rate limiting with exponential backoff
            const retryAfter = response.headers.get('Retry-After');
            const backoffTime = retryAfter ? parseInt(retryAfter) * 1000 : 30000; // Default 30s
            console.warn(`[RealTimeDataService] Rate limited, backing off for ${backoffTime}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            throw new Error(`HTTP 429: Rate limited, retry after ${backoffTime}ms`);
          }
          if (response.status === 401 || response.status === 429) {
            console.warn(
              `[RealTimeDataService] CoinGecko API rate limited or unauthorized (${response.status}), using fallback data`,
            );
            return this.getFallbackMarketData();
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      });

      const marketData: MarketData[] = Object.entries(cryptoData).map(
        ([id, data]: [string, any]) => ({
          symbol: this.getSymbolFromId(id),
          price: data.usd || 0,
          change24h: data.usd_24h_change || 0,
          changePercent24h: data.usd_24h_change || 0,
          volume24h: data.usd_24h_vol || 0,
          marketCap: data.usd_market_cap || 0,
          lastUpdate: new Date(
            data.last_updated_at ? data.last_updated_at * 1000 : Date.now(),
          ),
          source: "CoinGecko",
        }),
      );

      // Fetch stock data with delay
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      const stockData = await this.fetchStockData();

      return [...marketData, ...stockData];
    } catch (error) {
      console.error("Error fetching market data:", error);
      return this.getFallbackMarketData();
    }
  }

  private async fetchStockData(): Promise<MarketData[]> {
    try {
      // Using Alpha Vantage for stock data (free tier available)
      const alphaVantageKey = this.runtime.getSetting("ALPHA_VANTAGE_API_KEY");
      if (!alphaVantageKey) {
        return this.getFallbackStockData();
      }

      // Fetch data for major tech stocks as proxies
      const symbols = ["MSFT", "GOOGL", "TSLA"]; // High-performing tech stocks
      const stockPromises = symbols.map(async (symbol) => {
        try {
          const response = await axios.get(
            "https://www.alphavantage.co/query",
            {
              params: {
                function: "GLOBAL_QUOTE",
                symbol: symbol,
                apikey: alphaVantageKey,
              },
              timeout: 10000,
            },
          );

          const quote = response.data["Global Quote"];
          if (!quote) return null;

          const price = parseFloat(quote["05. price"]);
          const change = parseFloat(quote["09. change"]);
          const changePercent = parseFloat(
            quote["10. change percent"].replace("%", ""),
          );
          const volume = parseInt(quote["06. volume"]);

          // Validate parsed values
          if (
            !isFinite(price) ||
            !isFinite(change) ||
            !isFinite(changePercent)
          ) {
            console.warn(
              `[RealTimeDataService] Invalid Alpha Vantage data for ${symbol}: price=${price}, change=${change}, changePercent=${changePercent}`,
            );
            return null;
          }

          return {
            symbol: symbol,
            price: price,
            change24h: change,
            changePercent24h: changePercent,
            volume24h: volume || 0,
            marketCap: 0, // Not available in basic quote
            lastUpdate: new Date(),
            source: "Alpha Vantage",
          };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(stockPromises);
      return results.filter(Boolean) as MarketData[];
    } catch (error) {
      console.error("Error fetching stock data:", error);
      return this.getFallbackStockData();
    }
  }

  private async fetchNewsData(): Promise<NewsItem[]> {
    try {
      const newsApiKey = this.runtime.getSetting("NEWS_API_KEY");
      if (!newsApiKey) {
        return this.getFallbackNewsData();
      }

      const response = await axios.get("https://newsapi.org/v2/everything", {
        params: {
          q: 'bitcoin OR cryptocurrency OR "strategic bitcoin reserve" OR "bitcoin ETF" OR blockchain',
          sortBy: "publishedAt",
          pageSize: 20,
          language: "en",
          apiKey: newsApiKey,
        },
        timeout: 10000,
      });

      return response.data.articles.map((article: any, index: number) => ({
        id: `news_${Date.now()}_${index}`,
        title: article.title,
        summary:
          article.description || article.content?.substring(0, 200) + "...",
        url: article.url,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt),
        sentiment: this.analyzeSentiment(
          article.title + " " + article.description,
        ),
        relevanceScore: this.calculateRelevanceScore(
          article.title,
          article.description,
        ),
        keywords: this.extractKeywords(
          article.title + " " + article.description,
        ),
      }));
    } catch (error) {
      console.error("Error fetching news data:", error);
      return this.getFallbackNewsData();
    }
  }

  private async fetchSocialSentiment(): Promise<SocialSentiment[]> {
    try {
      // This would integrate with Twitter API, Reddit API, etc.
      // For now, returning simulated sentiment data based on market movements
      const marketData = this.marketData || [];
      const btcData = marketData.find((m) => m.symbol === "BTC");

      if (!btcData) {
        return this.getFallbackSocialSentiment();
      }

      const sentiment =
        btcData.changePercent24h > 0
          ? Math.min(0.8, btcData.changePercent24h / 10)
          : Math.max(-0.8, btcData.changePercent24h / 10);

      return [
        {
          platform: "Twitter",
          symbol: "BTC",
          sentiment: sentiment,
          mentions: Math.floor(Math.random() * 5000) + 1000,
          timestamp: new Date(),
          trendingKeywords:
            sentiment > 0.2
              ? ["moon", "hodl", "btc", "bullish"]
              : ["dip", "buy", "hodl", "diamond hands"],
        },
        {
          platform: "Reddit",
          symbol: "BTC",
          sentiment: sentiment * 0.8, // Reddit tends to be slightly less extreme
          mentions: Math.floor(Math.random() * 1000) + 200,
          timestamp: new Date(),
          trendingKeywords: [
            "bitcoin",
            "cryptocurrency",
            "investment",
            "future",
          ],
        },
      ];
    } catch (error) {
      console.error("Error fetching social sentiment:", error);
      return this.getFallbackSocialSentiment();
    }
  }

  private async fetchEconomicIndicators(): Promise<EconomicIndicator[]> {
    try {
      // This would integrate with FRED API, Bloomberg API, etc.
      // For now, returning key indicators that affect Bitcoin
      return [
        {
          name: "US Dollar Index (DXY)",
          value: 103.5,
          previousValue: 104.2,
          change: -0.7,
          unit: "index",
          releaseDate: new Date(),
          nextRelease: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        },
        {
          name: "Federal Funds Rate",
          value: 5.25,
          previousValue: 5.25,
          change: 0,
          unit: "percent",
          releaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
          nextRelease: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // Next FOMC meeting
        },
      ];
    } catch (error) {
      console.error("Error fetching economic indicators:", error);
      return [];
    }
  }

  private generateAlerts(
    marketData: MarketData[],
    newsItems: NewsItem[],
    socialSentiment: SocialSentiment[],
  ): MarketAlert[] {
    const alerts: MarketAlert[] = [];
    const now = new Date();

    // Price threshold alerts
    marketData.forEach((market) => {
      if (Math.abs(market.changePercent24h) > 10) {
        alerts.push({
          id: `price_${market.symbol}_${now.getTime()}`,
          type: "price_threshold",
          symbol: market.symbol,
          message: `${market.symbol} ${market.changePercent24h > 0 ? "surged" : "dropped"} ${Math.abs(market.changePercent24h).toFixed(1)}% in 24h`,
          severity:
            Math.abs(market.changePercent24h) > 20 ? "critical" : "high",
          timestamp: now,
          data: { price: market.price, change: market.changePercent24h },
        });
      }
    });

    // Volume spike alerts
    marketData.forEach((market) => {
      if (market.volume24h > 0) {
        // Simplified volume spike detection
        const avgVolume = market.volume24h * 0.7; // Assume current volume is 30% above average
        if (market.volume24h > avgVolume * 2) {
          alerts.push({
            id: `volume_${market.symbol}_${now.getTime()}`,
            type: "volume_spike",
            symbol: market.symbol,
            message: `${market.symbol} volume spike detected - ${(market.volume24h / 1000000).toFixed(1)}M`,
            severity: "medium",
            timestamp: now,
            data: { volume: market.volume24h },
          });
        }
      }
    });

    // News sentiment alerts
    const highImpactNews = newsItems.filter(
      (news) =>
        news.relevanceScore > 0.8 &&
        (news.sentiment === "positive" || news.sentiment === "negative"),
    );

    highImpactNews.forEach((news) => {
      alerts.push({
        id: `news_${news.id}`,
        type: "news_sentiment",
        symbol: "BTC", // Assume Bitcoin-related
        message: `High-impact ${news.sentiment} news: ${news.title}`,
        severity: "medium",
        timestamp: now,
        data: { newsUrl: news.url, sentiment: news.sentiment },
      });
    });

    return alerts;
  }

  // Utility methods
  private getSymbolFromId(id: string): string {
    const mapping: { [key: string]: string } = {
      bitcoin: "BTC",
      ethereum: "ETH",
      solana: "SOL",
      polygon: "MATIC",
      cardano: "ADA",
    };
    return mapping[id] || id.toUpperCase();
  }

  private analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
    const positiveWords = [
      "surge",
      "pump",
      "moon",
      "bullish",
      "adoption",
      "breakthrough",
      "rally",
    ];
    const negativeWords = [
      "crash",
      "dump",
      "bearish",
      "decline",
      "sell-off",
      "collapse",
      "drop",
    ];

    const lowercaseText = text.toLowerCase();
    const positiveScore = positiveWords.reduce(
      (score, word) => score + (lowercaseText.includes(word) ? 1 : 0),
      0,
    );
    const negativeScore = negativeWords.reduce(
      (score, word) => score + (lowercaseText.includes(word) ? 1 : 0),
      0,
    );

    if (positiveScore > negativeScore) return "positive";
    if (negativeScore > positiveScore) return "negative";
    return "neutral";
  }

  private calculateRelevanceScore(title: string, description: string): number {
    const relevantTerms = [
      "bitcoin",
      "btc",
      "cryptocurrency",
      "blockchain",
      "strategic reserve",
      "etf",
      "institutional",
    ];
    const text = (title + " " + description).toLowerCase();

    let score = 0;
    relevantTerms.forEach((term) => {
      if (text.includes(term)) {
        score += 0.2;
      }
    });

    return Math.min(1, score);
  }

  private extractKeywords(text: string): string[] {
    const keywords = [
      "bitcoin",
      "cryptocurrency",
      "blockchain",
      "etf",
      "institutional",
      "adoption",
      "regulation",
      "defi",
    ];
    return keywords.filter((keyword) => text.toLowerCase().includes(keyword));
  }

  // Fallback data methods
  private getFallbackMarketData(): MarketData[] {
    return [
      {
        symbol: "BTC",
        price: 45000,
        change24h: 2000,
        changePercent24h: 4.7,
        volume24h: 25000000000,
        marketCap: 880000000000,
        lastUpdate: new Date(),
        source: "Fallback",
      },
      {
        symbol: "ETH",
        price: 2800,
        change24h: 150,
        changePercent24h: 5.7,
        volume24h: 12000000000,
        marketCap: 340000000000,
        lastUpdate: new Date(),
        source: "Fallback",
      },
    ];
  }

  private getFallbackStockData(): MarketData[] {
    return [
      {
        symbol: "MSFT",
        price: 380,
        change24h: 5.2,
        changePercent24h: 1.4,
        volume24h: 25000000,
        marketCap: 2800000000000,
        lastUpdate: new Date(),
        source: "Fallback",
      },
    ];
  }

  private getFallbackNewsData(): NewsItem[] {
    return [
      {
        id: "fallback_news_1",
        title: "Bitcoin Adoption Accelerates Among Institutional Investors",
        summary:
          "Major institutions continue to add Bitcoin to their balance sheets...",
        url: "https://example.com/bitcoin-adoption",
        source: "Fallback News",
        publishedAt: new Date(),
        sentiment: "positive",
        relevanceScore: 0.9,
        keywords: ["bitcoin", "institutional", "adoption"],
      },
    ];
  }

  private getFallbackSocialSentiment(): SocialSentiment[] {
    return [
      {
        platform: "Twitter",
        symbol: "BTC",
        sentiment: 0.6,
        mentions: 2500,
        timestamp: new Date(),
        trendingKeywords: ["bitcoin", "hodl", "moon"],
      },
    ];
  }

  private getFallbackCuratedAltcoinsData(): CuratedAltcoinsData {
    const fallbackData: CuratedAltcoinsData = {};
    this.curatedCoinIds.forEach((id) => {
      fallbackData[id] = {
        price: Math.random() * 1000 + 1, // Random price between 1-1000
        change24h: (Math.random() - 0.5) * 20, // Random change between -10% and +10%
        marketCap: Math.random() * 1000000000 + 1000000, // Random market cap
        volume24h: Math.random() * 100000000 + 1000000, // Random volume
      };
    });
    return fallbackData;
  }

  // Public API methods
  public getMarketData(): MarketData[] {
    return this.marketData || [];
  }

  public getNewsItems(): NewsItem[] {
    return this.newsItems || [];
  }

  public getSocialSentiment(): SocialSentiment[] {
    return this.socialSentiment || [];
  }

  public getEconomicIndicators(): EconomicIndicator[] {
    return this.economicIndicators || [];
  }

  public getAlerts(): MarketAlert[] {
    return this.alerts || [];
  }

  public getMarketDataBySymbol(symbol: string): MarketData | undefined {
    const marketData = this.getMarketData();
    return marketData.find((market) => market.symbol === symbol);
  }

  public getComprehensiveBitcoinData(): ComprehensiveBitcoinData | null {
    // Bitcoin data is now handled by BitcoinNetworkDataService to avoid duplication
    return null;
  }

  public getCuratedAltcoinsData(): CuratedAltcoinsData | null {
    if (!this.curatedAltcoinsCache || !this.isCuratedCacheValid()) {
      return null;
    }
    return this.curatedAltcoinsCache.data;
  }

  // Top 100 vs BTC data is now handled by AltcoinDataService to avoid duplication

  public getDexScreenerData(): DexScreenerData | null {
    if (!this.dexScreenerCache || !this.isDexScreenerCacheValid()) {
      return null;
    }
    return this.dexScreenerCache.data;
  }

  public getTopMoversData(): TopMoversData | null {
    if (!this.topMoversCache || !this.isTopMoversCacheValid()) {
      return null;
    }
    return this.topMoversCache.data;
  }

  public getTrendingCoinsData(): TrendingCoinsData | null {
    if (!this.trendingCoinsCache || !this.isTrendingCoinsCacheValid()) {
      return null;
    }
    return this.trendingCoinsCache.data;
  }

  public getCuratedNFTsData(): CuratedNFTsData | null {
    if (!this.curatedNFTsCache || !this.isCuratedNFTsCacheValid()) {
      return null;
    }
    return this.curatedNFTsCache.data;
  }

  public async forceCuratedAltcoinsUpdate(): Promise<CuratedAltcoinsData | null> {
    return await this.fetchCuratedAltcoinsData();
  }

  // Top 100 vs BTC data is now handled by AltcoinDataService to avoid duplication

  public async forceDexScreenerUpdate(): Promise<DexScreenerData | null> {
    return await this.fetchDexScreenerData();
  }

  public async forceTopMoversUpdate(): Promise<TopMoversData | null> {
    return await this.fetchTopMoversData();
  }

  public async forceTrendingCoinsUpdate(): Promise<TrendingCoinsData | null> {
    return await this.fetchTrendingCoinsData();
  }

  public async forceCuratedNFTsUpdate(): Promise<CuratedNFTsData | null> {
    return await this.fetchCuratedNFTsData();
  }

  // Comprehensive Bitcoin data fetcher
  private async fetchComprehensiveBitcoinData(): Promise<ComprehensiveBitcoinData | null> {
    try {
      // Fetch all data in parallel
      const [priceData, networkData, sentimentData, mempoolData] =
        await Promise.all([
          this.fetchBitcoinPriceData(),
          this.fetchBitcoinNetworkData(),
          this.fetchBitcoinSentimentData(),
          this.fetchBitcoinMempoolData(),
        ]);

      // Combine all data
      const response: ComprehensiveBitcoinData = {
        price: {
          usd: priceData?.usd || null,
          change24h: priceData?.change24h || null,
        },
        network: {
          hashRate: networkData?.hashRate || null,
          difficulty: networkData?.difficulty || null,
          blockHeight: networkData?.blockHeight || null,
          avgBlockTime: networkData?.avgBlockTime || null,
          avgBlockSize: networkData?.avgBlockSize || null,
          totalBTC: networkData?.totalBTC || null,
          marketCap: networkData?.marketCap || null,
          nextHalving: networkData?.nextHalving || {
            blocks: null,
            estimatedDate: null,
          },
          mempoolSize: mempoolData?.mempoolSize || null,
          mempoolFees: mempoolData?.mempoolFees || {
            fastestFee: null,
            halfHourFee: null,
            economyFee: null,
          },
          mempoolTxs: mempoolData?.mempoolTxs || null,
          miningRevenue: mempoolData?.miningRevenue || null,
          miningRevenue24h: mempoolData?.miningRevenue24h || null,
          lightningCapacity: null,
          lightningChannels: null,
          liquidity: null,
        },
        sentiment: {
          fearGreedIndex: sentimentData?.fearGreedIndex || null,
          fearGreedValue: sentimentData?.fearGreedValue || null,
        },
        nodes: {
          total: null,
          countries: null,
        },
        lastUpdated: new Date(),
      };

      return response;
    } catch (error) {
      console.error("Error fetching comprehensive Bitcoin data:", error);
      return null;
    }
  }

  private async fetchBitcoinPriceData(): Promise<{
    usd: number;
    change24h: number;
  } | null> {
    try {
      const data = await this.makeQueuedRequest(async () => {
        const response = await fetch(
          `${this.COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(15000),
          },
        );

        if (!response.ok) {
          if (response.status === 429) {
            // Handle rate limiting with exponential backoff
            const retryAfter = response.headers.get('Retry-After');
            const backoffTime = retryAfter ? parseInt(retryAfter) * 1000 : 30000; // Default 30s
            console.warn(`[RealTimeDataService] Rate limited, backing off for ${backoffTime}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            throw new Error(`HTTP 429: Rate limited, retry after ${backoffTime}ms`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      });

      return {
        usd: Number(data.bitcoin?.usd) || null,
        change24h: Number(data.bitcoin?.usd_24h_change) || null,
      };
    } catch (error) {
      console.error("Error fetching Bitcoin price data:", error);
      return null;
    }
  }

  private async fetchBitcoinNetworkData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      // Fetch from multiple sources in parallel for better accuracy
      const [blockchainData, mempoolStats] = await Promise.all(
        [
          this.fetchBlockchainInfoData(),
          this.fetchMempoolNetworkData(),
        ],
      );

      // Use the most recent and accurate data sources
      // Priority: Mempool.space (most reliable) > Blockchain.info
      const hashRate =
        mempoolStats?.hashRate ||
        blockchainData?.hashRate;
      const difficulty =
        mempoolStats?.difficulty ||
        blockchainData?.difficulty;
      const blockHeight =
        mempoolStats?.blockHeight ||
        blockchainData?.blockHeight;

      console.log(
        `[RealTimeDataService] 🔍 Hashrate sources - Mempool: ${mempoolStats?.hashRate ? (mempoolStats.hashRate / 1e18).toFixed(2) + " EH/s" : "N/A"}, Blockchain: ${blockchainData?.hashRate ? (blockchainData.hashRate / 1e18).toFixed(2) + " EH/s" : "N/A"}`,
      );
      console.log(
        `[RealTimeDataService] 🎯 Selected hashrate: ${hashRate ? (hashRate / 1e18).toFixed(2) + " EH/s" : "N/A"}`,
      );

      // Calculate next halving using most reliable block height
      const currentBlock = blockHeight || 0;
      const currentHalvingEpoch = Math.floor(currentBlock / 210000);
      const nextHalvingBlock = (currentHalvingEpoch + 1) * 210000;
      const blocksUntilHalving = nextHalvingBlock - currentBlock;

      // Estimate halving date based on average block time (10 minutes target)
      const avgBlockTime = blockchainData?.avgBlockTime || 10;
      const minutesUntilHalving = blocksUntilHalving * avgBlockTime;
      const halvingDate = new Date(
        Date.now() + minutesUntilHalving * 60 * 1000,
      );

      return {
        hashRate: hashRate,
        difficulty: difficulty,
        blockHeight: blockHeight,
        avgBlockTime: blockchainData?.avgBlockTime || avgBlockTime,
        avgBlockSize: blockchainData?.avgBlockSize || null,
        totalBTC: blockchainData?.totalBTC || null,
        marketCap: blockchainData?.marketCap || null,
        nextHalving: {
          blocks: blocksUntilHalving,
          estimatedDate: halvingDate.toISOString(),
        },
      };
    } catch (error) {
      console.error("Error fetching Bitcoin network data:", error);
      return null;
    }
  }

  /**
   * Fetch from Blockchain.info API
   */
  private async fetchBlockchainInfoData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      const response = await fetch(`${this.BLOCKCHAIN_API}/stats`, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();

        return {
          hashRate: Number(data.hash_rate) * 1e9, // Convert from GH/s to H/s
          difficulty: Number(data.difficulty),
          blockHeight: Number(data.n_blocks_total),
          avgBlockTime: Number(data.minutes_between_blocks),
          avgBlockSize: Number(data.blocks_size),
          totalBTC: Number(data.totalbc) / 1e8,
          marketCap:
            Number(data.market_price_usd) * (Number(data.totalbc) / 1e8),
        };
      } else if (response.status === 429) {
        console.warn(`[RealTimeDataService] Blockchain.info rate limited (429)`);
        return null;
      } else {
        console.warn(`[RealTimeDataService] Blockchain.info API error: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error("Error fetching Blockchain.info data:", error);
      return null;
    }
  }

  /**
   * Fetch network data from Mempool.space API (most accurate)
   */
  private async fetchMempoolNetworkData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      const [hashRateResponse, difficultyResponse, blockHeightResponse] =
        await Promise.all([
          fetch(`${this.MEMPOOL_API}/v1/mining/hashrate/1m`, {
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }),
          fetch(`${this.MEMPOOL_API}/v1/difficulty-adjustment`, {
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }),
          fetch(`${this.MEMPOOL_API}/blocks/tip/height`, {
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }),
        ]);

      const results: Partial<BitcoinNetworkData> = {};

      // Get current hashrate (most recent data point from 1-month history)
      if (hashRateResponse.ok) {
        const hashRateData = await hashRateResponse.json();
        if (hashRateData.currentHashrate) {
          results.hashRate = Number(hashRateData.currentHashrate);
        } else if (
          hashRateData.hashrates &&
          hashRateData.hashrates.length > 0
        ) {
          // Get the most recent hashrate from the array
          const latestHashrate =
            hashRateData.hashrates[hashRateData.hashrates.length - 1];
          if (latestHashrate && latestHashrate.hashrateAvg) {
            results.hashRate = Number(latestHashrate.hashrateAvg);
          }
        }
      } else if (hashRateResponse.status === 429) {
        console.warn(`[RealTimeDataService] Mempool.space hashrate rate limited (429)`);
      }

      // Get current difficulty
      if (difficultyResponse.ok) {
        const difficultyData = await difficultyResponse.json();
        if (difficultyData.currentDifficulty) {
          results.difficulty = Number(difficultyData.currentDifficulty);
        } else if (difficultyData.difficulty) {
          results.difficulty = Number(difficultyData.difficulty);
        }
      } else if (difficultyResponse.status === 429) {
        console.warn(`[RealTimeDataService] Mempool.space difficulty rate limited (429)`);
      }

      // Get current block height
      if (blockHeightResponse.ok) {
        const blockHeight = await blockHeightResponse.json();
        if (typeof blockHeight === "number") {
          results.blockHeight = blockHeight;
        }
      } else if (blockHeightResponse.status === 429) {
        console.warn(`[RealTimeDataService] Mempool.space block height rate limited (429)`);
      }

      return Object.keys(results).length > 0 ? results : null;
    } catch (error) {
      console.error("Error fetching Mempool.space network data:", error);
      return null;
    }
  }



  private async fetchBitcoinSentimentData(): Promise<BitcoinSentimentData | null> {
    try {
      const response = await fetch(`${this.ALTERNATIVE_API}/fng/`, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        return {
          fearGreedIndex: Number(data.data[0].value),
          fearGreedValue: data.data[0].value_classification,
        };
      } else if (response.status === 429) {
        console.warn(`[RealTimeDataService] Alternative.me sentiment rate limited (429)`);
        return null;
      } else {
        console.warn(`[RealTimeDataService] Alternative.me API error: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error("Error fetching Bitcoin sentiment data:", error);
      return null;
    }
  }

  private async fetchBitcoinMempoolData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      // Fetch mempool data in parallel
      const [mempoolResponse, feesResponse] = await Promise.all([
        fetch(`${this.MEMPOOL_API}/mempool`, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        }),
        fetch(`${this.MEMPOOL_API}/v1/fees/recommended`, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        }),
      ]);

      if (!mempoolResponse.ok || !feesResponse.ok) {
        if (mempoolResponse.status === 429 || feesResponse.status === 429) {
          console.warn(`[RealTimeDataService] Mempool.space mempool data rate limited (429)`);
        } else {
          console.warn(`[RealTimeDataService] Mempool.space mempool data API error: ${mempoolResponse.status}, ${feesResponse.status}`);
        }
        return null;
      }

      const [mempoolData, feesData] = await Promise.all([
        mempoolResponse.json(),
        feesResponse.json(),
      ]);

      return {
        mempoolSize: mempoolData.vsize || null, // Virtual size in bytes
        mempoolTxs: mempoolData.count || null, // Number of transactions
        mempoolFees: {
          fastestFee: feesData.fastestFee || null,
          halfHourFee: feesData.halfHourFee || null,
          economyFee: feesData.economyFee || null,
        },
        miningRevenue: mempoolData.total_fee || null, // Total fees in satoshis
        miningRevenue24h: null, // We'll need another endpoint for this
      };
    } catch (error) {
      console.error("Error fetching Bitcoin mempool data:", error);
      return null;
    }
  }

  // Curated altcoins data management
  private isCuratedCacheValid(): boolean {
    if (!this.curatedAltcoinsCache) return false;
    return (
      Date.now() - this.curatedAltcoinsCache.timestamp <
      this.CURATED_CACHE_DURATION
    );
  }

  private async updateCuratedAltcoinsData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isCuratedCacheValid()) {
      const data = await this.fetchCuratedAltcoinsData();
      if (data) {
        this.curatedAltcoinsCache = {
          data,
          timestamp: Date.now(),
        };
      }
    }
  }

  private async fetchCuratedAltcoinsData(): Promise<CuratedAltcoinsData | null> {
    try {
      const idsParam = this.curatedCoinIds.join(",");
      const data = await this.makeQueuedRequest(async () => {
        const response = await fetch(
          `${this.COINGECKO_API}/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
          {
            headers: {
              Accept: "application/json",
            },
            signal: AbortSignal.timeout(15000),
          },
        );

        if (!response.ok) {
          if (response.status === 429) {
            // Handle rate limiting with exponential backoff
            const retryAfter = response.headers.get('Retry-After');
            const backoffTime = retryAfter ? parseInt(retryAfter) * 1000 : 30000; // Default 30s
            console.warn(`[RealTimeDataService] Rate limited, backing off for ${backoffTime}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            throw new Error(`HTTP 429: Rate limited, retry after ${backoffTime}ms`);
          }
          if (response.status === 401 || response.status === 429) {
            console.warn(
              `[RealTimeDataService] CoinGecko API rate limited or unauthorized (${response.status}), using fallback data`,
            );
            return this.getFallbackCuratedAltcoinsData();
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      });

      // Ensure all requested IDs are present in the response (with zeroed data if missing)
      const result: CuratedAltcoinsData = {};
      this.curatedCoinIds.forEach((id) => {
        result[id] = data[id]
          ? {
              price: data[id].usd || 0,
              change24h: data[id].usd_24h_change || 0,
              marketCap: data[id].usd_market_cap || 0,
              volume24h: data[id].usd_24h_vol || 0,
            }
          : { price: 0, change24h: 0, marketCap: 0, volume24h: 0 };
      });

      console.log(
        `[RealTimeDataService] Fetched curated altcoins data for ${this.curatedCoinIds.length} coins`,
      );
      return result;
    } catch (error) {
      console.error("Error fetching curated altcoins data:", error);
      console.info(
        "[RealTimeDataService] Using fallback curated altcoins data",
      );
      return this.getFallbackCuratedAltcoinsData();
    }
  }

  // Top 100 vs BTC data is now handled by AltcoinDataService to avoid duplication

  // DEXScreener data management
  private isDexScreenerCacheValid(): boolean {
    if (!this.dexScreenerCache) return false;
    return (
      Date.now() - this.dexScreenerCache.timestamp <
      this.DEXSCREENER_CACHE_DURATION
    );
  }

  private async updateDexScreenerData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isDexScreenerCacheValid()) {
      const data = await this.fetchDexScreenerData();
      if (data) {
        this.dexScreenerCache = {
          data,
          timestamp: Date.now(),
        };
      }
    }
  }

  private async fetchDexScreenerData(): Promise<DexScreenerData | null> {
    try {
      console.log("[RealTimeDataService] Fetching DEXScreener data...");

      // Step 1: Fetch trending/boosted tokens
      const topTokensResponse = await fetch(
        `${this.DEXSCREENER_API}/token-boosts/top/v1`,
      );

      if (!topTokensResponse.ok) {
        throw new Error(`DEXScreener API error: ${topTokensResponse.status}`);
      }

      const topTokens: BoostedToken[] = await topTokensResponse.json();

      // Step 2: For each token, fetch pool data and aggregate metrics
      const enriched = await Promise.all(
        topTokens
          .slice(0, 50)
          .map(async (token): Promise<TrendingToken | null> => {
            try {
              const poolResponse = await fetch(
                `${this.DEXSCREENER_API}/token-pairs/v1/${token.chainId}/${token.tokenAddress}`,
              );

              if (!poolResponse.ok) return null;
              const pools: DexScreenerPool[] = await poolResponse.json();

              if (!pools.length) return null; // skip tokens with no pools

              const totalLiquidity = pools.reduce(
                (sum, pool) => sum + (Number(pool.liquidity?.usd) || 0),
                0,
              );
              const totalVolume = pools.reduce(
                (sum, pool) => sum + (Number(pool.volume?.h24) || 0),
                0,
              );
              const largestPool = pools.reduce(
                (max, pool) =>
                  (Number(pool.liquidity?.usd) || 0) >
                  (Number(max.liquidity?.usd) || 0)
                    ? pool
                    : max,
                pools[0] || {},
              );

              const priceUsd = largestPool.priceUsd
                ? Number(largestPool.priceUsd)
                : null;
              const marketCap = largestPool.marketCap
                ? Number(largestPool.marketCap)
                : null;
              const liquidityRatio =
                marketCap && marketCap > 0 ? totalLiquidity / marketCap : null;
              const icon =
                token.icon ||
                (largestPool.info && largestPool.info.imageUrl) ||
                "";

              // Only return tokens with at least one valid metric
              if (!priceUsd && !marketCap && !totalLiquidity && !totalVolume)
                return null;

              return {
                address: token.tokenAddress,
                chainId: token.chainId,
                image: icon,
                name: token.label || token.symbol || "",
                symbol: token.symbol || "",
                priceUsd,
                marketCap,
                totalLiquidity,
                totalVolume,
                poolsCount: pools.length,
                liquidityRatio,
              };
            } catch (error) {
              console.warn(
                `Failed to fetch pool data for token ${token.tokenAddress}:`,
                error,
              );
              return null;
            }
          }),
      );

      // Step 3: Filter and rank tokens (matching website logic)
      const trendingTokens = enriched
        .filter((t): t is NonNullable<typeof t> => t !== null)
        .filter((t) => t.chainId === "solana") // Focus on Solana tokens
        .filter(
          (t) =>
            t.totalLiquidity > 100_000 && // min $100k liquidity
            t.totalVolume > 20_000 && // min $20k 24h volume
            t.poolsCount &&
            t.poolsCount > 0, // at least 1 pool
        )
        .sort((a, b) => (b.liquidityRatio ?? 0) - (a.liquidityRatio ?? 0)) // Sort by liquidity ratio
        .slice(0, 9); // Limit to top 9

      const result: DexScreenerData = {
        topTokens,
        trendingTokens,
        lastUpdated: new Date(),
      };

      console.log(
        `[RealTimeDataService] Fetched DEXScreener data: ${topTokens.length} top tokens, ${trendingTokens.length} trending`,
      );
      return result;
    } catch (error) {
      console.error("Error in fetchDexScreenerData:", error);
      return null;
    }
  }

  // Top Movers (Gainers/Losers) data management
  private isTopMoversCacheValid(): boolean {
    if (!this.topMoversCache) return false;
    return (
      Date.now() - this.topMoversCache.timestamp <
      this.TOP_MOVERS_CACHE_DURATION
    );
  }

  private async updateTopMoversData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isTopMoversCacheValid()) {
      const data = await this.fetchTopMoversData();
      if (data) {
        this.topMoversCache = {
          data,
          timestamp: Date.now(),
        };
      }
    }
  }

  private async fetchTopMoversData(): Promise<TopMoversData | null> {
    try {
      const data = await this.makeQueuedRequest(async () => {
        const response = await fetch(
          `${this.COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(15000),
          },
        );

        if (!response.ok) {
          if (response.status === 429) {
            // Handle rate limiting with exponential backoff
            const retryAfter = response.headers.get('Retry-After');
            const backoffTime = retryAfter ? parseInt(retryAfter) * 1000 : 30000; // Default 30s
            console.warn(`[RealTimeDataService] Rate limited, backing off for ${backoffTime}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            throw new Error(`HTTP 429: Rate limited, retry after ${backoffTime}ms`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      });

      // Filter out coins without valid 24h price change percentage
      const validCoins = data.filter(
        (coin) => typeof coin.price_change_percentage_24h === "number",
      );

      // Sort by 24h price change percentage descending for gainers
      const topGainers = [...validCoins]
        .sort(
          (a, b) =>
            b.price_change_percentage_24h - a.price_change_percentage_24h,
        )
        .slice(0, 4)
        .map((coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: coin.image,
          market_cap_rank: coin.market_cap_rank,
          price_change_percentage_24h: coin.price_change_percentage_24h,
        }));

      // Sort by 24h price change percentage ascending for losers
      const topLosers = [...validCoins]
        .sort(
          (a, b) =>
            a.price_change_percentage_24h - b.price_change_percentage_24h,
        )
        .slice(0, 4)
        .map((coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: coin.image,
          market_cap_rank: coin.market_cap_rank,
          price_change_percentage_24h: coin.price_change_percentage_24h,
        }));

      const result: TopMoversData = {
        topGainers,
        topLosers,
        lastUpdated: new Date(),
      };

      console.log(
        `[RealTimeDataService] Fetched top movers: ${topGainers.length} gainers, ${topLosers.length} losers`,
      );
      return result;
    } catch (error) {
      console.error("Error in fetchTopMoversData:", error);
      return null;
    }
  }

  // Trending Coins data management
  private isTrendingCoinsCacheValid(): boolean {
    if (!this.trendingCoinsCache) return false;
    return (
      Date.now() - this.trendingCoinsCache.timestamp <
      this.TRENDING_COINS_CACHE_DURATION
    );
  }

  private async updateTrendingCoinsData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isTrendingCoinsCacheValid()) {
      const data = await this.fetchTrendingCoinsData();
      if (data) {
        this.trendingCoinsCache = {
          data,
          timestamp: Date.now(),
        };
      }
    }
  }

  private async fetchTrendingCoinsData(): Promise<TrendingCoinsData | null> {
    try {
      const data = await this.makeQueuedRequest(async () => {
        const response = await fetch(
          `${this.COINGECKO_API}/search/trending`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(15000),
          },
        );

        if (!response.ok) {
          if (response.status === 429) {
            // Handle rate limiting with exponential backoff
            const retryAfter = response.headers.get('Retry-After');
            const backoffTime = retryAfter ? parseInt(retryAfter) * 1000 : 30000; // Default 30s
            console.warn(`[RealTimeDataService] Rate limited, backing off for ${backoffTime}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            throw new Error(`HTTP 429: Rate limited, retry after ${backoffTime}ms`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      });

      // Map and validate trending coins (matches website exactly)
      const trending: TrendingCoin[] = Array.isArray(data.coins)
        ? data.coins.map((c: CoinGeckoTrendingItem) => ({
            id: c.item.id,
            name: c.item.name,
            symbol: c.item.symbol,
            market_cap_rank: c.item.market_cap_rank,
            thumb: c.item.thumb,
            score: c.item.score,
          }))
        : [];

      const result: TrendingCoinsData = {
        coins: trending,
        lastUpdated: new Date(),
      };

      console.log(
        `[RealTimeDataService] Fetched trending coins: ${trending.length} coins`,
      );
      return result;
    } catch (error) {
      console.error("Error in fetchTrendingCoinsData:", error);
      return null;
    }
  }

  // Curated NFTs data management
  private isCuratedNFTsCacheValid(): boolean {
    if (!this.curatedNFTsCache) return false;
    return (
      Date.now() - this.curatedNFTsCache.timestamp <
      this.CURATED_NFTS_CACHE_DURATION
    );
  }

  private async updateCuratedNFTsData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isCuratedNFTsCacheValid()) {
      const data = await this.fetchCuratedNFTsData();
      if (data) {
        this.curatedNFTsCache = {
          data,
          timestamp: Date.now(),
        };
      }
    }
  }

  private async fetchCuratedNFTsData(): Promise<CuratedNFTsData | null> {
    try {
      const idsParam = this.curatedNFTCollections.map(collection => collection.slug).join(",");
      const data = await this.makeQueuedRequest(async () => {
        const response = await fetch(
          `${this.COINGECKO_API}/search/nft-collections?ids=${idsParam}&order=market_cap_desc&per_page=10&page=1`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(15000),
          },
        );

        if (!response.ok) {
          if (response.status === 429) {
            // Handle rate limiting with exponential backoff
            const retryAfter = response.headers.get('Retry-After');
            const backoffTime = retryAfter ? parseInt(retryAfter) * 1000 : 30000; // Default 30s
            console.warn(`[RealTimeDataService] Rate limited, backing off for ${backoffTime}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            throw new Error(`HTTP 429: Rate limited, retry after ${backoffTime}ms`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      });

      // Map and validate NFT collections (matches website exactly)
      const collections: NFTCollectionData[] = Array.isArray(data.collections)
        ? data.collections.map((c: any) => ({
            slug: c.slug,
            collection: {
              collection: c.name,
              name: c.name,
              description: c.description,
              image_url: c.image_url,
              banner_image_url: c.banner_image_url,
              owner: c.owner,
              category: c.category,
              is_disabled: c.is_disabled,
              is_nsfw: c.is_nsfw,
              trait_offers_enabled: c.trait_offers_enabled,
              collection_offers_enabled: c.collection_offers_enabled,
              opensea_url: c.opensea_url,
              project_url: c.project_url,
              wiki_url: c.wiki_url,
              discord_url: c.discord_url,
              telegram_url: c.telegram_url,
              twitter_username: c.twitter_username,
              instagram_username: c.instagram_username,
              contracts: c.contracts.map((contract: any) => ({
                address: contract.address,
                chain: contract.chain,
              })),
              editors: c.editors,
              fees: c.fees.map((fee: any) => ({
                fee: fee.fee,
                recipient: fee.recipient,
                required: fee.required,
              })),
              rarity: {
                strategy_id: c.rarity.strategy_id,
                strategy_version: c.rarity.strategy_version,
                rank_at: c.rarity.rank_at,
                max_rank: c.rarity.max_rank,
                tokens_scored: c.rarity.tokens_scored,
              },
              total_supply: c.total_supply,
              created_date: c.created_date,
            },
            stats: {
              total_supply: c.stats.total_supply,
              num_owners: c.stats.num_owners,
              average_price: c.stats.average_price,
              floor_price: c.stats.floor_price,
              market_cap: c.stats.market_cap,
              one_day_volume: c.stats.one_day_volume,
              one_day_change: c.stats.one_day_change,
              one_day_sales: c.stats.one_day_sales,
              seven_day_volume: c.stats.seven_day_volume,
              seven_day_change: c.stats.seven_day_change,
              seven_day_sales: c.stats.seven_day_sales,
              thirty_day_volume: c.stats.thirty_day_volume,
              thirty_day_change: c.stats.thirty_day_change,
              thirty_day_sales: c.stats.thirty_day_sales,
            },
            lastUpdated: new Date(),
            category: c.category,
            floorItems: c.floorItems,
            recentSales: c.recentSales,
            contractAddress: c.contractAddress,
            blockchain: c.blockchain,
          }))
        : [];

      // Calculate summary statistics
      const totalVolume24h = collections.reduce((total, collection) => total + collection.stats.one_day_volume, 0);
      const totalMarketCap = collections.reduce((total, collection) => total + collection.stats.market_cap, 0);
      const avgFloorPrice = collections.reduce((total, collection) => total + collection.stats.floor_price, 0) / collections.length;
      const topPerformers = collections.slice(0, 5); // Top 5 performers
      const worstPerformers = collections.slice(-5); // Bottom 5 performers
      const totalCollections = collections.length;

      const result: CuratedNFTsData = {
        collections,
        summary: {
          totalVolume24h,
          totalMarketCap,
          avgFloorPrice,
          topPerformers,
          worstPerformers,
          totalCollections,
        },
        lastUpdated: new Date(),
      };

      console.log(
        `[RealTimeDataService] Fetched curated NFTs data: ${collections.length} collections`,
      );
      return result;
    } catch (error) {
      console.error("Error in fetchCuratedNFTsData:", error);
      return null;
    }
  }
}