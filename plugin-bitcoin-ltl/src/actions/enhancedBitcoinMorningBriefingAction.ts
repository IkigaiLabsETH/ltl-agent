/**
 * Enhanced Bitcoin Morning Briefing Action
 * Provides comprehensive Bitcoin intelligence and market analysis
 * Implements 99% Bitcoin focus with 1% open mind for strategic intelligence
 */

import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { BitcoinIntelligenceService } from "../services/BitcoinIntelligenceService";
import { ElizaOSErrorHandler, LoggerWithContext, generateCorrelationId } from "../utils";

export const enhancedBitcoinMorningBriefingAction: Action = {
  name: "ENHANCED_BITCOIN_MORNING_BRIEFING",
  description: "Generate comprehensive Bitcoin morning briefing with network health, market context, institutional adoption, and selective asset tracking",

  validate: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    // Validate that the Bitcoin Intelligence Service is available
    const bitcoinService = runtime.getService("bitcoin-intelligence");
    return !!bitcoinService;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ) => {
    const correlationId = generateCorrelationId();
    const logger = new LoggerWithContext("EnhancedBitcoinMorningBriefing", correlationId);
    
    try {
      // Get the Bitcoin Intelligence Service
      const bitcoinIntelService = runtime.getService<BitcoinIntelligenceService>("bitcoin-intelligence");
      if (!bitcoinIntelService) {
        throw new Error("Bitcoin Intelligence Service not available");
      }

      // Generate comprehensive morning briefing
      const briefing = await bitcoinIntelService.generateMorningBriefing();
      
      if (!briefing) {
        throw new Error("Failed to generate morning briefing");
      }

      // Get format from options or default to comprehensive
      const format = options?.format || "COMPREHENSIVE";
      
      // Format the briefing based on requested format
      const formattedBriefing = formatMorningBriefing(briefing, format);
      
      // Generate actionable insights
      const insights = generateActionableInsights(briefing);
      
      // Format the response for display
      const response = formatEnhancedBriefingResponse(formattedBriefing, insights, briefing);

      logger.info("Generated enhanced Bitcoin morning briefing", {
        format: format,
        opportunitiesCount: briefing.opportunities.length,
        timestamp: briefing.timestamp
      });

      // Call the callback with the response
      await callback({
        content: [
          {
            type: 'text',
            text: response
          }
        ],
        metadata: {
          briefing: formattedBriefing,
          insights: insights,
          timestamp: new Date(),
          format: format,
          dataSources: ['BitcoinIntelligenceService'],
          confidence: 0.95
        }
      });

    } catch (error) {
      ElizaOSErrorHandler.logStructuredError(error, logger, {
        context: "Enhanced Bitcoin Morning Briefing Action",
        operation: "generate briefing",
        options
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        message: "Failed to generate enhanced Bitcoin morning briefing"
      };
    }
  }
};

/**
 * Format morning briefing based on requested format
 */
function formatMorningBriefing(briefing: any, format: string) {
  const { bitcoinStatus, treasuryCompanies, selectiveAltcoins, stablecoinEcosystem, techStocks, miningStocks, marketIntelligence, philosophy } = briefing;
  
  switch (format) {
    case "EXECUTIVE":
      return formatExecutiveBriefing(briefing);
    case "FOCUSED":
      return formatFocusedBriefing(briefing);
    case "COMPREHENSIVE":
    default:
      return formatComprehensiveBriefing(briefing);
  }
}

/**
 * Format comprehensive briefing with all details
 */
function formatComprehensiveBriefing(briefing: any) {
  const { bitcoinStatus, treasuryCompanies, selectiveAltcoins, stablecoinEcosystem, techStocks, miningStocks, marketIntelligence, philosophy } = briefing;
  
  return {
    summary: {
      bitcoinPrice: `$${bitcoinStatus.price.toLocaleString()}`,
      marketCap: `$${bitcoinStatus.marketCap.toLocaleString()}`,
      dominance: `${bitcoinStatus.dominance}%`,
      change24h: `${bitcoinStatus.change24h > 0 ? '+' : ''}${bitcoinStatus.change24h}%`,
      networkHealth: bitcoinStatus.networkHealth,
      sentiment: marketIntelligence.overallSentiment
    },
    network: {
      health: bitcoinStatus.networkHealth,
      hashRate: `${(bitcoinStatus.hashRate / 1e18).toFixed(2)} EH/s`,
      mempoolSize: `${bitcoinStatus.mempoolSize} MB`,
      feeRate: `${bitcoinStatus.feeRate} sat/vB`,
      mempoolStatus: bitcoinStatus.mempoolStatus,
      feeStatus: bitcoinStatus.feeStatus
    },
    market: {
      sentiment: marketIntelligence.overallSentiment,
      keyNarratives: marketIntelligence.keyNarratives,
      regulatoryDevelopments: marketIntelligence.regulatoryDevelopments,
      institutionalFlows: marketIntelligence.institutionalFlows,
      riskFactors: marketIntelligence.riskFactors
    },
    treasury: {
      mstr: {
        price: `$${treasuryCompanies.mstr.price.toLocaleString()}`,
        vsBitcoin: `${treasuryCompanies.mstr.vsBitcoin > 0 ? '+' : ''}${treasuryCompanies.mstr.vsBitcoin}%`,
        btcHoldings: treasuryCompanies.mstr.btcHoldings.toLocaleString(),
        leverageStatus: treasuryCompanies.mstr.leverageStatus,
        narrative: treasuryCompanies.mstr.narrative
      },
      mtplf: {
        price: `$${treasuryCompanies.mtpfl.price.toLocaleString()}`,
        vsBitcoin: `${treasuryCompanies.mtpfl.vsBitcoin > 0 ? '+' : ''}${treasuryCompanies.mtpfl.vsBitcoin}%`,
        btcHoldings: treasuryCompanies.mtpfl.btcHoldings.toLocaleString(),
        narrative: treasuryCompanies.mtpfl.narrative
      }
    },
    selectiveAltcoins: {
      fartcoin: {
        price: `$${selectiveAltcoins.fartcoin.price.toLocaleString()}`,
        vsBitcoin: `${selectiveAltcoins.fartcoin.vsBitcoin > 0 ? '+' : ''}${selectiveAltcoins.fartcoin.vsBitcoin}%`,
        marketCap: `$${selectiveAltcoins.fartcoin.marketCap.toLocaleString()}`,
        narrative: selectiveAltcoins.fartcoin.narrative
      },
      hype: {
        price: `$${selectiveAltcoins.hype.price.toLocaleString()}`,
        vsBitcoin: `${selectiveAltcoins.hype.vsBitcoin > 0 ? '+' : ''}${selectiveAltcoins.hype.vsBitcoin}%`,
        marketCap: `$${selectiveAltcoins.hype.marketCap.toLocaleString()}`,
        revenue: `$${selectiveAltcoins.hype.revenue.toLocaleString()}`,
        buybackYield: `${selectiveAltcoins.hype.buybackYield}%`,
        narrative: selectiveAltcoins.hype.narrative
      },
      altcoinSeasonIndex: selectiveAltcoins.altcoinSeasonIndex,
      bitcoinDominance: `${selectiveAltcoins.bitcoinDominance}%`
    },
    stablecoins: {
      crcl: {
        price: `$${stablecoinEcosystem.crcl.price.toLocaleString()}`,
        vsBitcoin: `${stablecoinEcosystem.crcl.vsBitcoin > 0 ? '+' : ''}${stablecoinEcosystem.crcl.vsBitcoin}%`,
        regulatoryStatus: stablecoinEcosystem.crcl.regulatoryStatus,
        narrative: stablecoinEcosystem.crcl.narrative
      },
      coin: {
        price: `$${stablecoinEcosystem.coin.price.toLocaleString()}`,
        vsBitcoin: `${stablecoinEcosystem.coin.vsBitcoin > 0 ? '+' : ''}${stablecoinEcosystem.coin.vsBitcoin}%`,
        stablecoinRevenue: `$${stablecoinEcosystem.coin.stablecoinRevenue.toLocaleString()}`,
        narrative: stablecoinEcosystem.coin.narrative
      }
    },
    techStocks: {
      nvda: {
        price: `$${techStocks.nvda.price.toLocaleString()}`,
        vsBitcoin: `${techStocks.nvda.vsBitcoin > 0 ? '+' : ''}${techStocks.nvda.vsBitcoin}%`,
        aiNarrative: techStocks.nvda.aiNarrative
      },
      tsla: {
        price: `$${techStocks.tsla.price.toLocaleString()}`,
        vsBitcoin: `${techStocks.tsla.vsBitcoin > 0 ? '+' : ''}${techStocks.tsla.vsBitcoin}%`,
        btcHoldings: techStocks.tsla.btcHoldings.toLocaleString(),
        innovationNarrative: techStocks.tsla.innovationNarrative
      },
      hood: {
        price: `$${techStocks.hood.price.toLocaleString()}`,
        vsBitcoin: `${techStocks.hood.vsBitcoin > 0 ? '+' : ''}${techStocks.hood.vsBitcoin}%`,
        tokenizedStocksNarrative: techStocks.hood.tokenizedStocksNarrative
      }
    },
    mining: {
      mara: {
        price: `$${miningStocks.mara.price.toLocaleString()}`,
        vsBitcoin: `${miningStocks.mara.vsBitcoin > 0 ? '+' : ''}${miningStocks.mara.vsBitcoin}%`,
        hashRate: `${(miningStocks.mara.hashRate / 1e18).toFixed(2)} EH/s`,
        narrative: miningStocks.mara.narrative
      },
      riot: {
        price: `$${miningStocks.riot.price.toLocaleString()}`,
        vsBitcoin: `${miningStocks.riot.vsBitcoin > 0 ? '+' : ''}${miningStocks.riot.vsBitcoin}%`,
        hashRate: `${(miningStocks.riot.hashRate / 1e18).toFixed(2)} EH/s`,
        narrative: miningStocks.riot.narrative
      }
    },
    philosophy: {
      bitcoinMaximalism: philosophy.bitcoinMaximalism,
      strategicAwareness: philosophy.strategicAwareness,
      actionableInsights: philosophy.actionableInsights
    }
  };
}

/**
 * Format executive briefing with key highlights
 */
function formatExecutiveBriefing(briefing: any) {
  const { bitcoinStatus, marketIntelligence, philosophy } = briefing;
  
  return {
    bitcoinStatus: {
      price: `$${bitcoinStatus.price.toLocaleString()}`,
      change24h: `${bitcoinStatus.change24h > 0 ? '+' : ''}${bitcoinStatus.change24h}%`,
      dominance: `${bitcoinStatus.dominance}%`,
      networkHealth: bitcoinStatus.networkHealth
    },
    marketSentiment: marketIntelligence.overallSentiment,
    keyNarratives: marketIntelligence.keyNarratives.slice(0, 3),
    riskFactors: marketIntelligence.riskFactors.slice(0, 3),
    philosophy: {
      bitcoinMaximalism: philosophy.bitcoinMaximalism,
      actionableInsights: philosophy.actionableInsights.slice(0, 3)
    }
  };
}

/**
 * Format focused briefing on specific areas
 */
function formatFocusedBriefing(briefing: any) {
  const { bitcoinStatus, treasuryCompanies, selectiveAltcoins, marketIntelligence } = briefing;
  
  return {
    bitcoin: {
      price: `$${bitcoinStatus.price.toLocaleString()}`,
      change24h: `${bitcoinStatus.change24h > 0 ? '+' : ''}${bitcoinStatus.change24h}%`,
      networkHealth: bitcoinStatus.networkHealth
    },
    treasury: {
      mstr: {
        price: `$${treasuryCompanies.mstr.price.toLocaleString()}`,
        vsBitcoin: `${treasuryCompanies.mstr.vsBitcoin > 0 ? '+' : ''}${treasuryCompanies.mstr.vsBitcoin}%`,
        leverageStatus: treasuryCompanies.mstr.leverageStatus
      },
      mtplf: {
        price: `$${treasuryCompanies.mtpfl.price.toLocaleString()}`,
        vsBitcoin: `${treasuryCompanies.mtpfl.vsBitcoin > 0 ? '+' : ''}${treasuryCompanies.mtpfl.vsBitcoin}%`
      }
    },
    selectiveAltcoins: {
      fartcoin: {
        price: `$${selectiveAltcoins.fartcoin.price.toLocaleString()}`,
        vsBitcoin: `${selectiveAltcoins.fartcoin.vsBitcoin > 0 ? '+' : ''}${selectiveAltcoins.fartcoin.vsBitcoin}%`
      },
      hype: {
        price: `$${selectiveAltcoins.hype.price.toLocaleString()}`,
        vsBitcoin: `${selectiveAltcoins.hype.vsBitcoin > 0 ? '+' : ''}${selectiveAltcoins.hype.vsBitcoin}%`,
        buybackYield: `${selectiveAltcoins.hype.buybackYield}%`
      }
    },
    marketSentiment: marketIntelligence.overallSentiment
  };
}

/**
 * Generate actionable insights from briefing data
 */
function generateActionableInsights(briefing: any) {
  const insights = [];
  const { bitcoinStatus, treasuryCompanies, selectiveAltcoins, marketIntelligence, opportunities } = briefing;
  
  // Network health insights
  if (bitcoinStatus.networkHealth === 'EXCELLENT') {
    insights.push("Bitcoin network is operating at peak efficiency - optimal time for transactions");
  } else if (bitcoinStatus.networkHealth === 'CRITICAL') {
    insights.push("Network health critical - monitor for potential issues");
  }
  
  // Treasury company insights
  if (treasuryCompanies.mstr.leverageStatus === 'WORKING') {
    insights.push("MSTR leverage strategy is performing well - positive signal for Bitcoin adoption");
  } else if (treasuryCompanies.mstr.leverageStatus === 'STRESSED') {
    insights.push("MSTR leverage under stress - monitor for potential impact on Bitcoin");
  }
  
  // Market sentiment insights
  if (marketIntelligence.overallSentiment === 'BULLISH') {
    insights.push("Market sentiment bullish - favorable conditions for Bitcoin");
  } else if (marketIntelligence.overallSentiment === 'BEARISH') {
    insights.push("Market sentiment bearish - exercise caution and focus on fundamentals");
  }
  
  // Selective altcoin insights
  if (selectiveAltcoins.fartcoin.vsBitcoin > 50) {
    insights.push("FARTCOIN significantly outperforming Bitcoin - monitor for potential rotation");
  }
  
  if (selectiveAltcoins.hype.buybackYield > 10) {
    insights.push("HYPE buyback yield attractive - positive signal for tokenomics");
  }
  
  // Add opportunities as insights
  opportunities.forEach((opportunity: any) => {
    insights.push(`${opportunity.type} Opportunity: ${opportunity.signal} (Confidence: ${opportunity.confidence}%, Urgency: ${opportunity.urgency})`);
  });
  
  return insights;
}

/**
 * Format enhanced briefing response for display
 */
function formatEnhancedBriefingResponse(formattedBriefing: any, insights: string[], briefing: any): string {
  const { bitcoinStatus, opportunities } = briefing;
  
  let response = `🌅 **ENHANCED BITCOIN MORNING BRIEFING** - ${new Date().toLocaleDateString()}

💰 **BITCOIN STATUS:**
• Price: $${bitcoinStatus.price.toLocaleString()} (${bitcoinStatus.change24h > 0 ? '+' : ''}${bitcoinStatus.change24h.toFixed(2)}% 24h)
• Market Cap: $${(bitcoinStatus.marketCap / 1e9).toFixed(2)}B
• Dominance: ${bitcoinStatus.dominance.toFixed(2)}%
• Network Health: ${bitcoinStatus.networkHealth}

📊 **COMPREHENSIVE ANALYSIS:**
${formatBriefingSections(formattedBriefing)}

💡 **ACTIONABLE INSIGHTS:**
${insights.map(insight => `• ${insight}`).join('\n')}`;

  // Add opportunities if available
  if (opportunities && opportunities.length > 0) {
    response += `\n\n🎯 **OPPORTUNITIES DETECTED:**`;
    opportunities.forEach((opportunity: any) => {
      const urgencyEmoji = opportunity.urgency === 'HIGH' ? '🚨' : opportunity.urgency === 'MEDIUM' ? '⚠️' : '💡';
      response += `\n${urgencyEmoji} ${opportunity.signal} (Confidence: ${opportunity.confidence}%)`;
    });
  }

  response += `\n\n🟠 *"Bitcoin is not just an investment—it's a way of life. Enhanced intelligence helps you understand both the philosophy and the market reality."*

📊 *Enhanced briefing generated at ${new Date().toLocaleTimeString()} - Data is live and real-time*`;

  return response;
}

/**
 * Format briefing sections for display
 */
function formatBriefingSections(briefing: any): string {
  let sections = '';
  
  // Network section
  if (briefing.network) {
    sections += `\n🔒 **NETWORK HEALTH:**
• Hash Rate: ${briefing.network.hashRate}
• Mempool: ${briefing.network.mempoolStatus}
• Fees: ${briefing.network.feeStatus}`;
  }
  
  // Market section
  if (briefing.market) {
    sections += `\n\n📈 **MARKET CONTEXT:**
• Sentiment: ${briefing.market.sentiment}
• Key Narratives: ${briefing.market.keyNarratives?.slice(0, 3).join(', ')}
• Risk Factors: ${briefing.market.riskFactors?.slice(0, 3).join(', ')}`;
  }
  
  // Treasury section
  if (briefing.treasury) {
    sections += `\n\n🏢 **TREASURY COMPANIES:**
• MSTR: ${briefing.treasury.mstr.price} (${briefing.treasury.mstr.vsBitcoin} vs BTC)
• MTPLF: ${briefing.treasury.mtpfl.price} (${briefing.treasury.mtpfl.vsBitcoin} vs BTC)`;
  }
  
  // Selective altcoins section
  if (briefing.selectiveAltcoins) {
    sections += `\n\n🪙 **SELECTIVE ALTCOINS:**
• FARTCOIN: ${briefing.selectiveAltcoins.fartcoin.price} (${briefing.selectiveAltcoins.fartcoin.vsBitcoin} vs BTC)
• HYPE: ${briefing.selectiveAltcoins.hype.price} (${briefing.selectiveAltcoins.hype.vsBitcoin} vs BTC, ${briefing.selectiveAltcoins.hype.buybackYield}% buyback yield)`;
  }
  
  // Tech stocks section
  if (briefing.techStocks) {
    sections += `\n\n💻 **TECH STOCKS:**
• NVDA: ${briefing.techStocks.nvda.price} (${briefing.techStocks.nvda.vsBitcoin} vs BTC)
• TSLA: ${briefing.techStocks.tsla.price} (${briefing.techStocks.tsla.vsBitcoin} vs BTC)
• HOOD: ${briefing.techStocks.hood.price} (${briefing.techStocks.hood.vsBitcoin} vs BTC)`;
  }
  
  // Mining section
  if (briefing.mining) {
    sections += `\n\n⛏️ **MINING STOCKS:**
• MARA: ${briefing.mining.mara.price} (${briefing.mining.mara.vsBitcoin} vs BTC)
• RIOT: ${briefing.mining.riot.price} (${briefing.mining.riot.vsBitcoin} vs BTC)`;
  }
  
  return sections;
} 