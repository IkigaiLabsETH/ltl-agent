/**
 * Bitcoin Market Intelligence Provider
 * Provides market sentiment, trends, and intelligence data
 * Focuses on market context and key narratives for Bitcoin
 */

import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { BitcoinIntelligenceService } from "../services/BitcoinIntelligenceService";
import { ElizaOSErrorHandler, LoggerWithContext, generateCorrelationId } from "../utils";

export const bitcoinMarketIntelligenceProvider: Provider = {
  name: "BITCOIN_MARKET_INTELLIGENCE",
  description: "Bitcoin market sentiment, trends, and intelligence data including key narratives and risk factors",
  position: -40, // High priority provider
  dynamic: false,

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    const correlationId = generateCorrelationId();
    const logger = new LoggerWithContext("BitcoinMarketIntelligenceProvider", correlationId);
    
    try {
      // Get the Bitcoin Intelligence Service
      const bitcoinIntelService = runtime.getService<BitcoinIntelligenceService>("bitcoin-intelligence");
      if (!bitcoinIntelService) {
        logger.warn("Bitcoin Intelligence Service not available");
        return {
          text: "Bitcoin market intelligence service is currently unavailable.",
          values: {
            bitcoinMarketIntelligence: {
              available: false,
              error: "Service not available"
            }
          }
        };
      }

      // Get market intelligence data
      const intelligence = await bitcoinIntelService.getIntelligenceData();
      
      if (!intelligence) {
        logger.warn("Failed to retrieve Bitcoin market intelligence");
        return {
          text: "Unable to retrieve Bitcoin market intelligence at this time.",
          values: {
            bitcoinMarketIntelligence: {
              available: false,
              error: "Data retrieval failed"
            }
          }
        };
      }

      // Extract market intelligence
      const marketIntelligence = intelligence.marketIntelligence;
      const network = intelligence.network;
      
      // Format the market intelligence data for the agent
      const formattedIntelligence = formatMarketIntelligence(marketIntelligence, network);
      
      return {
        text: formattedIntelligence.text,
        values: {
          bitcoinMarketIntelligence: {
            available: true,
            data: marketIntelligence,
            summary: formattedIntelligence.summary
          }
        },
        data: {
          rawMarketIntelligence: marketIntelligence,
          networkData: network
        }
      };

    } catch (error) {
      ElizaOSErrorHandler.logStructuredError(error, logger, {
        context: "Bitcoin Market Intelligence Provider",
        operation: "get market intelligence"
      });
      
      return {
        text: "Bitcoin market intelligence is temporarily unavailable due to technical issues.",
        values: {
          bitcoinMarketIntelligence: {
            available: false,
            error: error instanceof Error ? error.message : "Unknown error"
          }
        }
      };
    }
  }
};

/**
 * Format market intelligence data for agent consumption
 */
function formatMarketIntelligence(marketIntelligence: any, network: any) {
  // Create a comprehensive summary
  const summary = {
    sentiment: marketIntelligence.overallSentiment || "Unknown",
    keyNarratives: marketIntelligence.keyNarratives?.length || 0,
    riskFactors: marketIntelligence.riskFactors?.length || 0,
    institutionalFlows: marketIntelligence.institutionalFlows || 0,
    regulatoryDevelopments: marketIntelligence.regulatoryDevelopments?.length || 0
  };

  // Format text for agent context
  const textParts = [];

  // Overall sentiment
  if (marketIntelligence.overallSentiment) {
    const sentimentEmoji = marketIntelligence.overallSentiment === 'BULLISH' ? '📈' : 
                          marketIntelligence.overallSentiment === 'BEARISH' ? '📉' : '⚖️';
    textParts.push(`Market Sentiment: ${sentimentEmoji} ${marketIntelligence.overallSentiment}`);
  }

  // Key narratives
  if (marketIntelligence.keyNarratives && marketIntelligence.keyNarratives.length > 0) {
    const topNarratives = marketIntelligence.keyNarratives.slice(0, 3);
    textParts.push(`Key Narratives: ${topNarratives.join(', ')}`);
  }

  // Risk factors
  if (marketIntelligence.riskFactors && marketIntelligence.riskFactors.length > 0) {
    const topRisks = marketIntelligence.riskFactors.slice(0, 3);
    textParts.push(`Risk Factors: ${topRisks.join(', ')}`);
  }

  // Institutional flows
  if (marketIntelligence.institutionalFlows !== undefined) {
    const flowDirection = marketIntelligence.institutionalFlows > 0 ? "inflow" : "outflow";
    textParts.push(`Institutional ${flowDirection}: ${Math.abs(marketIntelligence.institutionalFlows).toLocaleString()} BTC`);
  }

  // Regulatory developments
  if (marketIntelligence.regulatoryDevelopments && marketIntelligence.regulatoryDevelopments.length > 0) {
    const recentDevelopments = marketIntelligence.regulatoryDevelopments.slice(0, 2);
    textParts.push(`Regulatory: ${recentDevelopments.join(', ')}`);
  }

  // Network health context
  if (network?.networkHealth) {
    textParts.push(`Network Health: ${network.networkHealth}`);
  }

  return {
    text: textParts.join('. ') + '.',
    summary
  };
} 