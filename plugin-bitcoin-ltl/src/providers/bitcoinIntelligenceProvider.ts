/**
 * Bitcoin Intelligence Provider
 * Provides comprehensive Bitcoin intelligence and market context
 * Implements 99% Bitcoin focus with 1% open mind for strategic intelligence
 */

import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { BitcoinIntelligenceService } from "../services/BitcoinIntelligenceService";
import { ElizaOSErrorHandler, LoggerWithContext, generateCorrelationId } from "../utils";

export const bitcoinIntelligenceProvider: Provider = {
  name: "BITCOIN_INTELLIGENCE",
  description: "Comprehensive Bitcoin intelligence including network health, market context, institutional adoption, and selective asset tracking",
  position: -50, // High priority provider
  dynamic: false,

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    const correlationId = generateCorrelationId();
    const logger = new LoggerWithContext("BitcoinIntelligenceProvider", correlationId);
    
    try {
      // Get the Bitcoin Intelligence Service
      const bitcoinIntelService = runtime.getService<BitcoinIntelligenceService>("bitcoin_intelligence");
      if (!bitcoinIntelService) {
        logger.warn("Bitcoin Intelligence Service not available");
        return {
          text: "Bitcoin intelligence service is currently unavailable.",
          values: {
            bitcoinIntelligence: {
              available: false,
              error: "Service not available"
            }
          }
        };
      }

      // Get comprehensive Bitcoin intelligence
      const intelligence = await bitcoinIntelService.getIntelligenceData();
      
      if (!intelligence) {
        logger.warn("Failed to retrieve Bitcoin intelligence");
        return {
          text: "Unable to retrieve Bitcoin intelligence at this time.",
          values: {
            bitcoinIntelligence: {
              available: false,
              error: "Data retrieval failed"
            }
          }
        };
      }

      // Format the intelligence data for the agent
      const formattedIntelligence = formatBitcoinIntelligence(intelligence);
      
      return {
        text: formattedIntelligence.text,
        values: {
          bitcoinIntelligence: {
            available: true,
            data: intelligence,
            summary: formattedIntelligence.summary
          }
        },
        data: {
          rawIntelligence: intelligence
        }
      };

    } catch (error) {
      ElizaOSErrorHandler.logStructuredError(error, logger, {
        context: "Bitcoin Intelligence Provider",
        operation: "get intelligence data"
      });
      
      return {
        text: "Bitcoin intelligence is temporarily unavailable due to technical issues.",
        values: {
          bitcoinIntelligence: {
            available: false,
            error: error instanceof Error ? error.message : "Unknown error"
          }
        }
      };
    }
  }
};

/**
 * Format Bitcoin intelligence data for agent consumption
 */
function formatBitcoinIntelligence(intelligence: any) {
  const { network, market, institutional, selectiveAssets } = intelligence;
  
  // Create a comprehensive summary
  const summary = {
    networkHealth: network?.health || "Unknown",
    marketSentiment: market?.sentiment || "Unknown",
    institutionalActivity: institutional?.activity || "Unknown",
    keyAssets: selectiveAssets?.tracked || []
  };

  // Format text for agent context
  const textParts = [];

  // Network Health
  if (network?.health) {
    textParts.push(`Bitcoin Network Health: ${network.health} (Hashrate: ${network.hashrate || 'N/A'}, Difficulty: ${network.difficulty || 'N/A'})`);
  }

  // Market Context
  if (market?.btcPrice) {
    textParts.push(`Bitcoin Price: $${market.btcPrice.toLocaleString()}`);
  }
  
  if (market?.btcDominance) {
    textParts.push(`BTC Dominance: ${market.btcDominance}%`);
  }

  if (market?.sentiment) {
    textParts.push(`Market Sentiment: ${market.sentiment}`);
  }

  // Institutional Adoption
  if (institutional?.treasuryHoldings) {
    textParts.push(`Institutional BTC Holdings: ${institutional.treasuryHoldings.toLocaleString()} BTC`);
  }

  if (institutional?.etfFlows) {
    const flowDirection = institutional.etfFlows > 0 ? "inflow" : "outflow";
    textParts.push(`ETF ${flowDirection}: ${Math.abs(institutional.etfFlows).toLocaleString()} BTC`);
  }

  // Selective Asset Tracking
  if (selectiveAssets?.mstr) {
    textParts.push(`MSTR Performance: ${selectiveAssets.mstr.performance}% vs BTC`);
  }

  if (selectiveAssets?.mtplf) {
    textParts.push(`MTPLF Performance: ${selectiveAssets.mtpfl.performance}% vs BTC`);
  }

  // Key Insights
  if (intelligence.insights?.length > 0) {
    textParts.push(`Key Insights: ${intelligence.insights.join(', ')}`);
  }

  return {
    text: textParts.join('. ') + '.',
    summary
  };
} 