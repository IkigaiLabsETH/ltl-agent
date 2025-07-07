import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import {
  BitcoinInstitutionalData,
  CorporateTreasury,
  SovereignAdoption,
  ETFMetrics,
  ETFHolding,
  BankingIntegration
} from "../types/bitcoinIntelligence";
import { ElizaOSErrorHandler, LoggerWithContext, generateCorrelationId } from "../utils";
import { createBitcoinAPIClient } from "../utils/apiUtils";

export class InstitutionalAdoptionService extends BaseDataService {
  static serviceType = "institutional-adoption";
  capabilityDescription = "Institutional adoption service tracking corporate treasuries, sovereign adoption, ETF metrics, and banking integration";

  // API client
  private apiClient: ReturnType<typeof createBitcoinAPIClient>;

  // Data storage
  private institutionalData: BitcoinInstitutionalData | null = null;
  private lastUpdateTime: Date | null = null;
  private updateInterval: number = 3600; // 1 hour default
  private isUpdating: boolean = false;

  // Corporate treasury data (static for now, would be fetched from APIs)
  private readonly CORPORATE_TREASURIES: CorporateTreasury[] = [
    {
      company: "MicroStrategy",
      ticker: "MSTR",
      bitcoinHoldings: 189150,
      bitcoinValue: 8200000000, // $8.2B
      acquisitionDate: "2020-08-11",
      averagePrice: 43350,
      currentValue: 8200000000,
      percentageOfTreasury: 95,
      lastUpdated: new Date()
    },
    {
      company: "Tesla",
      ticker: "TSLA",
      bitcoinHoldings: 9720,
      bitcoinValue: 420000000, // $420M
      acquisitionDate: "2021-02-08",
      averagePrice: 43200,
      currentValue: 420000000,
      percentageOfTreasury: 15,
      lastUpdated: new Date()
    },
    {
      company: "Block",
      ticker: "SQ",
      bitcoinHoldings: 8027,
      bitcoinValue: 347000000, // $347M
      acquisitionDate: "2020-10-08",
      averagePrice: 43200,
      currentValue: 347000000,
      percentageOfTreasury: 10,
      lastUpdated: new Date()
    },
    {
      company: "Marathon Digital",
      ticker: "MARA",
      bitcoinHoldings: 15741,
      bitcoinValue: 680000000, // $680M
      acquisitionDate: "2021-01-01",
      averagePrice: 43200,
      currentValue: 680000000,
      percentageOfTreasury: 80,
      lastUpdated: new Date()
    },
    {
      company: "Riot Platforms",
      ticker: "RIOT",
      bitcoinHoldings: 8758,
      bitcoinValue: 378000000, // $378M
      acquisitionDate: "2021-01-01",
      averagePrice: 43200,
      currentValue: 378000000,
      percentageOfTreasury: 75,
      lastUpdated: new Date()
    }
  ];

  // Sovereign adoption data
  private readonly SOVEREIGN_ADOPTION: SovereignAdoption[] = [
    {
      country: "El Salvador",
      bitcoinHoldings: 2381,
      bitcoinValue: 103000000, // $103M
      legalStatus: "LEGAL_TENDER",
      adoptionDate: "2021-09-07",
      lastUpdated: new Date()
    },
    {
      country: "Central African Republic",
      bitcoinHoldings: 1000,
      bitcoinValue: 43000000, // $43M
      legalStatus: "LEGAL_TENDER",
      adoptionDate: "2022-04-27",
      lastUpdated: new Date()
    },
    {
      country: "Ukraine",
      bitcoinHoldings: 500,
      bitcoinValue: 22000000, // $22M
      legalStatus: "LEGAL",
      adoptionDate: "2022-03-01",
      lastUpdated: new Date()
    }
  ];

  // Banking integration data
  private readonly BANKING_INTEGRATION: BankingIntegration[] = [
    {
      institution: "JPMorgan Chase",
      services: ["Custody", "Trading", "Research"],
      integrationLevel: "FULL_SERVICE",
      bitcoinExposure: 5000000000, // $5B
      lastUpdated: new Date()
    },
    {
      institution: "Goldman Sachs",
      services: ["Trading", "Custody", "Derivatives"],
      integrationLevel: "FULL_SERVICE",
      bitcoinExposure: 3000000000, // $3B
      lastUpdated: new Date()
    },
    {
      institution: "Morgan Stanley",
      services: ["Custody", "Trading"],
      integrationLevel: "TRADING",
      bitcoinExposure: 2000000000, // $2B
      lastUpdated: new Date()
    },
    {
      institution: "Fidelity",
      services: ["Custody", "Trading", "401k Integration"],
      integrationLevel: "FULL_SERVICE",
      bitcoinExposure: 4000000000, // $4B
      lastUpdated: new Date()
    },
    {
      institution: "BlackRock",
      services: ["ETF Management", "Institutional Custody"],
      integrationLevel: "FULL_SERVICE",
      bitcoinExposure: 15000000000, // $15B
      lastUpdated: new Date()
    }
  ];

  constructor(runtime: IAgentRuntime) {
    super(runtime, "bitcoinData");
    
    // Initialize API client
    this.apiClient = createBitcoinAPIClient();
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("InstitutionalAdoptionService starting...");
    const service = new InstitutionalAdoptionService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("InstitutionalAdoptionService stopping...");
    const service = runtime.getService("institutional-adoption");
    if (service && typeof service.stop === "function") {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    logger.info("InstitutionalAdoptionService starting...");
    await this.updateData();
    this.startPeriodicUpdates();
    logger.info("InstitutionalAdoptionService started successfully");
  }

  async init() {
    logger.info("InstitutionalAdoptionService initialized");
    await this.updateData();
  }

  async stop() {
    logger.info("InstitutionalAdoptionService stopped");
  }

  // ============================================================================
  // CORE INSTITUTIONAL ADOPTION METHODS
  // ============================================================================

  /**
   * Get comprehensive institutional adoption data
   */
  async getInstitutionalAdoption(): Promise<BitcoinInstitutionalData | null> {
    if (!this.institutionalData || this.isDataStale()) {
      await this.updateData();
    }
    return this.institutionalData;
  }

  /**
   * Get corporate treasury data
   */
  async getCorporateTreasuries(): Promise<CorporateTreasury[]> {
    const data = await this.getInstitutionalAdoption();
    return data?.corporateTreasuries || [];
  }

  /**
   * Get sovereign adoption data
   */
  async getSovereignAdoption(): Promise<SovereignAdoption[]> {
    const data = await this.getInstitutionalAdoption();
    return data?.sovereignAdoption || [];
  }

  /**
   * Get ETF metrics
   */
  async getETFMetrics(): Promise<ETFMetrics> {
    const data = await this.getInstitutionalAdoption();
    return data?.etfMetrics || {
      totalAUM: 0,
      totalBitcoinHeld: 0,
      percentOfSupply: 0,
      dailyFlows: 0,
      institutionalShare: 0,
      topETFs: [],
      lastUpdated: new Date()
    };
  }

  /**
   * Get banking integration data
   */
  async getBankingIntegration(): Promise<BankingIntegration[]> {
    const data = await this.getInstitutionalAdoption();
    return data?.bankingIntegration || [];
  }

  /**
   * Get overall adoption score
   */
  async getAdoptionScore(): Promise<number> {
    const data = await this.getInstitutionalAdoption();
    return data?.adoptionScore || 0;
  }

  /**
   * Analyze institutional trends
   */
  async analyzeInstitutionalTrends(): Promise<{
    corporateAdoption: string[];
    bankingIntegration: string[];
    etfMetrics: { [key: string]: any };
    sovereignActivity: string[];
    adoptionScore: number;
  }> {
    const data = await this.getInstitutionalAdoption();
    
    if (!data) {
      return {
        corporateAdoption: [],
        bankingIntegration: [],
        etfMetrics: {},
        sovereignActivity: [],
        adoptionScore: 0
      };
    }

    return {
      corporateAdoption: data.corporateTreasuries.map(t => `${t.company} (${t.ticker}): ${t.bitcoinHoldings.toLocaleString()} BTC`),
      bankingIntegration: data.bankingIntegration.map(b => `${b.institution}: ${b.integrationLevel}`),
      etfMetrics: {
        totalAUM: data.etfMetrics.totalAUM,
        totalBitcoinHeld: data.etfMetrics.totalBitcoinHeld,
        dailyFlows: data.etfMetrics.dailyFlows,
        institutionalShare: data.etfMetrics.institutionalShare
      },
      sovereignActivity: data.sovereignAdoption.map(s => `${s.country}: ${s.legalStatus}`),
      adoptionScore: data.adoptionScore
    };
  }

  // ============================================================================
  // DATA UPDATE METHODS
  // ============================================================================

  /**
   * Update institutional adoption data
   */
  async updateData(): Promise<void> {
    if (this.isUpdating) {
      logger.warn("InstitutionalAdoptionService: Update already in progress");
      return;
    }

    this.isUpdating = true;
    const contextLogger = new LoggerWithContext(generateCorrelationId(), "InstitutionalAdoptionService");

    try {
      contextLogger.info("🏢 Fetching institutional adoption data...");

      // Fetch all institutional data in parallel
      const [corporateData, sovereignData, etfMetrics, bankingData] = await Promise.all([
        this.fetchCorporateTreasuries(),
        this.fetchSovereignAdoption(),
        this.fetchETFMetrics(),
        this.fetchBankingIntegration()
      ]);

      // Compile institutional adoption data
      this.institutionalData = {
        corporateTreasuries: corporateData.treasuries || this.CORPORATE_TREASURIES,
        totalCorporateHoldings: corporateData.totalHoldings || this.calculateTotalCorporateHoldings(),
        corporateAdoptionScore: this.calculateCorporateAdoptionScore(corporateData),
        sovereignAdoption: sovereignData.adoptions || this.SOVEREIGN_ADOPTION,
        totalSovereignHoldings: sovereignData.totalHoldings || this.calculateTotalSovereignHoldings(),
        sovereignAdoptionScore: this.calculateSovereignAdoptionScore(sovereignData),
        etfMetrics: etfMetrics,
        bankingIntegration: bankingData.integrations || this.BANKING_INTEGRATION,
        bankingAdoptionScore: this.calculateBankingAdoptionScore(bankingData),
        adoptionScore: this.calculateOverallAdoptionScore(corporateData, sovereignData, etfMetrics, bankingData),
        lastUpdated: new Date()
      };

      this.lastUpdateTime = new Date();

      contextLogger.info("🏢 Institutional adoption data update complete", {
        corporateHoldings: this.institutionalData.totalCorporateHoldings,
        sovereignHoldings: this.institutionalData.totalSovereignHoldings,
        etfAUM: this.institutionalData.etfMetrics.totalAUM,
        adoptionScore: this.institutionalData.adoptionScore
      });

    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, "InstitutionalAdoptionUpdate");
      contextLogger.error("❌ Error updating institutional adoption data:", enhancedError.message);
      throw enhancedError;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Force update all institutional data
   */
  async forceUpdate(): Promise<BitcoinInstitutionalData | null> {
    await this.updateData();
    return this.institutionalData;
  }

  // ============================================================================
  // PRIVATE FETCH METHODS
  // ============================================================================

  /**
   * Fetch corporate treasury data
   */
  private async fetchCorporateTreasuries(): Promise<{
    treasuries: CorporateTreasury[];
    totalHoldings: number;
  }> {
    try {
      const contextLogger = new LoggerWithContext(generateCorrelationId(), "InstitutionalAdoptionService");
      contextLogger.info("💼 Fetching corporate treasury data...");

      // For now, use static data. In production, this would fetch from APIs
      const treasuries = this.CORPORATE_TREASURIES.map(treasury => ({
        ...treasury,
        lastUpdated: new Date()
      }));

      const totalHoldings = treasuries.reduce((sum, treasury) => sum + treasury.bitcoinHoldings, 0);

      contextLogger.info("💼 Corporate treasury data processed", {
        totalCompanies: treasuries.length,
        totalHoldings: totalHoldings.toLocaleString()
      });

      return { treasuries, totalHoldings };
    } catch (error) {
      logger.error("Error fetching corporate treasuries:", error);
      return { treasuries: this.CORPORATE_TREASURIES, totalHoldings: this.calculateTotalCorporateHoldings() };
    }
  }

  /**
   * Fetch sovereign adoption data
   */
  private async fetchSovereignAdoption(): Promise<{
    adoptions: SovereignAdoption[];
    totalHoldings: number;
  }> {
    try {
      const contextLogger = new LoggerWithContext(generateCorrelationId(), "InstitutionalAdoptionService");
      contextLogger.info("🌍 Fetching sovereign adoption data...");

      // For now, use static data. In production, this would fetch from APIs
      const adoptions = this.SOVEREIGN_ADOPTION.map(adoption => ({
        ...adoption,
        lastUpdated: new Date()
      }));

      const totalHoldings = adoptions.reduce((sum, adoption) => sum + adoption.bitcoinHoldings, 0);

      contextLogger.info("🌍 Sovereign adoption data processed", {
        totalCountries: adoptions.length,
        totalHoldings: totalHoldings.toLocaleString()
      });

      return { adoptions, totalHoldings };
    } catch (error) {
      logger.error("Error fetching sovereign adoption:", error);
      return { adoptions: this.SOVEREIGN_ADOPTION, totalHoldings: this.calculateTotalSovereignHoldings() };
    }
  }

  /**
   * Fetch ETF metrics data
   */
  private async fetchETFMetrics(): Promise<ETFMetrics> {
    try {
      const contextLogger = new LoggerWithContext(generateCorrelationId(), "InstitutionalAdoptionService");
      contextLogger.info("📊 Fetching ETF metrics data...");

      // Mock ETF data - in production, this would fetch from real APIs
      const etfMetrics: ETFMetrics = {
        totalAUM: 27400000000, // $27.4B
        totalBitcoinHeld: 450000, // 450K BTC
        percentOfSupply: 2.3, // 2.3% of total supply
        dailyFlows: 245000000, // $245M daily flows
        institutionalShare: 26.3, // 26.3% institutional share
        topETFs: [
          {
            ticker: "IBIT",
            name: "iShares Bitcoin Trust",
            issuer: "BlackRock",
            aum: 12800000000, // $12.8B
            bitcoinHoldings: 210000, // 210K BTC
            dailyFlows: 120000000, // $120M
            expenseRatio: 0.25,
            lastUpdated: new Date()
          },
          {
            ticker: "FBTC",
            name: "Fidelity Wise Origin Bitcoin Fund",
            issuer: "Fidelity",
            aum: 8500000000, // $8.5B
            bitcoinHoldings: 140000, // 140K BTC
            dailyFlows: 80000000, // $80M
            expenseRatio: 0.25,
            lastUpdated: new Date()
          },
          {
            ticker: "ARKB",
            name: "ARK 21Shares Bitcoin ETF",
            issuer: "ARK Invest",
            aum: 3200000000, // $3.2B
            bitcoinHoldings: 52000, // 52K BTC
            dailyFlows: 25000000, // $25M
            expenseRatio: 0.21,
            lastUpdated: new Date()
          }
        ],
        lastUpdated: new Date()
      };

      contextLogger.info("📊 ETF metrics processed", {
        totalAUM: etfMetrics.totalAUM,
        totalBitcoinHeld: etfMetrics.totalBitcoinHeld,
        dailyFlows: etfMetrics.dailyFlows
      });

      return etfMetrics;
    } catch (error) {
      logger.error("Error fetching ETF metrics:", error);
      return {
        totalAUM: 27400000000,
        totalBitcoinHeld: 450000,
        percentOfSupply: 2.3,
        dailyFlows: 245000000,
        institutionalShare: 26.3,
        topETFs: [],
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Fetch banking integration data
   */
  private async fetchBankingIntegration(): Promise<{
    integrations: BankingIntegration[];
  }> {
    try {
      const contextLogger = new LoggerWithContext(generateCorrelationId(), "InstitutionalAdoptionService");
      contextLogger.info("🏦 Fetching banking integration data...");

      // For now, use static data. In production, this would fetch from APIs
      const integrations = this.BANKING_INTEGRATION.map(integration => ({
        ...integration,
        lastUpdated: new Date()
      }));

      contextLogger.info("🏦 Banking integration data processed", {
        totalInstitutions: integrations.length
      });

      return { integrations };
    } catch (error) {
      logger.error("Error fetching banking integration:", error);
      return { integrations: this.BANKING_INTEGRATION };
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
   * Calculate total corporate holdings
   */
  private calculateTotalCorporateHoldings(): number {
    return this.CORPORATE_TREASURIES.reduce((sum, treasury) => sum + treasury.bitcoinHoldings, 0);
  }

  /**
   * Calculate total sovereign holdings
   */
  private calculateTotalSovereignHoldings(): number {
    return this.SOVEREIGN_ADOPTION.reduce((sum, adoption) => sum + adoption.bitcoinHoldings, 0);
  }

  /**
   * Calculate corporate adoption score (0-100)
   */
  private calculateCorporateAdoptionScore(corporateData: any): number {
    if (!corporateData.treasuries || corporateData.treasuries.length === 0) {
      return 0;
    }

    // Score based on number of companies, total holdings, and average percentage
    const numCompanies = corporateData.treasuries.length;
    const totalHoldings = corporateData.totalHoldings || 0;
    const avgPercentage = corporateData.treasuries.reduce((sum: number, t: CorporateTreasury) => 
      sum + t.percentageOfTreasury, 0) / numCompanies;

    // Scoring algorithm
    let score = 0;
    
    // Number of companies (max 30 points)
    score += Math.min(30, numCompanies * 6);
    
    // Total holdings (max 40 points)
    score += Math.min(40, (totalHoldings / 100000) * 2);
    
    // Average percentage of treasury (max 30 points)
    score += Math.min(30, avgPercentage * 0.3);

    return Math.round(score);
  }

  /**
   * Calculate sovereign adoption score (0-100)
   */
  private calculateSovereignAdoptionScore(sovereignData: any): number {
    if (!sovereignData.adoptions || sovereignData.adoptions.length === 0) {
      return 0;
    }

    // Score based on number of countries, total holdings, and legal status
    const numCountries = sovereignData.adoptions.length;
    const totalHoldings = sovereignData.totalHoldings || 0;
    const legalTenderCount = sovereignData.adoptions.filter((a: SovereignAdoption) => 
      a.legalStatus === 'LEGAL_TENDER').length;

    // Scoring algorithm
    let score = 0;
    
    // Number of countries (max 25 points)
    score += Math.min(25, numCountries * 8);
    
    // Total holdings (max 35 points)
    score += Math.min(35, (totalHoldings / 1000) * 3.5);
    
    // Legal tender status (max 40 points)
    score += Math.min(40, legalTenderCount * 20);

    return Math.round(score);
  }

  /**
   * Calculate banking adoption score (0-100)
   */
  private calculateBankingAdoptionScore(bankingData: any): number {
    if (!bankingData.integrations || bankingData.integrations.length === 0) {
      return 0;
    }

    // Score based on number of institutions, total exposure, and integration level
    const numInstitutions = bankingData.integrations.length;
    const totalExposure = bankingData.integrations.reduce((sum: number, b: BankingIntegration) => 
      sum + b.bitcoinExposure, 0);
    const fullServiceCount = bankingData.integrations.filter((b: BankingIntegration) => 
      b.integrationLevel === 'FULL_SERVICE').length;

    // Scoring algorithm
    let score = 0;
    
    // Number of institutions (max 20 points)
    score += Math.min(20, numInstitutions * 4);
    
    // Total exposure (max 40 points)
    score += Math.min(40, (totalExposure / 10000000000) * 8); // $10B = 40 points
    
    // Full service integration (max 40 points)
    score += Math.min(40, fullServiceCount * 8);

    return Math.round(score);
  }

  /**
   * Calculate overall adoption score (0-100)
   */
  private calculateOverallAdoptionScore(
    corporateData: any, 
    sovereignData: any, 
    etfMetrics: ETFMetrics, 
    bankingData: any
  ): number {
    const corporateScore = this.calculateCorporateAdoptionScore(corporateData);
    const sovereignScore = this.calculateSovereignAdoptionScore(sovereignData);
    const bankingScore = this.calculateBankingAdoptionScore(bankingData);
    
    // ETF score based on AUM and flows
    const etfScore = Math.min(100, (etfMetrics.totalAUM / 50000000000) * 50 + (etfMetrics.dailyFlows / 500000000) * 50);

    // Weighted average
    const overallScore = (
      corporateScore * 0.35 +    // 35% weight
      sovereignScore * 0.20 +    // 20% weight
      etfScore * 0.30 +          // 30% weight
      bankingScore * 0.15        // 15% weight
    );

    return Math.round(overallScore);
  }
} 