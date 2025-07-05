import { IAgentRuntime, Provider, elizaLogger, Memory, State } from '@elizaos/core';
import { AltcoinDataService } from '../services/AltcoinDataService';

/**
 * Altcoin Provider - Injects contextual altcoin market information
 * 
 * This dynamic provider adds altcoin context including:
 * - Curated altcoin price data and performance
 * - Top 100 altcoins vs Bitcoin performance
 * - Trending tokens from DEXScreener
 * - Top movers (gainers/losers)
 * - CoinGecko trending coins
 * 
 * Usage: Include 'altcoin' in dynamic providers when altcoin-related queries are made
 */
export const altcoinProvider: Provider = {
  name: 'altcoin',
  description: 'Provides altcoin market data, trending tokens, and performance vs Bitcoin',
  dynamic: true, // Only loads when explicitly requested
  position: 3, // After basic market data but before complex analysis
  
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    elizaLogger.debug('🪙 [AltcoinProvider] Providing altcoin market context');
    
    try {
      // Get the altcoin data service
      const altcoinService = runtime.getService('altcoin-data') as AltcoinDataService;
      if (!altcoinService) {
        elizaLogger.warn('[AltcoinProvider] AltcoinDataService not available');
        return {
          text: 'Altcoin market data temporarily unavailable.',
          values: {
            altcoinDataAvailable: false,
            error: 'Service not found'
          },
        };
      }

      // Get comprehensive altcoin data
      const curatedAltcoins = altcoinService.getCuratedAltcoinsData();
      const top100VsBtc = altcoinService.getTop100VsBtcData();
      const dexScreener = altcoinService.getDexScreenerData();
      const topMovers = altcoinService.getTopMoversData();
      const trending = altcoinService.getTrendingCoinsData();
      
      // Check if we have any data
      const hasData = curatedAltcoins || top100VsBtc || dexScreener || topMovers || trending;
      
      if (!hasData) {
        elizaLogger.debug('[AltcoinProvider] No altcoin data available yet');
        return {
          text: 'Altcoin data is being updated. Please try again in a few moments.',
          values: {
            altcoinDataAvailable: false,
            updating: true
          },
        };
      }

      // Determine market conditions
      const marketConditions = analyzeAltcoinMarketConditions(top100VsBtc, topMovers);
      
      // Find standout performers
      const standoutPerformers = findStandoutPerformers(curatedAltcoins, topMovers, trending);
      
      // Analyze DEX trends
      const dexTrends = analyzeDexTrends(dexScreener);
      
      // Build altcoin context
      const altcoinContext = buildAltcoinContext(
        marketConditions,
        standoutPerformers,
        dexTrends,
        top100VsBtc,
        curatedAltcoins
      );

      elizaLogger.debug(`[AltcoinProvider] Providing context for ${Object.keys(curatedAltcoins || {}).length} curated altcoins`);
      
      return {
        text: altcoinContext,
        values: {
          altcoinDataAvailable: true,
          curatedAltcoinsCount: Object.keys(curatedAltcoins || {}).length,
          outperformingBtcCount: top100VsBtc?.outperformingCount || 0,
          underperformingBtcCount: top100VsBtc?.underperformingCount || 0,
          topGainersCount: topMovers?.topGainers?.length || 0,
          topLosersCount: topMovers?.topLosers?.length || 0,
          trendingCount: trending?.coins?.length || 0,
          dexTrendingCount: dexScreener?.trendingTokens?.length || 0,
          isAltSeason: marketConditions.isAltSeason,
          marketSentiment: marketConditions.sentiment,
          dominantChain: dexTrends.dominantChain,
          avgAltcoinPerformance: marketConditions.avgPerformance,
          // Include data for actions to access
          curatedAltcoins: curatedAltcoins,
          top100VsBtc: top100VsBtc,
          dexScreener: dexScreener,
          topMovers: topMovers,
          trending: trending,
          standoutPerformers: standoutPerformers,
          dexTrends: dexTrends
        },
      };
      
    } catch (error) {
      elizaLogger.error('[AltcoinProvider] Error providing altcoin context:', error);
      return {
        text: 'Altcoin market services encountered an error. Please try again later.',
        values: {
          altcoinDataAvailable: false,
          error: error.message
        },
      };
    }
  }
};

/**
 * Helper function to analyze altcoin market conditions
 */
function analyzeAltcoinMarketConditions(top100VsBtc: any, topMovers: any): any {
  let isAltSeason = false;
  let sentiment = 'neutral';
  let avgPerformance = 0;
  
  if (top100VsBtc) {
    const outperformingRatio = top100VsBtc.outperformingCount / top100VsBtc.totalCoins;
    avgPerformance = top100VsBtc.averagePerformance || 0;
    
    // Consider it alt season if >60% of top 100 are outperforming Bitcoin
    isAltSeason = outperformingRatio > 0.6;
    
    // Determine sentiment based on average performance and ratio
    if (outperformingRatio > 0.7 && avgPerformance > 5) {
      sentiment = 'very bullish';
    } else if (outperformingRatio > 0.5 && avgPerformance > 0) {
      sentiment = 'bullish';
    } else if (outperformingRatio < 0.3 || avgPerformance < -5) {
      sentiment = 'bearish';
    }
  }
  
  return {
    isAltSeason,
    sentiment,
    avgPerformance: Math.round(avgPerformance * 100) / 100
  };
}

/**
 * Helper function to find standout performers
 */
function findStandoutPerformers(curated: any, topMovers: any, trending: any): any {
  const performers = {
    topGainers: [],
    topLosers: [],
    trendingStandouts: [],
    curatedStandouts: []
  };
  
  // Extract top gainers/losers
  if (topMovers) {
    performers.topGainers = topMovers.topGainers?.slice(0, 3) || [];
    performers.topLosers = topMovers.topLosers?.slice(0, 3) || [];
  }
  
  // Find trending standouts (high score)
  if (trending?.coins) {
    performers.trendingStandouts = trending.coins
      .filter(coin => coin.score > 2)
      .slice(0, 3);
  }
  
  // Find curated standouts (significant moves)
  if (curated) {
    performers.curatedStandouts = Object.entries(curated)
      .filter(([_, data]: [string, any]) => Math.abs(data.change24h) > 10)
      .map(([coinId, data]: [string, any]) => ({ coinId, ...data }))
      .sort((a: any, b: any) => Math.abs(b.change24h) - Math.abs(a.change24h))
      .slice(0, 3);
  }
  
  return performers;
}

/**
 * Helper function to analyze DEX trends
 */
function analyzeDexTrends(dexScreener: any): any {
  const trends = {
    dominantChain: 'unknown',
    topTrending: [],
    highLiquidity: [],
    newListings: []
  };
  
  if (dexScreener?.trendingTokens) {
    // Count chains to find dominant
    const chainCounts = dexScreener.trendingTokens.reduce((acc: any, token: any) => {
      acc[token.chainId] = (acc[token.chainId] || 0) + 1;
      return acc;
    }, {});
    
    trends.dominantChain = Object.entries(chainCounts)
      .sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || 'unknown';
    
    // Find high liquidity tokens (>$100k)
    trends.highLiquidity = dexScreener.trendingTokens
      .filter((token: any) => token.totalLiquidity > 100000)
      .slice(0, 5);
    
    // Top trending by pools count
    trends.topTrending = dexScreener.trendingTokens
      .filter((token: any) => token.poolsCount > 0)
      .sort((a: any, b: any) => b.poolsCount - a.poolsCount)
      .slice(0, 5);
  }
  
  return trends;
}

/**
 * Helper function to build altcoin context
 */
function buildAltcoinContext(
  marketConditions: any,
  standoutPerformers: any,
  dexTrends: any,
  top100VsBtc: any,
  curatedAltcoins: any
): string {
  const context = [];
  
  // Market overview
  context.push(`🪙 ALTCOIN MARKET CONTEXT`);
  context.push(`📊 Market sentiment: ${marketConditions.sentiment}`);
  context.push(`🌟 Alt season status: ${marketConditions.isAltSeason ? 'ACTIVE' : 'INACTIVE'}`);
  context.push('');
  
  // Bitcoin vs altcoins performance
  if (top100VsBtc) {
    context.push(`⚡ TOP 100 vs BITCOIN:`);
    context.push(`• Outperforming BTC: ${top100VsBtc.outperformingCount}/${top100VsBtc.totalCoins} (${Math.round(top100VsBtc.outperformingCount/top100VsBtc.totalCoins*100)}%)`);
    context.push(`• Average performance: ${marketConditions.avgPerformance > 0 ? '+' : ''}${marketConditions.avgPerformance}%`);
    context.push('');
  }
  
  // Standout performers
  if (standoutPerformers.topGainers.length > 0) {
    context.push(`🚀 TOP GAINERS:`);
    standoutPerformers.topGainers.forEach((coin: any, index: number) => {
      context.push(`${index + 1}. ${coin.symbol}: +${coin.price_change_percentage_24h.toFixed(2)}%`);
    });
    context.push('');
  }
  
  if (standoutPerformers.topLosers.length > 0) {
    context.push(`📉 TOP LOSERS:`);
    standoutPerformers.topLosers.forEach((coin: any, index: number) => {
      context.push(`${index + 1}. ${coin.symbol}: ${coin.price_change_percentage_24h.toFixed(2)}%`);
    });
    context.push('');
  }
  
  // DEX trends
  if (dexTrends.dominantChain !== 'unknown') {
    context.push(`🔥 DEX TRENDS:`);
    context.push(`• Dominant chain: ${dexTrends.dominantChain}`);
    context.push(`• High liquidity tokens: ${dexTrends.highLiquidity.length}`);
    context.push(`• Trending tokens tracked: ${dexTrends.topTrending.length}`);
    context.push('');
  }
  
  // Curated altcoins status
  if (curatedAltcoins) {
    const curatedCount = Object.keys(curatedAltcoins).length;
    context.push(`📋 CURATED ALTCOINS:`);
    context.push(`• Tracking ${curatedCount} curated projects`);
    context.push(`• Significant movers: ${standoutPerformers.curatedStandouts.length}`);
    context.push('');
  }
  
  // Trading insights
  context.push(`💡 INSIGHTS:`);
  context.push(`• Use altcoin actions for detailed analysis`);
  context.push(`• DEX data updated every 5 minutes`);
  context.push(`• Performance relative to Bitcoin is key metric`);
  
  return context.join('\n');
}

export default altcoinProvider; 