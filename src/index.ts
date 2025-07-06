/**
 * LTL Agent Project - ElizaOS Project Configuration
 * 
 * This is the main entry point for the LTL Agent project.
 * All actual functionality is contained in the plugin-bitcoin-ltl folder.
 * 
 * Structure:
 * - plugin-bitcoin-ltl/src/ - Contains all actions, services, providers, and plugin logic
 * - src/index.ts - Re-exports character and projectAgent for ElizaOS
 * - src/plugin.ts - Re-exports the main plugin for compatibility
 * 
 * The Satoshi character is defined in plugin-bitcoin-ltl/src/index.ts
 * and includes comprehensive Bitcoin analysis, thesis tracking, and sovereign living features.
 */
import type { Project } from '@elizaos/core';

// ESM-compatible dynamic import for both prod (built JS) and dev (TS) modes
async function loadProject() {
  let character, projectAgent;
  try {
    // Try to import the built JS (prod)
    const mod = await import('../plugin-bitcoin-ltl/dist/index.js');
    character = mod.character;
    projectAgent = mod.projectAgent;
  } catch (e) {
    // Fallback to TS source (dev)
    const mod = await import('../plugin-bitcoin-ltl/src/index.js');
    character = mod.character;
    projectAgent = mod.projectAgent;
  }
  // Re-export the Satoshi character and project agent
  return {
    character,
    projectAgent,
    default: { agents: [projectAgent] } as Project,
  };
}

// Export as a promise for ESM environments
export default (await loadProject()).default;
export const character = (await loadProject()).character;
export const projectAgent = (await loadProject()).projectAgent;
