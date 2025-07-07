import type { Action } from '@elizaos/core';
import type { IAgentRuntime } from '@elizaos/core';
import { BTCPerformanceService } from '../services/btc-performance.service';

export const getBTCBenchmarkAction: Action = {
  name: 'get-btc-benchmark',
  description: 'Get comprehensive BTC-relative performance benchmark across all asset classes',

  validate: async (runtime: IAgentRuntime, message: any, state?: any): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('btc benchmark') ||
      text.includes('bitcoin benchmark') ||
      text.includes('performance benchmark') ||
      text.includes('asset performance') ||
      text.includes('vs bitcoin') ||
      text.includes('relative performance')
    );
  },

  handler: async (runtime: IAgentRuntime, message: any, state?: any, options?: any, callback?: any) => {
    try {
      const btcPerformanceService = runtime.getService('btc-performance') as BTCPerformanceService;
      
      if (!btcPerformanceService) {
        return {
          success: false,
          error: 'BTC Performance service not available'
        };
      }

      const benchmark = await btcPerformanceService.getBTCBenchmark();
      
      let response = `## Bitcoin Performance Benchmark\n\n`;
      response += `**Bitcoin Price**: $${benchmark.btcPrice.toLocaleString()}\n`;
      response += `**24h Change**: ${benchmark.btcReturn > 0 ? '+' : ''}${benchmark.btcReturn.toFixed(2)}%\n`;
      response += `**Market Sentiment**: ${benchmark.marketIntelligence.overallSentiment}\n`;
      response += `**Risk Level**: ${benchmark.marketIntelligence.riskLevel}\n\n`;

      response += `### Top Performers vs Bitcoin\n`;
      benchmark.topPerformers.forEach((asset, index) => {
        response += `${index + 1}. **${asset.symbol}** (${asset.name}) - ${asset.relativePerformance.relativePerformance > 0 ? '+' : ''}${asset.relativePerformance.relativePerformance.toFixed(2)}% vs BTC\n`;
      });

      response += `\n### Underperformers vs Bitcoin\n`;
      benchmark.underperformers.forEach((asset, index) => {
        response += `${index + 1}. **${asset.symbol}** (${asset.name}) - ${asset.relativePerformance.relativePerformance.toFixed(2)}% vs BTC\n`;
      });

      response += `\n### Asset Class Performance\n`;
      Object.entries(benchmark.assetClassPerformance).forEach(([assetClass, performance]) => {
        response += `**${assetClass}**: Avg ${performance.avgRelativePerformance > 0 ? '+' : ''}${performance.avgRelativePerformance.toFixed(2)}% vs BTC (${performance.assetCount} assets)\n`;
      });

      response += `\n### Market Intelligence\n`;
      response += `**Narrative**: ${benchmark.marketIntelligence.narrative}\n\n`;
      
      if (benchmark.marketIntelligence.opportunities.length > 0) {
        response += `**Opportunities**:\n`;
        benchmark.marketIntelligence.opportunities.forEach(opp => {
          response += `• ${opp}\n`;
        });
      }

      if (benchmark.marketIntelligence.risks.length > 0) {
        response += `\n**Risks**:\n`;
        benchmark.marketIntelligence.risks.forEach(risk => {
          response += `• ${risk}\n`;
        });
      }

      response += `\n*Data as of ${new Date(benchmark.timestamp).toLocaleString()}*`;

      const responseContent = {
        thought: `Retrieved comprehensive BTC performance benchmark with ${benchmark.topPerformers.length} top performers and ${benchmark.underperformers.length} underperformers.`,
        text: response,
        actions: ["get-btc-benchmark"],
      };

      if (callback) {
        await callback(responseContent);
      }

      return true;
    } catch (error) {
      console.error("[GetBTCBenchmarkAction] Error:", error);

      const errorResponse = {
        thought: "Failed to get BTC benchmark data from service.",
        text: `Failed to get BTC benchmark: ${error instanceof Error ? error.message : 'Unknown error'}`,
        actions: ["get-btc-benchmark"],
      };

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  }
}; 