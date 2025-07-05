import { IAgentRuntime, Provider, elizaLogger, Memory, State } from '@elizaos/core';
import { NFTDataService } from '../services/NFTDataService';

/**
 * NFT Provider - Injects contextual NFT market information
 * 
 * This dynamic provider adds NFT context including:
 * - Curated NFT collection floor prices and stats
 * - Generative art market analysis
 * - Collection performance and trends
 * - OpenSea marketplace data
 * - Digital art investment opportunities
 * 
 * Usage: Include 'nft' in dynamic providers when NFT-related queries are made
 */
export const nftProvider: Provider = {
  name: 'nft',
  description: 'Provides NFT collection data, floor prices, and digital art market analysis',
  dynamic: true, // Only loads when explicitly requested
  position: 4, // After market data but before complex analysis
  
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    elizaLogger.debug('🖼️ [NFTProvider] Providing NFT market context');
    
    try {
      // Get the NFT data service
      const nftService = runtime.getService('nft-data') as NFTDataService;
      if (!nftService) {
        elizaLogger.warn('[NFTProvider] NFTDataService not available');
        return {
          text: 'NFT market data temporarily unavailable.',
          values: {
            nftDataAvailable: false,
            error: 'Service not found'
          },
        };
      }

      // Get comprehensive NFT data
      const curatedNFTs = nftService.getCuratedNFTsData();
      
      if (!curatedNFTs) {
        elizaLogger.debug('[NFTProvider] No NFT data available yet');
        return {
          text: 'NFT market data is being updated. Please try again in a few moments.',
          values: {
            nftDataAvailable: false,
            updating: true
          },
        };
      }

      // Analyze NFT market conditions
      const marketAnalysis = analyzeNFTMarketConditions(curatedNFTs);
      
      // Find standout collections
      const standoutCollections = findStandoutNFTCollections(curatedNFTs);
      
      // Analyze collection trends
      const trendAnalysis = analyzeNFTTrends(curatedNFTs);
      
      // Build NFT context
      const nftContext = buildNFTContext(
        marketAnalysis,
        standoutCollections,
        trendAnalysis,
        curatedNFTs
      );

      elizaLogger.debug(`[NFTProvider] Providing context for ${curatedNFTs.collections.length} NFT collections`);
      
      return {
        text: nftContext,
        values: {
          nftDataAvailable: true,
          collectionsCount: curatedNFTs.collections.length,
          totalVolume24h: curatedNFTs.summary.totalVolume24h,
          totalMarketCap: curatedNFTs.summary.totalMarketCap,
          avgFloorPrice: curatedNFTs.summary.avgFloorPrice,
          topPerformersCount: curatedNFTs.summary.topPerformers.length,
          worstPerformersCount: curatedNFTs.summary.worstPerformers.length,
          marketSentiment: marketAnalysis.sentiment,
          trendDirection: trendAnalysis.direction,
          generativeArtFocus: trendAnalysis.generativeArtFocus,
          highValueCollections: standoutCollections.highValue.length,
          // Include data for actions to access
          collections: curatedNFTs.collections,
          summary: curatedNFTs.summary,
          marketAnalysis: marketAnalysis,
          standoutCollections: standoutCollections,
          trendAnalysis: trendAnalysis
        },
      };
      
    } catch (error) {
      elizaLogger.error('[NFTProvider] Error providing NFT context:', error);
      return {
        text: 'NFT market services encountered an error. Please try again later.',
        values: {
          nftDataAvailable: false,
          error: error.message
        },
      };
    }
  }
};

/**
 * Helper function to analyze NFT market conditions
 */
function analyzeNFTMarketConditions(nftData: any): any {
  let sentiment = 'neutral';
  let marketHealth = 'stable';
  let liquidityLevel = 'moderate';
  
  if (nftData?.summary) {
    const { totalVolume24h, avgFloorPrice, topPerformers, worstPerformers } = nftData.summary;
    
    // Determine sentiment based on performers ratio
    const performersRatio = topPerformers.length / (topPerformers.length + worstPerformers.length);
    
    if (performersRatio > 0.7) {
      sentiment = 'bullish';
      marketHealth = 'strong';
    } else if (performersRatio > 0.6) {
      sentiment = 'optimistic';
      marketHealth = 'healthy';
    } else if (performersRatio < 0.3) {
      sentiment = 'bearish';
      marketHealth = 'weak';
    } else if (performersRatio < 0.4) {
      sentiment = 'cautious';
      marketHealth = 'declining';
    }
    
    // Assess liquidity based on volume
    if (totalVolume24h > 1000) { // $1000+ daily volume
      liquidityLevel = 'high';
    } else if (totalVolume24h > 100) {
      liquidityLevel = 'moderate';
    } else {
      liquidityLevel = 'low';
    }
    
    // Adjust sentiment based on average floor price trends
    if (avgFloorPrice > 5) { // High-value floor suggests premium market
      if (sentiment === 'neutral') sentiment = 'premium-focused';
    }
  }
  
  return {
    sentiment,
    marketHealth,
    liquidityLevel,
    lastUpdated: nftData?.lastUpdated
  };
}

/**
 * Helper function to find standout NFT collections
 */
function findStandoutNFTCollections(nftData: any): any {
  const standouts = {
    highValue: [],
    highVolume: [],
    priceGainers: [],
    priceLosers: [],
    generativeArt: []
  };
  
  if (nftData?.collections) {
    // Find high-value collections (floor > 1 ETH)
    standouts.highValue = nftData.collections
      .filter((collection: any) => collection.stats?.floor_price > 1)
      .sort((a: any, b: any) => b.stats.floor_price - a.stats.floor_price);
    
    // Find high-volume collections
    standouts.highVolume = nftData.collections
      .filter((collection: any) => collection.stats?.one_day_volume > 50)
      .sort((a: any, b: any) => b.stats.one_day_volume - a.stats.one_day_volume);
    
    // Find price gainers (positive 24h change)
    standouts.priceGainers = nftData.collections
      .filter((collection: any) => collection.stats?.one_day_change > 10)
      .sort((a: any, b: any) => b.stats.one_day_change - a.stats.one_day_change);
    
    // Find price losers (negative 24h change)
    standouts.priceLosers = nftData.collections
      .filter((collection: any) => collection.stats?.one_day_change < -10)
      .sort((a: any, b: any) => a.stats.one_day_change - b.stats.one_day_change);
    
    // Focus on generative art (based on category)
    standouts.generativeArt = nftData.collections
      .filter((collection: any) => collection.category === 'generative-art')
      .sort((a: any, b: any) => b.stats.floor_price - a.stats.floor_price);
  }
  
  return standouts;
}

/**
 * Helper function to analyze NFT trends
 */
function analyzeNFTTrends(nftData: any): any {
  const trends = {
    direction: 'sideways',
    generativeArtFocus: false,
    volumeTrend: 'stable',
    floorPriceTrend: 'stable',
    collectionHealth: 'mixed'
  };
  
  if (nftData?.summary) {
    const { topPerformers, worstPerformers, totalVolume24h, avgFloorPrice } = nftData.summary;
    
    // Determine overall direction
    if (topPerformers.length > worstPerformers.length * 2) {
      trends.direction = 'upward';
    } else if (worstPerformers.length > topPerformers.length * 2) {
      trends.direction = 'downward';
    }
    
    // Check for generative art focus
    const generativeCount = nftData.collections?.filter((c: any) => c.category === 'generative-art').length || 0;
    trends.generativeArtFocus = generativeCount > nftData.collections?.length * 0.5;
    
    // Assess volume trend (simplified)
    if (totalVolume24h > 500) {
      trends.volumeTrend = 'increasing';
    } else if (totalVolume24h < 50) {
      trends.volumeTrend = 'decreasing';
    }
    
    // Assess floor price trend
    if (avgFloorPrice > 2) {
      trends.floorPriceTrend = 'premium';
    } else if (avgFloorPrice < 0.5) {
      trends.floorPriceTrend = 'affordable';
    }
    
    // Overall collection health
    const healthyRatio = topPerformers.length / (topPerformers.length + worstPerformers.length);
    if (healthyRatio > 0.6) {
      trends.collectionHealth = 'strong';
    } else if (healthyRatio < 0.4) {
      trends.collectionHealth = 'weak';
    }
  }
  
  return trends;
}

/**
 * Helper function to build NFT context
 */
function buildNFTContext(
  marketAnalysis: any,
  standoutCollections: any,
  trendAnalysis: any,
  nftData: any
): string {
  const context = [];
  
  // Market overview
  context.push(`🖼️ NFT MARKET CONTEXT`);
  context.push(`📊 Market sentiment: ${marketAnalysis.sentiment}`);
  context.push(`💪 Market health: ${marketAnalysis.marketHealth}`);
  context.push(`💧 Liquidity: ${marketAnalysis.liquidityLevel}`);
  context.push('');
  
  // Market summary
  if (nftData?.summary) {
    context.push(`⚡ MARKET SUMMARY:`);
    context.push(`• Total 24h volume: ${nftData.summary.totalVolume24h?.toFixed(2)} ETH`);
    context.push(`• Average floor price: ${nftData.summary.avgFloorPrice?.toFixed(3)} ETH`);
    context.push(`• Collections tracked: ${nftData.summary.totalCollections}`);
    context.push(`• Top performers: ${nftData.summary.topPerformers.length}`);
    context.push('');
  }
  
  // Standout collections
  if (standoutCollections.highValue.length > 0) {
    context.push(`💎 HIGH-VALUE COLLECTIONS:`);
    standoutCollections.highValue.slice(0, 3).forEach((collection: any, index: number) => {
      const floorPrice = collection.stats?.floor_price?.toFixed(3) || 'N/A';
      context.push(`${index + 1}. ${collection.collection?.name || collection.name}: ${floorPrice} ETH floor`);
    });
    context.push('');
  }
  
  // Price movers
  if (standoutCollections.priceGainers.length > 0) {
    context.push(`🚀 TRENDING UP:`);
    standoutCollections.priceGainers.slice(0, 2).forEach((collection: any, index: number) => {
      const change = collection.stats?.one_day_change?.toFixed(1) || 'N/A';
      context.push(`• ${collection.collection?.name || collection.name}: +${change}%`);
    });
    context.push('');
  }
  
  if (standoutCollections.priceLosers.length > 0) {
    context.push(`📉 DECLINING:`);
    standoutCollections.priceLosers.slice(0, 2).forEach((collection: any, index: number) => {
      const change = collection.stats?.one_day_change?.toFixed(1) || 'N/A';
      context.push(`• ${collection.collection?.name || collection.name}: ${change}%`);
    });
    context.push('');
  }
  
  // Trend analysis
  context.push(`🔍 TREND ANALYSIS:`);
  context.push(`• Direction: ${trendAnalysis.direction}`);
  context.push(`• Volume trend: ${trendAnalysis.volumeTrend}`);
  context.push(`• Floor price trend: ${trendAnalysis.floorPriceTrend}`);
  if (trendAnalysis.generativeArtFocus) {
    context.push(`• 🎨 Generative art focus detected`);
  }
  context.push('');
  
  // Insights
  context.push(`💡 INSIGHTS:`);
  context.push(`• Focus on generative art and digital heritage`);
  context.push(`• OpenSea data updated every minute`);
  context.push(`• Use NFT actions for detailed collection analysis`);
  
  return context.join('\n');
}

export default nftProvider; 