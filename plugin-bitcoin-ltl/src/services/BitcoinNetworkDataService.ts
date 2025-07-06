import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";

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
  static serviceType = "bitcoin-network-data";
  capabilityDescription =
    "Provides comprehensive Bitcoin network data, price information, and sentiment analysis";

  // Bitcoin API endpoints
  private readonly BLOCKCHAIN_API = "https://api.blockchain.info";
  private readonly COINGECKO_API = "https://api.coingecko.com/api/v3";
  private readonly ALTERNATIVE_API = "https://api.alternative.me";
  private readonly MEMPOOL_API = "https://mempool.space/api";

  // Bitcoin data storage
  private comprehensiveBitcoinData: ComprehensiveBitcoinData | null = null;

  constructor(runtime: IAgentRuntime) {
    super(runtime, "bitcoinNetwork");
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("BitcoinNetworkDataService starting...");
    const service = new BitcoinNetworkDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("BitcoinNetworkDataService stopping...");
    const service = runtime.getService("bitcoin-network-data");
    if (service && typeof service.stop === "function") {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    logger.info("BitcoinNetworkDataService starting...");
    await this.updateData();
    logger.info("BitcoinNetworkDataService started successfully");
  }

  async init() {
    logger.info("BitcoinNetworkDataService initialized");
    // Perform initial Bitcoin data fetch
    await this.updateData();
  }

  async stop() {
    logger.info("BitcoinNetworkDataService stopped");
  }

  /**
   * Update Bitcoin network data
   */
  async updateData(): Promise<void> {
    try {
      console.log(
        "[BitcoinNetworkDataService] 🟠 Fetching comprehensive Bitcoin data...",
      );
      this.comprehensiveBitcoinData =
        await this.fetchComprehensiveBitcoinData();

      if (this.comprehensiveBitcoinData) {
        const price = this.comprehensiveBitcoinData.price.usd;
        const change24h = this.comprehensiveBitcoinData.price.change24h;
        const blockHeight = this.comprehensiveBitcoinData.network.blockHeight;
        const hashRate = this.comprehensiveBitcoinData.network.hashRate;
        const difficulty = this.comprehensiveBitcoinData.network.difficulty;
        const fearGreed =
          this.comprehensiveBitcoinData.sentiment.fearGreedIndex;
        const mempoolSize = this.comprehensiveBitcoinData.network.mempoolSize;
        const fastestFee =
          this.comprehensiveBitcoinData.network.mempoolFees?.fastestFee;
        const nextHalvingBlocks =
          this.comprehensiveBitcoinData.network.nextHalving?.blocks;

        console.log(
          `[BitcoinNetworkDataService] 🟠 Bitcoin Price: $${price?.toLocaleString()} (${change24h && change24h > 0 ? "+" : ""}${change24h?.toFixed(2)}%)`,
        );
        console.log(
          `[BitcoinNetworkDataService] 🟠 Network Hash Rate: ${hashRate ? (hashRate / 1e18).toFixed(2) + " EH/s" : "N/A"}`,
        );
        console.log(
          `[BitcoinNetworkDataService] 🟠 Block Height: ${blockHeight?.toLocaleString()}`,
        );
        console.log(
          `[BitcoinNetworkDataService] 🟠 Network Difficulty: ${difficulty ? (difficulty / 1e12).toFixed(2) + "T" : "N/A"}`,
        );
        console.log(
          `[BitcoinNetworkDataService] 🟠 Mempool Size: ${mempoolSize ? (mempoolSize / 1e6).toFixed(2) + "MB" : "N/A"}`,
        );
        console.log(
          `[BitcoinNetworkDataService] 🟠 Fastest Fee: ${fastestFee ? fastestFee + " sat/vB" : "N/A"}`,
        );
        console.log(
          `[BitcoinNetworkDataService] 🟠 Fear & Greed Index: ${fearGreed} (${this.comprehensiveBitcoinData.sentiment.fearGreedValue})`,
        );
        console.log(
          `[BitcoinNetworkDataService] 🟠 Next Halving: ${nextHalvingBlocks ? nextHalvingBlocks.toLocaleString() + " blocks" : "N/A"}`,
        );
        console.log(
          `[BitcoinNetworkDataService] 🟠 Bitcoin data update complete`,
        );
      } else {
        console.warn(
          "[BitcoinNetworkDataService] ⚠️ Failed to fetch Bitcoin data - APIs may be down",
        );
      }
    } catch (error) {
      console.error(
        "[BitcoinNetworkDataService] ❌ Error updating Bitcoin data:",
        error,
      );
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
      const [priceData, networkData, sentimentData, mempoolData] =
        await Promise.all([
          this.fetchBitcoinPriceData(),
          this.fetchBitcoinNetworkData(),
          this.fetchBitcoinSentimentData(),
          this.fetchBitcoinMempoolData(),
        ]);

      // Combine all data
      const response: ComprehensiveBitcoinData = {
        price: {
          usd: priceData?.usd || null,
          change24h: priceData?.change24h || null,
        },
        network: {
          hashRate: networkData?.hashRate || null,
          difficulty: networkData?.difficulty || null,
          blockHeight: networkData?.blockHeight || null,
          avgBlockTime: networkData?.avgBlockTime || null,
          avgBlockSize: networkData?.avgBlockSize || null,
          totalBTC: networkData?.totalBTC || null,
          marketCap: networkData?.marketCap || null,
          nextHalving: networkData?.nextHalving || {
            blocks: null,
            estimatedDate: null,
          },
          mempoolSize: mempoolData?.mempoolSize || null,
          mempoolFees: mempoolData?.mempoolFees || {
            fastestFee: null,
            halfHourFee: null,
            economyFee: null,
          },
          mempoolTxs: mempoolData?.mempoolTxs || null,
          miningRevenue: mempoolData?.miningRevenue || null,
          miningRevenue24h: mempoolData?.miningRevenue24h || null,
          lightningCapacity: null,
          lightningChannels: null,
          liquidity: null,
        },
        sentiment: {
          fearGreedIndex: sentimentData?.fearGreedIndex || null,
          fearGreedValue: sentimentData?.fearGreedValue || null,
        },
        nodes: {
          total: null,
          countries: null,
        },
        lastUpdated: new Date(),
      };

      return response;
    } catch (error) {
      console.error("Error fetching comprehensive Bitcoin data:", error);
      return null;
    }
  }

  /**
   * Fetch Bitcoin price data from CoinGecko
   */
  private async fetchBitcoinPriceData(): Promise<{
    usd: number;
    change24h: number;
  } | null> {
    try {
      const data = await this.makeQueuedRequest(async () => {
        const response = await fetch(
          `${this.COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(15000),
          },
        );

        if (!response.ok) {
          if (response.status === 429) {
            // Handle rate limiting with exponential backoff
            const retryAfter = response.headers.get('Retry-After');
            const backoffTime = retryAfter ? parseInt(retryAfter) * 1000 : 30000; // Default 30s
            console.warn(`[BitcoinNetworkDataService] CoinGecko rate limited, backing off for ${backoffTime}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            throw new Error(`HTTP 429: Rate limited, retry after ${backoffTime}ms`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      });

      return {
        usd: Number(data.bitcoin?.usd) || null,
        change24h: Number(data.bitcoin?.usd_24h_change) || null,
      };
    } catch (error) {
      console.error("Error fetching Bitcoin price data:", error);
      return null;
    }
  }

  /**
   * Fetch Bitcoin network data from multiple sources for accuracy
   */
  private async fetchBitcoinNetworkData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      // Fetch from multiple sources in parallel for better accuracy
      const [blockchainData, mempoolStats] = await Promise.all(
        [
          this.fetchBlockchainInfoData(),
          this.fetchMempoolNetworkData(),
        ],
      );

      // Use the most recent and accurate data sources
      // Priority: Mempool.space (most reliable) > Blockchain.info
      const hashRate =
        mempoolStats?.hashRate ||
        blockchainData?.hashRate;
      const difficulty =
        mempoolStats?.difficulty ||
        blockchainData?.difficulty;
      const blockHeight =
        mempoolStats?.blockHeight ||
        blockchainData?.blockHeight;

      console.log(
        `[BitcoinNetworkDataService] 🔍 Hashrate sources - Mempool: ${mempoolStats?.hashRate ? (mempoolStats.hashRate / 1e18).toFixed(2) + " EH/s" : "N/A"}, Blockchain: ${blockchainData?.hashRate ? (blockchainData.hashRate / 1e18).toFixed(2) + " EH/s" : "N/A"}`,
      );
      console.log(
        `[BitcoinNetworkDataService] 🎯 Selected hashrate: ${hashRate ? (hashRate / 1e18).toFixed(2) + " EH/s" : "N/A"}`,
      );

      // Calculate next halving using most reliable block height
      const currentBlock = blockHeight || 0;
      const currentHalvingEpoch = Math.floor(currentBlock / 210000);
      const nextHalvingBlock = (currentHalvingEpoch + 1) * 210000;
      const blocksUntilHalving = nextHalvingBlock - currentBlock;

      // Estimate halving date based on average block time (10 minutes target)
      const avgBlockTime = blockchainData?.avgBlockTime || 10;
      const minutesUntilHalving = blocksUntilHalving * avgBlockTime;
      const halvingDate = new Date(
        Date.now() + minutesUntilHalving * 60 * 1000,
      );

      return {
        hashRate: hashRate,
        difficulty: difficulty,
        blockHeight: blockHeight,
        avgBlockTime: blockchainData?.avgBlockTime || avgBlockTime,
        avgBlockSize: blockchainData?.avgBlockSize || null,
        totalBTC: blockchainData?.totalBTC || null,
        marketCap: blockchainData?.marketCap || null,
        nextHalving: {
          blocks: blocksUntilHalving,
          estimatedDate: halvingDate.toISOString(),
        },
      };
    } catch (error) {
      console.error("Error fetching Bitcoin network data:", error);
      return null;
    }
  }

  /**
   * Fetch from Blockchain.info API
   */
  private async fetchBlockchainInfoData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      const response = await fetch(`${this.BLOCKCHAIN_API}/stats`, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();

        return {
          hashRate: Number(data.hash_rate) * 1e9, // Convert from GH/s to H/s
          difficulty: Number(data.difficulty),
          blockHeight: Number(data.n_blocks_total),
          avgBlockTime: Number(data.minutes_between_blocks),
          avgBlockSize: Number(data.blocks_size),
          totalBTC: Number(data.totalbc) / 1e8,
          marketCap:
            Number(data.market_price_usd) * (Number(data.totalbc) / 1e8),
        };
      } else if (response.status === 429) {
        console.warn(`[BitcoinNetworkDataService] Blockchain.info rate limited (429)`);
        return null;
      } else {
        console.warn(`[BitcoinNetworkDataService] Blockchain.info API error: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error("Error fetching Blockchain.info data:", error);
      return null;
    }
  }

  /**
   * Fetch network data from Mempool.space API (most accurate)
   */
  private async fetchMempoolNetworkData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      const [hashRateResponse, difficultyResponse, blockHeightResponse] =
        await Promise.all([
          fetch(`${this.MEMPOOL_API}/v1/mining/hashrate/1m`, {
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }),
          fetch(`${this.MEMPOOL_API}/v1/difficulty-adjustment`, {
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }),
          fetch(`${this.MEMPOOL_API}/blocks/tip/height`, {
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }),
        ]);

      const results: Partial<BitcoinNetworkData> = {};

      // Get current hashrate (most recent data point from 1-month history)
      if (hashRateResponse.ok) {
        const hashRateData = await hashRateResponse.json();
        if (hashRateData.currentHashrate) {
          results.hashRate = Number(hashRateData.currentHashrate);
        } else if (
          hashRateData.hashrates &&
          hashRateData.hashrates.length > 0
        ) {
          // Get the most recent hashrate from the array
          const latestHashrate =
            hashRateData.hashrates[hashRateData.hashrates.length - 1];
          if (latestHashrate && latestHashrate.hashrateAvg) {
            results.hashRate = Number(latestHashrate.hashrateAvg);
          }
        }
      } else if (hashRateResponse.status === 429) {
        console.warn(`[BitcoinNetworkDataService] Mempool.space hashrate rate limited (429)`);
      }

      // Get current difficulty
      if (difficultyResponse.ok) {
        const difficultyData = await difficultyResponse.json();
        if (difficultyData.currentDifficulty) {
          results.difficulty = Number(difficultyData.currentDifficulty);
        } else if (difficultyData.difficulty) {
          results.difficulty = Number(difficultyData.difficulty);
        }
      } else if (difficultyResponse.status === 429) {
        console.warn(`[BitcoinNetworkDataService] Mempool.space difficulty rate limited (429)`);
      }

      // Get current block height
      if (blockHeightResponse.ok) {
        const blockHeight = await blockHeightResponse.json();
        if (typeof blockHeight === "number") {
          results.blockHeight = blockHeight;
        }
      } else if (blockHeightResponse.status === 429) {
        console.warn(`[BitcoinNetworkDataService] Mempool.space block height rate limited (429)`);
      }

      return Object.keys(results).length > 0 ? results : null;
    } catch (error) {
      console.error("Error fetching Mempool.space network data:", error);
      return null;
    }
  }



  /**
   * Fetch Bitcoin sentiment data (Fear & Greed Index)
   */
  private async fetchBitcoinSentimentData(): Promise<BitcoinSentimentData | null> {
    try {
      const response = await fetch(`${this.ALTERNATIVE_API}/fng/`, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        return {
          fearGreedIndex: Number(data.data[0].value),
          fearGreedValue: data.data[0].value_classification,
        };
      } else if (response.status === 429) {
        console.warn(`[BitcoinNetworkDataService] Alternative.me sentiment rate limited (429)`);
        return null;
      } else {
        console.warn(`[BitcoinNetworkDataService] Alternative.me API error: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error("Error fetching Bitcoin sentiment data:", error);
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
        fetch(`${this.MEMPOOL_API}/mempool`, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        }),
        fetch(`${this.MEMPOOL_API}/v1/fees/recommended`, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        }),
      ]);

      if (!mempoolResponse.ok || !feesResponse.ok) {
        if (mempoolResponse.status === 429 || feesResponse.status === 429) {
          console.warn(`[BitcoinNetworkDataService] Mempool.space mempool data rate limited (429)`);
        } else {
          console.warn(`[BitcoinNetworkDataService] Mempool.space mempool data API error: ${mempoolResponse.status}, ${feesResponse.status}`);
        }
        return null;
      }

      const [mempoolData, feesData] = await Promise.all([
        mempoolResponse.json(),
        feesResponse.json(),
      ]);

      return {
        mempoolSize: mempoolData.vsize || null, // Virtual size in bytes
        mempoolTxs: mempoolData.count || null, // Number of transactions
        mempoolFees: {
          fastestFee: feesData.fastestFee || null,
          halfHourFee: feesData.halfHourFee || null,
          economyFee: feesData.economyFee || null,
        },
        miningRevenue: mempoolData.total_fee || null, // Total fees in satoshis
        miningRevenue24h: null, // We'll need another endpoint for this
      };
    } catch (error) {
      console.error("Error fetching Bitcoin mempool data:", error);
      return null;
    }
  }
}
