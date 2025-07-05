import { IAgentRuntime, Service, logger } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  lastUpdate: Date;
  source: string;
  sector: 'tech' | 'bitcoin-related' | 'mag7' | 'index';
}

export interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
}

export interface StockPerformanceComparison {
  stock: StockData;
  vsMag7: {
    outperforming: boolean;
    difference: number; // percentage points
  };
  vsSp500: {
    outperforming: boolean;
    difference: number; // percentage points
  };
  vsCategory: {
    categoryAverage: number;
    outperforming: boolean;
    difference: number;
  };
}

export interface CuratedStocksData {
  stocks: StockData[];
  mag7: StockData[];
  indices: IndexData[];
  performance: {
    topPerformers: StockPerformanceComparison[];
    underperformers: StockPerformanceComparison[];
    mag7Average: number;
    sp500Performance: number;
    bitcoinRelatedAverage: number;
    techStocksAverage: number;
  };
  lastUpdated: Date;
}

export interface StockDataCache {
  data: CuratedStocksData;
  timestamp: number;
}

export class StockDataService extends BaseDataService {
  static serviceType = 'stock-data';
  capabilityDescription = 'Provides real-time stock market data for curated equities with performance analysis vs MAG7 and S&P 500';

  // API configuration
  private readonly ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';
  private readonly FINNHUB_API = 'https://finnhub.io/api/v1';
  private readonly YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart';

  // Cache management
  private stockDataCache: StockDataCache | null = null;
  private readonly STOCK_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (market hours)

  // Curated stocks from LiveTheLifeTV website
  private readonly curatedStocks = [
    // Bitcoin/Crypto Related Stocks
    { symbol: 'MSTR', name: 'MicroStrategy Inc', sector: 'bitcoin-related' as const },
    { symbol: 'COIN', name: 'Coinbase Global Inc', sector: 'bitcoin-related' as const },
    { symbol: 'HOOD', name: 'Robinhood Markets Inc', sector: 'bitcoin-related' as const },
    { symbol: 'CRCL', name: 'Circle Internet Financial', sector: 'bitcoin-related' as const },
    { symbol: 'RIOT', name: 'Riot Platforms Inc', sector: 'bitcoin-related' as const },
    { symbol: 'MARA', name: 'Marathon Digital Holdings', sector: 'bitcoin-related' as const },
    { symbol: 'CLSK', name: 'CleanSpark Inc', sector: 'bitcoin-related' as const },

    // High Growth Tech (non-MAG7)
    { symbol: 'TSLA', name: 'Tesla Inc', sector: 'tech' as const },
    { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'tech' as const },
    { symbol: 'RKLB', name: 'Rocket Lab USA', sector: 'tech' as const },
    { symbol: 'NET', name: 'Cloudflare Inc', sector: 'tech' as const },
    { symbol: 'SNOW', name: 'Snowflake Inc', sector: 'tech' as const },
    { symbol: 'CRWD', name: 'CrowdStrike Holdings', sector: 'tech' as const },
    { symbol: 'ZM', name: 'Zoom Video Communications', sector: 'tech' as const },
  ];

  // MAG7 stocks for comparison
  private readonly mag7Stocks = [
    { symbol: 'AAPL', name: 'Apple Inc', sector: 'mag7' as const },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'mag7' as const },
    { symbol: 'GOOGL', name: 'Alphabet Inc', sector: 'mag7' as const },
    { symbol: 'AMZN', name: 'Amazon.com Inc', sector: 'mag7' as const },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'mag7' as const },
    { symbol: 'TSLA', name: 'Tesla Inc', sector: 'mag7' as const }, // Also in MAG7
    { symbol: 'META', name: 'Meta Platforms Inc', sector: 'mag7' as const },
  ];

  // Market indices for comparison
  private readonly marketIndices = [
    { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'QQQ', name: 'NASDAQ 100 ETF' },
    { symbol: 'VTI', name: 'Total Stock Market ETF' },
    { symbol: 'DIA', name: 'Dow Jones Industrial Average ETF' },
  ];

  constructor(runtime: IAgentRuntime) {
    super(runtime, 'stockData');
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('StockDataService starting...');
    const service = new StockDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('StockDataService stopping...');
    const service = runtime.getService('stock-data');
    if (service && service.stop) {
      await service.stop();
    }
  }

  async init() {
    logger.info('StockDataService initialized');
    
    // Initial data load
    await this.updateData();
  }

  async stop() {
    logger.info('StockDataService stopped');
    // Clear cache and clean up any resources
    this.stockDataCache = null;
  }

  // Required abstract method implementations
  async updateData(): Promise<void> {
    await this.updateStockData();
  }

  async forceUpdate(): Promise<void> {
    this.stockDataCache = null;
    await this.updateData();
  }

  // Public API methods
  public getStockData(): CuratedStocksData | null {
    if (!this.stockDataCache || !this.isStockCacheValid()) {
      return null;
    }
    return this.stockDataCache.data;
  }

  public getStockBySymbol(symbol: string): StockData | undefined {
    const data = this.getStockData();
    if (!data) return undefined;
    
    return [...data.stocks, ...data.mag7].find(stock => stock.symbol === symbol);
  }

  public getBitcoinRelatedStocks(): StockData[] {
    const data = this.getStockData();
    if (!data) return [];
    
    return data.stocks.filter(stock => stock.sector === 'bitcoin-related');
  }

  public getPerformanceComparisons(): StockPerformanceComparison[] {
    const data = this.getStockData();
    if (!data) return [];
    
    return [...data.performance.topPerformers, ...data.performance.underperformers];
  }

  public getMag7Performance(): StockData[] {
    const data = this.getStockData();
    if (!data) return [];
    
    return data.mag7;
  }

  public async forceStockUpdate(): Promise<CuratedStocksData | null> {
    return await this.fetchStockData();
  }

  // Cache management
  private isStockCacheValid(): boolean {
    if (!this.stockDataCache) return false;
    return Date.now() - this.stockDataCache.timestamp < this.STOCK_CACHE_DURATION;
  }

  private async updateStockData(): Promise<void> {
    if (!this.isStockCacheValid()) {
      const data = await this.fetchStockData();
      if (data) {
        this.stockDataCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  // Core stock data fetching
  private async fetchStockData(): Promise<CuratedStocksData | null> {
    try {
      logger.info('[StockDataService] Fetching comprehensive stock data...');

      // Fetch all stock data in parallel
      const [curatedStocksData, mag7Data, indicesData] = await Promise.all([
        this.fetchStocksData(this.curatedStocks),
        this.fetchStocksData(this.mag7Stocks),
        this.fetchIndicesData()
      ]);

      if (!curatedStocksData || !mag7Data || !indicesData) {
        logger.warn('[StockDataService] Failed to fetch complete stock data');
        return null;
      }

      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics(curatedStocksData, mag7Data, indicesData);

      const result: CuratedStocksData = {
        stocks: curatedStocksData,
        mag7: mag7Data,
        indices: indicesData,
        performance,
        lastUpdated: new Date()
      };

      logger.info(`[StockDataService] Stock data updated: ${curatedStocksData.length} curated stocks, MAG7 avg: ${performance.mag7Average.toFixed(2)}%`);
      return result;

    } catch (error) {
      logger.error('[StockDataService] Error fetching stock data:', error);
      return null;
    }
  }

  private async fetchStocksData(stockList: any[]): Promise<StockData[]> {
    const stockData: StockData[] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < stockList.length; i += batchSize) {
      const batch = stockList.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (stock) => {
        try {
          return await this.fetchSingleStockData(stock.symbol, stock.name, stock.sector);
        } catch (error) {
          logger.warn(`[StockDataService] Failed to fetch ${stock.symbol}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      stockData.push(...batchResults.filter(Boolean) as StockData[]);

      // Rate limiting between batches
      if (i + batchSize < stockList.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return stockData;
  }

  private async fetchSingleStockData(symbol: string, name: string, sector: string): Promise<StockData | null> {
    try {
      // Try Yahoo Finance first (free, reliable)
      const yahooData = await this.fetchFromYahooFinance(symbol);
      if (yahooData) {
        return {
          symbol,
          name,
          price: yahooData.price,
          change: yahooData.change,
          changePercent: yahooData.changePercent,
          volume: yahooData.volume,
          marketCap: yahooData.marketCap,
          lastUpdate: new Date(),
          source: 'Yahoo Finance',
          sector: sector as any
        };
      }

      // Fallback to Alpha Vantage if configured
      const alphaVantageKey = this.runtime.getSetting('ALPHA_VANTAGE_API_KEY');
      if (alphaVantageKey) {
        const alphaData = await this.fetchFromAlphaVantage(symbol, alphaVantageKey);
        if (alphaData) {
          return {
            symbol,
            name,
            price: alphaData.price,
            change: alphaData.change,
            changePercent: alphaData.changePercent,
            volume: alphaData.volume,
            marketCap: 0, // Not available in Alpha Vantage basic
            lastUpdate: new Date(),
            source: 'Alpha Vantage',
            sector: sector as any
          };
        }
      }

      // Fallback to Finnhub if configured
      const finnhubKey = this.runtime.getSetting('FINNHUB_API_KEY');
      if (finnhubKey) {
        const finnhubData = await this.fetchFromFinnhub(symbol, finnhubKey);
        if (finnhubData) {
          return {
            symbol,
            name,
            price: finnhubData.price,
            change: finnhubData.change,
            changePercent: finnhubData.changePercent,
            volume: 0, // Would need additional call
            marketCap: 0, // Would need additional call
            lastUpdate: new Date(),
            source: 'Finnhub',
            sector: sector as any
          };
        }
      }

      return null;
    } catch (error) {
      logger.error(`[StockDataService] Error fetching ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromYahooFinance(symbol: string): Promise<any> {
    try {
      const response = await this.fetchWithRetry(
        `${this.YAHOO_FINANCE_API}/${symbol}?interval=1d&range=2d`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LiveTheLifeTV-Bot/1.0)',
          }
        }
      );

      const result = response.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose;
      
      // Validate required data
      if (!currentPrice || !previousClose || previousClose === 0) {
        logger.warn(`[StockDataService] Invalid price data for ${symbol}: current=${currentPrice}, previous=${previousClose}`);
        return null;
      }

      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      // Validate calculated values
      if (!isFinite(changePercent)) {
        logger.warn(`[StockDataService] Invalid changePercent for ${symbol}: ${changePercent}`);
        return null;
      }

      return {
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: meta.regularMarketVolume || 0,
        marketCap: meta.marketCap || 0
      };
    } catch (error) {
      logger.warn(`[StockDataService] Yahoo Finance failed for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromAlphaVantage(symbol: string, apiKey: string): Promise<any> {
    try {
      const response = await this.fetchWithRetry(
        `${this.ALPHA_VANTAGE_API}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
        {}
      );

      const quote = response['Global Quote'];
      if (!quote) return null;

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

      // Validate parsed values
      if (!isFinite(price) || !isFinite(change) || !isFinite(changePercent)) {
        logger.warn(`[StockDataService] Invalid Alpha Vantage data for ${symbol}: price=${price}, change=${change}, changePercent=${changePercent}`);
        return null;
      }

      return {
        price: price,
        change: change,
        changePercent: changePercent,
        volume: parseInt(quote['06. volume']) || 0
      };
    } catch (error) {
      logger.warn(`[StockDataService] Alpha Vantage failed for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromFinnhub(symbol: string, apiKey: string): Promise<any> {
    try {
      const response = await this.fetchWithRetry(
        `${this.FINNHUB_API}/quote?symbol=${symbol}&token=${apiKey}`,
        {}
      );

      if (!response.c) return null;

      const currentPrice = response.c;
      const previousClose = response.pc;
      
      // Validate required data
      if (!currentPrice || !previousClose || previousClose === 0) {
        logger.warn(`[StockDataService] Invalid Finnhub data for ${symbol}: current=${currentPrice}, previous=${previousClose}`);
        return null;
      }

      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      // Validate calculated values
      if (!isFinite(changePercent)) {
        logger.warn(`[StockDataService] Invalid changePercent for ${symbol}: ${changePercent}`);
        return null;
      }

      return {
        price: currentPrice,
        change: change,
        changePercent: changePercent
      };
    } catch (error) {
      logger.warn(`[StockDataService] Finnhub failed for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchIndicesData(): Promise<IndexData[]> {
    const indices: IndexData[] = [];
    
    for (const index of this.marketIndices) {
      try {
        const data = await this.fetchSingleStockData(index.symbol, index.name, 'index');
        if (data) {
          indices.push({
            symbol: data.symbol,
            name: data.name,
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
            lastUpdate: data.lastUpdate
          });
        }
      } catch (error) {
        logger.warn(`[StockDataService] Failed to fetch index ${index.symbol}:`, error);
      }
    }

    return indices;
  }

  private calculatePerformanceMetrics(
    stocks: StockData[], 
    mag7: StockData[], 
    indices: IndexData[]
  ): CuratedStocksData['performance'] {
    // Helper function to safely calculate averages
    const safeAverage = (arr: StockData[]): number => {
      if (arr.length === 0) return 0;
      const validPercentages = arr.filter(stock => isFinite(stock.changePercent));
      if (validPercentages.length === 0) return 0;
      return validPercentages.reduce((sum, stock) => sum + stock.changePercent, 0) / validPercentages.length;
    };

    // Calculate averages with validation
    const mag7Average = safeAverage(mag7);
    const sp500Performance = indices.find(i => i.symbol === 'SPY')?.changePercent || 0;
    
    const bitcoinRelatedStocks = stocks.filter(s => s.sector === 'bitcoin-related');
    const bitcoinRelatedAverage = safeAverage(bitcoinRelatedStocks);
    
    const techStocks = stocks.filter(s => s.sector === 'tech');
    const techStocksAverage = safeAverage(techStocks);

    // Calculate comparisons for all stocks
    const comparisons: StockPerformanceComparison[] = stocks
      .filter(stock => isFinite(stock.changePercent)) // Only include stocks with valid data
      .map(stock => {
        const categoryAverage = stock.sector === 'bitcoin-related' ? bitcoinRelatedAverage : techStocksAverage;
        
        return {
          stock,
          vsMag7: {
            outperforming: stock.changePercent > mag7Average,
            difference: stock.changePercent - mag7Average
          },
          vsSp500: {
            outperforming: stock.changePercent > sp500Performance,
            difference: stock.changePercent - sp500Performance
          },
          vsCategory: {
            categoryAverage,
            outperforming: stock.changePercent > categoryAverage,
            difference: stock.changePercent - categoryAverage
          }
        };
      });

    // Sort by performance
    const sortedComparisons = [...comparisons].sort((a, b) => b.stock.changePercent - a.stock.changePercent);
    
    return {
      topPerformers: sortedComparisons.slice(0, 5),
      underperformers: sortedComparisons.slice(-3),
      mag7Average,
      sp500Performance,
      bitcoinRelatedAverage,
      techStocksAverage
    };
  }
} 