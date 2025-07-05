import { IAgentRuntime, Provider, elizaLogger, Memory, State } from '@elizaos/core';
import { OpportunityAlertService } from '../services/OpportunityAlertService';

/**
 * Opportunity Provider - Injects contextual investment opportunity alerts
 * 
 * This private provider adds investment opportunity context including:
 * - Active investment opportunity alerts
 * - Historical alert performance metrics
 * - Investment signal confluence analysis
 * - Alert criteria and confidence scores
 * - Asset-specific opportunity signals
 * - Performance tracking and accuracy rates
 * 
 * Usage: Must be explicitly included in private providers for investment analysis
 */
export const opportunityProvider: Provider = {
  name: 'opportunity',
  description: 'Provides investment opportunity alerts, signals, and performance tracking',
  private: true, // Must be explicitly included
  position: 8, // Late in the chain for strategic analysis
  
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    elizaLogger.debug('🚨 [OpportunityProvider] Providing investment opportunity context');
    
    try {
      // Get the opportunity alert service
      const opportunityService = runtime.getService('opportunity-alert') as OpportunityAlertService;
      if (!opportunityService) {
        elizaLogger.warn('[OpportunityProvider] OpportunityAlertService not available');
        return {
          text: 'Investment opportunity data temporarily unavailable.',
          values: {
            opportunityDataAvailable: false,
            error: 'Service not found'
          },
        };
      }

      // Get comprehensive opportunity data
      const activeAlerts = await opportunityService.getActiveAlerts();
      const alertHistory = await opportunityService.getAlertHistory(10);
      const metrics = await opportunityService.getMetrics();
      
      // Analyze opportunities
      const opportunityAnalysis = analyzeOpportunities(activeAlerts, metrics);
      
      // Categorize alerts by urgency and asset
      const alertCategories = categorizeAlerts(activeAlerts);
      
      // Analyze historical performance
      const performanceAnalysis = analyzeAlertPerformance(alertHistory, metrics);
      
      // Build opportunity context
      const opportunityContext = buildOpportunityContext(
        opportunityAnalysis,
        alertCategories,
        performanceAnalysis,
        activeAlerts,
        metrics
      );

      elizaLogger.debug(`[OpportunityProvider] Providing context for ${activeAlerts.length} active alerts`);
      
      return {
        text: opportunityContext,
        values: {
          opportunityDataAvailable: true,
          activeAlertsCount: activeAlerts.length,
          immediateOpportunities: alertCategories.immediate.length,
          upcomingOpportunities: alertCategories.upcoming.length,
          watchlistItems: alertCategories.watchlist.length,
          totalAlerts: metrics.totalAlerts,
          accuracyRate: metrics.accuracyRate,
          profitableAlerts: metrics.profitableAlerts,
          totalReturn: metrics.totalReturn,
          bitcoinThesisAlerts: alertCategories.bitcoinThesis.length,
          altcoinAlerts: alertCategories.altcoin.length,
          stockAlerts: alertCategories.stock.length,
          confidenceLevel: opportunityAnalysis.averageConfidence,
          signalStrength: opportunityAnalysis.signalStrength,
          // Include data for actions to access
          activeAlerts: activeAlerts,
          alertHistory: alertHistory,
          metrics: metrics,
          opportunityAnalysis: opportunityAnalysis,
          alertCategories: alertCategories,
          performanceAnalysis: performanceAnalysis
        },
      };
      
    } catch (error) {
      elizaLogger.error('[OpportunityProvider] Error providing opportunity context:', error);
      return {
        text: 'Investment opportunity services encountered an error. Please try again later.',
        values: {
          opportunityDataAvailable: false,
          error: error.message
        },
      };
    }
  }
};

/**
 * Helper function to analyze current opportunities
 */
function analyzeOpportunities(activeAlerts: any[], metrics: any): any {
  let signalStrength = 'weak';
  let averageConfidence = 0;
  let marketOpportunity = 'limited';
  let riskLevel = 'moderate';
  
  if (activeAlerts?.length > 0) {
    // Calculate average confidence
    const totalConfidence = activeAlerts.reduce((sum, alert) => sum + (alert.confidence || 0), 0);
    averageConfidence = Math.round((totalConfidence / activeAlerts.length) * 100) / 100;
    
    // Determine signal strength
    const highConfidenceAlerts = activeAlerts.filter(alert => alert.confidence > 0.7).length;
    const mediumConfidenceAlerts = activeAlerts.filter(alert => alert.confidence > 0.5).length;
    
    if (highConfidenceAlerts > 2) {
      signalStrength = 'very strong';
      marketOpportunity = 'excellent';
    } else if (highConfidenceAlerts > 0 || mediumConfidenceAlerts > 3) {
      signalStrength = 'strong';
      marketOpportunity = 'good';
    } else if (mediumConfidenceAlerts > 0) {
      signalStrength = 'moderate';
      marketOpportunity = 'fair';
    }
    
    // Assess risk level based on alert types and timeframes
    const immediateAlerts = activeAlerts.filter(alert => alert.type === 'immediate').length;
    if (immediateAlerts > activeAlerts.length * 0.6) {
      riskLevel = 'high'; // Many immediate signals suggest volatility
    } else if (immediateAlerts === 0) {
      riskLevel = 'low'; // All medium-term signals
    }
  }
  
  return {
    signalStrength,
    averageConfidence,
    marketOpportunity,
    riskLevel
  };
}

/**
 * Helper function to categorize alerts
 */
function categorizeAlerts(activeAlerts: any[]): any {
  const categories = {
    immediate: [],
    upcoming: [],
    watchlist: [],
    bitcoinThesis: [],
    altcoin: [],
    stock: [],
    highConfidence: [],
    mediumConfidence: [],
    lowConfidence: []
  };
  
  if (activeAlerts?.length > 0) {
    activeAlerts.forEach(alert => {
      // By type
      if (alert.type === 'immediate') categories.immediate.push(alert);
      else if (alert.type === 'upcoming') categories.upcoming.push(alert);
      else if (alert.type === 'watchlist') categories.watchlist.push(alert);
      
      // By asset category
      if (alert.asset?.toLowerCase().includes('bitcoin') || alert.asset === 'btc') {
        categories.bitcoinThesis.push(alert);
      } else if (['ethereum', 'solana', 'sui', 'ada'].includes(alert.asset?.toLowerCase())) {
        categories.altcoin.push(alert);
      } else if (['mstr', 'tsla', 'msty', 'coin'].includes(alert.asset?.toLowerCase())) {
        categories.stock.push(alert);
      }
      
      // By confidence
      if (alert.confidence > 0.7) categories.highConfidence.push(alert);
      else if (alert.confidence > 0.5) categories.mediumConfidence.push(alert);
      else categories.lowConfidence.push(alert);
    });
  }
  
  return categories;
}

/**
 * Helper function to analyze alert performance
 */
function analyzeAlertPerformance(alertHistory: any[], metrics: any): any {
  const analysis = {
    recentPerformance: 'unknown',
    bestPerformingAssets: [],
    worstPerformingAssets: [],
    performanceTrend: 'stable',
    reliabilityScore: 0
  };
  
  if (metrics) {
    // Calculate reliability score
    analysis.reliabilityScore = Math.round((metrics.accuracyRate || 0) * 100);
    
    // Determine recent performance
    if (metrics.accuracyRate > 0.8) {
      analysis.recentPerformance = 'excellent';
    } else if (metrics.accuracyRate > 0.6) {
      analysis.recentPerformance = 'good';
    } else if (metrics.accuracyRate > 0.4) {
      analysis.recentPerformance = 'fair';
    } else {
      analysis.recentPerformance = 'poor';
    }
    
    // Performance trend (simplified)
    if (metrics.profitableAlerts > metrics.totalAlerts * 0.7) {
      analysis.performanceTrend = 'improving';
    } else if (metrics.profitableAlerts < metrics.totalAlerts * 0.3) {
      analysis.performanceTrend = 'declining';
    }
  }
  
  // Analyze asset performance from history
  if (alertHistory?.length > 0) {
    const assetPerformance = {};
    alertHistory.forEach(alert => {
      if (!assetPerformance[alert.asset]) {
        assetPerformance[alert.asset] = { wins: 0, total: 0 };
      }
      assetPerformance[alert.asset].total++;
      // Simplified success tracking - would need more data in real implementation
      if (alert.confidence > 0.7) {
        assetPerformance[alert.asset].wins++;
      }
    });
    
    // Find best and worst performing assets
    const assetStats = Object.entries(assetPerformance).map(([asset, stats]: [string, any]) => ({
      asset,
      winRate: stats.wins / stats.total,
      total: stats.total
    })).filter(stat => stat.total > 1); // Only assets with multiple alerts
    
    assetStats.sort((a, b) => b.winRate - a.winRate);
    analysis.bestPerformingAssets = assetStats.slice(0, 3);
    analysis.worstPerformingAssets = assetStats.slice(-2);
  }
  
  return analysis;
}

/**
 * Helper function to build opportunity context
 */
function buildOpportunityContext(
  opportunityAnalysis: any,
  alertCategories: any,
  performanceAnalysis: any,
  activeAlerts: any[],
  metrics: any
): string {
  const context = [];
  
  // Opportunity overview
  context.push(`🚨 INVESTMENT OPPORTUNITIES`);
  context.push(`📊 Signal strength: ${opportunityAnalysis.signalStrength}`);
  context.push(`🎯 Market opportunity: ${opportunityAnalysis.marketOpportunity}`);
  context.push(`⚖️ Risk level: ${opportunityAnalysis.riskLevel}`);
  context.push('');
  
  // Active alerts summary
  if (activeAlerts?.length > 0) {
    context.push(`⚡ ACTIVE ALERTS (${activeAlerts.length}):`);
    context.push(`• Immediate action: ${alertCategories.immediate.length}`);
    context.push(`• Upcoming opportunities: ${alertCategories.upcoming.length}`);
    context.push(`• Watchlist items: ${alertCategories.watchlist.length}`);
    context.push(`• Average confidence: ${(opportunityAnalysis.averageConfidence * 100).toFixed(1)}%`);
    context.push('');
  }
  
  // High-priority immediate alerts
  if (alertCategories.immediate.length > 0) {
    context.push(`🔥 IMMEDIATE OPPORTUNITIES:`);
    alertCategories.immediate.slice(0, 3).forEach((alert: any, index: number) => {
      const confidence = (alert.confidence * 100).toFixed(0);
      context.push(`${index + 1}. ${alert.asset}: ${alert.signal} (${confidence}% confidence)`);
      context.push(`   Action: ${alert.action} | Timeframe: ${alert.timeframe}`);
    });
    context.push('');
  }
  
  // Asset category breakdown
  context.push(`📋 BY ASSET CATEGORY:`);
  context.push(`• Bitcoin thesis: ${alertCategories.bitcoinThesis.length} alerts`);
  context.push(`• Altcoins: ${alertCategories.altcoin.length} alerts`);
  context.push(`• Stocks/ETFs: ${alertCategories.stock.length} alerts`);
  context.push('');
  
  // Performance metrics
  if (metrics) {
    context.push(`📈 PERFORMANCE METRICS:`);
    context.push(`• Historical accuracy: ${(metrics.accuracyRate * 100).toFixed(1)}%`);
    context.push(`• Profitable alerts: ${metrics.profitableAlerts}/${metrics.totalAlerts}`);
    context.push(`• Total return tracked: ${metrics.totalReturn?.toFixed(1)}%`);
    context.push(`• Recent performance: ${performanceAnalysis.recentPerformance}`);
    context.push('');
  }
  
  // Best performing assets
  if (performanceAnalysis.bestPerformingAssets.length > 0) {
    context.push(`🏆 TOP PERFORMING SIGNALS:`);
    performanceAnalysis.bestPerformingAssets.forEach((asset: any, index: number) => {
      context.push(`${index + 1}. ${asset.asset}: ${(asset.winRate * 100).toFixed(0)}% success rate`);
    });
    context.push('');
  }
  
  // Strategic insights
  context.push(`💡 STRATEGIC INSIGHTS:`);
  context.push(`• Focus on ${alertCategories.highConfidence.length} high-confidence signals`);
  context.push(`• Monitor risk with ${opportunityAnalysis.riskLevel} volatility expected`);
  context.push(`• Use opportunity actions for detailed alert analysis`);
  context.push(`• Performance tracking: ${performanceAnalysis.reliabilityScore}/100 reliability`);
  
  return context.join('\n');
}

export default opportunityProvider; 