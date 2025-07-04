import { Action, IAgentRuntime, Memory, State, HandlerCallback, logger } from '@elizaos/core';
import { RealTimeDataService, DexScreenerData, TrendingToken } from '../services/RealTimeDataService';

export interface DexScreenerParams {
  force?: boolean;
  type?: 'trending' | 'top' | 'both';
  limit?: number;
}

export const dexScreenerAction: Action = {
  name: 'DEX_SCREENER_ACTION',
  description: 'Displays trending and top tokens from DEXScreener with liquidity analysis for Solana gems',
  
  similes: [
    'trending tokens',
    'dex screener',
    'dexscreener',
    'top tokens',
    'solana gems',
    'new tokens',
    'boosted tokens',
    'trending solana',
    'dex trends',
    'token discovery',
    'memecoin radar',
    'solana trending',
    'hot tokens',
    'liquid tokens',
    'token screener'
  ],

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'What are the trending tokens on DEXScreener?'
        }
      },
      {
        name: 'Satoshi',
        content: {
          text: '🔥 **Trending Solana Gems**: BONK ($0.000032, $1.2M liq), WIF ($2.14, $890K liq), MYRO ($0.089, $650K liq). Liquidity ratios looking healthy. Remember - DEX trends often precede centralized exchange pumps. Risk accordingly.',
          actions: ['DEX_SCREENER_ACTION']
        }
      }
    ],
    [
      {
        name: '{{user}}',
        content: {
          text: 'Show me Solana gems with high liquidity'
        }
      },
      {
        name: 'Satoshi',
        content: {
          text: '💎 **High Liquidity Solana Tokens**: 9 tokens meet criteria (>$100K liq, >$20K vol). Top picks: JUPITER ($0.64, $2.1M liq, 0.43 ratio), ORCA ($3.87, $1.8M liq, 0.38 ratio). DEX liquidity = actual tradability.',
          actions: ['DEX_SCREENER_ACTION']
        }
      }
    ],
    [
      {
        name: '{{user}}',
        content: {
          text: 'Any new memecoin trends on Solana?'
        }
      },
      {
        name: 'Satoshi',
        content: {
          text: '🎲 **Memecoin Casino Update**: 47 boosted tokens, 9 meet liquidity thresholds. Trending: PEPE variants pumping, dog-themed tokens cooling. Volume concentrated in top 3. Most are exit liquidity for degens.',
          actions: ['DEX_SCREENER_ACTION']
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
      logger.info('DEXScreener Action triggered');
      
      const realTimeDataService = runtime.getService<RealTimeDataService>('real-time-data');
      if (!realTimeDataService) {
        logger.error('RealTimeDataService not found');
        if (callback) {
          callback({
            text: 'Market data service unavailable. Cannot retrieve DEXScreener data.',
            action: 'DEX_SCREENER_ACTION',
            error: 'Service unavailable'
          });
        }
        return false;
      }

      // Parse parameters
      const params = options as DexScreenerParams;
      const force = params.force || false;
      const type = params.type || 'trending';
      const limit = params.limit || 5;

      // Get DEXScreener data
      let dexData: DexScreenerData | null = null;
      
      if (force) {
        dexData = await realTimeDataService.forceDexScreenerUpdate();
      } else {
        dexData = realTimeDataService.getDexScreenerData();
        if (!dexData) {
          // Try to fetch if not cached
          dexData = await realTimeDataService.forceDexScreenerUpdate();
        }
      }

      if (!dexData) {
        logger.error('Failed to retrieve DEXScreener data');
        if (callback) {
          callback({
            text: 'Unable to retrieve DEXScreener data at this time. The degen casino is temporarily offline.',
            action: 'DEX_SCREENER_ACTION',
            error: 'Data unavailable'
          });
        }
        return false;
      }

      // Analyze trending tokens
      const { trendingTokens, topTokens } = dexData;
      const avgLiquidity = trendingTokens.length > 0 
        ? trendingTokens.reduce((sum, t) => sum + t.totalLiquidity, 0) / trendingTokens.length 
        : 0;
      const avgVolume = trendingTokens.length > 0 
        ? trendingTokens.reduce((sum, t) => sum + t.totalVolume, 0) / trendingTokens.length 
        : 0;

      // Generate response based on type requested
      let responseText = '';
      
      if (type === 'trending' || type === 'both') {
        if (trendingTokens.length === 0) {
          responseText += '🚨 **No trending Solana tokens** meet liquidity thresholds (>$100K liq, >$20K vol). Market cooling or DEX data lag.\n\n';
        } else {
          const topTrending = trendingTokens.slice(0, limit);
          const trendingText = topTrending.map(token => {
            const price = token.priceUsd ? `$${token.priceUsd.toFixed(6)}` : 'N/A';
            const liquidity = `$${(token.totalLiquidity / 1000).toFixed(0)}K`;
            const ratio = token.liquidityRatio ? token.liquidityRatio.toFixed(2) : 'N/A';
            return `${token.symbol || token.name} (${price}, ${liquidity} liq, ${ratio} ratio)`;
          }).join(', ');
          
          responseText += `🔥 **Trending Solana Gems**: ${trendingText}.\n\n`;
        }
      }
      
      if (type === 'top' || type === 'both') {
        const topCount = Math.min(topTokens.length, 10);
        responseText += `📊 **Market Summary**: ${topCount} boosted tokens, ${trendingTokens.length} meet criteria. `;
        responseText += `Avg liquidity: $${(avgLiquidity / 1000).toFixed(0)}K, Volume: $${(avgVolume / 1000).toFixed(0)}K.\n\n`;
      }

      // Add Satoshi's analysis
      if (trendingTokens.length > 5) {
        responseText += '💡 **High liquidity = actual tradability. Most boosted tokens are exit liquidity for degens.**';
      } else if (trendingTokens.length > 0) {
        responseText += '⚠️ **Limited selection meeting thresholds. Quality over quantity in this market.**';
      } else {
        responseText += '❄️ **Solana casino quiet. Bitcoin dominance continues or DEX data lag.**';
      }

      responseText += `\n\n*Data updated: ${dexData.lastUpdated.toLocaleTimeString()}*`;

      if (callback) {
        callback({
          text: responseText,
          action: 'DEX_SCREENER_ACTION',
          data: {
            trendingCount: trendingTokens.length,
            topTokensCount: topTokens.length,
            avgLiquidity,
            avgVolume,
            topTrending: trendingTokens.slice(0, limit),
            lastUpdated: dexData.lastUpdated
          }
        });
      }

      return true;

    } catch (error) {
      logger.error('Error in dexScreenerAction:', error);
      if (callback) {
        callback({
          text: 'Error retrieving DEXScreener data. The degen casino servers might be down.',
          action: 'DEX_SCREENER_ACTION',
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
      'trending tokens',
      'dex screener',
      'dexscreener',
      'top tokens',
      'solana gems',
      'new tokens',
      'boosted tokens',
      'trending solana',
      'dex trends',
      'token discovery',
      'memecoin radar',
      'hot tokens',
      'liquid tokens',
      'token screener'
    ];
    
    return triggers.some(trigger => text.includes(trigger));
  }
}; 