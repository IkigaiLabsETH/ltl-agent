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
import { RealTimeDataService, TopMoversData, TopMoverCoin } from '../services/RealTimeDataService';

export interface TopMoversParams {
  force?: boolean;
  type?: 'gainers' | 'losers' | 'both';
  limit?: number;
}

export const topMoversAction: Action = createActionTemplate({
  name: 'TOP_MOVERS_ACTION',
  description: 'Comprehensive analysis of top gaining and losing cryptocurrencies from the top 100 by market cap over 24 hours with sentiment analysis',
  similes: ['TOP_GAINERS', 'TOP_LOSERS', 'MARKET_MOVERS', 'BIGGEST_MOVERS', 'CRYPTO_WINNERS'],
  
  examples: [
    [
      {
        name: '{{user}}',
        content: { text: 'Show me the top gainers today' },
      },
      {
        name: 'Satoshi',
        content: {
          text: '🚀 Top Gainers (24h): RNDR (+34.2%), AVAX (+28.1%), LINK (+19.6%), UNI (+15.3%). DeFi rotation happening while Bitcoin consolidates. Alt season building momentum. Remember - today\'s pumps are tomorrow\'s dumps. Risk accordingly.',
          thought: 'User wants to see top gainers. I need to analyze the strongest performers from the top 100 crypto by market cap, identify rotation patterns, and provide market sentiment analysis while warning about volatility risks.',
          actions: ['TOP_MOVERS_ACTION'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'What are the biggest losers in crypto today?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: '📉 Top Losers (24h): XRP (-18.4%), ADA (-15.2%), DOGE (-12.7%), SHIB (-11.9%). Alt purge continues. Bitcoin dominance rising. These dips are either opportunities or falling knives - depends on your conviction.',
          thought: 'User asking about biggest losers. I should analyze the worst performers, identify if it\'s a general alt purge or specific sector weakness, and provide perspective on whether these are buying opportunities or continued decline.',
          actions: ['TOP_MOVERS_ACTION'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Show me today\'s biggest crypto movers' },
      },
      {
        name: 'Satoshi',
        content: {
          text: '📊 Market Movers (24h) 📈 Gainers: SOL (+22.1%), MATIC (+18.8%) | 📉 Losers: DOT (-14.5%), ATOM (-12.3%). Rotation from old Layer 1s to Solana ecosystem. High volatility - degen casino in full swing. Follow the money.',
          thought: 'User wants comprehensive movers analysis. I should provide both gainers and losers, identify rotation patterns between different crypto sectors, and assess overall market volatility and sentiment.',
          actions: ['TOP_MOVERS_ACTION'],
        },
      },
    ],
  ],
  
  validateFn: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    return ValidationPatterns.isTopMoversRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info('Top movers action triggered');
    
    const messageText = message.content?.text?.toLowerCase() || '';
    
    // Determine query type and thought process
    let thoughtProcess = 'User is requesting top movers analysis. I need to analyze the biggest gainers and losers from the top 100 crypto by market cap, identify market rotation patterns, and provide sentiment analysis.';
    let queryType: 'gainers' | 'losers' | 'both' = 'both';
    
    if (messageText.includes('gainer') || messageText.includes('winner') || messageText.includes('pump')) {
      queryType = 'gainers';
      thoughtProcess = 'User wants to see top gainers. I should focus on the strongest performers, identify which sectors are leading, and provide context about market rotation and momentum.';
    } else if (messageText.includes('loser') || messageText.includes('dump') || messageText.includes('red')) {
      queryType = 'losers';
      thoughtProcess = 'User asking about biggest losers. I should analyze the worst performers, identify if it\'s sector-specific weakness or general market decline, and assess if these are opportunities or continued weakness.';
    }
    
    try {
      const realTimeDataService = runtime.getService<RealTimeDataService>('real-time-data');
      
      if (!realTimeDataService) {
        logger.warn('RealTimeDataService not available for top movers');
        
        const fallbackResponse = ResponseCreators.createErrorResponse(
          'TOP_MOVERS_ACTION',
          'Market data service unavailable',
          'Market data service unavailable. The casino never sleeps - price discovery continues regardless of our monitoring capabilities. Cannot retrieve top movers data.'
        );
        
        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Parse parameters
      const params = options as TopMoversParams;
      const force = params.force || false;
      const type = params.type || queryType;
      const limit = params.limit || 4;

      // Get top movers data
      let topMoversData: TopMoversData | null = null;
      
      if (force) {
        topMoversData = await realTimeDataService.forceTopMoversUpdate();
      } else {
        topMoversData = realTimeDataService.getTopMoversData();
        if (!topMoversData) {
          // Try to fetch if not cached
          topMoversData = await realTimeDataService.forceTopMoversUpdate();
        }
      }

      if (!topMoversData) {
        logger.warn('No top movers data available');
        
        const noDataResponse = ResponseCreators.createErrorResponse(
          'TOP_MOVERS_ACTION',
          'Top movers data unavailable',
          'Unable to retrieve top movers data at this time. Market data might be delayed. The degenerates continue trading regardless of our monitoring.'
        );
        
        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Generate response
      const responseText = formatTopMoversResponse(topMoversData, type, limit);
      
      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        responseText,
        'TOP_MOVERS_ACTION',
        {
          topGainers: topMoversData.topGainers.slice(0, limit),
          topLosers: topMoversData.topLosers.slice(0, limit),
          marketSentiment: analyzeMarketSentiment(topMoversData),
          lastUpdated: topMoversData.lastUpdated,
          requestType: type
        }
      );

      if (callback) {
        await callback(response);
      }

      logger.info('Top movers analysis delivered successfully');
      return true;

    } catch (error) {
      logger.error('Failed to analyze top movers:', (error as Error).message);
      
      // Enhanced error handling with context-specific responses
      let errorMessage = 'Top movers analysis systems operational. The casino continues regardless of our monitoring capabilities.';
      
      const errorMsg = (error as Error).message.toLowerCase();
      if (errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('too many requests')) {
        errorMessage = 'Market data rate limited. CoinGecko overwhelmed with degenerates. Analysis will resume shortly.';
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('fetch')) {
        errorMessage = 'Market data connectivity issues. Crypto markets pump and dump independently of our monitoring infrastructure.';
      } else if (errorMsg.includes('service') || errorMsg.includes('unavailable')) {
        errorMessage = 'Market analysis service temporarily down. Price discovery continues in the decentralized casino.';
      }
      
      const errorResponse = ResponseCreators.createErrorResponse(
        'TOP_MOVERS_ACTION',
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
 * Format coin display
 */
function formatCoin(coin: TopMoverCoin): string {
  const change = coin.price_change_percentage_24h;
  const sign = change > 0 ? '+' : '';
  return `${coin.symbol.toUpperCase()} (${sign}${change.toFixed(1)}%)`;
}

/**
 * Format top movers response based on type
 */
function formatTopMoversResponse(
  topMoversData: TopMoversData,
  type: 'gainers' | 'losers' | 'both',
  limit: number
): string {
  const { topGainers, topLosers } = topMoversData;
  let responseText = '';
  
  if (type === 'gainers' || type === 'both') {
    if (topGainers.length === 0) {
      responseText += '🚨 No significant gainers in top 100 crypto today. Market bleeding or data lag. ';
    } else {
      const gainersText = topGainers.slice(0, limit).map(formatCoin).join(', ');
      responseText += `🚀 Top Gainers (24h): ${gainersText}. `;
    }
  }
  
  if (type === 'losers' || type === 'both') {
    if (topLosers.length === 0) {
      responseText += '🎯 No significant losers in top 100 crypto today. Everything pumping or data lag. ';
    } else {
      const losersText = topLosers.slice(0, limit).map(formatCoin).join(', ');
      responseText += `📉 Top Losers (24h): ${losersText}. `;
    }
  }

  // Add market sentiment
  const sentiment = analyzeMarketSentiment(topMoversData);
  responseText += sentiment;

  return responseText;
}

/**
 * Analyze market sentiment based on top movers data
 */
function analyzeMarketSentiment(topMoversData: TopMoversData): string {
  const { topGainers, topLosers } = topMoversData;
  
  const avgGainerChange = topGainers.length > 0 
    ? topGainers.reduce((sum, coin) => sum + coin.price_change_percentage_24h, 0) / topGainers.length 
    : 0;
  const avgLoserChange = topLosers.length > 0 
    ? topLosers.reduce((sum, coin) => sum + coin.price_change_percentage_24h, 0) / topLosers.length 
    : 0;

  // Market sentiment analysis
  if (avgGainerChange > 20 && Math.abs(avgLoserChange) < 10) {
    return 'Alt season building momentum. Money rotating from Bitcoin to alts.';
  } else if (Math.abs(avgLoserChange) > 15 && avgGainerChange < 10) {
    return 'Crypto winter vibes. Bitcoin dominance rising, alts bleeding.';
  } else if (avgGainerChange > 15 && Math.abs(avgLoserChange) > 15) {
    return 'High volatility - degen casino in full swing. Big moves both ways.';
  } else {
    return 'Normal market movement. Look for quality setups, not FOMO plays.';
  }
} 