import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';
import { createActionTemplate, ValidationPatterns, ResponseCreators } from './base/ActionTemplate';
import { KnowledgeDigestService } from '../services/KnowledgeDigestService';
import { SchedulerService } from '../services/SchedulerService';

export const knowledgeDigestAction: Action = createActionTemplate({
  name: 'KNOWLEDGE_DIGEST',
  description: 'Generate comprehensive knowledge digest summarizing recent research insights, predictions, and performance metrics from curated sources',
  similes: ['RESEARCH_DIGEST', 'DAILY_DIGEST', 'KNOWLEDGE_SUMMARY', 'INSIGHTS_DIGEST', 'INTELLIGENCE_SUMMARY'],
  
  examples: [
    [
      {
        name: '{{user}}',
        content: { text: 'Generate a knowledge digest' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Knowledge Digest: 8 new insights analyzed. Bitcoin institutional adoption accelerating - 3 major corps considering treasury strategies. Altcoin momentum building in DeFi sector. 4 predictions tracking positive. Performance: BTC thesis validation +12% vs initial models.',
          thought: 'User is requesting a knowledge digest. I need to synthesize recent research insights, track prediction accuracy, and provide a comprehensive intelligence summary covering market developments, institutional adoption trends, and performance metrics from our research sources.',
          actions: ['KNOWLEDGE_DIGEST'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Show me today\'s research summary' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Research Summary: 5 insights processed. Key themes: MetaPlanet strategy validation, MSTY yield optimization at 18.5%, traditional finance DeFi integration signals strengthening. 3 predictions updated - 2 on track, 1 accelerating. Truth verified through multi-source analysis.',
          thought: 'User wants today\'s research summary. I should provide a focused digest of the most recent insights, highlighting key themes, prediction updates, and validation of our analytical models from the research channels.',
          actions: ['KNOWLEDGE_DIGEST'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'What have we learned recently?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Recent Intelligence: 6 key insights extracted. Institutional Bitcoin adoption accelerating - BlackRock flows +$2.1B this week. Market cycle positioning suggests early accumulation phase. Alternative asset correlations decreasing. Knowledge patterns documented and archived.',
          thought: 'User is asking about recent learnings. I need to synthesize the most important insights from our research sources, focusing on institutional flows, market positioning, and correlation analysis to provide actionable intelligence.',
          actions: ['KNOWLEDGE_DIGEST'],
        },
      },
    ],
  ],
  
  validateFn: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    return ValidationPatterns.isKnowledgeDigestRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info('Knowledge digest action triggered');
    
    // Initial thought process
    const thoughtProcess = 'User is requesting a knowledge digest. I need to synthesize recent research insights, track prediction accuracy, analyze performance metrics, and provide comprehensive intelligence from our curated sources including research channels, market data, and institutional signals.';
    
    try {
      let digestIntelligence;
      
      // Try to get the scheduler service first for manual trigger
      const schedulerService = runtime.getService('scheduler') as unknown as SchedulerService;
      
      if (schedulerService) {
        // Use scheduler service to trigger manual digest
        digestIntelligence = await schedulerService.triggerManualDigest();
      } else {
        // Fallback to direct digest service
        const digestService = runtime.getService('knowledge-digest') as KnowledgeDigestService;
        
        if (!digestService) {
          logger.warn('Knowledge digest service not available');
          
          const fallbackResponse = ResponseCreators.createErrorResponse(
            'KNOWLEDGE_DIGEST',
            'Knowledge digest service unavailable',
            'Knowledge digest service temporarily unavailable. The proactive intelligence system may still be initializing. Research monitoring continues in background.'
          );
          
          if (callback) {
            await callback(fallbackResponse);
          }
          return false;
        }
        
        // Generate digest directly
        const digest = await digestService.generateDailyDigest();
        digestIntelligence = await digestService.formatDigestForDelivery(digest);
      }
      
      if (!digestIntelligence) {
        logger.warn('Insufficient content for digest generation');
        
        const noContentResponse = ResponseCreators.createErrorResponse(
          'KNOWLEDGE_DIGEST',
          'Insufficient content available',
          'Insufficient content available for digest generation. The system needs more research data to analyze patterns and generate insights. Research monitoring active.'
        );
        
        if (callback) {
          await callback(noContentResponse);
        }
        return false;
      }
      
      // Format the digest for delivery
      const formattedDigest = formatDigestForDelivery(digestIntelligence);
      
      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        formattedDigest,
        'KNOWLEDGE_DIGEST',
        {
          briefingId: digestIntelligence.briefingId,
          generatedAt: digestIntelligence.date.toISOString(),
          insights: digestIntelligence.content.knowledgeDigest.newInsights,
          watchlist: digestIntelligence.content.opportunities?.watchlist || [],
          performance: digestIntelligence.content.knowledgeDigest.performanceReport
        }
      );
      
      if (callback) {
        await callback(response);
      }
      
      logger.info('Knowledge digest delivered successfully');
      return true;
      
    } catch (error) {
      logger.error('Failed to generate knowledge digest:', (error as Error).message);
      
      // Enhanced error handling with context-specific responses
      let errorMessage = 'Knowledge synthesis systems operational. Research monitoring continues. Intelligence processing may be delayed.';
      
      const errorMsg = (error as Error).message.toLowerCase();
      if (errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('too many requests')) {
        errorMessage = 'Research data rate limited. Knowledge synthesis paused temporarily. Intelligence gathering continues at reduced frequency.';
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('fetch')) {
        errorMessage = 'Research source connectivity issues. Knowledge synthesis temporarily impaired. Local intelligence cache operational.';
      } else if (errorMsg.includes('service') || errorMsg.includes('unavailable')) {
        errorMessage = 'Knowledge processing service temporarily down. Research monitoring continues. Intelligence backlog being processed.';
      }
      
      const errorResponse = ResponseCreators.createErrorResponse(
        'KNOWLEDGE_DIGEST',
        (error as Error).message,
        errorMessage
      );
      
      if (callback) {
        await callback(errorResponse);
      }
      
      return false;
    }
  },
});

/**
 * Format digest intelligence for conversational delivery
 */
function formatDigestForDelivery(digestIntelligence: any): string {
  const content = digestIntelligence.content;
  
  // Start with digest summary
  const insightsCount = content.knowledgeDigest.newInsights.length;
  const predictionsCount = content.knowledgeDigest.predictionUpdates.length;
  const performanceCount = content.knowledgeDigest.performanceReport.length;
  
  let response = `Knowledge Digest: ${insightsCount} insights analyzed.`;
  
  // Add key findings
  if (content.knowledgeDigest.newInsights.length > 0) {
    const topInsights = content.knowledgeDigest.newInsights.slice(0, 2);
    response += ` Key findings: ${topInsights.join(', ')}.`;
  }
  
  // Add prediction updates
  if (predictionsCount > 0) {
    response += ` ${predictionsCount} predictions tracked.`;
  }
  
  // Add performance notes
  if (content.knowledgeDigest.performanceReport.length > 0) {
    const performanceNote = content.knowledgeDigest.performanceReport[0];
    response += ` Performance: ${performanceNote}.`;
  }
  
  // Add watchlist updates if available
  if (content.opportunities?.watchlist?.length > 0) {
    const watchlistItem = content.opportunities.watchlist[0];
    response += ` Watchlist: ${watchlistItem}.`;
  }
  
  // Add closing note
  response += ' Intelligence synthesis complete.';
  
  return response;
}

export default knowledgeDigestAction; 