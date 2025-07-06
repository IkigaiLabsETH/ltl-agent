import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import {
  MarketIntelligence,
  AltcoinBTCPerformance,
  ETFData,
  ETFMetrics,
  ETFHolding
} from "../types/bitcoinIntelligence";
import { ElizaOSErrorHandler, LoggerWithContext, generateCorrelationId } from "../utils";

export class MarketIntelligenceService extends BaseDataService {
  static serviceType = "market-intelligence";
  capabilityDescription = "Market intelligence service providing altcoin performance, stock correlations, macro indicators, and ETF data";

  // API endpoints
  private readonly COINGECKO_API = "https://api.coingecko.com/api/v3";
  private readonly ALPHA_VANTAGE_API = "https://www.alphavantage.co/query";
  private readonly FRED_API = "https://api.stlouisfed.org/fred/series/observations";
  private readonly YAHOO_FINANCE_API = "https://query1.finance.yahoo.com/v8/finance/chart";

  // Data storage
  private marketIntelligenceData: MarketIntelligence | null = null;
  private lastUpdateTime: Date | null = null;
  private updateInterval: number = 600; // 10 minutes default
  private isUpdating: boolean = false;

  // Tracked assets
  private readonly TRACKED_ALTCOINS = [
    'ethereum', 'binancecoin', 'solana', 'cardano', 'polkadot', 
    'chainlink', 'uniswap', 'avalanche-2', 'polygon', 'dogecoin',
    'xrp', 'sui', 'aptos', 'near', 'cosmos'
  ];

  private readonly TRACKED_STOCKS = [
    'TSLA', 'MSTR', 'COIN', 'MARA', 'RIOT', 'SQ', 'PYPL', 'NVDA', 'AAPL', 'MSFT'
  ];

  private readonly TRACKED_ETFS = [
    'IBIT', 'FBTC', 'ARKB', 'BITB', 'EZBC', 'BRRR', 'BTCO', 'DEFI', 'BITS', 'XBTF'
  ];

  constructor(runtime: IAgentRuntime) {
    super(runtime, "marketIntelligence");
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("MarketIntelligenceService starting...");
    const service = new MarketIntelligenceService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("MarketIntelligenceService stopping...");
    const service = runtime.getService("market-intelligence");
    if (service && typeof service.stop === "function") {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    logger.info("MarketIntelligenceService starting...");
    await this.updateData();
    this.startPeriodicUpdates();
    logger.info("MarketIntelligenceService started successfully");
  }

  async init() {
    logger.info("MarketIntelligenceService initialized");
    await this.updateData();
  }

  async stop() {
    logger.info("MarketIntelligenceService stopped");
  }

  // ============================================================================
  // CORE MARKET INTELLIGENCE METHODS
  // ============================================================================

  /**
   * Get comprehensive market intelligence data
   */
  async getMarketIntelligence(): Promise<MarketIntelligence | null> {
    if (!this.marketIntelligenceData || this.isDataStale()) {
      await this.updateData();
    }
    return this.marketIntelligenceData;
  }

  /**
   * Get altcoin performance vs Bitcoin
   */
  async getAltcoinPerformance(): Promise<AltcoinBTCPerformance[]> {
    const data = await this.getMarketIntelligence();
    return data?.topPerformers || [];
  }

  /**
   * Get stock market correlations
   */
  async getStockCorrelations(): Promise<{
    teslaVsBitcoin: number;
    mag7VsBitcoin: number;
    microstrategyPerformance: number;
    sp500VsBitcoin: number;
    goldVsBitcoin: number;
  }> {
    const data = await this.getMarketIntelligence();
    if (!data) return {
      teslaVsBitcoin: 0,
      mag7VsBitcoin: 0,
      microstrategyPerformance: 0,
      sp500VsBitcoin: 0,
      goldVsBitcoin: 0
    };

    return {
      teslaVsBitcoin: data.teslaVsBitcoin,
      mag7VsBitcoin: data.mag7VsBitcoin,
      microstrategyPerformance: data.microstrategyPerformance,
      sp500VsBitcoin: data.sp500VsBitcoin,
      goldVsBitcoin: data.goldVsBitcoin
    };
  }

  /**
   * Get macro economic indicators
   */
  async getMacroIndicators(): Promise<{
    dollarIndex: number;
    treasuryYields: number;
    inflationRate: number;
    fedPolicy: 'HAWKISH' | 'NEUTRAL' | 'DOVISH';
    moneySupply: number;
  }> {
    const data = await this.getMarketIntelligence();
    if (!data) return {
      dollarIndex: 0,
      treasuryYields: 0,
      inflationRate: 0,
      fedPolicy: 'NEUTRAL',
      moneySupply: 0
    };

    return {
      dollarIndex: data.dollarIndex,
      treasuryYields: data.treasuryYields,
      inflationRate: data.inflationRate,
      fedPolicy: data.fedPolicy,
      moneySupply: data.moneySupply
    };
  }

  /**
   * Get ETF flow data
   */
  async getETFFlows(): Promise<ETFData> {
    const data = await this.getMarketIntelligence();
    return data?.spotBitcoinETFs || {
      totalAUM: 0,
      dailyFlows: 0,
      weeklyFlows: 0,
      monthlyFlows: 0,
      topHolders: [],
      institutionalAdoption: 0,
      averageExpenseRatio: 0,
      totalBitcoinHeld: 0,
      percentOfSupply: 0,
      marketLeader: '',
      strongestInflow: '',
      largestOutflow: '',
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate altcoin season index
   */
  async getAltcoinSeasonIndex(): Promise<number> {
    const data = await this.getMarketIntelligence();
    return data?.altcoinSeasonIndex || 45;
  }

  /**
   * Get Bitcoin relative performance
   */
  async getBitcoinRelativePerformance(): Promise<number> {
    const data = await this.getMarketIntelligence();
    return data?.bitcoinRelativePerformance || 0;
  }

  // ============================================================================
  // DATA UPDATE METHODS
  // ============================================================================

  /**
   * Update market intelligence data
   */
  async updateData(): Promise<void> {
    if (this.isUpdating) {
      logger.warn("MarketIntelligenceService: Update already in progress");
      return;
    }

    this.isUpdating = true;
    const contextLogger = new LoggerWithContext(generateCorrelationId(), "MarketIntelligenceService");

    try {
      contextLogger.info("📈 Fetching comprehensive market intelligence data...");

      // Fetch all market data in parallel
      const [altcoinData, stockData, macroData, etfData, sentimentData] = await Promise.all([
        this.fetchAltcoinPerformance(),
        this.fetchStockCorrelations(),
        this.fetchMacroIndicators(),
        this.fetchETFData(),
        this.fetchMarketSentiment()
      ]);

      // Compile market intelligence
      this.marketIntelligenceData = {
        // Altcoin performance
        altcoinSeasonIndex: this.calculateAltcoinSeasonIndex(altcoinData),
        bitcoinRelativePerformance: this.calculateBitcoinRelativePerformance(altcoinData),
        topPerformers: altcoinData.topPerformers || [],
        underperformers: altcoinData.underperformers || [],

        // Stock correlations
        teslaVsBitcoin: stockData.teslaVsBitcoin || 0,
        mag7VsBitcoin: stockData.mag7VsBitcoin || 0,
        microstrategyPerformance: stockData.microstrategyPerformance || 0,
        sp500VsBitcoin: stockData.sp500VsBitcoin || 0,
        goldVsBitcoin: stockData.goldVsBitcoin || 0,

        // Macro indicators
        dollarIndex: macroData.dollarIndex || 0,
        treasuryYields: macroData.treasuryYields || 0,
        inflationRate: macroData.inflationRate || 0,
        fedPolicy: macroData.fedPolicy || 'NEUTRAL',
        moneySupply: macroData.moneySupply || 0,

        // ETF data
        spotBitcoinETFs: etfData,

        // Market sentiment
        fearGreedIndex: sentimentData.fearGreedIndex || 0,
        fearGreedValue: sentimentData.fearGreedValue || 'Neutral',

        lastUpdated: new Date()
      };

      this.lastUpdateTime = new Date();

      contextLogger.info("📈 Market intelligence data update complete", {
        altcoinSeasonIndex: this.marketIntelligenceData.altcoinSeasonIndex,
        bitcoinRelativePerformance: this.marketIntelligenceData.bitcoinRelativePerformance,
        etfAUM: this.marketIntelligenceData.spotBitcoinETFs.totalAUM,
        fearGreedIndex: this.marketIntelligenceData.fearGreedIndex
      });

    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, "MarketIntelligenceUpdate");
      contextLogger.error("❌ Error updating market intelligence data:", enhancedError.message);
      throw enhancedError;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Force update all market data
   */
  async forceUpdate(): Promise<MarketIntelligence | null> {
    await this.updateData();
    return this.marketIntelligenceData;
  }

  // ============================================================================
  // PRIVATE FETCH METHODS
  // ============================================================================

  /**
   * Fetch altcoin performance vs Bitcoin
   */
  private async fetchAltcoinPerformance(): Promise<{
    topPerformers: AltcoinBTCPerformance[];
    underperformers: AltcoinBTCPerformance[];
  }> {
    try {
      const contextLogger = new LoggerWithContext(generateCorrelationId(), "MarketIntelligenceService");
      contextLogger.info("🪙 Fetching altcoin performance data...");

      // Fetch Bitcoin price first for comparison
      const bitcoinPrice = await this.fetchBitcoinPrice();
      
      // Fetch altcoin data from CoinGecko
      const altcoinData = await this.fetchCoingeckoAltcoinData();
      
      // Process and categorize altcoins
      const processedAltcoins = altcoinData.map((coin: any) => ({
        symbol: coin.symbol?.toUpperCase() || '',
        name: coin.name || '',
        usdPrice: coin.current_price || 0,
        btcPrice: coin.current_price / bitcoinPrice,
        btcPerformance24h: coin.price_change_percentage_24h || 0,
        btcPerformance7d: coin.price_change_percentage_7d || 0,
        btcPerformance30d: coin.price_change_percentage_30d || 0,
        outperformingBTC: (coin.price_change_percentage_24h || 0) > 0,
        marketCapRank: coin.market_cap_rank || 0,
        volume24h: coin.total_volume || 0,
        narrative: this.getAltcoinNarrative(coin.symbol || ''),
        lastUpdated: new Date()
      }));

      // Sort by 24h performance
      const sortedAltcoins = processedAltcoins.sort((a, b) => b.btcPerformance24h - a.btcPerformance24h);
      
      const topPerformers = sortedAltcoins.slice(0, 10);
      const underperformers = sortedAltcoins.slice(-10).reverse();

      contextLogger.info(`🪙 Altcoin data processed: ${processedAltcoins.length} coins, ${topPerformers.length} top performers`);

      return { topPerformers, underperformers };
    } catch (error) {
      logger.error("Error fetching altcoin performance:", error);
      return { topPerformers: [], underperformers: [] };
    }
  }

  /**
   * Fetch stock market correlations
   */
  private async fetchStockCorrelations(): Promise<{
    teslaVsBitcoin: number;
    mag7VsBitcoin: number;
    microstrategyPerformance: number;
    sp500VsBitcoin: number;
    goldVsBitcoin: number;
  }> {
    try {
      const contextLogger = new LoggerWithContext(generateCorrelationId(), "MarketIntelligenceService");
      contextLogger.info("📊 Fetching stock market correlations...");

      // Fetch stock data from Yahoo Finance
      const [teslaData, mag7Data, microstrategyData, sp500Data, goldData] = await Promise.all([
        this.fetchStockData('TSLA'),
        this.fetchMagnificent7Data(),
        this.fetchStockData('MSTR'),
        this.fetchStockData('^GSPC'), // S&P 500
        this.fetchStockData('GC=F')  // Gold futures
      ]);

      const bitcoinPrice = await this.fetchBitcoinPrice();

      const correlations = {
        teslaVsBitcoin: this.calculateRelativePerformance(teslaData, bitcoinPrice),
        mag7VsBitcoin: this.calculateRelativePerformance(mag7Data, bitcoinPrice),
        microstrategyPerformance: this.calculateRelativePerformance(microstrategyData, bitcoinPrice),
        sp500VsBitcoin: this.calculateRelativePerformance(sp500Data, bitcoinPrice),
        goldVsBitcoin: this.calculateRelativePerformance(goldData, bitcoinPrice)
      };

      contextLogger.info("📊 Stock correlations calculated", correlations);

      return correlations;
    } catch (error) {
      logger.error("Error fetching stock correlations:", error);
      return {
        teslaVsBitcoin: 0,
        mag7VsBitcoin: 0,
        microstrategyPerformance: 0,
        sp500VsBitcoin: 0,
        goldVsBitcoin: 0
      };
    }
  }

  /**
   * Fetch macro economic indicators
   */
  private async fetchMacroIndicators(): Promise<{
    dollarIndex: number;
    treasuryYields: number;
    inflationRate: number;
    fedPolicy: 'HAWKISH' | 'NEUTRAL' | 'DOVISH';
    moneySupply: number;
  }> {
    try {
      const contextLogger = new LoggerWithContext(generateCorrelationId(), "MarketIntelligenceService");
      contextLogger.info("🌍 Fetching macro economic indicators...");

      // Fetch macro data from various sources
      const [dxyData, treasuryData, inflationData, moneySupplyData] = await Promise.all([
        this.fetchDollarIndex(),
        this.fetchTreasuryYields(),
        this.fetchInflationRate(),
        this.fetchMoneySupply()
      ]);

      const fedPolicy = this.determineFedPolicy(treasuryData, inflationData);

      const macroData = {
        dollarIndex: dxyData || 104.2, // Default value
        treasuryYields: treasuryData || 4.12, // Default value
        inflationRate: inflationData || 3.1, // Default value
        fedPolicy,
        moneySupply: moneySupplyData || 0
      };

      contextLogger.info("🌍 Macro indicators fetched", macroData);

      return macroData;
    } catch (error) {
      logger.error("Error fetching macro indicators:", error);
      return {
        dollarIndex: 104.2,
        treasuryYields: 4.12,
        inflationRate: 3.1,
        fedPolicy: 'NEUTRAL',
        moneySupply: 0
      };
    }
  }

  /**
   * Fetch ETF flow data
   */
  private async fetchETFData(): Promise<ETFData> {
    try {
      const contextLogger = new LoggerWithContext(generateCorrelationId(), "MarketIntelligenceService");
      contextLogger.info("💼 Fetching Bitcoin ETF data...");

      // Fetch ETF data from various sources
      const etfHoldings = await this.fetchETFHoldings();
      const etfFlows = await this.fetchETFFlows();

      const etfData: ETFData = {
        totalAUM: etfHoldings.totalAUM || 27400000000, // $27.4B default
        dailyFlows: etfFlows.dailyFlows || 245000000, // $245M default
        weeklyFlows: etfFlows.weeklyFlows || 0,
        monthlyFlows: etfFlows.monthlyFlows || 0,
        topHolders: etfHoldings.topHolders || ['BlackRock IBIT', 'Fidelity FBTC', 'ARKB'],
        institutionalAdoption: etfHoldings.institutionalAdoption || 26.3,
        averageExpenseRatio: etfHoldings.averageExpenseRatio || 0.25,
        totalBitcoinHeld: etfHoldings.totalBitcoinHeld || 0,
        percentOfSupply: etfHoldings.percentOfSupply || 0,
        marketLeader: etfHoldings.marketLeader || 'BlackRock IBIT',
        strongestInflow: etfFlows.strongestInflow || 'BlackRock IBIT',
        largestOutflow: etfFlows.largestOutflow || 'None',
        lastUpdated: new Date()
      };

      contextLogger.info("💼 ETF data processed", {
        totalAUM: etfData.totalAUM,
        dailyFlows: etfData.dailyFlows,
        institutionalAdoption: etfData.institutionalAdoption
      });

      return etfData;
    } catch (error) {
      logger.error("Error fetching ETF data:", error);
      return {
        totalAUM: 27400000000,
        dailyFlows: 245000000,
        weeklyFlows: 0,
        monthlyFlows: 0,
        topHolders: ['BlackRock IBIT', 'Fidelity FBTC', 'ARKB'],
        institutionalAdoption: 26.3,
        averageExpenseRatio: 0.25,
        totalBitcoinHeld: 0,
        percentOfSupply: 0,
        marketLeader: 'BlackRock IBIT',
        strongestInflow: 'BlackRock IBIT',
        largestOutflow: 'None',
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Fetch market sentiment data
   */
  private async fetchMarketSentiment(): Promise<{
    fearGreedIndex: number;
    fearGreedValue: string;
  }> {
    try {
      const contextLogger = new LoggerWithContext(generateCorrelationId(), "MarketIntelligenceService");
      contextLogger.info("😨 Fetching market sentiment data...");

      // Fetch Fear & Greed Index
      const fearGreedData = await this.fetchFearGreedIndex();

      const sentimentData = {
        fearGreedIndex: fearGreedData.index || 50,
        fearGreedValue: fearGreedData.value || 'Neutral'
      };

      contextLogger.info("😨 Sentiment data fetched", sentimentData);

      return sentimentData;
    } catch (error) {
      logger.error("Error fetching sentiment data:", error);
      return {
        fearGreedIndex: 50,
        fearGreedValue: 'Neutral'
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if data is stale and needs updating
   */
  private isDataStale(): boolean {
    if (!this.lastUpdateTime) return true;
    const now = new Date();
    const timeDiff = (now.getTime() - this.lastUpdateTime.getTime()) / 1000;
    return timeDiff > this.updateInterval;
  }

  /**
   * Start periodic data updates
   */
  private startPeriodicUpdates() {
    setInterval(async () => {
      if (!this.isUpdating) {
        await this.updateData();
      }
    }, this.updateInterval * 1000);
  }

  /**
   * Calculate altcoin season index
   */
  private calculateAltcoinSeasonIndex(altcoinData: any): number {
    if (!altcoinData.topPerformers || altcoinData.topPerformers.length === 0) {
      return 45; // Default Bitcoin-dominated
    }

    // Calculate percentage of top 100 altcoins outperforming Bitcoin
    const outperformingCount = altcoinData.topPerformers.filter((coin: AltcoinBTCPerformance) => 
      coin.outperformingBTC
    ).length;

    const totalCount = altcoinData.topPerformers.length;
    const outperformingPercentage = (outperformingCount / totalCount) * 100;

    // Altcoin season index: 0-100 scale
    // 0-25: Bitcoin-dominated
    // 26-75: Mixed
    // 76-100: Altcoin season
    return Math.min(100, Math.max(0, outperformingPercentage));
  }

  /**
   * Calculate Bitcoin relative performance
   */
  private calculateBitcoinRelativePerformance(altcoinData: any): number {
    if (!altcoinData.topPerformers || altcoinData.topPerformers.length === 0) {
      return 0;
    }

    // Calculate average performance of top altcoins vs Bitcoin
    const totalPerformance = altcoinData.topPerformers.reduce((sum: number, coin: AltcoinBTCPerformance) => 
      sum + coin.btcPerformance24h, 0
    );

    return totalPerformance / altcoinData.topPerformers.length;
  }

  /**
   * Get altcoin narrative
   */
  private getAltcoinNarrative(symbol: string): string {
    const narratives: { [key: string]: string } = {
      'ETH': 'Smart contracts and DeFi',
      'SOL': 'High-performance blockchain',
      'ADA': 'Academic research and peer review',
      'DOT': 'Interoperability and parachains',
      'LINK': 'Oracle and data feeds',
      'UNI': 'Decentralized exchange',
      'AVAX': 'Subnet architecture',
      'MATIC': 'Layer 2 scaling',
      'DOGE': 'Meme coin and community',
      'XRP': 'Cross-border payments',
      'SUI': 'Move language and parallel execution',
      'APT': 'Move language and parallel execution',
      'NEAR': 'Sharding and user experience',
      'ATOM': 'Cosmos ecosystem and IBC'
    };

    return narratives[symbol] || 'General cryptocurrency';
  }

  /**
   * Calculate relative performance
   */
  private calculateRelativePerformance(stockData: any, bitcoinPrice: number): number {
    if (!stockData || !stockData.price || !bitcoinPrice) {
      return 0;
    }

    // Calculate percentage difference
    const stockPrice = stockData.price;
    const bitcoinPriceUSD = bitcoinPrice;
    
    // Assuming we're comparing YTD performance
    // This is a simplified calculation
    return ((stockPrice - bitcoinPriceUSD) / bitcoinPriceUSD) * 100;
  }

  /**
   * Determine Fed policy based on economic indicators
   */
  private determineFedPolicy(treasuryYields: number, inflationRate: number): 'HAWKISH' | 'NEUTRAL' | 'DOVISH' {
    if (treasuryYields > 4.5 || inflationRate > 3.5) {
      return 'HAWKISH';
    } else if (treasuryYields < 3.5 || inflationRate < 2.5) {
      return 'DOVISH';
    } else {
      return 'NEUTRAL';
    }
  }

  // ============================================================================
  // PLACEHOLDER FETCH METHODS (TO BE IMPLEMENTED)
  // ============================================================================

  private async fetchBitcoinPrice(): Promise<number> {
    // TODO: Implement Bitcoin price fetching
    return 107940; // Default price
  }

  private async fetchCoingeckoAltcoinData(): Promise<any[]> {
    // TODO: Implement CoinGecko API calls for altcoins
    return [];
  }

  private async fetchStockData(symbol: string): Promise<any> {
    // TODO: Implement Yahoo Finance API calls
    return { price: 0 };
  }

  private async fetchMagnificent7Data(): Promise<any> {
    // TODO: Implement Magnificent 7 index calculation
    return { price: 0 };
  }

  private async fetchDollarIndex(): Promise<number> {
    // TODO: Implement DXY fetching
    return 104.2;
  }

  private async fetchTreasuryYields(): Promise<number> {
    // TODO: Implement Treasury yields fetching
    return 4.12;
  }

  private async fetchInflationRate(): Promise<number> {
    // TODO: Implement inflation rate fetching
    return 3.1;
  }

  private async fetchMoneySupply(): Promise<number> {
    // TODO: Implement money supply fetching
    return 0;
  }

  private async fetchETFHoldings(): Promise<any> {
    // TODO: Implement ETF holdings fetching
    return {};
  }

  private async fetchETFFlows(): Promise<any> {
    // TODO: Implement ETF flows fetching
    return {};
  }

  private async fetchFearGreedIndex(): Promise<any> {
    // TODO: Implement Fear & Greed Index fetching
    return { index: 50, value: 'Neutral' };
  }
} 