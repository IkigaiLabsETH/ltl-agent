import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';
import { MorningBriefingService } from '../services/MorningBriefingService';
import { SlackIngestionService } from '../services/SlackIngestionService';

export const morningBriefingAction: Action = {
  name: 'MORNING_BRIEFING',
  description: 'Generate and deliver a proactive morning intelligence briefing with market data, weather, and curated insights',
  examples: [
    [
      {
        name: '{{user}}',
        content: { text: 'GM' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'GM. 07:30. Clear skies. Bitcoin at $100,500. ETH and SOL outperforming overnight. MSTR up 3.2% on correlation play. No new urgent signals from research channels. Support holding strong.',
          actions: ['MORNING_BRIEFING'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Good morning, what\'s the latest?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'GM. Market pulse: Bitcoin consolidated around $100K support. 15 altcoins outperforming BTC in 24h. New research from channels: MetaPlanet expansion analysis, Hyperliquid orderbook traction. TSLA breaking resistance at $350.',
          actions: ['MORNING_BRIEFING'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Morning briefing please' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Morning intelligence: Bitcoin thesis 10.05% progress to $1M target. Institutional flows positive. Slack digest: 12 new insights, 8 predictions tracking well. Opportunities: BTC accumulation zone, MSTY premium elevated for covered calls.',
          actions: ['MORNING_BRIEFING'],
        },
      },
    ],
  ],
  
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    
    // Trigger patterns for morning briefings
    const patterns = [
      /^gm\b/i,                           // "GM"
      /^good morning\b/i,                 // "Good morning"
      /morning.*briefing/i,               // "morning briefing"
      /^brief.*me\b/i,                   // "brief me"
      /what.*latest/i,                    // "what's the latest"
      /morning.*intel/i,                  // "morning intel"
      /daily.*update/i,                   // "daily update"
      /^status.*report/i,                 // "status report"
    ];
    
    return patterns.some(pattern => pattern.test(text));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    try {
      logger.info('Morning briefing action triggered');
      
      // Get the morning briefing service
      const briefingService = runtime.getService('morning-briefing') as MorningBriefingService;
      if (!briefingService) {
        logger.warn('MorningBriefingService not available');
        if (callback) {
          callback({
            text: 'Morning briefing service temporarily unavailable. Bitcoin fundamentals unchanged.',
            actions: ['MORNING_BRIEFING'],
          } as Content);
        }
        return false;
      }

      // Generate the morning briefing
      const briefing = await briefingService.generateOnDemandBriefing();
      
      // Format the briefing for delivery
      const briefingText = await formatBriefingForDelivery(briefing, runtime);
      
      if (callback) {
        callback({
          text: briefingText,
          actions: ['MORNING_BRIEFING'],
        } as Content);
      }
      
      logger.info('Morning briefing delivered successfully');
      return true;
      
    } catch (error) {
      logger.error('Failed to generate morning briefing:', (error as Error).message);
      
      // Fallback response
      if (callback) {
        callback({
          text: 'Systems operational. Bitcoin protocol unchanged. Market data temporarily unavailable.',
          actions: ['MORNING_BRIEFING'],
        } as Content);
      }
      
      return false;
    }
  },
};

/**
 * Format the briefing data into a conversational response
 */
async function formatBriefingForDelivery(
  briefing: any, 
  runtime: IAgentRuntime
): Promise<string> {
  const content = briefing.content;
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  // Start with GM and basic info
  let response = `GM. ${time}.`;
  
  // Add weather if available
  if (content.weather) {
    response += ` ${content.weather}.`;
  }
  
  // Add Bitcoin status
  if (content.marketPulse?.bitcoin) {
    const btc = content.marketPulse.bitcoin;
    const changeDirection = btc.change24h > 0 ? 'up' : btc.change24h < 0 ? 'down' : 'flat';
    const changeText = Math.abs(btc.change24h).toFixed(1);
    
    response += ` Bitcoin at $${btc.price.toLocaleString()}`;
    if (btc.change24h !== 0) {
      response += `, ${changeDirection} ${changeText}%`;
    }
    response += '.';
  }
  
  // Add altcoin performance
  if (content.marketPulse?.altcoins) {
    const alts = content.marketPulse.altcoins;
    if (alts.outperformers?.length > 0) {
      const topPerformers = alts.outperformers.slice(0, 3).join(', ');
      response += ` ${topPerformers} outperforming.`;
    }
  }
  
  // Add stock watchlist
  if (content.marketPulse?.stocks?.watchlist?.length > 0) {
    const stocks = content.marketPulse.stocks.watchlist;
    const positiveStocks = stocks.filter(s => s.change > 0);
    if (positiveStocks.length > 0) {
      const stockText = positiveStocks.slice(0, 2).map(s => 
        `${s.symbol} ${s.change > 0 ? '+' : ''}${s.change.toFixed(1)}%`
      ).join(', ');
      response += ` ${stockText}.`;
    }
  }
  
  // Add knowledge digest
  if (content.knowledgeDigest?.newInsights?.length > 0) {
    response += ` New research: ${content.knowledgeDigest.newInsights.slice(0, 2).join(', ')}.`;
  }
  
  // Add prediction updates
  if (content.knowledgeDigest?.predictionUpdates?.length > 0) {
    response += ` Predictions tracking: ${content.knowledgeDigest.predictionUpdates[0]}.`;
  }
  
  // Add immediate opportunities
  if (content.opportunities?.immediate?.length > 0) {
    response += ` Immediate: ${content.opportunities.immediate[0]}.`;
  }
  
  // Add upcoming opportunities
  if (content.opportunities?.upcoming?.length > 0) {
    response += ` Upcoming: ${content.opportunities.upcoming[0]}.`;
  }
  
  // Ensure response isn't too long (Satoshi keeps it concise)
  if (response.length > 400) {
    // Truncate and add ellipsis, maintaining the Satoshi voice
    response = response.substring(0, 380) + '... Protocol operational.';
  }
  
  return response;
}

/**
 * Get content summary from Slack ingestion service
 */
async function getContentSummary(runtime: IAgentRuntime): Promise<string> {
  try {
    const slackService = runtime.getService('slack-ingestion') as SlackIngestionService;
    if (!slackService) {
      return 'Content monitoring offline.';
    }
    
    const recentContent = await slackService.getRecentContent(24);
    const highImportance = recentContent.filter(item => item.metadata.importance === 'high');
    
    if (highImportance.length > 0) {
      return `${highImportance.length} high-priority insights from channels.`;
    } else if (recentContent.length > 0) {
      return `${recentContent.length} updates processed from channels.`;
    } else {
      return 'Channels quiet overnight.';
    }
  } catch (error) {
    logger.error('Failed to get content summary:', (error as Error).message);
    return 'Content monitoring degraded.';
  }
} 