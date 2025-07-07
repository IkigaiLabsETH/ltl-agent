/**
 * BTC Performance Utilities
 * Core functions for calculating and analyzing BTC-relative performance
 */

import {
  BTCPerformanceMetrics,
  AssetPerformance,
  AssetClassPerformance,
  PerformanceTrend,
  AssetCategory,
  BTCPerformanceBenchmark,
} from '../types/btcPerformanceTypes';

// ============================================================================
// CORE PERFORMANCE CALCULATIONS
// ============================================================================

/**
 * Calculate BTC-relative performance metrics
 */
export function calculateBTCPerformance(
  assetPrice: number,
  btcPrice: number,
  assetPrice24h: number,
  btcPrice24h: number,
  assetPrice7d: number,
  btcPrice7d: number,
  assetPrice30d: number,
  btcPrice30d: number,
  assetPriceYTD: number,
  btcPriceYTD: number,
  assetPriceInception: number,
  btcPriceInception: number
): BTCPerformanceMetrics {
  // Calculate percentage changes
  const assetChange24h = ((assetPrice - assetPrice24h) / assetPrice24h) * 100;
  const btcChange24h = ((btcPrice - btcPrice24h) / btcPrice24h) * 100;
  const performance24h = assetChange24h - btcChange24h;

  const assetChange7d = ((assetPrice - assetPrice7d) / assetPrice7d) * 100;
  const btcChange7d = ((btcPrice - btcPrice7d) / btcPrice7d) * 100;
  const performance7d = assetChange7d - btcChange7d;

  const assetChange30d = ((assetPrice - assetPrice30d) / assetPrice30d) * 100;
  const btcChange30d = ((btcPrice - btcPrice30d) / btcPrice30d) * 100;
  const performance30d = assetChange30d - btcChange30d;

  const assetChangeYTD = ((assetPrice - assetPriceYTD) / assetPriceYTD) * 100;
  const btcChangeYTD = ((btcPrice - btcPriceYTD) / btcPriceYTD) * 100;
  const performanceYTD = assetChangeYTD - btcChangeYTD;

  const assetChangeInception = ((assetPrice - assetPriceInception) / assetPriceInception) * 100;
  const btcChangeInception = ((btcPrice - btcPriceInception) / btcPriceInception) * 100;
  const performanceInception = assetChangeInception - btcChangeInception;

  return {
    performance24h,
    performance7d,
    performance30d,
    performanceYTD,
    performanceInception,
    outperformingBTC: performanceYTD > 0,
    rank: 0, // Will be set by ranking function
    volatilityVsBTC: 0, // Will be calculated separately
    correlationWithBTC: 0, // Will be calculated separately
    narrative: generatePerformanceNarrative(performanceYTD),
    keyDrivers: identifyKeyDrivers(performanceYTD, assetChangeYTD, btcChangeYTD),
    lastUpdated: new Date(),
  };
}

/**
 * Calculate volatility vs BTC
 */
export function calculateVolatilityVsBTC(
  assetPrices: number[],
  btcPrices: number[]
): number {
  if (assetPrices.length !== btcPrices.length || assetPrices.length < 2) {
    return 0;
  }

  // Calculate daily returns
  const assetReturns = [];
  const btcReturns = [];

  for (let i = 1; i < assetPrices.length; i++) {
    const assetReturn = (assetPrices[i] - assetPrices[i - 1]) / assetPrices[i - 1];
    const btcReturn = (btcPrices[i] - btcPrices[i - 1]) / btcPrices[i - 1];
    
    assetReturns.push(assetReturn);
    btcReturns.push(btcReturn);
  }

  // Calculate relative volatility
  const assetVolatility = calculateStandardDeviation(assetReturns);
  const btcVolatility = calculateStandardDeviation(btcReturns);
  
  return assetVolatility / btcVolatility;
}

/**
 * Calculate correlation with BTC
 */
export function calculateCorrelationWithBTC(
  assetPrices: number[],
  btcPrices: number[]
): number {
  if (assetPrices.length !== btcPrices.length || assetPrices.length < 2) {
    return 0;
  }

  // Calculate daily returns
  const assetReturns = [];
  const btcReturns = [];

  for (let i = 1; i < assetPrices.length; i++) {
    const assetReturn = (assetPrices[i] - assetPrices[i - 1]) / assetPrices[i - 1];
    const btcReturn = (btcPrices[i] - btcPrices[i - 1]) / btcPrices[i - 1];
    
    assetReturns.push(assetReturn);
    btcReturns.push(btcReturn);
  }

  return calculatePearsonCorrelation(assetReturns, btcReturns);
}

// ============================================================================
// RANKING AND SORTING
// ============================================================================

/**
 * Rank assets by BTC-relative performance
 */
export function rankAssetsByPerformance(
  assets: AssetPerformance[]
): AssetPerformance[] {
  return assets
    .map((asset, index) => ({
      ...asset,
      vsBTC: {
        ...asset.vsBTC,
        rank: index + 1,
      },
    }))
    .sort((a, b) => b.vsBTC.performanceYTD - a.vsBTC.performanceYTD);
}

/**
 * Get top performers vs BTC
 */
export function getTopPerformers(
  assets: AssetPerformance[],
  count: number = 10
): AssetPerformance[] {
  return rankAssetsByPerformance(assets).slice(0, count);
}

/**
 * Get underperformers vs BTC
 */
export function getUnderperformers(
  assets: AssetPerformance[],
  count: number = 10
): AssetPerformance[] {
  return rankAssetsByPerformance(assets).slice(-count).reverse();
}

// ============================================================================
// ASSET CLASS AGGREGATION
// ============================================================================

/**
 * Calculate aggregate performance for an asset class
 */
export function calculateAssetClassPerformance(
  category: AssetCategory,
  assets: AssetPerformance[]
): AssetClassPerformance {
  if (assets.length === 0) {
    return {
      category,
      name: getCategoryName(category),
      description: getCategoryDescription(category),
      aggregatePerformance: {
        performance24h: 0,
        performance7d: 0,
        performance30d: 0,
        performanceYTD: 0,
        performanceInception: 0,
        outperformingBTC: false,
        rank: 0,
        volatilityVsBTC: 0,
        correlationWithBTC: 0,
        narrative: '',
        keyDrivers: [],
        lastUpdated: new Date(),
      },
      assets: [],
      topPerformers: [],
      underperformers: [],
      averagePerformance: 0,
      marketShare: 0,
      narrative: '',
      lastUpdated: new Date(),
    };
  }

  // Calculate average performance
  const avgPerformance24h = assets.reduce((sum, asset) => sum + asset.vsBTC.performance24h, 0) / assets.length;
  const avgPerformance7d = assets.reduce((sum, asset) => sum + asset.vsBTC.performance7d, 0) / assets.length;
  const avgPerformance30d = assets.reduce((sum, asset) => sum + asset.vsBTC.performance30d, 0) / assets.length;
  const avgPerformanceYTD = assets.reduce((sum, asset) => sum + asset.vsBTC.performanceYTD, 0) / assets.length;
  const avgPerformanceInception = assets.reduce((sum, asset) => sum + asset.vsBTC.performanceInception, 0) / assets.length;

  // Calculate total market cap
  const totalMarketCap = assets.reduce((sum, asset) => sum + asset.marketCap, 0);

  // Get top and bottom performers
  const rankedAssets = rankAssetsByPerformance(assets);
  const topPerformers = rankedAssets.slice(0, Math.min(5, rankedAssets.length));
  const underperformers = rankedAssets.slice(-Math.min(5, rankedAssets.length)).reverse();

  return {
    category,
    name: getCategoryName(category),
    description: getCategoryDescription(category),
    aggregatePerformance: {
      performance24h: avgPerformance24h,
      performance7d: avgPerformance7d,
      performance30d: avgPerformance30d,
      performanceYTD: avgPerformanceYTD,
      performanceInception: avgPerformanceInception,
      outperformingBTC: avgPerformanceYTD > 0,
      rank: 0, // Will be set when ranking asset classes
      volatilityVsBTC: 0, // Will be calculated separately
      correlationWithBTC: 0, // Will be calculated separately
      narrative: generateAssetClassNarrative(category, avgPerformanceYTD),
      keyDrivers: identifyAssetClassDrivers(category, avgPerformanceYTD),
      lastUpdated: new Date(),
    },
    assets,
    topPerformers,
    underperformers,
    averagePerformance: avgPerformanceYTD,
    marketShare: 0, // Will be calculated when we have total market cap
    narrative: generateAssetClassNarrative(category, avgPerformanceYTD),
    lastUpdated: new Date(),
  };
}

// ============================================================================
// MARKET INTELLIGENCE
// ============================================================================

/**
 * Calculate altcoin season index (0-100)
 * 0 = Bitcoin dominated, 100 = Altcoin season
 */
export function calculateAltcoinSeasonIndex(
  btcPerformance: number,
  altcoinPerformance: number
): number {
  // Normalize to 0-100 scale
  const btcNormalized = Math.max(0, Math.min(100, (btcPerformance + 100) / 2));
  const altcoinNormalized = Math.max(0, Math.min(100, (altcoinPerformance + 100) / 2));
  
  // Altcoin season index is inverse of BTC dominance
  return Math.max(0, Math.min(100, 100 - btcNormalized));
}

/**
 * Determine market sentiment based on BTC performance
 */
export function determineMarketSentiment(
  btcPerformance: number,
  altcoinSeasonIndex: number
): 'BULLISH' | 'NEUTRAL' | 'BEARISH' {
  if (btcPerformance > 10 && altcoinSeasonIndex < 40) {
    return 'BULLISH';
  } else if (btcPerformance < -10 || altcoinSeasonIndex > 70) {
    return 'BEARISH';
  } else {
    return 'NEUTRAL';
  }
}

/**
 * Generate performance trend analysis
 */
export function analyzePerformanceTrend(
  performance24h: number,
  performance7d: number,
  performance30d: number
): PerformanceTrend {
  const recent = performance24h;
  const shortTerm = performance7d;
  const mediumTerm = performance30d;

  let direction: 'IMPROVING' | 'DECLINING' | 'STABLE';
  let magnitude = 0;
  let confidence = 0;
  const keyFactors: string[] = [];

  // Determine direction
  if (recent > shortTerm && shortTerm > mediumTerm) {
    direction = 'IMPROVING';
    magnitude = Math.abs(recent - mediumTerm);
    keyFactors.push('Consistent upward momentum');
  } else if (recent < shortTerm && shortTerm < mediumTerm) {
    direction = 'DECLINING';
    magnitude = Math.abs(recent - mediumTerm);
    keyFactors.push('Consistent downward pressure');
  } else {
    direction = 'STABLE';
    magnitude = Math.abs(recent - mediumTerm);
    keyFactors.push('Mixed performance signals');
  }

  // Calculate confidence based on consistency
  const variance = Math.abs(recent - shortTerm) + Math.abs(shortTerm - mediumTerm);
  confidence = Math.max(0, Math.min(100, 100 - variance));

  // Add specific factors
  if (Math.abs(recent) > 5) {
    keyFactors.push('High recent volatility');
  }
  if (Math.abs(shortTerm - mediumTerm) < 2) {
    keyFactors.push('Stable medium-term trend');
  }

  return {
    direction,
    magnitude,
    confidence,
    keyFactors,
  };
}

// ============================================================================
// NARRATIVE GENERATION
// ============================================================================

/**
 * Generate performance narrative
 */
export function generatePerformanceNarrative(performanceYTD: number): string {
  if (performanceYTD > 20) {
    return 'Exceptional outperformance vs Bitcoin - strong momentum and fundamentals';
  } else if (performanceYTD > 10) {
    return 'Significant outperformance vs Bitcoin - positive trend developing';
  } else if (performanceYTD > 0) {
    return 'Modest outperformance vs Bitcoin - holding ground';
  } else if (performanceYTD > -10) {
    return 'Slight underperformance vs Bitcoin - within normal range';
  } else if (performanceYTD > -20) {
    return 'Significant underperformance vs Bitcoin - concerning trend';
  } else {
    return 'Severe underperformance vs Bitcoin - fundamental issues likely';
  }
}

/**
 * Generate asset class narrative
 */
export function generateAssetClassNarrative(
  category: AssetCategory,
  performanceYTD: number
): string {
  const categoryName = getCategoryName(category);
  
  if (performanceYTD > 10) {
    return `${categoryName} showing strong momentum vs Bitcoin - capital rotation evident`;
  } else if (performanceYTD > 0) {
    return `${categoryName} performing well vs Bitcoin - maintaining relative strength`;
  } else if (performanceYTD > -10) {
    return `${categoryName} underperforming vs Bitcoin - Bitcoin dominance continues`;
  } else {
    return `${categoryName} significantly underperforming vs Bitcoin - strong Bitcoin narrative`;
  }
}

/**
 * Identify key performance drivers
 */
export function identifyKeyDrivers(
  performanceYTD: number,
  assetChangeYTD: number,
  btcChangeYTD: number
): string[] {
  const drivers: string[] = [];

  if (performanceYTD > 0) {
    if (assetChangeYTD > 0 && btcChangeYTD < 0) {
      drivers.push('Asset strength during Bitcoin weakness');
    } else if (assetChangeYTD > btcChangeYTD) {
      drivers.push('Outperforming Bitcoin in bull market');
    }
  } else {
    if (assetChangeYTD < 0 && btcChangeYTD > 0) {
      drivers.push('Asset weakness during Bitcoin strength');
    } else if (assetChangeYTD < btcChangeYTD) {
      drivers.push('Underperforming Bitcoin in bull market');
    }
  }

  if (Math.abs(performanceYTD) > 20) {
    drivers.push('Extreme relative performance - potential mean reversion');
  }

  return drivers;
}

/**
 * Identify asset class drivers
 */
export function identifyAssetClassDrivers(
  category: AssetCategory,
  performanceYTD: number
): string[] {
  const drivers: string[] = [];

  switch (category) {
    case 'BITCOIN_RELATED_STOCK':
      if (performanceYTD > 0) {
        drivers.push('Bitcoin adoption narrative strengthening');
        drivers.push('Institutional Bitcoin exposure demand');
      } else {
        drivers.push('Bitcoin-related stocks lagging Bitcoin itself');
      }
      break;
    case 'MAG7_STOCK':
      if (performanceYTD > 0) {
        drivers.push('Tech sector rotation from Bitcoin');
        drivers.push('Traditional finance outperformance');
      } else {
        drivers.push('Bitcoin outperforming traditional tech');
      }
      break;
    case 'TOP_ALTCOIN':
      if (performanceYTD > 0) {
        drivers.push('Altcoin season developing');
        drivers.push('Capital rotation from Bitcoin');
      } else {
        drivers.push('Bitcoin dominance in crypto');
        drivers.push('Altcoin weakness vs Bitcoin');
      }
      break;
    case 'COMMODITY':
      if (performanceYTD > 0) {
        drivers.push('Commodity outperformance vs Bitcoin');
        drivers.push('Inflation hedge narrative');
      } else {
        drivers.push('Bitcoin as superior inflation hedge');
      }
      break;
  }

  return drivers;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate Pearson correlation
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Get category name
 */
function getCategoryName(category: AssetCategory): string {
  switch (category) {
    case 'BITCOIN_RELATED_STOCK': return 'Bitcoin-Related Stocks';
    case 'MAG7_STOCK': return 'Magnificent 7 Stocks';
    case 'TECH_STOCK': return 'Technology Stocks';
    case 'INDEX': return 'Market Indices';
    case 'COMMODITY': return 'Commodities';
    case 'TOP_ALTCOIN': return 'Top Altcoins';
    case 'MID_ALTCOIN': return 'Mid-Cap Altcoins';
    case 'SMALL_ALTCOIN': return 'Small-Cap Altcoins';
    default: return 'Unknown Category';
  }
}

/**
 * Get category description
 */
function getCategoryDescription(category: AssetCategory): string {
  switch (category) {
    case 'BITCOIN_RELATED_STOCK': return 'Stocks with direct Bitcoin exposure or mining operations';
    case 'MAG7_STOCK': return 'The seven largest technology stocks by market cap';
    case 'TECH_STOCK': return 'Technology sector stocks excluding MAG7';
    case 'INDEX': return 'Major market indices and benchmarks';
    case 'COMMODITY': return 'Traditional commodities like gold and silver';
    case 'TOP_ALTCOIN': return 'Top 20 cryptocurrencies by market cap';
    case 'MID_ALTCOIN': return 'Mid-cap cryptocurrencies (rank 21-100)';
    case 'SMALL_ALTCOIN': return 'Small-cap cryptocurrencies (rank 101+)';
    default: return 'Unknown category description';
  }
} 