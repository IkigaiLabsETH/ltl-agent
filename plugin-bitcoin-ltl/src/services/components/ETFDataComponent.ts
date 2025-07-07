import { IAgentRuntime } from "@elizaos/core";
import { BaseDataComponent } from "./BaseDataComponent";

/**
 * Component responsible for ETF market data
 * Extracted from ETFDataService for better modularity
 */
export class ETFDataComponent extends BaseDataComponent {
  private etfData: Map<string, any> = new Map();
  private etfFlows: any = null;

  constructor(runtime: IAgentRuntime) {
    super(runtime, "ETFDataComponent");
  }

  protected async doInitialize(): Promise<void> {
    this.contextLogger.info("Initializing ETF data connections...");
    // TODO: Initialize ETF data API connections
  }

  protected async doStop(): Promise<void> {
    this.contextLogger.info("Stopping ETF data connections...");
    this.etfData.clear();
  }

  protected async doUpdate(): Promise<void> {
    await Promise.all([
      this.updateETFData(),
      this.updateETFFlows()
    ]);
  }

  protected async doHealthCheck(): Promise<boolean> {
    const now = Date.now();
    const maxAge = 15 * 60 * 1000; // 15 minutes for ETF data
    
    return this.lastUpdateTime && 
           (now - this.lastUpdateTime.getTime()) < maxAge &&
           this.etfData.size > 0;
  }

  // Public API methods
  async getETFData(symbols: string[]): Promise<any[]> {
    const results = [];
    for (const symbol of symbols) {
      const data = this.etfData.get(symbol);
      if (data) {
        results.push(data);
      }
    }
    return results;
  }

  async getETFFlows(): Promise<any> {
    return this.etfFlows;
  }

  // Private update methods
  private async updateETFData(): Promise<void> {
    try {
      // TODO: Fetch ETF data from API
      // For now, store placeholder data for Bitcoin ETFs
      const symbols = ['IBIT', 'FBTC', 'ARKB', 'BITB', 'BTCO'];
      for (const symbol of symbols) {
        this.etfData.set(symbol, { 
          symbol, 
          price: 0, 
          change: 0, 
          volume: 0,
          aum: 0 
        });
      }
      this.contextLogger.debug("ETF data updated");
    } catch (error) {
      this.contextLogger.error("Failed to update ETF data:", error);
      throw error;
    }
  }

  private async updateETFFlows(): Promise<void> {
    try {
      // TODO: Fetch ETF flows data from API
      this.etfFlows = {
        totalInflows: 0,
        totalOutflows: 0,
        netFlows: 0,
        topInflows: [],
        topOutflows: []
      };
      this.contextLogger.debug("ETF flows updated");
    } catch (error) {
      this.contextLogger.error("Failed to update ETF flows:", error);
      throw error;
    }
  }
} 