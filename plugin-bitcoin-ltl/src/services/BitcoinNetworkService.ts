import { IAgentRuntime, elizaLogger } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';
import { LoggerWithContext, generateCorrelationId } from '../utils/helpers';
import { handleError, ErrorCategory } from '../utils/comprehensive-error-handling';
import { 
  BlockchainInfoResponse, 
  FearGreedIndexResponse, 
  MempoolSpaceResponse, 
  MempoolFeesResponse,
  MempoolStatsResponse 
} from '../types/api-interfaces';

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

export class BitcoinNetworkService extends BaseDataService {
  static serviceType = 'bitcoin-network';
  
  private contextLogger: LoggerWithContext;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 180000; // 3 minutes
  private readonly MIN_REQUEST_INTERVAL = 3000; // 3 seconds between requests
  
  protected lastRequestTime = 0;
  protected requestQueue: Array<() => Promise<any>> = [];
  protected isProcessingQueue = false;
  protected consecutiveFailures = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  protected backoffUntil = 0;
  
  // API endpoints
  private readonly BLOCKCHAIN_API = 'https://api.blockchain.info';
  private readonly ALTERNATIVE_API = 'https://api.alternative.me';
  private readonly MEMPOOL_API = 'https://mempool.space/api';
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  
  private comprehensiveBitcoinData: ComprehensiveBitcoinData | null = null;
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute cache

  constructor(runtime: IAgentRuntime) {
    super(runtime, 'bitcoinNetwork');
    this.contextLogger = new LoggerWithContext(generateCorrelationId(), 'BitcoinNetworkService');
  }

  public get capabilityDescription(): string {
    return 'Provides comprehensive Bitcoin network data including hash rate, difficulty, mempool, and sentiment analysis';
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info('Starting BitcoinNetworkService...');
    return new BitcoinNetworkService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info('Stopping BitcoinNetworkService...');
    const service = runtime.getService('bitcoin-network') as BitcoinNetworkService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info('BitcoinNetworkService starting...');
    await this.startRealTimeUpdates();
  }

  async init() {
    this.contextLogger.info('BitcoinNetworkService initialized');
    await this.updateData();
  }

  async stop() {
    this.contextLogger.info('BitcoinNetworkService stopping...');
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async updateData(): Promise<void> {
    try {
      this.contextLogger.info('Updating Bitcoin network data...');
      await this.updateBitcoinData();
      this.consecutiveFailures = 0;
    } catch (error) {
      this.consecutiveFailures++;
      this.contextLogger.error('Failed to update Bitcoin network data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        consecutiveFailures: this.consecutiveFailures
      });
      
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        this.backoffUntil = Date.now() + 300000; // 5 minute backoff
        this.contextLogger.warn('Maximum consecutive failures reached, backing off for 5 minutes');
      }
    }
  }

  async forceUpdate(): Promise<void> {
    this.contextLogger.info('Forcing Bitcoin network data update...');
    await this.updateBitcoinData();
  }

  private async startRealTimeUpdates(): Promise<void> {
    this.contextLogger.info('Starting real-time Bitcoin network updates');
    
    // Initial update
    await this.updateData();
    
    // Set up interval for regular updates
    this.updateInterval = setInterval(async () => {
      if (Date.now() < this.backoffUntil) {
        this.contextLogger.debug('Skipping update due to backoff period');
        return;
      }
      await this.updateData();
    }, this.UPDATE_INTERVAL);
  }

  private async updateBitcoinData(): Promise<void> {
    this.contextLogger.debug('Updating comprehensive Bitcoin data...');
    
    try {
      const [priceData, networkData, sentimentData] = await Promise.all([
        this.fetchBitcoinPriceData(),
        this.fetchBitcoinNetworkData(),
        this.fetchBitcoinSentimentData()
      ]);

      this.comprehensiveBitcoinData = {
        price: priceData || { usd: null, change24h: null },
        network: networkData || this.getFallbackNetworkData(),
        sentiment: sentimentData || { fearGreedIndex: null, fearGreedValue: null },
        nodes: { total: null, countries: null }, // Would need additional API call
        lastUpdated: new Date()
      };

      this.contextLogger.info('Bitcoin network data updated successfully', {
        price: this.comprehensiveBitcoinData.price.usd,
        hashRate: this.comprehensiveBitcoinData.network.hashRate,
        mempoolSize: this.comprehensiveBitcoinData.network.mempoolSize
      });
    } catch (error) {
      this.contextLogger.error('Failed to update comprehensive Bitcoin data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async fetchBitcoinPriceData(): Promise<{ usd: number; change24h: number } | null> {
    try {
      this.contextLogger.debug('Fetching Bitcoin price data...');
      
      const response = await this.fetchWithTimeout(
        `${this.COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`,
        { timeout: 10000 }
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as { bitcoin?: { usd?: number; usd_24h_change?: number } };
      
      if (data.bitcoin?.usd) {
        return {
          usd: data.bitcoin.usd,
          change24h: data.bitcoin.usd_24h_change || 0
        };
      }
      
      return null;
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Unknown error'),
        {
          correlationId: this.correlationId,
          component: 'BitcoinNetworkService',
          operation: 'fetchBitcoinPriceData'
        }
      );
      
      this.contextLogger.warn('Failed to fetch Bitcoin price data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async fetchBitcoinNetworkData(): Promise<BitcoinNetworkData | null> {
    try {
      this.contextLogger.debug('Fetching Bitcoin network data...');
      
      // Try multiple sources for redundancy
      const [blockchainData, mempoolData] = await Promise.allSettled([
        this.fetchBlockchainInfoData(),
        this.fetchMempoolNetworkData()
      ]);
      
      const networkData: BitcoinNetworkData = {
        hashRate: null,
        difficulty: null,
        blockHeight: null,
        avgBlockTime: null,
        avgBlockSize: null,
        totalBTC: null,
        marketCap: null,
        nextHalving: { blocks: null, estimatedDate: null },
        mempoolSize: null,
        mempoolFees: { fastestFee: null, halfHourFee: null, economyFee: null },
        mempoolTxs: null,
        miningRevenue: null,
        miningRevenue24h: null,
        lightningCapacity: null,
        lightningChannels: null,
        liquidity: null
      };
      
      // Merge data from successful sources
      if (blockchainData.status === 'fulfilled' && blockchainData.value) {
        Object.assign(networkData, blockchainData.value);
      }
      
      if (mempoolData.status === 'fulfilled' && mempoolData.value) {
        Object.assign(networkData, mempoolData.value);
      }
      
      return networkData;
    } catch (error) {
      this.contextLogger.warn('Failed to fetch Bitcoin network data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async fetchBlockchainInfoData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.BLOCKCHAIN_API}/stats`,
        { timeout: 10000 }
      );
      
      if (!response.ok) {
        throw new Error(`Blockchain.info API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as BlockchainInfoResponse;
      
      return {
        hashRate: data.hash_rate,
        difficulty: data.difficulty,
        blockHeight: data.latest_height,
        mempoolTxs: data.unconfirmed_count,
        // Calculate next halving (every 210,000 blocks)
        nextHalving: {
          blocks: 210000 - (data.latest_height % 210000),
          estimatedDate: this.calculateNextHalvingDate(data.latest_height)
        }
      };
    } catch (error) {
      this.contextLogger.warn('Failed to fetch blockchain.info data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async fetchMempoolNetworkData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      const [mempoolResponse, feesResponse] = await Promise.all([
        this.fetchWithTimeout(`${this.MEMPOOL_API}/mempool`, { timeout: 10000 }),
        this.fetchWithTimeout(`${this.MEMPOOL_API}/v1/fees/recommended`, { timeout: 10000 })
      ]);
      
      if (!mempoolResponse.ok || !feesResponse.ok) {
        throw new Error('Mempool API error');
      }
      
      const mempoolData = await mempoolResponse.json() as MempoolSpaceResponse;
      const feesData = await feesResponse.json() as MempoolFeesResponse;
      
      return {
        mempoolSize: mempoolData.vsize,
        mempoolTxs: mempoolData.count,
        mempoolFees: {
          fastestFee: feesData.fastestFee,
          halfHourFee: feesData.halfHourFee,
          economyFee: feesData.economyFee
        }
      };
    } catch (error) {
      this.contextLogger.warn('Failed to fetch mempool data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async fetchBitcoinSentimentData(): Promise<BitcoinSentimentData | null> {
    try {
      this.contextLogger.debug('Fetching Bitcoin sentiment data...');
      
      const response = await this.fetchWithTimeout(
        `${this.ALTERNATIVE_API}/fng/?limit=1`,
        { timeout: 10000 }
      );
      
      if (!response.ok) {
        throw new Error(`Alternative.me API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as FearGreedIndexResponse;
      
      if (data.data && data.data.length > 0) {
        const latestData = data.data[0];
        return {
          fearGreedIndex: parseInt(latestData.value),
          fearGreedValue: latestData.classification
        };
      }
      
      return null;
    } catch (error) {
      this.contextLogger.warn('Failed to fetch sentiment data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private calculateNextHalvingDate(currentHeight: number): string {
    const blocksUntilHalving = 210000 - (currentHeight % 210000);
    const avgBlockTime = 10; // minutes
    const minutesUntilHalving = blocksUntilHalving * avgBlockTime;
    const halvingDate = new Date(Date.now() + minutesUntilHalving * 60 * 1000);
    return halvingDate.toISOString();
  }

  private getFallbackNetworkData(): BitcoinNetworkData {
    return {
      hashRate: 500000000000, // 500 EH/s estimate
      difficulty: 80000000000000, // Current difficulty estimate
      blockHeight: 800000, // Current block height estimate
      avgBlockTime: 10,
      avgBlockSize: 1500000,
      totalBTC: 19700000,
      marketCap: null,
      nextHalving: { blocks: 50000, estimatedDate: '2028-04-20T00:00:00.000Z' },
      mempoolSize: 50000000,
      mempoolFees: { fastestFee: 10, halfHourFee: 5, economyFee: 1 },
      mempoolTxs: 5000,
      miningRevenue: 9000000,
      miningRevenue24h: 216000000,
      lightningCapacity: 5000000000,
      lightningChannels: 80000,
      liquidity: 2000000000
    };
  }

  private async fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
    const { timeout = 10000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ElizaOS-Bitcoin-Network/1.0',
          ...fetchOptions.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Public getters
  public getComprehensiveBitcoinData(): ComprehensiveBitcoinData | null {
    return this.comprehensiveBitcoinData;
  }

  public getNetworkData(): BitcoinNetworkData | null {
    return this.comprehensiveBitcoinData?.network || null;
  }

  public getSentimentData(): BitcoinSentimentData | null {
    return this.comprehensiveBitcoinData?.sentiment || null;
  }

  public getPriceData(): { usd: number; change24h: number } | null {
    return this.comprehensiveBitcoinData?.price || null;
  }

  public isDataFresh(): boolean {
    if (!this.comprehensiveBitcoinData) return false;
    const age = Date.now() - this.comprehensiveBitcoinData.lastUpdated.getTime();
    return age < this.CACHE_DURATION;
  }
} 