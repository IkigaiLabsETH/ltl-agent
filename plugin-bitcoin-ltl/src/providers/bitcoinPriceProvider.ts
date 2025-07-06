import { Provider, IAgentRuntime, Memory, State, ProviderResult, logger } from '@elizaos/core';
import { retryOperation, fetchWithTimeout } from '../utils/networkUtils';
import { LoggerWithContext, PerformanceTracker, generateCorrelationId } from '../utils/loggingUtils';
import { providerCache } from '../utils/cacheUtils';
import { BitcoinDataError, RateLimitError, NetworkError, ElizaOSErrorHandler, ElizaOSError } from '../types/errorTypes';
import { CoinMarketData, BitcoinPriceData } from '../types/marketTypes';

/**
 * Bitcoin Price Provider
 * Fetches real-time Bitcoin price data from CoinGecko API
 */
export const bitcoinPriceProvider: Provider = {
  name: 'BITCOIN_PRICE_PROVIDER',
  description: 'Provides real-time Bitcoin price data, market cap, and trading volume',

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    const correlationId = generateCorrelationId();
    const contextLogger = new LoggerWithContext(correlationId, 'BitcoinPriceProvider');
    const performanceTracker = new PerformanceTracker(contextLogger, 'fetch_bitcoin_price');
    
    // Check cache first
    const cacheKey = 'bitcoin_price_data';
    const cachedData = providerCache.get<ProviderResult>(cacheKey);
    if (cachedData) {
      contextLogger.info('Returning cached Bitcoin price data');
      performanceTracker.finish(true, { source: 'cache' });
      return cachedData;
    }
    
    try {
      contextLogger.info('Fetching Bitcoin price data from CoinGecko');
      
      const result = await retryOperation(async () => {
        const baseUrl = 'https://api.coingecko.com/api/v3';
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        
        contextLogger.debug('Using CoinGecko public API endpoint');

        const response = await fetchWithTimeout(
          `${baseUrl}/coins/markets?vs_currency=usd&ids=bitcoin&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h%2C7d%2C30d`, 
          { headers, timeout: 15000 }
        );
        
        const data = await response.json() as CoinMarketData[];
        return data[0]; // Bitcoin is the only result
      });

      const data = result;

      const priceData: BitcoinPriceData = {
        price: data.current_price || 100000,
        marketCap: data.market_cap || 2000000000000,
        volume24h: data.total_volume || 50000000000,
        priceChange24h: data.price_change_percentage_24h || 0,
        priceChange7d: data.price_change_percentage_7d || 0,
        priceChange30d: 0, // Not available in markets endpoint, would need separate call
        allTimeHigh: data.high_24h || 100000, // Using 24h high as proxy
        allTimeLow: data.low_24h || 3000, // Using 24h low as proxy
        circulatingSupply: 19700000, // Static for Bitcoin
        totalSupply: 19700000, // Static for Bitcoin
        maxSupply: 21000000, // Static for Bitcoin
        lastUpdated: new Date().toISOString(),
      };

      const responseText = `Bitcoin is currently trading at $${priceData.price.toLocaleString()} with a market cap of $${(priceData.marketCap / 1e12).toFixed(2)}T. 24h change: ${priceData.priceChange24h.toFixed(2)}%. Current supply: ${(priceData.circulatingSupply / 1e6).toFixed(2)}M BTC out of 21M max supply.`;
      
      performanceTracker.finish(true, {
        price: priceData.price,
        market_cap_trillions: (priceData.marketCap / 1e12).toFixed(2),
        price_change_24h: priceData.priceChange24h.toFixed(2),
        data_source: 'CoinGecko'
      });
      
      contextLogger.info('Successfully fetched Bitcoin price data', {
        price: priceData.price,
        market_cap: priceData.marketCap,
        volume_24h: priceData.volume24h
      });

      const providerResult: ProviderResult = {
        text: responseText,
        values: priceData,
        data: { 
          source: 'CoinGecko', 
          timestamp: new Date().toISOString(),
          correlation_id: correlationId
        },
      };

      // Cache the result for 1 minute
      providerCache.set(cacheKey, providerResult, 60000);
      contextLogger.debug('Cached Bitcoin price data', { cacheKey, ttl: '60s' });

      return providerResult;
    } catch (error) {
      const errorMessage = error instanceof BitcoinDataError ? error.message : 'Unknown error occurred';
      const errorCode = error instanceof BitcoinDataError ? error.code : 'UNKNOWN_ERROR';
      
      performanceTracker.finish(false, {
        error_code: errorCode,
        error_message: errorMessage
      });
      
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, 'BitcoinPriceProvider');
      ElizaOSErrorHandler.logStructuredError(enhancedError, contextLogger, {
        provider: 'bitcoin_price',
        retryable: error instanceof BitcoinDataError ? error.retryable : false,
        resolution: enhancedError instanceof ElizaOSError ? enhancedError.resolution : undefined
      });
      
      // Provide fallback data with current market estimates
      const fallbackData: BitcoinPriceData = {
        price: 100000, // Current market estimate
        marketCap: 2000000000000, // ~$2T estimate
        volume24h: 50000000000, // ~$50B estimate
        priceChange24h: 0,
        priceChange7d: 0,
        priceChange30d: 0,
        allTimeHigh: 100000,
        allTimeLow: 3000,
        circulatingSupply: 19700000,
        totalSupply: 19700000,
        maxSupply: 21000000,
        lastUpdated: new Date().toISOString(),
      };
      
      return {
        text: `Bitcoin price data unavailable (${errorCode}). Using fallback estimate: $100,000 BTC with ~19.7M circulating supply.`,
        values: fallbackData,
        data: { 
          error: errorMessage,
          code: errorCode,
          fallback: true,
          timestamp: new Date().toISOString(),
          correlation_id: correlationId
        },
      };
    }
  },
}; 