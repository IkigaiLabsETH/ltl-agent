import { IAgentRuntime, elizaLogger } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';
import { LoggerWithContext, generateCorrelationId, globalErrorHandler } from '../utils';
import { CentralizedConfigService } from './CentralizedConfigService';
import axios from 'axios';

/**
 * News Item Interface
 */
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

/**
 * News Category Interface
 */
export interface NewsCategory {
  name: string;
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
}

/**
 * News Summary Interface
 */
export interface NewsSummary {
  totalArticles: number;
  positiveArticles: number;
  negativeArticles: number;
  neutralArticles: number;
  topSources: string[];
  trendingKeywords: string[];
  averageSentiment: number;
  lastUpdated: Date;
}

/**
 * News Data Service
 * Handles all news-related data fetching, sentiment analysis, and curation
 */
export class NewsDataService extends BaseDataService {
  static serviceType = 'news-data';
  
  private contextLogger: LoggerWithContext;
  private configService: CentralizedConfigService;
  private errorHandler: typeof globalErrorHandler;
  private updateInterval: NodeJS.Timeout | null = null;
  
  // Data storage
  private newsItems: NewsItem[] = [];
  private newsSummary: NewsSummary | null = null;
  
  // News categories for Bitcoin and crypto
  private readonly newsCategories: NewsCategory[] = [
    {
      name: 'Bitcoin',
      keywords: ['bitcoin', 'btc', 'cryptocurrency', 'crypto', 'blockchain'],
      priority: 'high'
    },
    {
      name: 'Ethereum',
      keywords: ['ethereum', 'eth', 'defi', 'smart contracts'],
      priority: 'high'
    },
    {
      name: 'Regulation',
      keywords: ['regulation', 'sec', 'cfdc', 'government', 'policy'],
      priority: 'high'
    },
    {
      name: 'Institutional',
      keywords: ['institutional', 'etf', 'blackrock', 'fidelity', 'adoption'],
      priority: 'medium'
    },
    {
      name: 'Technology',
      keywords: ['technology', 'innovation', 'development', 'upgrade'],
      priority: 'medium'
    }
  ];

  constructor(runtime: IAgentRuntime) {
    super(runtime, 'bitcoinData');
    this.contextLogger = new LoggerWithContext(generateCorrelationId(), 'NewsDataService');
    this.configService = runtime.getService<CentralizedConfigService>('centralized-config');
    this.errorHandler = globalErrorHandler;
  }

  public get capabilityDescription(): string {
    return 'Provides real-time cryptocurrency news, sentiment analysis, and curated insights from multiple sources';
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info('Starting NewsDataService...');
    const service = new NewsDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info('Stopping NewsDataService...');
    const service = runtime.getService('news-data') as unknown as NewsDataService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info('Starting news data service...');
    await this.startRealTimeUpdates();
  }

  async init() {
    this.contextLogger.info('Initializing news data service...');
    await this.updateData();
  }

  async stop(): Promise<void> {
    this.contextLogger.info('Stopping news data service...');
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async updateData(): Promise<void> {
    try {
      this.contextLogger.info('Updating news data...');
      await this.updateNews();
      this.contextLogger.info('News data update completed');
    } catch (error) {
      this.errorHandler.handleError(error, { component: 'NewsDataService', operation: 'updateData' });
    }
  }

  async forceUpdate(): Promise<void> {
    this.contextLogger.info('Forcing news data update...');
    await this.updateData();
  }

  /**
   * Start real-time updates for news data
   */
  private async startRealTimeUpdates(): Promise<void> {
    const updateInterval = this.configService.get('services.newsData.updateInterval', 300000); // 5 minutes
    
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateData();
      } catch (error) {
        this.errorHandler.handleError(error, { component: 'NewsDataService', operation: 'startRealTimeUpdates' });
      }
    }, updateInterval);

    this.contextLogger.info(`News data updates scheduled every ${updateInterval}ms`);
  }

  /**
   * Update news data
   */
  private async updateNews(): Promise<void> {
    try {
      const newsData = await this.fetchNewsData();
      if (newsData && newsData.length > 0) {
        this.newsItems = newsData;
        this.newsSummary = this.calculateNewsSummary(newsData);
        this.contextLogger.info(`Updated ${newsData.length} news articles`);
      } else {
        this.contextLogger.warn('No news data available, using fallback');
        this.newsItems = this.getFallbackNewsData();
        this.newsSummary = this.calculateNewsSummary(this.newsItems);
      }
    } catch (error) {
      this.errorHandler.handleError(error, { component: 'NewsDataService', operation: 'updateNews' });
      this.newsItems = this.getFallbackNewsData();
      this.newsSummary = this.calculateNewsSummary(this.newsItems);
    }
  }

  /**
   * Fetch news data from multiple sources
   */
  private async fetchNewsData(): Promise<NewsItem[]> {
    try {
      this.contextLogger.info('Fetching news data...');
      
      const newsItems: NewsItem[] = [];
      const apiKey = this.configService.get('apis.news.apiKey', '');
      
      if (!apiKey) {
        this.contextLogger.warn('News API key not configured');
        return this.getFallbackNewsData();
      }

      // Fetch news for each category
      for (const category of this.newsCategories) {
        try {
          const categoryNews = await this.fetchCategoryNews(category, apiKey);
          newsItems.push(...categoryNews);
        } catch (error) {
          this.errorHandler.handleError(error, { component: 'NewsDataService', operation: `fetchCategoryNews.${category.name}` });
        }
      }

      // Remove duplicates and sort by relevance
      const uniqueNews = this.removeDuplicateNews(newsItems);
      const sortedNews = uniqueNews.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return sortedNews.slice(0, 50); // Limit to top 50 articles

    } catch (error) {
      this.errorHandler.handleError(error, { component: 'NewsDataService', operation: 'fetchNewsData' });
      return this.getFallbackNewsData();
    }
  }

  /**
   * Fetch news for a specific category
   */
  private async fetchCategoryNews(category: NewsCategory, apiKey: string): Promise<NewsItem[]> {
    try {
      const baseUrl = this.configService.get('apis.news.baseUrl', 'https://newsapi.org/v2');
      const query = category.keywords.join(' OR ');
      
      const response = await axios.get(`${baseUrl}/everything`, {
        params: {
          q: query,
          apiKey,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 20,
          from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
        },
        timeout: 10000
      });

      if (response.data.status !== 'ok') {
        throw new Error(`News API error: ${response.data.message}`);
      }

      return response.data.articles.map((article: any, index: number) => {
        const sentiment = this.analyzeSentiment(article.title + ' ' + (article.description || ''));
        const relevanceScore = this.calculateRelevanceScore(article.title, article.description || '', category);
        const keywords = this.extractKeywords(article.title + ' ' + (article.description || ''));

        return {
          id: `${category.name}-${index}-${Date.now()}`,
          title: article.title,
          summary: article.description || '',
          url: article.url,
          source: article.source.name,
          publishedAt: new Date(article.publishedAt),
          sentiment,
          relevanceScore,
          keywords
        };
      });

    } catch (error) {
      this.errorHandler.handleError(error, { component: 'NewsDataService', operation: `fetchCategoryNews.${category.name}` });
      return [];
    }
  }

  /**
   * Remove duplicate news articles
   */
  private removeDuplicateNews(newsItems: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    return newsItems.filter(item => {
      const key = `${item.title.toLowerCase()}-${item.source}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Analyze sentiment of text
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();
    
    const positiveWords = [
      'bullish', 'surge', 'rally', 'gain', 'profit', 'positive', 'growth', 'adoption',
      'innovation', 'breakthrough', 'success', 'win', 'up', 'higher', 'strong'
    ];
    
    const negativeWords = [
      'bearish', 'crash', 'drop', 'loss', 'negative', 'decline', 'rejection',
      'failure', 'problem', 'issue', 'down', 'lower', 'weak', 'sell'
    ];
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate relevance score for news article
   */
  private calculateRelevanceScore(title: string, description: string, category: NewsCategory): number {
    const text = (title + ' ' + description).toLowerCase();
    let score = 0;
    
    // Base score for category keywords
    category.keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * 10;
      }
    });
    
    // Bonus for title matches
    category.keywords.forEach(keyword => {
      if (title.toLowerCase().includes(keyword)) {
        score += 20;
      }
    });
    
    // Priority bonus
    if (category.priority === 'high') score += 50;
    else if (category.priority === 'medium') score += 25;
    
    return score;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const keywordCounts = new Map<string, number>();
    words.forEach(word => {
      keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
    });
    
    return Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Calculate news summary statistics
   */
  private calculateNewsSummary(newsItems: NewsItem[]): NewsSummary {
    const positiveArticles = newsItems.filter(item => item.sentiment === 'positive').length;
    const negativeArticles = newsItems.filter(item => item.sentiment === 'negative').length;
    const neutralArticles = newsItems.filter(item => item.sentiment === 'neutral').length;
    
    // Calculate average sentiment (-1 to 1)
    const sentimentScores = newsItems.map(item => {
      switch (item.sentiment) {
        case 'positive': return 1;
        case 'negative': return -1;
        default: return 0;
      }
    });
    const averageSentiment = sentimentScores.length > 0 
      ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length 
      : 0;
    
    // Get top sources
    const sourceCounts = new Map<string, number>();
    newsItems.forEach(item => {
      sourceCounts.set(item.source, (sourceCounts.get(item.source) || 0) + 1);
    });
    const topSources = Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source]) => source);
    
    // Get trending keywords
    const allKeywords = newsItems.flatMap(item => item.keywords);
    const keywordCounts = new Map<string, number>();
    allKeywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });
    const trendingKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);
    
    return {
      totalArticles: newsItems.length,
      positiveArticles,
      negativeArticles,
      neutralArticles,
      topSources,
      trendingKeywords,
      averageSentiment,
      lastUpdated: new Date()
    };
  }

  /**
   * Get fallback news data
   */
  private getFallbackNewsData(): NewsItem[] {
    return [
      {
        id: 'fallback-1',
        title: 'Bitcoin continues to show resilience in market volatility',
        summary: 'Bitcoin demonstrates strong fundamentals despite market fluctuations',
        url: 'https://example.com/bitcoin-resilience',
        source: 'CryptoNews',
        publishedAt: new Date(),
        sentiment: 'positive',
        relevanceScore: 85,
        keywords: ['bitcoin', 'resilience', 'market', 'volatility']
      },
      {
        id: 'fallback-2',
        title: 'Institutional adoption of cryptocurrency accelerates',
        summary: 'Major financial institutions continue to embrace digital assets',
        url: 'https://example.com/institutional-adoption',
        source: 'FinanceDaily',
        publishedAt: new Date(),
        sentiment: 'positive',
        relevanceScore: 80,
        keywords: ['institutional', 'adoption', 'cryptocurrency', 'digital']
      }
    ];
  }

  /**
   * Get all news items
   */
  public getNewsItems(): NewsItem[] {
    return this.newsItems;
  }

  /**
   * Get news summary
   */
  public getNewsSummary(): NewsSummary | null {
    return this.newsSummary;
  }

  /**
   * Get news by sentiment
   */
  public getNewsBySentiment(sentiment: 'positive' | 'negative' | 'neutral'): NewsItem[] {
    return this.newsItems.filter(item => item.sentiment === sentiment);
  }

  /**
   * Get news by source
   */
  public getNewsBySource(source: string): NewsItem[] {
    return this.newsItems.filter(item => item.source.toLowerCase().includes(source.toLowerCase()));
  }

  /**
   * Get news by keyword
   */
  public getNewsByKeyword(keyword: string): NewsItem[] {
    return this.newsItems.filter(item => 
      item.title.toLowerCase().includes(keyword.toLowerCase()) ||
      item.summary.toLowerCase().includes(keyword.toLowerCase()) ||
      item.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
    );
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    totalArticles: number;
    positiveArticles: number;
    negativeArticles: number;
    neutralArticles: number;
    averageSentiment: number;
    topSources: string[];
    lastUpdate: Date | null;
  } {
    return {
      totalArticles: this.newsItems.length,
      positiveArticles: this.newsItems.filter(item => item.sentiment === 'positive').length,
      negativeArticles: this.newsItems.filter(item => item.sentiment === 'negative').length,
      neutralArticles: this.newsItems.filter(item => item.sentiment === 'neutral').length,
      averageSentiment: this.newsSummary?.averageSentiment || 0,
      topSources: this.newsSummary?.topSources || [],
      lastUpdate: this.newsSummary?.lastUpdated || null
    };
  }
} 