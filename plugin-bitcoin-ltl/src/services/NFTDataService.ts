import { IAgentRuntime, logger } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';

// NFT-specific interfaces (extracted from RealTimeDataService)
export interface NFTCollectionStats {
  total_supply: number;
  num_owners: number;
  average_price: number;
  floor_price: number;
  market_cap: number;
  one_day_volume: number;
  one_day_change: number;
  one_day_sales: number;
  seven_day_volume: number;
  seven_day_change: number;
  seven_day_sales: number;
  thirty_day_volume: number;
  thirty_day_change: number;
  thirty_day_sales: number;
}

export interface NFTCollection {
  collection: string;
  name: string;
  description: string;
  image_url: string;
  banner_image_url: string;
  owner: string;
  category: string;
  is_disabled: boolean;
  is_nsfw: boolean;
  trait_offers_enabled: boolean;
  collection_offers_enabled: boolean;
  opensea_url: string;
  project_url: string;
  wiki_url: string;
  discord_url: string;
  telegram_url: string;
  twitter_username: string;
  instagram_username: string;
  contracts: Array<{
    address: string;
    chain: string;
  }>;
  editors: string[];
  fees: Array<{
    fee: number;
    recipient: string;
    required: boolean;
  }>;
  rarity: {
    strategy_id: string;
    strategy_version: string;
    rank_at: string;
    max_rank: number;
    tokens_scored: number;
  };
  total_supply: number;
  created_date: string;
}

export interface NFTCollectionData {
  slug: string;
  collection: NFTCollection;
  stats: NFTCollectionStats;
  lastUpdated: Date;
  category: 'blue-chip' | 'generative-art' | 'digital-art' | 'pfp' | 'utility';
  floorItems?: NFTFloorItem[];
  recentSales?: NFTSaleEvent[];
  contractAddress?: string;
  blockchain?: string;
}

export interface NFTFloorItem {
  token_id: string;
  name: string;
  image_url: string;
  price_eth: number;
  price_usd: number;
  rarity_rank?: number;
  listing_time: string;
  opensea_url: string;
}

export interface NFTSaleEvent {
  token_id: string;
  name: string;
  image_url: string;
  price_eth: number;
  price_usd: number;
  buyer: string;
  seller: string;
  transaction_hash: string;
  timestamp: string;
  event_type: 'sale' | 'transfer' | 'mint';
}

export interface NFTTraitFloor {
  trait_type: string;
  trait_value: string;
  floor_price: number;
  count: number;
}

export interface CuratedNFTsData {
  collections: NFTCollectionData[];
  summary: {
    totalVolume24h: number;
    totalMarketCap: number;
    avgFloorPrice: number;
    topPerformers: NFTCollectionData[];
    worstPerformers: NFTCollectionData[];
    totalCollections: number;
  };
  lastUpdated: Date;
}

export interface CuratedNFTsCache {
  data: CuratedNFTsData;
  timestamp: number;
}

export class NFTDataService extends BaseDataService {
  static serviceType = 'nft-data';
  capabilityDescription = 'Provides real-time NFT collection data and floor prices from OpenSea';

  // Cache configuration
  private curatedNFTsCache: CuratedNFTsCache | null = null;
  private readonly CURATED_NFTS_CACHE_DURATION = 60 * 1000; // 1 minute (matches website caching)

  // Curated NFT collections (high-end digital art and OG collections)
  private readonly curatedNFTCollections = [
    // Blue chip PFP collections
    { slug: 'boredapeyachtclub', category: 'blue-chip' as const },
    { slug: 'mutant-ape-yacht-club', category: 'blue-chip' as const },
    { slug: 'cryptopunks', category: 'blue-chip' as const },
    { slug: 'azuki', category: 'blue-chip' as const },
    { slug: 'clonex', category: 'blue-chip' as const },
    { slug: 'doodles-official', category: 'blue-chip' as const },
    
    // Generative art collections  
    { slug: 'fidenza-by-tyler-hobbs', category: 'generative-art' as const },
    { slug: 'art-blocks-curated', category: 'generative-art' as const },
    { slug: 'terraforms', category: 'generative-art' as const },
    { slug: 'ackcolorstudy', category: 'generative-art' as const },
    { slug: 'vera-molnar-themes-and-variations', category: 'generative-art' as const },
    { slug: 'sightseers-by-norman-harman', category: 'generative-art' as const },
    { slug: 'progression-by-jeff-davis', category: 'generative-art' as const },
    { slug: 'risk-reward-by-kjetil-golid', category: 'generative-art' as const },
    { slug: 'aligndraw', category: 'generative-art' as const },
    { slug: 'archetype-by-kjetil-golid', category: 'generative-art' as const },
    { slug: 'qql', category: 'generative-art' as const },
    { slug: 'orbifold-by-kjetil-golid', category: 'generative-art' as const },
    { slug: 'meridian-by-matt-deslauriers', category: 'generative-art' as const },
    
    // Digital art collections
    { slug: '0xdgb-thecameras', category: 'digital-art' as const },
    { slug: 'the-harvest-by-per-kristian-stoveland', category: 'digital-art' as const },
    { slug: 'xcopy-knownorigin', category: 'digital-art' as const },
    { slug: 'winds-of-yawanawa', category: 'digital-art' as const },
    { slug: 'brokenkeys', category: 'digital-art' as const },
    { slug: 'ripcache', category: 'digital-art' as const },
    { slug: 'human-unreadable-by-operator', category: 'digital-art' as const },
    { slug: 'non-either-by-rafael-rozendaal', category: 'digital-art' as const },
    { slug: 'pop-wonder-editions', category: 'digital-art' as const },
    { slug: 'machine-hallucinations-coral-generative-ai-data-pa', category: 'digital-art' as const },
    
    // PFP collections
    { slug: 'jaknfthoodies', category: 'pfp' as const },
    { slug: 'monstersoup', category: 'pfp' as const },
    { slug: 'getijde-by-bart-simons', category: 'generative-art' as const },
    { slug: '24-hours-of-art', category: 'digital-art' as const },
    { slug: 'pursuit-by-per-kristian-stoveland', category: 'generative-art' as const },
    { slug: '100-sunsets-by-zach-lieberman', category: 'digital-art' as const },
    { slug: 'strands-of-solitude', category: 'generative-art' as const },
    { slug: 'justinaversano-gabbagallery', category: 'digital-art' as const },
    { slug: 'neural-sediments-by-eko33', category: 'generative-art' as const },
    { slug: 'wavyscape-by-holger-lippmann', category: 'generative-art' as const },
    { slug: 'opepen-edition', category: 'pfp' as const },
    { slug: 'mind-the-gap-by-mountvitruvius', category: 'generative-art' as const },
    { slug: 'urban-transportation-red-trucks', category: 'digital-art' as const },
    { slug: 'trichro-matic-by-mountvitruvius', category: 'generative-art' as const },
    { slug: 'sam-spratt-masks-of-luci', category: 'digital-art' as const },
    { slug: 'pink-such-a-useless-color-by-simon-raion', category: 'digital-art' as const },
    { slug: 'sketchbook-a-by-william-mapan-1', category: 'generative-art' as const },
    { slug: 'life-and-love-and-nothing-by-nat-sarkissian', category: 'digital-art' as const },
    { slug: 'highrises', category: 'digital-art' as const },
    { slug: 'lifeguard-towers-miami', category: 'digital-art' as const },
    { slug: 'stranger-together-by-brooke-didonato-ben-zank', category: 'digital-art' as const },
    { slug: 'the-vault-of-wonders-chapter-1-the-abyssal-unseen', category: 'digital-art' as const },
    { slug: 'skulptuur-by-piter-pasma', category: 'generative-art' as const },
    { slug: 'dataland-biomelumina', category: 'generative-art' as const },
    { slug: 'pop-wonder-superrare', category: 'digital-art' as const },
    { slug: 'cryptodickbutts', category: 'pfp' as const },
    { slug: 'day-gardens', category: 'generative-art' as const },
    { slug: 'cryptoadz-by-gremplin', category: 'pfp' as const },
    { slug: 'izanami-islands-by-richard-nadler', category: 'digital-art' as const },
    { slug: 'yamabushi-s-horizons-by-richard-nadler', category: 'digital-art' as const },
    { slug: 'kinoko-dreams-by-richard-nadler', category: 'digital-art' as const }
  ];

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('NFTDataService starting...');
    const service = new NFTDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('NFTDataService stopping...');
    const service = runtime.getService('nft-data');
    if (service && service.stop) {
      await service.stop();
    }
  }

  async init() {
    logger.info('NFTDataService initialized');
    
    // Initial data load
    await this.updateCuratedNFTsData();
  }

  async stop() {
    logger.info('NFTDataService stopped');
  }

  // Public API methods
  public getCuratedNFTsData(): CuratedNFTsData | null {
    if (!this.curatedNFTsCache || !this.isCuratedNFTsCacheValid()) {
      return null;
    }
    return this.curatedNFTsCache.data;
  }

  public async forceCuratedNFTsUpdate(): Promise<CuratedNFTsData | null> {
    return await this.fetchCuratedNFTsData();
  }

  public async updateCuratedNFTsData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isCuratedNFTsCacheValid()) {
      const data = await this.fetchCuratedNFTsData();
      if (data) {
        this.curatedNFTsCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  // Cache management
  private isCuratedNFTsCacheValid(): boolean {
    if (!this.curatedNFTsCache) return false;
    return Date.now() - this.curatedNFTsCache.timestamp < this.CURATED_NFTS_CACHE_DURATION;
  }

  // Core NFT data fetching methods
  private async fetchCuratedNFTsData(): Promise<CuratedNFTsData | null> {
    try {
      logger.info('[NFTDataService] Fetching curated NFTs data...');
      
      const openSeaApiKey = this.runtime.getSetting('OPENSEA_API_KEY');
      if (!openSeaApiKey) {
        logger.warn('OPENSEA_API_KEY not configured, returning null');
        return null;
      }

      const headers = {
        'Accept': 'application/json',
        'X-API-KEY': openSeaApiKey,
        'User-Agent': 'LiveTheLifeTV/1.0'
      };

      const collections: NFTCollectionData[] = [];
      
      for (const collectionInfo of this.curatedNFTCollections.slice(0, 5)) {
        try {
          const collectionData = await this.fetchCollectionData(collectionInfo.slug, headers);
          if (collectionData) {
            collections.push({
              slug: collectionInfo.slug,
              collection: collectionData.collection,
              stats: collectionData.stats,
              lastUpdated: new Date(),
              category: collectionInfo.category,
              contractAddress: collectionData.contractAddress,
              blockchain: 'ethereum'
            });
          }
        } catch (error) {
          logger.warn(`Failed to fetch ${collectionInfo.slug}:`, error);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const summary = this.calculateNFTSummary(collections);

      return {
        collections,
        summary,
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error('Error in fetchCuratedNFTsData:', error);
      return null;
    }
  }

  private async fetchCollectionData(slug: string, headers: any): Promise<any> {
    const response = await fetch(
      `https://api.opensea.io/api/v2/collections/${slug}/stats`,
      { headers, signal: AbortSignal.timeout(10000) }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      collection: { name: slug },
      stats: this.parseCollectionStats(data),
      contractAddress: ''
    };
  }

  private parseCollectionStats(statsData: any): NFTCollectionStats {
    const stats = statsData?.total || {};
    const intervals = statsData?.intervals || [];
    
    const oneDayInterval = intervals.find(i => i.interval === 'one_day');
    
    return {
      total_supply: stats.total_supply || 0,
      num_owners: stats.num_owners || 0,
      average_price: stats.average_price || 0,
      floor_price: stats.floor_price || 0,
      market_cap: stats.market_cap || 0,
      one_day_volume: oneDayInterval?.volume || 0,
      one_day_change: oneDayInterval?.volume_change || 0,
      one_day_sales: oneDayInterval?.sales || 0,
      seven_day_volume: 0,
      seven_day_change: 0,
      seven_day_sales: 0,
      thirty_day_volume: 0,
      thirty_day_change: 0,
      thirty_day_sales: 0
    };
  }

  private calculateNFTSummary(collections: NFTCollectionData[]): CuratedNFTsData['summary'] {
    const totalVolume24h = collections.reduce((sum, c) => sum + c.stats.one_day_volume, 0);
    const totalMarketCap = collections.reduce((sum, c) => sum + c.stats.market_cap, 0);
    const avgFloorPrice = collections.length > 0 
      ? collections.reduce((sum, c) => sum + c.stats.floor_price, 0) / collections.length 
      : 0;

    return {
      totalVolume24h,
      totalMarketCap,
      avgFloorPrice,
      topPerformers: collections.slice(0, 3),
      worstPerformers: collections.slice(-3),
      totalCollections: collections.length
    };
  }

  // Required abstract method implementations
  async updateData(): Promise<void> {
    await this.updateCuratedNFTsData();
  }

  async forceUpdate(): Promise<void> {
    // Clear cache to force fresh data
    this.curatedNFTsCache = null;
    await this.updateCuratedNFTsData();
  }
} 