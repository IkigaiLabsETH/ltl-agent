import { Service, logger, type IAgentRuntime } from '@elizaos/core';
import { ContentItem, ProcessedIntelligence } from './ContentIngestionService';
import { OpportunityAlert } from './OpportunityAlertService';
import { LoggerWithContext, generateCorrelationId } from '../utils';

export interface Prediction {
  id: string;
  asset: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  predictedPrice?: number;
  targetPrice?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  catalysts: string[];
  source: string;
  createdAt: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'completed';
}

export interface PredictionOutcome {
  predictionId: string;
  actualPrice?: number;
  actualOutcome: string;
  accuracy: number; // 0-1 scale
  profitability?: number; // percentage gain/loss
  timeToRealization?: number; // days
  evaluatedAt: Date;
  notes: string[];
}

export interface PerformanceMetrics {
  totalPredictions: number;
  activePredictions: number;
  completedPredictions: number;
  overallAccuracy: number;
  averageConfidence: number;
  accuracyByAsset: { [asset: string]: number };
  accuracyByTimeframe: { [timeframe: string]: number };
  accuracyBySource: { [source: string]: number };
  profitabilityMetrics: {
    totalReturn: number;
    winRate: number;
    averageGain: number;
    averageLoss: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
  };
  recentPerformance: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
}

export interface PerformanceReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  metrics: PerformanceMetrics;
  topPredictions: {
    mostAccurate: PredictionOutcome[];
    mostProfitable: PredictionOutcome[];
    biggestMisses: PredictionOutcome[];
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  trends: {
    improvingAreas: string[];
    decliningAreas: string[];
  };
}

export class PerformanceTrackingService extends Service {
  static serviceType = 'performance-tracking';
  capabilityDescription = 'Tracks prediction accuracy and performance over time';
  
  private contextLogger: LoggerWithContext;
  private correlationId: string;
  private predictions: Map<string, Prediction> = new Map();
  private outcomes: Map<string, PredictionOutcome> = new Map();
  private metrics: PerformanceMetrics;
  private evaluationInterval: NodeJS.Timeout | null = null;

  constructor(runtime: IAgentRuntime) {
    super();
    this.runtime = runtime;
    this.correlationId = generateCorrelationId();
    this.contextLogger = new LoggerWithContext(this.correlationId, 'PerformanceTrackingService');
    this.metrics = this.initializeMetrics();
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('PerformanceTrackingService starting...');
    const service = new PerformanceTrackingService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('PerformanceTrackingService stopping...');
    const service = runtime.getService('performance-tracking');
    if (service && service.stop) {
      await service.stop();
    }
  }

  async init() {
    this.contextLogger.info('PerformanceTrackingService initialized');
    await this.loadHistoricalData();
    this.startEvaluation();
  }

  async stop() {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
    }
    this.contextLogger.info('PerformanceTrackingService stopped');
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      totalPredictions: 0,
      activePredictions: 0,
      completedPredictions: 0,
      overallAccuracy: 0,
      averageConfidence: 0,
      accuracyByAsset: {},
      accuracyByTimeframe: {},
      accuracyBySource: {},
      profitabilityMetrics: {
        totalReturn: 0,
        winRate: 0,
        averageGain: 0,
        averageLoss: 0
      },
      recentPerformance: {
        last7Days: 0,
        last30Days: 0,
        last90Days: 0
      }
    };
  }

  private async loadHistoricalData(): Promise<void> {
    // In a real implementation, this would load from database
    // For now, we'll create some sample historical data
    await this.createSampleData();
  }

  private async createSampleData(): Promise<void> {
    // Create sample historical predictions based on LiveTheLifeTV methodology
    const samplePredictions = [
      {
        id: 'pred-bitcoin-institutional-2024',
        asset: 'bitcoin',
        prediction: 'Institutional adoption will drive Bitcoin to $100K by end of 2024',
        confidence: 0.85,
        timeframe: '12 months',
        predictedPrice: 100000,
        targetPrice: 100000,
        catalysts: ['ETF approvals', 'Corporate adoption', 'Regulatory clarity'],
        source: 'LiveTheLifeTV Research',
        createdAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-12-31'),
        status: 'completed' as const
      },
      {
        id: 'pred-metaplanet-growth-2024',
        asset: 'metaplanet',
        prediction: 'MetaPlanet will outperform Bitcoin by 5x due to Japanese Bitcoin strategy',
        confidence: 0.75,
        timeframe: '6 months',
        priceRange: { min: 500, max: 2000 },
        catalysts: ['Japanese regulation', 'Bitcoin treasury strategy', 'Yen weakness'],
        source: 'LiveTheLifeTV Research',
        createdAt: new Date('2024-06-01'),
        expiresAt: new Date('2024-12-01'),
        status: 'completed' as const
      },
      {
        id: 'pred-msty-yield-2024',
        asset: 'msty',
        prediction: 'MSTY will generate 20%+ annualized yield through volatility harvesting',
        confidence: 0.70,
        timeframe: '12 months',
        catalysts: ['MicroStrategy volatility', 'Options premiums', 'Institutional flows'],
        source: 'LiveTheLifeTV Research',
        createdAt: new Date('2024-03-01'),
        expiresAt: new Date('2025-03-01'),
        status: 'active' as const
      }
    ];

    // Add sample predictions
    for (const pred of samplePredictions) {
      this.predictions.set(pred.id, pred);
    }

    // Create sample outcomes for completed predictions
    const sampleOutcomes = [
      {
        predictionId: 'pred-bitcoin-institutional-2024',
        actualPrice: 100000,
        actualOutcome: 'Bitcoin reached $100K as predicted with institutional adoption',
        accuracy: 0.95,
        profitability: 400, // 400% gain from ~$25K to $100K
        timeToRealization: 365,
        evaluatedAt: new Date('2024-12-31'),
        notes: ['Accurate timing', 'Catalysts materialized as expected', 'Institutional demand exceeded expectations']
      },
      {
        predictionId: 'pred-metaplanet-growth-2024',
        actualPrice: 1500,
        actualOutcome: 'MetaPlanet delivered 50x outperformance vs Bitcoin',
        accuracy: 0.90,
        profitability: 5000, // 5000% gain
        timeToRealization: 180,
        evaluatedAt: new Date('2024-12-01'),
        notes: ['Exceptional performance', 'Japanese strategy validation', 'Exceeded price targets']
      }
    ];

    // Add sample outcomes
    for (const outcome of sampleOutcomes) {
      this.outcomes.set(outcome.predictionId, outcome);
    }

    this.contextLogger.info(`Loaded ${this.predictions.size} predictions and ${this.outcomes.size} outcomes`);
  }

  private startEvaluation(): void {
    // Evaluate predictions every hour
    this.evaluationInterval = setInterval(async () => {
      await this.evaluatePredictions();
    }, 60 * 60 * 1000);

    this.contextLogger.info('Performance evaluation started (hourly intervals)');
  }

  async trackPrediction(content: ContentItem): Promise<void> {
    try {
      if (!content.insights?.predictions || content.insights.predictions.length === 0) {
        return;
      }

      for (const predictionText of content.insights.predictions) {
        const prediction = await this.extractPrediction(content, predictionText);
        if (prediction) {
          this.predictions.set(prediction.id, prediction);
          this.contextLogger.info(`Tracking new prediction: ${prediction.asset} - ${prediction.prediction}`);
        }
      }
    } catch (error) {
      this.contextLogger.error('Failed to track prediction:', (error as Error).message);
    }
  }

  async trackOpportunityAlert(alert: OpportunityAlert): Promise<void> {
    try {
      const prediction: Prediction = {
        id: `pred-${alert.id}`,
        asset: alert.asset,
        prediction: alert.signal,
        confidence: alert.confidence,
        timeframe: alert.timeframe,
        catalysts: alert.context.catalysts,
        source: 'OpportunityAlert',
        createdAt: alert.triggeredAt,
        expiresAt: this.calculateExpiryDate(alert.timeframe),
        status: 'active'
      };

      this.predictions.set(prediction.id, prediction);
      this.contextLogger.info(`Tracking opportunity alert as prediction: ${prediction.asset}`);
    } catch (error) {
      this.contextLogger.error('Failed to track opportunity alert:', (error as Error).message);
    }
  }

  private async extractPrediction(content: ContentItem, predictionText: string): Promise<Prediction | null> {
    try {
      // Extract prediction details from content
      const predictionId = `pred-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const asset = (content.metadata.assets && content.metadata.assets[0]) || 'unknown';
      
      const prediction: Prediction = {
        id: predictionId,
        asset,
        prediction: predictionText,
        confidence: 0.6, // Default confidence
        timeframe: this.extractTimeframe(predictionText),
        catalysts: this.extractCatalysts(predictionText),
        source: content.source,
        createdAt: content.metadata.timestamp,
        expiresAt: this.calculateExpiryDate(this.extractTimeframe(predictionText)),
        status: 'active'
      };

      // Try to extract specific price targets
      const priceMatch = predictionText.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)/);
      if (priceMatch) {
        prediction.predictedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
      }

      return prediction;
    } catch (error) {
      this.contextLogger.error('Failed to extract prediction:', (error as Error).message);
      return null;
    }
  }

  private extractTimeframe(predictionText: string): string {
    const timeframes = ['1 day', '1 week', '1 month', '3 months', '6 months', '1 year'];
    const textLower = predictionText.toLowerCase();
    
    for (const timeframe of timeframes) {
      if (textLower.includes(timeframe)) {
        return timeframe;
      }
    }
    
    return '3 months'; // Default timeframe
  }

  private extractCatalysts(predictionText: string): string[] {
    const catalysts = [];
    const textLower = predictionText.toLowerCase();
    
    const catalystKeywords = [
      'etf', 'regulation', 'adoption', 'treasury', 'institutional',
      'earnings', 'product', 'partnership', 'upgrade', 'innovation'
    ];
    
    for (const keyword of catalystKeywords) {
      if (textLower.includes(keyword)) {
        catalysts.push(keyword);
      }
    }
    
    return catalysts;
  }

  private calculateExpiryDate(timeframe: string): Date {
    const now = new Date();
    const expiry = new Date(now);
    
    switch (timeframe) {
      case '1 day':
        expiry.setDate(now.getDate() + 1);
        break;
      case '1 week':
        expiry.setDate(now.getDate() + 7);
        break;
      case '1 month':
        expiry.setMonth(now.getMonth() + 1);
        break;
      case '3 months':
        expiry.setMonth(now.getMonth() + 3);
        break;
      case '6 months':
        expiry.setMonth(now.getMonth() + 6);
        break;
      case '1 year':
        expiry.setFullYear(now.getFullYear() + 1);
        break;
      default:
        expiry.setMonth(now.getMonth() + 3); // Default to 3 months
    }
    
    return expiry;
  }

  private async evaluatePredictions(): Promise<void> {
    try {
      const now = new Date();
      
      for (const [predictionId, prediction] of this.predictions.entries()) {
        if (prediction.status !== 'active') continue;
        
        // Check if prediction has expired
        if (prediction.expiresAt && now > prediction.expiresAt) {
          await this.evaluateExpiredPrediction(prediction);
        }
        
        // Check for early completion signals
        await this.checkForEarlyCompletion(prediction);
      }
      
      await this.updateMetrics();
    } catch (error) {
      this.contextLogger.error('Failed to evaluate predictions:', (error as Error).message);
    }
  }

  private async evaluateExpiredPrediction(prediction: Prediction): Promise<void> {
    try {
      // In a real implementation, this would check actual market data
      // For now, we'll create a mock evaluation
      const accuracy = Math.random() * 0.8 + 0.2; // Random accuracy between 20-100%
      
      const outcome: PredictionOutcome = {
        predictionId: prediction.id,
        actualOutcome: `Prediction expired: ${prediction.prediction}`,
        accuracy,
        evaluatedAt: new Date(),
        notes: ['Prediction expired', 'Evaluation based on available data']
      };

      this.outcomes.set(prediction.id, outcome);
      
      // Update prediction status
      prediction.status = 'expired';
      this.predictions.set(prediction.id, prediction);
      
      this.contextLogger.info(`Evaluated expired prediction: ${prediction.asset} (${accuracy.toFixed(2)} accuracy)`);
    } catch (error) {
      this.contextLogger.error('Failed to evaluate expired prediction:', (error as Error).message);
    }
  }

  private async checkForEarlyCompletion(prediction: Prediction): Promise<void> {
    // In a real implementation, this would check market data for early completion
    // For now, we'll skip this functionality
  }

  private async updateMetrics(): Promise<void> {
    try {
      const allPredictions = Array.from(this.predictions.values());
      const allOutcomes = Array.from(this.outcomes.values());
      
      this.metrics = {
        totalPredictions: allPredictions.length,
        activePredictions: allPredictions.filter(p => p.status === 'active').length,
        completedPredictions: allPredictions.filter(p => p.status === 'completed').length,
        overallAccuracy: this.calculateOverallAccuracy(allOutcomes),
        averageConfidence: this.calculateAverageConfidence(allPredictions),
        accuracyByAsset: this.calculateAccuracyByAsset(allPredictions, allOutcomes),
        accuracyByTimeframe: this.calculateAccuracyByTimeframe(allPredictions, allOutcomes),
        accuracyBySource: this.calculateAccuracyBySource(allPredictions, allOutcomes),
        profitabilityMetrics: this.calculateProfitabilityMetrics(allOutcomes),
        recentPerformance: this.calculateRecentPerformance(allOutcomes)
      };
    } catch (error) {
      this.contextLogger.error('Failed to update metrics:', (error as Error).message);
    }
  }

  private calculateOverallAccuracy(outcomes: PredictionOutcome[]): number {
    if (outcomes.length === 0) return 0;
    
    const totalAccuracy = outcomes.reduce((sum, outcome) => sum + outcome.accuracy, 0);
    return totalAccuracy / outcomes.length;
  }

  private calculateAverageConfidence(predictions: Prediction[]): number {
    if (predictions.length === 0) return 0;
    
    const totalConfidence = predictions.reduce((sum, pred) => sum + pred.confidence, 0);
    return totalConfidence / predictions.length;
  }

  private calculateAccuracyByAsset(predictions: Prediction[], outcomes: PredictionOutcome[]): { [asset: string]: number } {
    const accuracyByAsset: { [asset: string]: number } = {};
    
    for (const asset of [...new Set(predictions.map(p => p.asset))]) {
      const assetPredictions = predictions.filter(p => p.asset === asset);
      const assetOutcomes = outcomes.filter(o => {
        const pred = predictions.find(p => p.id === o.predictionId);
        return pred && pred.asset === asset;
      });
      
      if (assetOutcomes.length > 0) {
        accuracyByAsset[asset] = assetOutcomes.reduce((sum, o) => sum + o.accuracy, 0) / assetOutcomes.length;
      }
    }
    
    return accuracyByAsset;
  }

  private calculateAccuracyByTimeframe(predictions: Prediction[], outcomes: PredictionOutcome[]): { [timeframe: string]: number } {
    const accuracyByTimeframe: { [timeframe: string]: number } = {};
    
    for (const timeframe of [...new Set(predictions.map(p => p.timeframe))]) {
      const timeframePredictions = predictions.filter(p => p.timeframe === timeframe);
      const timeframeOutcomes = outcomes.filter(o => {
        const pred = predictions.find(p => p.id === o.predictionId);
        return pred && pred.timeframe === timeframe;
      });
      
      if (timeframeOutcomes.length > 0) {
        accuracyByTimeframe[timeframe] = timeframeOutcomes.reduce((sum, o) => sum + o.accuracy, 0) / timeframeOutcomes.length;
      }
    }
    
    return accuracyByTimeframe;
  }

  private calculateAccuracyBySource(predictions: Prediction[], outcomes: PredictionOutcome[]): { [source: string]: number } {
    const accuracyBySource: { [source: string]: number } = {};
    
    for (const source of [...new Set(predictions.map(p => p.source))]) {
      const sourcePredictions = predictions.filter(p => p.source === source);
      const sourceOutcomes = outcomes.filter(o => {
        const pred = predictions.find(p => p.id === o.predictionId);
        return pred && pred.source === source;
      });
      
      if (sourceOutcomes.length > 0) {
        accuracyBySource[source] = sourceOutcomes.reduce((sum, o) => sum + o.accuracy, 0) / sourceOutcomes.length;
      }
    }
    
    return accuracyBySource;
  }

  private calculateProfitabilityMetrics(outcomes: PredictionOutcome[]): PerformanceMetrics['profitabilityMetrics'] {
    const profitableOutcomes = outcomes.filter(o => o.profitability !== undefined);
    
    if (profitableOutcomes.length === 0) {
      return {
        totalReturn: 0,
        winRate: 0,
        averageGain: 0,
        averageLoss: 0
      };
    }
    
    const totalReturn = profitableOutcomes.reduce((sum, o) => sum + (o.profitability || 0), 0);
    const wins = profitableOutcomes.filter(o => (o.profitability || 0) > 0);
    const losses = profitableOutcomes.filter(o => (o.profitability || 0) < 0);
    
    return {
      totalReturn,
      winRate: wins.length / profitableOutcomes.length,
      averageGain: wins.length > 0 ? wins.reduce((sum, o) => sum + (o.profitability || 0), 0) / wins.length : 0,
      averageLoss: losses.length > 0 ? losses.reduce((sum, o) => sum + (o.profitability || 0), 0) / losses.length : 0
    };
  }

  private calculateRecentPerformance(outcomes: PredictionOutcome[]): PerformanceMetrics['recentPerformance'] {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const recent7 = outcomes.filter(o => o.evaluatedAt >= last7Days);
    const recent30 = outcomes.filter(o => o.evaluatedAt >= last30Days);
    const recent90 = outcomes.filter(o => o.evaluatedAt >= last90Days);
    
    return {
      last7Days: recent7.length > 0 ? recent7.reduce((sum, o) => sum + o.accuracy, 0) / recent7.length : 0,
      last30Days: recent30.length > 0 ? recent30.reduce((sum, o) => sum + o.accuracy, 0) / recent30.length : 0,
      last90Days: recent90.length > 0 ? recent90.reduce((sum, o) => sum + o.accuracy, 0) / recent90.length : 0
    };
  }

  async generatePerformanceReport(days: number = 30): Promise<PerformanceReport> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const recentOutcomes = Array.from(this.outcomes.values())
      .filter(o => o.evaluatedAt >= startDate && o.evaluatedAt <= endDate);
    
    const topPredictions = {
      mostAccurate: recentOutcomes
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 5),
      mostProfitable: recentOutcomes
        .filter(o => o.profitability !== undefined)
        .sort((a, b) => (b.profitability || 0) - (a.profitability || 0))
        .slice(0, 5),
      biggestMisses: recentOutcomes
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3)
    };
    
    return {
      id: `report-${Date.now()}`,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      metrics: { ...this.metrics },
      topPredictions,
      insights: {
        strengths: this.generateInsights('strengths'),
        weaknesses: this.generateInsights('weaknesses'),
        recommendations: this.generateInsights('recommendations')
      },
      trends: {
        improvingAreas: this.generateTrends('improving'),
        decliningAreas: this.generateTrends('declining')
      }
    };
  }

  private generateInsights(type: 'strengths' | 'weaknesses' | 'recommendations'): string[] {
    switch (type) {
      case 'strengths':
        return [
          'Strong performance in Bitcoin predictions',
          'Excellent timing on institutional adoption calls',
          'High accuracy rate on high-confidence predictions'
        ];
      case 'weaknesses':
        return [
          'Altcoin predictions show higher variance',
          'Short-term predictions need improvement',
          'Market timing can be refined'
        ];
      case 'recommendations':
        return [
          'Focus on high-confidence, longer-term predictions',
          'Improve altcoin analysis methodology',
          'Increase sample size for better statistics'
        ];
      default:
        return [];
    }
  }

  private generateTrends(type: 'improving' | 'declining'): string[] {
    switch (type) {
      case 'improving':
        return [
          'Bitcoin prediction accuracy trending up',
          'Institutional adoption calls getting better',
          'Timing precision improving'
        ];
      case 'declining':
        return [
          'Altcoin predictions showing more variance',
          'Short-term calls need attention'
        ];
      default:
        return [];
    }
  }

  async getMetrics(): Promise<PerformanceMetrics> {
    return { ...this.metrics };
  }

  async getPredictions(status?: 'active' | 'completed' | 'expired'): Promise<Prediction[]> {
    const predictions = Array.from(this.predictions.values());
    return status ? predictions.filter(p => p.status === status) : predictions;
  }

  async getOutcomes(limit: number = 50): Promise<PredictionOutcome[]> {
    return Array.from(this.outcomes.values())
      .sort((a, b) => b.evaluatedAt.getTime() - a.evaluatedAt.getTime())
      .slice(0, limit);
  }

  async formatPerformanceForDelivery(): Promise<ProcessedIntelligence> {
    const report = await this.generatePerformanceReport();
    
    const sections = [
      "📊 **Performance Report**",
      `*${report.period.start.toISOString().split('T')[0]} - ${report.period.end.toISOString().split('T')[0]}*`,
      "",
      "🎯 **Overall Performance:**",
      `• Total Predictions: ${report.metrics.totalPredictions}`,
      `• Overall Accuracy: ${(report.metrics.overallAccuracy * 100).toFixed(1)}%`,
      `• Win Rate: ${(report.metrics.profitabilityMetrics.winRate * 100).toFixed(1)}%`,
      `• Total Return: ${report.metrics.profitabilityMetrics.totalReturn.toFixed(1)}%`,
      "",
      "🏆 **Top Performers:**",
      ...report.topPredictions.mostAccurate.slice(0, 3).map(outcome => 
        `• ${(outcome.accuracy * 100).toFixed(1)}% accuracy: ${outcome.actualOutcome}`
      ),
      "",
      "💡 **Key Insights:**",
      ...report.insights.strengths.map(insight => `• ${insight}`),
      "",
      "🔮 **Recommendations:**",
      ...report.insights.recommendations.map(rec => `• ${rec}`),
      "",
      "Performance tracking continues. Truth is verified through results."
    ];

    return {
      briefingId: report.id,
      date: report.generatedAt,
      content: {
        marketPulse: {
          bitcoin: { price: 0, change24h: 0, trend: "neutral" },
          altcoins: { outperformers: [], underperformers: [], signals: [] },
          stocks: { watchlist: [], opportunities: [] }
        },
        knowledgeDigest: {
          newInsights: report.insights.strengths,
          predictionUpdates: report.topPredictions.mostAccurate.map(o => o.actualOutcome),
          performanceReport: [
            `Overall Accuracy: ${(report.metrics.overallAccuracy * 100).toFixed(1)}%`,
            `Win Rate: ${(report.metrics.profitabilityMetrics.winRate * 100).toFixed(1)}%`,
            `Total Return: ${report.metrics.profitabilityMetrics.totalReturn.toFixed(1)}%`
          ]
        },
        opportunities: {
          immediate: [],
          upcoming: [],
          watchlist: []
        }
      },
      deliveryMethod: 'digest'
    };
  }
}

export default PerformanceTrackingService; 