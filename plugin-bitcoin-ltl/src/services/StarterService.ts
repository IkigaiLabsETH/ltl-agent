import { IAgentRuntime, Service, logger } from "@elizaos/core";
import { validateElizaOSEnvironment } from "../utils/environmentUtils";
import {
  LoggerWithContext,
  generateCorrelationId,
} from "../utils/loggingUtils";
import { ElizaOSErrorHandler } from "../types/errorTypes";
import { BitcoinPriceData } from "../types/marketTypes";

/**
 * Bitcoin Data Service (Legacy - will be removed)
 * Manages Bitcoin data fetching, caching, and analysis
 */
export class StarterService extends Service {
  static serviceType = "bitcoin-data";
  capabilityDescription =
    "Provides Bitcoin market data, analysis, and thesis tracking capabilities";

  constructor(protected runtime: IAgentRuntime) {
    super();
  }

  static async start(runtime: IAgentRuntime) {
    // Validate ElizaOS environment on startup
    const validation = validateElizaOSEnvironment();
    if (!validation.valid) {
      const contextLogger = new LoggerWithContext(
        generateCorrelationId(),
        "BitcoinDataService",
      );
      contextLogger.warn("ElizaOS environment validation issues detected", {
        issues: validation.issues,
      });

      // Log each issue with resolution guidance
      validation.issues.forEach((issue) => {
        contextLogger.warn(`Environment Issue: ${issue}`);
      });
    }

    logger.info("BitcoinDataService starting...");
    return new StarterService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("BitcoinDataService stopping...");

    // Check if the service exists in the runtime
    const service = runtime.getService("bitcoin-data");
    if (!service) {
      throw new Error("Bitcoin data service not found");
    }

    // Call the service's stop method if it exists
    if (service.stop && typeof service.stop === "function") {
      await service.stop();
    }

    // Cleanup any resources if needed
  }

  async init() {
    logger.info("BitcoinDataService initialized");
  }

  async stop() {
    logger.info("BitcoinDataService stopped");
  }

  /**
   * Reset agent memory following ElizaOS best practices
   */
  async resetMemory(): Promise<{ success: boolean; message: string }> {
    try {
      const databaseConfig = this.runtime.character.settings?.database;

      // Type guard to check if database config is an object
      const isDbConfigObject = (config: any): config is Record<string, any> => {
        return typeof config === "object" && config !== null;
      };

      if (
        isDbConfigObject(databaseConfig) &&
        databaseConfig.type === "postgresql" &&
        databaseConfig.url
      ) {
        // For PostgreSQL, provide instructions since we can't directly drop/recreate
        return {
          success: false,
          message:
            'PostgreSQL memory reset requires manual intervention. Run: psql -U username -c "DROP DATABASE database_name;" then recreate the database.',
        };
      } else {
        // For PGLite (default), delete the data directory
        const dataDir =
          (isDbConfigObject(databaseConfig) && databaseConfig.dataDir) ||
          ".eliza/.elizadb";
        const fs = await import("fs");
        const path = await import("path");

        if (fs.existsSync(dataDir)) {
          fs.rmSync(dataDir, { recursive: true, force: true });
          logger.info(`Deleted PGLite database directory: ${dataDir}`);

          return {
            success: true,
            message: `Memory reset successful. Deleted database directory: ${dataDir}. Restart the agent to create a fresh database.`,
          };
        } else {
          return {
            success: true,
            message: `Database directory ${dataDir} does not exist. Memory already clean.`,
          };
        }
      }
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(
        error as Error,
        "MemoryReset",
      );
      logger.error("Failed to reset memory:", enhancedError.message);

      return {
        success: false,
        message: `Memory reset failed: ${enhancedError.message}${
          enhancedError instanceof Error && "resolution" in enhancedError
            ? ` Resolution: ${(enhancedError as any).resolution}`
            : ""
        }`,
      };
    }
  }

  /**
   * Check memory usage and database health
   */
  async checkMemoryHealth(): Promise<{
    healthy: boolean;
    stats: {
      databaseType: string;
      dataDirectory?: string;
      memoryCount?: number;
      lastCleanup?: string;
    };
    issues: string[];
  }> {
    const databaseConfig = this.runtime.character.settings?.database;

    // Type guard to check if database config is an object
    const isDbConfigObject = (config: any): config is Record<string, any> => {
      return typeof config === "object" && config !== null;
    };

    const stats = {
      databaseType:
        (isDbConfigObject(databaseConfig) && databaseConfig.type) || "pglite",
      dataDirectory:
        (isDbConfigObject(databaseConfig) && databaseConfig.dataDir) ||
        ".eliza/.elizadb",
    };

    const issues: string[] = [];

    try {
      // Check if database directory exists and is accessible
      const fs = await import("fs");
      if (stats.dataDirectory && !fs.existsSync(stats.dataDirectory)) {
        issues.push(`Database directory ${stats.dataDirectory} does not exist`);
      }

      // For PGLite, check directory size (basic health check)
      if (stats.databaseType === "pglite" && stats.dataDirectory) {
        try {
          const dirSize = await this.getDirectorySize(stats.dataDirectory);
          if (dirSize > 1000 * 1024 * 1024) {
            // > 1GB
            issues.push(
              `Database directory is large (${(dirSize / 1024 / 1024).toFixed(0)}MB). Consider cleanup.`,
            );
          }
        } catch (error) {
          issues.push(
            `Could not check database directory size: ${(error as Error).message}`,
          );
        }
      }

      // Check embedding dimensions configuration
      const embeddingDims = process.env.OPENAI_EMBEDDING_DIMENSIONS;
      if (
        embeddingDims &&
        parseInt(embeddingDims) !== 1536 &&
        parseInt(embeddingDims) !== 384
      ) {
        issues.push(
          `Invalid OPENAI_EMBEDDING_DIMENSIONS: ${embeddingDims}. Should be 384 or 1536.`,
        );
      }

      return {
        healthy: issues.length === 0,
        stats,
        issues,
      };
    } catch (error) {
      issues.push(`Memory health check failed: ${(error as Error).message}`);
      return {
        healthy: false,
        stats,
        issues,
      };
    }
  }

  /**
   * Helper method to calculate directory size
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    const fs = await import("fs");
    const path = await import("path");

    let totalSize = 0;

    const calculateSize = (itemPath: string): number => {
      const stats = fs.statSync(itemPath);

      if (stats.isFile()) {
        return stats.size;
      } else if (stats.isDirectory()) {
        const items = fs.readdirSync(itemPath);
        return items.reduce((size, item) => {
          return size + calculateSize(path.join(itemPath, item));
        }, 0);
      }

      return 0;
    };

    if (fs.existsSync(dirPath)) {
      totalSize = calculateSize(dirPath);
    }

    return totalSize;
  }

  async getBitcoinPrice(): Promise<number> {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      );
      const data = (await response.json()) as any; // Type assertion for API response
      if (!data.bitcoin?.usd) {
        throw new Error("No Bitcoin price data available");
      }
      return data.bitcoin.usd;
    } catch (error) {
      logger.error("Error fetching Bitcoin price:", error);
      throw new Error("Unable to fetch Bitcoin price data");
    }
  }

  async calculateThesisMetrics(currentPrice: number) {
    const targetPrice = 1000000;
    const progressPercentage = (currentPrice / targetPrice) * 100;
    const multiplierNeeded = targetPrice / currentPrice;

    // Calculate required compound annual growth rates
    const fiveYearCAGR =
      (Math.pow(targetPrice / currentPrice, 1 / 5) - 1) * 100;
    const tenYearCAGR =
      (Math.pow(targetPrice / currentPrice, 1 / 10) - 1) * 100;

    // Estimate addresses with 10+ BTC (dynamic calculation based on price)
    const baseHolders = 50000;
    const priceAdjustment = Math.max(0, (150000 - currentPrice) / 50000);
    const estimatedHolders = Math.floor(baseHolders + priceAdjustment * 25000);
    const targetHolders = 100000;
    const holdersProgress = (estimatedHolders / targetHolders) * 100;

    // Calculate time to target at different growth rates
    const historicalCAGR = 44; // Bitcoin's historical CAGR
    const yearsAtHistoricalRate =
      Math.log(targetPrice / currentPrice) / Math.log(1 + historicalCAGR / 100);

    // Risk-adjusted scenarios
    const scenarios = {
      conservative: Math.log(targetPrice / currentPrice) / Math.log(1 + 0.2), // 20% CAGR
      moderate: Math.log(targetPrice / currentPrice) / Math.log(1 + 0.3), // 30% CAGR
      aggressive: Math.log(targetPrice / currentPrice) / Math.log(1 + 0.5), // 50% CAGR
      historical: yearsAtHistoricalRate,
    };

    return {
      currentPrice,
      targetPrice,
      progressPercentage,
      multiplierNeeded,
      estimatedHolders,
      targetHolders,
      holdersProgress,
      timeToTarget: scenarios,
      requiredCAGR: {
        fiveYear: fiveYearCAGR,
        tenYear: tenYearCAGR,
      },
      catalysts: [
        "U.S. Strategic Bitcoin Reserve",
        "Banking Bitcoin services expansion",
        "Corporate treasury adoption (MicroStrategy model)",
        "EU MiCA regulatory framework",
        "Institutional ETF demand acceleration",
        "Nation-state competition for reserves",
      ],
      riskFactors: [
        "Political gridlock on Bitcoin policy",
        "Market volatility and 20-30% corrections",
        "Regulatory uncertainty in emerging markets",
        "Macro economic recession pressures",
        "Institutional whale selling pressure",
      ],
      adoptionMetrics: {
        institutionalHolding: "MicroStrategy: $21B+ position",
        etfFlows: "Record institutional investment",
        bankingIntegration: "Major banks launching services",
        sovereignAdoption: "Multiple nations considering reserves",
      },
    };
  }

  /**
   * Enhanced Bitcoin market data with comprehensive metrics
   */
  async getEnhancedMarketData(): Promise<BitcoinPriceData> {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h%2C7d",
        { headers: { Accept: "application/json" } },
      );
      const data = (await response.json()) as any[];
      const bitcoin = data[0];

      return {
        price: bitcoin.current_price || 0,
        marketCap: bitcoin.market_cap || 0,
        volume24h: bitcoin.total_volume || 0,
        priceChange24h: bitcoin.price_change_percentage_24h || 0,
        priceChange7d: bitcoin.price_change_percentage_7d || 0,
        priceChange30d: 0, // Not available in markets endpoint
        allTimeHigh: bitcoin.high_24h || 0,
        allTimeLow: bitcoin.low_24h || 0,
        circulatingSupply: 19700000, // Static for Bitcoin
        totalSupply: 19700000, // Static for Bitcoin
        maxSupply: 21000000, // Static for Bitcoin
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error fetching enhanced market data:", error);
      throw new Error("Unable to fetch Bitcoin market data");
    }
  }

  /**
   * Calculate Bitcoin Freedom Mathematics
   * Determines BTC needed for financial freedom at different price points
   */
  async calculateFreedomMathematics(targetFreedom: number = 10000000): Promise<{
    currentPrice: number;
    btcNeeded: number;
    scenarios: {
      [key: string]: { price: number; btc: number; timeline: string };
    };
    safeLevels: { conservative: number; moderate: number; aggressive: number };
  }> {
    const currentPrice = await this.getBitcoinPrice();
    const btcNeeded = targetFreedom / currentPrice;

    const scenarios = {
      current: {
        price: currentPrice,
        btc: btcNeeded,
        timeline: "Today",
      },
      thesis250k: {
        price: 250000,
        btc: targetFreedom / 250000,
        timeline: "2-3 years",
      },
      thesis500k: {
        price: 500000,
        btc: targetFreedom / 500000,
        timeline: "3-5 years",
      },
      thesis1m: {
        price: 1000000,
        btc: targetFreedom / 1000000,
        timeline: "5-10 years",
      },
    };

    // Safe accumulation levels accounting for volatility
    const safeLevels = {
      conservative: btcNeeded * 1.5, // 50% buffer
      moderate: btcNeeded * 1.25, // 25% buffer
      aggressive: btcNeeded, // Exact target
    };

    logger.info(
      `Freedom Mathematics calculated for $${targetFreedom.toLocaleString()}`,
      {
        currentBTCNeeded: `${btcNeeded.toFixed(2)} BTC`,
        conservativeTarget: `${safeLevels.conservative.toFixed(2)} BTC`,
      },
    );

    return {
      currentPrice,
      btcNeeded,
      scenarios,
      safeLevels,
    };
  }

  /**
   * Analyze institutional adoption trends
   */
  async analyzeInstitutionalTrends(): Promise<{
    corporateAdoption: string[];
    bankingIntegration: string[];
    etfMetrics: { [key: string]: any };
    sovereignActivity: string[];
    adoptionScore: number; // 0-100 scale
  }> {
    // This would ideally fetch from institutional adoption APIs
    // For now, return curated analysis based on known trends

    const analysis = {
      corporateAdoption: [
        "MicroStrategy: $21B+ BTC treasury position",
        "Tesla: 11,509 BTC corporate holding",
        "Block (Square): Bitcoin-focused business model",
        "Marathon Digital: Mining infrastructure",
        "Tesla payments integration pilot programs",
      ],
      bankingIntegration: [
        "JPMorgan: Bitcoin exposure through ETFs",
        "Goldman Sachs: Bitcoin derivatives trading",
        "Bank of New York Mellon: Crypto custody",
        "Morgan Stanley: Bitcoin investment access",
        "Wells Fargo: Crypto research and analysis",
      ],
      etfMetrics: {
        totalAUM: "$50B+ across Bitcoin ETFs",
        dailyVolume: "$2B+ average trading volume",
        institutionalShare: "70%+ of ETF holdings",
        flowTrend: "Consistent net inflows 2024",
      },
      sovereignActivity: [
        "El Salvador: 2,500+ BTC national reserve",
        "U.S.: Strategic Bitcoin Reserve discussions",
        "Germany: Bitcoin legal tender consideration",
        "Singapore: Crypto-friendly regulatory framework",
        "Switzerland: Bitcoin tax optimization laws",
      ],
      adoptionScore: 75, // Based on current institutional momentum
    };

    logger.info("Institutional adoption analysis complete", {
      adoptionScore: `${analysis.adoptionScore}/100`,
      corporateCount: analysis.corporateAdoption.length,
      bankingCount: analysis.bankingIntegration.length,
    });

    return analysis;
  }
}
