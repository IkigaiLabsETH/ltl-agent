import { Provider, IAgentRuntime, Memory, State } from '@elizaos/core';
import { BitcoinDataService } from '../services/BitcoinDataService';
import { RealTimeDataService } from '../services/RealTimeDataService';

/**
 * Bitcoin Market Provider - Core Bitcoin market data
 * Following ElizaOS documentation patterns
 * Position: 0 (standard position for market data)
 */
export const bitcoinMarketProvider: Provider = {
  name: 'bitcoinMarket',
  description: 'Provides Bitcoin price, network health, and market sentiment data',
  position: 0, // Standard position for market data
  
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    try {
      // Get services
      const bitcoinService = runtime.getService('bitcoin-data') as BitcoinDataService;
      const realTimeService = runtime.getService('real-time-data') as RealTimeDataService;
      
      if (!bitcoinService || !realTimeService) {
        return {
          text: 'Bitcoin market data services not available',
          values: { bitcoinDataError: true },
        };
      }
      
      // Get comprehensive Bitcoin data
      const bitcoinData = realTimeService.getComprehensiveBitcoinData();
      
      // Get enhanced market data with fallback
      let priceData;
      try {
        priceData = await bitcoinService.getEnhancedMarketData();
      } catch (error) {
        // Fallback to basic price if enhanced data fails
        const basicPrice = await bitcoinService.getBitcoinPrice();
        priceData = {
          price: basicPrice,
          marketCap: 0,
          volume24h: 0,
          priceChange24h: 0,
          priceChange7d: 0,
          priceChange30d: 0,
          allTimeHigh: 0,
          allTimeLow: 0,
          circulatingSupply: 0,
          totalSupply: 0,
          maxSupply: 21000000,
          lastUpdated: new Date().toISOString(),
        };
      }
      
      if (!bitcoinData || !priceData) {
        return {
          text: 'Bitcoin market data not available yet. Services are initializing.',
          values: { bitcoinDataLoading: true },
        };
      }
      
      // Format market context
      const priceDirection = (bitcoinData.price.change24h || 0) > 0 ? 'up' : 'down';
      const priceChange = Math.abs(bitcoinData.price.change24h || 0);
      const networkHealth = bitcoinData.network.hashRate ? 'healthy' : 'syncing';
      
      const marketContext = `Bitcoin: $${bitcoinData.price.usd?.toLocaleString() || priceData.price.toLocaleString() || 'N/A'} (${priceDirection} ${priceChange.toFixed(2)}% 24h). Network: ${networkHealth}. Fear & Greed: ${bitcoinData.sentiment.fearGreedValue || 'N/A'}.`;
      
      return {
        text: `Current Bitcoin status: ${marketContext}`,
        values: {
          bitcoinPrice: bitcoinData.price.usd || priceData.price,
          bitcoinChange24h: bitcoinData.price.change24h || priceData.priceChange24h,
          bitcoinPriceDirection: priceDirection,
          hashRate: bitcoinData.network.hashRate,
          networkHealth: networkHealth,
          fearGreedIndex: bitcoinData.sentiment.fearGreedIndex,
          fearGreedValue: bitcoinData.sentiment.fearGreedValue,
          marketCap: priceData.marketCap,
          volume24h: priceData.volume24h,
          allTimeHigh: priceData.allTimeHigh,
          nextHalving: bitcoinData.network.nextHalving,
          mempoolSize: bitcoinData.network.mempoolSize,
          mempoolFees: bitcoinData.network.mempoolFees,
          lightningCapacity: bitcoinData.network.lightningCapacity,
          lastUpdated: bitcoinData.lastUpdated,
        },
        data: {
          fullBitcoinData: bitcoinData,
          enhancedMarketData: priceData,
        },
      };
    } catch (error) {
      return {
        text: `Bitcoin market data temporarily unavailable: ${error.message}`,
        values: { bitcoinDataError: true },
      };
    }
  },
}; 