export type AssetClass = 'STOCK' | 'ALTCOIN' | 'COMMODITY' | 'INDEX' | 'CRYPTO';

export interface BTCRelativePerformance {
  assetReturn: number;
  btcReturn: number;
  relativePerformance: number;
  outperformance: number;
}

export interface KeyAsset {
  symbol: string;
  name: string;
  price: number;
  price24h: number;
  assetClass: AssetClass;
  marketCap?: number;
  volume24h?: number;
}

export interface AssetPerformance extends KeyAsset {
  relativePerformance: BTCRelativePerformance;
  volatility?: number;
  correlation?: number;
  rank?: number;
}

export interface AssetClassPerformance {
  assetClass: AssetClass;
  avgRelativePerformance: number;
  topPerformer: AssetPerformance;
  worstPerformer: AssetPerformance;
  assetCount: number;
  totalMarketCap?: number;
}

export interface HistoricalPerformance {
  date: string;
  btcPrice: number;
  assetPrice: number;
  relativePerformance: number;
}

export interface MarketIntelligence {
  overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  opportunities: string[];
  risks: string[];
  narrative: string;
}

export interface BenchmarkResponse {
  btcPrice: number;
  btcPrice24h: number;
  btcReturn: number;
  topPerformers: AssetPerformance[];
  underperformers: AssetPerformance[];
  assetClassPerformance: Record<AssetClass, AssetClassPerformance>;
  marketIntelligence: MarketIntelligence;
  timestamp: string;
}

export interface PerformanceQuery {
  assetSymbol?: string;
  assetClass?: AssetClass;
  limit?: number;
  timeframe?: '24h' | '7d' | '30d';
} 