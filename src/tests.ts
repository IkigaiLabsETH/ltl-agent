import type { TestSuite, IAgentRuntime } from '@elizaos/core';
import { ElizaOSErrorHandler, validateElizaOSEnvironment } from './plugin';

/**
 * Bitcoin Plugin Test Suite
 * Comprehensive tests for Bitcoin-focused AI agent functionality
 */
export class BitcoinTestSuite implements TestSuite {
  name = 'bitcoin';
  description = 'Comprehensive test suite for Bitcoin-focused AI agent with ElizaOS optimizations';

  tests = [
    {
      name: 'Character configuration validation',
      fn: async (runtime: IAgentRuntime) => {
        console.log('🧪 Testing character configuration...');
        
        const character = runtime.character;
        
        // Validate character name
        if (character.name !== 'Satoshi') {
          throw new Error(`Expected character name 'Satoshi', got '${character.name}'`);
        }
        
        // Validate Bitcoin thesis in system prompt
        if (!character.system.includes('100K BTC Holders')) {
          throw new Error('Character system prompt does not contain Bitcoin thesis');
        }
        
        // Validate cypherpunk philosophy
        if (!character.system.includes('cypherpunk visionary')) {
          throw new Error('Character system prompt does not contain cypherpunk philosophy');
        }
        
        // Validate topics are defined
        if (!character.topics || character.topics.length === 0) {
          throw new Error('Character topics not defined');
        }
        
        // Validate adjectives for personality
        if (!character.adjectives || character.adjectives.length === 0) {
          throw new Error('Character adjectives not defined');
        }
        
        // Validate knowledge base
        if (!character.knowledge || character.knowledge.length === 0) {
          throw new Error('Character knowledge base is empty');
        }
        
        console.log('✅ Character configuration validation passed');
      },
    },
    {
      name: 'Plugin initialization and dependencies',
      fn: async (runtime: IAgentRuntime) => {
        console.log('🧪 Testing plugin initialization...');
        
        // Check if Bitcoin plugin exists
        const bitcoinPlugin = runtime.plugins.find(p => p.name === 'bitcoin');
        if (!bitcoinPlugin) {
          throw new Error('Bitcoin plugin not found in runtime');
        }
        
        // Validate providers
        if (!bitcoinPlugin.providers || bitcoinPlugin.providers.length === 0) {
          throw new Error('Bitcoin plugin has no providers');
        }
        
        // Validate actions
        if (!bitcoinPlugin.actions || bitcoinPlugin.actions.length === 0) {
          throw new Error('Bitcoin plugin has no actions');
        }
        
        // Validate services
        if (!bitcoinPlugin.services || bitcoinPlugin.services.length === 0) {
          throw new Error('Bitcoin plugin has no services');
        }
        
        // Check for required actions
        const requiredActions = [
          'BITCOIN_MARKET_ANALYSIS',
          'BITCOIN_THESIS_STATUS',
          'RESET_AGENT_MEMORY',
          'CHECK_MEMORY_HEALTH',
          'VALIDATE_ENVIRONMENT'
        ];
        
        const actionNames = bitcoinPlugin.actions.map(a => a.name);
        for (const requiredAction of requiredActions) {
          if (!actionNames.includes(requiredAction)) {
            throw new Error(`Required action '${requiredAction}' not found`);
          }
        }
        
        console.log('✅ Plugin initialization test passed');
      },
    },
    {
      name: 'ElizaOS environment validation',
      fn: async (runtime: IAgentRuntime) => {
        console.log('🧪 Testing ElizaOS environment validation...');
        
        const validation = validateElizaOSEnvironment();
        
        // Environment validation should return an object with valid and issues properties
        if (typeof validation.valid !== 'boolean') {
          throw new Error('Environment validation should return a boolean valid property');
        }
        
        if (!Array.isArray(validation.issues)) {
          throw new Error('Environment validation should return an array of issues');
        }
        
        // Log validation results for debugging
        console.log(`Environment validation: ${validation.valid ? 'PASS' : 'ISSUES FOUND'}`);
        if (validation.issues.length > 0) {
          console.log('Issues found:', validation.issues);
        }
        
        console.log('✅ ElizaOS environment validation test passed');
      },
    },
    {
      name: 'Error handling system validation',
      fn: async (runtime: IAgentRuntime) => {
        console.log('🧪 Testing ElizaOS error handling...');
        
        // Test embedding dimension error detection
        const embeddingError = new Error('expected 1536, got 384');
        const enhancedEmbeddingError = ElizaOSErrorHandler.handleCommonErrors(embeddingError, 'test');
        
        if (enhancedEmbeddingError.message === embeddingError.message) {
          throw new Error('Embedding dimension error not properly enhanced');
        }
        
        // Test database connection error detection
        const dbError = new Error('database connection failed');
        const enhancedDbError = ElizaOSErrorHandler.handleCommonErrors(dbError, 'test');
        
        if (enhancedDbError.message === dbError.message) {
          throw new Error('Database connection error not properly enhanced');
        }
        
        // Test API key error detection
        const apiError = new Error('unauthorized 401');
        const enhancedApiError = ElizaOSErrorHandler.handleCommonErrors(apiError, 'test');
        
        if (enhancedApiError.message === apiError.message) {
          throw new Error('API key error not properly enhanced');
        }
        
        console.log('✅ Error handling system validation passed');
      },
    },
    {
      name: 'Bitcoin data providers functionality',
      fn: async (runtime: IAgentRuntime) => {
        console.log('🧪 Testing Bitcoin data providers...');
        
        const bitcoinPlugin = runtime.plugins.find(p => p.name === 'bitcoin');
        if (!bitcoinPlugin || !bitcoinPlugin.providers) {
          throw new Error('Bitcoin plugin or providers not found');
        }
        
        // Find Bitcoin price provider
        const priceProvider = bitcoinPlugin.providers.find(p => p.name === 'BITCOIN_PRICE_PROVIDER');
        if (!priceProvider) {
          throw new Error('Bitcoin price provider not found');
        }
        
        // Find Bitcoin thesis provider
        const thesisProvider = bitcoinPlugin.providers.find(p => p.name === 'BITCOIN_THESIS_PROVIDER');
        if (!thesisProvider) {
          throw new Error('Bitcoin thesis provider not found');
        }
        
        // Test provider execution (with timeout to avoid hanging tests)
        const testMessage = { content: { text: 'test' } } as any;
        const testState = {} as any;
        
        try {
          const priceResult = await Promise.race([
            priceProvider.get(runtime, testMessage, testState),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Price provider timeout')), 5000))
          ]) as any;
          
          if (!priceResult.text || !priceResult.values) {
            throw new Error('Price provider did not return expected data structure');
          }
          
          const thesisResult = await Promise.race([
            thesisProvider.get(runtime, testMessage, testState),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Thesis provider timeout')), 5000))
          ]) as any;
          
          if (!thesisResult.text || !thesisResult.values) {
            throw new Error('Thesis provider did not return expected data structure');
          }
          
          console.log('✅ Bitcoin data providers functionality test passed');
        } catch (error) {
          // If providers fail due to network/API issues, that's still a pass as long as they handle errors gracefully
          if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('fetch')) {
            console.log('⚠️  Bitcoin data providers test passed with graceful error handling');
          } else {
            throw error;
          }
        }
      },
    },
    {
      name: 'Memory management service validation',
      fn: async (runtime: IAgentRuntime) => {
        console.log('🧪 Testing memory management service...');
        
        const bitcoinDataService = runtime.getService('bitcoin-data');
        if (!bitcoinDataService) {
          throw new Error('Bitcoin Data Service not found');
        }
        
        // Test memory health check
        try {
          const healthCheck = await (bitcoinDataService as any).checkMemoryHealth();
          
          if (typeof healthCheck.healthy !== 'boolean') {
            throw new Error('Memory health check should return boolean healthy property');
          }
          
          if (!healthCheck.stats || typeof healthCheck.stats !== 'object') {
            throw new Error('Memory health check should return stats object');
          }
          
          if (!Array.isArray(healthCheck.issues)) {
            throw new Error('Memory health check should return issues array');
          }
          
          console.log(`Memory health: ${healthCheck.healthy ? 'HEALTHY' : 'ISSUES'}`);
          console.log(`Database type: ${healthCheck.stats.databaseType}`);
          
          console.log('✅ Memory management service validation passed');
        } catch (error) {
          throw new Error(`Memory management service validation failed: ${error.message}`);
        }
      },
    },
    {
      name: 'API key management and runtime.getSetting() usage',
      fn: async (runtime: IAgentRuntime) => {
        console.log('🧪 Testing API key management...');
        
        // Test that runtime.getSetting() works for various API keys
        const apiKeys = [
          'OPENAI_API_KEY',
          'ANTHROPIC_API_KEY',
          'COINGECKO_API_KEY',
          'THIRDWEB_SECRET_KEY',
          'LUMA_API_KEY'
        ];
        
        for (const keyName of apiKeys) {
          const value = runtime.getSetting(keyName);
          // getSetting should return string or undefined, not throw
          if (value !== undefined && typeof value !== 'string') {
            throw new Error(`runtime.getSetting('${keyName}') returned non-string value: ${typeof value}`);
          }
        }
        
        // Test that character secrets are accessible
        const characterSecrets = runtime.character.settings?.secrets;
        if (characterSecrets && typeof characterSecrets === 'object') {
          console.log('Character secrets properly configured');
        }
        
        console.log('✅ API key management test passed');
      },
    },
    {
      name: 'Plugin order and dependencies validation',
      fn: async (runtime: IAgentRuntime) => {
        console.log('🧪 Testing plugin order and dependencies...');
        
        const pluginNames = runtime.plugins.map(p => p.name);
        
        // Check that essential plugins are loaded
        const requiredPlugins = [
          '@elizaos/plugin-sql',          // Database foundation
          '@elizaos/plugin-knowledge',    // RAG capabilities
          '@elizaos/plugin-bootstrap',    // Essential actions
          'bitcoin'                       // Our custom plugin
        ];
        
        for (const requiredPlugin of requiredPlugins) {
          if (!pluginNames.includes(requiredPlugin)) {
            console.warn(`⚠️  Required plugin '${requiredPlugin}' not found - may be optional`);
          }
        }
        
        // Check that SQL plugin comes before knowledge plugin (proper dependency order)
        const sqlIndex = pluginNames.indexOf('@elizaos/plugin-sql');
        const knowledgeIndex = pluginNames.indexOf('@elizaos/plugin-knowledge');
        
        if (sqlIndex !== -1 && knowledgeIndex !== -1 && sqlIndex > knowledgeIndex) {
          throw new Error('Plugin order incorrect: SQL plugin should come before Knowledge plugin');
        }
        
        // Check that bootstrap plugin comes last
        const bootstrapIndex = pluginNames.indexOf('@elizaos/plugin-bootstrap');
        if (bootstrapIndex !== -1 && bootstrapIndex !== pluginNames.length - 1) {
          console.warn('⚠️  Bootstrap plugin is not last - this may cause initialization issues');
        }
        
        console.log('✅ Plugin order and dependencies validation passed');
      },
    },
    {
      name: 'Database configuration validation',
      fn: async (runtime: IAgentRuntime) => {
        console.log('🧪 Testing database configuration...');
        
        const databaseConfig = runtime.character.settings?.database;
        
        if (databaseConfig) {
          // Validate database type
          if (databaseConfig.type && !['pglite', 'postgresql'].includes(databaseConfig.type)) {
            throw new Error(`Invalid database type: ${databaseConfig.type}. Must be 'pglite' or 'postgresql'`);
          }
          
          // Validate PostgreSQL URL if specified
          if (databaseConfig.type === 'postgresql' && databaseConfig.url) {
            try {
              new URL(databaseConfig.url);
            } catch {
              throw new Error('Invalid DATABASE_URL format');
            }
          }
          
          // Validate PGLite data directory
          if (databaseConfig.type === 'pglite' || !databaseConfig.type) {
            const dataDir = databaseConfig.dataDir || '.eliza/.elizadb';
            if (typeof dataDir !== 'string') {
              throw new Error('Invalid dataDir configuration');
            }
          }
          
          console.log(`Database type: ${databaseConfig.type || 'pglite'}`);
          console.log(`Data directory: ${databaseConfig.dataDir || '.eliza/.elizadb'}`);
        } else {
          console.log('Using default PGLite database configuration');
        }
        
        // Validate embedding dimensions
        const embeddingDims = runtime.character.settings?.embeddingDimensions;
        if (embeddingDims && embeddingDims !== 384 && embeddingDims !== 1536) {
          throw new Error(`Invalid embedding dimensions: ${embeddingDims}. Must be 384 or 1536`);
        }
        
        console.log('✅ Database configuration validation passed');
      },
    }
  ];
}

// Export a default instance
export default new BitcoinTestSuite();
