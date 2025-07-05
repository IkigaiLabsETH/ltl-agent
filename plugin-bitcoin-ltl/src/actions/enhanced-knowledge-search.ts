import {
  Action,
  IAgentRuntime,
  Memory,
  ModelType,
  State,
} from '@elizaos/core';

export const enhancedKnowledgeSearchAction: Action = {
  name: 'ENHANCED_KNOWLEDGE_SEARCH',
  similes: ['SEARCH_KNOWLEDGE', 'FIND_INFORMATION', 'KNOWLEDGE_QUERY'],
  description: 'Enhanced knowledge search with semantic understanding and context-aware results',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content?.text?.toLowerCase() || '';
    return (
      text.includes('search') ||
      text.includes('find') ||
      text.includes('knowledge') ||
      text.includes('information') ||
      text.includes('what do you know about') ||
      text.includes('tell me about')
    );
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: any
  ) => {
    try {
      const query = message.content?.text || '';
      
      // Use the correct service name
      const digestService = runtime.getService('knowledge-digest');
      
      if (!digestService) {
        console.warn('Knowledge digest service not available');
        if (callback) {
          await callback({
            thought: 'The knowledge digest service is not available, so I cannot perform an enhanced search.',
            text: "I'm sorry, but the knowledge search service is currently unavailable. I can still help you with general questions about Bitcoin, investments, and lifestyle topics.",
            actions: ['REPLY'],
          });
        }
        return false;
      }

      // Generate embedding for the query
      const embedding = await runtime.useModel(ModelType.TEXT_EMBEDDING, {
        text: query,
      });

      if (!embedding || embedding.length === 0) {
        console.warn('Failed to generate embedding for query:', query);
        if (callback) {
          await callback({
            thought: 'Failed to generate embedding for the search query.',
            text: "I'm having trouble processing your search request. Could you try rephrasing your question?",
            actions: ['REPLY'],
          });
        }
        return false;
      }

      // Search memories using the runtime's searchMemories method
      const searchResults = await runtime.searchMemories({
        tableName: 'knowledge',
        embedding: embedding,
        query: query,
        count: 5,
        match_threshold: 0.7,
        roomId: message.roomId,
      });

      if (!searchResults || searchResults.length === 0) {
        if (callback) {
          await callback({
            thought: 'No relevant knowledge found for the search query.',
            text: `I searched my knowledge base for information about "${query}" but didn't find any relevant results. This could mean:\n\n1. The topic isn't covered in my knowledge base yet\n2. You might want to try different keywords\n3. The information might be stored under a different topic\n\nWould you like me to help you with a broader search or suggest related topics?`,
            actions: ['REPLY'],
          });
        }
        return true;
      }

      // Format the results
      let response = `## Knowledge Search Results for: "${query}"\n\n`;
      
      for (let i = 0; i < Math.min(searchResults.length, 3); i++) {
        const result = searchResults[i];
        const content = result.content?.text || 'No content available';
        const snippet = content.length > 300 ? content.substring(0, 300) + '...' : content;
        
        response += `### Result ${i + 1}\n`;
        response += `**Source:** ${result.metadata?.source || 'Knowledge Base'}\n`;
        response += `**Relevance:** ${((result.similarity || 0) * 100).toFixed(1)}%\n`;
        response += `**Content:** ${snippet}\n\n`;
      }

      if (searchResults.length > 3) {
        response += `*... and ${searchResults.length - 3} more results found.*\n\n`;
      }

      response += `**Search completed successfully!** I found ${searchResults.length} relevant pieces of information.`;

      if (callback) {
        await callback({
          thought: `Successfully performed enhanced knowledge search for "${query}" and found ${searchResults.length} relevant results.`,
          text: response,
          actions: ['ENHANCED_KNOWLEDGE_SEARCH'],
        });
      }

      return true;
    } catch (error) {
      console.error('Enhanced knowledge search error:', error);
      
      if (callback) {
        await callback({
          thought: 'An error occurred during the enhanced knowledge search.',
          text: "I encountered an error while searching my knowledge base. This might be a temporary issue. Could you try again in a moment?",
          actions: ['REPLY'],
        });
      }
      
      return false;
    }
  },
  examples: [
    [
      {
        name: '{{name1}}',
        content: { text: 'Search for information about Bitcoin mining' },
      },
      {
        name: '{{name2}}',
        content: {
          text: '## Knowledge Search Results for: "Bitcoin mining"\n\n### Result 1\n**Source:** Bitcoin Mining Guide\n**Relevance:** 95.2%\n**Content:** Bitcoin mining is the process of validating transactions and adding them to the blockchain...\n\n**Search completed successfully!** I found 3 relevant pieces of information.',
          actions: ['ENHANCED_KNOWLEDGE_SEARCH'],
        },
      },
    ],
  ],
}; 