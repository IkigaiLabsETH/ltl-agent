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
import { RealTimeDataService } from '../services/RealTimeDataService';

// Helper methods for enhanced NFT analysis
const analyzeFloorItems = (collections: any[]): string => {
  const collectionsWithFloors = collections.filter(c => c.floorItems?.length > 0);
  if (collectionsWithFloors.length === 0) {
    return "No active floor listings detected across tracked collections";
  }
  
  const totalListings = collectionsWithFloors.reduce((sum, c) => sum + (c.floorItems?.length || 0), 0);
  const avgFloorPrice = collectionsWithFloors.reduce((sum, c) => 
    sum + (c.floorItems?.[0]?.price_eth || 0), 0) / collectionsWithFloors.length;
  
  return `${totalListings} active floor listings across ${collectionsWithFloors.length} collections. Average floor entry: ${avgFloorPrice.toFixed(3)} ETH. Liquidity appears ${totalListings > 20 ? 'healthy' : totalListings > 10 ? 'moderate' : 'thin'}.`;
};

const formatNFTMarketSummary = (collections: any[], summary: any): string => {
  const positivePerformers = collections.filter(c => c.stats.one_day_change > 0).length;
  const negativePerformers = collections.filter(c => c.stats.one_day_change < 0).length;
  
  let marketSentiment = 'mixed';
  if (positivePerformers > negativePerformers * 1.5) {
    marketSentiment = 'bullish';
  } else if (negativePerformers > positivePerformers * 1.5) {
    marketSentiment = 'bearish';
  }

  const volumeContext = summary.totalVolume24h > 500 ? 'High activity' : 
                       summary.totalVolume24h > 200 ? 'Moderate activity' : 
                       summary.totalVolume24h > 50 ? 'Low activity' : 'Minimal activity';

  return `${collections.length} premium collections tracked. 24h volume: ${summary.totalVolume24h.toFixed(2)} ETH (${volumeContext}). Market sentiment: ${marketSentiment.toUpperCase()}. Average floor: ${summary.avgFloorPrice.toFixed(3)} ETH.`;
};

const formatTopPerformers = (topPerformers: any[], limit: number = 3): string => {
  if (topPerformers.length === 0) return "No significant performers detected.";
  
  return topPerformers.slice(0, limit).map((collection, i) => {
    const floorItem = collection.floorItems?.[0];
    const floorText = floorItem ? ` (floor: ${floorItem.price_eth.toFixed(3)} ETH)` : '';
    return `${i + 1}. ${collection.collection.name || collection.slug}: ${collection.stats.one_day_change > 0 ? '+' : ''}${collection.stats.one_day_change.toFixed(1)}%${floorText}`;
  }).join('. ');
};

const generateSatoshiNFTAnalysis = (marketSentiment: string, collections: any[]): string => {
  const activeCollections = collections.filter(c => (c.floorItems?.length || 0) > 0 || (c.recentSales?.length || 0) > 0).length;
  
  let analysis = "";
  
  if (marketSentiment === 'bullish') {
    analysis += "Digital art markets showing proof-of-interest. ";
  } else if (marketSentiment === 'bearish') {
    analysis += "NFT markets declining - speculation cycles ending. ";
  } else {
    analysis += "NFT markets in price discovery mode. ";
  }
  
  analysis += `${activeCollections}/${collections.length} collections have genuine collector interest. `;
  analysis += "Art has value, but Bitcoin has monetary properties. ";
  analysis += "Collect what resonates, stack what's mathematically scarce.";
  
  return analysis;
};

export const curatedNFTsAction: Action = createActionTemplate({
  name: 'CURATED_NFTS_ANALYSIS',
  description: 'Comprehensive analysis of curated NFT collections including blue-chip NFTs, generative art, and high-end digital art collections with floor price monitoring',
  similes: ['CURATED_NFT_ANALYSIS', 'DIGITAL_ART_ANALYSIS', 'NFT_MARKET_ANALYSIS', 'OPENSEA_ANALYSIS', 'BLUE_CHIP_NFTS', 'GENERATIVE_ART_ANALYSIS'],
  
  examples: [
    [
      {
        name: '{{user}}',
        content: { text: 'How are NFTs performing today?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: '47 premium collections tracked. CryptoPunks: 45.2 ETH floor (+1.8%). Fidenza: 8.2 ETH floor (+3.1%). Art Blocks: 2.1 ETH floor (+2.4%). 24h volume: 342 ETH (moderate activity). Market sentiment: MIXED. Markets consolidating after speculation peak. Art has cultural value, Bitcoin has monetary properties.',
          thought: 'User wants current NFT market performance. I should analyze floor prices, volume, and market sentiment across premium collections, then provide perspective on NFTs versus Bitcoin as a store of value.',
          actions: ['CURATED_NFTS_ANALYSIS'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'What\'s the current floor price of CryptoPunks?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'CryptoPunks floor: 44.8 ETH (-1.2% 24h). 8 active floor listings. Recent sale: 46.2 ETH. Market stabilizing after froth. NFT speculation cycles vs Bitcoin\'s programmed scarcity. 21 million Bitcoin cap is immutable - NFT supply is whatever the creator decides.',
          thought: 'User asking specifically about CryptoPunks floor price. I need to provide current floor data, context about recent activity, and contrast with Bitcoin\'s fixed supply.',
          actions: ['CURATED_NFTS_ANALYSIS'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Show me the latest generative art performance' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Generative art performance: Fidenza +4.2% (8.7 ETH floor), Art Blocks +2.8% (2.1 ETH floor), Archetype +3.5% (1.2 ETH floor). 12 collections showing resilience. Digital art demonstrating cultural staying power, but remember - these are collectibles, not money.',
          thought: 'User interested in generative art category performance. I should focus on the key generative art collections, their floor prices and performance, while maintaining perspective on their nature as collectibles rather than sound money.',
          actions: ['CURATED_NFTS_ANALYSIS'],
        },
      },
    ],
  ],
  
  validateFn: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    return ValidationPatterns.isNFTRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info('Curated NFTs analysis action triggered');
    
    const thoughtProcess = 'User is requesting NFT market analysis. I need to analyze curated NFT collections including floor prices, volume, and market sentiment, then provide perspective on NFTs as cultural artifacts versus Bitcoin as sound money.';
    
    try {
      const realTimeDataService = runtime.getService('real-time-data') as RealTimeDataService;
      
      if (!realTimeDataService) {
        logger.warn('RealTimeDataService not available for NFT analysis');
        
        const fallbackResponse = ResponseCreators.createErrorResponse(
          'CURATED_NFTS_ANALYSIS',
          'NFT market analysis temporarily unavailable',
          'NFT market analysis temporarily unavailable. Focus on Bitcoin - the only digital asset with immaculate conception.'
        );
        
        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Check if force refresh is requested
      const forceRefresh = message.content?.text?.toLowerCase().includes('refresh') || 
                          message.content?.text?.toLowerCase().includes('latest') ||
                          message.content?.text?.toLowerCase().includes('current');

      let nftData;
      if (forceRefresh) {
        nftData = await realTimeDataService.forceCuratedNFTsUpdate();
      } else {
        nftData = realTimeDataService.getCuratedNFTsData();
      }

      if (!nftData || nftData.collections.length === 0) {
        logger.warn('No NFT data available');
        
        const noDataResponse = ResponseCreators.createErrorResponse(
          'CURATED_NFTS_ANALYSIS',
          'NFT market data temporarily unavailable',
          'NFT market data temporarily unavailable - API connection failed. Cannot provide accurate floor prices without live data. Focus on Bitcoin - the only digital asset with immutable scarcity.'
        );
        
        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Analyze NFT market
      const { collections, summary } = nftData;
      const marketSummary = formatNFTMarketSummary(collections, summary);
      const floorAnalysis = analyzeFloorItems(collections);
      const topPerformersText = formatTopPerformers(summary.topPerformers);
      const satoshiAnalysis = generateSatoshiNFTAnalysis(getMarketSentiment(collections), collections);

      // Generate comprehensive response
      const responseText = `${marketSummary} ${topPerformersText} Floor analysis: ${floorAnalysis} Satoshi's perspective: ${satoshiAnalysis}`;

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        responseText,
        'CURATED_NFTS_ANALYSIS',
        {
          collectionsCount: collections.length,
          totalVolume24h: summary.totalVolume24h,
          avgFloorPrice: summary.avgFloorPrice,
          marketSentiment: getMarketSentiment(collections),
          topPerformers: summary.topPerformers.slice(0, 3).map(collection => ({
            name: collection.collection.name || collection.slug,
            change24h: collection.stats.one_day_change,
            floorPrice: collection.stats.floor_price
          })),
          floorItemsCount: collections.reduce((sum, c) => sum + (c.floorItems?.length || 0), 0)
        }
      );

      if (callback) {
        await callback(response);
      }

      logger.info('NFT market analysis delivered successfully');
      return true;

    } catch (error) {
      logger.error('Failed to analyze NFT market:', (error as Error).message);
      
      const errorResponse = ResponseCreators.createErrorResponse(
        'CURATED_NFTS_ANALYSIS',
        (error as Error).message,
        'NFT analysis failed. Perhaps the market is teaching us that Bitcoin\'s simplicity is its strength.'
      );
      
      if (callback) {
        await callback(errorResponse);
      }
      
      return false;
    }
  },
});

/**
 * Determine market sentiment based on collection performance
 */
function getMarketSentiment(collections: any[]): string {
  const positivePerformers = collections.filter(c => c.stats.one_day_change > 0).length;
  const negativePerformers = collections.filter(c => c.stats.one_day_change < 0).length;
  const neutralPerformers = collections.filter(c => c.stats.one_day_change === 0).length;

  if (positivePerformers > negativePerformers * 1.5) {
    return 'bullish';
  } else if (negativePerformers > positivePerformers * 1.5) {
    return 'bearish';
  } else if (neutralPerformers > collections.length * 0.7) {
    return 'stagnant';
  }
  return 'mixed';
} 