import { IAgentRuntime, logger } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';
import axios from 'axios';

// Altcoin and cryptocurrency market data interfaces
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

export interface Top100VsBtcCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
}

export interface Top100VsBtcData {
  outperforming: Top100VsBtcCoin[];
  underperforming: Top100VsBtcCoin[];
  totalCoins: number;
  outperformingCount: number;
  underperformingCount: number;
  averagePerformance: number;
  topPerformers: Top100VsBtcCoin[];
  worstPerformers: Top100VsBtcCoin[];
  lastUpdated: Date;
}

export interface Top100VsBtcCache {
  data: Top100VsBtcData;
  timestamp: number;
}

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

export class AltcoinDataService extends BaseDataService {
  static serviceType = 'altcoin-data';
  capabilityDescription = 'Provides comprehensive altcoin market data, trending tokens, and comparative analysis';
  
  // API endpoints
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly DEXSCREENER_API = 'https://api.dexscreener.com';
  
  // Curated altcoins list (matching LiveTheLifeTV website)
  private readonly curatedCoinIds = [
    'ethereum',
    'chainlink',
    'uniswap',
    'aave',
    'ondo-finance', 
    'ethena', 
    'solana',
    'sui',
    'hyperliquid', 
    'berachain-bera', 
    'infrafred-bgt', 
    'avalanche-2',
    'blockstack',
    'dogecoin',
    'pepe',
    'mog-coin',
    'bittensor',
    'render-token',
    'fartcoin',
    'railgun'
  ];

  // Cache storage and durations
  private marketData: MarketData[] = [];
  private curatedAltcoinsCache: CuratedAltcoinsCache | null = null;
  private readonly CURATED_CACHE_DURATION = 60 * 1000; // 1 minute
  private top100VsBtcCache: Top100VsBtcCache | null = null;
  private readonly TOP100_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (matches website revalidation)
  private dexScreenerCache: DexScreenerCache | null = null;
  private readonly DEXSCREENER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for trending data
  private topMoversCache: TopMoversCache | null = null;
  private readonly TOP_MOVERS_CACHE_DURATION = 60 * 1000; // 1 minute (matches website)
  private trendingCoinsCache: TrendingCoinsCache | null = null;
  private readonly TRENDING_COINS_CACHE_DURATION = 60 * 1000; // 1 minute (matches website)

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('AltcoinDataService starting...');
    const service = new AltcoinDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('AltcoinDataService stopping...');
    const service = runtime.getService('altcoin-data');
    if (service && service.stop) {
      await service.stop();
    }
  }

  async init() {
    logger.info('AltcoinDataService initialized');
    
    // Initial data load
    await this.updateData();
  }

  async stop() {
    logger.info('AltcoinDataService stopped');
    // Clear cache and clean up any resources
    this.curatedAltcoinsCache = null;
    this.top100VsBtcCache = null;
    this.dexScreenerCache = null;
    this.topMoversCache = null;
    this.trendingCoinsCache = null;
  }

  // Required abstract method implementations
  async updateData(): Promise<void> {
    await Promise.all([
      this.updateMarketData(),
      this.updateCuratedAltcoinsData(),
      this.updateTop100VsBtcData(),
      this.updateDexScreenerData(),
      this.updateTopMoversData(),
      this.updateTrendingCoinsData()
    ]);
  }

  async forceUpdate(): Promise<void> {
    // Clear all caches to force fresh data
    this.curatedAltcoinsCache = null;
    this.top100VsBtcCache = null;
    this.dexScreenerCache = null;
    this.topMoversCache = null;
    this.trendingCoinsCache = null;
    await this.updateData();
  }

  // Public API methods
  public getMarketData(): MarketData[] {
    return this.marketData || [];
  }

  public getMarketDataBySymbol(symbol: string): MarketData | undefined {
    return this.marketData.find(market => market.symbol === symbol);
  }

  public getCuratedAltcoinsData(): CuratedAltcoinsData | null {
    if (!this.curatedAltcoinsCache || !this.isCuratedCacheValid()) {
      return null;
    }
    return this.curatedAltcoinsCache.data;
  }

  public getTop100VsBtcData(): Top100VsBtcData | null {
    if (!this.top100VsBtcCache || !this.isTop100CacheValid()) {
      return null;
    }
    return this.top100VsBtcCache.data;
  }

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

  // Force update methods
  public async forceCuratedAltcoinsUpdate(): Promise<CuratedAltcoinsData | null> {
    return await this.fetchCuratedAltcoinsData();
  }

  public async forceTop100VsBtcUpdate(): Promise<Top100VsBtcData | null> {
    return await this.fetchTop100VsBtcData();
  }

  public async forceDexScreenerUpdate(): Promise<DexScreenerData | null> {
    return await this.fetchDexScreenerData();
  }

  public async forceTopMoversUpdate(): Promise<TopMoversData | null> {
    return await this.fetchTopMoversData();
  }

  public async forceTrendingCoinsUpdate(): Promise<TrendingCoinsData | null> {
    return await this.fetchTrendingCoinsData();
  }

  // Data update methods
  private async updateMarketData(): Promise<void> {
    try {
      this.marketData = await this.fetchMarketData();
    } catch (error) {
      logger.error('Error updating market data:', error);
    }
  }

  private async updateCuratedAltcoinsData(): Promise<void> {
    if (!this.isCuratedCacheValid()) {
      const data = await this.fetchCuratedAltcoinsData();
      if (data) {
        this.curatedAltcoinsCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  private async updateTop100VsBtcData(): Promise<void> {
    if (!this.isTop100CacheValid()) {
      const data = await this.fetchTop100VsBtcData();
      if (data) {
        this.top100VsBtcCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  private async updateDexScreenerData(): Promise<void> {
    if (!this.isDexScreenerCacheValid()) {
      const data = await this.fetchDexScreenerData();
      if (data) {
        this.dexScreenerCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  private async updateTopMoversData(): Promise<void> {
    if (!this.isTopMoversCacheValid()) {
      const data = await this.fetchTopMoversData();
      if (data) {
        this.topMoversCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  private async updateTrendingCoinsData(): Promise<void> {
    if (!this.isTrendingCoinsCacheValid()) {
      const data = await this.fetchTrendingCoinsData();
      if (data) {
        this.trendingCoinsCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  // Cache validation methods
  private isCuratedCacheValid(): boolean {
    if (!this.curatedAltcoinsCache) return false;
    return Date.now() - this.curatedAltcoinsCache.timestamp < this.CURATED_CACHE_DURATION;
  }

  private isTop100CacheValid(): boolean {
    if (!this.top100VsBtcCache) return false;
    return Date.now() - this.top100VsBtcCache.timestamp < this.TOP100_CACHE_DURATION;
  }

  private isDexScreenerCacheValid(): boolean {
    if (!this.dexScreenerCache) return false;
    return Date.now() - this.dexScreenerCache.timestamp < this.DEXSCREENER_CACHE_DURATION;
  }

  private isTopMoversCacheValid(): boolean {
    if (!this.topMoversCache) return false;
    return Date.now() - this.topMoversCache.timestamp < this.TOP_MOVERS_CACHE_DURATION;
  }

  private isTrendingCoinsCacheValid(): boolean {
    if (!this.trendingCoinsCache) return false;
    return Date.now() - this.trendingCoinsCache.timestamp < this.TRENDING_COINS_CACHE_DURATION;
  }

  // Core data fetching methods
  private async fetchMarketData(): Promise<MarketData[]> {
    try {
      const coingeckoApiKey = this.runtime.getSetting('COINGECKO_API_KEY');
      const baseUrl = coingeckoApiKey 
        ? 'https://pro-api.coingecko.com/api/v3' 
        : 'https://api.coingecko.com/api/v3';

      const headers = coingeckoApiKey 
        ? { 'x-cg-pro-api-key': coingeckoApiKey }
        : {};

      // Fetch crypto data using queued request
      const cryptoIds = 'bitcoin,ethereum,solana,polygon,cardano';
      const cryptoData = await this.makeQueuedRequest(async () => {
        const params = new URLSearchParams({
          ids: cryptoIds,
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_24hr_vol: 'true',
          include_market_cap: 'true',
          include_last_updated_at: 'true'
        });
        const url = `${baseUrl}/simple/price?${params.toString()}`;
        const response = await this.fetchWithRetry(url, {
          method: 'GET',
          headers
        });
        return response;
      });

      const marketData: MarketData[] = Object.entries(cryptoData).map(([id, data]: [string, any]) => ({
        symbol: this.getSymbolFromId(id),
        price: data.usd || 0,
        change24h: data.usd_24h_change || 0,
        changePercent24h: data.usd_24h_change || 0,
        volume24h: data.usd_24h_vol || 0,
        marketCap: data.usd_market_cap || 0,
        lastUpdate: new Date(data.last_updated_at ? data.last_updated_at * 1000 : Date.now()),
        source: 'CoinGecko'
      }));

      // Fetch stock data with delay
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      const stockData = await this.fetchStockData();
      
      return [...marketData, ...stockData];
    } catch (error) {
      logger.error('Error fetching market data:', error);
      return this.getFallbackMarketData();
    }
  }

  private async fetchStockData(): Promise<MarketData[]> {
    try {
      // Using Alpha Vantage for stock data (free tier available)
      const alphaVantageKey = this.runtime.getSetting('ALPHA_VANTAGE_API_KEY');
      if (!alphaVantageKey) {
        return this.getFallbackStockData();
      }

      // Fetch data for major tech stocks as proxies
      const symbols = ['MSFT', 'GOOGL', 'TSLA']; // High-performing tech stocks
      const stockPromises = symbols.map(async symbol => {
        try {
          const response = await axios.get('https://www.alphavantage.co/query', {
            params: {
              function: 'GLOBAL_QUOTE',
              symbol: symbol,
              apikey: alphaVantageKey
            },
            timeout: 10000
          });

          const quote = response.data['Global Quote'];
          return {
            symbol: symbol,
            price: parseFloat(quote['05. price']) || 0,
            change24h: parseFloat(quote['09. change']) || 0,
            changePercent24h: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
            volume24h: parseInt(quote['06. volume']) || 0,
            marketCap: 0, // Not available in basic quote
            lastUpdate: new Date(),
            source: 'Alpha Vantage'
          };
        } catch (error) {
          logger.error(`Error fetching data for ${symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(stockPromises);
      return results.filter(Boolean) as MarketData[];
    } catch (error) {
      logger.error('Error fetching stock data:', error);
      return this.getFallbackStockData();
    }
  }

  private async fetchCuratedAltcoinsData(): Promise<CuratedAltcoinsData | null> {
    try {
      const idsParam = this.curatedCoinIds.join(',');
      const data = await this.makeQueuedRequest(async () => {
        return await this.fetchWithRetry(
          `${this.COINGECKO_API}/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );
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

      logger.info(`[AltcoinDataService] Fetched curated altcoins data for ${this.curatedCoinIds.length} coins`);
      return result;
    } catch (error) {
      logger.error('Error fetching curated altcoins data:', error);
      return null;
    }
  }

  private async fetchTop100VsBtcData(): Promise<Top100VsBtcData | null> {
    try {
      // Step 1: Fetch top 100 coins against BTC to find outperformers and their performance vs BTC
      const btcMarketData = await this.makeQueuedRequest(async () => {
        return await this.fetchWithRetry(
          `${this.COINGECKO_API}/coins/markets?vs_currency=btc&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d`,
          {
            headers: { 'Accept': 'application/json' }
          }
        );
      });

      // Step 2: Separate outperformers and underperformers
      const outperformingVsBtc = btcMarketData.filter(
        (coin: any) => coin.price_change_percentage_24h > 0
      );
      
      const underperformingVsBtc = btcMarketData.filter(
        (coin: any) => coin.price_change_percentage_24h <= 0
      );

      if (outperformingVsBtc.length === 0) {
        // Return empty data structure if no outperformers
        return {
          outperforming: [],
          underperforming: underperformingVsBtc.slice(0, 10), // Show top 10 underperformers
          totalCoins: btcMarketData.length,
          outperformingCount: 0,
          underperformingCount: underperformingVsBtc.length,
          averagePerformance: 0,
          topPerformers: [],
          worstPerformers: underperformingVsBtc.slice(0, 5),
          lastUpdated: new Date()
        };
      }

      // Step 3: Get USD prices for outperforming coins
      const outperformingIds = outperformingVsBtc.map((coin: any) => coin.id).join(',');
      const usdPrices = await this.makeQueuedRequest(async () => {
        return await this.fetchWithRetry(
          `${this.COINGECKO_API}/simple/price?ids=${outperformingIds}&vs_currencies=usd`,
          {
            headers: { 'Accept': 'application/json' }
          }
        );
      });

      // Step 4: Combine BTC-denominated performance data with USD prices
      const outperformingWithUsd = outperformingVsBtc.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        current_price: usdPrices[coin.id]?.usd ?? 0,
        market_cap_rank: coin.market_cap_rank,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        price_change_percentage_7d_in_currency: coin.price_change_percentage_7d_in_currency,
        price_change_percentage_30d_in_currency: coin.price_change_percentage_30d_in_currency,
      }));

      // Step 5: Calculate analytics
      const totalCoins = btcMarketData.length;
      const outperformingCount = outperformingWithUsd.length;
      const underperformingCount = underperformingVsBtc.length;
      
      const averagePerformance = btcMarketData.reduce((sum: number, coin: any) => 
        sum + coin.price_change_percentage_24h, 0) / totalCoins;

      // Sort for top/worst performers
      const sortedOutperformers = [...outperformingWithUsd].sort((a, b) => 
        b.price_change_percentage_24h - a.price_change_percentage_24h);
      
      const sortedUnderperformers = [...underperformingVsBtc].sort((a, b) => 
        a.price_change_percentage_24h - b.price_change_percentage_24h);

      const result: Top100VsBtcData = {
        outperforming: outperformingWithUsd,
        underperforming: underperformingVsBtc.slice(0, 10), // Limit to top 10 for readability
        totalCoins,
        outperformingCount,
        underperformingCount,
        averagePerformance,
        topPerformers: sortedOutperformers.slice(0, 10), // Top 10 performers
        worstPerformers: sortedUnderperformers.slice(0, 5), // Worst 5 performers
        lastUpdated: new Date()
      };

      logger.info(`[AltcoinDataService] Fetched top 100 vs BTC data: ${outperformingCount}/${totalCoins} outperforming`);
      return result;
      
    } catch (error) {
      logger.error('Error in fetchTop100VsBtcData:', error);
      return null;
    }
  }

  private async fetchDexScreenerData(): Promise<DexScreenerData | null> {
    try {
      logger.info('[AltcoinDataService] Fetching DEXScreener data...');
      
      // Step 1: Fetch trending/boosted tokens
      const topTokensResponse = await fetch(`${this.DEXSCREENER_API}/token-boosts/top/v1`);
      
      if (!topTokensResponse.ok) {
        throw new Error(`DEXScreener API error: ${topTokensResponse.status}`);
      }
      
      const topTokens: BoostedToken[] = await topTokensResponse.json();
      
      // Step 2: For each token, fetch pool data and aggregate metrics
      const enriched = await Promise.all(
        topTokens.slice(0, 50).map(async (token): Promise<TrendingToken | null> => {
          try {
            const poolResponse = await fetch(
              `${this.DEXSCREENER_API}/token-pairs/v1/${token.chainId}/${token.tokenAddress}`
            );
            
            if (!poolResponse.ok) return null;
            const pools: DexScreenerPool[] = await poolResponse.json();
            
            if (!pools.length) return null; // skip tokens with no pools
            
            const totalLiquidity = pools.reduce(
              (sum, pool) => sum + (Number(pool.liquidity?.usd) || 0),
              0
            );
            const totalVolume = pools.reduce(
              (sum, pool) => sum + (Number(pool.volume?.h24) || 0),
              0
            );
            const largestPool = pools.reduce(
              (max, pool) =>
                (Number(pool.liquidity?.usd) || 0) > (Number(max.liquidity?.usd) || 0)
                  ? pool
                  : max,
              pools[0] || {}
            );
            
            const priceUsd = largestPool.priceUsd ? Number(largestPool.priceUsd) : null;
            const marketCap = largestPool.marketCap ? Number(largestPool.marketCap) : null;
            const liquidityRatio = marketCap && marketCap > 0 ? totalLiquidity / marketCap : null;
            const icon = token.icon || (largestPool.info && largestPool.info.imageUrl) || '';
            
            // Only return tokens with at least one valid metric
            if (!priceUsd && !marketCap && !totalLiquidity && !totalVolume) return null;
            
            return {
              address: token.tokenAddress,
              chainId: token.chainId,
              image: icon,
              name: token.label || token.symbol || '',
              symbol: token.symbol || '',
              priceUsd,
              marketCap,
              totalLiquidity,
              totalVolume,
              poolsCount: pools.length,
              liquidityRatio,
            };
          } catch (error) {
            logger.warn(`Failed to fetch pool data for token ${token.tokenAddress}:`, error);
            return null;
          }
        })
      );
      
      // Step 3: Filter and rank tokens (matching website logic)
      const trendingTokens = enriched
        .filter((t): t is NonNullable<typeof t> => t !== null)
        .filter((t) => t.chainId === 'solana') // Focus on Solana tokens
        .filter(
          (t) =>
            t.totalLiquidity > 100_000 && // min $100k liquidity
            t.totalVolume > 20_000 && // min $20k 24h volume
            t.poolsCount && t.poolsCount > 0 // at least 1 pool
        )
        .sort((a, b) => (b.liquidityRatio ?? 0) - (a.liquidityRatio ?? 0)) // Sort by liquidity ratio
        .slice(0, 9); // Limit to top 9
      
      const result: DexScreenerData = {
        topTokens,
        trendingTokens,
        lastUpdated: new Date()
      };
      
      logger.info(`[AltcoinDataService] Fetched DEXScreener data: ${topTokens.length} top tokens, ${trendingTokens.length} trending`);
      return result;
      
    } catch (error) {
      logger.error('Error in fetchDexScreenerData:', error);
      return null;
    }
  }

  private async fetchTopMoversData(): Promise<TopMoversData | null> {
    try {
      logger.info('[AltcoinDataService] Fetching top movers data...');
      
      const data: TopMoverCoin[] = await this.fetchWithRetry(
        `${this.COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );
      
      // Filter out coins without valid 24h price change percentage
      const validCoins = data.filter((coin) => typeof coin.price_change_percentage_24h === 'number');
      
      // Sort by 24h price change percentage descending for gainers
      const topGainers = [...validCoins]
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
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
        .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
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
        lastUpdated: new Date()
      };
      
      logger.info(`[AltcoinDataService] Fetched top movers: ${topGainers.length} gainers, ${topLosers.length} losers`);
      return result;
      
    } catch (error) {
      logger.error('Error in fetchTopMoversData:', error);
      return null;
    }
  }

  private async fetchTrendingCoinsData(): Promise<TrendingCoinsData | null> {
    try {
      logger.info('[AltcoinDataService] Fetching trending coins data...');
      
      const data = await this.fetchWithRetry('https://api.coingecko.com/api/v3/search/trending', {
        headers: { 'Accept': 'application/json' },
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
        lastUpdated: new Date()
      };
      
      logger.info(`[AltcoinDataService] Fetched trending coins: ${trending.length} coins`);
      return result;
      
    } catch (error) {
      logger.error('Error in fetchTrendingCoinsData:', error);
      return null;
    }
  }

  // Utility methods
  protected async fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<any> {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (response.status === 429) {
          // Rate limited - exponential backoff
          const waitTime = Math.min(Math.pow(2, i) * 5000, 60000); // 5s, 10s, 20s, up to 60s
          logger.warn(`Rate limited, waiting ${waitTime}ms before retry ${i + 1}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          const waitTime = Math.min(Math.pow(2, i) * 3000, 30000); // 3s, 6s, 12s, up to 30s
          logger.warn(`Request failed, waiting ${waitTime}ms before retry ${i + 1}:`, error);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }

  private getSymbolFromId(id: string): string {
    const mapping: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'solana': 'SOL',
      'polygon': 'MATIC',
      'cardano': 'ADA'
    };
    return mapping[id] || id.toUpperCase();
  }

  // Fallback data methods
  private getFallbackMarketData(): MarketData[] {
    return [
      {
        symbol: 'BTC',
        price: 45000,
        change24h: 2000,
        changePercent24h: 4.7,
        volume24h: 25000000000,
        marketCap: 880000000000,
        lastUpdate: new Date(),
        source: 'Fallback'
      },
      {
        symbol: 'ETH',
        price: 2800,
        change24h: 150,
        changePercent24h: 5.7,
        volume24h: 12000000000,
        marketCap: 340000000000,
        lastUpdate: new Date(),
        source: 'Fallback'
      }
    ];
  }

  private getFallbackStockData(): MarketData[] {
    return [
      {
        symbol: 'MSFT',
        price: 380,
        change24h: 5.2,
        changePercent24h: 1.4,
        volume24h: 25000000,
        marketCap: 2800000000000,
        lastUpdate: new Date(),
        source: 'Fallback'
      }
    ];
  }
} 