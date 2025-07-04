import { describe, expect, it, vi, beforeEach, assert } from 'vitest';
import { BitcoinTestSuite } from '../plugin-bitcoin-ltl/src/tests';
import { v4 as uuidv4 } from 'uuid';

// Mock runtime
const createMockRuntime = () => {
  return {
    character: {
      name: 'Satoshi',
      description: 'Bitcoin-native AI agent',
      system: 'You are Satoshi, a cypherpunk visionary focused on the 100K BTC Holders thesis and Bitcoin adoption.',
      topics: ['bitcoin', 'cryptocurrency', 'freedom'],
      adjectives: ['analytical', 'visionary', 'libertarian'],
      knowledge: ['Bitcoin fundamentals', 'Economic theory', 'Cypherpunk philosophy'],
      settings: { ragKnowledge: true },
    },
    plugins: [
      {
        name: 'bitcoin-ltl',
        description: 'Bitcoin LTL plugin for Eliza',
        actions: [
          {
            name: 'HELLO_WORLD',
            handler: vi
              .fn()
              .mockImplementation(async (_runtime, _message, _state, _options, callback) => {
                await callback({
                  text: 'hello world!',
                  actions: ['HELLO_WORLD'],
                });
                return { text: 'hello world!', actions: ['HELLO_WORLD'] };
              }),
          },
          { name: 'BITCOIN_MARKET_ANALYSIS', handler: vi.fn() },
          { name: 'BITCOIN_THESIS_STATUS', handler: vi.fn() },
          { name: 'RESET_AGENT_MEMORY', handler: vi.fn() },
          { name: 'CHECK_MEMORY_HEALTH', handler: vi.fn() },
          { name: 'VALIDATE_ENVIRONMENT', handler: vi.fn() },
        ],
        providers: [
          {
            name: 'HELLO_WORLD_PROVIDER',
            get: vi.fn().mockResolvedValue({
              text: 'I am a provider',
              values: {},
              data: {},
            }),
          },
        ],
        services: [
          {
            name: 'bitcoin-data',
            capabilityDescription: 'Bitcoin data service',
          },
        ],
      },
    ],
    registerPlugin: vi.fn().mockResolvedValue(undefined),
    actions: [
      {
        name: 'HELLO_WORLD',
        handler: vi
          .fn()
          .mockImplementation(async (_runtime, _message, _state, _options, callback) => {
            await callback({
              text: 'hello world!',
              actions: ['HELLO_WORLD'],
            });
            return { text: 'hello world!', actions: ['HELLO_WORLD'] };
          }),
      },
    ],
    providers: [
      {
        name: 'HELLO_WORLD_PROVIDER',
        get: vi.fn().mockResolvedValue({
          text: 'I am a provider',
          values: {},
          data: {},
        }),
      },
    ],
    getService: vi.fn().mockReturnValue({
      capabilityDescription:
        'This is a bitcoin data service which is attached to the agent through the bitcoin-ltl plugin.',
      stop: vi.fn(),
    }),
    processActions: vi.fn().mockImplementation(async (_message, _responses, _state, callback) => {
      await callback({
        text: 'hello world!',
        actions: ['HELLO_WORLD'],
      });
    }),
  };
};

describe('BitcoinTestSuite', () => {
  let testSuite: BitcoinTestSuite;

  beforeEach(() => {
    testSuite = new BitcoinTestSuite();
  });

  it('should have name and description', () => {
    expect(testSuite.name).toBe('bitcoin-ltl');
    expect(testSuite.description).toBe('Tests for the Bitcoin LTL plugin');
  });

  it('should have at least one test', () => {
    expect(testSuite.tests.length).toBeGreaterThan(0);
  });

  it('should run character configuration test successfully', async () => {
    const mockRuntime = createMockRuntime();
    const characterConfigTest = testSuite.tests.find(
      (test) => test.name === 'Character configuration test'
    );

    if (characterConfigTest) {
      // This test should complete without throwing an error
      await expect(async () => {
        await characterConfigTest.fn(mockRuntime as any);
      }).not.toThrow();
    } else {
      assert.fail('Character configuration test not found');
    }
  });

  it('should run plugin initialization test successfully', async () => {
    const mockRuntime = createMockRuntime();
    const pluginInitTest = testSuite.tests.find(
      (test) => test.name === 'Plugin initialization test'
    );

    if (pluginInitTest) {
      await expect(async () => {
        await pluginInitTest.fn(mockRuntime as any);
      }).not.toThrow();
    } else {
      assert.fail('Plugin initialization test not found');
    }
  });

  it('should run hello world action test successfully', async () => {
    const mockRuntime = createMockRuntime();
    const actionTest = testSuite.tests.find((test) => test.name === 'Hello world action test');

    if (actionTest) {
      await expect(async () => {
        await actionTest.fn(mockRuntime as any);
      }).not.toThrow();
    } else {
      assert.fail('Hello world action test not found');
    }
  });

  it('should run hello world provider test successfully', async () => {
    const mockRuntime = createMockRuntime();
    const providerTest = testSuite.tests.find((test) => test.name === 'Hello world provider test');

    if (providerTest) {
      await expect(async () => {
        await providerTest.fn(mockRuntime as any);
      }).not.toThrow();
    } else {
      assert.fail('Hello world provider test not found');
    }
  });

  it('should run bitcoin data service test successfully', async () => {
    const mockRuntime = createMockRuntime();
    const serviceTest = testSuite.tests.find((test) => test.name === 'Bitcoin data service test');

    if (serviceTest) {
      await expect(async () => {
        await serviceTest.fn(mockRuntime as any);
      }).not.toThrow();
      expect(mockRuntime.getService).toHaveBeenCalledWith('bitcoin-data');
    } else {
      assert.fail('Bitcoin data service test not found');
    }
  });
});
