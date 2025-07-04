import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  tsconfig: './tsconfig.build.json',
  sourcemap: true,
  clean: true,
  format: ['esm'],
  dts: true,
  external: [
    // Core Node.js modules
    'dotenv',
    'fs',
    'path',
    'https',
    'http',
    'util',
    'crypto',
    'stream',
    'events',
    'buffer',
    'url',
    'os',
    'zlib',
    
    // Third-party modules that should not be bundled
    'zod',
    'form-data',
    'combined-stream',
    'mime-types',
    'asynckit',
    'node-fetch',
    'axios',
    
    // ElizaOS core modules
    '@elizaos/core',
    '@elizaos/plugin-sql',
    '@elizaos/plugin-openai',
    '@elizaos/plugin-anthropic',
    '@elizaos/plugin-local-ai',
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-knowledge',
    '@elizaos/plugin-discord',
    '@elizaos/plugin-slack',
    '@elizaos/plugin-twitter',
    '@elizaos/plugin-telegram',
    '@elizaos/plugin-thirdweb',
    '@elizaos/plugin-video-generation',
  ],
  noExternal: [], // Let all dependencies be external unless specifically needed
  bundle: true,
  splitting: false,
  treeshake: false, // Disable treeshaking to avoid issues with dynamic imports
});
