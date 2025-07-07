import { createBitcoinAPIClient } from "../utils/apiUtils";
import { BitcoinIntelligenceService } from "../services/BitcoinIntelligenceService";
import { MarketIntelligenceService } from "../services/MarketIntelligenceService";
import { InstitutionalAdoptionService } from "../services/InstitutionalAdoptionService";
import { ConfigurationService } from "../services/ConfigurationService";

/**
 * API Integration Test Suite
 * Tests all free API integrations to ensure they're working correctly
 */
export async function testAPIIntegration() {
  console.log("🧪 Testing Bitcoin Intelligence API Integration");
  console.log("=" .repeat(60));

  const results = {
    apiClient: false,
    bitcoinIntelligence: false,
    marketIntelligence: false,
    institutionalAdoption: false,
    configuration: false,
    errors: [] as string[]
  };

  try {
    // Test 1: API Client Direct Testing
    console.log("\n🔧 Testing API Client Direct Calls...");
    await testAPIClientDirect();
    results.apiClient = true;
    console.log("✅ API Client tests passed");

    // Test 2: Bitcoin Intelligence Service
    console.log("\n🟠 Testing Bitcoin Intelligence Service...");
    await testBitcoinIntelligenceService();
    results.bitcoinIntelligence = true;
    console.log("✅ Bitcoin Intelligence Service tests passed");

    // Test 3: Market Intelligence Service
    console.log("\n📊 Testing Market Intelligence Service...");
    await testMarketIntelligenceService();
    results.marketIntelligence = true;
    console.log("✅ Market Intelligence Service tests passed");

    // Test 4: Institutional Adoption Service
    console.log("\n🏢 Testing Institutional Adoption Service...");
    await testInstitutionalAdoptionService();
    results.institutionalAdoption = true;
    console.log("✅ Institutional Adoption Service tests passed");

    // Test 5: Configuration Service
    console.log("\n⚙️ Testing Configuration Service...");
    await testConfigurationService();
    results.configuration = true;
    console.log("✅ Configuration Service tests passed");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(errorMessage);
    console.error("❌ Test failed:", errorMessage);
  }

  // Print summary
  console.log("\n" + "=" .repeat(60));
  console.log("📊 API INTEGRATION TEST SUMMARY");
  console.log("=" .repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    if (test !== 'errors') {
      const status = passed ? "✅ PASS" : "❌ FAIL";
      console.log(`${status} ${test}`);
    }
  });

  if (results.errors.length > 0) {
    console.log("\n❌ ERRORS ENCOUNTERED:");
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  const allPassed = Object.values(results).every(result => 
    typeof result === 'boolean' ? result : true
  ) && results.errors.length === 0;

  console.log(`\n${allPassed ? "🎉 ALL TESTS PASSED" : "⚠️ SOME TESTS FAILED"}`);
  return allPassed;
}

/**
 * Test API Client Direct Calls
 */
async function testAPIClientDirect() {
  const apiClient = createBitcoinAPIClient();
  
  console.log("  Testing Bitcoin market data...");
  const marketData = await apiClient.getBitcoinMarketData();
  validateMarketData(marketData);
  
  console.log("  Testing blockchain info...");
  const blockchainData = await apiClient.getBlockchainInfo();
  validateBlockchainData(blockchainData);
  
  console.log("  Testing mempool data...");
  const mempoolData = await apiClient.getMempoolData();
  validateMempoolData(mempoolData);
  
  console.log("  Testing Fear & Greed Index...");
  const fearGreedData = await apiClient.getFearGreedIndex();
  validateFearGreedData(fearGreedData);
  
  console.log("  Testing altcoin data...");
  const altcoinData = await apiClient.getAltcoinData(['ethereum', 'solana', 'cardano']);
  validateAltcoinData(altcoinData);
  
  console.log("  Testing stock data...");
  const stockData = await apiClient.getStockData('TSLA');
  validateStockData(stockData);
  
  console.log("  Testing dollar index...");
  const dollarIndex = await apiClient.getDollarIndex();
  validateDollarIndex(dollarIndex);
  
  console.log("  Testing treasury yields...");
  const treasuryYields = await apiClient.getTreasuryYields();
  validateTreasuryYields(treasuryYields);
}

/**
 * Test Bitcoin Intelligence Service
 */
async function testBitcoinIntelligenceService() {
  // Create a mock runtime for testing
  const mockRuntime = createMockRuntime();
  
  const service = new BitcoinIntelligenceService(mockRuntime);
  await service.init();
  
  console.log("  Testing comprehensive intelligence...");
  const intelligence = await service.getComprehensiveIntelligence();
  validateBitcoinIntelligence(intelligence);
  
  console.log("  Testing network health...");
  const networkHealth = await service.getNetworkHealth();
  validateNetworkHealth(networkHealth);
  
  console.log("  Testing market context...");
  const marketContext = await service.getMarketContext();
  validateMarketContext(marketContext);
  
  console.log("  Testing opportunity detection...");
  const opportunities = await service.detectOpportunities();
  validateOpportunities(opportunities);
  
  console.log("  Testing morning briefing...");
  const briefing = await service.generateMorningBriefing();
  validateMorningBriefing(briefing);
}

/**
 * Test Market Intelligence Service
 */
async function testMarketIntelligenceService() {
  const mockRuntime = createMockRuntime();
  
  const service = new MarketIntelligenceService(mockRuntime);
  await service.init();
  
  console.log("  Testing market intelligence...");
  const marketIntelligence = await service.getMarketIntelligence();
  validateMarketIntelligence(marketIntelligence);
  
  console.log("  Testing altcoin performance...");
  const altcoinPerformance = await service.getAltcoinPerformance();
  validateAltcoinPerformance(altcoinPerformance);
  
  console.log("  Testing stock correlations...");
  const stockCorrelations = await service.getStockCorrelations();
  validateStockCorrelations(stockCorrelations);
  
  console.log("  Testing macro indicators...");
  const macroIndicators = await service.getMacroIndicators();
  validateMacroIndicators(macroIndicators);
  
  console.log("  Testing ETF flows...");
  const etfFlows = await service.getETFFlows();
  validateETFFlows(etfFlows);
}

/**
 * Test Institutional Adoption Service
 */
async function testInstitutionalAdoptionService() {
  const mockRuntime = createMockRuntime();
  
  const service = new InstitutionalAdoptionService(mockRuntime);
  await service.init();
  
  console.log("  Testing institutional adoption...");
  const institutionalData = await service.getInstitutionalAdoption();
  validateInstitutionalAdoption(institutionalData);
  
  console.log("  Testing corporate treasuries...");
  const corporateTreasuries = await service.getCorporateTreasuries();
  validateCorporateTreasuries(corporateTreasuries);
  
  console.log("  Testing sovereign adoption...");
  const sovereignAdoption = await service.getSovereignAdoption();
  validateSovereignAdoption(sovereignAdoption);
  
  console.log("  Testing ETF metrics...");
  const etfMetrics = await service.getETFMetrics();
  validateETFMetrics(etfMetrics);
  
  console.log("  Testing banking integration...");
  const bankingIntegration = await service.getBankingIntegration();
  validateBankingIntegration(bankingIntegration);
}

/**
 * Test Configuration Service
 */
async function testConfigurationService() {
  const mockRuntime = createMockRuntime();
  
  const service = new ConfigurationService(mockRuntime);
  await service.init();
  
  console.log("  Testing API configuration...");
  const apiConfig = service.getAPIConfig();
  validateAPIConfig(apiConfig);
  
  console.log("  Testing cache configuration...");
  const cacheConfig = service.getCacheConfig();
  validateCacheConfig(cacheConfig);
  
  console.log("  Testing feature flags...");
  const featureFlags = service.getFeatureFlags();
  validateFeatureFlags(featureFlags);
  
  console.log("  Testing thresholds...");
  const thresholds = service.getThresholds();
  validateThresholds(thresholds);
  
  console.log("  Testing configuration summary...");
  const summary = service.getConfigurationSummary();
  validateConfigurationSummary(summary);
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validateMarketData(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid market data structure");
  if (typeof data.price !== 'number' || data.price <= 0) throw new Error("Invalid Bitcoin price");
  if (typeof data.marketCap !== 'number' || data.marketCap <= 0) throw new Error("Invalid market cap");
  if (typeof data.volume24h !== 'number') throw new Error("Invalid 24h volume");
  console.log(`    ✅ Bitcoin Price: $${data.price.toLocaleString()}`);
  console.log(`    ✅ Market Cap: $${(data.marketCap / 1e9).toFixed(2)}B`);
}

function validateBlockchainData(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid blockchain data structure");
  if (typeof data.hashRate !== 'number' || data.hashRate <= 0) throw new Error("Invalid hash rate");
  if (typeof data.blockHeight !== 'number' || data.blockHeight <= 0) throw new Error("Invalid block height");
  if (typeof data.difficulty !== 'number' || data.difficulty <= 0) throw new Error("Invalid difficulty");
  console.log(`    ✅ Hash Rate: ${(data.hashRate / 1e18).toFixed(2)} EH/s`);
  console.log(`    ✅ Block Height: ${data.blockHeight.toLocaleString()}`);
}

function validateMempoolData(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid mempool data structure");
  if (typeof data.mempoolSize !== 'number') throw new Error("Invalid mempool size");
  if (typeof data.fastestFee !== 'number') throw new Error("Invalid fastest fee");
  console.log(`    ✅ Mempool Size: ${data.mempoolSize.toFixed(2)} MB`);
  console.log(`    ✅ Fastest Fee: ${data.fastestFee} sat/vB`);
}

function validateFearGreedData(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid Fear & Greed data structure");
  if (typeof data.index !== 'number' || data.index < 0 || data.index > 100) throw new Error("Invalid Fear & Greed index");
  if (typeof data.value !== 'string') throw new Error("Invalid Fear & Greed value");
  console.log(`    ✅ Fear & Greed: ${data.index} (${data.value})`);
}

function validateAltcoinData(data: any) {
  if (!Array.isArray(data)) throw new Error("Invalid altcoin data structure");
  if (data.length === 0) throw new Error("No altcoin data received");
  data.forEach((coin, index) => {
    if (!coin.symbol || !coin.current_price) throw new Error(`Invalid coin data at index ${index}`);
  });
  console.log(`    ✅ Altcoin Data: ${data.length} coins received`);
  console.log(`    ✅ Sample: ${data[0].symbol} at $${data[0].current_price}`);
}

function validateStockData(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid stock data structure");
  if (typeof data.price !== 'number') throw new Error("Invalid stock price");
  console.log(`    ✅ Stock Price: $${data.price.toFixed(2)}`);
}

function validateDollarIndex(data: any) {
  if (typeof data !== 'number' || data <= 0) throw new Error("Invalid dollar index");
  console.log(`    ✅ Dollar Index: ${data.toFixed(2)}`);
}

function validateTreasuryYields(data: any) {
  if (typeof data !== 'number' || data < 0) throw new Error("Invalid treasury yields");
  console.log(`    ✅ Treasury Yields: ${data.toFixed(2)}%`);
}

function validateBitcoinIntelligence(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid Bitcoin intelligence structure");
  if (!data.network || !data.market) throw new Error("Missing network or market data");
  console.log(`    ✅ Bitcoin Intelligence: Network and market data present`);
}

function validateNetworkHealth(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid network health structure");
  if (typeof data.price !== 'number') throw new Error("Invalid network price");
  console.log(`    ✅ Network Health: Price $${data.price.toLocaleString()}`);
}

function validateMarketContext(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid market context structure");
  console.log(`    ✅ Market Context: Data structure valid`);
}

function validateOpportunities(data: any) {
  if (!Array.isArray(data)) throw new Error("Invalid opportunities structure");
  console.log(`    ✅ Opportunities: ${data.length} opportunities detected`);
}

function validateMorningBriefing(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid morning briefing structure");
  if (!data.timestamp || !data.bitcoinStatus) throw new Error("Missing briefing components");
  console.log(`    ✅ Morning Briefing: Generated successfully`);
}

function validateMarketIntelligence(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid market intelligence structure");
  console.log(`    ✅ Market Intelligence: Data structure valid`);
}

function validateAltcoinPerformance(data: any) {
  if (!Array.isArray(data)) throw new Error("Invalid altcoin performance structure");
  console.log(`    ✅ Altcoin Performance: ${data.length} performers`);
}

function validateStockCorrelations(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid stock correlations structure");
  console.log(`    ✅ Stock Correlations: Data structure valid`);
}

function validateMacroIndicators(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid macro indicators structure");
  console.log(`    ✅ Macro Indicators: Data structure valid`);
}

function validateETFFlows(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid ETF flows structure");
  console.log(`    ✅ ETF Flows: Data structure valid`);
}

function validateInstitutionalAdoption(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid institutional adoption structure");
  console.log(`    ✅ Institutional Adoption: Data structure valid`);
}

function validateCorporateTreasuries(data: any) {
  if (!Array.isArray(data)) throw new Error("Invalid corporate treasuries structure");
  console.log(`    ✅ Corporate Treasuries: ${data.length} companies`);
}

function validateSovereignAdoption(data: any) {
  if (!Array.isArray(data)) throw new Error("Invalid sovereign adoption structure");
  console.log(`    ✅ Sovereign Adoption: ${data.length} countries`);
}

function validateETFMetrics(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid ETF metrics structure");
  console.log(`    ✅ ETF Metrics: Data structure valid`);
}

function validateBankingIntegration(data: any) {
  if (!Array.isArray(data)) throw new Error("Invalid banking integration structure");
  console.log(`    ✅ Banking Integration: ${data.length} institutions`);
}

function validateAPIConfig(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid API config structure");
  if (!data.coingecko || !data.blockchain) throw new Error("Missing API configurations");
  console.log(`    ✅ API Config: ${Object.keys(data).length} APIs configured`);
}

function validateCacheConfig(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid cache config structure");
  console.log(`    ✅ Cache Config: ${Object.keys(data).length} cache settings`);
}

function validateFeatureFlags(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid feature flags structure");
  console.log(`    ✅ Feature Flags: ${Object.keys(data).length} features configured`);
}

function validateThresholds(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid thresholds structure");
  console.log(`    ✅ Thresholds: ${Object.keys(data).length} threshold categories`);
}

function validateConfigurationSummary(data: any) {
  if (!data || typeof data !== 'object') throw new Error("Invalid configuration summary structure");
  console.log(`    ✅ Config Summary: ${data.apis.length} APIs, ${data.features.length} features`);
}

// ============================================================================
// MOCK RUNTIME FOR TESTING
// ============================================================================

function createMockRuntime() {
  return {
    getSetting: (key: string) => {
      const settings: { [key: string]: any } = {
        'COINGECKO_API_KEY': '',
        'BLOCKCHAIN_API_KEY': '',
        'MEMPOOL_BASE_URL': 'https://mempool.space/api',
        'ALTERNATIVE_BASE_URL': 'https://api.alternative.me',
        'ENABLE_REALTIME_UPDATES': 'true',
        'ENABLE_OPPORTUNITY_DETECTION': 'true'
      };
      return settings[key] || '';
    },
    getService: (serviceType: string) => null,
    logger: {
      info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
      warn: (message: string, ...args: any[]) => console.log(`[WARN] ${message}`, ...args),
      error: (message: string, ...args: any[]) => console.log(`[ERROR] ${message}`, ...args),
      debug: (message: string, ...args: any[]) => console.log(`[DEBUG] ${message}`, ...args)
    }
  } as any;
}

// Export for use in other test files 