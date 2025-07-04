import { Action, IAgentRuntime, Memory, State, HandlerCallback, logger } from '@elizaos/core';
import { RealTimeDataService, TopMoversData, TopMoverCoin } from '../services/RealTimeDataService';

export interface TopMoversParams {
  force?: boolean;
  type?: 'gainers' | 'losers' | 'both';
  limit?: number;
}

export const topMoversAction: Action = {
  name: 'TOP_MOVERS_ACTION',
  description: 'Displays top gaining and losing cryptocurrencies from the top 100 by market cap over 24 hours',
  
  similes: [
    'top gainers',
    'top losers',
    'biggest movers',
    'market winners',
    'market losers',
    'daily gainers',
    'daily losers',
    'crypto winners',
    'crypto losers',
    'best performers',
    'worst performers',
    'pumping coins',
    'dumping coins',
    'green coins',
    'red coins',
    'market movers'
  ],

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'Show me the top gainers today'
        }
      },
      {
        name: 'Satoshi',
        content: {
          text: '🚀 **Top Gainers (24h)**: RNDR (+34.2%), AVAX (+28.1%), LINK (+19.6%), UNI (+15.3%). DeFi rotation happening while Bitcoin consolidates. Remember - today\'s pumps are tomorrow\'s dumps. Risk accordingly.',
          actions: ['TOP_MOVERS_ACTION']
        }
      }
    ],
    [
      {
        name: '{{user}}',
        content: {
          text: 'What are the biggest losers in crypto today?'
        }
      },
      {
        name: 'Satoshi',
        content: {
          text: '📉 **Top Losers (24h)**: XRP (-18.4%), ADA (-15.2%), DOGE (-12.7%), SHIB (-11.9%). Alt purge continues. Bitcoin still the king. These dips are either opportunities or falling knives.',
          actions: ['TOP_MOVERS_ACTION']
        }
      }
    ],
    [
      {
        name: '{{user}}',
        content: {
          text: 'Show me today\'s biggest crypto movers'
        }
      },
      {
        name: 'Satoshi',
        content: {
          text: '📊 **Market Movers (24h)** 📈 Gainers: SOL (+22.1%), MATIC (+18.8%) | 📉 Losers: DOT (-14.5%), ATOM (-12.3%). Rotation from old Layer 1s to Solana ecosystem. Follow the money.',
          actions: ['TOP_MOVERS_ACTION']
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
      logger.info('Top Movers Action triggered');
      
      const realTimeDataService = runtime.getService<RealTimeDataService>('real-time-data');
      if (!realTimeDataService) {
        logger.error('RealTimeDataService not found');
        if (callback) {
          callback({
            text: 'Market data service unavailable. Cannot retrieve top movers data.',
            action: 'TOP_MOVERS_ACTION',
            error: 'Service unavailable'
          });
        }
        return false;
      }

      // Parse parameters
      const params = options as TopMoversParams;
      const force = params.force || false;
      const type = params.type || 'both';
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
        logger.error('Failed to retrieve top movers data');
        if (callback) {
          callback({
            text: 'Unable to retrieve top movers data at this time. Market data might be delayed.',
            action: 'TOP_MOVERS_ACTION',
            error: 'Data unavailable'
          });
        }
        return false;
      }

      // Format coin display
      const formatCoin = (coin: TopMoverCoin): string => {
        const change = coin.price_change_percentage_24h;
        const sign = change > 0 ? '+' : '';
        return `${coin.symbol.toUpperCase()} (${sign}${change.toFixed(1)}%)`;
      };

      // Generate response based on type requested
      let responseText = '';
      
      if (type === 'gainers' || type === 'both') {
        const { topGainers } = topMoversData;
        if (topGainers.length === 0) {
          responseText += '🚨 **No significant gainers** in top 100 crypto today. Market bleeding or data lag.\n\n';
        } else {
          const gainersText = topGainers.slice(0, limit).map(formatCoin).join(', ');
          responseText += `🚀 **Top Gainers (24h)**: ${gainersText}.\n\n`;
        }
      }
      
      if (type === 'losers' || type === 'both') {
        const { topLosers } = topMoversData;
        if (topLosers.length === 0) {
          responseText += '🎯 **No significant losers** in top 100 crypto today. Everything pumping or data lag.\n\n';
        } else {
          const losersText = topLosers.slice(0, limit).map(formatCoin).join(', ');
          responseText += `📉 **Top Losers (24h)**: ${losersText}.\n\n`;
        }
      }

      // Add Satoshi's market analysis
      const { topGainers, topLosers } = topMoversData;
      const avgGainerChange = topGainers.length > 0 
        ? topGainers.reduce((sum, coin) => sum + coin.price_change_percentage_24h, 0) / topGainers.length 
        : 0;
      const avgLoserChange = topLosers.length > 0 
        ? topLosers.reduce((sum, coin) => sum + coin.price_change_percentage_24h, 0) / topLosers.length 
        : 0;

      // Market sentiment analysis
      if (avgGainerChange > 20 && Math.abs(avgLoserChange) < 10) {
        responseText += '💡 **Alt season building momentum. Money rotating from Bitcoin to alts.**';
      } else if (Math.abs(avgLoserChange) > 15 && avgGainerChange < 10) {
        responseText += '❄️ **Crypto winter vibes. Bitcoin dominance rising, alts bleeding.**';
      } else if (avgGainerChange > 15 && Math.abs(avgLoserChange) > 15) {
        responseText += '🎲 **High volatility. Big moves both ways. Degen casino in full swing.**';
      } else {
        responseText += '📊 **Normal market movement. Look for quality setups, not FOMO plays.**';
      }

      responseText += `\n\n*Data updated: ${topMoversData.lastUpdated.toLocaleTimeString()}*`;

      if (callback) {
        callback({
          text: responseText,
          action: 'TOP_MOVERS_ACTION',
          data: {
            topGainers: topGainers.slice(0, limit),
            topLosers: topLosers.slice(0, limit),
            avgGainerChange,
            avgLoserChange,
            lastUpdated: topMoversData.lastUpdated
          }
        });
      }

      return true;

    } catch (error) {
      logger.error('Error in topMoversAction:', error);
      if (callback) {
        callback({
          text: 'Error retrieving top movers data. CoinGecko might be rate limiting us.',
          action: 'TOP_MOVERS_ACTION',
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
      'top gainers',
      'top losers',
      'biggest movers',
      'market winners',
      'market losers',
      'daily gainers',
      'daily losers',
      'crypto winners',
      'crypto losers',
      'best performers',
      'worst performers',
      'pumping coins',
      'dumping coins',
      'green coins',
      'red coins',
      'market movers'
    ];
    
    return triggers.some(trigger => text.includes(trigger));
  }
}; 