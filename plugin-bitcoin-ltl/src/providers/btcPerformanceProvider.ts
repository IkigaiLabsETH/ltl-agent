/**
 * BTC Performance Provider
 * Injects BTC-relative performance context into agent responses
 */

import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { BTCPerformanceService } from "../services/BTCPerformanceService";

export const btcPerformanceProvider: Provider = {
  name: "BTC_PERFORMANCE",
  description: "Provides BTC-relative performance data for all tracked assets and market intelligence.",
  position: 2, // High priority, always included

  get: async (runtime: IAgentRuntime, _message: Memory, _state: State) => {
    try {
      const btcPerformanceService = runtime.getService("btc-performance") as unknown as BTCPerformanceService;
      
      if (!btcPerformanceService) {
        return {
          values: {
            btcPerformance: {
              status: "Service not available",
              data: null,
              lastUpdated: new Date().toISOString(),
            }
          }
        };
      }

      const benchmark = await btcPerformanceService.getBTCBenchmark();
      
      if (!benchmark.success || !benchmark.data) {
        return {
          values: {
            btcPerformance: {
              status: "Data unavailable",
              data: null,
              lastUpdated: new Date().toISOString(),
            }
          }
        };
      }

      const data = benchmark.data;
      
      return {
        values: {
          btcPerformance: {
            status: "Available",
            data: {
              // Core BTC metrics
              btcPrice: data.btcPrice,
              btcMarketCap: data.btcMarketCap,
              btcDominance: data.btcDominance,
              btcChange24h: data.btcChange24h,
              
              // Market intelligence
              altcoinSeasonIndex: data.marketIntelligence.altcoinSeasonIndex,
              marketSentiment: data.marketIntelligence.overallMarketSentiment,
              btcOutperformanceTrend: data.marketIntelligence.btcOutperformanceTrend,
              keyNarratives: data.marketIntelligence.keyNarratives,
              
              // Asset class performance
              assetClasses: {
                stocks: {
                  performance: data.assetClasses.stocks.aggregatePerformance.performanceYTD,
                  narrative: data.assetClasses.stocks.narrative,
                  topPerformers: data.assetClasses.stocks.topPerformers.slice(0, 3).map((asset: any) => ({
                    symbol: asset.symbol,
                    performance: asset.vsBTC.performanceYTD,
                  })),
                },
                altcoins: {
                  performance: data.assetClasses.altcoins.aggregatePerformance.performanceYTD,
                  narrative: data.assetClasses.altcoins.narrative,
                  topPerformers: data.assetClasses.altcoins.topPerformers.slice(0, 3).map((asset: any) => ({
                    symbol: asset.symbol,
                    performance: asset.vsBTC.performanceYTD,
                  })),
                },
                commodities: {
                  performance: data.assetClasses.commodities.aggregatePerformance.performanceYTD,
                  narrative: data.assetClasses.commodities.narrative,
                },
                indices: {
                  performance: data.assetClasses.indices.aggregatePerformance.performanceYTD,
                  narrative: data.assetClasses.indices.narrative,
                },
              },
              
              // Key assets
              keyAssets: {
                mstr: data.keyAssets.mstr ? {
                  performance: data.keyAssets.mstr.vsBTC.performanceYTD,
                  btcHoldings: data.keyAssets.mstr.btcHoldings,
                  btcHoldingsValue: data.keyAssets.mstr.btcHoldingsValue,
                } : null,
                ethereum: data.keyAssets.ethereum ? {
                  performance: data.keyAssets.ethereum.vsBTC.performanceYTD,
                } : null,
                gold: data.keyAssets.gold ? {
                  performance: data.keyAssets.gold.vsBTC.performanceYTD,
                } : null,
              },
              
              // Historical context
              historical: {
                btcOutperformanceSinceInception: data.historical.inceptionToDate.btcOutperformance,
                narrative: data.historical.inceptionToDate.narrative,
              },
            },
            lastUpdated: data.lastUpdated.toISOString(),
            cacheStatus: benchmark.cacheStatus,
          },
        },
      };
    } catch (error) {
      return {
        values: {
          btcPerformance: {
            status: "Error",
            error: error instanceof Error ? error.message : "Unknown error",
            data: null,
            lastUpdated: new Date().toISOString(),
          },
        },
      };
    }
  },
}; 