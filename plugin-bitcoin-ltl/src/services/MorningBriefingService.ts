import { Service, logger, type IAgentRuntime } from '@elizaos/core';
import { ProcessedIntelligence } from './ContentIngestionService';
import { BitcoinDataService } from './BitcoinDataService';
import { SlackIngestionService } from './SlackIngestionService';
import { ElizaOSErrorHandler, LoggerWithContext, generateCorrelationId } from '../utils';

export interface MorningBriefingConfig {
  deliveryTime: { hour: number; minute: number }; // 24-hour format
  timezone: string; // e.g., 'America/New_York'
  includeWeather: boolean;
  includeMarketData: boolean;
  includeNewsDigest: boolean;
  includePerformanceTracking: boolean;
  personalizations: {
    greetingStyle: 'casual' | 'professional' | 'satoshi';
    focusAreas: string[]; // e.g., ['bitcoin', 'stocks', 'crypto']
    alertThresholds: {
      bitcoinPriceChange: number; // percentage
      stockMoves: number; // percentage
      altcoinOutperformance: number; // percentage
    };
  };
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
}

export interface MarketPulse {
  bitcoin: {
    price: number;
    change24h: number;
    change7d: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    thesisProgress: number; // percentage to $1M
    nextResistance: number;
    nextSupport: number;
  };
  altcoins: {
    outperformers: { symbol: string; change: number; reason: string }[];
    underperformers: { symbol: string; change: number; reason: string }[];
    totalOutperforming: number;
    isAltseason: boolean;
  };
  stocks: {
    watchlist: { symbol: string; change: number; signal: string; price: number }[];
    opportunities: string[];
    sectorRotation: string[];
  };
  overall: {
    sentiment: 'risk-on' | 'risk-off' | 'neutral';
    majorEvents: string[];
    catalysts: string[];
  };
}

export interface KnowledgeDigest {
  newResearch: {
    title: string;
    summary: string;
    source: string;
    importance: 'high' | 'medium' | 'low';
    predictions: string[];
  }[];
  predictionUpdates: {
    original: string;
    current: string;
    accuracy: number;
    performance: string;
  }[];
  contentSummary: {
    totalItems: number;
    slackMessages: number;
    twitterPosts: number;
    researchPieces: number;
    topTopics: string[];
  };
}

export interface OpportunityAlert {
  type: 'immediate' | 'upcoming' | 'watchlist';
  asset: string;
  signal: string;
  confidence: number;
  timeframe: string;
  action: string;
  reason: string;
  priceTargets?: {
    entry: number;
    target: number;
    stop: number;
  };
}

export class MorningBriefingService extends Service {
  static serviceType = 'morning-briefing';
  capabilityDescription = 'Generates proactive morning intelligence briefings with market data and curated insights';
  
  private contextLogger: LoggerWithContext;
  private correlationId: string;
  private briefingConfig: MorningBriefingConfig;
  private lastBriefing: Date | null = null;
  private scheduledBriefing: NodeJS.Timeout | null = null;
  
  constructor(runtime: IAgentRuntime) {
    super();
    this.correlationId = generateCorrelationId();
    this.contextLogger = new LoggerWithContext(this.correlationId, 'MorningBriefingService');
    this.briefingConfig = this.getDefaultConfig();
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('MorningBriefingService starting...');
    const service = new MorningBriefingService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('MorningBriefingService stopping...');
    const service = runtime.getService('morning-briefing');
    if (service && service.stop) {
      await service.stop();
    }
  }

  async init() {
    this.contextLogger.info('MorningBriefingService initialized');
    
    // Schedule daily briefings
    this.scheduleDailyBriefing();
    
    // Generate initial briefing if none exists
    if (!this.lastBriefing) {
      await this.generateMorningBriefing();
    }
  }

  async stop() {
    if (this.scheduledBriefing) {
      clearTimeout(this.scheduledBriefing);
    }
    this.contextLogger.info('MorningBriefingService stopped');
  }

  private getDefaultConfig(): MorningBriefingConfig {
    return {
      deliveryTime: { hour: 7, minute: 0 }, // 7:00 AM
      timezone: 'America/New_York',
      includeWeather: true,
      includeMarketData: true,
      includeNewsDigest: true,
      includePerformanceTracking: true,
      personalizations: {
        greetingStyle: 'satoshi',
        focusAreas: ['bitcoin', 'stocks', 'crypto'],
        alertThresholds: {
          bitcoinPriceChange: 5.0, // 5% change triggers alert
          stockMoves: 10.0, // 10% move triggers alert
          altcoinOutperformance: 15.0 // 15% outperformance triggers alert
        }
      }
    };
  }

  private scheduleDailyBriefing() {
    // Calculate milliseconds until next briefing time
    const now = new Date();
    const next = new Date();
    next.setHours(this.briefingConfig.deliveryTime.hour, this.briefingConfig.deliveryTime.minute, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    const msUntilNext = next.getTime() - now.getTime();
    
    this.scheduledBriefing = setTimeout(async () => {
      await this.generateMorningBriefing();
      
      // Schedule the next briefing (24 hours later)
      this.scheduleDailyBriefing();
    }, msUntilNext);
    
    this.contextLogger.info(`Next morning briefing scheduled for ${next.toLocaleString()}`);
  }

  async generateMorningBriefing(): Promise<ProcessedIntelligence> {
    this.contextLogger.info('Generating morning intelligence briefing...');
    
    try {
              // Gather all necessary data
        const [weatherData, marketPulse, knowledgeDigest, opportunities] = await Promise.all([
          this.briefingConfig.includeWeather ? this.getWeatherData() : Promise.resolve(null),
          this.briefingConfig.includeMarketData ? this.getMarketPulse() : Promise.resolve(null),
          this.briefingConfig.includeNewsDigest ? this.getKnowledgeDigest() : Promise.resolve(null),
          this.getOpportunities()
        ]);

      // Generate the briefing
      const briefing = await this.compileBriefing(weatherData, marketPulse, knowledgeDigest, opportunities);
      
      // Log the briefing
      this.contextLogger.info(`Morning briefing generated: ${briefing.briefingId}`);
      this.lastBriefing = new Date();
      
      return briefing;
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, 'MorningBriefingGeneration');
      this.contextLogger.error('Failed to generate morning briefing:', enhancedError.message);
      throw enhancedError;
    }
  }

  private async getWeatherData(): Promise<WeatherData | null> {
    // Mock weather data - in real implementation, this would call weather API
    return {
      location: 'New York',
      temperature: 22,
      condition: 'sunny',
      description: 'Clear skies',
      humidity: 65,
      windSpeed: 8
    };
  }

  private async getMarketPulse(): Promise<MarketPulse | null> {
    try {
      // Get Bitcoin data service
      const bitcoinService = this.runtime.getService('bitcoin-data') as BitcoinDataService;
      if (!bitcoinService) {
        this.contextLogger.warn('BitcoinDataService not available');
        return null;
      }

      // Get Bitcoin price and analysis
      const bitcoinPrice = await bitcoinService.getBitcoinPrice();
      const thesisMetrics = await bitcoinService.calculateThesisMetrics(bitcoinPrice);
      
      // Mock altcoin and stock data - in real implementation, fetch from APIs
      const marketPulse: MarketPulse = {
        bitcoin: {
          price: bitcoinPrice,
          change24h: 2.5, // Mock data
          change7d: 8.2, // Mock data
          trend: 'bullish',
          thesisProgress: thesisMetrics.progressPercentage,
          nextResistance: bitcoinPrice * 1.05,
          nextSupport: bitcoinPrice * 0.95
        },
        altcoins: {
          outperformers: [
            { symbol: 'ETH', change: 5.2, reason: 'Ethereum upgrade momentum' },
            { symbol: 'SOL', change: 8.7, reason: 'DeFi activity surge' }
          ],
          underperformers: [
            { symbol: 'ADA', change: -3.1, reason: 'Profit taking' }
          ],
          totalOutperforming: 15,
          isAltseason: false
        },
        stocks: {
          watchlist: [
            { symbol: 'TSLA', change: 3.2, signal: 'Breakout above resistance', price: 350 },
            { symbol: 'MSTR', change: 7.8, signal: 'Bitcoin correlation play', price: 420 }
          ],
          opportunities: ['Tech sector rotation', 'AI infrastructure plays'],
          sectorRotation: ['Technology', 'Energy']
        },
        overall: {
          sentiment: 'risk-on',
          majorEvents: ['Fed decision pending', 'Bitcoin ETF flows'],
          catalysts: ['Institutional adoption', 'Regulatory clarity']
        }
      };

      return marketPulse;
    } catch (error) {
      this.contextLogger.error('Failed to get market pulse:', (error as Error).message);
      return null;
    }
  }

  private async getKnowledgeDigest(): Promise<KnowledgeDigest | null> {
    try {
      // Get Slack ingestion service
      const slackService = this.runtime.getService('slack-ingestion') as SlackIngestionService;
      
      let contentSummary = {
        totalItems: 0,
        slackMessages: 0,
        twitterPosts: 0,
        researchPieces: 0,
        topTopics: []
      };

      if (slackService) {
        const recentContent = await slackService.getRecentContent(24);
        contentSummary = {
          totalItems: recentContent.length,
          slackMessages: recentContent.filter(item => item.source === 'slack').length,
          twitterPosts: recentContent.filter(item => item.type === 'tweet').length,
          researchPieces: recentContent.filter(item => item.type === 'research').length,
          topTopics: ['Bitcoin', 'MSTY', 'MetaPlanet', 'Hyperliquid'] // Mock data
        };
      }

      const knowledgeDigest: KnowledgeDigest = {
        newResearch: [
          {
            title: 'MetaPlanet Bitcoin Strategy Analysis',
            summary: 'Deep dive into Japanese corporate Bitcoin adoption',
            source: 'LiveTheLifeTV Research',
            importance: 'high',
            predictions: ['50x potential over 2 years']
          }
        ],
        predictionUpdates: [
          {
            original: 'Hyperliquid to challenge CEXs',
            current: 'Hyperliquid orderbook model gaining traction',
            accuracy: 85,
            performance: 'Tracking well - predicted 6 months ago'
          }
        ],
        contentSummary
      };

      return knowledgeDigest;
    } catch (error) {
      this.contextLogger.error('Failed to get knowledge digest:', (error as Error).message);
      return null;
    }
  }

  private async getOpportunities(): Promise<OpportunityAlert[]> {
    // Mock opportunity data - in real implementation, analyze market conditions
    return [
      {
        type: 'immediate',
        asset: 'BTC',
        signal: 'Support holding at $100K',
        confidence: 80,
        timeframe: '1-3 days',
        action: 'Accumulate on dips',
        reason: 'Institutional demand strong',
        priceTargets: {
          entry: 100000,
          target: 110000,
          stop: 95000
        }
      },
      {
        type: 'upcoming',
        asset: 'MSTY',
        signal: 'Options premium elevated',
        confidence: 75,
        timeframe: '1-2 weeks',
        action: 'Consider covered calls',
        reason: 'Volatility expansion expected'
      }
    ];
  }

  private async compileBriefing(
    weather: WeatherData | null,
    market: MarketPulse | null,
    knowledge: KnowledgeDigest | null,
    opportunities: OpportunityAlert[]
  ): Promise<ProcessedIntelligence> {
    const briefingId = `briefing-${Date.now()}`;
    
    // Generate greeting based on style
    const greeting = this.generateGreeting(weather, market);
    
    const briefing: ProcessedIntelligence = {
      briefingId,
      date: new Date(),
      content: {
        weather: weather ? `${weather.condition}, ${weather.temperature}°C` : undefined,
        marketPulse: market ? {
          bitcoin: {
            price: market.bitcoin.price,
            change24h: market.bitcoin.change24h,
            trend: market.bitcoin.trend
          },
          altcoins: {
            outperformers: market.altcoins.outperformers.map(o => o.symbol),
            underperformers: market.altcoins.underperformers.map(u => u.symbol),
            signals: market.altcoins.outperformers.map(o => `${o.symbol}: ${o.reason}`)
          },
          stocks: {
            watchlist: market.stocks.watchlist.map(s => ({ 
              symbol: s.symbol, 
              change: s.change, 
              signal: s.signal 
            })),
            opportunities: market.stocks.opportunities
          }
        } : {
          bitcoin: { price: 0, change24h: 0, trend: 'neutral' },
          altcoins: { outperformers: [], underperformers: [], signals: [] },
          stocks: { watchlist: [], opportunities: [] }
        },
        knowledgeDigest: knowledge ? {
          newInsights: knowledge.newResearch.map(r => r.title),
          predictionUpdates: knowledge.predictionUpdates.map(p => p.current),
          performanceReport: knowledge.predictionUpdates.map(p => `${p.original}: ${p.accuracy}% accuracy`)
        } : {
          newInsights: [],
          predictionUpdates: [],
          performanceReport: []
        },
        opportunities: {
          immediate: opportunities.filter(o => o.type === 'immediate').map(o => `${o.asset}: ${o.signal}`),
          upcoming: opportunities.filter(o => o.type === 'upcoming').map(o => `${o.asset}: ${o.signal}`),
          watchlist: opportunities.filter(o => o.type === 'watchlist').map(o => `${o.asset}: ${o.signal}`)
        }
      },
      deliveryMethod: 'morning-briefing'
    };

    return briefing;
  }

  private generateGreeting(weather: WeatherData | null, market: MarketPulse | null): string {
    const style = this.briefingConfig.personalizations.greetingStyle;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    switch (style) {
      case 'satoshi':
        return `GM. ${time}. ${weather?.condition || 'Clear skies'}. ${market?.bitcoin ? `Bitcoin at $${market.bitcoin.price.toLocaleString()}` : 'Systems operational'}.`;
      
      case 'professional':
        return `Good morning. Here's your ${time} market briefing. ${weather?.condition ? `Weather: ${weather.condition}` : ''}`;
      
      case 'casual':
      default:
        return `Hey! ${time} briefing ready. ${weather?.condition ? `Looking ${weather.condition} outside` : ''}`;
    }
  }

  /**
   * Generate briefing on demand
   */
  async generateOnDemandBriefing(): Promise<ProcessedIntelligence> {
    this.contextLogger.info('Generating on-demand briefing...');
    return await this.generateMorningBriefing();
  }

  /**
   * Update briefing configuration
   */
  async updateConfig(newConfig: Partial<MorningBriefingConfig>): Promise<void> {
    this.briefingConfig = { ...this.briefingConfig, ...newConfig };
    
    // Reschedule if delivery time changed
    if (newConfig.deliveryTime && this.scheduledBriefing) {
      clearTimeout(this.scheduledBriefing);
      this.scheduleDailyBriefing();
    }
    
    this.contextLogger.info('Briefing configuration updated');
  }

  /**
   * Get briefing history
   */
  async getBriefingHistory(days: number = 7): Promise<{ lastBriefing: Date | null; totalGenerated: number }> {
    return {
      lastBriefing: this.lastBriefing,
      totalGenerated: this.lastBriefing ? 1 : 0 // Simplified for now
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): MorningBriefingConfig {
    return { ...this.briefingConfig };
  }
} 