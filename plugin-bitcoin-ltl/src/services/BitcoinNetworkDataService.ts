import { Service, IAgentRuntime } from "@elizaos/core";

export class BitcoinNetworkDataService extends Service {
  static serviceType = "bitcoin-network-data";
  capabilityDescription = "Provides Bitcoin network health and metrics";

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  async stop(): Promise<void> {
    // No-op for now
  }

  public async getNetworkHealth() {
    // TODO: Implement real logic
    return null;
  }
  // Add methods as needed
} 