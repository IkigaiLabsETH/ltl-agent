/**
 * BTC Performance System Test
 * Tests the BTC-relative performance tracking system
 */

import { TestSuite } from "@elizaos/core";
import { BTCPerformanceService } from "../services/BTCPerformanceService";
import { calculateBTCPerformance, rankAssetsByPerformance } from "../utils/btcPerformanceUtils";

export const btcPerformanceTestSuite: TestSuite = {
  name: "BTC Performance System Tests",

  tests: [
    {
      name: "BTC Performance Calculation",
      fn: async (runtime) => {
        // Test data
        const assetPrice = 100;
        const btcPrice = 100000;
        const assetPrice24h = 95;
        const btcPrice24h = 98000;
        const assetPrice7d = 90;
        const btcPrice7d = 95000;
        const assetPrice30d = 85;
        const btcPrice30d = 90000;
        const assetPriceYTD = 80;
        const btcPriceYTD = 80000;
        const assetPriceInception = 50;
        const btcPriceInception = 10000;

        const performance = calculateBTCPerformance(
          assetPrice, btcPrice,
          assetPrice24h, btcPrice24h,
          assetPrice7d, btcPrice7d,
          assetPrice30d, btcPrice30d,
          assetPriceYTD, btcPriceYTD,
          assetPriceInception, btcPriceInception
        );

        // Verify calculations
        const expected24h = ((100 - 95) / 95 * 100) - ((100000 - 98000) / 98000 * 100);
        const expectedYTD = ((100 - 80) / 80 * 100) - ((100000 - 80000) / 80000 * 100);

        if (Math.abs(performance.performance24h - expected24h) > 0.01) {
          throw new Error(`24h performance calculation error. Expected: ${expected24h}, Got: ${performance.performance24h}`);
        }

        if (Math.abs(performance.performanceYTD - expectedYTD) > 0.01) {
          throw new Error(`YTD performance calculation error. Expected: ${expectedYTD}, Got: ${performance.performanceYTD}`);
        }

        if (!performance.outperformingBTC) {
          throw new Error("Asset should be outperforming BTC based on test data");
        }
      }
    },

    {
      name: "Asset Ranking",
      fn: async (runtime) => {
        // Create test assets
        const assets = [
          {
            symbol: "MSTR",
            name: "MicroStrategy",
            price: 1500,
            marketCap: 25000000000,
            volume24h: 5000000,
            vsBTC: {
              performance24h: 5.2,
              performance7d: 8.1,
              performance30d: 12.3,
              performanceYTD: 25.7,
              performanceInception: 150.2,
              outperformingBTC: true,
              rank: 0,
              volatilityVsBTC: 1.8,
              correlationWithBTC: 0.85,
              narrative: "Bitcoin-first corporate strategy",
              keyDrivers: ["Bitcoin adoption", "Corporate treasury"],
              lastUpdated: new Date(),
            },
            category: "BITCOIN_RELATED_STOCK" as any,
            narrative: "MicroStrategy - Bitcoin-first corporate strategy",
            lastUpdated: new Date(),
          },
          {
            symbol: "TSLA",
            name: "Tesla",
            price: 245,
            marketCap: 780000000000,
            volume24h: 50000000,
            vsBTC: {
              performance24h: -2.1,
              performance7d: -1.5,
              performance30d: -3.2,
              performanceYTD: -8.9,
              performanceInception: 45.3,
              outperformingBTC: false,
              rank: 0,
              volatilityVsBTC: 1.2,
              correlationWithBTC: 0.65,
              narrative: "Electric vehicles and Bitcoin adoption",
              keyDrivers: ["EV market", "Bitcoin exposure"],
              lastUpdated: new Date(),
            },
            category: "MAG7_STOCK" as any,
            narrative: "Tesla - Electric vehicles and Bitcoin adoption",
            lastUpdated: new Date(),
          },
          {
            symbol: "ETH",
            name: "Ethereum",
            price: 3200,
            marketCap: 380000000000,
            volume24h: 15000000000,
            vsBTC: {
              performance24h: 1.8,
              performance7d: 3.2,
              performance30d: 5.7,
              performanceYTD: 12.4,
              performanceInception: 85.1,
              outperformingBTC: true,
              rank: 0,
              volatilityVsBTC: 1.5,
              correlationWithBTC: 0.92,
              narrative: "Smart contract platform",
              keyDrivers: ["DeFi growth", "Layer 2 scaling"],
              lastUpdated: new Date(),
            },
            category: "TOP_ALTCOIN" as any,
            narrative: "Ethereum - Smart contract platform",
            lastUpdated: new Date(),
          }
        ];

        const rankedAssets = rankAssetsByPerformance(assets);

        // Verify ranking order (should be MSTR, ETH, TSLA)
        if (rankedAssets[0].symbol !== "MSTR") {
          throw new Error(`Expected MSTR to be ranked first, got ${rankedAssets[0].symbol}`);
        }

        if (rankedAssets[1].symbol !== "ETH") {
          throw new Error(`Expected ETH to be ranked second, got ${rankedAssets[1].symbol}`);
        }

        if (rankedAssets[2].symbol !== "TSLA") {
          throw new Error(`Expected TSLA to be ranked third, got ${rankedAssets[2].symbol}`);
        }

        // Verify ranks are set correctly
        if (rankedAssets[0].vsBTC.rank !== 1) {
          throw new Error(`Expected rank 1 for MSTR, got ${rankedAssets[0].vsBTC.rank}`);
        }

        if (rankedAssets[1].vsBTC.rank !== 2) {
          throw new Error(`Expected rank 2 for ETH, got ${rankedAssets[1].vsBTC.rank}`);
        }

        if (rankedAssets[2].vsBTC.rank !== 3) {
          throw new Error(`Expected rank 3 for TSLA, got ${rankedAssets[2].vsBTC.rank}`);
        }
      }
    },

    {
      name: "BTC Performance Service Mock",
      fn: async (runtime) => {
        // This test would require a mock runtime
        // For now, just verify the service can be instantiated
        try {
          // Create a mock runtime-like object
          const mockRuntime = {
            getService: (name: string) => {
              if (name === "bitcoin-intelligence") {
                return {
                  getBitcoinData: async () => ({
                    price: 107940,
                    marketCap: 2165830000000,
                    dominance: 63.89,
                    priceChange24h: 2.3,
                  })
                };
              }
              return null;
            },
            contextLogger: {
              info: () => {},
              warn: () => {},
              error: () => {},
            }
          } as any;

          // Test that we can create the service
          const service = new BTCPerformanceService(mockRuntime);
          
          // Test that the service has the expected methods
          if (typeof service.getBTCBenchmark !== 'function') {
            throw new Error("BTCPerformanceService missing getBTCBenchmark method");
          }

          if (typeof service.getAssetPerformance !== 'function') {
            throw new Error("BTCPerformanceService missing getAssetPerformance method");
          }

          if (typeof service.getTopPerformers !== 'function') {
            throw new Error("BTCPerformanceService missing getTopPerformers method");
          }
        } catch (error) {
          throw new Error(`BTC Performance Service test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    },

    {
      name: "Performance Utilities",
      fn: async (runtime) => {
        // Test altcoin season index calculation
        const btcPerformance = 15.2;
        const altcoinPerformance = 8.7;
        
        // This would test the calculateAltcoinSeasonIndex function
        // For now, just verify our utility functions exist
        if (typeof calculateBTCPerformance !== 'function') {
          throw new Error("calculateBTCPerformance function not found");
        }

        if (typeof rankAssetsByPerformance !== 'function') {
          throw new Error("rankAssetsByPerformance function not found");
        }
      }
    }
  ]
}; 