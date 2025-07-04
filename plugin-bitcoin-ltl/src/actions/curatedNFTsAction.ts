import { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { RealTimeDataService } from '../services/RealTimeDataService';

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

      // Generate Satoshi's analysis
      let analysis = "**Curated NFT Collections Analysis**\n\n";

      // Market overview
      analysis += `**Market Overview:**\n`;
      analysis += `• ${collections.length} curated collections tracked\n`;
      analysis += `• Total 24h Volume: ${summary.totalVolume24h.toFixed(2)} ETH\n`;
      analysis += `• Average Floor Price: ${summary.avgFloorPrice.toFixed(3)} ETH\n`;
      analysis += `• Market Sentiment: ${marketSentiment}\n\n`;

      // Category breakdown
      analysis += `**Category Performance:**\n`;
      Object.entries(categoryPerformance).forEach(([category, data]) => {
        if (data.count > 0) {
          const categoryName = category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
          analysis += `• ${categoryName}: ${data.count} collections, avg floor ${data.avgFloorPrice.toFixed(3)} ETH (${data.avgChange24h > 0 ? '+' : ''}${data.avgChange24h.toFixed(1)}%)\n`;
        }
      });

      // Top performers
      if (summary.topPerformers.length > 0) {
        analysis += `\n**Top Performers (24h):**\n`;
        summary.topPerformers.slice(0, 3).forEach(collection => {
          analysis += `• ${collection.collection.name || collection.slug}: ${collection.stats.one_day_change > 0 ? '+' : ''}${collection.stats.one_day_change.toFixed(1)}% (${collection.stats.floor_price.toFixed(3)} ETH floor)\n`;
        });
      }

      // Worst performers
      if (summary.worstPerformers.length > 0) {
        analysis += `\n**Underperformers (24h):**\n`;
        summary.worstPerformers.slice(0, 3).forEach(collection => {
          analysis += `• ${collection.collection.name || collection.slug}: ${collection.stats.one_day_change.toFixed(1)}% (${collection.stats.floor_price.toFixed(3)} ETH floor)\n`;
        });
      }

      // Satoshi's perspective
      analysis += `\n**Satoshi's Perspective:**\n`;
      
      if (marketSentiment === 'bullish') {
        analysis += "Digital art markets showing strength, but remember - these are collectibles, not money. ";
      } else if (marketSentiment === 'bearish') {
        analysis += "NFT markets declining. Speculation cycles end, but sound money endures. ";
      } else {
        analysis += "NFT markets consolidating. Temporary price discovery vs permanent value store. ";
      }

      analysis += "Art has value, but Bitcoin has monetary properties. ";
      analysis += "Collect what you love, but stack what's scarce.\n\n";

      // Bitcoin comparison
      analysis += "**Truth Check:** NFTs are cultural artifacts on blockchains. Bitcoin is the blockchain that cannot be replicated. ";
      analysis += "21 million Bitcoin cap is immutable. NFT supply is whatever the creator decides.";

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