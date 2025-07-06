import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from "@elizaos/core";
import {
  createActionTemplate,
  ValidationPatterns,
  ResponseCreators,
} from "./base/ActionTemplate";
import { RealTimeDataService } from "../services/RealTimeDataService";

export const bitcoinNetworkHealthAction: Action = createActionTemplate({
  name: "BITCOIN_NETWORK_HEALTH",
  description:
    "Analyze and report on Bitcoin network health metrics including hashrate, difficulty, mempool status, and network security indicators",
  similes: [
    "NETWORK_STATUS",
    "BITCOIN_HEALTH",
    "HASHRATE_CHECK",
    "NETWORK_METRICS",
    "BTC_HEALTH",
  ],

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "How is the Bitcoin network doing?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Network status: Hashrate at 750 EH/s, up 2.1% in 24h. Difficulty adjustment in 8 days, +3.2% estimated. Mempool: 45MB, 12 sat/vB for next block. Network security: Excellent. Blocks averaging 9.8 minutes.",
          thought:
            "User is asking about Bitcoin network health. I need to provide comprehensive metrics on hashrate, difficulty, mempool status, block times, and overall network security to give them a complete picture of network operations.",
          actions: ["BITCOIN_NETWORK_HEALTH"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Check Bitcoin hashrate" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Hashrate: 748.3 EH/s (7-day avg). Mining difficulty: 103.9T. Next adjustment: -1.8% in 6 days. Network securing $2.1T in value with unprecedented computational power. Hash ribbon indicates miner capitulation ended.",
          thought:
            "User specifically wants hashrate information. I should focus on hashrate metrics, difficulty data, mining health indicators, and what these metrics mean for network security and miner economics.",
          actions: ["BITCOIN_NETWORK_HEALTH"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Network health report" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Network Health Report: Hashrate 751 EH/s (strong). Difficulty stable. Mempool efficient: 8 sat/vB next block. Node count: 16,847 reachable. Lightning: 5,200 BTC capacity. Network uptime: 99.98% last 90 days.",
          thought:
            "User wants a comprehensive network health report. I need to provide a structured overview covering hashrate, difficulty, mempool efficiency, node distribution, Lightning Network status, and overall network reliability metrics.",
          actions: ["BITCOIN_NETWORK_HEALTH"],
        },
      },
    ],
  ],

  validateFn: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return ValidationPatterns.isNetworkHealthRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    logger.info("Bitcoin network health action triggered");

    // Initial thought process
    const thoughtProcess =
      "User is requesting Bitcoin network health information. I need to gather comprehensive metrics including hashrate, difficulty adjustments, mempool status, node distribution, and security indicators to provide a complete assessment of network operations.";

    try {
      // Get the Bitcoin network data service
      const networkService = runtime.getService(
        "real-time-data",
      ) as RealTimeDataService;
      if (!networkService) {
        logger.warn("RealTimeDataService not available");

        const fallbackResponse = ResponseCreators.createErrorResponse(
          "BITCOIN_NETWORK_HEALTH",
          "Network service unavailable",
          "Network monitoring temporarily unavailable. Bitcoin protocol fundamentals unchanged: 21M coin cap, ~10 minute blocks, proof-of-work securing the network. Core operations unaffected.",
        );

        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Get comprehensive network health data
      const networkData = networkService.getComprehensiveBitcoinData();

      // Format the network health report
      const healthReport = formatNetworkHealthReport(networkData);

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        healthReport,
        "BITCOIN_NETWORK_HEALTH",
        { networkData },
      );

      if (callback) {
        await callback(response);
      }

      logger.info("Bitcoin network health report delivered successfully");
      return true;
    } catch (error) {
      logger.error(
        "Failed to get network health data:",
        (error as Error).message,
      );

      // Enhanced error handling with context-specific responses
      let errorMessage =
        "Network fundamentals operational. Hashrate securing the chain. Blocks continuing every ~10 minutes.";

      const errorMsg = (error as Error).message.toLowerCase();
      if (
        errorMsg.includes("rate limit") ||
        errorMsg.includes("429") ||
        errorMsg.includes("too many requests")
      ) {
        errorMessage =
          "Rate limited by data providers. Bitcoin network unchanged: miners securing blocks, nodes validating transactions. Protocol operational.";
      } else if (
        errorMsg.includes("network") ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("fetch")
      ) {
        errorMessage =
          "Monitoring service connectivity issues. Bitcoin network unaffected: blocks every ~10 minutes, hashrate securing $2T+ value.";
      } else if (errorMsg.includes("api") || errorMsg.includes("service")) {
        errorMessage =
          "Data service temporarily down. Bitcoin protocol unchanged: proof-of-work consensus, 21M supply cap, decentralized validation continuing.";
      }

      const errorResponse = ResponseCreators.createErrorResponse(
        "BITCOIN_NETWORK_HEALTH",
        (error as Error).message,
        errorMessage,
      );

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },
});

/**
 * Format network health data into a conversational report
 */
function formatNetworkHealthReport(networkData: any): string {
  let report = "";

  // Start with hashrate status
  if (networkData.hashrate) {
    const hashrate = formatHashrate(networkData.hashrate.current);
    const change = networkData.hashrate.change24h;

    report += `Hashrate: ${hashrate}`;
    if (change && Math.abs(change) > 0.1) {
      const direction = change > 0 ? "up" : "down";
      report += `, ${direction} ${Math.abs(change).toFixed(1)}% in 24h`;
    }
    report += ".";
  }

  // Add difficulty information
  if (networkData.difficulty) {
    const diff = networkData.difficulty;
    report += ` Difficulty: ${formatDifficulty(diff.current)}.`;

    if (diff.nextAdjustment) {
      const days = Math.ceil(
        (diff.nextAdjustment.blocksRemaining * 10) / (60 * 24),
      );
      const estimate = diff.nextAdjustment.estimatedChange;
      const direction = estimate > 0 ? "+" : "";

      report += ` Next adjustment: ${direction}${estimate.toFixed(1)}% in ${days} days.`;
    }
  }

  // Add mempool status
  if (networkData.mempool) {
    const mempool = networkData.mempool;
    const size = Math.round(mempool.size / 1024 / 1024); // Convert to MB
    const feeRate = mempool.recommendedFeeRate;

    report += ` Mempool: ${size}MB, ${feeRate} sat/vB for next block.`;
  }

  // Add block time performance
  if (networkData.blocks) {
    const avgTime = networkData.blocks.averageTime;
    if (avgTime) {
      report += ` Blocks averaging ${avgTime.toFixed(1)} minutes.`;
    }
  }

  // Add network security assessment
  if (networkData.security) {
    const security = assessNetworkSecurity(networkData);
    report += ` Network security: ${security}.`;
  }

  // Add node count if available
  if (networkData.nodes && networkData.nodes.reachable) {
    report += ` Active nodes: ${networkData.nodes.reachable.toLocaleString()}.`;
  }

  // Add Lightning Network status if available
  if (networkData.lightning) {
    const capacity = Math.round(networkData.lightning.capacity);
    report += ` Lightning: ${capacity} BTC capacity.`;
  }

  return report;
}

/**
 * Format hashrate with appropriate units
 */
function formatHashrate(hashrate: number): string {
  if (hashrate >= 1e18) {
    return `${(hashrate / 1e18).toFixed(1)} EH/s`;
  } else if (hashrate >= 1e15) {
    return `${(hashrate / 1e15).toFixed(1)} PH/s`;
  } else if (hashrate >= 1e12) {
    return `${(hashrate / 1e12).toFixed(1)} TH/s`;
  } else {
    return `${hashrate.toFixed(1)} H/s`;
  }
}

/**
 * Format difficulty with appropriate units
 */
function formatDifficulty(difficulty: number): string {
  if (difficulty >= 1e12) {
    return `${(difficulty / 1e12).toFixed(1)}T`;
  } else if (difficulty >= 1e9) {
    return `${(difficulty / 1e9).toFixed(1)}B`;
  } else if (difficulty >= 1e6) {
    return `${(difficulty / 1e6).toFixed(1)}M`;
  } else {
    return difficulty.toLocaleString();
  }
}

/**
 * Assess overall network security based on metrics
 */
function assessNetworkSecurity(networkData: any): string {
  const factors = [];

  // Check hashrate trend
  if (networkData.hashrate?.change24h > 5) {
    factors.push("hashrate-growing");
  } else if (networkData.hashrate?.change24h < -10) {
    factors.push("hashrate-declining");
  }

  // Check mempool congestion
  if (networkData.mempool?.recommendedFeeRate > 50) {
    factors.push("high-congestion");
  } else if (networkData.mempool?.recommendedFeeRate < 5) {
    factors.push("low-congestion");
  }

  // Check block time consistency
  if (networkData.blocks?.averageTime < 8) {
    factors.push("fast-blocks");
  } else if (networkData.blocks?.averageTime > 12) {
    factors.push("slow-blocks");
  }

  // Determine overall assessment
  if (
    factors.includes("hashrate-declining") ||
    factors.includes("slow-blocks")
  ) {
    return "Stable";
  } else if (
    factors.includes("hashrate-growing") &&
    factors.includes("low-congestion")
  ) {
    return "Excellent";
  } else {
    return "Strong";
  }
}
