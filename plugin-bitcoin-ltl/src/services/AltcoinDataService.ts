import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";

// Simplified interfaces for basic altcoin data
export interface SimpleCoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdate: Date;
}

export interface CuratedAltcoinsData {
  [coinId: string]: SimpleCoinData;
}

export interface CuratedAltcoinsCache {
  data: CuratedAltcoinsData;
  timestamp: number;
}

// Simplified trending data
export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  score: number;
}

export interface TrendingCoinsData {
  coins: TrendingCoin[];
  lastUpdated: Date;
}

export interface TrendingCoinsCache {
  data: TrendingCoinsData;
  timestamp: number;
}

export class AltcoinDataService extends BaseDataService {
  static serviceType = "altcoin-data";
  capabilityDescription = "Provides basic altcoin market data for curated coins";

  // API endpoints
  private readonly COINGECKO_API = "https://api.coingecko.com/api/v3";

  // Curated altcoins list (focused on major coins)
  private readonly curatedCoinIds = [
    "ethereum",
    "solana", 
    "sui",
    "hyperliquid",
    "pepe",
    "bonk",
    "uniswap",
    "aave",
    "chainlink",
    "dogecoin",
    "avalanche-2",
    "polygon",
    "cardano",
    "polkadot",
    "litecoin"
  ];

  // Cache storage
  private curatedAltcoinsCache: CuratedAltcoinsCache | null = null;
  private readonly CURATED_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private trendingCoinsCache: TrendingCoinsCache | null = null;
  private readonly TRENDING_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  constructor(runtime: IAgentRuntime) {
    super(runtime, "altcoinData");
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("AltcoinDataService starting...");
    const service = new AltcoinDataService(runtime);
    await service.start();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("AltcoinDataService stopping...");
    const service = runtime.getService("altcoin-data") as AltcoinDataService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    logger.info("AltcoinDataService starting...");
    await this.init();
    logger.info("AltcoinDataService started successfully");
  }

  async init() {
    logger.info("AltcoinDataService initialized");
  }

  async stop(): Promise<void> {
    logger.info("AltcoinDataService stopped");
  }

  async updateData(): Promise<void> {
    try {
      await Promise.allSettled([
        this.updateCuratedAltcoinsData(),
        this.updateTrendingCoinsData(),
      ]);
    } catch (error) {
      logger.warn("[AltcoinDataService] Error updating data:", error);
    }
  }

  async forceUpdate(): Promise<void> {
    this.curatedAltcoinsCache = null;
    this.trendingCoinsCache = null;
    await this.updateData();
  }

  // Public getters
  public getCuratedAltcoinsData(): CuratedAltcoinsData | null {
    if (this.isCuratedCacheValid()) {
      return this.curatedAltcoinsCache?.data || null;
    }
    return null;
  }

  public getTrendingCoinsData(): TrendingCoinsData | null {
    if (this.isTrendingCacheValid()) {
      return this.trendingCoinsCache?.data || null;
    }
    return null;
  }

  // Force update methods
  public async forceCuratedAltcoinsUpdate(): Promise<CuratedAltcoinsData | null> {
    this.curatedAltcoinsCache = null;
    await this.updateCuratedAltcoinsData();
    return this.getCuratedAltcoinsData();
  }

  public async forceTrendingCoinsUpdate(): Promise<TrendingCoinsData | null> {
    this.trendingCoinsCache = null;
    await this.updateTrendingCoinsData();
    return this.getTrendingCoinsData();
  }

  // Private update methods
  private async updateCuratedAltcoinsData(): Promise<void> {
    if (this.isCuratedCacheValid()) {
      return;
    }

    try {
      const data = await this.fetchCuratedAltcoinsData();
      if (data) {
        this.curatedAltcoinsCache = {
          data,
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      logger.warn("[AltcoinDataService] Error updating curated altcoins data:", error);
    }
  }

  private async updateTrendingCoinsData(): Promise<void> {
    if (this.isTrendingCacheValid()) {
      return;
    }

    try {
      const data = await this.fetchTrendingCoinsData();
      if (data) {
        this.trendingCoinsCache = {
          data,
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      logger.warn("[AltcoinDataService] Error updating trending coins data:", error);
    }
  }

  // Cache validation
  private isCuratedCacheValid(): boolean {
    return (
      this.curatedAltcoinsCache !== null &&
      Date.now() - this.curatedAltcoinsCache.timestamp < this.CURATED_CACHE_DURATION
    );
  }

  private isTrendingCacheValid(): boolean {
    return (
      this.trendingCoinsCache !== null &&
      Date.now() - this.trendingCoinsCache.timestamp < this.TRENDING_CACHE_DURATION
    );
  }

  // Data fetching methods
  private async fetchCuratedAltcoinsData(): Promise<CuratedAltcoinsData | null> {
    try {
      const response = await this.makeQueuedRequest(async () => {
        const url = `${this.COINGECKO_API}/coins/markets?vs_currency=usd&ids=${this.curatedCoinIds.join(",")}&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h&sparkline=false`;
        
        const result = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await result.json();
      });

      if (!Array.isArray(response) || response.length === 0) {
        logger.warn("[AltcoinDataService] Invalid curated altcoins response");
        return this.getFallbackCuratedAltcoinsData();
      }

      const curatedData: CuratedAltcoinsData = {};
      
      response.forEach((coin: any) => {
        curatedData[coin.id] = {
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price || 0,
          change24h: coin.price_change_percentage_24h || 0,
          marketCap: coin.market_cap || 0,
          volume24h: coin.total_volume || 0,
          lastUpdate: new Date(),
        };
      });

      logger.info(`[AltcoinDataService] Fetched curated altcoins data for ${Object.keys(curatedData).length} coins`);
      return curatedData;

    } catch (error) {
      logger.warn("[AltcoinDataService] Error fetching curated altcoins data:", error);
      return this.getFallbackCuratedAltcoinsData();
    }
  }

  private async fetchTrendingCoinsData(): Promise<TrendingCoinsData | null> {
    try {
      const response = await this.makeQueuedRequest(async () => {
        const result = await fetch(`${this.COINGECKO_API}/search/trending`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10000),
        });

        if (!result.ok) {
          throw new Error(`HTTP ${result.status}: ${result.statusText}`);
        }

        return await result.json();
      });

      if (!response?.coins || !Array.isArray(response.coins)) {
        logger.warn("[AltcoinDataService] Invalid trending coins response");
        return this.getFallbackTrendingCoinsData();
      }

      const trendingCoins: TrendingCoin[] = response.coins
        .slice(0, 10) // Limit to top 10
        .map((item: any) => ({
          id: item.item.id,
          name: item.item.name,
          symbol: item.item.symbol,
          market_cap_rank: item.item.market_cap_rank || 0,
          score: item.item.score || 0,
        }));

      logger.info(`[AltcoinDataService] Fetched trending coins: ${trendingCoins.length} coins`);
      return {
        coins: trendingCoins,
        lastUpdated: new Date(),
      };

    } catch (error) {
      logger.warn("[AltcoinDataService] Error fetching trending coins data:", error);
      return this.getFallbackTrendingCoinsData();
    }
  }

  // Fallback data methods
  private getFallbackCuratedAltcoinsData(): CuratedAltcoinsData {
    logger.info("[AltcoinDataService] Using fallback curated altcoins data");
    
    return {
      ethereum: {
        id: "ethereum",
        symbol: "ETH",
        name: "Ethereum",
        price: 0, // No fallback price - will be handled by error state
        change24h: 0, // No fallback change
        marketCap: 0, // No fallback market cap
        volume24h: 0, // No fallback volume
        lastUpdate: new Date(),
      },
      solana: {
        id: "solana",
        symbol: "SOL",
        name: "Solana",
        price: 0, // No fallback price - will be handled by error state
        change24h: 0, // No fallback change
        marketCap: 0, // No fallback market cap
        volume24h: 0, // No fallback volume
        lastUpdate: new Date(),
      },
      pepe: {
        id: "pepe",
        symbol: "PEPE",
        name: "Pepe",
        price: 0, // No fallback price - will be handled by error state
        change24h: 0, // No fallback change
        marketCap: 0, // No fallback market cap
        volume24h: 0, // No fallback volume
        lastUpdate: new Date(),
      },
    };
  }

  private getFallbackTrendingCoinsData(): TrendingCoinsData {
    logger.info("[AltcoinDataService] Using fallback trending coins data");
    
    return {
      coins: [
        {
          id: "ethereum",
          name: "Ethereum",
          symbol: "ETH",
          market_cap_rank: 2,
          score: 100,
        },
        {
          id: "solana",
          name: "Solana",
          symbol: "SOL",
          market_cap_rank: 5,
          score: 95,
        },
        {
          id: "pepe",
          name: "Pepe",
          symbol: "PEPE",
          market_cap_rank: 25,
          score: 90,
        },
      ],
      lastUpdated: new Date(),
    };
  }
}
