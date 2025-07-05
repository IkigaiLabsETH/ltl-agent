import { IAgentRuntime, Provider, elizaLogger, Memory, State } from '@elizaos/core';
import { StockDataService } from '../services/StockDataService';

/**
 * Stock Provider - Injects contextual stock market information
 * 
 * This standard provider adds stock market context including:
 * - Curated stock performance data
 * - MAG7 stocks comparison and analysis
 * - Bitcoin-related equities performance
 * - Sector rotation and market trends
 * - Performance vs S&P 500 benchmarks
 * 
 * Usage: Automatically included in standard context composition
 */
export const stockProvider: Provider = {
  name: 'stock',
  description: 'Provides stock market data, MAG7 analysis, and Bitcoin equity performance',
  position: 2, // After Bitcoin data but before complex analysis
  
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    elizaLogger.debug('📈 [StockProvider] Providing stock market context');
    
    try {
      // Get the stock data service
      const stockService = runtime.getService('stock-data') as StockDataService;
      if (!stockService) {
        elizaLogger.warn('[StockProvider] StockDataService not available');
        return {
          text: 'Stock market data temporarily unavailable.',
          values: {
            stockDataAvailable: false,
            error: 'Service not found'
          },
        };
      }

      // Get comprehensive stock data
      const stockData = stockService.getStockData();
      const bitcoinStocks = stockService.getBitcoinRelatedStocks();
      const performanceComparisons = stockService.getPerformanceComparisons();
      const mag7Performance = stockService.getMag7Performance();
      
      if (!stockData) {
        elizaLogger.debug('[StockProvider] No stock data available yet');
        return {
          text: 'Stock market data is being updated. Please try again in a few moments.',
          values: {
            stockDataAvailable: false,
            updating: true
          },
        };
      }

      // Analyze market conditions
      const marketAnalysis = analyzeStockMarketConditions(stockData, mag7Performance);
      
      // Find standout Bitcoin-related stocks
      const bitcoinStockPerformers = analyzeBitcoinStockPerformance(bitcoinStocks, stockData);
      
      // Analyze sector performance
      const sectorAnalysis = analyzeSectorPerformance(stockData.stocks, performanceComparisons);
      
      // Build stock market context
      const stockContext = buildStockContext(
        marketAnalysis,
        bitcoinStockPerformers,
        sectorAnalysis,
        stockData,
        mag7Performance
      );

      elizaLogger.debug(`[StockProvider] Providing context for ${stockData.stocks.length} stocks, ${mag7Performance.length} MAG7`);
      
      return {
        text: stockContext,
        values: {
          stockDataAvailable: true,
          totalStocksTracked: stockData.stocks.length,
          mag7Count: mag7Performance.length,
          bitcoinStocksCount: bitcoinStocks.length,
          topPerformersCount: stockData.performance.topPerformers.length,
          underperformersCount: stockData.performance.underperformers.length,
          mag7AveragePerformance: stockData.performance.mag7Average,
          sp500Performance: stockData.performance.sp500Performance,
          bitcoinRelatedAverage: stockData.performance.bitcoinRelatedAverage,
          techStocksAverage: stockData.performance.techStocksAverage,
          marketSentiment: marketAnalysis.sentiment,
          sectorRotation: sectorAnalysis.rotationSignal,
          bitcoinStockOutperformers: bitcoinStockPerformers.outperformers.length,
          // Include data for actions to access
          stocks: stockData.stocks,
          mag7: mag7Performance,
          bitcoinStocks: bitcoinStocks,
          performanceComparisons: performanceComparisons,
          marketAnalysis: marketAnalysis,
          sectorAnalysis: sectorAnalysis
        },
      };
      
    } catch (error) {
      elizaLogger.error('[StockProvider] Error providing stock context:', error);
      return {
        text: 'Stock market services encountered an error. Please try again later.',
        values: {
          stockDataAvailable: false,
          error: error.message
        },
      };
    }
  }
};

/**
 * Helper function to analyze stock market conditions
 */
function analyzeStockMarketConditions(stockData: any, mag7: any[]): any {
  let sentiment = 'neutral';
  let marketTrend = 'sideways';
  let riskOn = false;
  
  if (stockData?.performance) {
    const { mag7Average, sp500Performance, techStocksAverage } = stockData.performance;
    
    // Determine overall sentiment
    if (mag7Average > 3 && techStocksAverage > 2) {
      sentiment = 'bullish';
      marketTrend = 'uptrend';
      riskOn = true;
    } else if (mag7Average < -3 || techStocksAverage < -3) {
      sentiment = 'bearish';
      marketTrend = 'downtrend';
      riskOn = false;
    } else if (mag7Average > 1 && sp500Performance > 0) {
      sentiment = 'cautiously optimistic';
      riskOn = true;
    }
    
    // Check for growth vs value rotation
    const growthVsValue = techStocksAverage - sp500Performance;
    marketTrend = growthVsValue > 2 ? 'growth-leading' : 
                  growthVsValue < -2 ? 'value-rotation' : 'balanced';
  }
  
  return {
    sentiment,
    marketTrend,
    riskOn,
    lastUpdated: stockData?.lastUpdated
  };
}

/**
 * Helper function to analyze Bitcoin-related stock performance
 */
function analyzeBitcoinStockPerformance(bitcoinStocks: any[], allStocks: any): any {
  const analysis = {
    outperformers: [],
    underperformers: [],
    averagePerformance: 0,
    strongSignals: []
  };
  
  if (bitcoinStocks?.length > 0) {
    // Calculate average performance
    const totalChange = bitcoinStocks.reduce((sum, stock) => sum + stock.changePercent, 0);
    analysis.averagePerformance = Math.round((totalChange / bitcoinStocks.length) * 100) / 100;
    
    // Find outperformers (>5% or beating market)
    analysis.outperformers = bitcoinStocks
      .filter(stock => stock.changePercent > 5 || stock.changePercent > (allStocks?.performance?.sp500Performance || 0))
      .sort((a, b) => b.changePercent - a.changePercent);
    
    // Find underperformers
    analysis.underperformers = bitcoinStocks
      .filter(stock => stock.changePercent < -3)
      .sort((a, b) => a.changePercent - b.changePercent);
    
    // Identify strong signals
    if (analysis.outperformers.length > analysis.underperformers.length) {
      analysis.strongSignals.push('Bitcoin equity momentum');
    }
    
    if (analysis.averagePerformance > 3) {
      analysis.strongSignals.push('Strong institutional Bitcoin exposure');
    }
    
    // Check MSTR specifically (often leads the sector)
    const mstr = bitcoinStocks.find(stock => stock.symbol === 'MSTR');
    if (mstr && mstr.changePercent > 8) {
      analysis.strongSignals.push('MSTR leverage signal');
    }
  }
  
  return analysis;
}

/**
 * Helper function to analyze sector performance
 */
function analyzeSectorPerformance(stocks: any[], performanceComparisons: any[]): any {
  const analysis = {
    rotationSignal: 'neutral',
    topSectors: [],
    laggingSectors: [],
    techVsValue: 0
  };
  
  if (stocks?.length > 0) {
    // Group by sector and calculate averages
    const sectorPerformance = {
      tech: [],
      'bitcoin-related': [],
      mag7: []
    };
    
    stocks.forEach(stock => {
      if (sectorPerformance[stock.sector]) {
        sectorPerformance[stock.sector].push(stock.changePercent);
      }
    });
    
    // Calculate sector averages
    const sectorAverages = Object.entries(sectorPerformance).map(([sector, changes]: [string, number[]]) => ({
      sector,
      average: changes.length > 0 ? changes.reduce((sum, change) => sum + change, 0) / changes.length : 0,
      count: changes.length
    })).filter(item => item.count > 0);
    
    // Sort by performance
    sectorAverages.sort((a, b) => b.average - a.average);
    
    analysis.topSectors = sectorAverages.slice(0, 2);
    analysis.laggingSectors = sectorAverages.slice(-2);
    
    // Determine rotation signal
    const techAvg = sectorAverages.find(s => s.sector === 'tech')?.average || 0;
    const btcAvg = sectorAverages.find(s => s.sector === 'bitcoin-related')?.average || 0;
    
    analysis.techVsValue = techAvg;
    
    if (btcAvg > techAvg + 3) {
      analysis.rotationSignal = 'bitcoin-rotation';
    } else if (techAvg > 5) {
      analysis.rotationSignal = 'tech-momentum';
    } else if (techAvg < -3) {
      analysis.rotationSignal = 'risk-off';
    }
  }
  
  return analysis;
}

/**
 * Helper function to build stock market context
 */
function buildStockContext(
  marketAnalysis: any,
  bitcoinStockPerformers: any,
  sectorAnalysis: any,
  stockData: any,
  mag7: any[]
): string {
  const context = [];
  
  // Market overview
  context.push(`📈 STOCK MARKET CONTEXT`);
  context.push(`📊 Market sentiment: ${marketAnalysis.sentiment}`);
  context.push(`🎯 Trend: ${marketAnalysis.marketTrend}`);
  context.push(`💡 Risk appetite: ${marketAnalysis.riskOn ? 'Risk-ON' : 'Risk-OFF'}`);
  context.push('');
  
  // Performance summary
  if (stockData?.performance) {
    context.push(`⚡ PERFORMANCE SUMMARY:`);
    context.push(`• MAG7 average: ${stockData.performance.mag7Average > 0 ? '+' : ''}${stockData.performance.mag7Average?.toFixed(2)}%`);
    context.push(`• S&P 500: ${stockData.performance.sp500Performance > 0 ? '+' : ''}${stockData.performance.sp500Performance?.toFixed(2)}%`);
    context.push(`• Tech stocks: ${stockData.performance.techStocksAverage > 0 ? '+' : ''}${stockData.performance.techStocksAverage?.toFixed(2)}%`);
    context.push(`• Bitcoin equities: ${bitcoinStockPerformers.averagePerformance > 0 ? '+' : ''}${bitcoinStockPerformers.averagePerformance}%`);
    context.push('');
  }
  
  // Bitcoin stock signals
  if (bitcoinStockPerformers.strongSignals.length > 0) {
    context.push(`₿ BITCOIN EQUITY SIGNALS:`);
    bitcoinStockPerformers.strongSignals.forEach((signal: string) => {
      context.push(`• ${signal}`);
    });
    context.push('');
  }
  
  // Top performers
  if (bitcoinStockPerformers.outperformers.length > 0) {
    context.push(`🚀 BITCOIN STOCK LEADERS:`);
    bitcoinStockPerformers.outperformers.slice(0, 3).forEach((stock: any, index: number) => {
      context.push(`${index + 1}. ${stock.symbol}: +${stock.changePercent?.toFixed(2)}%`);
    });
    context.push('');
  }
  
  // Sector rotation
  if (sectorAnalysis.rotationSignal !== 'neutral') {
    context.push(`🔄 SECTOR ROTATION:`);
    context.push(`• Signal: ${sectorAnalysis.rotationSignal}`);
    if (sectorAnalysis.topSectors.length > 0) {
      context.push(`• Leading: ${sectorAnalysis.topSectors[0].sector} (+${sectorAnalysis.topSectors[0].average.toFixed(2)}%)`);
    }
    context.push('');
  }
  
  // Trading insights
  context.push(`💡 INSIGHTS:`);
  context.push(`• Tracking ${stockData.stocks?.length || 0} curated stocks`);
  context.push(`• Bitcoin correlation tracking enabled`);
  context.push(`• Use stock actions for detailed analysis`);
  
  return context.join('\n');
}

export default stockProvider; 