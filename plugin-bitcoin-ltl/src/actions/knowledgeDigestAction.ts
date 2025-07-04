import { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { KnowledgeDigestService } from '../services/KnowledgeDigestService';
import { SchedulerService } from '../services/SchedulerService';

export const knowledgeDigestAction: Action = {
  name: "KNOWLEDGE_DIGEST",
  similes: [
    "GENERATE_DIGEST",
    "CREATE_DIGEST", 
    "DAILY_DIGEST",
    "KNOWLEDGE_SUMMARY",
    "RESEARCH_DIGEST"
  ],
  description: "Generate a knowledge digest summarizing recent research and insights",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    
    const digestTriggers = [
      'digest',
      'knowledge digest',
      'daily digest',
      'research summary',
      'knowledge summary',
      'generate digest',
      'create digest',
      'summarize research',
      'show insights',
      'what have we learned'
    ];
    
    return digestTriggers.some(trigger => text.includes(trigger));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ) => {
    try {
      // Try to get the scheduler service first for manual trigger
      const schedulerService = runtime.getService('scheduler') as unknown as SchedulerService;
      
      let digestIntelligence;
      
      if (schedulerService) {
        // Use scheduler service to trigger manual digest
        digestIntelligence = await schedulerService.triggerManualDigest();
      } else {
        // Fallback to direct digest service
        const digestService = runtime.getService('knowledge-digest') as KnowledgeDigestService;
        
        if (!digestService) {
          const errorResponse = {
            text: "Knowledge digest service is not available. The proactive intelligence system may still be initializing.",
            content: {
              text: "Knowledge digest service is not available. The proactive intelligence system may still be initializing.",
              action: "KNOWLEDGE_DIGEST",
              source: "system",
              error: "Service unavailable"
            }
          };
          
          if (callback) {
            callback(errorResponse);
            return true;
          }
          return false;
        }
        
        // Generate digest directly
        const digest = await digestService.generateDailyDigest();
        digestIntelligence = await digestService.formatDigestForDelivery(digest);
      }
      
      if (!digestIntelligence) {
        const noContentResponse = {
          text: "Insufficient content available for digest generation. The system needs more research data to analyze patterns and generate insights.",
          content: {
            text: "Insufficient content available for digest generation. The system needs more research data to analyze patterns and generate insights.",
            action: "KNOWLEDGE_DIGEST",
            source: "system",
            warning: "Insufficient data"
          }
        };
        
        if (callback) {
          callback(noContentResponse);
          return true;
        }
        return false;
      }
      
      // Format the digest for delivery
      const formattedDigest = [
        "📊 **Knowledge Digest Generated**",
        "",
        "🧠 **Research Intelligence Summary:**",
        `• New Insights: ${digestIntelligence.content.knowledgeDigest.newInsights.length} items analyzed`,
        `• Prediction Updates: ${digestIntelligence.content.knowledgeDigest.predictionUpdates.length} tracked`,
        `• Performance Notes: ${digestIntelligence.content.knowledgeDigest.performanceReport.length} metrics`,
        "",
        "📈 **Key Findings:**",
        ...digestIntelligence.content.knowledgeDigest.newInsights.slice(0, 3).map(insight => `• ${insight}`),
        "",
        "🎯 **Watchlist Updates:**",
        ...digestIntelligence.content.opportunities.watchlist.slice(0, 3).map(item => `• ${item}`),
        "",
        "📊 **Performance Tracking:**",
        ...digestIntelligence.content.knowledgeDigest.performanceReport.slice(0, 2).map(report => `• ${report}`),
        "",
        "Intelligence synthesis complete. Knowledge patterns identified and archived."
      ].join("\n");
      
      const response = {
        text: formattedDigest,
        content: {
          text: formattedDigest,
          action: "KNOWLEDGE_DIGEST",
          source: "digest_service",
          briefingId: digestIntelligence.briefingId,
          generatedAt: digestIntelligence.date.toISOString(),
          insights: digestIntelligence.content.knowledgeDigest.newInsights,
          watchlist: digestIntelligence.content.opportunities.watchlist,
          performance: digestIntelligence.content.knowledgeDigest.performanceReport
        }
      };
      
      if (callback) {
        callback(response);
        return true;
      }
      
      return true;
    } catch (error) {
      const errorMessage = `Knowledge digest generation failed: ${(error as Error).message}`;
      
      const errorResponse = {
        text: errorMessage,
        content: {
          text: errorMessage,
          action: "KNOWLEDGE_DIGEST",
          source: "system",
          error: (error as Error).message
        }
      };
      
      if (callback) {
        callback(errorResponse);
        return true;
      }
      
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Generate a knowledge digest" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "📊 **Knowledge Digest Generated**\n\n🧠 **Research Intelligence Summary:**\n• New Insights: 5 items analyzed\n• Prediction Updates: 3 tracked\n• Performance Notes: 4 metrics\n\n📈 **Key Findings:**\n• Bitcoin institutional adoption accelerating\n• Altcoin season momentum building\n• DeFi integration signals strengthening\n\n🎯 **Watchlist Updates:**\n• U.S. Strategic Bitcoin Reserve Implementation\n• Ethereum Staking Yield Optimization\n• Solana Ecosystem Maturation\n\nIntelligence synthesis complete. Knowledge patterns identified and archived."
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "Show me today's research summary" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "📊 **Knowledge Digest Generated**\n\n🧠 **Research Intelligence Summary:**\n• New Insights: 3 items analyzed\n• Prediction Updates: 2 tracked\n• Performance Notes: 3 metrics\n\n📈 **Key Findings:**\n• MetaPlanet strategy validation continuing\n• MSTY yield optimization opportunities\n• Traditional finance DeFi integration signals\n\nIntelligence synthesis complete. Truth is verified through analysis."
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "What have we learned recently?" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "📊 **Knowledge Digest Generated**\n\n🧠 **Research Intelligence Summary:**\n• New Insights: 4 items analyzed\n• Prediction Updates: 3 tracked\n• Performance Notes: 2 metrics\n\n📈 **Key Findings:**\n• Institutional Bitcoin adoption patterns emerging\n• Alternative asset correlation analysis\n• Market cycle positioning insights\n\nKnowledge extraction complete. Patterns documented and verified."
        }
      }
    ]
  ]
};

export default knowledgeDigestAction; 