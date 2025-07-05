/**
 * LTL Agent Project - ElizaOS Project Configuration
 * Using the Satoshi character from plugin-bitcoin-ltl with enhanced knowledge system
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