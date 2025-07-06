import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import {
  LoggerWithContext,
  generateCorrelationId,
  ComprehensiveErrorHandler,
} from "../utils";
import { CentralizedConfigService } from "./CentralizedConfigService";
import axios from "axios";

/**
 * NFT Collection Statistics Interface
 */
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

/**
 * NFT Collection Interface
 */
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

/**
 * NFT Collection Data Interface
 */
export interface NFTCollectionData {
  slug: string;
  collection: NFTCollection;
  stats: NFTCollectionStats;
  lastUpdated: Date;
  category: "blue-chip" | "generative-art" | "digital-art" | "pfp" | "utility";
  floorItems?: NFTFloorItem[];
  recentSales?: NFTSaleEvent[];
  contractAddress?: string;
  blockchain?: string;
}

/**
 * NFT Floor Item Interface
 */
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

/**
 * NFT Sale Event Interface
 */
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
  event_type: "sale" | "transfer" | "mint";
}

/**
 * NFT Trait Floor Interface
 */
export interface NFTTraitFloor {
  trait_type: string;
  trait_value: string;
  floor_price: number;
  count: number;
}

/**
 * Curated NFTs Data Interface
 */
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

/**
 * Curated NFTs Cache Interface
 */
export interface CuratedNFTsCache {
  data: CuratedNFTsData;
  timestamp: number;
}

/**
 * NFT Data Service
 * Handles all NFT-related data fetching, caching, and analysis
 */
export class NFTDataService extends BaseDataService {
  static serviceType = "nft-data";

  private contextLogger: LoggerWithContext;
  private configService: CentralizedConfigService;
  private errorHandler: ComprehensiveErrorHandler;
  private updateInterval: NodeJS.Timeout | null = null;

  // Cache management
  private curatedNFTsCache: CuratedNFTsCache | null = null;
  private readonly CURATED_NFTS_CACHE_DURATION = 60 * 1000; // 1 minute

  // Curated NFT collections
  private readonly curatedNFTCollections = [
    "bored-ape-yacht-club",
    "cryptopunks",
    "doodles-official",
    "azuki",
    "clonex",
    "meebits",
    "world-of-women-nft",
    "cool-cats-nft",
    "veefriends",
    "loot-for-adventurers",
  ];

  constructor(runtime: IAgentRuntime) {
    super(runtime, "nftData");
    this.contextLogger = new LoggerWithContext(
      generateCorrelationId(),
      "NFTDataService",
    );
    this.configService =
      runtime.getService<CentralizedConfigService>("centralized-config");
    this.errorHandler = new ComprehensiveErrorHandler();
  }

  public get capabilityDescription(): string {
    return "Provides comprehensive NFT market data, collection analytics, and curated insights for top NFT collections";
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info("Starting NFTDataService...");
    const service = new NFTDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info("Stopping NFTDataService...");
    const service = runtime.getService("nft-data") as unknown as NFTDataService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info("Starting NFT data service...");
    await this.startRealTimeUpdates();
  }

  async init() {
    this.contextLogger.info("Initializing NFT data service...");
    await this.updateData();
  }

  async stop(): Promise<void> {
    this.contextLogger.info("Stopping NFT data service...");
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async updateData(): Promise<void> {
    try {
      this.contextLogger.info("Updating NFT data...");
      await this.updateCuratedNFTsData();
      this.contextLogger.info("NFT data update completed");
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "NFTDataService",
        operation: "updateData"
      });
    }
  }

  async forceUpdate(): Promise<void> {
    this.contextLogger.info("Forcing NFT data update...");
    await this.updateData();
  }

  /**
   * Start real-time updates for NFT data
   */
  private async startRealTimeUpdates(): Promise<void> {
    const updateInterval = this.configService.get(
      "services.nftData.updateInterval",
      300000,
    ); // 5 minutes

    this.updateInterval = setInterval(async () => {
      try {
        await this.updateData();
      } catch (error) {
        this.errorHandler.handleError(error, {
          component: "NFTDataService",
          operation: "startRealTimeUpdates"
        });
      }
    }, updateInterval);

    this.contextLogger.info(
      `NFT data updates scheduled every ${updateInterval}ms`,
    );
  }

  /**
   * Update curated NFTs data
   */
  private async updateCuratedNFTsData(): Promise<void> {
    if (this.isCuratedNFTsCacheValid()) {
      this.contextLogger.debug("Using cached curated NFTs data");
      return;
    }

    try {
      const data = await this.fetchCuratedNFTsData();
      if (data) {
        this.curatedNFTsCache = {
          data,
          timestamp: Date.now(),
        };
        this.contextLogger.info("Curated NFTs data updated successfully");
      }
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "NFTDataService",
        operation: "updateCuratedNFTsData"
      });
    }
  }

  /**
   * Check if curated NFTs cache is valid
   */
  private isCuratedNFTsCacheValid(): boolean {
    if (!this.curatedNFTsCache) return false;
    return (
      Date.now() - this.curatedNFTsCache.timestamp <
      this.CURATED_NFTS_CACHE_DURATION
    );
  }

  /**
   * Fetch curated NFTs data
   */
  private async fetchCuratedNFTsData(): Promise<CuratedNFTsData | null> {
    try {
      this.contextLogger.info("Fetching curated NFTs data...");

      const collections: NFTCollectionData[] = [];
      const headers = {
        "X-API-KEY": this.configService.get("apis.opensea.apiKey", ""),
        Accept: "application/json",
      };

      // Fetch data for each curated collection
      for (const collectionSlug of this.curatedNFTCollections) {
        try {
          const collectionData = await this.fetchEnhancedCollectionData(
            collectionSlug,
            headers,
          );
          if (collectionData) {
            collections.push(collectionData);
          }
        } catch (error) {
          this.errorHandler.handleError(error, {
            component: "NFTDataService",
            operation: `fetchCuratedNFTsData.${collectionSlug}`
          });
        }
      }

      if (collections.length === 0) {
        this.contextLogger.warn("No NFT collections data available");
        return null;
      }

      const summary = this.calculateNFTSummary(collections);

      return {
        collections,
        summary,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "NFTDataService",
        operation: "fetchCuratedNFTsData"
      });
      return null;
    }
  }

  /**
   * Fetch enhanced collection data from OpenSea API
   */
  private async fetchEnhancedCollectionData(
    collectionSlug: string,
    headers: any,
  ): Promise<NFTCollectionData | null> {
    try {
      const baseUrl = this.configService.get(
        "apis.opensea.baseUrl",
        "https://api.opensea.io/api/v1",
      );

      // Fetch collection info
      const collectionResponse = await axios.get(
        `${baseUrl}/collection/${collectionSlug}`,
        { headers },
      );
      const collectionInfo = collectionResponse.data.collection;

      // Fetch collection stats
      const statsResponse = await axios.get(
        `${baseUrl}/collection/${collectionSlug}/stats`,
        { headers },
      );
      const statsData = statsResponse.data.stats;

      // Parse collection stats
      const stats = this.parseCollectionStats(statsData);

      // Determine category based on collection name and description
      const category = this.determineCollectionCategory(collectionInfo);

      return {
        slug: collectionSlug,
        collection: collectionInfo,
        stats,
        lastUpdated: new Date(),
        category,
        contractAddress: collectionInfo.primary_asset_contracts?.[0]?.address,
        blockchain: collectionInfo.primary_asset_contracts?.[0]?.chain,
      };
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "NFTDataService",
        operation: `fetchEnhancedCollectionData.${collectionSlug}`
      });
      return null;
    }
  }

  /**
   * Parse collection stats from API response
   */
  private parseCollectionStats(statsData: any): NFTCollectionStats {
    return {
      total_supply: statsData.total_supply || 0,
      num_owners: statsData.num_owners || 0,
      average_price: statsData.average_price || 0,
      floor_price: statsData.floor_price || 0,
      market_cap: statsData.market_cap || 0,
      one_day_volume: statsData.one_day_volume || 0,
      one_day_change: statsData.one_day_change || 0,
      one_day_sales: statsData.one_day_sales || 0,
      seven_day_volume: statsData.seven_day_volume || 0,
      seven_day_change: statsData.seven_day_change || 0,
      seven_day_sales: statsData.seven_day_sales || 0,
      thirty_day_volume: statsData.thirty_day_volume || 0,
      thirty_day_change: statsData.thirty_day_change || 0,
      thirty_day_sales: statsData.thirty_day_sales || 0,
    };
  }

  /**
   * Determine collection category based on metadata
   */
  private determineCollectionCategory(
    collectionInfo: any,
  ): "blue-chip" | "generative-art" | "digital-art" | "pfp" | "utility" {
    const name = collectionInfo.name?.toLowerCase() || "";
    const description = collectionInfo.description?.toLowerCase() || "";

    // Blue-chip collections
    if (
      ["bored ape yacht club", "cryptopunks", "azuki", "clonex"].some((term) =>
        name.includes(term),
      )
    ) {
      return "blue-chip";
    }

    // PFP collections
    if (
      ["pfp", "profile picture", "avatar"].some((term) =>
        description.includes(term),
      )
    ) {
      return "pfp";
    }

    // Generative art
    if (
      ["generative", "algorithmic", "procedural"].some((term) =>
        description.includes(term),
      )
    ) {
      return "generative-art";
    }

    // Utility collections
    if (
      ["utility", "access", "membership", "governance"].some((term) =>
        description.includes(term),
      )
    ) {
      return "utility";
    }

    // Default to digital art
    return "digital-art";
  }

  /**
   * Calculate NFT summary statistics
   */
  private calculateNFTSummary(collections: NFTCollectionData[]): {
    totalVolume24h: number;
    totalMarketCap: number;
    avgFloorPrice: number;
    topPerformers: NFTCollectionData[];
    worstPerformers: NFTCollectionData[];
    totalCollections: number;
  } {
    const totalVolume24h = collections.reduce(
      (sum, collection) => sum + collection.stats.one_day_volume,
      0,
    );
    const totalMarketCap = collections.reduce(
      (sum, collection) => sum + collection.stats.market_cap,
      0,
    );
    const avgFloorPrice =
      collections.reduce(
        (sum, collection) => sum + collection.stats.floor_price,
        0,
      ) / collections.length;

    // Sort by 24h volume change for top/worst performers
    const sortedByPerformance = [...collections].sort(
      (a, b) => b.stats.one_day_change - a.stats.one_day_change,
    );
    const topPerformers = sortedByPerformance.slice(0, 3);
    const worstPerformers = sortedByPerformance.slice(-3).reverse();

    return {
      totalVolume24h,
      totalMarketCap,
      avgFloorPrice,
      topPerformers,
      worstPerformers,
      totalCollections: collections.length,
    };
  }

  /**
   * Get curated NFTs data
   */
  public getCuratedNFTsData(): CuratedNFTsData | null {
    if (!this.curatedNFTsCache) {
      this.contextLogger.warn("No curated NFTs data available");
      return null;
    }
    return this.curatedNFTsCache.data;
  }

  /**
   * Force update curated NFTs data
   */
  public async forceCuratedNFTsUpdate(): Promise<CuratedNFTsData | null> {
    this.contextLogger.info("Forcing curated NFTs data update...");
    this.curatedNFTsCache = null; // Invalidate cache
    await this.updateCuratedNFTsData();
    return this.getCuratedNFTsData();
  }

  /**
   * Get NFT collection by slug
   */
  public getNFTCollection(slug: string): NFTCollectionData | undefined {
    const data = this.getCuratedNFTsData();
    return data?.collections.find((collection) => collection.slug === slug);
  }

  /**
   * Get NFT collections by category
   */
  public getNFTCollectionsByCategory(category: string): NFTCollectionData[] {
    const data = this.getCuratedNFTsData();
    return (
      data?.collections.filter(
        (collection) => collection.category === category,
      ) || []
    );
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    cacheStatus: string;
    lastUpdate: Date | null;
    collectionsCount: number;
    totalVolume24h: number;
    cacheHitRate: number;
  } {
    const data = this.getCuratedNFTsData();
    return {
      cacheStatus: this.isCuratedNFTsCacheValid() ? "valid" : "expired",
      lastUpdate: this.curatedNFTsCache?.timestamp
        ? new Date(this.curatedNFTsCache.timestamp)
        : null,
      collectionsCount: data?.collections.length || 0,
      totalVolume24h: data?.summary.totalVolume24h || 0,
      cacheHitRate: this.isCuratedNFTsCacheValid() ? 100 : 0,
    };
  }
}
