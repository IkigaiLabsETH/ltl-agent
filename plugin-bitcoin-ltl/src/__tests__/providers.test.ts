import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  allProviders,
  fundamentalProviders,
  dynamicProviders,
  privateProviders,
  timeProvider,
  bitcoinMarketProvider,
  realTimeDataProvider,
  newsProvider,
  economicIndicatorsProvider,
  marketContextProvider,
  travelProvider,
  altcoinProvider,
  stockProvider,
  nftProvider,
  lifestyleProvider,
  networkHealthProvider,
  opportunityProvider,
  briefingProvider,
} from "../providers";
import type { IAgentRuntime, Memory, State } from "@elizaos/core";

// Mock runtime and services
const createMockRuntime = (): IAgentRuntime =>
  ({
    getService: vi.fn((serviceName: string) => {
      // Mock service responses based on service name
      switch (serviceName) {
        case "bitcoin-data":
          return {
            getBitcoinPrice: vi.fn().mockResolvedValue(100000),
            getEnhancedMarketData: vi.fn().mockResolvedValue({
              price: 100000,
              marketCap: 2000000000000,
              volume24h: 50000000000,
              priceChange24h: 2.5,
              allTimeHigh: 108000,
              lastUpdated: new Date().toISOString(),
            }),
            calculateThesisMetrics: vi.fn().mockResolvedValue({
              progressPercentage: 75.5,
              targetPrice: 1000000,
              currentPrice: 100000,
              multiplierNeeded: 10,
              requiredCAGR: { fiveYear: 25, tenYear: 15 },
              catalysts: ["ETF adoption", "Institutional buying"],
            }),
            analyzeInstitutionalTrends: vi.fn().mockResolvedValue({
              adoptionScore: 85,
              corporateAdoption: ["MicroStrategy", "Tesla"],
              bankingIntegration: ["BlackRock", "Fidelity"],
              sovereignActivity: ["El Salvador"],
            }),
            calculateFreedomMathematics: vi.fn().mockResolvedValue({
              btcNeeded: 100,
              currentPrice: 100000,
              scenarios: {
                conservative: { price: 200000, btc: 50, timeline: "5 years" },
              },
              safeLevels: { conservative: 50, moderate: 75, aggressive: 100 },
            }),
          };
        case "real-time-data":
          return {
            getComprehensiveBitcoinData: vi.fn().mockReturnValue({
              price: { usd: 100000, change24h: 2.5 },
              network: { hashRate: 500000000, difficulty: 80000000000000 },
              sentiment: { fearGreedIndex: 75, fearGreedValue: "Greed" },
              lastUpdated: new Date(),
            }),
            getTrendingCoinsData: vi.fn().mockReturnValue({
              coins: [
                { symbol: "ETH", name: "Ethereum", market_cap_rank: 2 },
                { symbol: "SOL", name: "Solana", market_cap_rank: 5 },
              ],
            }),
            getTopMoversData: vi.fn().mockReturnValue({
              topGainers: [
                { symbol: "DOGE", price_change_percentage_24h: 15.5 },
              ],
              topLosers: [{ symbol: "ADA", price_change_percentage_24h: -8.2 }],
            }),

            getDexScreenerData: vi.fn().mockReturnValue({
              trendingTokens: [
                { chainId: "solana", symbol: "BONK" },
                { chainId: "ethereum", symbol: "PEPE" },
              ],
            }),
            getCuratedAltcoinsData: vi.fn().mockReturnValue({
              bitcoin: { price: 100000, change24h: 2.5 },
              ethereum: { price: 4000, change24h: 1.8 },
            }),
            getNewsItems: vi
              .fn()
              .mockReturnValue([
                {
                  title: "Bitcoin hits new high",
                  sentiment: "positive",
                  publishedAt: new Date(),
                },
              ]),
            getSocialSentiment: vi
              .fn()
              .mockReturnValue([
                { platform: "twitter", sentiment: 0.8, mentions: 1000 },
              ]),
            getEconomicIndicators: vi
              .fn()
              .mockReturnValue([
                { name: "CPI", value: 3.2, change: 0.1, unit: "%" },
              ]),
            getAlerts: vi.fn().mockReturnValue([]),
          };
        case "etf-data":
          return {
            // Mock ETF service - would be implemented later
          };
        case "travel-data":
          return {
            getTravelData: vi.fn().mockReturnValue({
              hotels: [
                {
                  hotelId: "biarritz_palace",
                  name: "Hôtel du Palais",
                  city: "biarritz",
                },
                {
                  hotelId: "bordeaux_grand",
                  name: "Grand Hôtel Bordeaux",
                  city: "bordeaux",
                },
              ],
              currentRates: [
                {
                  hotelId: "biarritz_palace",
                  totalPrice: 500,
                  basePrice: 450,
                  currency: "EUR",
                },
              ],
              optimalBookingWindows: [
                {
                  hotelId: "biarritz_palace",
                  hotelName: "Hôtel du Palais",
                  city: "biarritz",
                  bestDates: [
                    {
                      checkIn: "2024-03-15",
                      checkOut: "2024-03-18",
                      totalPrice: 450,
                      savings: 50,
                      savingsPercentage: 10,
                    },
                  ],
                  seasonalAnalysis: {
                    season: "mid",
                    averagePrice: 500,
                    demandLevel: "moderate",
                  },
                },
              ],
              lastUpdated: new Date(),
            }),
            getTravelInsights: vi.fn().mockReturnValue({
              cityAnalysis: [
                {
                  city: "biarritz",
                  bestMonths: [3, 4, 5],
                  averageSavings: 15,
                  optimalStayLength: 3,
                },
                {
                  city: "bordeaux",
                  bestMonths: [3, 4, 5],
                  averageSavings: 12,
                  optimalStayLength: 2,
                },
              ],
              pricePatterns: [
                {
                  month: 3,
                  monthName: "March",
                  averagePrice: 450,
                  recommendation: "excellent",
                },
              ],
              marketTrends: {
                trend: "stable",
                confidence: 0.8,
                timeframe: "monthly",
              },
              lastUpdated: new Date(),
            }),
            getOptimalBookingWindows: vi
              .fn()
              .mockReturnValue([
                {
                  hotelId: "biarritz_palace",
                  hotelName: "Hôtel du Palais",
                  city: "biarritz",
                },
              ]),
            getCuratedHotels: vi.fn().mockReturnValue([
              {
                hotelId: "biarritz_palace",
                name: "Hôtel du Palais",
                city: "biarritz",
                category: "palace",
              },
              {
                hotelId: "bordeaux_grand",
                name: "Grand Hôtel Bordeaux",
                city: "bordeaux",
                category: "luxury",
              },
            ]),
          };
        case "nft-data":
          return {
            getCuratedNFTsData: vi.fn().mockReturnValue({
              collections: [
                {
                  name: "Art Blocks",
                  collection: { name: "Art Blocks" },
                  stats: {
                    floor_price: 2.5,
                    one_day_volume: 100,
                    one_day_change: 5,
                  },
                  category: "generative-art",
                },
              ],
              summary: {
                totalVolume24h: 500,
                totalMarketCap: 10000,
                avgFloorPrice: 2.5,
                totalCollections: 50,
                topPerformers: [{ name: "Art Blocks" }],
                worstPerformers: [{ name: "Other Collection" }],
              },
              lastUpdated: new Date().toISOString(),
            }),
          };
        case "altcoin-data":
          return {
            getCuratedAltcoinsData: vi.fn().mockReturnValue({
              coins: [
                {
                  id: "ethereum",
                  name: "Ethereum",
                  symbol: "ETH",
                  price: 3000,
                  change24h: 2.5,
                },
              ],
              summary: {
                totalMarketCap: 1000000000,
                avgChange24h: 2.5,
                topPerformers: [{ name: "Ethereum" }],
                worstPerformers: [{ name: "Other Coin" }],
              },
              lastUpdated: new Date().toISOString(),
            }),

            getTrendingCoinsData: vi.fn().mockReturnValue({
              coins: [{ symbol: "ETH", name: "Ethereum", market_cap_rank: 2 }],
              lastUpdated: new Date().toISOString(),
            }),
            getTopMoversData: vi.fn().mockReturnValue({
              topGainers: [
                { symbol: "DOGE", price_change_percentage_24h: 15.5 },
              ],
              topLosers: [{ symbol: "ADA", price_change_percentage_24h: -8.2 }],
              lastUpdated: new Date().toISOString(),
            }),
            getDexScreenerData: vi.fn().mockReturnValue({
              trendingTokens: [{ chainId: "solana", symbol: "BONK" }],
              lastUpdated: new Date().toISOString(),
            }),
          };
        case "bitcoin-network-data":
          return {
            getComprehensiveBitcoinData: vi.fn().mockReturnValue({
              network: {
                blockHeight: 820000,
                hashRate: 600000000000000000000,
                difficulty: 80000000000000,
                mempoolSize: 50000000,
                mempoolFees: { fastestFee: 10, halfHourFee: 8, economyFee: 5 },
                nextHalving: { blocks: 90000 },
                miningRevenue: 300,
              },
              sentiment: {
                fearGreedIndex: "Fear",
                fearGreedValue: 35,
              },
              lastUpdated: new Date().toISOString(),
            }),
          };
        case "stock-data":
          return {
            getCuratedStockData: vi.fn().mockReturnValue({
              stocks: [
                {
                  symbol: "MSTR",
                  name: "MicroStrategy",
                  price: 500,
                  change24h: 5.2,
                },
              ],
              summary: {
                totalMarketCap: 5000000000,
                avgChange24h: 3.1,
                topPerformers: [{ symbol: "MSTR" }],
                worstPerformers: [{ symbol: "OTHER" }],
              },
              lastUpdated: new Date().toISOString(),
            }),
            getStockData: vi.fn().mockReturnValue({
              stocks: [
                {
                  symbol: "MSTR",
                  name: "MicroStrategy",
                  price: 500,
                  change24h: 5.2,
                  changePercent: 5.2,
                  sector: "bitcoin-related",
                },
              ],
              performance: {
                topPerformers: [{ symbol: "MSTR" }],
                underperformers: [{ symbol: "OTHER" }],
                mag7Average: 3.2,
                sp500Performance: 1.5,
                bitcoinRelatedAverage: 4.1,
                techStocksAverage: 2.8,
              },
              lastUpdated: new Date().toISOString(),
            }),
            getBitcoinRelatedStocks: vi.fn().mockReturnValue({
              stocks: [
                {
                  symbol: "MSTR",
                  name: "MicroStrategy",
                  price: 500,
                  change24h: 5.2,
                  changePercent: 5.2,
                  sector: "bitcoin-related",
                },
                {
                  symbol: "COIN",
                  name: "Coinbase",
                  price: 200,
                  change24h: 3.1,
                  changePercent: 3.1,
                  sector: "bitcoin-related",
                },
              ],
              summary: {
                totalMarketCap: 8000000000,
                avgChange24h: 4.1,
                topPerformers: [{ symbol: "MSTR" }],
                worstPerformers: [{ symbol: "COIN" }],
              },
              lastUpdated: new Date().toISOString(),
            }),
            getPerformanceComparisons: vi.fn().mockReturnValue([
              { sector: "tech", average: 2.8, count: 5 },
              { sector: "bitcoin-related", average: 4.1, count: 3 },
              { sector: "mag7", average: 3.2, count: 7 },
            ]),
            getMag7Performance: vi.fn().mockReturnValue([
              { symbol: "AAPL", name: "Apple", price: 220, changePercent: 2.1 },
              {
                symbol: "GOOGL",
                name: "Alphabet",
                price: 175,
                changePercent: 1.8,
              },
              {
                symbol: "MSFT",
                name: "Microsoft",
                price: 430,
                changePercent: 3.5,
              },
            ]),
          };
        case "lifestyle-data":
          return {
            getWeatherData: vi.fn().mockReturnValue({
              cities: [
                {
                  city: "biarritz",
                  displayName: "Biarritz, France",
                  weather: {
                    current: { temperature_2m: 22, wind_speed_10m: 12 },
                  },
                  airQuality: { current: { pm2_5: 8, uv_index: 5 } },
                  marine: {
                    current: { wave_height: 1.5, sea_surface_temperature: 20 },
                  },
                },
              ],
              summary: {
                bestWeatherCity: "Biarritz",
                bestSurfConditions: "Biarritz",
                averageTemp: 22,
                windConditions: "light",
                uvRisk: "moderate",
                airQuality: "good",
              },
              lastUpdated: new Date().toISOString(),
            }),
            getLuxuryHotels: vi
              .fn()
              .mockReturnValue([
                { name: "Hôtel du Palais", city: "biarritz", rating: 5 },
              ]),
            getOptimalBookingPeriods: vi.fn().mockResolvedValue([
              {
                hotelName: "Hôtel du Palais",
                period: { monthName: "February", year: 2024 },
                recommendationScore: 85,
                savingsFromPeak: { percentage: 30, amount: 150 },
                weatherDuringPeriod: {
                  suitabilityScore: 7,
                  conditions: "mild",
                },
                reasonsForLowRates: ["off-season", "fewer-events"],
              },
            ]),
          };
        case "opportunity-alert":
          return {
            getActiveAlerts: vi.fn().mockResolvedValue([
              {
                asset: "bitcoin",
                signal: "buy",
                type: "immediate",
                confidence: 0.8,
                action: "accumulate",
                timeframe: "1-3 days",
              },
            ]),
            getAlertHistory: vi
              .fn()
              .mockResolvedValue([
                { asset: "bitcoin", confidence: 0.8, timestamp: Date.now() },
              ]),
            getMetrics: vi.fn().mockResolvedValue({
              totalAlerts: 100,
              accuracyRate: 0.75,
              profitableAlerts: 75,
              totalReturn: 25.5,
            }),
          };
        case "morning-briefing":
          return {
            generateOnDemandBriefing: vi.fn().mockResolvedValue({
              analysis: {
                text: "Market analysis shows bullish sentiment with important opportunities in bitcoin and altcoins. Risk levels are moderate.",
              },
              lastUpdated: new Date().toISOString(),
            }),
            getConfig: vi.fn().mockReturnValue({
              personalizations: { greetingStyle: "professional" },
            }),
            getBriefingHistory: vi
              .fn()
              .mockResolvedValue([
                { date: new Date().toISOString(), priority: "high" },
              ]),
          };
        default:
          return null;
      }
    }),
    // Add other runtime methods as needed
    composeState: vi.fn(),
  }) as any;

const createMockMessage = (): Memory =>
  ({
    id: "test-message-id",
    content: { text: "Test message" },
    roomId: "test-room",
    userId: "test-user",
    embedding: [],
    createdAt: new Date().getTime(),
  }) as any;

const createMockState = (): State =>
  ({
    values: {
      bitcoinPrice: 100000,
      bitcoinPriceDirection: "up",
    },
  }) as any;

describe("Providers Integration", () => {
  let mockRuntime: IAgentRuntime;
  let mockMessage: Memory;
  let mockState: State;

  beforeEach(() => {
    mockRuntime = createMockRuntime();
    mockMessage = createMockMessage();
    mockState = createMockState();
  });

  describe("Provider Collections", () => {
    it("should export all providers correctly", () => {
      expect(allProviders).toHaveLength(14);
      expect(fundamentalProviders).toHaveLength(5);
      expect(dynamicProviders).toHaveLength(6);
      expect(privateProviders).toHaveLength(3);
    });

    it("should include timeProvider in fundamental providers", () => {
      expect(fundamentalProviders).toContain(timeProvider);
    });

    it("should include realTimeDataProvider in dynamic providers", () => {
      expect(dynamicProviders).toContain(realTimeDataProvider);
    });

    it("should include marketContextProvider in private providers", () => {
      expect(privateProviders).toContain(marketContextProvider);
    });
  });

  describe("Time Provider", () => {
    it("should have correct metadata", () => {
      expect(timeProvider.name).toBe("time");
      expect(timeProvider.position).toBe(-10);
      expect(timeProvider.dynamic).toBeUndefined();
      expect(timeProvider.private).toBeUndefined();
    });

    it("should provide time context", async () => {
      const result = await timeProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("Current time:");
      expect(result.values).toHaveProperty("currentDate");
      expect(result.values).toHaveProperty("timestamp");
      expect(result.values).toHaveProperty("marketHours");
      expect(result.values).toHaveProperty("isWeekend");
    });
  });

  describe("Bitcoin Market Provider", () => {
    it("should have correct metadata", () => {
      expect(bitcoinMarketProvider.name).toBe("bitcoinMarket");
      expect(bitcoinMarketProvider.position).toBe(0);
      expect(bitcoinMarketProvider.dynamic).toBeUndefined();
      expect(bitcoinMarketProvider.private).toBeUndefined();
    });

    it("should provide Bitcoin market data", async () => {
      const result = await bitcoinMarketProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("Bitcoin:");
      expect(result.values).toHaveProperty("bitcoinPrice");
      expect(result.values).toHaveProperty("bitcoinChange24h");
      expect(result.values).toHaveProperty("networkHealth");
      expect(result.data).toHaveProperty("fullBitcoinData");
    });

    it("should handle service unavailability gracefully", async () => {
      const mockRuntimeNoService = {
        getService: vi.fn().mockReturnValue(null),
      } as any;

      const result = await bitcoinMarketProvider.get(
        mockRuntimeNoService,
        mockMessage,
        mockState,
      );

      expect(result.text).toBe("Bitcoin market data services not available");
      expect(result.values.bitcoinDataError).toBe(true);
    });
  });

  describe("Real-Time Data Provider", () => {
    it("should have correct metadata", () => {
      expect(realTimeDataProvider.name).toBe("realTimeData");
      expect(realTimeDataProvider.dynamic).toBe(true);
      expect(realTimeDataProvider.private).toBeUndefined();
    });

    it("should provide real-time market data", async () => {
      const result = await realTimeDataProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("Real-time market data:");
      expect(result.values).toHaveProperty("trendingCoinsCount");
      expect(result.values).toHaveProperty("topGainer");
      expect(result.values).toHaveProperty("outperformingBtcCount");
      expect(result.data).toHaveProperty("trendingCoins");
    });
  });

  describe("News Provider", () => {
    it("should have correct metadata", () => {
      expect(newsProvider.name).toBe("news");
      expect(newsProvider.dynamic).toBe(true);
      expect(newsProvider.private).toBeUndefined();
    });

    it("should provide news and sentiment data", async () => {
      const result = await newsProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("Recent news:");
      expect(result.values).toHaveProperty("newsCount");
      expect(result.values).toHaveProperty("socialSentimentCount");
      expect(result.data).toHaveProperty("newsItems");
      expect(result.data).toHaveProperty("socialSentiment");
    });
  });

  describe("Economic Indicators Provider", () => {
    it("should have correct metadata", () => {
      expect(economicIndicatorsProvider.name).toBe("economicIndicators");
      expect(economicIndicatorsProvider.position).toBe(1);
      expect(economicIndicatorsProvider.dynamic).toBeUndefined();
      expect(economicIndicatorsProvider.private).toBeUndefined();
    });

    it("should provide economic indicators", async () => {
      const result = await economicIndicatorsProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("Economic indicators:");
      expect(result.values).toHaveProperty("economicIndicatorsCount");
      expect(result.values).toHaveProperty("hasETFData");
      expect(result.data).toHaveProperty("economicIndicators");
    });
  });

  describe("Market Context Provider", () => {
    it("should have correct metadata", () => {
      expect(marketContextProvider.name).toBe("marketContext");
      expect(marketContextProvider.private).toBe(true);
      expect(marketContextProvider.position).toBe(10);
    });

    it("should provide advanced market analysis", async () => {
      const result = await marketContextProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("Advanced Bitcoin Analysis:");
      expect(result.values).toHaveProperty("thesisProgress");
      expect(result.values).toHaveProperty("institutionalAdoptionScore");
      expect(result.values).toHaveProperty("freedomMathBtcNeeded");
      expect(result.data).toHaveProperty("thesisMetrics");
      expect(result.data).toHaveProperty("institutionalTrends");
    });

    it("should handle missing Bitcoin price gracefully", async () => {
      const stateWithoutPrice = { values: {} } as State;
      const mockRuntimeWithFailingService = {
        getService: vi.fn().mockReturnValue({
          getBitcoinPrice: vi.fn().mockResolvedValue(null),
        }),
      } as any;

      const result = await marketContextProvider.get(
        mockRuntimeWithFailingService,
        mockMessage,
        stateWithoutPrice,
      );

      expect(result.text).toBe(
        "Bitcoin price data required for market context analysis",
      );
      expect(result.values.marketContextError).toBe(true);
    });
  });

  describe("Travel Provider", () => {
    it("should have correct metadata", () => {
      expect(travelProvider.name).toBe("travel");
      expect(travelProvider.position).toBe(5);
      expect(travelProvider.dynamic).toBeUndefined();
      expect(travelProvider.private).toBeUndefined();
    });

    it("should provide travel booking data", async () => {
      const result = await travelProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("TRAVEL CONTEXT");
      expect(result.values).toHaveProperty("travelAvailable");
      expect(result.values).toHaveProperty("hotelsCount");
      expect(result.values).toHaveProperty("currentDeals");
      expect(result.values).toHaveProperty("currentSeason");
      expect(result.values).toHaveProperty("bestDestinations");
      expect(result.values).toHaveProperty("hotels");
      expect(result.values).toHaveProperty("deals");
      expect(result.values.travelAvailable).toBe(true);
    });

    it("should handle travel service unavailability gracefully", async () => {
      const mockRuntimeNoService = {
        getService: vi.fn().mockReturnValue(null),
      } as any;

      const result = await travelProvider.get(
        mockRuntimeNoService,
        mockMessage,
        mockState,
      );

      expect(result.text).toBe(
        "Travel booking services temporarily unavailable.",
      );
      expect(result.values.travelAvailable).toBe(false);
      expect(result.values.error).toBe("Service not found");
    });

    it("should handle no travel data gracefully", async () => {
      const mockRuntimeNoData = {
        getService: vi.fn().mockReturnValue({
          getTravelData: vi.fn().mockReturnValue(null),
          getTravelInsights: vi.fn().mockReturnValue(null),
          getOptimalBookingWindows: vi.fn().mockReturnValue([]),
          getCuratedHotels: vi.fn().mockReturnValue([]),
        }),
      } as any;

      const result = await travelProvider.get(
        mockRuntimeNoData,
        mockMessage,
        mockState,
      );

      expect(result.text).toBe(
        "Travel data is being updated. Please try again in a few moments.",
      );
      expect(result.values.travelAvailable).toBe(false);
      expect(result.values.updating).toBe(true);
    });

    it("should handle travel service errors gracefully", async () => {
      const mockRuntimeError = {
        getService: vi.fn().mockReturnValue({
          getTravelData: vi.fn().mockImplementation(() => {
            throw new Error("Travel service error");
          }),
        }),
      } as any;

      const result = await travelProvider.get(
        mockRuntimeError,
        mockMessage,
        mockState,
      );

      expect(result.text).toBe(
        "Travel booking services encountered an error. Please try again later.",
      );
      expect(result.values.travelAvailable).toBe(false);
      expect(result.values.error).toBe("Travel service error");
    });

    it("should include travel provider in dynamic providers", () => {
      expect(dynamicProviders).toContain(travelProvider);
    });
  });

  describe("Altcoin Provider", () => {
    it("should have correct metadata", () => {
      expect(altcoinProvider.name).toBe("altcoin");
      expect(altcoinProvider.position).toBe(3);
      expect(altcoinProvider.dynamic).toBe(true);
    });

    it("should provide altcoin market data", async () => {
      const result = await altcoinProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("ALTCOIN MARKET CONTEXT");
      expect(result.values).toHaveProperty("altcoinDataAvailable");
      expect(result.values).toHaveProperty("curatedAltcoinsCount");
      expect(result.values).toHaveProperty("outperformingBtcCount");
      expect(result.values.altcoinDataAvailable).toBe(true);
    });
  });

  describe("Stock Provider", () => {
    it("should have correct metadata", () => {
      expect(stockProvider.name).toBe("stock");
      expect(stockProvider.position).toBe(2);
      expect(stockProvider.dynamic).toBeUndefined();
      expect(stockProvider.private).toBeUndefined();
    });

    it("should provide stock market data", async () => {
      const result = await stockProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("STOCK MARKET CONTEXT");
      expect(result.values).toHaveProperty("stockDataAvailable");
      expect(result.values).toHaveProperty("totalStocksTracked");
      expect(result.values).toHaveProperty("mag7Count");
      expect(result.values).toHaveProperty("bitcoinStocksCount");
      expect(result.values).toHaveProperty("marketSentiment");
      expect(result.values).toHaveProperty("mag7AveragePerformance");
      expect(result.values).toHaveProperty("sp500Performance");
      expect(result.values.stockDataAvailable).toBe(true);
    });
  });

  describe("NFT Provider", () => {
    it("should have correct metadata", () => {
      expect(nftProvider.name).toBe("nft");
      expect(nftProvider.position).toBe(4);
      expect(nftProvider.dynamic).toBe(true);
    });

    it("should provide NFT market data", async () => {
      const result = await nftProvider.get(mockRuntime, mockMessage, mockState);

      expect(result.text).toContain("NFT MARKET CONTEXT");
      expect(result.values).toHaveProperty("nftDataAvailable");
      expect(result.values).toHaveProperty("collectionsCount");
      expect(result.values).toHaveProperty("totalVolume24h");
      expect(result.values.nftDataAvailable).toBe(true);
    });
  });

  describe("Lifestyle Provider", () => {
    it("should have correct metadata", () => {
      expect(lifestyleProvider.name).toBe("lifestyle");
      expect(lifestyleProvider.position).toBe(6);
      expect(lifestyleProvider.dynamic).toBe(true);
    });

    it("should provide lifestyle and destination data", async () => {
      const result = await lifestyleProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("LIFESTYLE & DESTINATIONS CONTEXT");
      expect(result.values).toHaveProperty("lifestyleDataAvailable");
      expect(result.values).toHaveProperty("destinationsCount");
      expect(result.values).toHaveProperty("bestWeatherCity");
      expect(result.values.lifestyleDataAvailable).toBe(true);
    });
  });

  describe("Network Health Provider", () => {
    it("should have correct metadata", () => {
      expect(networkHealthProvider.name).toBe("networkHealth");
      expect(networkHealthProvider.position).toBe(1);
      expect(networkHealthProvider.dynamic).toBeUndefined();
      expect(networkHealthProvider.private).toBeUndefined();
    });

    it("should provide Bitcoin network health data", async () => {
      const result = await networkHealthProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("BITCOIN NETWORK HEALTH");
      expect(result.values).toHaveProperty("networkDataAvailable");
      expect(result.values).toHaveProperty("blockHeight");
      expect(result.values).toHaveProperty("hashRate");
      expect(result.values).toHaveProperty("mempoolSize");
      expect(result.values.networkDataAvailable).toBe(true);
    });
  });

  describe("Opportunity Provider", () => {
    it("should have correct metadata", () => {
      expect(opportunityProvider.name).toBe("opportunity");
      expect(opportunityProvider.position).toBe(8);
      expect(opportunityProvider.private).toBe(true);
    });

    it("should provide investment opportunity data", async () => {
      const result = await opportunityProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("INVESTMENT OPPORTUNITIES");
      expect(result.values).toHaveProperty("opportunityDataAvailable");
      expect(result.values).toHaveProperty("activeAlertsCount");
      expect(result.values).toHaveProperty("accuracyRate");
      expect(result.values.opportunityDataAvailable).toBe(true);
    });
  });

  describe("Briefing Provider", () => {
    it("should have correct metadata", () => {
      expect(briefingProvider.name).toBe("briefing");
      expect(briefingProvider.position).toBe(9);
      expect(briefingProvider.private).toBe(true);
    });

    it("should provide intelligence briefing data", async () => {
      const result = await briefingProvider.get(
        mockRuntime,
        mockMessage,
        mockState,
      );

      expect(result.text).toContain("INTELLIGENCE BRIEFING");
      expect(result.values).toHaveProperty("briefingDataAvailable");
      expect(result.values).toHaveProperty("priorityLevel");
      expect(result.values).toHaveProperty("marketSentiment");
      expect(result.values.briefingDataAvailable).toBe(true);
    });
  });
});
