import { describe, expect, it } from 'vitest';
import plugin from '../plugin-bitcoin-ltl/src/plugin';

describe('Plugin Events', () => {

  it('should have events defined', () => {
    expect(plugin.events).toBeDefined();
    if (plugin.events) {
      expect(Object.keys(plugin.events).length).toBeGreaterThan(0);
    }
  });

  it('should handle MESSAGE_RECEIVED event', async () => {
    if (plugin.events && plugin.events.MESSAGE_RECEIVED) {
      expect(Array.isArray(plugin.events.MESSAGE_RECEIVED)).toBe(true);
      expect(plugin.events.MESSAGE_RECEIVED.length).toBeGreaterThan(0);

      const messageHandler = plugin.events.MESSAGE_RECEIVED[0];
      expect(typeof messageHandler).toBe('function');

      // Use any type to bypass strict type checking for testing
      const mockParams: any = {
        message: {
          id: 'test-id',
          content: { text: 'Hello!' },
        },
        source: 'test',
        runtime: {},
      };

      // Call the event handler
      await messageHandler(mockParams);

      // If we reach here without error, the event handler works
      expect(true).toBe(true);
    }
  });

  it('should handle VOICE_MESSAGE_RECEIVED event', async () => {
    if (plugin.events && plugin.events.VOICE_MESSAGE_RECEIVED) {
      expect(Array.isArray(plugin.events.VOICE_MESSAGE_RECEIVED)).toBe(true);
      expect(plugin.events.VOICE_MESSAGE_RECEIVED.length).toBeGreaterThan(0);

      const voiceHandler = plugin.events.VOICE_MESSAGE_RECEIVED[0];
      expect(typeof voiceHandler).toBe('function');

      // Use any type to bypass strict type checking for testing
      const mockParams: any = {
        message: {
          id: 'test-id',
          content: { text: 'Voice message!' },
        },
        source: 'test',
        runtime: {},
      };

      // Call the event handler
      await voiceHandler(mockParams);

      // If we reach here without error, the event handler works
      expect(true).toBe(true);
    }
  });

  it('should handle WORLD_CONNECTED event', async () => {
    if (plugin.events && plugin.events.WORLD_CONNECTED) {
      expect(Array.isArray(plugin.events.WORLD_CONNECTED)).toBe(true);
      expect(plugin.events.WORLD_CONNECTED.length).toBeGreaterThan(0);

      const connectedHandler = plugin.events.WORLD_CONNECTED[0];
      expect(typeof connectedHandler).toBe('function');

      // Create a mock runtime with required methods for our patch
      const mockRuntime = {
        agentId: 'test-agent-id',
        getWorld: async (id: string) => null, // Return null to simulate world not found
        ensureWorldExists: async (params: any) => {
          // Mock implementation - just return the world ID
          return params.id;
        },
      };

      // Use any type to bypass strict type checking for testing
      const mockParams: any = {
        world: {
          id: 'test-world-id',
          name: 'Test World',
        },
        rooms: [],
        entities: [],
        source: 'test',
        runtime: mockRuntime,
      };

      // Call the event handler
      await connectedHandler(mockParams);

      // If we reach here without error, the event handler works
      expect(true).toBe(true);
    }
  });

  it('should handle WORLD_JOINED event', async () => {
    if (plugin.events && plugin.events.WORLD_JOINED) {
      expect(Array.isArray(plugin.events.WORLD_JOINED)).toBe(true);
      expect(plugin.events.WORLD_JOINED.length).toBeGreaterThan(0);

      const joinedHandler = plugin.events.WORLD_JOINED[0];
      expect(typeof joinedHandler).toBe('function');

      // Create a mock runtime with required methods for our patch
      const mockRuntime = {
        agentId: 'test-agent-id',
        getWorld: async (id: string) => null, // Return null to simulate world not found
        ensureWorldExists: async (params: any) => {
          // Mock implementation - just return the world ID
          return params.id;
        },
        getEntityById: async (id: string) => null, // Return null to simulate entity not found
        createEntity: async (params: any) => {
          // Mock implementation - just return true
          return true;
        },
      };

      // Use any type to bypass strict type checking for testing
      const mockParams: any = {
        world: {
          id: 'test-world-id',
          name: 'Test World',
        },
        entity: {
          id: 'test-entity-id',
          name: 'Test Entity',
        },
        rooms: [],
        entities: [],
        source: 'test',
        runtime: mockRuntime,
      };

      // Call the event handler
      await joinedHandler(mockParams);

      // If we reach here without error, the event handler works
      expect(true).toBe(true);
    }
  });
});
