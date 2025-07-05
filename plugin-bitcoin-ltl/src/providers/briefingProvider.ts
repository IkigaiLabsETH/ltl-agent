import { IAgentRuntime, Provider, elizaLogger, Memory, State } from '@elizaos/core';
import { MorningBriefingService } from '../services/MorningBriefingService';

/**
 * Briefing Provider - Injects contextual intelligence briefing information
 * 
 * This private provider adds strategic intelligence context including:
 * - Compiled morning intelligence briefings
 * - Market pulse and sentiment analysis
 * - Knowledge digest and research updates
 * - Performance tracking summaries
 * - Weather and lifestyle optimization data
 * - Strategic recommendations and catalysts
 * 
 * Usage: Must be explicitly included in private providers for strategic analysis
 */
export const briefingProvider: Provider = {
  name: 'briefing',
  description: 'Provides compiled intelligence briefings and strategic market analysis',
  private: true, // Must be explicitly included
  position: 9, // Latest in the chain for comprehensive analysis
  
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    elizaLogger.debug('📰 [BriefingProvider] Providing intelligence briefing context');
    
    try {
      // Get the morning briefing service
      const briefingService = runtime.getService('morning-briefing') as MorningBriefingService;
      if (!briefingService) {
        elizaLogger.warn('[BriefingProvider] MorningBriefingService not available');
        return {
          text: 'Intelligence briefing data temporarily unavailable.',
          values: {
            briefingDataAvailable: false,
            error: 'Service not found'
          },
        };
      }

      // Generate on-demand briefing
      const briefingData = await briefingService.generateOnDemandBriefing();
      const briefingConfig = briefingService.getConfig();
      const briefingHistory = await briefingService.getBriefingHistory();
      
      if (!briefingData) {
        elizaLogger.debug('[BriefingProvider] No briefing data available yet');
        return {
          text: 'Intelligence briefing is being compiled. Please try again in a few moments.',
          values: {
            briefingDataAvailable: false,
            updating: true
          },
        };
      }

      // Analyze briefing content
      const briefingAnalysis = analyzeBriefingContent(briefingData);
      
      // Extract key insights
      const keyInsights = extractKeyInsights(briefingData);
      
      // Analyze market conditions from briefing
      const marketConditions = analyzeMarketConditions(briefingData);
      
      // Build briefing context
      const briefingContext = buildBriefingContext(
        briefingAnalysis,
        keyInsights,
        marketConditions,
        briefingData,
        briefingConfig
      );

      elizaLogger.debug(`[BriefingProvider] Providing intelligence briefing context - Priority: ${briefingAnalysis.priorityLevel}`);
      
              return {
          text: briefingContext,
          values: {
            briefingDataAvailable: true,
            briefingDate: Date.now(),
            priorityLevel: briefingAnalysis.priorityLevel,
          keyInsightsCount: keyInsights.total,
          highPriorityInsights: keyInsights.highPriority.length,
          marketEvents: keyInsights.marketEvents.length,
          opportunities: keyInsights.opportunities.length,
          risks: keyInsights.risks.length,
          marketSentiment: marketConditions.overallSentiment,
          bitcoinThesisProgress: marketConditions.bitcoinThesisProgress,
          altcoinSentiment: marketConditions.altcoinSentiment,
          stockMarketTrend: marketConditions.stockMarketTrend,
          riskAppetite: marketConditions.riskAppetite,
          strategicFocus: briefingAnalysis.strategicFocus,
          actionableTasks: briefingAnalysis.actionableTasks,
          // Include data for actions to access
          briefingData: briefingData,
          briefingConfig: briefingConfig,
          briefingHistory: briefingHistory,
          briefingAnalysis: briefingAnalysis,
          keyInsights: keyInsights,
          marketConditions: marketConditions
        },
      };
      
    } catch (error) {
      elizaLogger.error('[BriefingProvider] Error providing briefing context:', error);
      return {
        text: 'Intelligence briefing services encountered an error. Please try again later.',
        values: {
          briefingDataAvailable: false,
          error: error.message
        },
      };
    }
  }
};

/**
 * Helper function to analyze briefing content
 */
function analyzeBriefingContent(briefingData: any): any {
  let priorityLevel = 'medium';
  let strategicFocus = 'balanced';
  let actionableTasks = 0;
  let urgencyScore = 0;
  
  if (briefingData?.analysis) {
    // Analyze content for priority signals
    const content = briefingData.analysis.text || '';
    
    // Count high-priority keywords
    const highPriorityKeywords = ['urgent', 'critical', 'immediate', 'breaking', 'significant', 'major'];
    const mediumPriorityKeywords = ['important', 'notable', 'relevant', 'opportunity', 'risk'];
    
    const highPriorityCount = highPriorityKeywords.reduce((count, keyword) => 
      count + (content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length, 0);
    
    const mediumPriorityCount = mediumPriorityKeywords.reduce((count, keyword) => 
      count + (content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length, 0);
    
    // Calculate urgency score
    urgencyScore = highPriorityCount * 3 + mediumPriorityCount * 1;
    
    // Determine priority level
    if (urgencyScore > 15 || highPriorityCount > 3) {
      priorityLevel = 'high';
    } else if (urgencyScore > 8 || highPriorityCount > 1) {
      priorityLevel = 'medium-high';
    } else if (urgencyScore < 3) {
      priorityLevel = 'low';
    }
    
    // Analyze strategic focus
    const bitcoinMentions = (content.toLowerCase().match(/bitcoin|btc/g) || []).length;
    const altcoinMentions = (content.toLowerCase().match(/altcoin|ethereum|solana/g) || []).length;
    const stockMentions = (content.toLowerCase().match(/stock|equity|s&p|nasdaq/g) || []).length;
    
    if (bitcoinMentions > altcoinMentions + stockMentions) {
      strategicFocus = 'bitcoin-focused';
    } else if (altcoinMentions > bitcoinMentions && altcoinMentions > stockMentions) {
      strategicFocus = 'altcoin-focused';
    } else if (stockMentions > bitcoinMentions && stockMentions > altcoinMentions) {
      strategicFocus = 'equity-focused';
    }
    
    // Count actionable tasks (simplified)
    actionableTasks = (content.match(/action|recommend|consider|watch|monitor/gi) || []).length;
  }
  
  return {
    priorityLevel,
    strategicFocus,
    actionableTasks,
    urgencyScore
  };
}

/**
 * Helper function to extract key insights
 */
function extractKeyInsights(briefingData: any): any {
  const insights = {
    highPriority: [],
    mediumPriority: [],
    lowPriority: [],
    marketEvents: [],
    opportunities: [],
    risks: [],
    total: 0
  };
  
  if (briefingData?.analysis) {
    const content = briefingData.analysis.text || '';
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      
      // Categorize by content type
      if (lowerLine.includes('opportunity') || lowerLine.includes('potential')) {
        insights.opportunities.push(line.trim());
      } else if (lowerLine.includes('risk') || lowerLine.includes('concern') || lowerLine.includes('warning')) {
        insights.risks.push(line.trim());
      } else if (lowerLine.includes('event') || lowerLine.includes('announcement') || lowerLine.includes('news')) {
        insights.marketEvents.push(line.trim());
      }
      
      // Categorize by priority
      if (lowerLine.includes('critical') || lowerLine.includes('urgent') || lowerLine.includes('breaking')) {
        insights.highPriority.push(line.trim());
      } else if (lowerLine.includes('important') || lowerLine.includes('significant') || lowerLine.includes('notable')) {
        insights.mediumPriority.push(line.trim());
      } else if (line.trim().length > 20) { // Substantial content
        insights.lowPriority.push(line.trim());
      }
    });
    
    insights.total = insights.highPriority.length + insights.mediumPriority.length + insights.lowPriority.length;
  }
  
  return insights;
}

/**
 * Helper function to analyze market conditions from briefing
 */
function analyzeMarketConditions(briefingData: any): any {
  let overallSentiment = 'neutral';
  let bitcoinThesisProgress = 'on-track';
  let altcoinSentiment = 'neutral';
  let stockMarketTrend = 'mixed';
  let riskAppetite = 'moderate';
  
  if (briefingData?.analysis) {
    const content = briefingData.analysis.text || '';
    const lowerContent = content.toLowerCase();
    
    // Analyze overall sentiment
    const positiveWords = ['bullish', 'positive', 'optimistic', 'strong', 'growth', 'opportunity'];
    const negativeWords = ['bearish', 'negative', 'pessimistic', 'weak', 'decline', 'risk'];
    
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (lowerContent.match(new RegExp(word, 'g')) || []).length, 0);
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (lowerContent.match(new RegExp(word, 'g')) || []).length, 0);
    
    if (positiveCount > negativeCount + 2) {
      overallSentiment = 'bullish';
    } else if (negativeCount > positiveCount + 2) {
      overallSentiment = 'bearish';
    } else if (positiveCount > negativeCount) {
      overallSentiment = 'cautiously optimistic';
    }
    
    // Bitcoin thesis progress
    if (lowerContent.includes('institutional') && lowerContent.includes('adoption')) {
      bitcoinThesisProgress = 'accelerating';
    } else if (lowerContent.includes('regulatory') && lowerContent.includes('concern')) {
      bitcoinThesisProgress = 'delayed';
    }
    
    // Altcoin sentiment
    if (lowerContent.includes('altseason') || lowerContent.includes('rotation')) {
      altcoinSentiment = 'bullish';
    } else if (lowerContent.includes('dominance') && lowerContent.includes('bitcoin')) {
      altcoinSentiment = 'bearish';
    }
    
    // Stock market trend
    if (lowerContent.includes('s&p') || lowerContent.includes('nasdaq')) {
      if (positiveCount > negativeCount) {
        stockMarketTrend = 'uptrend';
      } else {
        stockMarketTrend = 'downtrend';
      }
    }
    
    // Risk appetite
    if (lowerContent.includes('risk-on') || (lowerContent.includes('growth') && positiveCount > 3)) {
      riskAppetite = 'high';
    } else if (lowerContent.includes('risk-off') || (lowerContent.includes('safe') && negativeCount > 2)) {
      riskAppetite = 'low';
    }
  }
  
  return {
    overallSentiment,
    bitcoinThesisProgress,
    altcoinSentiment,
    stockMarketTrend,
    riskAppetite
  };
}

/**
 * Helper function to build briefing context
 */
function buildBriefingContext(
  briefingAnalysis: any,
  keyInsights: any,
  marketConditions: any,
  briefingData: any,
  briefingConfig: any
): string {
  const context = [];
  
  // Briefing overview
  context.push(`📰 INTELLIGENCE BRIEFING`);
  context.push(`🚨 Priority level: ${briefingAnalysis.priorityLevel}`);
  context.push(`🎯 Strategic focus: ${briefingAnalysis.strategicFocus}`);
  context.push(`📊 Market sentiment: ${marketConditions.overallSentiment}`);
  context.push('');
  
  // Key insights summary
  context.push(`⚡ KEY INSIGHTS (${keyInsights.total}):`);
  context.push(`• High priority: ${keyInsights.highPriority.length}`);
  context.push(`• Market events: ${keyInsights.marketEvents.length}`);
  context.push(`• Opportunities: ${keyInsights.opportunities.length}`);
  context.push(`• Risk factors: ${keyInsights.risks.length}`);
  context.push('');
  
  // High-priority insights
  if (keyInsights.highPriority.length > 0) {
    context.push(`🔥 HIGH PRIORITY ALERTS:`);
    keyInsights.highPriority.slice(0, 3).forEach((insight: string, index: number) => {
      context.push(`${index + 1}. ${insight.substring(0, 80)}${insight.length > 80 ? '...' : ''}`);
    });
    context.push('');
  }
  
  // Market conditions analysis
  context.push(`🌍 MARKET CONDITIONS:`);
  context.push(`• Bitcoin thesis: ${marketConditions.bitcoinThesisProgress}`);
  context.push(`• Altcoin sentiment: ${marketConditions.altcoinSentiment}`);
  context.push(`• Stock market: ${marketConditions.stockMarketTrend}`);
  context.push(`• Risk appetite: ${marketConditions.riskAppetite}`);
  context.push('');
  
  // Opportunities and risks
  if (keyInsights.opportunities.length > 0) {
    context.push(`💡 KEY OPPORTUNITIES:`);
    keyInsights.opportunities.slice(0, 2).forEach((opp: string, index: number) => {
      context.push(`• ${opp.substring(0, 60)}${opp.length > 60 ? '...' : ''}`);
    });
    context.push('');
  }
  
  if (keyInsights.risks.length > 0) {
    context.push(`⚠️ KEY RISKS:`);
    keyInsights.risks.slice(0, 2).forEach((risk: string, index: number) => {
      context.push(`• ${risk.substring(0, 60)}${risk.length > 60 ? '...' : ''}`);
    });
    context.push('');
  }
  
  // Strategic recommendations
  context.push(`🎯 STRATEGIC RECOMMENDATIONS:`);
  context.push(`• Actionable tasks identified: ${briefingAnalysis.actionableTasks}`);
  context.push(`• Focus area: ${briefingAnalysis.strategicFocus}`);
  context.push(`• Urgency score: ${briefingAnalysis.urgencyScore}/20`);
  context.push('');
  
  // Briefing metadata
  context.push(`📋 BRIEFING DETAILS:`);
  context.push(`• Generated: ${new Date().toLocaleString()}`);
  if (briefingConfig?.personalizations?.greetingStyle) {
    context.push(`• Style: ${briefingConfig.personalizations.greetingStyle}`);
  }
  context.push(`• Use briefing actions for detailed analysis`);
  
  return context.join('\n');
}

export default briefingProvider; 