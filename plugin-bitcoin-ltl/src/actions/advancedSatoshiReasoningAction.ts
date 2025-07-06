import { Action, IAgentRuntime, Memory, State, HandlerCallback, Content } from "@elizaos/core";
import { AdvancedMarketIntelligenceService } from "../services/AdvancedMarketIntelligenceService";
import { KnowledgeBaseService } from "../services/KnowledgeBaseService";

/**
 * Advanced Satoshi Reasoning Action
 * Uses sophisticated market intelligence for deep, context-aware reasoning
 */
export const advancedSatoshiReasoningAction: Action = {
  name: "ADVANCED_SATOSHI_REASONING",
  similes: ["ADVANCED_REASONING", "DEEP_ANALYSIS", "SATOSHI_INTELLIGENCE"],
  description: "Advanced reasoning using sophisticated market intelligence, opportunity detection, and risk assessment.",

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return text.includes("advanced") || text.includes("deep") || text.includes("analysis") || text.includes("opportunity");
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[],
  ) => {
    try {
      const userQuery = message.content?.text || "(no question provided)";
      
      // Get advanced market intelligence
      const advancedService = runtime.getService<AdvancedMarketIntelligenceService>("advanced-market-intelligence");
      const knowledgeService = runtime.getService<KnowledgeBaseService>("knowledge-base");
      const philosophy = state?.values?.philosophy;

      // Get sophisticated analysis
      const marketConditions = advancedService ? await advancedService.analyzeMarketConditions() : null;
      const riskAssessment = advancedService ? await advancedService.assessRisk() : null;

      // Enhanced knowledge synthesis
      let knowledgeInsights = "";
      if (knowledgeService) {
        const topics = knowledgeService.getAllTopics();
        const query = userQuery.toLowerCase();
        
        // Find most relevant topics based on market conditions
        let relevantTopics = topics;
        if (marketConditions) {
          if (marketConditions.type === 'BULL') {
            relevantTopics = topics.filter(t => t.includes('bull') || t.includes('cycle') || t.includes('thesis'));
          } else if (marketConditions.type === 'ACCUMULATION') {
            relevantTopics = topics.filter(t => t.includes('accumulation') || t.includes('dca') || t.includes('strategy'));
          } else if (marketConditions.type === 'ROTATION') {
            relevantTopics = topics.filter(t => t.includes('altcoin') || t.includes('rotation') || t.includes('season'));
          }
        }
        
        // Get summaries of relevant topics
        const summaries = relevantTopics.slice(0, 2).map(topic => {
          const summary = knowledgeService.summarize(topic);
          return summary ? `• **${topic.replace(/-/g, ' ')}**: ${summary}` : '';
        }).filter(Boolean);
        
        knowledgeInsights = summaries.join('\n');
      }

      // Generate sophisticated actionable insights
      let actionableInsights = "";
      if (marketConditions && riskAssessment) {
        actionableInsights = generateAdvancedInsights(marketConditions, riskAssessment);
      } else {
        actionableInsights = "Stay focused on first principles. Insufficient data for advanced analysis.";
      }

      // Get philosophy quote
      let satoshiQuote = "Truth is verified, not argued.";
      if (philosophy?.satoshiQuotes && philosophy.satoshiQuotes.length > 0) {
        satoshiQuote = philosophy.satoshiQuotes[Math.floor(Math.random() * philosophy.satoshiQuotes.length)];
      }

      // Compose advanced response
      const responseText = `🟠 **Advanced Satoshi Intelligence** 🟠

**Your Question:**
${userQuery}

**Philosophy:**
${satoshiQuote}

**Market Intelligence:**
${marketConditions ? `
🎯 **Market Condition:** ${marketConditions.type} (${(marketConditions.confidence * 100).toFixed(0)}% confidence)
⚠️ **Risk Level:** ${marketConditions.riskLevel}
📊 **Signals:** ${marketConditions.signals.join(', ')}
` : 'Market data unavailable'}

**Risk Assessment:**
${riskAssessment ? `
🔒 **Overall Risk:** ${riskAssessment.overallRisk}
📈 **Market Risk:** ${(riskAssessment.marketRisk * 100).toFixed(0)}%
📊 **Volatility Risk:** ${(riskAssessment.volatilityRisk * 100).toFixed(0)}%
🔄 **Correlation Risk:** ${(riskAssessment.correlationRisk * 100).toFixed(0)}%
💧 **Liquidity Risk:** ${(riskAssessment.liquidityRisk * 100).toFixed(0)}%
` : 'Risk assessment unavailable'}

**Knowledge Synthesis:**
${knowledgeInsights || '(no relevant knowledge found)'}

**Opportunities:**
${marketConditions?.opportunities.length ? marketConditions.opportunities.map(opp => 
  `🎯 **${opp.type}**: ${opp.description}\n   Risk/Reward: ${opp.riskRewardRatio}:1 | Confidence: ${(opp.confidence * 100).toFixed(0)}%\n   Action: ${opp.action}`
).join('\n\n') : 'No specific opportunities identified'}

**Advanced Actionable Insights:**
${actionableInsights}

**Risk Recommendations:**
${riskAssessment?.recommendations.length ? riskAssessment.recommendations.map(rec => `• ${rec}`).join('\n') : 'No specific recommendations'}

*"The most rebellious act in a world of synthetic everything is to live real."* 🟠`;

      const content: Content = {
        text: responseText,
        actions: ["ADVANCED_SATOSHI_REASONING"],
        source: "advanced-satoshi-reasoning-action",
      };

      await callback(content);
      return content;
    } catch (error) {
      const errorContent: Content = {
        text: "❌ Advanced Satoshi Intelligence failed. Please try again.",
        actions: ["ADVANCED_SATOSHI_REASONING"],
        source: "advanced-satoshi-reasoning-action",
      };
      await callback(errorContent);
      return errorContent;
    }
  },
};

/**
 * Generate advanced insights based on market conditions and risk assessment
 */
function generateAdvancedInsights(marketConditions: any, riskAssessment: any): string {
  const insights: string[] = [];

  // Market condition insights
  switch (marketConditions.type) {
    case 'BULL':
      insights.push("Market showing strong bullish momentum. Consider profit-taking strategies while maintaining core position.");
      if (riskAssessment.overallRisk === 'HIGH' || riskAssessment.overallRisk === 'EXTREME') {
        insights.push("High risk environment - implement defensive measures and reduce leverage.");
      }
      break;
    case 'ACCUMULATION':
      insights.push("Accumulation phase detected. This is the time to build positions systematically.");
      insights.push("Focus on DCA strategy and ignore short-term noise.");
      break;
    case 'ROTATION':
      insights.push("Capital rotation detected. Monitor altcoin performance while maintaining Bitcoin core.");
      insights.push("Consider tactical allocation to proven altcoins with strong fundamentals.");
      break;
    case 'DISTRIBUTION':
      insights.push("Distribution phase - consider reducing exposure and taking profits.");
      insights.push("Maintain core Bitcoin position but trim speculative holdings.");
      break;
    default:
      insights.push("Neutral market conditions. Stay focused on long-term strategy and fundamentals.");
  }

  // Risk-based insights
  if (riskAssessment.overallRisk === 'LOW') {
    insights.push("Low risk environment - favorable for aggressive accumulation.");
  } else if (riskAssessment.overallRisk === 'EXTREME') {
    insights.push("Extreme risk detected - implement maximum defensive positioning.");
  }

  return insights.join('\n');
} 