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
import { RealTimeDataService, TrendingCoinsData, TrendingCoin } from '../services/RealTimeDataService';

export interface TrendingCoinsParams {
  force?: boolean;
  limit?: number;
}

export const trendingCoinsAction: Action = createActionTemplate({
  name: 'TRENDING_COINS_ACTION',
  description: 'Analysis of trending cryptocurrencies based on CoinGecko search activity and community interest with market sentiment assessment',
  similes: ['trending', 'trending crypto', 'trending coins', 'hot coins', 'whats trending', 'what is trending', 'popular coins', 'viral coins', 'buzz coins', 'hype coins', 'social trending', 'most searched', 'community favorites', 'trending altcoins', 'hottest coins'],
  
  examples: [
    [
      {
        name: '{{user}}',
        content: { text: 'What crypto is trending today?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: '🔥 Trending: PEPE (#47), WLD (#139), NEIRO (#78), DOGE (#8), BONK (#60). Community chasing narratives again. 3 memecoins, 2 AI tokens trending. Remember - trending means exit liquidity for early movers. Bitcoin remains the only asset with no marketing department.',
          thought: 'User wants current trending cryptocurrency data. I need to analyze trending coins, categorize them by narrative, assess market sentiment, and provide perspective on trend-following versus sound money principles.',
          actions: ['TRENDING_COINS_ACTION'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Show me the hottest coins right now' },
      },
      {
        name: 'Satoshi',
        content: {
          text: '📈 Hot coins: SOL (#5), AVAX (#12), LINK (#15), UNI (#18), ADA (#9). Layer 1 rotation happening - 4 established projects trending. DeFi summer 2.0 or dead cat bounce? Time will tell. Stick to sound money principles.',
          thought: 'User asking for hot/trending coins. I should identify the current trending tokens, categorize by sector, assess if this represents quality rotation or speculation, and maintain Bitcoin perspective.',
          actions: ['TRENDING_COINS_ACTION'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'What are people talking about in crypto?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: '💬 Trending topics: HYPE (#78), RNDR (#32), TAO (#27), FET (#42), THETA (#51). AI narrative dominating - 4 of 7 coins AI-related. Everyone wants exposure to machine intelligence revolution. Trend following is wealth following, not wealth creating.',
          thought: 'User interested in crypto conversation topics. I should analyze trending coins to identify dominant narratives, assess community sentiment, and provide perspective on trend-chasing behavior.',
          actions: ['TRENDING_COINS_ACTION'],
        },
      },
    ],
  ],
  
  validateFn: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    return ValidationPatterns.isTrendingCoinsRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info('Trending coins action triggered');
    
    const thoughtProcess = 'User is requesting trending cryptocurrency analysis. I need to analyze community search activity, categorize trending narratives, assess market sentiment, and provide perspective on trend-following versus sound money principles.';
    
    try {
      const realTimeDataService = runtime.getService('real-time-data') as RealTimeDataService;
      if (!realTimeDataService) {
        logger.warn('RealTimeDataService not available for trending coins');
        
        const fallbackResponse = ResponseCreators.createErrorResponse(
          'TRENDING_COINS_ACTION',
          'Market data service unavailable',
          'Market data service unavailable. Cannot retrieve trending coins data. Community trends operate independently of our monitoring systems.'
        );
        
        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Parse parameters
      const params = options as TrendingCoinsParams;
      const force = params.force || false;
      const limit = params.limit || 7; // CoinGecko typically returns 7 trending coins

      // Get trending coins data
      let trendingData: TrendingCoinsData | null = null;
      
      if (force) {
        trendingData = await realTimeDataService.forceTrendingCoinsUpdate();
      } else {
        trendingData = realTimeDataService.getTrendingCoinsData();
        if (!trendingData) {
          trendingData = await realTimeDataService.forceTrendingCoinsUpdate();
        }
      }

      if (!trendingData || !trendingData.coins || trendingData.coins.length === 0) {
        logger.warn('Failed to retrieve trending coins data');
        
        const noDataResponse = ResponseCreators.createErrorResponse(
          'TRENDING_COINS_ACTION',
          'Trending coins data unavailable',
          'Unable to retrieve trending coins data at this time. CoinGecko might be experiencing issues or community interest is scattered.'
        );
        
        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Analyze trending data
      const { coins } = trendingData;
      const analysisResult = analyzeTrendingCoins(coins, limit);
      
      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        analysisResult.responseText,
        'TRENDING_COINS_ACTION',
        {
          totalTrending: coins.length,
          rankedCount: analysisResult.rankedCount,
          unrankedCount: analysisResult.unrankedCount,
          memeCoinsCount: analysisResult.memeCoinsCount,
          aiCoinsCount: analysisResult.aiCoinsCount,
          narrativeFocus: analysisResult.narrativeFocus,
          lastUpdated: trendingData.lastUpdated
        }
      );

      if (callback) {
        await callback(response);
      }

      logger.info('Trending coins analysis delivered successfully');
      return true;

    } catch (error) {
      logger.error('Failed to analyze trending coins:', (error as Error).message);
      
      const errorResponse = ResponseCreators.createErrorResponse(
        'TRENDING_COINS_ACTION',
        (error as Error).message,
        'Error retrieving trending coins data. CoinGecko search trending might be rate limited or community interest is shifting rapidly.'
      );
      
      if (callback) {
        await callback(errorResponse);
      }
      
      return false;
    }
  },
});

/**
 * Analyze trending coins and generate comprehensive response
 */
function analyzeTrendingCoins(coins: TrendingCoin[], limit: number): {
  responseText: string;
  rankedCount: number;
  unrankedCount: number;
  memeCoinsCount: number;
  aiCoinsCount: number;
  narrativeFocus: string;
} {
  // Format coin display
  const formatTrendingCoin = (coin: TrendingCoin): string => {
    const rank = coin.market_cap_rank ? `#${coin.market_cap_rank}` : 'Unranked';
    return `${coin.symbol.toUpperCase()} (${rank})`;
  };

  // Categorize coins
  const rankedCoins = coins.filter(coin => coin.market_cap_rank && coin.market_cap_rank <= 100);
  const unrankedCoins = coins.filter(coin => !coin.market_cap_rank || coin.market_cap_rank > 100);
  const memeCoins = coins.filter(coin => 
    ['PEPE', 'DOGE', 'SHIB', 'BONK', 'WIF', 'FLOKI', 'NEIRO', 'MOG'].includes(coin.symbol.toUpperCase())
  );
  const aiCoins = coins.filter(coin => 
    ['TAO', 'FET', 'RNDR', 'OCEAN', 'AGIX', 'WLD', 'HYPE', 'THETA'].includes(coin.symbol.toUpperCase())
  );

  // Generate trending text
  const trendingText = coins.slice(0, limit).map(formatTrendingCoin).join(', ');
  let responseText = `🔥 Trending: ${trendingText}. `;

  // Determine narrative focus
  let narrativeFocus = 'mixed';
  if (memeCoins.length >= 3) {
    narrativeFocus = 'meme';
    responseText += `${memeCoins.length} memecoins trending. Digital casino operating at capacity. Exit liquidity being created.`;
  } else if (aiCoins.length >= 2) {
    narrativeFocus = 'ai';
    responseText += `${aiCoins.length} AI tokens trending. Machine intelligence narrative dominating. Everyone wants exposure to AI revolution.`;
  } else if (rankedCoins.length >= 5) {
    narrativeFocus = 'quality';
    responseText += `${rankedCoins.length} established projects trending. Quality rotation happening. Smart money moving.`;
  } else if (unrankedCoins.length >= 4) {
    narrativeFocus = 'speculation';
    responseText += `${unrankedCoins.length} micro-caps trending. High risk speculation running hot. Size positions accordingly.`;
  } else {
    responseText += 'Mixed trending signals. No clear narrative dominance. Stay focused on fundamentals.';
  }

  // Add Bitcoin perspective
  if (narrativeFocus === 'meme') {
    responseText += ' Remember - trending means exit liquidity for early movers. Bitcoin remains the only asset with no marketing department.';
  } else if (narrativeFocus === 'ai') {
    responseText += ' Trend following is wealth following, not wealth creating. Bitcoin needs no narrative beyond sound money.';
  } else {
    responseText += ' Community attention shifts rapidly. Bitcoin\'s fundamentals remain constant.';
  }

  return {
    responseText,
    rankedCount: rankedCoins.length,
    unrankedCount: unrankedCoins.length,
    memeCoinsCount: memeCoins.length,
    aiCoinsCount: aiCoins.length,
    narrativeFocus
  };
} 