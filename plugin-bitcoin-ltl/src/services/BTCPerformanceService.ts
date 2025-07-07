/**
 * BTC Performance Service
 * Unified service for tracking all asset performance vs Bitcoin
 */

import { Service, IAgentRuntime, logger } from "@elizaos/core";
import {
  BTCPerformanceBenchmark,
  AssetPerformance,
  AssetClassPerformance,
  KeyAssetPerformance,
  BTCBenchmarkConfig,
  BTCBenchmarkResponse,
  AssetPerformanceResponse,
  AssetClassResponse,
  AssetCategory,
  HistoricalPerformance,
} from "../types/btcPerformanceTypes";
import {
  calculateBTCPerformance,
  calculateAssetClassPerformance,
  calculateAltcoinSeasonIndex,
  determineMarketSentiment,
  analyzePerformanceTrend,
  rankAssetsByPerformance,
  getTopPerformers,
  getUnderperformers,
} from "../utils/btcPerformanceUtils";
import { BaseDataService } from "./BaseDataService";
import { LoggerWithContext, generateCorrelationId } from "../utils/helpers";

export class BTCPerformanceService extends BaseDataService {
  static serviceType = "btc-performance";
  public declare config: BTCBenchmarkConfig;
  private benchmarkData: BTCPerformanceBenchmark | null = null;
  private lastUpdate: Date | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private contextLogger: LoggerWithContext;

  public get capabilityDescription(): string {
    return "Provides BTC-relative performance analysis across multiple asset classes";
  }

  constructor(runtime: IAgentRuntime) {
    super(runtime, "btcPerformance");
    this.contextLogger = new LoggerWithContext(this.correlationId, "BTCPerformanceService");
    this.config = {
      intervals: {
        realTime: 30,
        marketData: 300,
        historical: 3600,
      },
      trackedAssets: {
        stocks: [
          'MSTR', 'TSLA', 'COIN', 'MARA', 'RIOT', 'CLSK', 'HUT', 'BITF',
          'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'
        ],
        altcoins: [
          'ethereum', 'binancecoin', 'solana', 'cardano', 'avalanche-2',
          'polkadot', 'chainlink', 'polygon', 'uniswap', 'litecoin'
        ],
        indices: ['^GSPC', '^IXIC', '^DJI', '^VIX'],
        commodities: ['GC=F', 'SI=F', 'CL=F'],
      },
      thresholds: {
        significantOutperformance: 10,
        highVolatility: 2.0,
        strongCorrelation: 0.7,
      },
      features: {
        enableHistoricalTracking: true,
        enableMilestoneAnalysis: true,
        enableTrendAnalysis: true,
        enableNarrativeGeneration: true,
      },
    };
  }

  static async start(runtime: IAgentRuntime): Promise<BTCPerformanceService> {
    const service = new BTCPerformanceService(runtime);
    await service.start();
    return service;
  }

  async start(): Promise<void> {
    this.contextLogger.info("Starting BTC Performance Service");
    
    // Initial data fetch
    await this.updateBenchmarkData();
    
    // Set up periodic updates
    this.updateInterval = setInterval(
      () => this.updateBenchmarkData(),
      this.config.intervals.marketData * 1000
    );
    
    this.contextLogger.info("BTC Performance Service started");
  }

  async stop(): Promise<void> {
    this.contextLogger.info("Stopping BTC Performance Service");
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.contextLogger.info("BTC Performance Service stopped");
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Get complete BTC performance benchmark
   */
  async getBTCBenchmark(): Promise<BTCBenchmarkResponse> {
    try {
      if (!this.benchmarkData || this.isDataStale()) {
        await this.updateBenchmarkData();
      }

      return {
        success: true,
        data: this.benchmarkData,
        timestamp: new Date(),
        cacheStatus: this.getCacheStatus(),
      };
    } catch (error) {
      this.contextLogger.error("Error getting BTC benchmark:", error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
        cacheStatus: "STALE",
      };
    }
  }

  /**
   * Get specific asset performance vs BTC
   */
  async getAssetPerformance(symbol: string): Promise<AssetPerformanceResponse> {
    try {
      if (!this.benchmarkData || this.isDataStale()) {
        await this.updateBenchmarkData();
      }

      const asset = this.findAssetBySymbol(symbol);
      
      if (!asset) {
        return {
          success: false,
          data: null,
          error: `Asset ${symbol} not found`,
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: asset,
        timestamp: new Date(),
      };
    } catch (error) {
      this.contextLogger.error(`Error getting asset performance for ${symbol}:`, error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get asset class performance vs BTC
   */
  async getAssetClassPerformance(category: AssetCategory): Promise<AssetClassResponse> {
    try {
      if (!this.benchmarkData || this.isDataStale()) {
        await this.updateBenchmarkData();
      }

      const assetClass = this.getAssetClassByCategory(category);
      
      if (!assetClass) {
        return {
          success: false,
          data: null,
          error: `Asset class ${category} not found`,
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: assetClass,
        timestamp: new Date(),
      };
    } catch (error) {
      this.contextLogger.error(`Error getting asset class performance for ${category}:`, error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get top performers vs BTC
   */
  async getTopPerformers(count: number = 10): Promise<AssetPerformance[]> {
    if (!this.benchmarkData) {
      await this.updateBenchmarkData();
    }

    const allAssets = this.getAllAssets();
    return getTopPerformers(allAssets, count);
  }

  /**
   * Get underperformers vs BTC
   */
  async getUnderperformers(count: number = 10): Promise<AssetPerformance[]> {
    if (!this.benchmarkData) {
      await this.updateBenchmarkData();
    }

    const allAssets = this.getAllAssets();
    return getUnderperformers(allAssets, count);
  }

  /**
   * Force update benchmark data
   */
  async forceUpdate(): Promise<BTCBenchmarkResponse> {
    this.contextLogger.info("Forcing BTC benchmark data update");
    return this.updateBenchmarkData();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Update benchmark data from all sources
   */
  private async updateBenchmarkData(): Promise<BTCBenchmarkResponse> {
    try {
      this.contextLogger.info("Updating BTC benchmark data");

      // Get BTC data
      const btcData = await this.getBTCData();
      
      // Get stock data
      const stockData = await this.getStockData(btcData);
      
      // Get altcoin data
      const altcoinData = await this.getAltcoinData(btcData);
      
      // Get commodity data
      const commodityData = await this.getCommodityData(btcData);
      
      // Get index data
      const indexData = await this.getIndexData(btcData);

      // Aggregate into asset classes
      const assetClasses = {
        stocks: calculateAssetClassPerformance('BITCOIN_RELATED_STOCK', stockData),
        altcoins: calculateAssetClassPerformance('TOP_ALTCOIN', altcoinData),
        commodities: calculateAssetClassPerformance('COMMODITY', commodityData),
        indices: calculateAssetClassPerformance('INDEX', indexData),
      };

      // Create key assets object
      const keyAssets = this.createKeyAssets(stockData, altcoinData, commodityData, indexData, btcData);

      // Calculate market intelligence
      const marketIntelligence = this.calculateMarketIntelligence(assetClasses, btcData);

      // Create benchmark data
      this.benchmarkData = {
        btcPrice: btcData.price,
        btcMarketCap: btcData.marketCap,
        btcDominance: btcData.dominance,
        btcChange24h: btcData.change24h,
        assetClasses,
        keyAssets,
        historical: await this.getHistoricalData(),
        marketIntelligence,
        lastUpdated: new Date(),
      };

      this.lastUpdate = new Date();
      this.contextLogger.info("BTC benchmark data updated successfully");

      return {
        success: true,
        data: this.benchmarkData,
        timestamp: new Date(),
        cacheStatus: "FRESH",
      };
    } catch (error) {
      this.contextLogger.error("Error updating BTC benchmark data:", error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
        cacheStatus: "STALE",
      };
    }
  }

  /**
   * Get BTC data from BitcoinIntelligenceService
   */
  private async getBTCData(): Promise<{
    price: number;
    marketCap: number;
    dominance: number;
    change24h: number;
  }> {
    try {
      const bitcoinService = this.runtime.getService("bitcoin-intelligence") as any;
      if (!bitcoinService) {
        throw new Error("BitcoinIntelligenceService not available");
      }

      const btcData = await bitcoinService.getBitcoinData();
      
      return {
        price: btcData.price,
        marketCap: btcData.marketCap,
        dominance: btcData.dominance,
        change24h: btcData.priceChange24h,
      };
    } catch (error) {
      this.contextLogger.error("Error getting BTC data:", error);
      // Return fallback data
      return {
        price: 107940,
        marketCap: 2165830000000,
        dominance: 63.89,
        change24h: 2.3,
      };
    }
  }

  /**
   * Get stock data vs BTC
   */
  private async getStockData(btcData: any): Promise<AssetPerformance[]> {
    try {
      const stockService = this.runtime.getService("stock-data") as any;
      if (!stockService) {
        this.contextLogger.warn("StockDataService not available, using mock data");
        return this.getMockStockData(btcData);
      }

      const stocks = await stockService.getMultipleStockData(this.config.trackedAssets.stocks);
      
      return stocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        marketCap: stock.marketCap,
        volume24h: stock.volume,
        vsBTC: calculateBTCPerformance(
          stock.price, btcData.price,
          stock.price24h || stock.price, btcData.price24h || btcData.price,
          stock.price7d || stock.price, btcData.price7d || btcData.price,
          stock.price30d || stock.price, btcData.price30d || btcData.price,
          stock.priceYTD || stock.price, btcData.priceYTD || btcData.price,
          stock.priceInception || stock.price, btcData.priceInception || btcData.price
        ),
        category: this.getStockCategory(stock.symbol),
        narrative: this.generateStockNarrative(stock.symbol),
        lastUpdated: new Date(),
      }));
    } catch (error) {
      this.contextLogger.error("Error getting stock data:", error);
      return this.getMockStockData(btcData);
    }
  }

  /**
   * Get altcoin data vs BTC
   */
  private async getAltcoinData(btcData: any): Promise<AssetPerformance[]> {
    try {
      const altcoinService = this.runtime.getService("altcoin-data") as any;
      if (!altcoinService) {
        this.contextLogger.warn("AltcoinDataService not available, using mock data");
        return this.getMockAltcoinData(btcData);
      }

      const altcoins = await altcoinService.getTop100VsBtcData();
      
      return altcoins.slice(0, 20).map(altcoin => ({
        symbol: altcoin.symbol,
        name: altcoin.name,
        price: altcoin.price,
        marketCap: altcoin.marketCap,
        volume24h: altcoin.volume24h,
        vsBTC: calculateBTCPerformance(
          altcoin.price, btcData.price,
          altcoin.price24h || altcoin.price, btcData.price24h || btcData.price,
          altcoin.price7d || altcoin.price, btcData.price7d || btcData.price,
          altcoin.price30d || altcoin.price, btcData.price30d || btcData.price,
          altcoin.priceYTD || altcoin.price, btcData.priceYTD || btcData.price,
          altcoin.priceInception || altcoin.price, btcData.priceInception || btcData.price
        ),
        category: 'TOP_ALTCOIN' as AssetCategory,
        narrative: this.generateAltcoinNarrative(altcoin.symbol),
        lastUpdated: new Date(),
      }));
    } catch (error) {
      this.contextLogger.error("Error getting altcoin data:", error);
      return this.getMockAltcoinData(btcData);
    }
  }

  /**
   * Get commodity data vs BTC
   */
  private async getCommodityData(btcData: any): Promise<AssetPerformance[]> {
    // For now, return mock data - can be enhanced with real commodity APIs
    return this.getMockCommodityData(btcData);
  }

  /**
   * Get index data vs BTC
   */
  private async getIndexData(btcData: any): Promise<AssetPerformance[]> {
    // For now, return mock data - can be enhanced with real index APIs
    return this.getMockIndexData(btcData);
  }

  /**
   * Create key assets object
   */
  private createKeyAssets(
    stockData: AssetPerformance[],
    altcoinData: AssetPerformance[],
    commodityData: AssetPerformance[],
    indexData: AssetPerformance[],
    btcData: any
  ): KeyAssetPerformance {
    const mstr = stockData.find(s => s.symbol === 'MSTR');
    const ethereum = altcoinData.find(a => a.symbol === 'ETH');
    const gold = commodityData.find(c => c.symbol === 'GC=F');
    const sp500 = indexData.find(i => i.symbol === '^GSPC');
    const nasdaq = indexData.find(i => i.symbol === '^IXIC');
    const dowJones = indexData.find(i => i.symbol === '^DJI');

    // Create Bitcoin asset performance
    const bitcoin: AssetPerformance = {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: btcData.price,
      marketCap: btcData.marketCap,
      volume24h: 0, // Will be filled from real data
      vsBTC: {
        performance24h: 0,
        performance7d: 0,
        performance30d: 0,
        performanceYTD: 0,
        performanceInception: 0,
        outperformingBTC: true,
        rank: 1,
        volatilityVsBTC: 1.0,
        correlationWithBTC: 1.0,
        narrative: 'Bitcoin - the benchmark asset',
        keyDrivers: ['Sound money', 'Network effects', 'Institutional adoption'],
        lastUpdated: new Date(),
      },
      category: 'TOP_ALTCOIN',
      narrative: 'Bitcoin - digital gold and sound money',
      lastUpdated: new Date(),
    };

    return {
      mstr: mstr ? {
        ...mstr,
        btcHoldings: 189150,
        btcHoldingsValue: 189150 * btcData.price,
        btcHoldingsVsBtcPerformance: 0, // Will be calculated
        corporateStrategy: 'Bitcoin-first corporate treasury strategy',
      } : null as any,
      mag7: calculateAssetClassPerformance('MAG7_STOCK', 
        stockData.filter(s => ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'].includes(s.symbol))
      ),
      sp500: sp500 || null as any,
      nasdaq: nasdaq || null as any,
      dowJones: dowJones || null as any,
      gold: gold || null as any,
      ethereum: ethereum || null as any,
      top100Altcoins: calculateAssetClassPerformance('TOP_ALTCOIN', altcoinData),
      bitcoin,
    };
  }

  /**
   * Calculate market intelligence
   */
  private calculateMarketIntelligence(assetClasses: any, btcData: any) {
    const altcoinSeasonIndex = calculateAltcoinSeasonIndex(
      assetClasses.stocks.aggregatePerformance.performanceYTD,
      assetClasses.altcoins.aggregatePerformance.performanceYTD
    );

    const overallMarketSentiment = determineMarketSentiment(
      assetClasses.stocks.aggregatePerformance.performanceYTD,
      altcoinSeasonIndex
    );

    const btcOutperformanceTrend = analyzePerformanceTrend(
      assetClasses.stocks.aggregatePerformance.performance24h,
      assetClasses.stocks.aggregatePerformance.performance7d,
      assetClasses.stocks.aggregatePerformance.performance30d
    );

    return {
      altcoinSeasonIndex,
      overallMarketSentiment,
      btcOutperformanceTrend,
      keyNarratives: this.generateKeyNarratives(assetClasses, altcoinSeasonIndex),
    };
  }

  /**
   * Get historical data
   */
  private async getHistoricalData(): Promise<HistoricalPerformance> {
    // Placeholder - will be implemented with historical data service
    return {
      inceptionToDate: {
        btcReturn: 1000000, // 1M% return since inception
        assetReturn: 0,
        btcOutperformance: 1000000,
        rank: 1,
        narrative: 'Bitcoin has outperformed all major asset classes since inception',
      },
      milestones: {
        halvingCycles: [],
        bullRuns: [],
        bearMarkets: [],
      },
      trends: {
        last24Hours: { direction: 'STABLE' as const, magnitude: 0, confidence: 0, keyFactors: [] },
        last7Days: { direction: 'STABLE' as const, magnitude: 0, confidence: 0, keyFactors: [] },
        last30Days: { direction: 'STABLE' as const, magnitude: 0, confidence: 0, keyFactors: [] },
        last90Days: { direction: 'STABLE' as const, magnitude: 0, confidence: 0, keyFactors: [] },
        lastYear: { direction: 'STABLE' as const, magnitude: 0, confidence: 0, keyFactors: [] },
      },
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private isDataStale(): boolean {
    if (!this.lastUpdate) return true;
    const now = new Date();
    const diff = (now.getTime() - this.lastUpdate.getTime()) / 1000;
    return diff > this.config.intervals.marketData;
  }

  private getCacheStatus(): 'FRESH' | 'CACHED' | 'STALE' {
    if (!this.lastUpdate) return 'STALE';
    const now = new Date();
    const diff = (now.getTime() - this.lastUpdate.getTime()) / 1000;
    
    if (diff < this.config.intervals.realTime) return 'FRESH';
    if (diff < this.config.intervals.marketData) return 'CACHED';
    return 'STALE';
  }

  private findAssetBySymbol(symbol: string): AssetPerformance | null {
    if (!this.benchmarkData) return null;
    
    const allAssets = this.getAllAssets();
    return allAssets.find(asset => asset.symbol === symbol) || null;
  }

  private getAssetClassByCategory(category: AssetCategory): AssetClassPerformance | null {
    if (!this.benchmarkData) return null;
    
    switch (category) {
      case 'BITCOIN_RELATED_STOCK':
      case 'MAG7_STOCK':
      case 'TECH_STOCK':
        return this.benchmarkData.assetClasses.stocks;
      case 'TOP_ALTCOIN':
      case 'MID_ALTCOIN':
      case 'SMALL_ALTCOIN':
        return this.benchmarkData.assetClasses.altcoins;
      case 'COMMODITY':
        return this.benchmarkData.assetClasses.commodities;
      case 'INDEX':
        return this.benchmarkData.assetClasses.indices;
      default:
        return null;
    }
  }

  private getAllAssets(): AssetPerformance[] {
    if (!this.benchmarkData) return [];
    
    return [
      ...this.benchmarkData.assetClasses.stocks.assets,
      ...this.benchmarkData.assetClasses.altcoins.assets,
      ...this.benchmarkData.assetClasses.commodities.assets,
      ...this.benchmarkData.assetClasses.indices.assets,
    ];
  }

  private getStockCategory(symbol: string): AssetCategory {
    const mag7 = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];
    const bitcoinRelated = ['MSTR', 'COIN', 'MARA', 'RIOT', 'CLSK', 'HUT', 'BITF'];
    
    if (mag7.includes(symbol)) return 'MAG7_STOCK';
    if (bitcoinRelated.includes(symbol)) return 'BITCOIN_RELATED_STOCK';
    return 'TECH_STOCK';
  }

  private generateStockNarrative(symbol: string): string {
    switch (symbol) {
      case 'MSTR': return 'MicroStrategy - Bitcoin-first corporate strategy';
      case 'TSLA': return 'Tesla - Electric vehicles and Bitcoin adoption';
      case 'COIN': return 'Coinbase - Cryptocurrency exchange platform';
      default: return 'Technology stock with market correlation';
    }
  }

  private generateAltcoinNarrative(symbol: string): string {
    switch (symbol) {
      case 'ETH': return 'Ethereum - Smart contract platform';
      case 'BNB': return 'Binance Coin - Exchange token';
      case 'SOL': return 'Solana - High-performance blockchain';
      default: return 'Cryptocurrency with varying utility';
    }
  }

  private generateKeyNarratives(assetClasses: any, altcoinSeasonIndex: number): string[] {
    const narratives: string[] = [];
    
    if (assetClasses.stocks.aggregatePerformance.performanceYTD > 0) {
      narratives.push('Traditional finance showing strength vs Bitcoin');
    } else {
      narratives.push('Bitcoin outperforming traditional assets');
    }
    
    if (altcoinSeasonIndex > 50) {
      narratives.push('Altcoin season developing');
    } else {
      narratives.push('Bitcoin dominance in crypto markets');
    }
    
    return narratives;
  }

  // ============================================================================
  // MOCK DATA METHODS (for development/testing)
  // ============================================================================

  private getMockStockData(btcData: any): AssetPerformance[] {
    return [
      {
        symbol: 'MSTR',
        name: 'MicroStrategy',
        price: 1450.50,
        marketCap: 25000000000,
        volume24h: 5000000,
        vsBTC: calculateBTCPerformance(1450.50, btcData.price, 1400, btcData.price * 0.98, 1300, btcData.price * 0.95, 1200, btcData.price * 0.90, 1000, btcData.price * 0.80, 500, btcData.price * 0.50),
        category: 'BITCOIN_RELATED_STOCK',
        narrative: 'MicroStrategy - Bitcoin-first corporate strategy',
        lastUpdated: new Date(),
      },
      {
        symbol: 'TSLA',
        name: 'Tesla',
        price: 245.30,
        marketCap: 780000000000,
        volume24h: 50000000,
        vsBTC: calculateBTCPerformance(245.30, btcData.price, 240, btcData.price * 0.98, 230, btcData.price * 0.95, 220, btcData.price * 0.90, 200, btcData.price * 0.80, 150, btcData.price * 0.50),
        category: 'MAG7_STOCK',
        narrative: 'Tesla - Electric vehicles and Bitcoin adoption',
        lastUpdated: new Date(),
      },
    ];
  }

  private getMockAltcoinData(btcData: any): AssetPerformance[] {
    return [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3200.50,
        marketCap: 380000000000,
        volume24h: 15000000000,
        vsBTC: calculateBTCPerformance(3200.50, btcData.price, 3150, btcData.price * 0.98, 3100, btcData.price * 0.95, 3000, btcData.price * 0.90, 2800, btcData.price * 0.80, 2000, btcData.price * 0.50),
        category: 'TOP_ALTCOIN',
        narrative: 'Ethereum - Smart contract platform',
        lastUpdated: new Date(),
      },
    ];
  }

  private getMockCommodityData(btcData: any): AssetPerformance[] {
    return [
      {
        symbol: 'GC=F',
        name: 'Gold',
        price: 2150.00,
        marketCap: 0,
        volume24h: 0,
        vsBTC: calculateBTCPerformance(2150.00, btcData.price, 2140, btcData.price * 0.98, 2130, btcData.price * 0.95, 2120, btcData.price * 0.90, 2100, btcData.price * 0.80, 1800, btcData.price * 0.50),
        category: 'COMMODITY',
        narrative: 'Gold - Traditional safe haven asset',
        lastUpdated: new Date(),
      },
    ];
  }

  private getMockIndexData(btcData: any): AssetPerformance[] {
    return [
      {
        symbol: '^GSPC',
        name: 'S&P 500',
        price: 5200.00,
        marketCap: 0,
        volume24h: 0,
        vsBTC: calculateBTCPerformance(5200.00, btcData.price, 5180, btcData.price * 0.98, 5150, btcData.price * 0.95, 5100, btcData.price * 0.90, 5000, btcData.price * 0.80, 4500, btcData.price * 0.50),
        category: 'INDEX',
        narrative: 'S&P 500 - Major US stock market index',
        lastUpdated: new Date(),
      },
    ];
  }

  async updateData(): Promise<void> {
    // Required by BaseDataService. Triggers a full benchmark data update.
    await this.updateBenchmarkData();
  }
} 