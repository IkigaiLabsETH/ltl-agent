import { ElizaOSErrorHandler, LoggerWithContext, generateCorrelationId } from "./index";

/**
 * API Configuration for Bitcoin Intelligence Services
 */
export interface APIConfig {
  coingecko: {
    baseUrl: string;
    apiKey?: string;
    rateLimit: number; // requests per minute
  };
  blockchain: {
    baseUrl: string;
    apiKey?: string;
    rateLimit: number;
  };
  mempool: {
    baseUrl: string;
    rateLimit: number;
  };
  alternative: {
    baseUrl: string;
    rateLimit: number;
  };
  glassnode: {
    baseUrl: string;
    apiKey?: string;
    rateLimit: number;
  };
  yahooFinance: {
    baseUrl: string;
    rateLimit: number;
  };
  alphaVantage: {
    baseUrl: string;
    apiKey?: string;
    rateLimit: number;
  };
  fred: {
    baseUrl: string;
    apiKey?: string;
    rateLimit: number;
  };
}

/**
 * Default API Configuration
 */
export const DEFAULT_API_CONFIG: APIConfig = {
  coingecko: {
    baseUrl: "https://api.coingecko.com/api/v3",
    rateLimit: 50 // Free tier limit
  },
  blockchain: {
    baseUrl: "https://api.blockchain.info",
    rateLimit: 100
  },
  mempool: {
    baseUrl: "https://mempool.space/api",
    rateLimit: 200
  },
  alternative: {
    baseUrl: "https://api.alternative.me",
    rateLimit: 100
  },
  glassnode: {
    baseUrl: "https://api.glassnode.com/v1/metrics",
    rateLimit: 30
  },
  yahooFinance: {
    baseUrl: "https://query1.finance.yahoo.com/v8/finance/chart",
    rateLimit: 100
  },
  alphaVantage: {
    baseUrl: "https://www.alphavantage.co/query",
    rateLimit: 5 // Free tier limit
  },
  fred: {
    baseUrl: "https://api.stlouisfed.org/fred/series/observations",
    rateLimit: 120
  }
};

/**
 * Rate Limiter for API calls
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, number> = new Map();

  constructor(config: APIConfig) {
    this.limits.set('coingecko', config.coingecko.rateLimit);
    this.limits.set('blockchain', config.blockchain.rateLimit);
    this.limits.set('mempool', config.mempool.rateLimit);
    this.limits.set('alternative', config.alternative.rateLimit);
    this.limits.set('glassnode', config.glassnode.rateLimit);
    this.limits.set('yahooFinance', config.yahooFinance.rateLimit);
    this.limits.set('alphaVantage', config.alphaVantage.rateLimit);
    this.limits.set('fred', config.fred.rateLimit);
  }

  async checkRateLimit(apiName: string): Promise<boolean> {
    const limit = this.limits.get(apiName) || 100;
    const now = Date.now();
    const window = 60 * 1000; // 1 minute window

    if (!this.requests.has(apiName)) {
      this.requests.set(apiName, []);
    }

    const requests = this.requests.get(apiName)!;
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < window);
    this.requests.set(apiName, recentRequests);

    if (recentRequests.length >= limit) {
      return false; // Rate limit exceeded
    }

    recentRequests.push(now);
    return true;
  }

  async waitForRateLimit(apiName: string): Promise<void> {
    while (!(await this.checkRateLimit(apiName))) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }
  }
}

/**
 * Enhanced fetch with timeout and retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  timeout: number = 10000
): Promise<Response> {
  const contextLogger = new LoggerWithContext(generateCorrelationId(), "APIUtils");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Bitcoin-Intelligence-Service/1.0',
          'Accept': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      if (response.status === 429) {
        // Rate limited
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        contextLogger.warn(`Rate limited, waiting ${waitTime}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (response.status >= 500 && attempt < retries) {
        // Server error, retry
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        contextLogger.warn(`Server error ${response.status}, retrying in ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Don't retry on client errors (4xx)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        contextLogger.warn(`Request timeout, retrying (attempt ${attempt}/${retries})`);
        continue;
      }

      const waitTime = Math.pow(2, attempt) * 1000;
      contextLogger.warn(`Request failed, retrying in ${waitTime}ms: ${error instanceof Error ? error.message : String(error)}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error(`Failed after ${retries} attempts`);
}

/**
 * API Client for Bitcoin Intelligence Services
 */
export class BitcoinAPIClient {
  private config: APIConfig;
  private rateLimiter: RateLimiter;
  private contextLogger: LoggerWithContext;

  constructor(config: APIConfig = DEFAULT_API_CONFIG) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config);
    this.contextLogger = new LoggerWithContext(generateCorrelationId(), "BitcoinAPIClient");
  }

  /**
   * CoinGecko API methods
   */
  async getBitcoinPrice(): Promise<number> {
    await this.rateLimiter.waitForRateLimit('coingecko');
    
    const url = `${this.config.coingecko.baseUrl}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`;
    
    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();
      
      if (data.bitcoin && data.bitcoin.usd) {
        return data.bitcoin.usd;
      }
      
      throw new Error('Invalid response format from CoinGecko');
    } catch (error) {
      this.contextLogger.error('Error fetching Bitcoin price from CoinGecko:', error);
      throw error;
    }
  }

  async getBitcoinMarketData(): Promise<{
    price: number;
    marketCap: number;
    volume24h: number;
    priceChange24h: number;
    dominance: number;
  }> {
    await this.rateLimiter.waitForRateLimit('coingecko');
    
    const url = `${this.config.coingecko.baseUrl}/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    
    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();
      
      return {
        price: data.market_data.current_price.usd,
        marketCap: data.market_data.market_cap.usd,
        volume24h: data.market_data.total_volume.usd,
        priceChange24h: data.market_data.price_change_percentage_24h,
        dominance: data.market_data.market_cap_percentage || 0
      };
    } catch (error: any) {
      if (error instanceof Response) {
        let body = '';
        try { body = await error.text(); } catch {}
        this.contextLogger.error('Error fetching Bitcoin market data from CoinGecko:', {
          status: error.status,
          statusText: error.statusText,
          body,
        });
      } else {
        this.contextLogger.error('Error fetching Bitcoin market data from CoinGecko:', error);
      }
      throw error;
    }
  }

  async getAltcoinData(coinIds: string[]): Promise<any[]> {
    await this.rateLimiter.waitForRateLimit('coingecko');
    
    const ids = coinIds.join(',');
    const url = `${this.config.coingecko.baseUrl}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d`;
    
    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();
      
      return data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        total_volume: coin.total_volume,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        price_change_percentage_7d: coin.price_change_percentage_7d,
        price_change_percentage_30d: coin.price_change_percentage_30d
      }));
    } catch (error) {
      this.contextLogger.error('Error fetching altcoin data from CoinGecko:', error);
      throw error;
    }
  }

  /**
   * Blockchain.info API methods
   */
  async getBlockchainInfo(): Promise<{
    hashRate: number;
    difficulty: number;
    blockHeight: number;
    avgBlockTime: number;
    avgBlockSize: number;
    totalBTC: number;
    miningRevenue: number;
    miningRevenue24h: number;
    nextHalvingBlocks: number;
    nextHalvingDate: string;
    nextHalvingDays: number;
    totalNodes: number;
    nodeCountries: number;
  }> {
    await this.rateLimiter.waitForRateLimit('blockchain');
    
    const url = `${this.config.blockchain.baseUrl}/stats`;
    
    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();
      
      // Calculate next halving
      const currentHeight = data.n_blocks_total;
      const blocksUntilHalving = 210000 - (currentHeight % 210000);
      const avgBlockTime = 600; // 10 minutes in seconds
      const daysUntilHalving = Math.floor((blocksUntilHalving * avgBlockTime) / (24 * 60 * 60));
      const halvingDate = new Date(Date.now() + daysUntilHalving * 24 * 60 * 60 * 1000);
      
      return {
        hashRate: data.hash_rate * 1e12, // Convert to hashes
        difficulty: data.difficulty,
        blockHeight: data.n_blocks_total,
        avgBlockTime: data.avg_block_time || 600,
        avgBlockSize: data.avg_block_size || 0,
        totalBTC: data.n_btc_mined,
        miningRevenue: data.mining_revenue_usd || 0,
        miningRevenue24h: data.mining_revenue_24h_usd || 0,
        nextHalvingBlocks: blocksUntilHalving,
        nextHalvingDate: halvingDate.toISOString(),
        nextHalvingDays: daysUntilHalving,
        totalNodes: data.n_nodes || 0,
        nodeCountries: data.n_countries || 0
      };
    } catch (error) {
      this.contextLogger.error('Error fetching blockchain info:', error);
      throw error;
    }
  }

  /**
   * Mempool.space API methods
   */
  async getMempoolData(): Promise<{
    mempoolSize: number;
    mempoolTxs: number;
    fastestFee: number;
    halfHourFee: number;
    economyFee: number;
  }> {
    await this.rateLimiter.waitForRateLimit('mempool');
    
    try {
      const [feesResponse, mempoolResponse] = await Promise.all([
        fetchWithRetry(`${this.config.mempool.baseUrl}/v1/fees/recommended`),
        fetchWithRetry(`${this.config.mempool.baseUrl}/v1/fees/mempool-blocks`)
      ]);
      
      const feesData = await feesResponse.json();
      const mempoolData = await mempoolResponse.json();
      
      // Calculate total mempool size and transaction count
      const totalSize = mempoolData.reduce((sum: number, block: any) => sum + block.nTx, 0);
      const totalWeight = mempoolData.reduce((sum: number, block: any) => sum + block.totalWeight, 0);
      
      return {
        mempoolSize: totalWeight / 4, // Convert weight to virtual bytes
        mempoolTxs: totalSize,
        fastestFee: feesData.fastestFee,
        halfHourFee: feesData.halfHourFee,
        economyFee: feesData.economyFee
      };
    } catch (error) {
      this.contextLogger.error('Error fetching mempool data:', error);
      throw error;
    }
  }

  /**
   * Alternative.me API methods (Fear & Greed Index)
   */
  async getFearGreedIndex(): Promise<{
    index: number;
    value: string;
  }> {
    await this.rateLimiter.waitForRateLimit('alternative');
    
    const url = `${this.config.alternative.baseUrl}/fng/?limit=1`;
    
    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const latest = data.data[0];
        return {
          index: parseInt(latest.value),
          value: latest.value_classification
        };
      }
      
      throw new Error('Invalid response format from Alternative.me');
    } catch (error) {
      this.contextLogger.error('Error fetching Fear & Greed Index:', error);
      throw error;
    }
  }

  /**
   * Yahoo Finance API methods
   */
  async getStockData(symbol: string): Promise<{
    price: number;
    change: number;
    changePercent: number;
  }> {
    await this.rateLimiter.waitForRateLimit('yahooFinance');
    
    const url = `${this.config.yahooFinance.baseUrl}/${symbol}?interval=1d&range=5d`;
    
    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();
      
      if (data.chart && data.chart.result && data.chart.result.length > 0) {
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];
        
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        return {
          price: currentPrice,
          change: change,
          changePercent: changePercent
        };
      }
      
      throw new Error('Invalid response format from Yahoo Finance');
    } catch (error) {
      this.contextLogger.error(`Error fetching stock data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Alpha Vantage API methods (for macro indicators)
   */
  async getDollarIndex(): Promise<number> {
    await this.rateLimiter.waitForRateLimit('alphaVantage');
    
    if (!this.config.alphaVantage.apiKey) {
      // Return a reasonable default value when API key is not available
      this.contextLogger.warn('Alpha Vantage API key not provided, using default DXY value');
      return 104.2; // Default DXY value
    }
    
    const url = `${this.config.alphaVantage.baseUrl}?function=FX_DAILY&from_symbol=USD&to_symbol=JPY&apikey=${this.config.alphaVantage.apiKey}`;
    
    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();
      
      if (data['Time Series FX (Daily)']) {
        const dates = Object.keys(data['Time Series FX (Daily)']).sort().reverse();
        const latest = data['Time Series FX (Daily)'][dates[0]];
        return parseFloat(latest['4. close']);
      }
      
      throw new Error('Invalid response format from Alpha Vantage');
    } catch (error) {
      this.contextLogger.error('Error fetching dollar index:', error);
      // Return default value on error
      return 104.2;
    }
  }

  /**
   * FRED API methods (for economic indicators)
   */
  async getTreasuryYields(): Promise<number> {
    await this.rateLimiter.waitForRateLimit('fred');
    
    if (!this.config.fred.apiKey) {
      // Return a reasonable default value when API key is not available
      this.contextLogger.warn('FRED API key not provided, using default treasury yield value');
      return 4.12; // Default 10Y treasury yield
    }
    
    const url = `${this.config.fred.baseUrl}?series_id=DGS10&api_key=${this.config.fred.apiKey}&file_type=json&limit=1`;
    
    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();
      
      if (data.observations && data.observations.length > 0) {
        const latest = data.observations[0];
        return parseFloat(latest.value);
      }
      
      throw new Error('Invalid response format from FRED');
    } catch (error) {
      this.contextLogger.error('Error fetching treasury yields:', error);
      // Return default value on error
      return 4.12;
    }
  }
}

/**
 * Create API client instance
 */
export function createBitcoinAPIClient(config?: Partial<APIConfig>): BitcoinAPIClient {
  const fullConfig = {
    ...DEFAULT_API_CONFIG,
    ...config
  };
  
  return new BitcoinAPIClient(fullConfig);
} 