import { elizaLogger, type IAgentRuntime } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';
import { ContentItem, ProcessedIntelligence } from './ContentIngestionService';
import { LoggerWithContext, generateCorrelationId } from '../utils';

export interface OpportunityAlert {
  id: string;
  type: 'immediate' | 'upcoming' | 'watchlist';
  asset: string;
  signal: string;
  confidence: number;
  timeframe: string;
  action: string;
  reason: string;
  triggeredAt: Date;
  priceTargets?: {
    entry: number;
    target: number;
    stop: number;
  };
  context: {
    currentPrice?: number;
    priceChange24h?: number;
    volume?: number;
    marketCap?: number;
    socialSentiment?: 'bullish' | 'bearish' | 'neutral';
    catalysts: string[];
  };
}

export interface AlertCriteria {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  conditions: {
    assets: string[]; // ['bitcoin', 'ethereum', 'msty', etc.]
    priceChangeThreshold?: number; // percentage
    volumeThreshold?: number; // percentage increase
    sentimentThreshold?: 'bullish' | 'bearish' | 'neutral';
    contentKeywords?: string[];
    sourceImportance?: 'high' | 'medium' | 'low';
    timeframe?: string; // '1h', '4h', '1d', '1w'
    confluenceRequired?: number; // number of signals needed
  };
  actions: {
    notify: boolean;
    generateReport: boolean;
    trackPerformance: boolean;
  };
}

export interface OpportunityMetrics {
  totalAlerts: number;
  alertsByType: { [key: string]: number };
  alertsByAsset: { [key: string]: number };
  accuracyRate: number;
  profitableAlerts: number;
  averageHoldTime: number;
  totalReturn: number;
}

export class OpportunityAlertService extends BaseDataService {
  static serviceType = 'opportunity-alert';
  
  private contextLogger: LoggerWithContext;
  private alertCriteria: AlertCriteria[] = [];
  private activeAlerts: OpportunityAlert[] = [];
  private alertHistory: OpportunityAlert[] = [];
  private metrics: OpportunityMetrics;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(runtime: IAgentRuntime) {
    super(runtime, 'opportunityAlert');
    this.correlationId = generateCorrelationId();
    this.contextLogger = new LoggerWithContext(this.correlationId, 'OpportunityAlertService');
    this.metrics = this.initializeMetrics();
  }

  public get capabilityDescription(): string {
    return 'Monitors for investment opportunities and generates real-time alerts';
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info('OpportunityAlertService starting...');
    const service = new OpportunityAlertService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info('OpportunityAlertService stopping...');
    const service = runtime.getService('opportunity-alert');
    if (service && service.stop) {
      await service.stop();
    }
  }

  async init() {
    this.contextLogger.info('OpportunityAlertService initialized');
    await this.loadDefaultCriteria();
    this.startMonitoring();
  }

  async stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.contextLogger.info('OpportunityAlertService stopped');
  }

  private initializeMetrics(): OpportunityMetrics {
    return {
      totalAlerts: 0,
      alertsByType: {},
      alertsByAsset: {},
      accuracyRate: 0,
      profitableAlerts: 0,
      averageHoldTime: 0,
      totalReturn: 0
    };
  }

  private async loadDefaultCriteria(): Promise<void> {
    // Define default alert criteria based on LiveTheLifeTV methodology
    this.alertCriteria = [
      {
        id: 'bitcoin-thesis-momentum',
        name: 'Bitcoin Thesis Momentum',
        description: 'Signals supporting the path to $1M Bitcoin',
        enabled: true,
        priority: 'high',
        conditions: {
          assets: ['bitcoin'],
          priceChangeThreshold: 5.0,
          contentKeywords: ['institutional', 'etf', 'treasury', 'sovereign', 'reserve'],
          sourceImportance: 'high',
          confluenceRequired: 2
        },
        actions: {
          notify: true,
          generateReport: true,
          trackPerformance: true
        }
      },
      {
        id: 'metaplanet-follow-through',
        name: 'MetaPlanet Follow-Through',
        description: 'Japanese Bitcoin strategy validation signals',
        enabled: true,
        priority: 'high',
        conditions: {
          assets: ['metaplanet'],
          priceChangeThreshold: 10.0,
          contentKeywords: ['japan', 'regulation', 'treasury', 'bitcoin'],
          sourceImportance: 'medium',
          confluenceRequired: 1
        },
        actions: {
          notify: true,
          generateReport: true,
          trackPerformance: true
        }
      },
      {
        id: 'altcoin-season-signals',
        name: 'Altcoin Season Signals',
        description: 'Indicators of altcoin outperformance opportunities',
        enabled: true,
        priority: 'medium',
        conditions: {
          assets: ['ethereum', 'solana', 'sui'],
          priceChangeThreshold: 15.0,
          sentimentThreshold: 'bullish',
          contentKeywords: ['altseason', 'rotation', 'defi', 'ecosystem'],
          confluenceRequired: 2
        },
        actions: {
          notify: true,
          generateReport: false,
          trackPerformance: true
        }
      },
      {
        id: 'msty-yield-optimization',
        name: 'MSTY Yield Optimization',
        description: 'Opportunities for enhanced MSTY yield harvesting',
        enabled: true,
        priority: 'medium',
        conditions: {
          assets: ['msty', 'mstr'],
          priceChangeThreshold: 8.0,
          contentKeywords: ['volatility', 'premium', 'yield', 'options'],
          sourceImportance: 'high',
          confluenceRequired: 1
        },
        actions: {
          notify: true,
          generateReport: true,
          trackPerformance: true
        }
      },
      {
        id: 'emerging-opportunities',
        name: 'Emerging Opportunities',
        description: 'New opportunities matching established patterns',
        enabled: true,
        priority: 'low',
        conditions: {
          assets: ['hyperliquid', 'sui', 'solana'],
          priceChangeThreshold: 20.0,
          contentKeywords: ['innovation', 'adoption', 'ecosystem', 'growth'],
          sourceImportance: 'medium',
          confluenceRequired: 2
        },
        actions: {
          notify: true,
          generateReport: false,
          trackPerformance: true
        }
      }
    ];

    this.contextLogger.info(`Loaded ${this.alertCriteria.length} default alert criteria`);
  }

  private startMonitoring(): void {
    // Monitor for opportunities every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      await this.checkForOpportunities();
    }, 5 * 60 * 1000);

    this.contextLogger.info('Opportunity monitoring started (5-minute intervals)');
  }

  async processContent(content: ContentItem): Promise<void> {
    try {
      // Process new content for opportunity signals
      const opportunities = await this.analyzeContentForOpportunities(content);
      
      for (const opportunity of opportunities) {
        await this.triggerAlert(opportunity);
      }
    } catch (error) {
      this.contextLogger.error('Failed to process content for opportunities:', (error as Error).message);
    }
  }

  private async analyzeContentForOpportunities(content: ContentItem): Promise<OpportunityAlert[]> {
    const opportunities: OpportunityAlert[] = [];

    for (const criteria of this.alertCriteria) {
      if (!criteria.enabled) continue;

      const signals = await this.evaluateCriteria(content, criteria);
      
      if (signals.length >= (criteria.conditions.confluenceRequired || 1)) {
        const opportunity = await this.createOpportunityAlert(content, criteria, signals);
        opportunities.push(opportunity);
      }
    }

    return opportunities;
  }

  private async evaluateCriteria(content: ContentItem, criteria: AlertCriteria): Promise<string[]> {
    const signals: string[] = [];

    // Check asset relevance
    const contentAssets = content.metadata.assets || [];
    const relevantAssets = criteria.conditions.assets.filter(asset => 
      contentAssets.some(contentAsset => 
        contentAsset.toLowerCase().includes(asset.toLowerCase())
      )
    );

    if (relevantAssets.length > 0) {
      signals.push(`Asset relevance: ${relevantAssets.join(', ')}`);
    }

    // Check content keywords
    if (criteria.conditions.contentKeywords) {
      const contentLower = content.content.toLowerCase();
      const matchedKeywords = criteria.conditions.contentKeywords.filter(keyword =>
        contentLower.includes(keyword.toLowerCase())
      );
      
      if (matchedKeywords.length > 0) {
        signals.push(`Keyword match: ${matchedKeywords.join(', ')}`);
      }
    }

    // Check source importance
    if (criteria.conditions.sourceImportance) {
      if (content.metadata.importance === criteria.conditions.sourceImportance) {
        signals.push(`High-importance source: ${content.source}`);
      }
    }

    // Check sentiment
    if (criteria.conditions.sentimentThreshold) {
      if (content.metadata.sentiment === criteria.conditions.sentimentThreshold) {
        signals.push(`Sentiment alignment: ${content.metadata.sentiment}`);
      }
    }

    // Check for predictions or market signals
    if (content.insights?.predictions && content.insights.predictions.length > 0) {
      signals.push(`Contains predictions: ${content.insights.predictions.length}`);
    }

    if (content.insights?.marketSignals && content.insights.marketSignals.length > 0) {
      signals.push(`Market signals detected: ${content.insights.marketSignals.length}`);
    }

    return signals;
  }

  private async createOpportunityAlert(
    content: ContentItem,
    criteria: AlertCriteria,
    signals: string[]
  ): Promise<OpportunityAlert> {
    const alertId = `alert-${Date.now()}-${criteria.id}`;
    const primaryAsset = criteria.conditions.assets[0];

    return {
      id: alertId,
      type: this.determineAlertType(criteria),
      asset: primaryAsset,
      signal: signals[0] || 'Multiple confluence signals',
      confidence: this.calculateConfidence(signals, criteria),
      timeframe: criteria.conditions.timeframe || '1-7 days',
      action: this.generateAction(criteria),
      reason: `${criteria.name}: ${signals.join(', ')}`,
      triggeredAt: new Date(),
      context: {
        socialSentiment: content.metadata.sentiment,
        catalysts: signals,
      }
    };
  }

  private determineAlertType(criteria: AlertCriteria): 'immediate' | 'upcoming' | 'watchlist' {
    switch (criteria.priority) {
      case 'high':
        return 'immediate';
      case 'medium':
        return 'upcoming';
      case 'low':
      default:
        return 'watchlist';
    }
  }

  private calculateConfidence(signals: string[], criteria: AlertCriteria): number {
    const baseConfidence = 0.5;
    const signalBonus = Math.min(signals.length * 0.15, 0.4);
    const priorityBonus = criteria.priority === 'high' ? 0.1 : 0.05;
    
    return Math.min(baseConfidence + signalBonus + priorityBonus, 0.95);
  }

  private generateAction(criteria: AlertCriteria): string {
    const actions = [
      "Monitor for entry opportunities",
      "Assess position sizing",
      "Review technical levels",
      "Cross-reference with portfolio",
      "Consider DCA strategy"
    ];

    return actions[Math.floor(Math.random() * actions.length)];
  }

  private async triggerAlert(opportunity: OpportunityAlert): Promise<void> {
    // Add to active alerts
    this.activeAlerts.push(opportunity);
    this.alertHistory.push(opportunity);

    // Update metrics
    this.updateMetrics(opportunity);

    this.contextLogger.info(`🚨 Opportunity Alert: ${opportunity.asset} - ${opportunity.signal}`);

    // In a real implementation, this would trigger notifications
    // For now, we'll log the alert
    this.contextLogger.info(`Alert Details: ${JSON.stringify(opportunity, null, 2)}`);
  }

  private updateMetrics(opportunity: OpportunityAlert): void {
    this.metrics.totalAlerts++;
    
    if (!this.metrics.alertsByType[opportunity.type]) {
      this.metrics.alertsByType[opportunity.type] = 0;
    }
    this.metrics.alertsByType[opportunity.type]++;

    if (!this.metrics.alertsByAsset[opportunity.asset]) {
      this.metrics.alertsByAsset[opportunity.asset] = 0;
    }
    this.metrics.alertsByAsset[opportunity.asset]++;
  }

  private async checkForOpportunities(): Promise<void> {
    try {
      // This would integrate with market data to check for price-based opportunities
      // For now, we'll do basic housekeeping
      await this.cleanupExpiredAlerts();
      await this.updateAlertPerformance();
    } catch (error) {
      this.contextLogger.error('Failed to check for opportunities:', (error as Error).message);
    }
  }

  private async cleanupExpiredAlerts(): Promise<void> {
    const now = new Date();
    const expiryThreshold = 24 * 60 * 60 * 1000; // 24 hours

    this.activeAlerts = this.activeAlerts.filter(alert => {
      const alertAge = now.getTime() - alert.triggeredAt.getTime();
      return alertAge < expiryThreshold;
    });
  }

  private async updateAlertPerformance(): Promise<void> {
    // In a real implementation, this would track how alerts performed
    // For now, we'll just log the metrics
    this.contextLogger.info(`Alert Metrics: ${JSON.stringify(this.metrics, null, 2)}`);
  }

  async getActiveAlerts(): Promise<OpportunityAlert[]> {
    return [...this.activeAlerts];
  }

  async getAlertHistory(limit: number = 50): Promise<OpportunityAlert[]> {
    return this.alertHistory
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  async getMetrics(): Promise<OpportunityMetrics> {
    return { ...this.metrics };
  }

  async addCriteria(criteria: AlertCriteria): Promise<void> {
    this.alertCriteria.push(criteria);
    this.contextLogger.info(`Added new alert criteria: ${criteria.name}`);
  }

  async updateCriteria(criteriaId: string, updates: Partial<AlertCriteria>): Promise<void> {
    const index = this.alertCriteria.findIndex(c => c.id === criteriaId);
    if (index !== -1) {
      this.alertCriteria[index] = { ...this.alertCriteria[index], ...updates };
      this.contextLogger.info(`Updated alert criteria: ${criteriaId}`);
    }
  }

  async formatAlertsForDelivery(alerts: OpportunityAlert[]): Promise<ProcessedIntelligence> {
    const sections = [
      "🚨 **Opportunity Alerts**",
      `*${new Date().toISOString().split('T')[0]}*`,
      "",
      "⚡ **Immediate Opportunities:**",
      ...alerts.filter(a => a.type === 'immediate').map(alert => 
        `• **${alert.asset.toUpperCase()}**: ${alert.signal} (${(alert.confidence * 100).toFixed(0)}% confidence)\n  Action: ${alert.action}\n  Reason: ${alert.reason}`
      ),
      "",
      "📅 **Upcoming Opportunities:**",
      ...alerts.filter(a => a.type === 'upcoming').map(alert => 
        `• **${alert.asset.toUpperCase()}**: ${alert.signal} (${alert.timeframe})\n  ${alert.reason}`
      ),
      "",
      "👀 **Watchlist Items:**",
      ...alerts.filter(a => a.type === 'watchlist').map(alert => 
        `• **${alert.asset.toUpperCase()}**: ${alert.signal}\n  Monitor: ${alert.reason}`
      ),
      "",
      "Truth is verified, not argued. Opportunities are seized, not wished for."
    ];

    return {
      briefingId: `alerts-${Date.now()}`,
      date: new Date(),
      content: {
        marketPulse: {
          bitcoin: { price: 0, change24h: 0, trend: "neutral" },
          altcoins: { outperformers: [], underperformers: [], signals: [] },
          stocks: { watchlist: [], opportunities: [] }
        },
        knowledgeDigest: {
          newInsights: [],
          predictionUpdates: [],
          performanceReport: []
        },
        opportunities: {
          immediate: alerts.filter(a => a.type === 'immediate').map(a => `${a.asset}: ${a.signal}`),
          upcoming: alerts.filter(a => a.type === 'upcoming').map(a => `${a.asset}: ${a.signal}`),
          watchlist: alerts.filter(a => a.type === 'watchlist').map(a => `${a.asset}: ${a.signal}`)
        }
      },
      deliveryMethod: 'alert'
    };
  }

  // Required abstract methods from BaseDataService
  async updateData(): Promise<void> {
    try {
      await this.checkForOpportunities();
      
      // Store current state in memory
      await this.storeInMemory({
        activeAlerts: this.activeAlerts,
        alertHistory: this.alertHistory.slice(-100), // Keep last 100 alerts
        metrics: this.metrics,
        timestamp: Date.now()
      }, 'opportunity-alerts-state');
      
      this.contextLogger.info(`Updated opportunity alert data: ${this.activeAlerts.length} active alerts`);
    } catch (error) {
      this.contextLogger.error('Failed to update opportunity alert data:', (error as Error).message);
      throw error;
    }
  }

  async forceUpdate(): Promise<void> {
    this.contextLogger.info('Forcing opportunity alert update');
    await this.updateData();
  }
}

export default OpportunityAlertService; 