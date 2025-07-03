import type { TestSuite, IAgentRuntime } from '@elizaos/core';

/**
 * Bitcoin Plugin Test Suite
 * Comprehensive tests for Bitcoin-focused AI agent functionality
 */
export class BitcoinTestSuite implements TestSuite {
  name = 'bitcoin';
  description = 'Tests for the Bitcoin-focused AI agent';

  tests = [
    {
      name: 'Bitcoin character configuration test',
      fn: async (runtime: IAgentRuntime) => {
        const character = runtime.character;
        
        if (!character) {
          throw new Error('Character not found');
        }
        
        if (character.name !== 'BitcoinExpert') {
          throw new Error(`Expected character name 'BitcoinExpert', got '${character.name}'`);
        }
        
        if (!character.system.includes('100K BTC Holders')) {
          throw new Error('Character system prompt does not contain Bitcoin thesis');
        }
        
                 const bioText = Array.isArray(character.bio) ? character.bio.join(' ') : character.bio;
         if (!bioText.includes('Bitcoin analyst')) {
           throw new Error('Character bio does not contain Bitcoin analyst description');
         }
        
        console.log('✅ Bitcoin character configuration test passed');
      },
    },
    {
      name: 'Bitcoin plugin initialization test',
      fn: async (runtime: IAgentRuntime) => {
        const bitcoinPlugin = runtime.plugins.find(p => p.name === 'bitcoin');
        
        if (!bitcoinPlugin) {
          throw new Error('Bitcoin plugin not found');
        }
        
        if (!bitcoinPlugin.providers || bitcoinPlugin.providers.length === 0) {
          throw new Error('Bitcoin plugin has no providers');
        }
        
        if (!bitcoinPlugin.actions || bitcoinPlugin.actions.length === 0) {
          throw new Error('Bitcoin plugin has no actions');
        }
        
        console.log('✅ Bitcoin plugin initialization test passed');
      },
    },
    {
      name: 'Bitcoin price provider test',
      fn: async (runtime: IAgentRuntime) => {
        const bitcoinPlugin = runtime.plugins.find(p => p.name === 'bitcoin');
        if (!bitcoinPlugin) {
          throw new Error('Bitcoin plugin not found');
        }
        
        const priceProvider = bitcoinPlugin.providers.find(p => p.name === 'BITCOIN_PRICE_PROVIDER');
        if (!priceProvider) {
          throw new Error('Bitcoin price provider not found');
        }
        
        console.log('✅ Bitcoin price provider test passed');
      },
    },
    {
      name: 'Bitcoin thesis provider test',
      fn: async (runtime: IAgentRuntime) => {
        const bitcoinPlugin = runtime.plugins.find(p => p.name === 'bitcoin');
        if (!bitcoinPlugin) {
          throw new Error('Bitcoin plugin not found');
        }
        
        const thesisProvider = bitcoinPlugin.providers.find(p => p.name === 'BITCOIN_THESIS_PROVIDER');
        if (!thesisProvider) {
          throw new Error('Bitcoin thesis provider not found');
        }
        
        console.log('✅ Bitcoin thesis provider test passed');
      },
    },
    {
      name: 'Bitcoin market analysis action test',
      fn: async (runtime: IAgentRuntime) => {
        const bitcoinPlugin = runtime.plugins.find(p => p.name === 'bitcoin');
        if (!bitcoinPlugin) {
          throw new Error('Bitcoin plugin not found');
        }
        
        const analysisAction = bitcoinPlugin.actions.find(a => a.name === 'BITCOIN_MARKET_ANALYSIS');
        if (!analysisAction) {
          throw new Error('Bitcoin market analysis action not found');
        }
        
        console.log('✅ Bitcoin market analysis action test passed');
      },
    },
    {
      name: 'Bitcoin thesis status action test',
      fn: async (runtime: IAgentRuntime) => {
        const bitcoinPlugin = runtime.plugins.find(p => p.name === 'bitcoin');
        if (!bitcoinPlugin) {
          throw new Error('Bitcoin plugin not found');
        }
        
        const statusAction = bitcoinPlugin.actions.find(a => a.name === 'BITCOIN_THESIS_STATUS');
        if (!statusAction) {
          throw new Error('Bitcoin thesis status action not found');
        }
        
        console.log('✅ Bitcoin thesis status action test passed');
      },
    },
    {
      name: 'Bitcoin data service test',
      fn: async (runtime: IAgentRuntime) => {
        const service = runtime.getService('bitcoin-data');
        
        if (!service) {
          throw new Error('Bitcoin data service not found');
        }
        
        if (!service.capabilityDescription.includes('Bitcoin')) {
          throw new Error('Service capability description does not mention Bitcoin');
        }
        
        console.log('✅ Bitcoin data service test passed');
      },
    },
  ];
}

// Export a default instance
export default new BitcoinTestSuite();
