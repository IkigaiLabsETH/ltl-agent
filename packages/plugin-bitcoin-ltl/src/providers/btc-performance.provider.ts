import type { Provider, IAgentRuntime, Memory, State, ProviderResult } from '@elizaos/core';
import { BTCPerformanceService } from '../services/btc-performance.service';

export const btcPerformanceProvider: Provider = {
  name: 'btc-performance',
  description: 'Provides BTC-relative performance context and market intelligence',
  
  async get(
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> {
    try {
      const btcPerformanceService = runtime.getService('btc-performance') as BTCPerformanceService;
      
      if (!btcPerformanceService) {
        return {
          text: 'BTC Performance service not available',
          values: { available: false, error: 'BTC Performance service not available' },
          data: { source: 'btc-performance', timestamp: new Date().toISOString() }
        };
      }

      const benchmark = await btcPerformanceService.getBTCBenchmark();
      
      const responseText = `Bitcoin is currently ${benchmark.btcReturn > 0 ? 'up' : 'down'} ${Math.abs(benchmark.btcReturn).toFixed(2)}% at $${benchmark.btcPrice.toLocaleString()}. Market sentiment: ${benchmark.marketIntelligence.overallSentiment.toLowerCase()}. Top performers: ${benchmark.topPerformers.slice(0, 3).map(asset => `${asset.symbol} (+${asset.relativePerformance.relativePerformance.toFixed(2)}%)`).join(', ')}.`;
      
      return {
        text: responseText,
        values: {
          available: true,
          btcPrice: benchmark.btcPrice,
          btcReturn: benchmark.btcReturn,
          topPerformers: benchmark.topPerformers.slice(0, 3).map(asset => ({
            symbol: asset.symbol,
            name: asset.name,
            outperformance: asset.relativePerformance.relativePerformance.toFixed(2) + '%',
            assetClass: asset.assetClass
          })),
          underperformers: benchmark.underperformers.slice(0, 3).map(asset => ({
            symbol: asset.symbol,
            name: asset.name,
            underperformance: asset.relativePerformance.relativePerformance.toFixed(2) + '%',
            assetClass: asset.assetClass
          })),
          marketSentiment: benchmark.marketIntelligence.overallSentiment,
          riskLevel: benchmark.marketIntelligence.riskLevel,
          opportunities: benchmark.marketIntelligence.opportunities.slice(0, 3),
          risks: benchmark.marketIntelligence.risks.slice(0, 3),
          narrative: benchmark.marketIntelligence.narrative,
          timestamp: benchmark.timestamp
        },
        data: { source: 'btc-performance', timestamp: new Date().toISOString() }
      };
    } catch (error) {
      return {
        text: `Failed to fetch BTC performance data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        values: { available: false, error: `Failed to fetch BTC performance data: ${error instanceof Error ? error.message : 'Unknown error'}` },
        data: { source: 'btc-performance', timestamp: new Date().toISOString() }
      };
    }
  }
}; 