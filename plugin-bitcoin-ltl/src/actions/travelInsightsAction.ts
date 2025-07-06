import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from "@elizaos/core";
import {
  createActionTemplate,
  ValidationPatterns,
  ResponseCreators,
} from "./base/ActionTemplate";
import { TravelDataService } from "../services/TravelDataService";
import { CulturalContextService } from "../services/CulturalContextService";

interface InsightRequest {
  type: "seasonal" | "market" | "events" | "strategy" | "overview";
  city?: string;
  timeframe?: "month" | "quarter" | "year";
  interest?: "budget" | "luxury" | "events" | "weather";
}

interface TravelInsightResponse {
  type: string;
  insights: {
    seasonal?: SeasonalInsight;
    market?: MarketInsight;
    events?: EventInsight;
    strategy?: StrategyInsight;
    perfectDays?: PerfectDayInsight;
  };
  recommendations: string[];
  keyTakeaways: string[];
}

interface SeasonalInsight {
  currentSeason: string;
  bestMonths: { month: string; reason: string; savings: number }[];
  worstMonths: { month: string; reason: string; premiumPercent: number }[];
  weatherConsiderations: string[];
}

interface MarketInsight {
  trend: "increasing" | "decreasing" | "stable";
  confidence: number;
  timeframe: string;
  priceDirection: string;
  demandDrivers: string[];
}

interface EventInsight {
  upcomingEvents: {
    event: string;
    city: string;
    month: string;
    impact: "high" | "medium" | "low";
    priceIncrease: number;
    bookingAdvice: string;
  }[];
  avoidanceTips: string[];
}

interface StrategyInsight {
  optimalBookingWindow: string;
  flexibilityBenefits: string[];
  seasonalStrategy: string;
  budgetOptimization: string[];
}

interface PerfectDayInsight {
  opportunities: {
    hotelName: string;
    date: string;
    currentRate: number;
    averageRate: number;
    savingsPercentage: number;
    urgency: "high" | "medium" | "low";
    confidenceScore: number;
  }[];
  summary: {
    totalOpportunities: number;
    highUrgencyCount: number;
    averageSavings: number;
    bestOpportunity: string;
  };
}

export const travelInsightsAction: Action = createActionTemplate({
  name: "TRAVEL_INSIGHTS",
  description:
    "Provides comprehensive travel insights, seasonal analysis, market trends, and strategic booking advice with Bitcoin-enabled travel philosophy",
  similes: [
    "TRAVEL_ANALYSIS",
    "SEASONAL_INSIGHTS",
    "TRAVEL_TRENDS",
    "BOOKING_STRATEGY",
    "TRAVEL_PLANNING",
    "MARKET_ANALYSIS",
    "TRAVEL_ADVICE",
    "SEASONAL_TRAVEL",
    "TRAVEL_PATTERNS",
    "DESTINATION_INSIGHTS",
  ],

  examples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "What are the best travel insights for Monaco this season?",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "Monaco seasonal insights: Currently winter (optimal savings season). Best months: Apr-May (25% savings, mild weather), Sept-Oct (35% savings, warm ocean). Avoid: May (Grand Prix +300%), Jul-Aug (peak +150%). Winter strategy: Book 3-6 months ahead for maximum value. Bitcoin wealth creates booking flexibility.",
          thought:
            "User wants seasonal travel insights for Monaco. I need to analyze current season, identify optimal booking windows, highlight event impacts, and provide strategic guidance while maintaining Bitcoin-enabled travel philosophy.",
          actions: ["TRAVEL_INSIGHTS"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "Give me travel market analysis and trends for French Riviera",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "French Riviera market analysis: Trend - stable (75% confidence), luxury segment resilient, remote work driving extended stays. Demand drivers: European travel recovery, sustainable preferences. Strategy: Book 6-12 months ahead for peak season, shoulder seasons offer 40% savings. Sound money, smart timing.",
          thought:
            "User requesting comprehensive market analysis for French Riviera. I need to analyze current trends, identify demand drivers, assess price directions, and provide strategic recommendations with Bitcoin travel philosophy.",
          actions: ["TRAVEL_INSIGHTS"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "What's the best travel strategy for luxury hotels this year?",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "Luxury travel strategy 2024: Optimal window - 6-12 months ahead for peak access. Best value: Apr-May, Sept-Oct (30% savings). Market trend: stable with luxury resilience. Key: Direct booking benefits, VIP recognition, package deals. Bitcoin enables premium positioning and flexible timing.",
          thought:
            "User seeking luxury travel strategy insights. I need to analyze optimal booking windows, identify value periods, assess market conditions, and provide strategic guidance for maximizing luxury travel experiences with Bitcoin wealth.",
          actions: ["TRAVEL_INSIGHTS"],
        },
      },
    ],
  ],

  validateFn: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return ValidationPatterns.isTravelInsightsRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    logger.info("Travel insights action triggered");

    const thoughtProcess =
      "User is requesting travel insights and strategic analysis. I need to analyze seasonal patterns, market trends, event impacts, and provide strategic guidance while maintaining Bitcoin-enabled travel philosophy.";

    try {
      const travelService = runtime.getService(
        "travel-data",
      ) as TravelDataService;

      const culturalService = runtime.getService(
        "cultural-context",
      ) as unknown as CulturalContextService;

      if (!travelService) {
        logger.warn("TravelDataService not available");

        const fallbackResponse = ResponseCreators.createErrorResponse(
          "TRAVEL_INSIGHTS",
          "Travel insights service unavailable",
          "Travel insights service temporarily unavailable. Like Bitcoin price analysis, luxury travel insights require comprehensive data flows.",
        );

        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Parse insight request from message
      const messageText = message.content?.text || "";
      const insightRequest = parseInsightRequest(messageText);

      // Get travel insights data
      const travelInsights = travelService.getTravelInsights();
      if (!travelInsights) {
        logger.warn("No travel insights available");

        const noDataResponse = ResponseCreators.createErrorResponse(
          "TRAVEL_INSIGHTS",
          "Travel insights data unavailable",
          "Travel insights data temporarily unavailable. Like blockchain synchronization, comprehensive analysis requires complete data sets.",
        );

        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Generate comprehensive insights with cultural context
      const insights = await generateTravelInsights(travelService, culturalService, insightRequest);

      // Generate insights response
      const responseText = generateInsightsResponse(insightRequest, insights);

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        responseText,
        "TRAVEL_INSIGHTS",
        {
          request: insightRequest,
          insightType: insights.type,
          keyTakeaways: insights.keyTakeaways,
          recommendationCount: insights.recommendations.length,
          seasonal: insights.insights.seasonal ? "included" : "not included",
          market: insights.insights.market ? "included" : "not included",
          events: insights.insights.events ? "included" : "not included",
          strategy: insights.insights.strategy ? "included" : "not included",
        },
      );

      if (callback) {
        await callback(response);
      }

      logger.info("Travel insights delivered successfully");
      return true;
    } catch (error) {
      logger.error(
        "Failed to process travel insights:",
        (error as Error).message,
      );

      const errorResponse = ResponseCreators.createErrorResponse(
        "TRAVEL_INSIGHTS",
        (error as Error).message,
        "Travel insights analysis failed. Like Bitcoin network analysis, sometimes comprehensive insights require patience and multiple data sources.",
      );

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },
});

/**
 * Parse insight request from message text
 */
function parseInsightRequest(text: string): InsightRequest {
  const request: InsightRequest = { type: "overview" };

  // Determine insight type
  if (
    text.includes("seasonal") ||
    text.includes("season") ||
    text.includes("weather")
  ) {
    request.type = "seasonal";
  } else if (
    text.includes("market") ||
    text.includes("trends") ||
    text.includes("pricing")
  ) {
    request.type = "market";
  } else if (
    text.includes("events") ||
    text.includes("festivals") ||
    text.includes("grand prix")
  ) {
    request.type = "events";
  } else if (
    text.includes("strategy") ||
    text.includes("planning") ||
    text.includes("booking advice")
  ) {
    request.type = "strategy";
  }

  // Extract specific city
  if (text.includes("biarritz")) request.city = "biarritz";
  else if (text.includes("bordeaux")) request.city = "bordeaux";
  else if (text.includes("monaco")) request.city = "monaco";

  // Extract timeframe
  if (text.includes("this month") || text.includes("monthly")) {
    request.timeframe = "month";
  } else if (text.includes("quarter") || text.includes("season")) {
    request.timeframe = "quarter";
  } else if (text.includes("year") || text.includes("annual")) {
    request.timeframe = "year";
  }

  // Extract interest
  if (
    text.includes("budget") ||
    text.includes("cheap") ||
    text.includes("savings")
  ) {
    request.interest = "budget";
  } else if (
    text.includes("luxury") ||
    text.includes("premium") ||
    text.includes("high-end")
  ) {
    request.interest = "luxury";
  } else if (
    text.includes("events") ||
    text.includes("festivals") ||
    text.includes("activities")
  ) {
    request.interest = "events";
  } else if (
    text.includes("weather") ||
    text.includes("climate") ||
    text.includes("temperature")
  ) {
    request.interest = "weather";
  }

  return request;
}

/**
 * Generate comprehensive travel insights
 */
async function generateTravelInsights(
  travelService: TravelDataService,
  culturalService: CulturalContextService,
  request: InsightRequest,
): Promise<TravelInsightResponse> {
  const travelInsights = travelService.getTravelInsights();
  const hotels = travelService.getCuratedHotels() || [];
  const optimalWindows = travelService.getOptimalBookingWindows() || [];

  const response: TravelInsightResponse = {
    type: request.type,
    insights: {},
    recommendations: [],
    keyTakeaways: [],
  };

  // Generate seasonal insights
  if (request.type === "seasonal" || request.type === "overview") {
    response.insights.seasonal = generateSeasonalInsights(
      travelInsights,
      request.city,
    );
  }

  // Generate market insights
  if (request.type === "market" || request.type === "overview") {
    response.insights.market = generateMarketInsights(travelInsights);
  }

  // Generate event insights
  if (request.type === "events" || request.type === "overview") {
    response.insights.events = generateEventInsights(request.city);
  }

  // Generate strategy insights
  if (request.type === "strategy" || request.type === "overview") {
    response.insights.strategy = generateStrategyInsights(
      travelInsights,
      optimalWindows,
      request.interest,
    );
  }

  // Add perfect day opportunities to insights
  if (request.type === "overview" || request.type === "strategy") {
    response.insights.perfectDays = await generatePerfectDayInsights(travelService, request.city);
  }

  // Generate recommendations and key takeaways
  response.recommendations = generateRecommendations(
    request,
    response.insights,
  );
  response.keyTakeaways = generateKeyTakeaways(request, response.insights);

  // Add cultural context if city is specified
  if (request.city) {
    try {
      const culturalContext = await culturalService.getCulturalContext(request.city);
      if (culturalContext) {
        const seasonalInsights = await culturalService.getSeasonalInsights(request.city);
        const lifestyleIntegration = await culturalService.getLifestyleIntegration(request.city);
        
        // Add cultural recommendations
        response.recommendations.push(
          `Experience ${culturalContext.perfectDayContext.culturalExperiences[0] || 'local cultural experiences'}`,
          `Immerse in ${culturalContext.city}'s ${culturalContext.culturalHeritage.architecturalStyle.toLowerCase()}`,
          `Discover ${culturalContext.perfectDayContext.hiddenGems[0] || 'hidden local gems'}`
        );

        // Add cultural key takeaways
        response.keyTakeaways.push(
          `${culturalContext.city} offers ${culturalContext.wealthPreservation.culturalCapital[0] || 'rich cultural capital'}`,
          `Seasonal highlight: ${seasonalInsights[0] || 'unique seasonal experiences'}`,
          `Bitcoin lifestyle integration: ${lifestyleIntegration[0] || 'sound money principles with luxury'}`
        );
      }
    } catch (error) {
      logger.warn(`Failed to add cultural context for ${request.city}: ${error}`);
    }
  }

  return response;
}

/**
 * Generate perfect day insights
 */
async function generatePerfectDayInsights(
  travelService: TravelDataService,
  city?: string,
): Promise<PerfectDayInsight> {
  try {
    const perfectDays = await travelService.getHybridPerfectDays();
    
    // Filter by city if specified
    let filteredOpportunities = perfectDays;
    if (city) {
      const hotels = travelService.getCuratedHotels() || [];
      filteredOpportunities = perfectDays.filter(opp => {
        const hotel = hotels.find(h => h.hotelId === opp.hotelId);
        return hotel && hotel.city?.toLowerCase() === city.toLowerCase();
      });
    }

    const highUrgencyCount = filteredOpportunities.filter(p => p.urgency === 'high').length;
    const averageSavings = filteredOpportunities.length > 0 
      ? filteredOpportunities.reduce((sum, p) => sum + p.savingsPercentage, 0) / filteredOpportunities.length 
      : 0;
    
    const bestOpportunity = filteredOpportunities.length > 0 
      ? `${filteredOpportunities[0].hotelName} on ${filteredOpportunities[0].perfectDate} (${filteredOpportunities[0].savingsPercentage.toFixed(1)}% savings)`
      : 'None available';

    return {
      opportunities: filteredOpportunities.map(opp => ({
        hotelName: opp.hotelName,
        date: opp.perfectDate,
        currentRate: opp.currentRate,
        averageRate: opp.averageRate,
        savingsPercentage: opp.savingsPercentage,
        urgency: opp.urgency,
        confidenceScore: opp.confidenceScore,
      })),
      summary: {
        totalOpportunities: filteredOpportunities.length,
        highUrgencyCount,
        averageSavings,
        bestOpportunity,
      },
    };
  } catch (error) {
    logger.error('Error generating perfect day insights:', error);
    return {
      opportunities: [],
      summary: {
        totalOpportunities: 0,
        highUrgencyCount: 0,
        averageSavings: 0,
        bestOpportunity: 'None available',
      },
    };
  }
}

/**
 * Generate seasonal insights
 */
function generateSeasonalInsights(
  travelInsights: any,
  city?: string,
): SeasonalInsight {
  const currentMonth = new Date().getMonth() + 1;
  const currentSeason = getCurrentSeasonName(currentMonth);

  // Default seasonal patterns
  const bestMonths = [
    { month: "April", reason: "Spring weather, pre-summer rates", savings: 25 },
    { month: "May", reason: "Perfect weather, moderate pricing", savings: 20 },
    {
      month: "September",
      reason: "Post-summer, warm ocean, fewer crowds",
      savings: 35,
    },
    {
      month: "October",
      reason: "Mild weather, significant savings",
      savings: 40,
    },
  ];

  const worstMonths = [
    {
      month: "July",
      reason: "Peak summer demand, highest rates",
      premiumPercent: 150,
    },
    {
      month: "August",
      reason: "European vacation season, premium pricing",
      premiumPercent: 120,
    },
    {
      month: "December",
      reason: "Holiday season, limited availability",
      premiumPercent: 80,
    },
  ];

  const weatherConsiderations = [
    "April-May: Pleasant spring weather, blooming landscapes",
    "June-August: Peak summer, hot temperatures, crowded beaches",
    "September-October: Warm ocean temperatures, ideal conditions",
    "November-March: Mild winters, perfect for spa retreats",
  ];

  // Customize for specific cities
  if (city === "monaco") {
    worstMonths.unshift({
      month: "May",
      reason: "Monaco Grand Prix, rates spike 300%",
      premiumPercent: 300,
    });
  } else if (city === "bordeaux") {
    worstMonths.push({
      month: "September",
      reason: "Wine harvest season, premium rates",
      premiumPercent: 90,
    });
  }

  return {
    currentSeason,
    bestMonths,
    worstMonths,
    weatherConsiderations,
  };
}

/**
 * Generate market insights
 */
function generateMarketInsights(travelInsights: any): MarketInsight {
  if (travelInsights?.marketTrends) {
    return {
      trend: travelInsights.marketTrends.trend,
      confidence: travelInsights.marketTrends.confidence,
      timeframe: travelInsights.marketTrends.timeframe,
      priceDirection: getPriceDirection(travelInsights.marketTrends.trend),
      demandDrivers: getDemandDrivers(travelInsights.marketTrends.trend),
    };
  }

  // Default market insight
  return {
    trend: "stable",
    confidence: 75,
    timeframe: "next 6 months",
    priceDirection: "Stable with seasonal variations",
    demandDrivers: [
      "European travel recovery post-pandemic",
      "Luxury segment resilience",
      "Remote work driving longer stays",
      "Sustainable travel preferences",
    ],
  };
}

/**
 * Generate event insights
 */
function generateEventInsights(city?: string): EventInsight {
  const upcomingEvents = [];

  // Monaco events
  if (!city || city === "monaco") {
    upcomingEvents.push({
      event: "Monaco Grand Prix",
      city: "Monaco",
      month: "May",
      impact: "high" as const,
      priceIncrease: 300,
      bookingAdvice: "Book 8+ months ahead or avoid entirely",
    });
  }

  // Bordeaux events
  if (!city || city === "bordeaux") {
    upcomingEvents.push({
      event: "Wine Harvest Season",
      city: "Bordeaux",
      month: "September",
      impact: "high" as const,
      priceIncrease: 120,
      bookingAdvice: "Book 4-6 months ahead or consider October",
    });
  }

  // Biarritz events
  if (!city || city === "biarritz") {
    upcomingEvents.push({
      event: "Biarritz Surf Festival",
      city: "Biarritz",
      month: "July",
      impact: "medium" as const,
      priceIncrease: 60,
      bookingAdvice: "Book 3+ months ahead for beachfront properties",
    });
  }

  const avoidanceTips = [
    "Monitor local event calendars when booking",
    "Consider shoulder seasons for better availability",
    "Book accommodation outside event areas for savings",
    "Use flexible dates to avoid premium periods",
  ];

  return { upcomingEvents, avoidanceTips };
}

/**
 * Generate strategy insights
 */
function generateStrategyInsights(
  travelInsights: any,
  optimalWindows: any[],
  interest?: string,
): StrategyInsight {
  const strategies = {
    budget: {
      optimalBookingWindow: "3-6 months ahead for shoulder season",
      flexibilityBenefits: [
        "Save 40-60% vs peak season",
        "Better availability and room selection",
        "Avoid crowds and premium service charges",
      ],
      seasonalStrategy: "Target November-March for maximum savings",
      budgetOptimization: [
        "Book Monday-Thursday arrivals for better rates",
        "Consider 7+ night stays for discounts",
        "Monitor flash sales and last-minute deals",
      ],
    },
    luxury: {
      optimalBookingWindow: "6-12 months ahead for peak experiences",
      flexibilityBenefits: [
        "Access to premium suites and amenities",
        "Priority spa and dining reservations",
        "Complimentary upgrades and services",
      ],
      seasonalStrategy: "Book peak season early for best luxury properties",
      budgetOptimization: [
        "Package deals with spa and dining credits",
        "Extended stays for VIP recognition",
        "Direct booking benefits and loyalty programs",
      ],
    },
  };

  const selectedStrategy =
    strategies[interest as keyof typeof strategies] || strategies.budget;

  return {
    optimalBookingWindow: selectedStrategy.optimalBookingWindow,
    flexibilityBenefits: selectedStrategy.flexibilityBenefits,
    seasonalStrategy: selectedStrategy.seasonalStrategy,
    budgetOptimization: selectedStrategy.budgetOptimization,
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  request: InsightRequest,
  insights: any,
): string[] {
  const recommendations = [];

  if (request.type === "seasonal" || request.type === "overview") {
    recommendations.push(
      "Book shoulder seasons (April-May, September-October) for optimal weather and value",
    );
    recommendations.push(
      "Avoid July-August peak season unless budget allows premium pricing",
    );
  }

  if (request.type === "market" || request.type === "overview") {
    recommendations.push("Monitor market trends for optimal booking timing");
    recommendations.push(
      "Consider flexible dates to capitalize on rate fluctuations",
    );
  }

  if (request.type === "events" || request.type === "overview") {
    recommendations.push(
      "Check local event calendars before booking to avoid premium pricing",
    );
    recommendations.push(
      "Book 4-6 months ahead for major events or consider alternative dates",
    );
  }

  if (request.type === "strategy" || request.type === "overview") {
    recommendations.push(
      "Use 3-6 month booking window for best balance of rates and availability",
    );
    recommendations.push(
      "Consider 7+ night stays for package deals and discounts",
    );
  }

  return recommendations;
}

/**
 * Generate key takeaways
 */
function generateKeyTakeaways(
  request: InsightRequest,
  insights: any,
): string[] {
  const takeaways = [];

  if (insights.seasonal) {
    takeaways.push("Best value months offer 25-40% savings vs peak season");
  }

  if (insights.market) {
    takeaways.push(
      `Market trend: ${insights.market.trend} with ${insights.market.confidence}% confidence`,
    );
  }

  if (insights.events) {
    takeaways.push(
      "Major events can increase rates by 60-300% - plan accordingly",
    );
  }

  if (insights.strategy) {
    takeaways.push(
      `Optimal booking window: ${insights.strategy.optimalBookingWindow}`,
    );
  }

  takeaways.push(
    "Flexibility in dates is key to maximizing value and experience",
  );

  return takeaways;
}

/**
 * Generate insights response text
 */
function generateInsightsResponse(
  request: InsightRequest,
  insights: TravelInsightResponse,
): string {
  let responseText = "";

  // Seasonal insights
  if (insights.insights.seasonal) {
    const seasonal = insights.insights.seasonal;
    responseText += `${getCityDisplayName(request.city)} seasonal insights: Currently ${seasonal.currentSeason.toLowerCase()} (${getSeasonDescription(seasonal.currentSeason)}). `;

    responseText += `Best months: ${seasonal.bestMonths
      .slice(0, 2)
      .map(
        (m) => `${m.month} (${m.savings}% savings, ${m.reason.toLowerCase()})`,
      )
      .join(", ")}. `;

    responseText += `Avoid: ${seasonal.worstMonths
      .slice(0, 2)
      .map(
        (m) => `${m.month} (${m.reason.toLowerCase()} +${m.premiumPercent}%)`,
      )
      .join(", ")}. `;
  }

  // Market insights
  if (insights.insights.market) {
    const market = insights.insights.market;
    responseText += `Market analysis: Trend - ${market.trend} (${market.confidence}% confidence), ${market.demandDrivers.slice(0, 2).join(", ").toLowerCase()}. `;
  }

  // Strategy insights
  if (insights.insights.strategy) {
    const strategy = insights.insights.strategy;
    responseText += `Strategy: ${strategy.optimalBookingWindow}, ${strategy.seasonalStrategy.toLowerCase()}. `;
  }

  // Add Bitcoin travel philosophy
  const bitcoinQuotes = [
    "Bitcoin wealth creates booking flexibility.",
    "Sound money, smart timing.",
    "Hard money enables premium positioning.",
    "Stack sats, optimize stays.",
    "Digital sovereignty, analog luxury.",
  ];

  responseText +=
    bitcoinQuotes[Math.floor(Math.random() * bitcoinQuotes.length)];

  return responseText;
}

/**
 * Helper functions
 */
function getCurrentSeasonName(month: number): string {
  if ([12, 1, 2].includes(month)) return "Winter";
  if ([3, 4, 5].includes(month)) return "Spring";
  if ([6, 7, 8].includes(month)) return "Summer";
  return "Fall";
}

function getSeasonDescription(season: string): string {
  const descriptions = {
    Winter: "optimal savings season",
    Spring: "shoulder season value",
    Summer: "peak season premium",
    Fall: "shoulder season opportunity",
  };
  return (
    descriptions[season as keyof typeof descriptions] || "seasonal variation"
  );
}

function getPriceDirection(trend: string): string {
  switch (trend) {
    case "increasing":
      return "Gradual price increases expected";
    case "decreasing":
      return "Favorable pricing conditions ahead";
    case "stable":
    default:
      return "Stable with seasonal variations";
  }
}

function getDemandDrivers(trend: string): string[] {
  const commonDrivers = [
    "European travel recovery trends",
    "Luxury segment resilience",
    "Remote work driving extended stays",
    "Sustainable travel preferences",
  ];

  if (trend === "increasing") {
    return [
      "Increased leisure travel demand",
      "Premium accommodation shortages",
      ...commonDrivers.slice(0, 2),
    ];
  } else if (trend === "decreasing") {
    return [
      "Economic headwinds affecting luxury travel",
      "Increased inventory and competition",
      ...commonDrivers.slice(0, 2),
    ];
  }

  return commonDrivers;
}

function getCityDisplayName(city?: string): string {
  if (!city) return "Multi-destination";

  const cityMap: { [key: string]: string } = {
    biarritz: "Biarritz",
    bordeaux: "Bordeaux",
    monaco: "Monaco",
  };

  return cityMap[city] || city;
}
