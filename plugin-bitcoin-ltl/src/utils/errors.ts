/**
 * Custom error types for better error handling
 */
export class BitcoinDataError extends Error {
  constructor(message: string, public readonly code: string, public readonly retryable: boolean = false) {
    super(message);
    this.name = 'BitcoinDataError';
  }
}

export class RateLimitError extends BitcoinDataError {
  constructor(message: string) {
    super(message, 'RATE_LIMIT', true);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends BitcoinDataError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', true);
    this.name = 'NetworkError';
  }
}

/**
 * ElizaOS-specific error handling for common framework issues
 */
export class ElizaOSError extends Error {
  constructor(message: string, public readonly code: string, public readonly resolution?: string) {
    super(message);
    this.name = 'ElizaOSError';
  }
}

export class EmbeddingDimensionError extends ElizaOSError {
  constructor(expected: number, actual: number) {
    super(
      `Embedding dimension mismatch: expected ${expected}, got ${actual}`,
      'EMBEDDING_DIMENSION_MISMATCH',
      `Set OPENAI_EMBEDDING_DIMENSIONS=${expected} in .env and reset agent memory by deleting .eliza/.elizadb folder`
    );
  }
}

export class DatabaseConnectionError extends ElizaOSError {
  constructor(originalError: Error) {
    super(
      `Database connection failed: ${originalError.message}`,
      'DATABASE_CONNECTION_ERROR',
      'For PGLite: delete .eliza/.elizadb folder. For PostgreSQL: verify DATABASE_URL and server status'
    );
  }
}

export class PortInUseError extends ElizaOSError {
  constructor(port: number) {
    super(
      `Port ${port} is already in use`,
      'PORT_IN_USE',
      `Try: elizaos start --port ${port + 1} or kill the process using port ${port}`
    );
  }
}

export class MissingAPIKeyError extends ElizaOSError {
  constructor(keyName: string, pluginName?: string) {
    super(
      `Missing API key: ${keyName}${pluginName ? ` required for ${pluginName}` : ''}`,
      'MISSING_API_KEY',
      `Add ${keyName}=your_key_here to .env file or use: elizaos env edit-local`
    );
  }
} 