import { IAgentRuntime, logger } from '@elizaos/core';
import { BaseDataService } from '../../../../plugin-bitcoin-ltl/src/services/BaseDataService';
import type { 
  BenchmarkResponse,
  AssetPerformance,
  AssetClassPerformance,
  PerformanceQuery,
  KeyAsset
} from '../types/btc-performance.types';
import { 
  rankAssetsByPerformance,
  aggregateAssetClassPerformance,
  generateMarketIntelligence
} from '../utils/btc-performance.utils';

export class BTCPerformanceService extends BaseDataService {
  static serviceType = 'btc-performance';
  capabilityDescription = 'Provides BTC-relative performance analysis across multiple asset classes';

  private bitcoinIntelligence: any;
  private stockData: any;
  private altcoinData: any;
  private commodityData: any;
  private indexData: any;

  constructor(runtime: IAgentRuntime) {
    super(runtime, 'btcPerformance');
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("BTCPerformanceService starting...");
    const service = new BTCPerformanceService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("BTCPerformanceService stopping...");
    const service = runtime.getService("btc-performance");
    if (service && service.stop) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    logger.info("BTCPerformanceService starting...");
    await this.updateData();
    logger.info("BTCPerformanceService started successfully");
  }

  async init(): Promise<void> {
    logger.info("BTCPerformanceService initialized");
    
    // Get dependencies from runtime
    this.bitcoinIntelligence = this.runtime.getService('bitcoin-intelligence');
    this.stockData = this.runtime.getService('stock-data');
    this.altcoinData = this.runtime.getService('altcoin-data');
    this.commodityData = this.runtime.getService('commodity-data');
    this.indexData = this.runtime.getService('index-data');

    // Initial data load
    await this.updateData();
  }

  async stop(): Promise<void> {
    logger.info("BTCPerformanceService stopped");
  }

  // Required abstract method implementations
  async updateData(): Promise<void> {
    // This service doesn't need to update data periodically
    // It aggregates data from other services on demand
  }

  async forceUpdate(): Promise<void> {
    // Force refresh of aggregated data
    await this.updateData();
  }

  async getBTCBenchmark(): Promise<BenchmarkResponse> {
    // Get Bitcoin data
    const btcData = await this.bitcoinIntelligence.getBitcoinData();
    const btcPrice = btcData.price;
    const btcPrice24h = btcData.price24h;
    const btcReturn = ((btcPrice - btcPrice24h) / btcPrice24h) * 100;

    // Get all asset data
    const assets = await this.getAllAssets();

    // Calculate performances
    const performances = rankAssetsByPerformance(assets, btcPrice, btcPrice24h);
    const topPerformers = performances.slice(0, 5);
    const underperformers = performances.slice(-5).reverse();

    // Aggregate by asset class
    const assetClassPerformance = aggregateAssetClassPerformance(assets, btcPrice, btcPrice24h);

    // Generate market intelligence
    const marketIntelligence = generateMarketIntelligence(assets, btcPrice, btcPrice24h);

    return {
      btcPrice,
      btcPrice24h,
      btcReturn,
      topPerformers,
      underperformers,
      assetClassPerformance,
      marketIntelligence,
      timestamp: new Date().toISOString()
    };
  }

  async getAssetPerformance(query: PerformanceQuery): Promise<AssetPerformance[]> {
    const btcData = await this.bitcoinIntelligence.getBitcoinData();
    const assets = await this.getAllAssets();

    let filteredAssets = assets;

    if (query.assetSymbol) {
      filteredAssets = assets.filter(asset => 
        asset.symbol.toLowerCase().includes(query.assetSymbol!.toLowerCase())
      );
    }

    if (query.assetClass) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.assetClass === query.assetClass
      );
    }

    const performances = rankAssetsByPerformance(
      filteredAssets, 
      btcData.price, 
      btcData.price24h
    );

    if (query.limit) {
      return performances.slice(0, query.limit);
    }

    return performances;
  }

  async getAssetClassPerformance(assetClass?: string): Promise<Record<string, AssetClassPerformance>> {
    const btcData = await this.bitcoinIntelligence.getBitcoinData();
    const assets = await this.getAllAssets();

    const assetClassPerformance = aggregateAssetClassPerformance(
      assets, 
      btcData.price, 
      btcData.price24h
    );

    if (assetClass) {
      return { [assetClass]: assetClassPerformance[assetClass as any] };
    }

    return assetClassPerformance;
  }

  async getTopPerformers(limit: number = 10): Promise<AssetPerformance[]> {
    const btcData = await this.bitcoinIntelligence.getBitcoinData();
    const assets = await this.getAllAssets();

    const performances = rankAssetsByPerformance(
      assets, 
      btcData.price, 
      btcData.price24h
    );

    return performances.slice(0, limit);
  }

  async getUnderperformers(limit: number = 10): Promise<AssetPerformance[]> {
    const btcData = await this.bitcoinIntelligence.getBitcoinData();
    const assets = await this.getAllAssets();

    const performances = rankAssetsByPerformance(
      assets, 
      btcData.price, 
      btcData.price24h
    );

    return performances.slice(-limit).reverse();
  }

  private async getAllAssets(): Promise<KeyAsset[]> {
    const assets: KeyAsset[] = [];

    try {
      // Get MAG7 stocks
      const mag7Stocks = await this.stockData.getMAG7Stocks();
      assets.push(...mag7Stocks.map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        price24h: stock.price24h,
        assetClass: 'STOCK' as const,
        marketCap: stock.marketCap,
        volume24h: stock.volume24h
      })));
    } catch (error) {
      console.warn('Failed to fetch MAG7 stocks:', error);
    }

    try {
      // Get top altcoins
      const altcoins = await this.altcoinData.getTopAltcoins();
      assets.push(...altcoins.map((coin: any) => ({
        symbol: coin.symbol,
        name: coin.name,
        price: coin.price,
        price24h: coin.price24h,
        assetClass: 'ALTCOIN' as const,
        marketCap: coin.marketCap,
        volume24h: coin.volume24h
      })));
    } catch (error) {
      console.warn('Failed to fetch altcoins:', error);
    }

    try {
      // Get commodities
      const commodities = await this.commodityData.getCommodities();
      assets.push(...commodities.map((commodity: any) => ({
        symbol: commodity.symbol,
        name: commodity.name,
        price: commodity.price,
        price24h: commodity.price24h,
        assetClass: 'COMMODITY' as const,
        marketCap: commodity.marketCap,
        volume24h: commodity.volume24h
      })));
    } catch (error) {
      console.warn('Failed to fetch commodities:', error);
    }

    try {
      // Get indices
      const indices = await this.indexData.getIndices();
      assets.push(...indices.map((index: any) => ({
        symbol: index.symbol,
        name: index.name,
        price: index.price,
        price24h: index.price24h,
        assetClass: 'INDEX' as const,
        marketCap: index.marketCap,
        volume24h: index.volume24h
      })));
    } catch (error) {
      console.warn('Failed to fetch indices:', error);
    }

    return assets;
  }
} 