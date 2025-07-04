import { Action, IAgentRuntime, Memory, State, HandlerCallback, logger } from '@elizaos/core';
import { RealTimeDataService, Top100VsBtcData } from '../services/RealTimeDataService';

export interface Top100VsBtcParams {
  force?: boolean;
  limit?: number;
}

export const top100VsBtcAction: Action = {
  name: 'TOP_100_VS_BTC_ACTION',
  description: 'Displays top 100 altcoins performance vs Bitcoin with outperforming/underperforming analysis',
  
  similes: [
    'top 100 vs btc',
    'altcoins vs bitcoin',
    'outperforming bitcoin',
    'underperforming bitcoin',
    'bitcoin dominance',
    'altcoin performance',
    'btc pairs',
    'altseason',
    'bitcoin relative performance',
    'crypto vs bitcoin',
    'top 100 crypto',
    'altcoin rankings',
    'bitcoin vs alts',
    'outperformers',
    'underperformers'
  ],

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'Show me the top 100 altcoins vs Bitcoin performance today'
        }
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Currently 32/100 altcoins are outperforming Bitcoin. Top performers: ETH (+5.2%), SOL (+4.8%), AVAX (+3.1%). Average performance: -1.2% vs BTC. Bitcoin dominance continues as 68 coins underperform.',
          actions: ['TOP_100_VS_BTC_ACTION']
        }
      }
    ],
    [
      {
        name: '{{user}}',
        content: {
          text: 'Are we in altseason? Check altcoin performance vs Bitcoin'
        }
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Not altseason yet. Only 18/100 altcoins outperforming Bitcoin (18% vs 50%+ threshold). Bitcoin dominance strong with average -2.4% underperformance across top 100.',
          actions: ['TOP_100_VS_BTC_ACTION']
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
      logger.info('Top 100 vs BTC Action triggered');
      
      const realTimeDataService = runtime.getService<RealTimeDataService>('real-time-data');
      if (!realTimeDataService) {
        logger.error('RealTimeDataService not found');
        if (callback) {
          callback({
            text: 'Market data service unavailable. Cannot retrieve top 100 vs BTC performance.',
            action: 'TOP_100_VS_BTC_ACTION',
            error: 'Service unavailable'
          });
        }
        return false;
      }

      // Parse parameters
      const params = options as Top100VsBtcParams;
      const force = params.force || false;
      const limit = params.limit || 10;

      // Get top 100 vs BTC data
      let top100Data: Top100VsBtcData | null = null;
      
      if (force) {
        top100Data = await realTimeDataService.forceTop100VsBtcUpdate();
      } else {
        top100Data = realTimeDataService.getTop100VsBtcData();
        if (!top100Data) {
          // Try to fetch if not cached
          top100Data = await realTimeDataService.forceTop100VsBtcUpdate();
        }
      }

      if (!top100Data) {
        logger.error('Failed to retrieve top 100 vs BTC data');
        if (callback) {
          callback({
            text: 'Unable to retrieve top 100 vs Bitcoin performance data at this time.',
            action: 'TOP_100_VS_BTC_ACTION',
            error: 'Data unavailable'
          });
        }
        return false;
      }

      // Analyze market sentiment
      const outperformingPercent = (top100Data.outperformingCount / top100Data.totalCoins) * 100;
      const isAltseason = outperformingPercent > 50; // Traditional altseason threshold
      const dominanceStrength = outperformingPercent > 35 ? 'weak' : 
                              outperformingPercent > 25 ? 'moderate' : 'strong';

      // Generate analysis text
      let analysis = '';
      
      if (isAltseason) {
        analysis = `🚀 **Altseason detected!** ${top100Data.outperformingCount}/${top100Data.totalCoins} (${outperformingPercent.toFixed(1)}%) altcoins outperforming Bitcoin.`;
      } else {
        analysis = `₿ **Bitcoin dominance ${dominanceStrength}** - ${top100Data.outperformingCount}/${top100Data.totalCoins} (${outperformingPercent.toFixed(1)}%) altcoins outperforming.`;
      }

      // Top performers
      const topPerformersText = top100Data.topPerformers.slice(0, limit).map(coin => 
        `${coin.symbol.toUpperCase()} (+${coin.price_change_percentage_24h.toFixed(1)}%)`
      ).join(', ');

      // Worst performers 
      const worstPerformersText = top100Data.worstPerformers.slice(0, Math.min(5, limit)).map(coin => 
        `${coin.symbol.toUpperCase()} (${coin.price_change_percentage_24h.toFixed(1)}%)`
      ).join(', ');

      // Generate response
      const responseText = [
        analysis,
        `**Average Performance:** ${top100Data.averagePerformance.toFixed(1)}% vs BTC`,
        `**Top Performers:** ${topPerformersText}`,
        `**Worst Performers:** ${worstPerformersText}`,
        `*Data updated: ${top100Data.lastUpdated.toLocaleTimeString()}*`
      ].join('\n\n');

      if (callback) {
        callback({
          text: responseText,
          action: 'TOP_100_VS_BTC_ACTION',
          data: {
            outperformingCount: top100Data.outperformingCount,
            totalCoins: top100Data.totalCoins,
            outperformingPercent,
            isAltseason,
            dominanceStrength,
            averagePerformance: top100Data.averagePerformance,
            topPerformers: top100Data.topPerformers.slice(0, limit),
            worstPerformers: top100Data.worstPerformers.slice(0, Math.min(5, limit)),
            lastUpdated: top100Data.lastUpdated
          }
        });
      }

      return true;

    } catch (error) {
      logger.error('Error in top100VsBtcAction:', error);
      if (callback) {
        callback({
          text: 'Error retrieving top 100 vs Bitcoin performance data.',
          action: 'TOP_100_VS_BTC_ACTION',
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
      'top 100',
      'altcoins vs bitcoin',
      'outperforming bitcoin',
      'underperforming bitcoin',
      'bitcoin dominance',
      'altcoin performance',
      'btc pairs',
      'altseason',
      'bitcoin relative performance',
      'crypto vs bitcoin',
      'outperformers',
      'underperformers'
    ];
    
    return triggers.some(trigger => text.includes(trigger));
  }
}; 