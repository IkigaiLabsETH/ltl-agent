import { IAgentRuntime, logger } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';

// Bitcoin-specific interfaces (extracted from RealTimeDataService)
export interface BitcoinNetworkData {
  hashRate: number | null;
  difficulty: number | null;
  blockHeight: number | null;
  avgBlockTime: number | null;
  avgBlockSize: number | null;
  totalBTC: number | null;
  marketCap: number | null;
  nextHalving: {
    blocks: number | null;
    estimatedDate: string | null;
  };
  mempoolSize: number | null;
  mempoolFees: {
    fastestFee: number | null;
    halfHourFee: number | null;
    economyFee: number | null;
  };
  mempoolTxs: number | null;
  miningRevenue: number | null;
  miningRevenue24h: number | null;
  lightningCapacity: number | null;
  lightningChannels: number | null;
  liquidity: number | null;
}

export interface BitcoinSentimentData {
  fearGreedIndex: number | null;
  fearGreedValue: string | null;
}

export interface BitcoinNodesData {
  total: number | null;
  countries: number | null;
}

export interface ComprehensiveBitcoinData {
  price: {
    usd: number | null;
    change24h: number | null;
  };
  network: BitcoinNetworkData;
  sentiment: BitcoinSentimentData;
  nodes: BitcoinNodesData;
  lastUpdated: Date;
}

export class BitcoinNetworkDataService extends BaseDataService {
  static serviceType = 'bitcoin-network-data';
  capabilityDescription = 'Provides comprehensive Bitcoin network data, price information, and sentiment analysis';
  
  // Bitcoin API endpoints
  private readonly BLOCKCHAIN_API = 'https://api.blockchain.info';
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly ALTERNATIVE_API = 'https://api.alternative.me';
  private readonly MEMPOOL_API = 'https://mempool.space/api';
  
  // Bitcoin data storage
  private comprehensiveBitcoinData: ComprehensiveBitcoinData | null = null;

  static async start(runtime: IAgentRuntime) {
    logger.info('BitcoinNetworkDataService starting...');
    const service = new BitcoinNetworkDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('BitcoinNetworkDataService stopping...');
    const service = runtime.getService('bitcoin-network-data');
    if (service && typeof service.stop === 'function') {
      await service.stop();
    }
  }

  async init() {
    logger.info('BitcoinNetworkDataService initialized');
    // Perform initial Bitcoin data fetch
    await this.updateData();
  }

  async stop() {
    logger.info('BitcoinNetworkDataService stopped');
  }

  /**
   * Update Bitcoin network data
   */
  async updateData(): Promise<void> {
    try {
      console.log('[BitcoinNetworkDataService] 🟠 Fetching comprehensive Bitcoin data...');
      this.comprehensiveBitcoinData = await this.fetchComprehensiveBitcoinData();
      
      if (this.comprehensiveBitcoinData) {
        const price = this.comprehensiveBitcoinData.price.usd;
        const change24h = this.comprehensiveBitcoinData.price.change24h;
        const blockHeight = this.comprehensiveBitcoinData.network.blockHeight;
        const hashRate = this.comprehensiveBitcoinData.network.hashRate;
        const difficulty = this.comprehensiveBitcoinData.network.difficulty;
        const fearGreed = this.comprehensiveBitcoinData.sentiment.fearGreedIndex;
        const mempoolSize = this.comprehensiveBitcoinData.network.mempoolSize;
        const fastestFee = this.comprehensiveBitcoinData.network.mempoolFees?.fastestFee;
        const nextHalvingBlocks = this.comprehensiveBitcoinData.network.nextHalving?.blocks;
        
        console.log(`[BitcoinNetworkDataService] 🟠 Bitcoin Price: $${price?.toLocaleString()} (${change24h && change24h > 0 ? '+' : ''}${change24h?.toFixed(2)}%)`);
        console.log(`[BitcoinNetworkDataService] 🟠 Network Hash Rate: ${hashRate ? (hashRate / 1e18).toFixed(2) + ' EH/s' : 'N/A'}`);
        console.log(`[BitcoinNetworkDataService] 🟠 Block Height: ${blockHeight?.toLocaleString()}`);
        console.log(`[BitcoinNetworkDataService] 🟠 Network Difficulty: ${difficulty ? (difficulty / 1e12).toFixed(2) + 'T' : 'N/A'}`);
        console.log(`[BitcoinNetworkDataService] 🟠 Mempool Size: ${mempoolSize ? (mempoolSize / 1e6).toFixed(2) + 'MB' : 'N/A'}`);
        console.log(`[BitcoinNetworkDataService] 🟠 Fastest Fee: ${fastestFee ? fastestFee + ' sat/vB' : 'N/A'}`);
        console.log(`[BitcoinNetworkDataService] 🟠 Fear & Greed Index: ${fearGreed} (${this.comprehensiveBitcoinData.sentiment.fearGreedValue})`);
        console.log(`[BitcoinNetworkDataService] 🟠 Next Halving: ${nextHalvingBlocks ? nextHalvingBlocks.toLocaleString() + ' blocks' : 'N/A'}`);
        console.log(`[BitcoinNetworkDataService] 🟠 Bitcoin data update complete`);
      } else {
        console.warn('[BitcoinNetworkDataService] ⚠️ Failed to fetch Bitcoin data - APIs may be down');
      }
    } catch (error) {
      console.error('[BitcoinNetworkDataService] ❌ Error updating Bitcoin data:', error);
    }
  }

  /**
   * Force update Bitcoin data
   */
  async forceUpdate(): Promise<ComprehensiveBitcoinData | null> {
    await this.updateData();
    return this.comprehensiveBitcoinData;
  }

  /**
   * Get comprehensive Bitcoin data
   */
  getComprehensiveBitcoinData(): ComprehensiveBitcoinData | null {
    return this.comprehensiveBitcoinData;
  }

  /**
   * Fetch comprehensive Bitcoin data from multiple APIs
   */
  private async fetchComprehensiveBitcoinData(): Promise<ComprehensiveBitcoinData | null> {
    try {
      // Fetch all data in parallel
      const [priceData, networkData, sentimentData, mempoolData] = await Promise.all([
        this.fetchBitcoinPriceData(),
        this.fetchBitcoinNetworkData(),
        this.fetchBitcoinSentimentData(),
        this.fetchBitcoinMempoolData()
      ]);

      // Combine all data
      const response: ComprehensiveBitcoinData = {
        price: {
          usd: priceData?.usd || null,
          change24h: priceData?.change24h || null
        },
        network: {
          hashRate: networkData?.hashRate || null,
          difficulty: networkData?.difficulty || null,
          blockHeight: networkData?.blockHeight || null,
          avgBlockTime: networkData?.avgBlockTime || null,
          avgBlockSize: networkData?.avgBlockSize || null,
          totalBTC: networkData?.totalBTC || null,
          marketCap: networkData?.marketCap || null,
          nextHalving: networkData?.nextHalving || { blocks: null, estimatedDate: null },
          mempoolSize: mempoolData?.mempoolSize || null,
          mempoolFees: mempoolData?.mempoolFees || { fastestFee: null, halfHourFee: null, economyFee: null },
          mempoolTxs: mempoolData?.mempoolTxs || null,
          miningRevenue: mempoolData?.miningRevenue || null,
          miningRevenue24h: mempoolData?.miningRevenue24h || null,
          lightningCapacity: null,
          lightningChannels: null,
          liquidity: null
        },
        sentiment: {
          fearGreedIndex: sentimentData?.fearGreedIndex || null,
          fearGreedValue: sentimentData?.fearGreedValue || null
        },
        nodes: {
          total: null,
          countries: null
        },
        lastUpdated: new Date()
      };

      return response;
    } catch (error) {
      console.error('Error fetching comprehensive Bitcoin data:', error);
      return null;
    }
  }

  /**
   * Fetch Bitcoin price data from CoinGecko
   */
  private async fetchBitcoinPriceData(): Promise<{ usd: number; change24h: number } | null> {
    try {
      const data = await this.makeQueuedRequest(async () => {
        return await this.fetchWithRetry(
          `${this.COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`,
          {
            headers: { 'Accept': 'application/json' }
          }
        );
      });
      
      return {
        usd: Number(data.bitcoin?.usd) || null,
        change24h: Number(data.bitcoin?.usd_24h_change) || null
      };
    } catch (error) {
      console.error('Error fetching Bitcoin price data:', error);
      return null;
    }
  }

  /**
   * Fetch Bitcoin network data from Blockchain.info
   */
  private async fetchBitcoinNetworkData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      const response = await fetch(`${this.BLOCKCHAIN_API}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Calculate next halving
        const currentBlock = Number(data.n_blocks_total);
        const currentHalvingEpoch = Math.floor(currentBlock / 210000);
        const nextHalvingBlock = (currentHalvingEpoch + 1) * 210000;
        const blocksUntilHalving = nextHalvingBlock - currentBlock;
        
        // Estimate halving date based on average block time
        const avgBlockTime = Number(data.minutes_between_blocks);
        const minutesUntilHalving = blocksUntilHalving * avgBlockTime;
        const halvingDate = new Date(Date.now() + minutesUntilHalving * 60 * 1000);

        return {
          hashRate: Number(data.hash_rate),
          difficulty: Number(data.difficulty),
          blockHeight: Number(data.n_blocks_total),
          avgBlockTime: Number(data.minutes_between_blocks),
          avgBlockSize: Number(data.blocks_size),
          totalBTC: Number(data.totalbc) / 1e8,
          marketCap: Number(data.market_price_usd) * (Number(data.totalbc) / 1e8),
          nextHalving: {
            blocks: blocksUntilHalving,
            estimatedDate: halvingDate.toISOString()
          }
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching Bitcoin network data:', error);
      return null;
    }
  }

  /**
   * Fetch Bitcoin sentiment data (Fear & Greed Index)
   */
  private async fetchBitcoinSentimentData(): Promise<BitcoinSentimentData | null> {
    try {
      const response = await fetch(`${this.ALTERNATIVE_API}/fng/`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          fearGreedIndex: Number(data.data[0].value),
          fearGreedValue: data.data[0].value_classification
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching Bitcoin sentiment data:', error);
      return null;
    }
  }

  /**
   * Fetch Bitcoin mempool data from Mempool.space
   */
  private async fetchBitcoinMempoolData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      // Fetch mempool data in parallel
      const [mempoolResponse, feesResponse] = await Promise.all([
        fetch(`${this.MEMPOOL_API}/mempool`),
        fetch(`${this.MEMPOOL_API}/v1/fees/recommended`)
      ]);

      if (!mempoolResponse.ok || !feesResponse.ok) {
        throw new Error('Failed to fetch mempool data');
      }

      const [mempoolData, feesData] = await Promise.all([
        mempoolResponse.json(),
        feesResponse.json()
      ]);

      return {
        mempoolSize: mempoolData.vsize || null,  // Virtual size in bytes
        mempoolTxs: mempoolData.count || null,   // Number of transactions
        mempoolFees: {
          fastestFee: feesData.fastestFee || null,
          halfHourFee: feesData.halfHourFee || null,
          economyFee: feesData.economyFee || null
        },
        miningRevenue: mempoolData.total_fee || null,  // Total fees in satoshis
        miningRevenue24h: null  // We'll need another endpoint for this
      };
    } catch (error) {
      console.error('Error fetching Bitcoin mempool data:', error);
      return null;
    }
  }
} 