import { IAgentRuntime, elizaLogger, Service } from "@elizaos/core";
import { BaseDataService } from "../BaseDataService";
import { LoggerWithContext, generateCorrelationId } from "../../utils";

// Import components that will replace the large services
import { 
  RealTimeDataComponent,
  StockDataComponent,
  ETFDataComponent 
} from "../components";

/**
 * Consolidated Market Data Service
 * Combines functionality from RealTimeDataService, StockDataService, and ETFDataService
 * Implements service composition pattern for better maintainability
 */
export class MarketDataService extends BaseDataService {
  static serviceType = "market-data";
  
  private contextLogger: LoggerWithContext;
  private realTimeData: RealTimeDataComponent;
  private stockData: StockDataComponent;
  private etfData: ETFDataComponent;
  
  // Service lifecycle management
  private isInitialized = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 180000; // 3 minutes

  constructor(runtime: IAgentRuntime) {
    super(runtime, "realTimeData"); // Use existing realTimeData config key
    this.contextLogger = new LoggerWithContext(generateCorrelationId(), "MarketDataService");
    
    // Initialize components with lazy loading
    this.realTimeData = new RealTimeDataComponent(runtime);
    this.stockData = new StockDataComponent(runtime);
    this.etfData = new ETFDataComponent(runtime);
  }

  public get capabilityDescription(): string {
    return "Provides comprehensive market data including real-time prices, stock market data, and ETF information";
  }

  static async start(runtime: IAgentRuntime): Promise<MarketDataService> {
    const service = new MarketDataService(runtime);
    await service.initialize();
    return service;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.contextLogger.warn("MarketDataService already initialized");
      return;
    }

    try {
      this.contextLogger.info("Initializing MarketDataService...");
      
      // Initialize components in parallel for better performance
      await Promise.all([
        this.realTimeData.initialize(),
        this.stockData.initialize(),
        this.etfData.initialize()
      ]);

      // Start periodic updates
      this.startPeriodicUpdates();
      
      this.isInitialized = true;
      this.contextLogger.info("MarketDataService initialized successfully");
      
    } catch (error) {
      this.contextLogger.error("Failed to initialize MarketDataService:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.contextLogger.info("Stopping MarketDataService...");
    
    // Stop periodic updates
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Stop components in parallel
    await Promise.all([
      this.realTimeData.stop(),
      this.stockData.stop(),
      this.etfData.stop()
    ]);

    this.isInitialized = false;
    this.contextLogger.info("MarketDataService stopped successfully");
  }

  // Real-time data methods (delegated to RealTimeDataComponent)
  async getMarketData(): Promise<any[]> {
    return this.realTimeData.getMarketData();
  }

  async getBitcoinData(): Promise<any> {
    return this.realTimeData.getBitcoinData();
  }

  async getCuratedAltcoinsData(): Promise<any> {
    return this.realTimeData.getCuratedAltcoinsData();
  }

  async getTrendingCoinsData(): Promise<any> {
    return this.realTimeData.getTrendingCoinsData();
  }

  async getTopMoversData(): Promise<any> {
    return this.realTimeData.getTopMoversData();
  }

  // Stock data methods (delegated to StockDataComponent)
  async getStockData(symbols: string[]): Promise<any[]> {
    return this.stockData.getStockData(symbols);
  }

  async getStockMarketOverview(): Promise<any> {
    return this.stockData.getMarketOverview();
  }

  // ETF data methods (delegated to ETFDataComponent)
  async getETFData(symbols: string[]): Promise<any[]> {
    return this.etfData.getETFData(symbols);
  }

  async getETFFlows(): Promise<any> {
    return this.etfData.getETFFlows();
  }

  // Unified data access methods
  async getAllMarketData(): Promise<{
    realTime: any[];
    stocks: any[];
    etfs: any[];
    bitcoin: any;
    trending: any;
  }> {
    try {
      // Fetch all data in parallel for better performance
      const [realTimeData, stockData, etfData, bitcoinData, trendingData] = await Promise.all([
        this.getMarketData(),
        this.getStockData(['MSTR', 'COIN', 'NVDA', 'TSLA']), // Key stocks for Bitcoin ecosystem
        this.getETFData(['IBIT', 'FBTC', 'ARKB']), // Bitcoin ETFs
        this.getBitcoinData(),
        this.getTrendingCoinsData()
      ]);

      return {
        realTime: realTimeData,
        stocks: stockData,
        etfs: etfData,
        bitcoin: bitcoinData,
        trending: trendingData
      };
    } catch (error) {
      this.contextLogger.error("Failed to fetch all market data:", error);
      throw error;
    }
  }

  // Required abstract methods from BaseDataService
  async updateData(): Promise<void> {
    await this.updateAllData();
  }

  async forceUpdate(): Promise<any> {
    await this.updateAllData();
    return this.getAllMarketData();
  }

  // Performance metrics
  getPerformanceMetrics(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastError: string | null;
  } {
    // Aggregate metrics from all components
    const realTimeMetrics = this.realTimeData.getMetrics();
    const stockMetrics = this.stockData.getMetrics();
    const etfMetrics = this.etfData.getMetrics();

    return {
      totalRequests: realTimeMetrics.totalRequests + stockMetrics.totalRequests + etfMetrics.totalRequests,
      successfulRequests: realTimeMetrics.successfulRequests + stockMetrics.successfulRequests + etfMetrics.successfulRequests,
      failedRequests: realTimeMetrics.failedRequests + stockMetrics.failedRequests + etfMetrics.failedRequests,
      averageResponseTime: (realTimeMetrics.averageResponseTime + stockMetrics.averageResponseTime + etfMetrics.averageResponseTime) / 3,
      lastError: realTimeMetrics.lastError || stockMetrics.lastError || etfMetrics.lastError
    };
  }

  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateAllData();
      } catch (error) {
        this.contextLogger.error("Error during periodic update:", error);
      }
    }, this.UPDATE_INTERVAL);
  }

  private async updateAllData(): Promise<void> {
    this.contextLogger.debug("Starting periodic data update...");
    
    // Update all components in parallel
    await Promise.allSettled([
      this.realTimeData.update(),
      this.stockData.update(),
      this.etfData.update()
    ]);

    this.contextLogger.debug("Periodic data update completed");
  }
} 