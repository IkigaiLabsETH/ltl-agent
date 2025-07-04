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

export class RealTimeDataService extends Service {
  static serviceType = 'real-time-data';
  capabilityDescription = 'Provides real-time market data, news feeds, and social sentiment analysis';
  
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 60000; // 1 minute
  private readonly symbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'ADA', '4337', '8958']; // Include MetaPlanet (4337) and Hyperliquid (8958)
  
  // Data storage
  private marketData: MarketData[] = [];
  private newsItems: NewsItem[] = [];
  private socialSentiment: SocialSentiment[] = [];
  private economicIndicators: EconomicIndicator[] = [];
  private alerts: MarketAlert[] = [];

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
      const [marketData, newsItems, socialSentiment, economicIndicators] = await Promise.all([
        this.fetchMarketData(),
        this.fetchNewsData(),
        this.fetchSocialSentiment(),
        this.fetchEconomicIndicators()
      ]);

      // Update data properties
      this.marketData = marketData;
      this.newsItems = newsItems;
      this.socialSentiment = socialSentiment;
      this.economicIndicators = economicIndicators;

      // Generate alerts based on new data
      const alerts = this.generateAlerts(marketData, newsItems, socialSentiment);
      this.alerts = alerts;

      console.log(`[RealTimeDataService] Updated data - ${marketData.length} markets, ${newsItems.length} news items, ${alerts.length} alerts`);
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

  public async forceUpdate(): Promise<void> {
    await this.updateAllData();
  }
} 