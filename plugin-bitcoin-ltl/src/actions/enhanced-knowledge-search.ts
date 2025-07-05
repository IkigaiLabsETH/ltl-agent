import {
  ActionExample,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
  type Action,
} from '@elizaos/core';

export const enhancedKnowledgeSearchAction: Action = {
  name: 'ENHANCED_KNOWLEDGE_SEARCH',
  similes: [
    'KNOWLEDGE_SEARCH',
    'SEARCH_KNOWLEDGE',
    'FIND_INFORMATION',
    'LOOKUP_KNOWLEDGE',
    'RETRIEVE_KNOWLEDGE',
    'SEARCH_DOCS',
    'FIND_DOCS',
    'SEMANTIC_SEARCH',
    'RAG_SEARCH',
  ],
  description: 'Search the knowledge base using RAG (Retrieval-Augmented Generation) for relevant information',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Validate that the knowledge service is available
    const knowledgeService = runtime.getService('knowledge');
    if (!knowledgeService) {
      console.warn('Knowledge service not available');
      return false;
    }
    
    // Check if the message contains a search query
    const content = message.content?.text;
    if (!content || content.length < 10) {
      return false;
    }
    
    // Check for knowledge-related keywords
    const knowledgeKeywords = [
      'explain', 'how does', 'what is', 'tell me about', 'describe',
      'bitcoin', 'cryptocurrency', 'strategy', 'analysis', 'investment',
      'luxury', 'travel', 'lifestyle', 'market', 'thesis', 'guide'
    ];
    
    return knowledgeKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback: HandlerCallback
  ) => {
    try {
      const knowledgeService = runtime.getService('knowledge');
      
      if (!knowledgeService) {
        callback({
          text: 'Knowledge service is not available. Please check the plugin configuration.',
          action: 'ENHANCED_KNOWLEDGE_SEARCH',
        });
        return;
      }
      
      const query = message.content?.text;
      if (!query) {
        callback({
          text: 'Please provide a search query.',
          action: 'ENHANCED_KNOWLEDGE_SEARCH',
        });
        return;
      }
      
      console.log(`🔍 Searching knowledge base for: "${query}"`);
      
      // Use the knowledge service to search (adapt to actual API)
      const searchResults = await (knowledgeService as any).search({
        query,
        agentId: runtime.agentId,
        maxResults: 5,
        similarityThreshold: 0.7,
      });
      
      if (!searchResults || searchResults.length === 0) {
        callback({
          text: `I searched my knowledge base but couldn't find specific information about "${query}". Could you rephrase your question or ask about Bitcoin, cryptocurrency, luxury lifestyle, or investment strategies?`,
          action: 'ENHANCED_KNOWLEDGE_SEARCH',
        });
        return;
      }
      
      // Process and format the results
      const formattedResults = searchResults.map((result: any, index: number) => {
        const relevanceScore = Math.round((result.similarity || 0.8) * 100);
        const source = result.metadata?.source || result.source || 'Knowledge Base';
        
        return {
          index: index + 1,
          content: result.content.substring(0, 500) + (result.content.length > 500 ? '...' : ''),
          source,
          relevance: relevanceScore,
          metadata: result.metadata
        };
      });
      
      // Create a comprehensive response
      const topResult = formattedResults[0];
      const additionalSources = formattedResults.slice(1, 3);
      
      let response = `Based on my knowledge base search, here's what I found about "${query}":\n\n`;
      response += `**Primary Information (${topResult.relevance}% relevance):**\n`;
      response += `${topResult.content}\n\n`;
      
      if (additionalSources.length > 0) {
        response += `**Additional Context:**\n`;
        additionalSources.forEach((result, index) => {
          response += `${index + 1}. (${result.relevance}% relevance) ${result.content.substring(0, 200)}...\n`;
        });
        response += `\n`;
      }
      
      response += `*Sources: ${formattedResults.map(r => r.source).join(', ')}*\n\n`;
      response += `Would you like me to elaborate on any specific aspect or search for related topics?`;
      
      callback({
        text: response,
        action: 'ENHANCED_KNOWLEDGE_SEARCH',
        metadata: {
          searchQuery: query,
          resultsCount: searchResults.length,
          sources: formattedResults.map(r => r.source),
          topRelevance: topResult.relevance,
        }
      });
      
    } catch (error) {
      console.error('Enhanced knowledge search error:', error);
      callback({
        text: `I encountered an error while searching my knowledge base: ${error.message}. Please try rephrasing your question.`,
        action: 'ENHANCED_KNOWLEDGE_SEARCH',
      });
    }
  },
  examples: [
    [
      {
        name: '{{user1}}',
        content: {
          text: 'Tell me about Bitcoin treasury strategies',
        },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Based on my knowledge base search, here\'s what I found about "Bitcoin treasury strategies":\n\n**Primary Information (95% relevance):**\nBitcoin treasury strategies involve companies adopting Bitcoin as a primary treasury reserve asset. Leading examples include MicroStrategy, which has accumulated over 190,000 Bitcoin, and Tesla\'s strategic Bitcoin holdings. These strategies focus on preserving purchasing power against currency debasement...\n\n**Additional Context:**\n1. (89% relevance) Corporate treasury allocation typically ranges from 10-100% of excess cash reserves...\n2. (84% relevance) Risk management includes dollar-cost averaging and strategic timing of purchases...\n\n*Sources: microstrategy-analysis.md, bitcoin-treasury-strategies.md, corporate-bitcoin-adoption.md*\n\nWould you like me to elaborate on any specific aspect or search for related topics?',
          action: 'ENHANCED_KNOWLEDGE_SEARCH',
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: 'How does luxury lifestyle connect with Bitcoin wealth?',
        },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Based on my knowledge base search, here\'s what I found about "luxury lifestyle and Bitcoin wealth":\n\n**Primary Information (92% relevance):**\nBitcoin wealth enables a sovereign luxury lifestyle through geographic arbitrage and premium experiences. Bitcoin holders can leverage their appreciating asset to access luxury real estate, private aviation, and exclusive travel experiences while maintaining their core Bitcoin holdings...\n\n**Additional Context:**\n1. (87% relevance) Bitcoin-backed loans allow luxury purchases without selling Bitcoin...\n2. (82% relevance) Geographic arbitrage strategies optimize cost of living in luxury destinations...\n\n*Sources: bitcoin-luxury-lifestyle.md, sovereign-living.md, geographic-arbitrage.md*\n\nWould you like me to elaborate on any specific aspect or search for related topics?',
          action: 'ENHANCED_KNOWLEDGE_SEARCH',
        },
      },
    ],
  ] as ActionExample[][],
}; 