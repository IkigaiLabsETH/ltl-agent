/**
 * Bitcoin Network Health Provider
 * Provides detailed Bitcoin network health information
 * Includes hash rate, mempool status, fee rates, and security metrics
 */

import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { BitcoinIntelligenceService } from "../services/BitcoinIntelligenceService";
import { ElizaOSErrorHandler, LoggerWithContext, generateCorrelationId } from "../utils";

export const bitcoinNetworkHealthProvider: Provider = {
  name: "BITCOIN_NETWORK_HEALTH",
  description: "Bitcoin network health metrics including hash rate, mempool status, fee rates, and security indicators",
  position: -30, // High priority provider
  dynamic: false,

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    const correlationId = generateCorrelationId();
    const logger = new LoggerWithContext("BitcoinNetworkHealthProvider", correlationId);
    
    try {
      // Get the Bitcoin Intelligence Service
      const bitcoinIntelService = runtime.getService<BitcoinIntelligenceService>("bitcoin-intelligence");
      if (!bitcoinIntelService) {
        logger.warn("Bitcoin Intelligence Service not available");
        return {
          text: "Bitcoin network health service is currently unavailable.",
          values: {
            bitcoinNetworkHealth: {
              available: false,
              error: "Service not available"
            }
          }
        };
      }

      // Get network health data
      const intelligence = await bitcoinIntelService.getIntelligenceData();
      
      if (!intelligence) {
        logger.warn("Failed to retrieve Bitcoin network health data");
        return {
          text: "Unable to retrieve Bitcoin network health data at this time.",
          values: {
            bitcoinNetworkHealth: {
              available: false,
              error: "Data retrieval failed"
            }
          }
        };
      }

      // Extract network data
      const network = intelligence.network;
      
      // Format the network health data for the agent
      const formattedHealth = formatNetworkHealth(network);
      
      return {
        text: formattedHealth.text,
        values: {
          bitcoinNetworkHealth: {
            available: true,
            data: network,
            summary: formattedHealth.summary
          }
        },
        data: {
          rawNetworkData: network
        }
      };

    } catch (error) {
      ElizaOSErrorHandler.logStructuredError(error, logger, {
        context: "Bitcoin Network Health Provider",
        operation: "get network health"
      });
      
      return {
        text: "Bitcoin network health data is temporarily unavailable due to technical issues.",
        values: {
          bitcoinNetworkHealth: {
            available: false,
            error: error instanceof Error ? error.message : "Unknown error"
          }
        }
      };
    }
  }
};

/**
 * Format network health data for agent consumption
 */
function formatNetworkHealth(network: any) {
  // Create a comprehensive summary
  const summary = {
    health: network.networkHealth || "Unknown",
    hashRate: network.hashRate || 0,
    mempoolStatus: network.mempoolStatus || "Unknown",
    feeStatus: network.feeStatus || "Unknown",
    mempoolSize: network.mempoolSize || 0,
    feeRate: network.feeRate || 0
  };

  // Format text for agent context
  const textParts = [];

  // Network health status
  if (network.networkHealth) {
    const healthEmoji = network.networkHealth === 'EXCELLENT' ? '🟢' : 
                       network.networkHealth === 'GOOD' ? '🟡' : 
                       network.networkHealth === 'WARNING' ? '🟠' : '🔴';
    textParts.push(`Network Health: ${healthEmoji} ${network.networkHealth}`);
  }

  // Hash rate
  if (network.hashRate) {
    const hashRateEH = (network.hashRate / 1e18).toFixed(2);
    textParts.push(`Hash Rate: ${hashRateEH} EH/s`);
  }

  // Mempool status
  if (network.mempoolStatus) {
    const mempoolEmoji = network.mempoolStatus === 'OPTIMAL' ? '🟢' : 
                        network.mempoolStatus === 'NORMAL' ? '🟡' : 
                        network.mempoolStatus === 'CONGESTED' ? '🟠' : '🔴';
    textParts.push(`Mempool: ${mempoolEmoji} ${network.mempoolStatus}`);
  }

  // Mempool size
  if (network.mempoolSize !== undefined) {
    textParts.push(`Mempool Size: ${network.mempoolSize} MB`);
  }

  // Fee status
  if (network.feeStatus) {
    const feeEmoji = network.feeStatus === 'LOW' ? '🟢' : 
                    network.feeStatus === 'NORMAL' ? '🟡' : 
                    network.feeStatus === 'HIGH' ? '🟠' : '🔴';
    textParts.push(`Fees: ${feeEmoji} ${network.feeStatus}`);
  }

  // Fee rate
  if (network.feeRate !== undefined) {
    textParts.push(`Fee Rate: ${network.feeRate} sat/vB`);
  }

  // Price context
  if (network.price) {
    textParts.push(`Bitcoin Price: $${network.price.toLocaleString()}`);
  }

  // Market cap
  if (network.marketCap) {
    const marketCapB = (network.marketCap / 1e9).toFixed(2);
    textParts.push(`Market Cap: $${marketCapB}B`);
  }

  // Dominance
  if (network.dominance) {
    textParts.push(`BTC Dominance: ${network.dominance}%`);
  }

  // 24h change
  if (network.change24h !== undefined) {
    const changeEmoji = network.change24h > 0 ? '📈' : network.change24h < 0 ? '📉' : '➡️';
    textParts.push(`24h Change: ${changeEmoji} ${network.change24h > 0 ? '+' : ''}${network.change24h}%`);
  }

  return {
    text: textParts.join('. ') + '.',
    summary
  };
} 