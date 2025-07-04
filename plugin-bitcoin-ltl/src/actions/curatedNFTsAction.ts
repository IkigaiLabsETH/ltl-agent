import { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { RealTimeDataService } from '../services/RealTimeDataService';

// Helper methods for enhanced NFT analysis
const analyzeFloorItems = (collections: any[]): string => {
  const collectionsWithFloors = collections.filter(c => c.floorItems?.length > 0);
  if (collectionsWithFloors.length === 0) {
    return "• No active floor listings detected across tracked collections";
  }
  
  const totalListings = collectionsWithFloors.reduce((sum, c) => sum + (c.floorItems?.length || 0), 0);
  const avgFloorPrice = collectionsWithFloors.reduce((sum, c) => 
    sum + (c.floorItems?.[0]?.price_eth || 0), 0) / collectionsWithFloors.length;
  
  return `• ${totalListings} active floor listings across ${collectionsWithFloors.length} collections\n• Average floor entry: ${avgFloorPrice.toFixed(3)} ETH\n• Liquidity appears ${totalListings > 20 ? 'healthy' : totalListings > 10 ? 'moderate' : 'thin'}`;
};

const analyzeRecentSales = (collections: any[]): string => {
  const collectionsWithSales = collections.filter(c => c.recentSales?.length > 0);
  if (collectionsWithSales.length === 0) {
    return "• Limited sales activity detected - market consolidating";
  }
  
  const totalSales = collectionsWithSales.reduce((sum, c) => sum + (c.recentSales?.length || 0), 0);
  const avgSalePrice = collectionsWithSales.reduce((sum, c) => 
    sum + (c.recentSales?.[0]?.price_eth || 0), 0) / collectionsWithSales.length;
  
  return `• ${totalSales} recent sales across ${collectionsWithSales.length} collections\n• Average sale price: ${avgSalePrice.toFixed(3)} ETH\n• Market velocity: ${totalSales > 15 ? 'High' : totalSales > 8 ? 'Moderate' : 'Low'}`;
};

const analyzeLiquidity = (collections: any[]): string => {
  const liquidCollections = collections.filter(c => (c.floorItems?.length || 0) > 1 && (c.recentSales?.length || 0) > 0);
  const illiquidCollections = collections.filter(c => (c.floorItems?.length || 0) === 0 && (c.recentSales?.length || 0) === 0);
  
  return `• Liquid collections: ${liquidCollections.length}/${collections.length} (good listings + sales)\n• Illiquid collections: ${illiquidCollections.length}/${collections.length} (no activity)\n• Market health: ${liquidCollections.length > collections.length * 0.6 ? 'Strong' : liquidCollections.length > collections.length * 0.3 ? 'Moderate' : 'Weak'}`;
};

const getVolumeContext = (volume: number): string => {
  if (volume > 500) return 'High activity';
  if (volume > 200) return 'Moderate activity';
  if (volume > 50) return 'Low activity';
  return 'Minimal activity';
};

const countActiveListings = (collections: any[]): number => {
  return collections.reduce((sum, c) => sum + (c.floorItems?.length || 0), 0);
};

const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const saleTime = new Date(timestamp);
  const diffHours = Math.floor((now.getTime() - saleTime.getTime()) / (1000 * 60 * 60));
  
  if (diffHours < 1) return ' (< 1h ago)';
  if (diffHours < 24) return ` (${diffHours}h ago)`;
  const diffDays = Math.floor(diffHours / 24);
  return ` (${diffDays}d ago)`;
};

const generateEnhancedSatoshiAnalysis = (sentiment: string, summary: any, collections: any[]): string => {
  const volumeContext = getVolumeContext(summary.totalVolume24h);
  const activeCollections = collections.filter(c => (c.floorItems?.length || 0) > 0 || (c.recentSales?.length || 0) > 0).length;
  
  let analysis = "";
  
  if (sentiment === 'bullish') {
    analysis += "Digital art markets showing proof-of-interest. ";
  } else if (sentiment === 'bearish') {
    analysis += "NFT markets declining - speculation cycles ending. ";
  } else {
    analysis += "NFT markets in price discovery mode. ";
  }
  
  analysis += `${volumeContext.toLowerCase()} suggests ${activeCollections}/${collections.length} collections have genuine collector interest. `;
  analysis += "Art has value, but Bitcoin has monetary properties. ";
  analysis += "Collect what resonates, stack what's mathematically scarce.";
  
  return analysis;
};

export const curatedNFTsAction: Action = {
  name: 'CURATED_NFTS_ANALYSIS',
  similes: [
    'CURATED_NFT_ANALYSIS',
    'DIGITAL_ART_ANALYSIS',
    'NFT_MARKET_ANALYSIS',
    'OPENSEA_ANALYSIS',
    'BLUE_CHIP_NFTS',
    'GENERATIVE_ART_ANALYSIS'
  ],
  description: 'Analyzes curated NFT collections including blue-chip NFTs, generative art, and high-end digital art collections',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content.text?.toLowerCase() || '';
    const triggers = [
      'nft', 'nfts', 'digital art', 'opensea', 'cryptopunks', 'fidenza',
      'generative art', 'art blocks', 'blue chip', 'floor price', 'collection',
      'curated nft', 'digital collection', 'art collection', 'nft market'
    ];
    
    return triggers.some(trigger => content.includes(trigger));
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback) => {
    try {
      const realTimeDataService = runtime.getService('RealTimeDataService') as RealTimeDataService;
      
      if (!realTimeDataService) {
        callback({
          text: "NFT market analysis temporarily unavailable. Focus on Bitcoin - the only digital asset with immaculate conception.",
          action: 'CURATED_NFTS_ANALYSIS'
        });
        return;
      }

      // Check if force refresh is requested
      const forceRefresh = message.content.text?.toLowerCase().includes('refresh') || 
                          message.content.text?.toLowerCase().includes('latest') ||
                          message.content.text?.toLowerCase().includes('current');

      let nftData;
      if (forceRefresh) {
        nftData = await realTimeDataService.forceCuratedNFTsUpdate();
      } else {
        nftData = realTimeDataService.getCuratedNFTsData();
      }

      if (!nftData) {
        callback({
          text: "NFT data unavailable. Perhaps the market is reminding us that Bitcoin is the only digital asset with true scarcity and no central authority.",
          action: 'CURATED_NFTS_ANALYSIS'
        });
        return;
      }

      const { collections, summary } = nftData;
      
      // Categorize collections by type
      const blueChipCollections = collections.filter(c => c.category === 'blue-chip');
      const generativeArtCollections = collections.filter(c => c.category === 'generative-art');
      const digitalArtCollections = collections.filter(c => c.category === 'digital-art');
      const pfpCollections = collections.filter(c => c.category === 'pfp');

      // Calculate category performance
      const categoryPerformance = {
        'blue-chip': {
          count: blueChipCollections.length,
          avgFloorPrice: blueChipCollections.reduce((sum, c) => sum + c.stats.floor_price, 0) / blueChipCollections.length,
          totalVolume24h: blueChipCollections.reduce((sum, c) => sum + c.stats.one_day_volume, 0),
          avgChange24h: blueChipCollections.reduce((sum, c) => sum + c.stats.one_day_change, 0) / blueChipCollections.length
        },
        'generative-art': {
          count: generativeArtCollections.length,
          avgFloorPrice: generativeArtCollections.reduce((sum, c) => sum + c.stats.floor_price, 0) / generativeArtCollections.length,
          totalVolume24h: generativeArtCollections.reduce((sum, c) => sum + c.stats.one_day_volume, 0),
          avgChange24h: generativeArtCollections.reduce((sum, c) => sum + c.stats.one_day_change, 0) / generativeArtCollections.length
        },
        'digital-art': {
          count: digitalArtCollections.length,
          avgFloorPrice: digitalArtCollections.reduce((sum, c) => sum + c.stats.floor_price, 0) / digitalArtCollections.length,
          totalVolume24h: digitalArtCollections.reduce((sum, c) => sum + c.stats.one_day_volume, 0),
          avgChange24h: digitalArtCollections.reduce((sum, c) => sum + c.stats.one_day_change, 0) / digitalArtCollections.length
        },
        'pfp': {
          count: pfpCollections.length,
          avgFloorPrice: pfpCollections.reduce((sum, c) => sum + c.stats.floor_price, 0) / pfpCollections.length,
          totalVolume24h: pfpCollections.reduce((sum, c) => sum + c.stats.one_day_volume, 0),
          avgChange24h: pfpCollections.reduce((sum, c) => sum + c.stats.one_day_change, 0) / pfpCollections.length
        }
      };

      // Market sentiment analysis
      const positivePerformers = collections.filter(c => c.stats.one_day_change > 0).length;
      const negativePerformers = collections.filter(c => c.stats.one_day_change < 0).length;
      const neutralPerformers = collections.filter(c => c.stats.one_day_change === 0).length;

      let marketSentiment = 'mixed';
      if (positivePerformers > negativePerformers * 1.5) {
        marketSentiment = 'bullish';
      } else if (negativePerformers > positivePerformers * 1.5) {
        marketSentiment = 'bearish';
      } else if (neutralPerformers > collections.length * 0.7) {
        marketSentiment = 'stagnant';
      }

      // Enhanced analysis with floor items and recent sales
      const floorAnalysis = analyzeFloorItems(collections);
      const salesAnalysis = analyzeRecentSales(collections);
      const liquidityAnalysis = analyzeLiquidity(collections);

      // Generate enhanced Satoshi's analysis
      let analysis = "**🎨 Enhanced Digital Art Collection Intelligence**\n\n";

      // Market overview with enhanced metrics
      analysis += `**📊 Market Overview:**\n`;
      analysis += `• Collections Tracked: ${collections.length} premium collections\n`;
      analysis += `• 24h Volume: ${summary.totalVolume24h.toFixed(2)} ETH (${getVolumeContext(summary.totalVolume24h)})\n`;
      analysis += `• Average Floor: ${summary.avgFloorPrice.toFixed(3)} ETH\n`;
      analysis += `• Market Sentiment: ${marketSentiment.toUpperCase()}\n`;
      analysis += `• Active Listings: ${countActiveListings(collections)} across tracked collections\n\n`;

      // Category breakdown with enhanced data
      analysis += `**📈 Category Performance:**\n`;
      Object.entries(categoryPerformance).forEach(([category, data]) => {
        if (data.count > 0) {
          const categoryName = category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
          const volumeShare = ((data.totalVolume24h / summary.totalVolume24h) * 100);
          analysis += `• ${categoryName}: ${data.count} collections, ${data.avgFloorPrice.toFixed(3)} ETH avg floor (${data.avgChange24h > 0 ? '+' : ''}${data.avgChange24h.toFixed(1)}%) - ${volumeShare.toFixed(1)}% volume share\n`;
        }
      });

      // Enhanced top performers with floor item details
      if (summary.topPerformers.length > 0) {
        analysis += `\n**🏆 Top Performers (24h):**\n`;
        summary.topPerformers.slice(0, 3).forEach((collection, i) => {
          const floorItem = collection.floorItems?.[0];
          const recentSale = collection.recentSales?.[0];
          analysis += `${i + 1}. **${collection.collection.name || collection.slug}**: ${collection.stats.one_day_change > 0 ? '+' : ''}${collection.stats.one_day_change.toFixed(1)}% (${collection.stats.floor_price.toFixed(3)} ETH floor)\n`;
          if (floorItem) {
            analysis += `   • Cheapest: "${floorItem.name}" at ${floorItem.price_eth.toFixed(3)} ETH${floorItem.rarity_rank ? ` (Rank #${floorItem.rarity_rank})` : ''}\n`;
          }
                     if (recentSale) {
             analysis += `   • Recent Sale: ${recentSale.price_eth.toFixed(3)} ETH${getTimeAgo(recentSale.timestamp)}\n`;
           }
        });
      }

      // Enhanced underperformers with opportunity analysis
      if (summary.worstPerformers.length > 0) {
        analysis += `\n**📉 Cooldown Opportunities:**\n`;
        summary.worstPerformers.slice(0, 3).forEach((collection, i) => {
          const floorItem = collection.floorItems?.[0];
          const salesVelocity = collection.recentSales?.length || 0;
          analysis += `${i + 1}. **${collection.collection.name || collection.slug}**: ${collection.stats.one_day_change.toFixed(1)}% (${collection.stats.floor_price.toFixed(3)} ETH floor)\n`;
          if (floorItem) {
            analysis += `   • Entry Point: "${floorItem.name}" at ${floorItem.price_eth.toFixed(3)} ETH\n`;
          }
          analysis += `   • Sales Activity: ${salesVelocity} recent sales (${salesVelocity > 2 ? 'High' : salesVelocity > 0 ? 'Moderate' : 'Low'} velocity)\n`;
        });
      }

      // Floor market analysis
      analysis += `\n**🔥 Floor Market Analysis:**\n`;
      analysis += floorAnalysis + '\n';

      // Sales velocity analysis
      analysis += `**💰 Sales Velocity Analysis:**\n`;
      analysis += salesAnalysis + '\n';

      // Liquidity analysis
      analysis += `**💧 Liquidity Assessment:**\n`;
      analysis += liquidityAnalysis + '\n';

      // Enhanced Satoshi's perspective
      analysis += `**🧠 Satoshi's Enhanced Perspective:**\n`;
      analysis += generateEnhancedSatoshiAnalysis(marketSentiment, summary, collections) + '\n\n';

      // Bitcoin comparison with market context
      analysis += "**⚡ Truth Check:** NFTs are cultural artifacts on blockchains. Bitcoin is the blockchain that cannot be replicated. ";
      analysis += "21 million Bitcoin cap is immutable. NFT supply is whatever the creator decides. ";
      analysis += `While ${collections.length} art collections compete for attention, only one digital asset has immaculate conception.`;

      callback({
        text: analysis,
        action: 'CURATED_NFTS_ANALYSIS'
      });

    } catch (error) {
      console.error('Error in curatedNFTsAction:', error);
      callback({
        text: "NFT analysis failed. Perhaps the market is teaching us that Bitcoin's simplicity is its strength.",
        action: 'CURATED_NFTS_ANALYSIS'
      });
    }
  },
  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "How are NFTs performing today?" }
      },
      {
        name: "Satoshi",
        content: { 
          text: "CryptoPunks: 67.8 ETH floor (+2.1%). Fidenza: 12.5 ETH floor (+5.2%). QQL: 0.75 ETH floor (+3.8%). Art markets consolidating. Temporary price discovery vs permanent value store. Collect what you love, but stack what's scarce.",
          actions: ["CURATED_NFTS_ANALYSIS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: { text: "What's the current floor price of CryptoPunks?" }
      },
      {
        name: "Satoshi",
        content: {
          text: "CryptoPunks floor: 65.2 ETH (-3.4% 24h). Blue chip collections under pressure. NFT markets declining. Speculation cycles end, but sound money endures. 21 million Bitcoin cap is immutable. NFT supply is whatever the creator decides.",
          actions: ["CURATED_NFTS_ANALYSIS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Show me the latest generative art performance" }
      },
      {
        name: "Satoshi",
        content: {
          text: "Generative art leading: Fidenza +7.8% (14.2 ETH), Art Blocks +5.3% (3.45 ETH), Archetype +6.1% (1.89 ETH). Digital art markets showing strength, but remember - these are collectibles, not money. Art has value, but Bitcoin has monetary properties.",
          actions: ["CURATED_NFTS_ANALYSIS"]
        }
      }
    ]
  ]
}; 