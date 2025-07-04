import { IAgentRuntime, Service, logger } from '@elizaos/core';
import axios from 'axios';

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
  sentiment: 'positive' | 'negative' | 'neutral';
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
  type: 'price_threshold' | 'volume_spike' | 'news_sentiment' | 'technical_indicator';
  symbol: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
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

export class RealTimeDataService extends Service {
  static serviceType = 'real-time-data';
  capabilityDescription = 'Provides real-time market data, news feeds, and social sentiment analysis';
  
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 60000; // 1 minute
  private readonly symbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'ADA', '4337', '8958']; // Include MetaPlanet (4337) and Hyperliquid (8958)
  
  // API endpoints
  private readonly BLOCKCHAIN_API = 'https://api.blockchain.info';
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly ALTERNATIVE_API = 'https://api.alternative.me';
  private readonly MEMPOOL_API = 'https://mempool.space/api';
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
  
  // Data storage
  private marketData: MarketData[] = [];
  private newsItems: NewsItem[] = [];
  private socialSentiment: SocialSentiment[] = [];
  private economicIndicators: EconomicIndicator[] = [];
  private alerts: MarketAlert[] = [];
  private comprehensiveBitcoinData: ComprehensiveBitcoinData | null = null;
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
    super();
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('RealTimeDataService starting...');
    const service = new RealTimeDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('RealTimeDataService stopping...');
    const service = runtime.getService('real-time-data');
    if (service && service.stop) {
      await service.stop();
    }
  }

  async init() {
    logger.info('RealTimeDataService initialized');
    
    // Start real-time updates
    await this.startRealTimeUpdates();
  }

  async stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    logger.info('RealTimeDataService stopped');
  }

  private async startRealTimeUpdates(): Promise<void> {
    // Initial data load
    await this.updateAllData();

    // Set up periodic updates
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateAllData();
      } catch (error) {
        console.error('Error updating real-time data:', error);
      }
    }, this.UPDATE_INTERVAL);
  }

  private async updateAllData(): Promise<void> {
    try {
      // Run all updates in parallel for efficiency
      const [marketData, newsItems, socialSentiment, economicIndicators, comprehensiveBitcoinData] = await Promise.all([
        this.fetchMarketData(),
        this.fetchNewsData(),
        this.fetchSocialSentiment(),
        this.fetchEconomicIndicators(),
        this.fetchComprehensiveBitcoinData()
      ]);

      // Update data properties
      this.marketData = marketData;
      this.newsItems = newsItems;
      this.socialSentiment = socialSentiment;
      this.economicIndicators = economicIndicators;
      this.comprehensiveBitcoinData = comprehensiveBitcoinData;

      // Update curated altcoins data (with its own caching)
      await this.updateCuratedAltcoinsData();

      // Update top movers data (with its own caching)
      await this.updateTopMoversData();

      // Update trending coins data (with its own caching)
      await this.updateTrendingCoinsData();

      // Generate alerts based on new data
      const alerts = this.generateAlerts(marketData, newsItems, socialSentiment);
      this.alerts = alerts;

      console.log(`[RealTimeDataService] Updated data - ${marketData.length} markets, ${newsItems.length} news items, ${alerts.length} alerts, BTC network data: ${comprehensiveBitcoinData ? 'success' : 'failed'}, curated altcoins: ${this.curatedAltcoinsCache ? 'cached' : 'updated'}, top movers: ${this.topMoversCache ? 'cached' : 'updated'}, trending coins: ${this.trendingCoinsCache ? 'cached' : 'updated'}`);
    } catch (error) {
      console.error('Error in updateAllData:', error);
    }
  }

  private async fetchMarketData(): Promise<MarketData[]> {
    try {
      const coingeckoApiKey = this.runtime.getSetting('COINGECKO_API_KEY');
      const baseUrl = coingeckoApiKey 
        ? 'https://pro-api.coingecko.com/api/v3' 
        : 'https://api.coingecko.com/api/v3';

      const headers = coingeckoApiKey 
        ? { 'x-cg-pro-api-key': coingeckoApiKey }
        : {};

      // Fetch crypto data
      const cryptoIds = 'bitcoin,ethereum,solana,polygon,cardano';
      const cryptoResponse = await axios.get(`${baseUrl}/simple/price`, {
        params: {
          ids: cryptoIds,
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true,
          include_last_updated_at: true
        },
        headers,
        timeout: 10000
      });

      const cryptoData: MarketData[] = Object.entries(cryptoResponse.data).map(([id, data]: [string, any]) => ({
        symbol: this.getSymbolFromId(id),
        price: data.usd || 0,
        change24h: data.usd_24h_change || 0,
        changePercent24h: data.usd_24h_change || 0,
        volume24h: data.usd_24h_vol || 0,
        marketCap: data.usd_market_cap || 0,
        lastUpdate: new Date(data.last_updated_at ? data.last_updated_at * 1000 : Date.now()),
        source: 'CoinGecko'
      }));

      // Fetch Japanese stock data (MetaPlanet approximation)
      const stockData = await this.fetchStockData();
      
      return [...cryptoData, ...stockData];
    } catch (error) {
      console.error('Error fetching market data:', error);
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
          console.error(`Error fetching data for ${symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(stockPromises);
      return results.filter(Boolean) as MarketData[];
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return this.getFallbackStockData();
    }
  }

  private async fetchNewsData(): Promise<NewsItem[]> {
    try {
      const newsApiKey = this.runtime.getSetting('NEWS_API_KEY');
      if (!newsApiKey) {
        return this.getFallbackNewsData();
      }

      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'bitcoin OR cryptocurrency OR "strategic bitcoin reserve" OR "bitcoin ETF" OR blockchain',
          sortBy: 'publishedAt',
          pageSize: 20,
          language: 'en',
          apiKey: newsApiKey
        },
        timeout: 10000
      });

      return response.data.articles.map((article: any, index: number) => ({
        id: `news_${Date.now()}_${index}`,
        title: article.title,
        summary: article.description || article.content?.substring(0, 200) + '...',
        url: article.url,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt),
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
        relevanceScore: this.calculateRelevanceScore(article.title, article.description),
        keywords: this.extractKeywords(article.title + ' ' + article.description)
      }));
    } catch (error) {
      console.error('Error fetching news data:', error);
      return this.getFallbackNewsData();
    }
  }

  private async fetchSocialSentiment(): Promise<SocialSentiment[]> {
    try {
      // This would integrate with Twitter API, Reddit API, etc.
      // For now, returning simulated sentiment data based on market movements
      const marketData = this.marketData || [];
      const btcData = marketData.find(m => m.symbol === 'BTC');
      
      if (!btcData) {
        return this.getFallbackSocialSentiment();
      }

      const sentiment = btcData.changePercent24h > 0 ? 
        Math.min(0.8, btcData.changePercent24h / 10) : 
        Math.max(-0.8, btcData.changePercent24h / 10);

      return [
        {
          platform: 'Twitter',
          symbol: 'BTC',
          sentiment: sentiment,
          mentions: Math.floor(Math.random() * 5000) + 1000,
          timestamp: new Date(),
          trendingKeywords: sentiment > 0.2 ? ['moon', 'hodl', 'btc', 'bullish'] : ['dip', 'buy', 'hodl', 'diamond hands']
        },
        {
          platform: 'Reddit',
          symbol: 'BTC',
          sentiment: sentiment * 0.8, // Reddit tends to be slightly less extreme
          mentions: Math.floor(Math.random() * 1000) + 200,
          timestamp: new Date(),
          trendingKeywords: ['bitcoin', 'cryptocurrency', 'investment', 'future']
        }
      ];
    } catch (error) {
      console.error('Error fetching social sentiment:', error);
      return this.getFallbackSocialSentiment();
    }
  }

  private async fetchEconomicIndicators(): Promise<EconomicIndicator[]> {
    try {
      // This would integrate with FRED API, Bloomberg API, etc.
      // For now, returning key indicators that affect Bitcoin
      return [
        {
          name: 'US Dollar Index (DXY)',
          value: 103.5,
          previousValue: 104.2,
          change: -0.7,
          unit: 'index',
          releaseDate: new Date(),
          nextRelease: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        },
        {
          name: 'Federal Funds Rate',
          value: 5.25,
          previousValue: 5.25,
          change: 0,
          unit: 'percent',
          releaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
          nextRelease: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // Next FOMC meeting
        }
      ];
    } catch (error) {
      console.error('Error fetching economic indicators:', error);
      return [];
    }
  }

  private generateAlerts(marketData: MarketData[], newsItems: NewsItem[], socialSentiment: SocialSentiment[]): MarketAlert[] {
    const alerts: MarketAlert[] = [];
    const now = new Date();

    // Price threshold alerts
    marketData.forEach(market => {
      if (Math.abs(market.changePercent24h) > 10) {
        alerts.push({
          id: `price_${market.symbol}_${now.getTime()}`,
          type: 'price_threshold',
          symbol: market.symbol,
          message: `${market.symbol} ${market.changePercent24h > 0 ? 'surged' : 'dropped'} ${Math.abs(market.changePercent24h).toFixed(1)}% in 24h`,
          severity: Math.abs(market.changePercent24h) > 20 ? 'critical' : 'high',
          timestamp: now,
          data: { price: market.price, change: market.changePercent24h }
        });
      }
    });

    // Volume spike alerts
    marketData.forEach(market => {
      if (market.volume24h > 0) {
        // Simplified volume spike detection
        const avgVolume = market.volume24h * 0.7; // Assume current volume is 30% above average
        if (market.volume24h > avgVolume * 2) {
          alerts.push({
            id: `volume_${market.symbol}_${now.getTime()}`,
            type: 'volume_spike',
            symbol: market.symbol,
            message: `${market.symbol} volume spike detected - ${(market.volume24h / 1000000).toFixed(1)}M`,
            severity: 'medium',
            timestamp: now,
            data: { volume: market.volume24h }
          });
        }
      }
    });

    // News sentiment alerts
    const highImpactNews = newsItems.filter(news => 
      news.relevanceScore > 0.8 && 
      (news.sentiment === 'positive' || news.sentiment === 'negative')
    );

    highImpactNews.forEach(news => {
      alerts.push({
        id: `news_${news.id}`,
        type: 'news_sentiment',
        symbol: 'BTC', // Assume Bitcoin-related
        message: `High-impact ${news.sentiment} news: ${news.title}`,
        severity: 'medium',
        timestamp: now,
        data: { newsUrl: news.url, sentiment: news.sentiment }
      });
    });

    return alerts;
  }

  // Utility methods
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

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['surge', 'pump', 'moon', 'bullish', 'adoption', 'breakthrough', 'rally'];
    const negativeWords = ['crash', 'dump', 'bearish', 'decline', 'sell-off', 'collapse', 'drop'];
    
    const lowercaseText = text.toLowerCase();
    const positiveScore = positiveWords.reduce((score, word) => 
      score + (lowercaseText.includes(word) ? 1 : 0), 0);
    const negativeScore = negativeWords.reduce((score, word) => 
      score + (lowercaseText.includes(word) ? 1 : 0), 0);
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private calculateRelevanceScore(title: string, description: string): number {
    const relevantTerms = ['bitcoin', 'btc', 'cryptocurrency', 'blockchain', 'strategic reserve', 'etf', 'institutional'];
    const text = (title + ' ' + description).toLowerCase();
    
    let score = 0;
    relevantTerms.forEach(term => {
      if (text.includes(term)) {
        score += 0.2;
      }
    });
    
    return Math.min(1, score);
  }

  private extractKeywords(text: string): string[] {
    const keywords = ['bitcoin', 'cryptocurrency', 'blockchain', 'etf', 'institutional', 'adoption', 'regulation', 'defi'];
    return keywords.filter(keyword => text.toLowerCase().includes(keyword));
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

  private getFallbackNewsData(): NewsItem[] {
    return [
      {
        id: 'fallback_news_1',
        title: 'Bitcoin Adoption Accelerates Among Institutional Investors',
        summary: 'Major institutions continue to add Bitcoin to their balance sheets...',
        url: 'https://example.com/bitcoin-adoption',
        source: 'Fallback News',
        publishedAt: new Date(),
        sentiment: 'positive',
        relevanceScore: 0.9,
        keywords: ['bitcoin', 'institutional', 'adoption']
      }
    ];
  }

  private getFallbackSocialSentiment(): SocialSentiment[] {
    return [
      {
        platform: 'Twitter',
        symbol: 'BTC',
        sentiment: 0.6,
        mentions: 2500,
        timestamp: new Date(),
        trendingKeywords: ['bitcoin', 'hodl', 'moon']
      }
    ];
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
    return marketData.find(market => market.symbol === symbol);
  }

  public getComprehensiveBitcoinData(): ComprehensiveBitcoinData | null {
    return this.comprehensiveBitcoinData;
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

  public async forceUpdate(): Promise<void> {
    await this.updateAllData();
  }

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

  // Comprehensive Bitcoin data fetcher
  private async fetchComprehensiveBitcoinData(): Promise<ComprehensiveBitcoinData | null> {
    try {
      // Fetch all data in parallel
      const [priceData, networkData, sentimentData, mempoolData] = await Promise.all([
        this.fetchBitcoinPriceData(),
        this.fetchBitcoinNetworkData(),
        this.fetchBitcoinSentimentData(),
        this.fetchBitcoinMempoolData()
      ]);

      // Combine all data
      const response: ComprehensiveBitcoinData = {
        price: {
          usd: priceData?.usd || null,
          change24h: priceData?.change24h || null
        },
        network: {
          hashRate: networkData?.hashRate || null,
          difficulty: networkData?.difficulty || null,
          blockHeight: networkData?.blockHeight || null,
          avgBlockTime: networkData?.avgBlockTime || null,
          avgBlockSize: networkData?.avgBlockSize || null,
          totalBTC: networkData?.totalBTC || null,
          marketCap: networkData?.marketCap || null,
          nextHalving: networkData?.nextHalving || { blocks: null, estimatedDate: null },
          mempoolSize: mempoolData?.mempoolSize || null,
          mempoolFees: mempoolData?.mempoolFees || { fastestFee: null, halfHourFee: null, economyFee: null },
          mempoolTxs: mempoolData?.mempoolTxs || null,
          miningRevenue: mempoolData?.miningRevenue || null,
          miningRevenue24h: mempoolData?.miningRevenue24h || null,
          lightningCapacity: null,
          lightningChannels: null,
          liquidity: null
        },
        sentiment: {
          fearGreedIndex: sentimentData?.fearGreedIndex || null,
          fearGreedValue: sentimentData?.fearGreedValue || null
        },
        nodes: {
          total: null,
          countries: null
        },
        lastUpdated: new Date()
      };

      return response;
    } catch (error) {
      console.error('Error fetching comprehensive Bitcoin data:', error);
      return null;
    }
  }

  private async fetchBitcoinPriceData(): Promise<{ usd: number; change24h: number } | null> {
    try {
      const response = await fetch(
        `${this.COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          usd: Number(data.bitcoin?.usd) || null,
          change24h: Number(data.bitcoin?.usd_24h_change) || null
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching Bitcoin price data:', error);
      return null;
    }
  }

  private async fetchBitcoinNetworkData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      const response = await fetch(`${this.BLOCKCHAIN_API}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Calculate next halving
        const currentBlock = Number(data.n_blocks_total);
        const currentHalvingEpoch = Math.floor(currentBlock / 210000);
        const nextHalvingBlock = (currentHalvingEpoch + 1) * 210000;
        const blocksUntilHalving = nextHalvingBlock - currentBlock;
        
        // Estimate halving date based on average block time
        const avgBlockTime = Number(data.minutes_between_blocks);
        const minutesUntilHalving = blocksUntilHalving * avgBlockTime;
        const halvingDate = new Date(Date.now() + minutesUntilHalving * 60 * 1000);

        return {
          hashRate: Number(data.hash_rate),
          difficulty: Number(data.difficulty),
          blockHeight: Number(data.n_blocks_total),
          avgBlockTime: Number(data.minutes_between_blocks),
          avgBlockSize: Number(data.blocks_size),
          totalBTC: Number(data.totalbc) / 1e8,
          marketCap: Number(data.market_price_usd) * (Number(data.totalbc) / 1e8),
          nextHalving: {
            blocks: blocksUntilHalving,
            estimatedDate: halvingDate.toISOString()
          }
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching Bitcoin network data:', error);
      return null;
    }
  }

  private async fetchBitcoinSentimentData(): Promise<BitcoinSentimentData | null> {
    try {
      const response = await fetch(`${this.ALTERNATIVE_API}/fng/`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          fearGreedIndex: Number(data.data[0].value),
          fearGreedValue: data.data[0].value_classification
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching Bitcoin sentiment data:', error);
      return null;
    }
  }

  private async fetchBitcoinMempoolData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      // Fetch mempool data in parallel
      const [mempoolResponse, feesResponse] = await Promise.all([
        fetch(`${this.MEMPOOL_API}/mempool`),
        fetch(`${this.MEMPOOL_API}/v1/fees/recommended`)
      ]);

      if (!mempoolResponse.ok || !feesResponse.ok) {
        throw new Error('Failed to fetch mempool data');
      }

      const [mempoolData, feesData] = await Promise.all([
        mempoolResponse.json(),
        feesResponse.json()
      ]);

      return {
        mempoolSize: mempoolData.vsize || null,  // Virtual size in bytes
        mempoolTxs: mempoolData.count || null,   // Number of transactions
        mempoolFees: {
          fastestFee: feesData.fastestFee || null,
          halfHourFee: feesData.halfHourFee || null,
          economyFee: feesData.economyFee || null
        },
        miningRevenue: mempoolData.total_fee || null,  // Total fees in satoshis
        miningRevenue24h: null  // We'll need another endpoint for this
      };
    } catch (error) {
      console.error('Error fetching Bitcoin mempool data:', error);
      return null;
    }
  }

  // Curated altcoins data management
  private isCuratedCacheValid(): boolean {
    if (!this.curatedAltcoinsCache) return false;
    return Date.now() - this.curatedAltcoinsCache.timestamp < this.CURATED_CACHE_DURATION;
  }

  private async updateCuratedAltcoinsData(): Promise<void> {
    // Only fetch if cache is invalid
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

  private async fetchCuratedAltcoinsData(): Promise<CuratedAltcoinsData | null> {
    try {
      const idsParam = this.curatedCoinIds.join(',');
      const response = await fetch(
        `${this.COINGECKO_API}/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      
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

      console.log(`[RealTimeDataService] Fetched curated altcoins data for ${this.curatedCoinIds.length} coins`);
      return result;
    } catch (error) {
      console.error('Error fetching curated altcoins data:', error);
      return null;
    }
  }

  // Top 100 vs BTC data management
  private isTop100CacheValid(): boolean {
    if (!this.top100VsBtcCache) return false;
    return Date.now() - this.top100VsBtcCache.timestamp < this.TOP100_CACHE_DURATION;
  }

  private async updateTop100VsBtcData(): Promise<void> {
    // Only fetch if cache is invalid
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

  private async fetchTop100VsBtcData(): Promise<Top100VsBtcData | null> {
    try {
      // Step 1: Fetch top 100 coins against BTC to find outperformers and their performance vs BTC
      const btcMarketResponse = await fetch(
        `${this.COINGECKO_API}/coins/markets?vs_currency=btc&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d`
      );

      if (!btcMarketResponse.ok) {
        throw new Error(`CoinGecko API request (BTC) failed with status ${btcMarketResponse.status}`);
      }

      const btcMarketData = await btcMarketResponse.json();

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
      const usdPriceResponse = await fetch(
        `${this.COINGECKO_API}/simple/price?ids=${outperformingIds}&vs_currencies=usd`
      );

      if (!usdPriceResponse.ok) {
        throw new Error(`CoinGecko simple price API request failed with status ${usdPriceResponse.status}`);
      }

      const usdPrices = await usdPriceResponse.json();

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

      console.log(`[RealTimeDataService] Fetched top 100 vs BTC data: ${outperformingCount}/${totalCoins} outperforming`);
      return result;
      
    } catch (error) {
      console.error('Error in fetchTop100VsBtcData:', error);
      return null;
    }
  }

  // DEXScreener data management
  private isDexScreenerCacheValid(): boolean {
    if (!this.dexScreenerCache) return false;
    return Date.now() - this.dexScreenerCache.timestamp < this.DEXSCREENER_CACHE_DURATION;
  }

  private async updateDexScreenerData(): Promise<void> {
    // Only fetch if cache is invalid
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

  private async fetchDexScreenerData(): Promise<DexScreenerData | null> {
    try {
      console.log('[RealTimeDataService] Fetching DEXScreener data...');
      
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
            console.warn(`Failed to fetch pool data for token ${token.tokenAddress}:`, error);
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
      
      console.log(`[RealTimeDataService] Fetched DEXScreener data: ${topTokens.length} top tokens, ${trendingTokens.length} trending`);
      return result;
      
    } catch (error) {
      console.error('Error in fetchDexScreenerData:', error);
      return null;
    }
  }

  // Top Movers (Gainers/Losers) data management
  private isTopMoversCacheValid(): boolean {
    if (!this.topMoversCache) return false;
    return Date.now() - this.topMoversCache.timestamp < this.TOP_MOVERS_CACHE_DURATION;
  }

  private async updateTopMoversData(): Promise<void> {
    // Only fetch if cache is invalid
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

  private async fetchTopMoversData(): Promise<TopMoversData | null> {
    try {
      console.log('[RealTimeDataService] Fetching top movers data...');
      
      const response = await fetch(
        `${this.COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko error: ${response.status}`);
      }
      
      const data: TopMoverCoin[] = await response.json();
      
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
      
      console.log(`[RealTimeDataService] Fetched top movers: ${topGainers.length} gainers, ${topLosers.length} losers`);
      return result;
      
    } catch (error) {
      console.error('Error in fetchTopMoversData:', error);
      return null;
    }
  }

  // Trending Coins data management
  private isTrendingCoinsCacheValid(): boolean {
    if (!this.trendingCoinsCache) return false;
    return Date.now() - this.trendingCoinsCache.timestamp < this.TRENDING_COINS_CACHE_DURATION;
  }

  private async updateTrendingCoinsData(): Promise<void> {
    // Only fetch if cache is invalid
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

  private async fetchTrendingCoinsData(): Promise<TrendingCoinsData | null> {
    try {
      console.log('[RealTimeDataService] Fetching trending coins data...');
      
      const response = await fetch('https://api.coingecko.com/api/v3/search/trending', {
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`CoinGecko error: ${response.status}`);
      }
      
      const data = await response.json();
      
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
      
      console.log(`[RealTimeDataService] Fetched trending coins: ${trending.length} coins`);
      return result;
      
    } catch (error) {
      console.error('Error in fetchTrendingCoinsData:', error);
      return null;
    }
  }
} 