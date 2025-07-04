import { Action, IAgentRuntime, Memory, State, HandlerCallback, logger } from '@elizaos/core';
import { RealTimeDataService, TrendingCoinsData, TrendingCoin } from '../services/RealTimeDataService';

export interface TrendingCoinsParams {
  force?: boolean;
  limit?: number;
}

export const trendingCoinsAction: Action = {
  name: 'TRENDING_COINS_ACTION',
  description: 'Displays trending cryptocurrencies based on CoinGecko search activity and community interest',
  
  similes: [
    'trending',
    'trending crypto',
    'trending coins',
    'hot coins',
    'whats trending',
    'what is trending',
    'popular coins',
    'viral coins',
    'buzz coins',
    'hype coins',
    'social trending',
    'most searched',
    'community favorites',
    'trending altcoins',
    'hottest coins'
  ],

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'What crypto is trending today?'
        }
      },
      {
        name: 'Satoshi',
        content: {
          text: '🔥 **Trending**: PEPE (#47), WLD (#139), NEIRO (#78), DOGE (#8), BONK (#60). Community chasing narratives again. Remember - trending means exit liquidity for early movers. Bitcoin remains the only asset with no marketing department.',
          actions: ['TRENDING_COINS_ACTION']
        }
      }
    ],
    [
      {
        name: '{{user}}',
        content: {
          text: 'Show me the hottest coins right now'
        }
      },
      {
        name: 'Satoshi',
        content: {
          text: '📈 **Hot Coins**: SOL (#5), AVAX (#12), LINK (#15), UNI (#18), ADA (#9). Layer 1 rotation happening. DeFi summer 2.0 or dead cat bounce? Time will tell. Stick to sound money principles.',
          actions: ['TRENDING_COINS_ACTION']
        }
      }
    ],
    [
      {
        name: '{{user}}',
        content: {
          text: 'What are people talking about in crypto?'
        }
      },
      {
        name: 'Satoshi',
        content: {
          text: '💬 **Trending Topics**: HYPE (#78), RNDR (#32), TAO (#27), FET (#42), THETA (#51). AI narrative dominating. Everyone wants exposure to the machine intelligence revolution. But remember - trend following is wealth following, not wealth creating.',
          actions: ['TRENDING_COINS_ACTION']
        }
      }
    ]
  ],

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: { [key: string]: unknown } = {},
    callback?: HandlerCallback
  ): Promise<boolean> => {
    try {
      logger.info('Trending Coins Action triggered');
      
      const realTimeDataService = runtime.getService<RealTimeDataService>('real-time-data');
      if (!realTimeDataService) {
        logger.error('RealTimeDataService not found');
        if (callback) {
          callback({
            text: 'Market data service unavailable. Cannot retrieve trending coins data.',
            action: 'TRENDING_COINS_ACTION',
            error: 'Service unavailable'
          });
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
          // Try to fetch if not cached
          trendingData = await realTimeDataService.forceTrendingCoinsUpdate();
        }
      }

      if (!trendingData || !trendingData.coins || trendingData.coins.length === 0) {
        logger.error('Failed to retrieve trending coins data');
        if (callback) {
          callback({
            text: 'Unable to retrieve trending coins data at this time. CoinGecko might be experiencing issues.',
            action: 'TRENDING_COINS_ACTION',
            error: 'Data unavailable'
          });
        }
        return false;
      }

      // Format coin display
      const formatTrendingCoin = (coin: TrendingCoin): string => {
        const rank = coin.market_cap_rank ? `#${coin.market_cap_rank}` : 'Unranked';
        return `${coin.symbol.toUpperCase()} (${rank})`;
      };

      // Generate response
      const { coins } = trendingData;
      const trendingText = coins.slice(0, limit).map(formatTrendingCoin).join(', ');
      
      let responseText = `🔥 **Trending**: ${trendingText}.`;

      // Add Satoshi's market commentary based on trending coins
      const rankedCoins = coins.filter(coin => coin.market_cap_rank && coin.market_cap_rank <= 100);
      const unrankedCoins = coins.filter(coin => !coin.market_cap_rank || coin.market_cap_rank > 100);
      const memeCoins = coins.filter(coin => 
        ['PEPE', 'DOGE', 'SHIB', 'BONK', 'WIF', 'FLOKI', 'NEIRO'].includes(coin.symbol.toUpperCase())
      );
      const aiCoins = coins.filter(coin => 
        ['TAO', 'FET', 'RNDR', 'OCEAN', 'AGIX', 'WLD'].includes(coin.symbol.toUpperCase())
      );

      responseText += '\n\n';

      if (memeCoins.length >= 3) {
        responseText += '🎪 **Meme season in full swing. Digital casino operating at capacity. Exit liquidity being created.**';
      } else if (aiCoins.length >= 2) {
        responseText += '🤖 **AI narrative dominating. Everyone wants machine intelligence exposure. But remember - trend following is wealth following.**';
      } else if (rankedCoins.length >= 5) {
        responseText += '📊 **Established projects trending. Quality rotation happening. Smart money moving.**';
      } else if (unrankedCoins.length >= 4) {
        responseText += '⚠️ **Micro-cap speculation running hot. High risk, high reward territory. Size positions accordingly.**';
      } else {
        responseText += '🧭 **Mixed trending signals. No clear narrative dominance. Stay focused on fundamentals.**';
      }

      responseText += `\n\n*Trending data updated: ${trendingData.lastUpdated.toLocaleTimeString()}*`;

      if (callback) {
        callback({
          text: responseText,
          action: 'TRENDING_COINS_ACTION',
          data: {
            coins: coins.slice(0, limit),
            rankedCount: rankedCoins.length,
            unrankedCount: unrankedCoins.length,
            memeCoinsCount: memeCoins.length,
            aiCoinsCount: aiCoins.length,
            lastUpdated: trendingData.lastUpdated
          }
        });
      }

      return true;

    } catch (error) {
      logger.error('Error in trendingCoinsAction:', error);
      if (callback) {
        callback({
          text: 'Error retrieving trending coins data. CoinGecko search trending might be rate limited.',
          action: 'TRENDING_COINS_ACTION',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return false;
    }
  },

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    
    // Check for trigger phrases
    const triggers = [
      'trending',
      'trending crypto',
      'trending coins',
      'hot coins',
      'whats trending',
      'what is trending',
      'popular coins',
      'viral coins',
      'buzz coins',
      'hype coins',
      'social trending',
      'most searched',
      'community favorites',
      'trending altcoins',
      'hottest coins'
    ];
    
    return triggers.some(trigger => text.includes(trigger));
  }
}; 