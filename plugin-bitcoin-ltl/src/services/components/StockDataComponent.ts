import { IAgentRuntime } from "@elizaos/core";
import { BaseDataComponent } from "./BaseDataComponent";

/**
 * Component responsible for stock market data
 * Extracted from StockDataService for better modularity
 */
export class StockDataComponent extends BaseDataComponent {
  private stockData: Map<string, any> = new Map();
  private marketOverview: any = null;

  constructor(runtime: IAgentRuntime) {
    super(runtime, "StockDataComponent");
  }

  protected async doInitialize(): Promise<void> {
    this.contextLogger.info("Initializing stock data connections...");
    // TODO: Initialize stock market API connections
  }

  protected async doStop(): Promise<void> {
    this.contextLogger.info("Stopping stock data connections...");
    this.stockData.clear();
  }

  protected async doUpdate(): Promise<void> {
    await Promise.all([
      this.updateStockData(),
      this.updateMarketOverview()
    ]);
  }

  protected async doHealthCheck(): Promise<boolean> {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes for stock data
    
    return this.lastUpdateTime && 
           (now - this.lastUpdateTime.getTime()) < maxAge &&
           this.stockData.size > 0;
  }

  // Public API methods
  async getStockData(symbols: string[]): Promise<any[]> {
    const results = [];
    for (const symbol of symbols) {
      const data = this.stockData.get(symbol);
      if (data) {
        results.push(data);
      }
    }
    return results;
  }

  async getMarketOverview(): Promise<any> {
    return this.marketOverview;
  }

  // Private update methods
  private async updateStockData(): Promise<void> {
    try {
      // TODO: Fetch stock data from API
      // For now, store placeholder data
      const symbols = ['MSTR', 'COIN', 'NVDA', 'TSLA', 'MARA', 'RIOT'];
      for (const symbol of symbols) {
        this.stockData.set(symbol, { symbol, price: 0, change: 0 });
      }
      this.contextLogger.debug("Stock data updated");
    } catch (error) {
      this.contextLogger.error("Failed to update stock data:", error);
      throw error;
    }
  }

  private async updateMarketOverview(): Promise<void> {
    try {
      // TODO: Fetch market overview from API
      this.marketOverview = {
        sp500: { value: 0, change: 0 },
        nasdaq: { value: 0, change: 0 },
        dow: { value: 0, change: 0 }
      };
      this.contextLogger.debug("Market overview updated");
    } catch (error) {
      this.contextLogger.error("Failed to update market overview:", error);
      throw error;
    }
  }
} 