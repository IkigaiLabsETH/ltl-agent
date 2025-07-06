import {
  IAgentRuntime,
  Provider,
  elizaLogger,
  Memory,
  State,
} from "@elizaos/core";
import { BitcoinNetworkDataService } from "../services/BitcoinNetworkDataService";

/**
 * Network Health Provider - Injects contextual Bitcoin network health information
 *
 * This standard provider adds Bitcoin network context including:
 * - Hash rate and mining difficulty
 * - Mempool status and fee recommendations
 * - Block height and timing metrics
 * - Mining revenue and halving countdown
 * - Lightning Network capacity
 * - Network security indicators
 *
 * Usage: Automatically included in standard context composition
 */
export const networkHealthProvider: Provider = {
  name: "networkHealth",
  description:
    "Provides Bitcoin network health metrics, mempool status, and security indicators",
  position: 1, // Early in the chain but after time provider

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    elizaLogger.debug(
      "🌐 [NetworkHealthProvider] Providing Bitcoin network health context",
    );

    try {
      // Get the Bitcoin network data service
      const networkService = runtime.getService(
        "bitcoin-network-data",
      ) as BitcoinNetworkDataService;
      if (!networkService) {
        elizaLogger.warn(
          "[NetworkHealthProvider] BitcoinNetworkDataService not available",
        );
        return {
          text: "Bitcoin network data temporarily unavailable.",
          values: {
            networkDataAvailable: false,
            error: "Service not found",
          },
        };
      }

      // Get comprehensive network data
      const networkData = networkService.getComprehensiveBitcoinData();

      if (!networkData) {
        elizaLogger.debug(
          "[NetworkHealthProvider] No network data available yet",
        );
        return {
          text: "Bitcoin network data is being updated. Please try again in a few moments.",
          values: {
            networkDataAvailable: false,
            updating: true,
          },
        };
      }

      // Analyze network health
      const healthAnalysis = analyzeNetworkHealth(networkData);

      // Analyze mempool conditions
      const mempoolAnalysis = analyzeMempoolConditions(networkData);

      // Analyze mining metrics
      const miningAnalysis = analyzeMiningMetrics(networkData);

      // Build network context
      const networkContext = buildNetworkContext(
        healthAnalysis,
        mempoolAnalysis,
        miningAnalysis,
        networkData,
      );

      elizaLogger.debug(
        `[NetworkHealthProvider] Providing network health context - Block: ${networkData.network.blockHeight}`,
      );

      return {
        text: networkContext,
        values: {
          networkDataAvailable: true,
          blockHeight: networkData.network.blockHeight,
          hashRate: networkData.network.hashRate,
          difficulty: networkData.network.difficulty,
          mempoolSize: networkData.network.mempoolSize,
          fastestFee: networkData.network.mempoolFees?.fastestFee,
          halfHourFee: networkData.network.mempoolFees?.halfHourFee,
          economyFee: networkData.network.mempoolFees?.economyFee,
          fearGreedIndex: networkData.sentiment.fearGreedIndex,
          fearGreedValue: networkData.sentiment.fearGreedValue,
          nextHalvingBlocks: networkData.network.nextHalving?.blocks,
          networkHealth: healthAnalysis.overallHealth,
          mempoolCongestion: mempoolAnalysis.congestionLevel,
          miningDifficulty: miningAnalysis.difficultyTrend,
          securityLevel: healthAnalysis.securityLevel,
          // Include data for actions to access
          networkData: networkData,
          healthAnalysis: healthAnalysis,
          mempoolAnalysis: mempoolAnalysis,
          miningAnalysis: miningAnalysis,
        },
      };
    } catch (error) {
      elizaLogger.error(
        "[NetworkHealthProvider] Error providing network context:",
        error,
      );
      return {
        text: "Bitcoin network services encountered an error. Please try again later.",
        values: {
          networkDataAvailable: false,
          error: error.message,
        },
      };
    }
  },
};

/**
 * Helper function to analyze overall network health
 */
function analyzeNetworkHealth(networkData: any): any {
  let overallHealth = "good";
  let securityLevel = "high";
  let hashRateStatus = "stable";
  let networkStrengthScore = 75;

  if (networkData?.network) {
    const { hashRate, difficulty, blockHeight } = networkData.network;

    // Analyze hash rate (in EH/s)
    if (hashRate) {
      const hashRateEH = hashRate / 1e18;
      if (hashRateEH > 600) {
        hashRateStatus = "very strong";
        networkStrengthScore += 20;
      } else if (hashRateEH > 400) {
        hashRateStatus = "strong";
        networkStrengthScore += 10;
      } else if (hashRateEH < 200) {
        hashRateStatus = "declining";
        networkStrengthScore -= 20;
      }
    }

    // Analyze security based on hash rate and block height
    if (hashRate && blockHeight) {
      if (hashRate > 5e20 && blockHeight > 800000) {
        // Very high hash rate
        securityLevel = "maximum";
      } else if (hashRate > 3e20 && blockHeight > 750000) {
        securityLevel = "very high";
      } else if (hashRate < 1e20) {
        securityLevel = "moderate";
        networkStrengthScore -= 15;
      }
    }

    // Overall health assessment
    if (networkStrengthScore > 90) {
      overallHealth = "excellent";
    } else if (networkStrengthScore > 80) {
      overallHealth = "very good";
    } else if (networkStrengthScore < 60) {
      overallHealth = "concerning";
    } else if (networkStrengthScore < 40) {
      overallHealth = "poor";
    }
  }

  return {
    overallHealth,
    securityLevel,
    hashRateStatus,
    networkStrengthScore,
    lastUpdated: networkData?.lastUpdated,
  };
}

/**
 * Helper function to analyze mempool conditions
 */
function analyzeMempoolConditions(networkData: any): any {
  let congestionLevel = "normal";
  let feeEnvironment = "reasonable";
  let transactionSpeed = "normal";
  let recommendedAction = "standard transaction";

  if (networkData?.network) {
    const { mempoolSize, mempoolFees, mempoolTxs } = networkData.network;

    // Analyze mempool size (in MB)
    if (mempoolSize) {
      const mempoolMB = mempoolSize / 1e6;
      if (mempoolMB > 200) {
        congestionLevel = "high";
        transactionSpeed = "slow";
        recommendedAction = "wait or pay premium fees";
      } else if (mempoolMB > 100) {
        congestionLevel = "moderate";
        transactionSpeed = "delayed";
        recommendedAction = "use higher fees for faster confirmation";
      } else if (mempoolMB < 10) {
        congestionLevel = "very low";
        transactionSpeed = "fast";
        recommendedAction = "excellent time for transactions";
      }
    }

    // Analyze fee environment
    if (mempoolFees) {
      const fastestFee = mempoolFees.fastestFee || 0;
      const economyFee = mempoolFees.economyFee || 0;

      if (fastestFee > 100) {
        feeEnvironment = "very expensive";
      } else if (fastestFee > 50) {
        feeEnvironment = "expensive";
      } else if (fastestFee < 10) {
        feeEnvironment = "cheap";
      } else if (fastestFee < 5) {
        feeEnvironment = "very cheap";
      }
    }
  }

  return {
    congestionLevel,
    feeEnvironment,
    transactionSpeed,
    recommendedAction,
  };
}

/**
 * Helper function to analyze mining metrics
 */
function analyzeMiningMetrics(networkData: any): any {
  let difficultyTrend = "stable";
  let miningHealth = "healthy";
  let profitabilityStatus = "good";
  let halvingProximity = "distant";

  if (networkData?.network) {
    const { difficulty, nextHalving, miningRevenue, hashRate } =
      networkData.network;

    // Analyze difficulty (simplified trend analysis)
    if (difficulty) {
      const difficultyT = difficulty / 1e12;
      if (difficultyT > 80) {
        difficultyTrend = "increasing";
        miningHealth = "very competitive";
      } else if (difficultyT > 60) {
        difficultyTrend = "high";
        miningHealth = "competitive";
      } else if (difficultyT < 30) {
        difficultyTrend = "low";
        miningHealth = "accessible";
      }
    }

    // Analyze halving proximity
    if (nextHalving?.blocks) {
      if (nextHalving.blocks < 10000) {
        halvingProximity = "imminent";
      } else if (nextHalving.blocks < 50000) {
        halvingProximity = "approaching";
      } else if (nextHalving.blocks < 100000) {
        halvingProximity = "near";
      }
    }

    // Mining profitability (simplified)
    if (miningRevenue && hashRate) {
      // This is a simplified analysis - real profitability depends on many factors
      if (miningRevenue > 500) {
        profitabilityStatus = "excellent";
      } else if (miningRevenue < 200) {
        profitabilityStatus = "challenging";
      }
    }
  }

  return {
    difficultyTrend,
    miningHealth,
    profitabilityStatus,
    halvingProximity,
  };
}

/**
 * Helper function to build network context
 */
function buildNetworkContext(
  healthAnalysis: any,
  mempoolAnalysis: any,
  miningAnalysis: any,
  networkData: any,
): string {
  const context = [];

  // Network overview
  context.push(`🌐 BITCOIN NETWORK HEALTH`);
  context.push(`🏥 Overall health: ${healthAnalysis.overallHealth}`);
  context.push(`🔒 Security level: ${healthAnalysis.securityLevel}`);
  context.push(`⚡ Hash rate status: ${healthAnalysis.hashRateStatus}`);
  context.push("");

  // Network metrics
  if (networkData?.network) {
    context.push(`📊 NETWORK METRICS:`);

    if (networkData.network.blockHeight) {
      context.push(
        `• Block height: ${networkData.network.blockHeight.toLocaleString()}`,
      );
    }

    if (networkData.network.hashRate) {
      const hashRateEH = (networkData.network.hashRate / 1e18).toFixed(2);
      context.push(`• Hash rate: ${hashRateEH} EH/s`);
    }

    if (networkData.network.difficulty) {
      const difficultyT = (networkData.network.difficulty / 1e12).toFixed(2);
      context.push(`• Difficulty: ${difficultyT}T`);
    }

    if (networkData.network.nextHalving?.blocks) {
      context.push(
        `• Next halving: ${networkData.network.nextHalving.blocks.toLocaleString()} blocks`,
      );
    }

    context.push("");
  }

  // Mempool status
  context.push(`🔄 MEMPOOL STATUS:`);
  context.push(`• Congestion: ${mempoolAnalysis.congestionLevel}`);
  context.push(`• Fee environment: ${mempoolAnalysis.feeEnvironment}`);
  context.push(`• Transaction speed: ${mempoolAnalysis.transactionSpeed}`);

  if (networkData?.network?.mempoolSize) {
    const mempoolMB = (networkData.network.mempoolSize / 1e6).toFixed(2);
    context.push(`• Mempool size: ${mempoolMB} MB`);
  }

  if (networkData?.network?.mempoolFees) {
    const fees = networkData.network.mempoolFees;
    context.push(
      `• Fees: ${fees.economyFee || "N/A"} | ${fees.halfHourFee || "N/A"} | ${fees.fastestFee || "N/A"} sat/vB`,
    );
  }

  context.push("");

  // Sentiment indicator
  if (networkData?.sentiment) {
    context.push(`😨 FEAR & GREED:`);
    context.push(
      `• Index: ${networkData.sentiment.fearGreedIndex} (${networkData.sentiment.fearGreedValue})`,
    );
    context.push("");
  }

  // Mining insights
  context.push(`⛏️ MINING INSIGHTS:`);
  context.push(`• Difficulty trend: ${miningAnalysis.difficultyTrend}`);
  context.push(`• Mining health: ${miningAnalysis.miningHealth}`);
  context.push(`• Halving proximity: ${miningAnalysis.halvingProximity}`);
  context.push("");

  // Recommendations
  context.push(`💡 RECOMMENDATIONS:`);
  context.push(`• Transaction timing: ${mempoolAnalysis.recommendedAction}`);
  context.push(
    `• Network strength score: ${healthAnalysis.networkStrengthScore}/100`,
  );
  context.push(`• Use network actions for detailed analysis`);

  return context.join("\n");
}

export default networkHealthProvider;
