import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IAgentRuntime } from "@elizaos/core";
import { BitcoinNetworkService } from "../../services/BitcoinNetworkService";
import { MarketDataService } from "../../services/MarketDataService";
import { NFTDataService } from "../../services/NFTDataService";
import { NewsDataService } from "../../services/NewsDataService";
import { SocialSentimentService } from "../../services/SocialSentimentService";
import { CentralizedConfigService } from "../../services/CentralizedConfigService";
import { CacheService } from "../../services/CacheService";
import { PerformanceMonitorService } from "../../services/PerformanceMonitorService";

// Mock dependencies
vi.mock("@elizaos/core", () => ({
  elizaLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../../utils", () => ({
  LoggerWithContext: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
  generateCorrelationId: vi.fn(() => "test-correlation-id"),
  globalErrorHandler: {
    handleError: vi.fn(),
  },
}));

/**
 * Performance benchmark results interface
 */
interface BenchmarkResult {
  testName: string;
  duration: number;
  memoryUsage: number;
  operationsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  timestamp: number;
}

/**
 * Performance thresholds for benchmarks
 */
const PERFORMANCE_THRESHOLDS = {
  MAX_RESPONSE_TIME: 5000, // 5 seconds
  MAX_MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
  MIN_OPS_PER_SECOND: 1,
  MAX_ERROR_RATE: 0.05, // 5%
};

describe("Performance Benchmarks", () => {
  let mockRuntime: any;
  let configService: CentralizedConfigService;
  let cacheService: CacheService;
  let performanceMonitor: PerformanceMonitorService;
  let bitcoinNetworkService: BitcoinNetworkService;
  let marketDataService: MarketDataService;
  let nftDataService: NFTDataService;
  let newsDataService: NewsDataService;
  let socialSentimentService: SocialSentimentService;
  let benchmarkResults: BenchmarkResult[] = [];

  beforeEach(async () => {
    // Create mock runtime
    mockRuntime = {
      getService: vi.fn(),
      getSetting: vi.fn(),
    };

    // Setup service dependencies
    mockRuntime.getService.mockImplementation((serviceName: string) => {
      const serviceMap: Record<string, any> = {
        "centralized-config": configService,
        cache: cacheService,
        "performance-monitor": performanceMonitor,
        "bitcoin-network": bitcoinNetworkService,
        "market-data": marketDataService,
        "nft-data": nftDataService,
        "news-data": newsDataService,
        "social-sentiment": socialSentimentService,
      };
      return serviceMap[serviceName] || null;
    });

    // Initialize services
    configService = new CentralizedConfigService(mockRuntime);
    cacheService = new CacheService(mockRuntime);
    performanceMonitor = new PerformanceMonitorService(mockRuntime);
    bitcoinNetworkService = new BitcoinNetworkService(mockRuntime);
    marketDataService = new MarketDataService(mockRuntime);
    nftDataService = new NFTDataService(mockRuntime);
    newsDataService = new NewsDataService(mockRuntime);
    socialSentimentService = new SocialSentimentService(mockRuntime);

    // Start services
    await Promise.all([
      configService.start(),
      cacheService.start(),
      performanceMonitor.start(),
      bitcoinNetworkService.start(),
      marketDataService.start(),
      nftDataService.start(),
      newsDataService.start(),
      socialSentimentService.start(),
    ]);

    benchmarkResults = [];
  });

  afterEach(async () => {
    // Stop all services
    await Promise.all([
      configService.stop(),
      cacheService.stop(),
      performanceMonitor.stop(),
      bitcoinNetworkService.stop(),
      marketDataService.stop(),
      nftDataService.stop(),
      newsDataService.stop(),
      socialSentimentService.stop(),
    ]);

    vi.clearAllMocks();
  });

  /**
   * Helper function to run performance benchmark
   */
  async function runBenchmark(
    testName: string,
    operation: () => Promise<any>,
    iterations: number = 10,
  ): Promise<BenchmarkResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    let errors = 0;
    const responseTimes: number[] = [];

    // Run operations
    for (let i = 0; i < iterations; i++) {
      const operationStart = Date.now();
      try {
        await operation();
        const operationEnd = Date.now();
        responseTimes.push(operationEnd - operationStart);
      } catch (error) {
        errors++;
      }
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    const duration = endTime - startTime;
    const memoryUsage = endMemory - startMemory;
    const operationsPerSecond = iterations / (duration / 1000);
    const averageResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const errorRate = errors / iterations;

    const result: BenchmarkResult = {
      testName,
      duration,
      memoryUsage,
      operationsPerSecond,
      averageResponseTime,
      errorRate,
      timestamp: Date.now(),
    };

    benchmarkResults.push(result);
    return result;
  }

  /**
   * Helper function to validate benchmark results
   */
  function validateBenchmarkResult(result: BenchmarkResult): void {
    expect(result.duration).toBeLessThan(
      PERFORMANCE_THRESHOLDS.MAX_RESPONSE_TIME,
    );
    expect(result.memoryUsage).toBeLessThan(
      PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE,
    );
    expect(result.operationsPerSecond).toBeGreaterThan(
      PERFORMANCE_THRESHOLDS.MIN_OPS_PER_SECOND,
    );
    expect(result.errorRate).toBeLessThan(
      PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE,
    );
  }

  describe("Service Initialization Performance", () => {
    it("should initialize all services within acceptable time", async () => {
      const result = await runBenchmark(
        "Service Initialization",
        async () => {
          const services = [
            new BitcoinNetworkService(mockRuntime),
            new MarketDataService(mockRuntime),
            new NFTDataService(mockRuntime),
            new NewsDataService(mockRuntime),
            new SocialSentimentService(mockRuntime),
          ];

          await Promise.all(services.map((service) => service.start()));
          await Promise.all(services.map((service) => service.stop()));
        },
        5,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(2000); // 2 seconds
    });

    it("should handle concurrent service initialization", async () => {
      const result = await runBenchmark(
        "Concurrent Service Initialization",
        async () => {
          const servicePromises = Array(5)
            .fill(null)
            .map(() => {
              const service = new BitcoinNetworkService(mockRuntime);
              return service.start().then(() => service.stop());
            });

          await Promise.all(servicePromises);
        },
        3,
      );

      validateBenchmarkResult(result);
    });
  });

  describe("Data Update Performance", () => {
    beforeEach(() => {
      // Mock API responses for consistent testing
      const { default: axios } = require("axios");
      (axios.get as any).mockResolvedValue({
        data: {
          bitcoin: { usd: 50000, usd_24h_change: 2.5 },
          ethereum: { usd: 3000, usd_24h_change: 1.5 },
        },
      });
    });

    it("should update Bitcoin network data efficiently", async () => {
      const result = await runBenchmark(
        "Bitcoin Network Data Update",
        () => bitcoinNetworkService.updateData(),
        20,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(3000); // 3 seconds
    });

    it("should update market data efficiently", async () => {
      const result = await runBenchmark(
        "Market Data Update",
        () => marketDataService.updateData(),
        20,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(3000); // 3 seconds
    });

    it("should update NFT data efficiently", async () => {
      const result = await runBenchmark(
        "NFT Data Update",
        () => nftDataService.updateData(),
        15,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(4000); // 4 seconds
    });

    it("should update news data efficiently", async () => {
      const result = await runBenchmark(
        "News Data Update",
        () => newsDataService.updateData(),
        15,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(4000); // 4 seconds
    });

    it("should update social sentiment data efficiently", async () => {
      const result = await runBenchmark(
        "Social Sentiment Data Update",
        () => socialSentimentService.updateData(),
        15,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(4000); // 4 seconds
    });
  });

  describe("Concurrent Operations Performance", () => {
    beforeEach(() => {
      // Mock API responses
      const { default: axios } = require("axios");
      (axios.get as any).mockResolvedValue({
        data: {
          bitcoin: { usd: 50000, usd_24h_change: 2.5 },
        },
      });
    });

    it("should handle concurrent data updates", async () => {
      const result = await runBenchmark(
        "Concurrent Data Updates",
        async () => {
          const updates = [
            bitcoinNetworkService.updateData(),
            marketDataService.updateData(),
            nftDataService.updateData(),
            newsDataService.updateData(),
            socialSentimentService.updateData(),
          ];

          await Promise.all(updates);
        },
        10,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(5000); // 5 seconds
    });

    it("should handle high concurrency scenarios", async () => {
      const result = await runBenchmark(
        "High Concurrency Data Updates",
        async () => {
          const concurrentUpdates = Array(10)
            .fill(null)
            .map(() =>
              Promise.all([
                bitcoinNetworkService.updateData(),
                marketDataService.updateData(),
              ]),
            );

          await Promise.all(concurrentUpdates);
        },
        5,
      );

      validateBenchmarkResult(result);
    });

    it("should maintain performance under load", async () => {
      const result = await runBenchmark(
        "Sustained Load Performance",
        async () => {
          // Simulate sustained load
          for (let i = 0; i < 5; i++) {
            await Promise.all([
              bitcoinNetworkService.updateData(),
              marketDataService.updateData(),
              nftDataService.updateData(),
            ]);
          }
        },
        3,
      );

      validateBenchmarkResult(result);
    });
  });

  describe("Caching Performance", () => {
    it("should cache data efficiently", async () => {
      const result = await runBenchmark(
        "Cache Operations",
        async () => {
          // Set cache
          await cacheService.set("test-key", "test-value", 60000);

          // Get cache
          await cacheService.get("test-key");

          // Invalidate cache
          await cacheService.invalidate("test-key");
        },
        50,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(100); // 100ms
    });

    it("should handle cache misses efficiently", async () => {
      const result = await runBenchmark(
        "Cache Miss Performance",
        async () => {
          // Attempt to get non-existent cache entries
          for (let i = 0; i < 10; i++) {
            await cacheService.get(`non-existent-key-${i}`);
          }
        },
        20,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(50); // 50ms
    });

    it("should handle cache invalidation efficiently", async () => {
      // Pre-populate cache
      for (let i = 0; i < 100; i++) {
        await cacheService.set(`key-${i}`, `value-${i}`, 60000);
      }

      const result = await runBenchmark(
        "Cache Invalidation Performance",
        async () => {
          // Invalidate multiple cache entries
          for (let i = 0; i < 50; i++) {
            await cacheService.invalidate(`key-${i}`);
          }
        },
        10,
      );

      validateBenchmarkResult(result);
    });
  });

  describe("Configuration Performance", () => {
    it("should read configuration efficiently", async () => {
      const result = await runBenchmark(
        "Configuration Read Performance",
        async () => {
          // Read multiple configuration values
          for (let i = 0; i < 100; i++) {
            configService.get(`test.config.${i}`);
          }
        },
        20,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(10); // 10ms
    });

    it("should write configuration efficiently", async () => {
      const result = await runBenchmark(
        "Configuration Write Performance",
        async () => {
          // Write multiple configuration values
          for (let i = 0; i < 50; i++) {
            configService.set(`test.config.${i}`, `value-${i}`);
          }
        },
        10,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(50); // 50ms
    });

    it("should handle configuration validation efficiently", async () => {
      const result = await runBenchmark(
        "Configuration Validation Performance",
        async () => {
          // Validate configuration schema
          for (let i = 0; i < 20; i++) {
            configService.validateConfig({
              services: {
                bitcoinNetwork: { enabled: true, updateInterval: 60000 },
                marketData: { enabled: true, updateInterval: 60000 },
              },
            });
          }
        },
        10,
      );

      validateBenchmarkResult(result);
    });
  });

  describe("Memory Usage Performance", () => {
    it("should maintain stable memory usage during operations", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const result = await runBenchmark(
        "Memory Usage Stability",
        async () => {
          // Perform memory-intensive operations
          for (let i = 0; i < 10; i++) {
            await Promise.all([
              bitcoinNetworkService.updateData(),
              marketDataService.updateData(),
              nftDataService.updateData(),
            ]);
          }
        },
        5,
      );

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      validateBenchmarkResult(result);
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });

    it("should handle large data sets efficiently", async () => {
      const result = await runBenchmark(
        "Large Dataset Performance",
        async () => {
          // Simulate large dataset operations
          const largeData = Array(10000)
            .fill(null)
            .map((_, i) => ({
              id: i,
              data: `large-data-${i}`,
              timestamp: Date.now(),
            }));

          // Store in cache
          await cacheService.set("large-dataset", largeData, 60000);

          // Retrieve from cache
          await cacheService.get("large-dataset");
        },
        5,
      );

      validateBenchmarkResult(result);
    });
  });

  describe("Error Handling Performance", () => {
    it("should handle errors efficiently", async () => {
      // Mock API failures
      const { default: axios } = require("axios");
      (axios.get as any).mockRejectedValue(new Error("API Error"));

      const result = await runBenchmark(
        "Error Handling Performance",
        async () => {
          // Trigger operations that will fail
          await Promise.allSettled([
            bitcoinNetworkService.updateData(),
            marketDataService.updateData(),
            nftDataService.updateData(),
          ]);
        },
        10,
      );

      validateBenchmarkResult(result);
      expect(result.errorRate).toBeGreaterThan(0); // Should have errors
    });

    it("should recover from errors efficiently", async () => {
      let shouldFail = true;
      const { default: axios } = require("axios");

      (axios.get as any).mockImplementation(() => {
        if (shouldFail) {
          shouldFail = false;
          return Promise.reject(new Error("Temporary Error"));
        }
        return Promise.resolve({ data: { bitcoin: { usd: 50000 } } });
      });

      const result = await runBenchmark(
        "Error Recovery Performance",
        async () => {
          await bitcoinNetworkService.updateData();
        },
        10,
      );

      validateBenchmarkResult(result);
    });
  });

  describe("Performance Monitoring Overhead", () => {
    it("should have minimal monitoring overhead", async () => {
      const result = await runBenchmark(
        "Performance Monitoring Overhead",
        async () => {
          // Record various metrics
          for (let i = 0; i < 100; i++) {
            performanceMonitor.recordMetric({
              id: `test-metric-${i}`,
              name: `Test Metric ${i}`,
              value: Math.random() * 100,
              unit: "ms",
              category: "custom",
            });
          }

          // Generate performance report
          await performanceMonitor.generateReport(60000);
        },
        10,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(1000); // 1 second
    });

    it("should track metrics efficiently", async () => {
      const result = await runBenchmark(
        "Metrics Tracking Performance",
        async () => {
          // Track various performance metrics
          performanceMonitor.recordApiPerformance("test-service", 100, true);
          performanceMonitor.recordCachePerformance(true, "test-key");
          performanceMonitor.recordDatabasePerformance("SELECT", 50, true);
        },
        100,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(10); // 10ms
    });
  });

  describe("End-to-End Performance", () => {
    beforeEach(() => {
      // Mock comprehensive API responses
      const { default: axios } = require("axios");
      (axios.get as any).mockResolvedValue({
        data: {
          bitcoin: { usd: 50000, usd_24h_change: 2.5 },
          ethereum: { usd: 3000, usd_24h_change: 1.5 },
          nfts: [{ id: 1, price: 1000, collection: "test" }],
          news: [{ id: 1, title: "Test News", content: "Test content" }],
          sentiment: { score: 0.8, volume: 1000 },
        },
      });
    });

    it("should handle complete workflow efficiently", async () => {
      const result = await runBenchmark(
        "Complete Workflow Performance",
        async () => {
          // Complete data update workflow
          await Promise.all([
            bitcoinNetworkService.updateData(),
            marketDataService.updateData(),
            nftDataService.updateData(),
            newsDataService.updateData(),
            socialSentimentService.updateData(),
          ]);

          // Cache operations
          await cacheService.set("workflow-result", "success", 60000);
          await cacheService.get("workflow-result");

          // Configuration operations
          configService.set("workflow.completed", true);
          configService.get("workflow.completed");

          // Performance monitoring
          performanceMonitor.recordMetric({
            id: "workflow-duration",
            name: "Workflow Duration",
            value: 1000,
            unit: "ms",
            category: "custom",
          });
        },
        5,
      );

      validateBenchmarkResult(result);
      expect(result.averageResponseTime).toBeLessThan(10000); // 10 seconds
    });

    it("should maintain performance under sustained load", async () => {
      const result = await runBenchmark(
        "Sustained Load End-to-End",
        async () => {
          // Simulate sustained load for 30 seconds
          const startTime = Date.now();
          const operations: Promise<any>[] = [];

          while (Date.now() - startTime < 30000) {
            operations.push(
              Promise.all([
                bitcoinNetworkService.updateData(),
                marketDataService.updateData(),
                cacheService.set(`key-${Date.now()}`, "value", 60000),
              ]),
            );

            // Small delay to prevent overwhelming
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          await Promise.all(operations);
        },
        1,
      );

      validateBenchmarkResult(result);
    });
  });

  describe("Performance Regression Testing", () => {
    it("should maintain consistent performance across runs", async () => {
      const results: BenchmarkResult[] = [];

      // Run benchmark multiple times
      for (let i = 0; i < 5; i++) {
        const result = await runBenchmark(
          `Performance Run ${i + 1}`,
          async () => {
            await Promise.all([
              bitcoinNetworkService.updateData(),
              marketDataService.updateData(),
            ]);
          },
          10,
        );
        results.push(result);
      }

      // Calculate performance variance
      const responseTimes = results.map((r) => r.averageResponseTime);
      const avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const variance =
        responseTimes.reduce(
          (sum, time) => sum + Math.pow(time - avgResponseTime, 2),
          0,
        ) / responseTimes.length;
      const standardDeviation = Math.sqrt(variance);

      // Performance should be consistent (low variance)
      expect(standardDeviation / avgResponseTime).toBeLessThan(0.5); // Less than 50% coefficient of variation
    });
  });

  afterAll(() => {
    // Log benchmark summary
    console.log("\n=== Performance Benchmark Summary ===");
    benchmarkResults.forEach((result) => {
      console.log(`${result.testName}:`);
      console.log(`  Duration: ${result.duration}ms`);
      console.log(
        `  Memory Usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(
        `  Operations/Second: ${result.operationsPerSecond.toFixed(2)}`,
      );
      console.log(
        `  Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`,
      );
      console.log(`  Error Rate: ${(result.errorRate * 100).toFixed(2)}%`);
      console.log("");
    });
  });
});
