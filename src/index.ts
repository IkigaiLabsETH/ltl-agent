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
import { character, projectAgent } from '../plugin-bitcoin-ltl/src/index';

// Re-export the Satoshi character and project agent
export { character, projectAgent };

// Create the project using the Satoshi character
const project: Project = {
  agents: [projectAgent],
};

// Default export for ElizaOS project detection
export default project;
