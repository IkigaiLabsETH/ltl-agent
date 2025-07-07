import type { 
  BTCRelativePerformance,
  AssetClass,
  KeyAsset,
  AssetPerformance,
  AssetClassPerformance,
  MarketIntelligence
} from '../types/btc-performance.types';

export function calculateBTCRelativePerformance(
  assetPrice: number,
  btcPrice: number,
  assetPrice24h: number,
  btcPrice24h: number
): BTCRelativePerformance {
  const assetReturn = ((assetPrice - assetPrice24h) / assetPrice24h) * 100;
  const btcReturn = ((btcPrice - btcPrice24h) / btcPrice24h) * 100;
  const relativePerformance = assetReturn - btcReturn;
  const outperformance = relativePerformance;

  return {
    assetReturn,
    btcReturn,
    relativePerformance,
    outperformance
  };
}

export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * 100; // Convert to percentage
}

export function calculateCorrelation(assetPrices: number[], btcPrices: number[]): number {
  if (assetPrices.length !== btcPrices.length || assetPrices.length < 2) return 0;
  
  const assetReturns: number[] = [];
  const btcReturns: number[] = [];
  
  for (let i = 1; i < assetPrices.length; i++) {
    assetReturns.push((assetPrices[i] - assetPrices[i - 1]) / assetPrices[i - 1]);
    btcReturns.push((btcPrices[i] - btcPrices[i - 1]) / btcPrices[i - 1]);
  }
  
  const assetMean = assetReturns.reduce((sum, ret) => sum + ret, 0) / assetReturns.length;
  const btcMean = btcReturns.reduce((sum, ret) => sum + ret, 0) / btcReturns.length;
  
  let numerator = 0;
  let assetDenominator = 0;
  let btcDenominator = 0;
  
  for (let i = 0; i < assetReturns.length; i++) {
    const assetDiff = assetReturns[i] - assetMean;
    const btcDiff = btcReturns[i] - btcMean;
    
    numerator += assetDiff * btcDiff;
    assetDenominator += assetDiff * assetDiff;
    btcDenominator += btcDiff * btcDiff;
  }
  
  if (assetDenominator === 0 || btcDenominator === 0) return 0;
  
  return numerator / Math.sqrt(assetDenominator * btcDenominator);
}

export function rankAssetsByPerformance(
  assets: KeyAsset[],
  btcPrice: number,
  btcPrice24h: number
): AssetPerformance[] {
  const performances: AssetPerformance[] = assets.map(asset => ({
    ...asset,
    relativePerformance: calculateBTCRelativePerformance(
      asset.price,
      btcPrice,
      asset.price24h,
      btcPrice24h
    )
  }));
  
  return performances.sort((a, b) => 
    b.relativePerformance.relativePerformance - a.relativePerformance.relativePerformance
  );
}

export function aggregateAssetClassPerformance(
  assets: KeyAsset[],
  btcPrice: number,
  btcPrice24h: number
): Record<AssetClass, AssetClassPerformance> {
  const performances = rankAssetsByPerformance(assets, btcPrice, btcPrice24h);
  const grouped = new Map<AssetClass, AssetPerformance[]>();
  
  performances.forEach(asset => {
    if (!grouped.has(asset.assetClass)) {
      grouped.set(asset.assetClass, []);
    }
    grouped.get(asset.assetClass)!.push(asset);
  });
  
  const result: Record<AssetClass, AssetClassPerformance> = {} as Record<AssetClass, AssetClassPerformance>;
  
  grouped.forEach((assets, assetClass) => {
    const avgRelativePerformance = assets.reduce(
      (sum, asset) => sum + asset.relativePerformance.relativePerformance, 
      0
    ) / assets.length;
    
    result[assetClass] = {
      assetClass,
      avgRelativePerformance,
      topPerformer: assets[0],
      worstPerformer: assets[assets.length - 1],
      assetCount: assets.length,
      totalMarketCap: assets.reduce((sum, asset) => sum + (asset.marketCap || 0), 0)
    };
  });
  
  return result;
}

export function generateMarketIntelligence(
  assets: KeyAsset[],
  btcPrice: number,
  btcPrice24h: number
): MarketIntelligence {
  const performances = rankAssetsByPerformance(assets, btcPrice, btcPrice24h);
  const btcReturn = ((btcPrice - btcPrice24h) / btcPrice24h) * 100;
  
  // Calculate overall sentiment
  const positiveAssets = performances.filter(p => p.relativePerformance.relativePerformance > 0);
  const negativeAssets = performances.filter(p => p.relativePerformance.relativePerformance < 0);
  
  let overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (positiveAssets.length > negativeAssets.length * 1.5) {
    overallSentiment = 'BULLISH';
  } else if (negativeAssets.length > positiveAssets.length * 1.5) {
    overallSentiment = 'BEARISH';
  }
  
  // Calculate risk level
  const avgVolatility = performances.reduce((sum, p) => sum + (p.volatility || 0), 0) / performances.length;
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (avgVolatility > 5) {
    riskLevel = 'HIGH';
  } else if (avgVolatility < 2) {
    riskLevel = 'LOW';
  }
  
  // Generate opportunities
  const opportunities: string[] = [];
  if (btcReturn > 0) {
    opportunities.push('Bitcoin showing positive momentum');
  }
  if (positiveAssets.length > 0) {
    opportunities.push(`${positiveAssets.length} assets outperforming Bitcoin`);
  }
  
  // Generate risks
  const risks: string[] = [];
  if (btcReturn < 0) {
    risks.push('Bitcoin showing negative momentum');
  }
  if (negativeAssets.length > 0) {
    risks.push(`${negativeAssets.length} assets underperforming Bitcoin`);
  }
  if (avgVolatility > 5) {
    risks.push('High market volatility detected');
  }
  
  const narrative = generateNarrative(assets, btcPrice, btcPrice24h);
  
  return {
    overallSentiment,
    riskLevel,
    opportunities,
    risks,
    narrative
  };
}

export function generateNarrative(
  assets: KeyAsset[],
  btcPrice: number,
  btcPrice24h: number
): string {
  const btcReturn = ((btcPrice - btcPrice24h) / btcPrice24h) * 100;
  const performances = rankAssetsByPerformance(assets, btcPrice, btcPrice24h);
  
  const topPerformer = performances[0];
  const worstPerformer = performances[performances.length - 1];
  
  let narrative = `Bitcoin is currently ${btcReturn > 0 ? 'up' : 'down'} ${Math.abs(btcReturn).toFixed(2)}% in the last 24 hours. `;
  
  if (topPerformer && worstPerformer) {
    narrative += `${topPerformer.symbol} is leading with ${topPerformer.relativePerformance.relativePerformance.toFixed(2)}% outperformance, `;
    narrative += `while ${worstPerformer.symbol} is lagging with ${worstPerformer.relativePerformance.relativePerformance.toFixed(2)}% underperformance. `;
  }
  
  const positiveCount = performances.filter(p => p.relativePerformance.relativePerformance > 0).length;
  const totalCount = performances.length;
  
  narrative += `${positiveCount} out of ${totalCount} assets are outperforming Bitcoin, `;
  narrative += `indicating a ${positiveCount > totalCount / 2 ? 'broad' : 'selective'} market rally.`;
  
  return narrative;
} 