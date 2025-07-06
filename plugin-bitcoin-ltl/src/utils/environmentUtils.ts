/**
 * Environment validation for ElizaOS requirements
 */
export function validateElizaOSEnvironment(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check Node.js version (ElizaOS requires Node.js 23+)
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 23) {
    issues.push(`Node.js ${majorVersion} detected, ElizaOS requires Node.js 23+. Use: nvm install 23 && nvm use 23`);
  }
  
  // Check for required API keys based on plugins
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    issues.push('No LLM API key found. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env');
  }
  
  // Check embedding dimensions configuration
  const embeddingDims = process.env.OPENAI_EMBEDDING_DIMENSIONS;
  if (embeddingDims && (parseInt(embeddingDims) !== 384 && parseInt(embeddingDims) !== 1536)) {
    issues.push('OPENAI_EMBEDDING_DIMENSIONS must be 384 or 1536');
  }
  
  // Check database configuration
  if (process.env.DATABASE_URL) {
    try {
      new URL(process.env.DATABASE_URL);
    } catch {
      issues.push('Invalid DATABASE_URL format');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
} 