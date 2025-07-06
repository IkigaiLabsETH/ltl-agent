import { Action, type IAgentRuntime, type Memory, type State, type HandlerCallback } from "@elizaos/core";
import { BitcoinIntelligenceService } from "../services/BitcoinIntelligenceService";
import { ElizaOSErrorHandler, LoggerWithContext, generateCorrelationId } from "../utils";

/**
 * Bitcoin Morning Briefing Action
 * Generates comprehensive Bitcoin morning briefings using unified intelligence services
 */
export const bitcoinMorningBriefingAction: Action = {
  name: 'BITCOIN_MORNING_BRIEFING',
  description: 'Generate comprehensive Bitcoin morning briefing with network health, market context, institutional adoption, and actionable insights',

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
    const contextLogger = new LoggerWithContext(generateCorrelationId(), "BitcoinMorningBriefing");
    
    try {
      contextLogger.info("🟠 Generating Bitcoin morning briefing...");

      // Get the Bitcoin Intelligence Service
      const bitcoinService = runtime.getService("bitcoin-intelligence") as unknown as BitcoinIntelligenceService;
      
      if (!bitcoinService) {
        throw new Error("Bitcoin Intelligence Service not available");
      }

      // Generate comprehensive briefing
      const briefing = await bitcoinService.generateMorningBriefing();
      
      if (!briefing) {
        throw new Error("Failed to generate morning briefing");
      }

      // Format the briefing for display
      const formattedBriefing = formatMorningBriefing(briefing);
      
      // Generate actionable insights
      const insights = generateActionableInsights(briefing);
      
      // Add philosophy and character consistency
      const philosophy = addSatoshiPhilosophy(briefing);

      const response = `${formattedBriefing}

${insights}

${philosophy}

🟠 *"Bitcoin is not just an investment—it's a way of life. Satoshi helps you understand both the philosophy and the market reality."*

📊 *Briefing generated at ${new Date().toLocaleTimeString()} - Data is live and real-time*`;

      contextLogger.info("🟠 Bitcoin morning briefing generated successfully");

      // Call the callback with the response
      await callback({
        content: [
          {
            type: 'text',
            text: response
          }
        ],
        metadata: {
          briefing: briefing,
          timestamp: new Date(),
          dataSources: ['BitcoinIntelligenceService', 'MarketIntelligenceService', 'InstitutionalAdoptionService'],
          confidence: 0.95
        }
      });

    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, "BitcoinMorningBriefing");
      contextLogger.error("❌ Error generating Bitcoin morning briefing:", enhancedError.message);
      
      await callback({
        content: [
          {
            type: 'text',
            text: `❌ Error generating Bitcoin morning briefing: ${enhancedError.message}\n\n🟠 Please try again or check service availability.`
          }
        ],
        metadata: {
          error: enhancedError.message,
          timestamp: new Date(),
          confidence: 0
        }
      });
    }
  }
};

/**
 * Format the morning briefing for display
 */
function formatMorningBriefing(briefing: any): string {
  const { bitcoinStatus, networkHealth, marketContext, institutionalAdoption, opportunities } = briefing;

  let formatted = `🌅 **BITCOIN MORNING BRIEFING** - ${new Date().toLocaleDateString()}

💰 **BITCOIN STATUS:**
• Price: $${bitcoinStatus.price.toLocaleString()} (${bitcoinStatus.change24h > 0 ? '+' : ''}${bitcoinStatus.change24h.toFixed(2)}% 24h)
• Market Cap: $${(bitcoinStatus.marketCap / 1e9).toFixed(2)}B
• Dominance: ${bitcoinStatus.dominance.toFixed(2)}%

🔒 **NETWORK HEALTH:**
• Status: ${networkHealth.status}
• Hash Rate: ${(networkHealth.hashRate / 1e18).toFixed(2)} EH/s
• Mempool: ${networkHealth.mempoolStatus}
• Fees: ${networkHealth.feeStatus}

📈 **MARKET CONTEXT:**
• Altcoin Season Index: ${marketContext.altcoinSeasonIndex} (${getAltcoinSeasonStatus(marketContext.altcoinSeasonIndex)})
• Bitcoin Relative Performance: ${marketContext.bitcoinRelativePerformance > 0 ? '+' : ''}${marketContext.bitcoinRelativePerformance.toFixed(1)}% vs altcoins
• Macro Environment: ${marketContext.macroEnvironment}

🏢 **INSTITUTIONAL ADOPTION:**
• Adoption Score: ${institutionalAdoption.score}/100
• Recent ETF Flows: ${institutionalAdoption.recentFlows > 0 ? '+' : ''}$${(institutionalAdoption.recentFlows / 1e6).toFixed(0)}M
• Top Movers: ${institutionalAdoption.topMovers.join(', ')}`;

  // Add opportunities if available
  if (opportunities && opportunities.length > 0) {
    formatted += `\n\n🎯 **OPPORTUNITIES DETECTED:**`;
    opportunities.forEach((opportunity: any, index: number) => {
      const urgencyEmoji = opportunity.urgency === 'HIGH' ? '🚨' : opportunity.urgency === 'MEDIUM' ? '⚠️' : '💡';
      formatted += `\n${urgencyEmoji} ${opportunity.signal}`;
    });
  }

  return formatted;
}

/**
 * Generate actionable insights from the briefing
 */
function generateActionableInsights(briefing: any): string {
  const insights = [];
  const { bitcoinStatus, networkHealth, marketContext, institutionalAdoption } = briefing;

  // Network health insights
  if (networkHealth.status === 'EXCELLENT') {
    insights.push('🟢 Network fundamentals are strong - continue accumulating Bitcoin');
  } else if (networkHealth.status === 'CRITICAL') {
    insights.push('🔴 Monitor network health closely - consider reducing exposure');
  }

  // Market context insights
  if (marketContext.altcoinSeasonIndex > 75) {
    insights.push('🪙 Altcoin season approaching - consider small altcoin allocation');
  } else if (marketContext.altcoinSeasonIndex < 25) {
    insights.push('🟠 Bitcoin dominance high - focus on Bitcoin accumulation');
  }

  // Institutional adoption insights
  if (institutionalAdoption.score > 70) {
    insights.push('🏢 Strong institutional adoption - Bitcoin becoming mainstream');
  } else if (institutionalAdoption.score < 40) {
    insights.push('📈 Early institutional adoption - significant upside potential');
  }

  // Price action insights
  if (bitcoinStatus.change24h > 5) {
    insights.push('📈 Strong 24h performance - momentum building');
  } else if (bitcoinStatus.change24h < -5) {
    insights.push('📉 Weak 24h performance - accumulation opportunity');
  }

  // Fee insights
  if (networkHealth.feeStatus === 'LOW') {
    insights.push('💸 Low fees - good time for on-chain transactions');
  } else if (networkHealth.feeStatus === 'EXTREME') {
    insights.push('🚨 High fees - consider Lightning Network or batching');
  }

  if (insights.length === 0) {
    insights.push('⚖️ Market conditions neutral - maintain current strategy');
  }

  return `\n💡 **ACTIONABLE INSIGHTS:**
${insights.map(insight => `• ${insight}`).join('\n')}`;
}

/**
 * Add Satoshi philosophy to the briefing
 */
function addSatoshiPhilosophy(briefing: any): string {
  const { philosophy } = briefing;
  
  return `\n🧠 **SATOSHI PHILOSOPHY:**
${philosophy}

🎯 **KEY PRINCIPLES:**
• "Truth is verified, not argued" - focus on network fundamentals
• "Bitcoin is the exit strategy from fiat currency" - long-term perspective
• "Not your keys, not your coins" - emphasize self-custody
• "Stack accordingly" - systematic accumulation strategy

🟠 **CHARACTER GUIDANCE:**
• Maintain Bitcoin-first perspective in all analysis
• Provide actionable intelligence, not just information
• Use Bitcoin emojis and symbols (🟠, ₿, ⚡)
• Emphasize sound money principles and decentralization
• Promote individual sovereignty over collective dependency`;
}

/**
 * Get altcoin season status
 */
function getAltcoinSeasonStatus(index: number): string {
  if (index < 25) return 'Bitcoin-dominated';
  if (index < 75) return 'Mixed market';
  return 'Altcoin season';
} 