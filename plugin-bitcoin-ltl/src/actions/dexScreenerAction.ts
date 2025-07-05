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
import { RealTimeDataService, DexScreenerData, TrendingToken } from '../services/RealTimeDataService';

export interface DexScreenerParams {
  force?: boolean;
  type?: 'trending' | 'top' | 'both';
  limit?: number;
}

export const dexScreenerAction: Action = createActionTemplate({
  name: 'DEX_SCREENER_ACTION',
  description: 'Comprehensive analysis of trending and top tokens from DEXScreener with liquidity analysis for Solana gems and memecoin radar',
  similes: ['trending tokens', 'dex screener', 'dexscreener', 'top tokens', 'solana gems', 'new tokens', 'boosted tokens', 'trending solana', 'dex trends', 'token discovery', 'memecoin radar', 'solana trending', 'hot tokens', 'liquid tokens', 'token screener'],
  
  examples: [
    [
      {
        name: '{{user}}',
        content: { text: 'What are the trending tokens on DEXScreener?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: '🔥 Trending Solana gems: BONK ($0.000032, $1.2M liq), WIF ($2.14, $890K liq), MYRO ($0.089, $650K liq). 9 tokens meet liquidity thresholds (>$100K liq, >$20K vol). Liquidity ratios looking healthy. Remember - DEX trends often precede centralized exchange pumps. Risk accordingly.',
          thought: 'User wants current DEXScreener trending data. I need to analyze trending tokens, filter by liquidity thresholds, assess market quality, and provide perspective on these speculative plays versus Bitcoin.',
          actions: ['DEX_SCREENER_ACTION'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Show me Solana gems with high liquidity' },
      },
      {
        name: 'Satoshi',
        content: {
          text: '💎 High liquidity Solana tokens: 12 tokens meet criteria (>$100K liq, >$20K vol). Top picks: JUPITER ($0.64, $2.1M liq, 0.43 ratio), ORCA ($3.87, $1.8M liq, 0.38 ratio). DEX liquidity = actual tradability. Most boosted tokens are exit liquidity for degens.',
          thought: 'User seeking high-liquidity Solana tokens. I should filter by strict liquidity criteria, highlight the most tradeable options, and remind about the speculative nature of most DEX tokens.',
          actions: ['DEX_SCREENER_ACTION'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Any new memecoin trends on Solana?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: '🎲 Memecoin casino update: 47 boosted tokens, 9 meet liquidity thresholds. Trending: PEPE variants pumping, dog-themed tokens cooling. Volume concentrated in top 3. Most are exit liquidity for degens. Solana casino quiet or Bitcoin dominance continues.',
          thought: 'User asking about memecoin trends on Solana. I need to assess the current memecoin landscape, identify trending themes, and provide realistic perspective on the speculative nature of these tokens.',
          actions: ['DEX_SCREENER_ACTION'],
        },
      },
    ],
  ],
  
  validateFn: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    return ValidationPatterns.isDexScreenerRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info('DEXScreener action triggered');
    
    const thoughtProcess = 'User is requesting DEXScreener analysis. I need to analyze trending tokens, assess liquidity quality, identify Solana gems, and provide perspective on these speculative plays versus sound money principles.';
    
    try {
      const realTimeDataService = runtime.getService('real-time-data') as RealTimeDataService;
      if (!realTimeDataService) {
        logger.warn('RealTimeDataService not available for DEXScreener');
        
        const fallbackResponse = ResponseCreators.createErrorResponse(
          'DEX_SCREENER_ACTION',
          'Market data service unavailable',
          'Market data service unavailable. Cannot retrieve DEXScreener data. The degen casino operates independently of our monitoring systems.'
        );
        
        if (callback) {
          await callback(fallbackResponse);
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
          dexData = await realTimeDataService.forceDexScreenerUpdate();
        }
      }

      if (!dexData) {
        logger.warn('Failed to retrieve DEXScreener data');
        
        const noDataResponse = ResponseCreators.createErrorResponse(
          'DEX_SCREENER_ACTION',
          'DEXScreener data unavailable',
          'Unable to retrieve DEXScreener data at this time. The degen casino is temporarily offline.'
        );
        
        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Analyze trending tokens
      const { trendingTokens, topTokens } = dexData;
      const analysisResult = analyzeDexData(trendingTokens, topTokens, type, limit);
      
      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        analysisResult.responseText,
        'DEX_SCREENER_ACTION',
        {
          trendingCount: trendingTokens.length,
          topTokensCount: topTokens.length,
          avgLiquidity: analysisResult.avgLiquidity,
          avgVolume: analysisResult.avgVolume,
          topTrending: analysisResult.topTrending,
          lastUpdated: dexData.lastUpdated
        }
      );

      if (callback) {
        await callback(response);
      }

      logger.info('DEXScreener analysis delivered successfully');
      return true;

    } catch (error) {
      logger.error('Failed to analyze DEXScreener data:', (error as Error).message);
      
      const errorResponse = ResponseCreators.createErrorResponse(
        'DEX_SCREENER_ACTION',
        (error as Error).message,
        'Error retrieving DEXScreener data. The degen casino servers might be down.'
      );
      
      if (callback) {
        await callback(errorResponse);
      }
      
      return false;
    }
  },
});

/**
 * Analyze DEXScreener data and generate response
 */
function analyzeDexData(
  trendingTokens: TrendingToken[],
  topTokens: any[],
  type: string,
  limit: number
): {
  responseText: string;
  avgLiquidity: number;
  avgVolume: number;
  topTrending: TrendingToken[];
} {
  const avgLiquidity = trendingTokens.length > 0 
    ? trendingTokens.reduce((sum, t) => sum + t.totalLiquidity, 0) / trendingTokens.length 
    : 0;
  const avgVolume = trendingTokens.length > 0 
    ? trendingTokens.reduce((sum, t) => sum + t.totalVolume, 0) / trendingTokens.length 
    : 0;

  let responseText = '';
  
  if (type === 'trending' || type === 'both') {
    if (trendingTokens.length === 0) {
      responseText += '🚨 No trending Solana tokens meet liquidity thresholds (>$100K liq, >$20K vol). Market cooling or DEX data lag. ';
    } else {
      const topTrending = trendingTokens.slice(0, limit);
      const trendingText = topTrending.map(token => {
        const price = token.priceUsd ? `$${token.priceUsd.toFixed(6)}` : 'N/A';
        const liquidity = `$${(token.totalLiquidity / 1000).toFixed(0)}K`;
        const ratio = token.liquidityRatio ? token.liquidityRatio.toFixed(2) : 'N/A';
        return `${token.symbol || token.name} (${price}, ${liquidity} liq, ${ratio} ratio)`;
      }).join(', ');
      
      responseText += `🔥 Trending Solana gems: ${trendingText}. `;
    }
  }
  
  if (type === 'top' || type === 'both') {
    const topCount = Math.min(topTokens.length, 10);
    responseText += `${topCount} boosted tokens, ${trendingTokens.length} meet criteria. `;
    responseText += `Avg liquidity: $${(avgLiquidity / 1000).toFixed(0)}K, Volume: $${(avgVolume / 1000).toFixed(0)}K. `;
  }

  // Add Satoshi's analysis
  if (trendingTokens.length > 5) {
    responseText += 'High liquidity = actual tradability. Most boosted tokens are exit liquidity for degens.';
  } else if (trendingTokens.length > 0) {
    responseText += 'Limited selection meeting thresholds. Quality over quantity in this market.';
  } else {
    responseText += 'Solana casino quiet. Bitcoin dominance continues or DEX data lag.';
  }

  return {
    responseText,
    avgLiquidity,
    avgVolume,
    topTrending: trendingTokens.slice(0, limit)
  };
} 