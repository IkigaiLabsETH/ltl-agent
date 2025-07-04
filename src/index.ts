/**
 * Satoshi Agent Project - ElizaOS Project Configuration
 */
import type { Project } from '@elizaos/core';
import project, { character, projectAgent } from '../plugin-bitcoin-ltl/src/index';

// Re-export individual components
export { character, projectAgent };

// Export the project with proper typing
const satoshiProject: Project = project;

// Default export for ElizaOS project detection
export default satoshiProject; 