import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  elizaLogger,
  type ActionExample
} from '@elizaos/core';
import { TravelDataService, type TravelInsights, type SeasonalPricePattern } from '../services/TravelDataService';

interface InsightRequest {
  type: 'seasonal' | 'market' | 'events' | 'strategy' | 'overview';
  city?: string;
  timeframe?: 'month' | 'quarter' | 'year';
  interest?: 'budget' | 'luxury' | 'events' | 'weather';
}

interface TravelInsightResponse {
  type: string;
  insights: {
    seasonal?: SeasonalInsight;
    market?: MarketInsight;
    events?: EventInsight;
    strategy?: StrategyInsight;
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
  trend: 'increasing' | 'decreasing' | 'stable';
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
    impact: 'high' | 'medium' | 'low';
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

export const travelInsightsAction: Action = {
  name: "TRAVEL_INSIGHTS",
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
    "DESTINATION_INSIGHTS"
  ],
  description: "Provides comprehensive travel insights, seasonal analysis, market trends, and strategic booking advice",
  
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    
    // Insight and analysis keywords
    const insightKeywords = [
      'insights', 'analysis', 'trends', 'patterns', 'advice', 'strategy',
      'planning', 'forecast', 'outlook', 'overview', 'summary'
    ];
    
    // Travel and seasonal keywords
    const travelKeywords = [
      'travel', 'seasonal', 'season', 'weather', 'timing', 'when to',
      'best time', 'worst time', 'market', 'booking', 'vacation'
    ];
    
    // Specific insight requests
    const specificKeywords = [
      'what\'s the best', 'when should i', 'how do prices', 'trends in',
      'seasonal patterns', 'market conditions', 'booking advice', 'travel tips'
    ];
    
    const hasInsightKeyword = insightKeywords.some(keyword => text.includes(keyword));
    const hasTravelKeyword = travelKeywords.some(keyword => text.includes(keyword));
    const hasSpecificKeyword = specificKeywords.some(keyword => text.includes(keyword));
    
    // Activate if user wants insights/analysis or specific travel advice
    return (hasInsightKeyword && hasTravelKeyword) || hasSpecificKeyword;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      elizaLogger.info(`[TravelInsightsAction] Processing travel insights request: ${message.content.text}`);
      
      // Get the TravelDataService
      const travelService = runtime.getService('travel-data') as TravelDataService;
      if (!travelService) {
        elizaLogger.error('[TravelInsightsAction] TravelDataService not available');
        await callback({
          text: "❌ Travel insights service is currently unavailable. Please try again later.",
          content: { error: "TravelDataService not found" }
        });
        return;
      }

      // Parse insight request
      const insightRequest = await parseInsightRequest(runtime, message.content.text);
      elizaLogger.info(`[TravelInsightsAction] Parsed insight request:`, insightRequest);

      // Get travel insights data
      const travelInsights = travelService.getTravelInsights();
      if (!travelInsights) {
        elizaLogger.warn('[TravelInsightsAction] No travel insights available, forcing update');
        await travelService.forceUpdate();
      }

      // Generate comprehensive insights
      const insights = await generateTravelInsights(travelService, insightRequest);
      
      // Generate insights response
      const response = await generateInsightsResponse(insightRequest, insights);
      
      elizaLogger.info(`[TravelInsightsAction] Generated insights response`);
      
      await callback({
        text: response,
        content: {
          action: "travel_insights",
          request: insightRequest,
          insights: {
            type: insights.type,
            keyTakeaways: insights.keyTakeaways,
            recommendationCount: insights.recommendations.length
          }
        }
      });

    } catch (error) {
      elizaLogger.error('[TravelInsightsAction] Error processing travel insights:', error);
      await callback({
        text: "❌ I encountered an error while generating travel insights. Please try again.",
        content: { error: error.message }
      });
    }
  },

  examples: []
};

async function parseInsightRequest(runtime: IAgentRuntime, text: string): Promise<InsightRequest> {
  try {
    const text_lower = text.toLowerCase();
    const request: InsightRequest = { type: 'overview' };
    
    // Determine insight type
    if (text_lower.includes('seasonal') || text_lower.includes('season') || text_lower.includes('weather')) {
      request.type = 'seasonal';
    } else if (text_lower.includes('market') || text_lower.includes('trends') || text_lower.includes('pricing')) {
      request.type = 'market';
    } else if (text_lower.includes('events') || text_lower.includes('festivals') || text_lower.includes('grand prix')) {
      request.type = 'events';
    } else if (text_lower.includes('strategy') || text_lower.includes('planning') || text_lower.includes('booking advice')) {
      request.type = 'strategy';
    }
    
    // Extract specific city
    if (text_lower.includes('biarritz')) request.city = 'biarritz';
    else if (text_lower.includes('bordeaux')) request.city = 'bordeaux';
    else if (text_lower.includes('monaco')) request.city = 'monaco';
    
    // Extract timeframe
    if (text_lower.includes('this month') || text_lower.includes('monthly')) {
      request.timeframe = 'month';
    } else if (text_lower.includes('quarter') || text_lower.includes('season')) {
      request.timeframe = 'quarter';
    } else if (text_lower.includes('year') || text_lower.includes('annual')) {
      request.timeframe = 'year';
    }
    
    // Extract interest
    if (text_lower.includes('budget') || text_lower.includes('cheap') || text_lower.includes('savings')) {
      request.interest = 'budget';
    } else if (text_lower.includes('luxury') || text_lower.includes('premium') || text_lower.includes('high-end')) {
      request.interest = 'luxury';
    } else if (text_lower.includes('events') || text_lower.includes('festivals') || text_lower.includes('activities')) {
      request.interest = 'events';
    } else if (text_lower.includes('weather') || text_lower.includes('climate') || text_lower.includes('temperature')) {
      request.interest = 'weather';
    }
    
    return request;
  } catch (error) {
    elizaLogger.error('[TravelInsightsAction] Error parsing insight request:', error);
    return { type: 'overview' };
  }
}

async function generateTravelInsights(travelService: TravelDataService, request: InsightRequest): Promise<TravelInsightResponse> {
  const travelInsights = travelService.getTravelInsights();
  const hotels = travelService.getCuratedHotels();
  const optimalWindows = travelService.getOptimalBookingWindows();
  
  const response: TravelInsightResponse = {
    type: request.type,
    insights: {},
    recommendations: [],
    keyTakeaways: []
  };
  
  // Generate seasonal insights
  if (request.type === 'seasonal' || request.type === 'overview') {
    response.insights.seasonal = generateSeasonalInsights(travelInsights, request.city);
  }
  
  // Generate market insights
  if (request.type === 'market' || request.type === 'overview') {
    response.insights.market = generateMarketInsights(travelInsights);
  }
  
  // Generate event insights
  if (request.type === 'events' || request.type === 'overview') {
    response.insights.events = generateEventInsights(request.city);
  }
  
  // Generate strategy insights
  if (request.type === 'strategy' || request.type === 'overview') {
    response.insights.strategy = generateStrategyInsights(travelInsights, optimalWindows, request.interest);
  }
  
  // Generate recommendations and key takeaways
  response.recommendations = generateRecommendations(request, response.insights);
  response.keyTakeaways = generateKeyTakeaways(request, response.insights);
  
  return response;
}

function generateSeasonalInsights(travelInsights: TravelInsights | null, city?: string): SeasonalInsight {
  const currentMonth = new Date().getMonth() + 1;
  const currentSeason = getCurrentSeasonName(currentMonth);
  
  // Default seasonal patterns if no insights available
  const bestMonths = [
    { month: 'April', reason: 'Spring weather, pre-summer rates', savings: 25 },
    { month: 'May', reason: 'Perfect weather, moderate pricing', savings: 20 },
    { month: 'September', reason: 'Post-summer, warm ocean, fewer crowds', savings: 35 },
    { month: 'October', reason: 'Mild weather, significant savings', savings: 40 }
  ];
  
  const worstMonths = [
    { month: 'July', reason: 'Peak summer demand, highest rates', premiumPercent: 150 },
    { month: 'August', reason: 'European vacation season, premium pricing', premiumPercent: 120 },
    { month: 'December', reason: 'Holiday season, limited availability', premiumPercent: 80 }
  ];
  
  const weatherConsiderations = [
    'April-May: Pleasant spring weather, blooming landscapes',
    'June-August: Peak summer, hot temperatures, crowded beaches',
    'September-October: Warm ocean temperatures, ideal conditions',
    'November-March: Mild winters, perfect for spa retreats'
  ];
  
  // Customize for specific cities
  if (city === 'monaco') {
    worstMonths.unshift({ month: 'May', reason: 'Monaco Grand Prix, rates spike 300%', premiumPercent: 300 });
  } else if (city === 'bordeaux') {
    worstMonths.push({ month: 'September', reason: 'Wine harvest season, premium rates', premiumPercent: 90 });
  }
  
  return {
    currentSeason,
    bestMonths,
    worstMonths,
    weatherConsiderations
  };
}

function generateMarketInsights(travelInsights: TravelInsights | null): MarketInsight {
  if (travelInsights?.marketTrends) {
    return {
      trend: travelInsights.marketTrends.trend,
      confidence: travelInsights.marketTrends.confidence,
      timeframe: travelInsights.marketTrends.timeframe,
      priceDirection: getPriceDirection(travelInsights.marketTrends.trend),
      demandDrivers: getDemandDrivers(travelInsights.marketTrends.trend)
    };
  }
  
  // Default market insight
  return {
    trend: 'stable',
    confidence: 75,
    timeframe: 'next 6 months',
    priceDirection: 'Stable with seasonal variations',
    demandDrivers: [
      'European travel recovery post-pandemic',
      'Luxury segment resilience',
      'Remote work driving longer stays',
      'Sustainable travel preferences'
    ]
  };
}

function generateEventInsights(city?: string): EventInsight {
  const upcomingEvents = [];
  
  // Monaco events
  if (!city || city === 'monaco') {
    upcomingEvents.push({
      event: 'Monaco Grand Prix',
      city: 'Monaco',
      month: 'May',
      impact: 'high' as const,
      priceIncrease: 300,
      bookingAdvice: 'Book 8+ months ahead or avoid entirely'
    });
  }
  
  // Bordeaux events
  if (!city || city === 'bordeaux') {
    upcomingEvents.push({
      event: 'Wine Harvest Season',
      city: 'Bordeaux',
      month: 'September',
      impact: 'high' as const,
      priceIncrease: 120,
      bookingAdvice: 'Book 4-6 months ahead or consider October'
    });
  }
  
  // Biarritz events
  if (!city || city === 'biarritz') {
    upcomingEvents.push({
      event: 'Biarritz Surf Festival',
      city: 'Biarritz',
      month: 'July',
      impact: 'medium' as const,
      priceIncrease: 60,
      bookingAdvice: 'Book 3+ months ahead for beachfront properties'
    });
  }
  
  const avoidanceTips = [
    'Monitor local event calendars when booking',
    'Consider shoulder seasons for better availability',
    'Book accommodation outside event areas for savings',
    'Use flexible dates to avoid premium periods'
  ];
  
  return { upcomingEvents, avoidanceTips };
}

function generateStrategyInsights(travelInsights: TravelInsights | null, optimalWindows: any[], interest?: string): StrategyInsight {
  const strategies = {
    budget: {
      optimalBookingWindow: '3-6 months ahead for shoulder season',
      flexibilityBenefits: [
        'Save 40-60% vs peak season',
        'Better availability and room selection',
        'Avoid crowds and premium service charges'
      ],
      seasonalStrategy: 'Target November-March for maximum savings',
      budgetOptimization: [
        'Book Monday-Thursday arrivals for better rates',
        'Consider 7+ night stays for discounts',
        'Monitor flash sales and last-minute deals'
      ]
    },
    luxury: {
      optimalBookingWindow: '6-12 months ahead for peak experiences',
      flexibilityBenefits: [
        'Access to premium suites and amenities',
        'Priority spa and dining reservations',
        'Complimentary upgrades and services'
      ],
      seasonalStrategy: 'Book peak season early for best luxury properties',
      budgetOptimization: [
        'Package deals with spa and dining credits',
        'Extended stays for VIP recognition',
        'Direct booking benefits and loyalty programs'
      ]
    }
  };
  
  const selectedStrategy = strategies[interest as keyof typeof strategies] || strategies.budget;
  
  return {
    optimalBookingWindow: selectedStrategy.optimalBookingWindow,
    flexibilityBenefits: selectedStrategy.flexibilityBenefits,
    seasonalStrategy: selectedStrategy.seasonalStrategy,
    budgetOptimization: selectedStrategy.budgetOptimization
  };
}

function generateRecommendations(request: InsightRequest, insights: any): string[] {
  const recommendations = [];
  
  if (request.type === 'seasonal' || request.type === 'overview') {
    recommendations.push('Book shoulder seasons (April-May, September-October) for optimal weather and value');
    recommendations.push('Avoid July-August peak season unless budget allows premium pricing');
  }
  
  if (request.type === 'market' || request.type === 'overview') {
    recommendations.push('Monitor market trends for optimal booking timing');
    recommendations.push('Consider flexible dates to capitalize on rate fluctuations');
  }
  
  if (request.type === 'events' || request.type === 'overview') {
    recommendations.push('Check local event calendars before booking to avoid premium pricing');
    recommendations.push('Book 4-6 months ahead for major events or consider alternative dates');
  }
  
  if (request.type === 'strategy' || request.type === 'overview') {
    recommendations.push('Use 3-6 month booking window for best balance of rates and availability');
    recommendations.push('Consider 7+ night stays for package deals and discounts');
  }
  
  return recommendations;
}

function generateKeyTakeaways(request: InsightRequest, insights: any): string[] {
  const takeaways = [];
  
  if (insights.seasonal) {
    takeaways.push(`Best value months offer 25-40% savings vs peak season`);
  }
  
  if (insights.market) {
    takeaways.push(`Market trend: ${insights.market.trend} with ${insights.market.confidence}% confidence`);
  }
  
  if (insights.events) {
    takeaways.push(`Major events can increase rates by 60-300% - plan accordingly`);
  }
  
  if (insights.strategy) {
    takeaways.push(`Optimal booking window: ${insights.strategy.optimalBookingWindow}`);
  }
  
  takeaways.push('Flexibility in dates is key to maximizing value and experience');
  
  return takeaways;
}

async function generateInsightsResponse(request: InsightRequest, insights: TravelInsightResponse): Promise<string> {
  let response = `📊 **Travel Insights & Strategic Analysis**\n\n`;
  
  // Seasonal insights
  if (insights.insights.seasonal) {
    const seasonal = insights.insights.seasonal;
    response += `🌤️ **SEASONAL ANALYSIS**\n\n`;
    response += `📅 **Current Season**: ${seasonal.currentSeason}\n\n`;
    
    response += `✅ **BEST VALUE MONTHS**:\n`;
    seasonal.bestMonths.slice(0, 3).forEach(month => {
      response += `• **${month.month}**: ${month.reason} (${month.savings}% savings)\n`;
    });
    
    response += `\n❌ **AVOID THESE PERIODS**:\n`;
    seasonal.worstMonths.slice(0, 3).forEach(month => {
      response += `• **${month.month}**: ${month.reason} (+${month.premiumPercent}% premium)\n`;
    });
    response += `\n`;
  }
  
  // Market insights
  if (insights.insights.market) {
    const market = insights.insights.market;
    response += `📈 **MARKET TRENDS**\n\n`;
    response += `📊 **Trend**: ${market.trend.toUpperCase()} (${market.confidence}% confidence)\n`;
    response += `🎯 **Outlook**: ${market.priceDirection}\n`;
    response += `⏰ **Timeframe**: ${market.timeframe}\n\n`;
    
    response += `🔍 **Demand Drivers**:\n`;
    market.demandDrivers.slice(0, 3).forEach(driver => {
      response += `• ${driver}\n`;
    });
    response += `\n`;
  }
  
  // Event insights
  if (insights.insights.events) {
    const events = insights.insights.events;
    response += `🎭 **EVENT IMPACT ANALYSIS**\n\n`;
    
    if (events.upcomingEvents.length > 0) {
      response += `⚠️ **HIGH-IMPACT EVENTS**:\n`;
      events.upcomingEvents.forEach(event => {
        response += `• **${event.event}** (${event.city}, ${event.month})\n`;
        response += `  Rate increase: +${event.priceIncrease}% | ${event.bookingAdvice}\n`;
      });
      response += `\n`;
    }
  }
  
  // Strategy insights
  if (insights.insights.strategy) {
    const strategy = insights.insights.strategy;
    response += `🎯 **BOOKING STRATEGY**\n\n`;
    response += `⏰ **Optimal Window**: ${strategy.optimalBookingWindow}\n`;
    response += `🔄 **Seasonal Strategy**: ${strategy.seasonalStrategy}\n\n`;
    
    response += `💡 **Optimization Tips**:\n`;
    strategy.budgetOptimization.slice(0, 3).forEach(tip => {
      response += `• ${tip}\n`;
    });
    response += `\n`;
  }
  
  // Key recommendations
  response += `🎯 **KEY RECOMMENDATIONS**\n\n`;
  insights.recommendations.slice(0, 4).forEach((rec, index) => {
    response += `${index + 1}. ${rec}\n`;
  });
  
  // Key takeaways
  response += `\n💎 **KEY TAKEAWAYS**\n\n`;
  insights.keyTakeaways.forEach(takeaway => {
    response += `• ${takeaway}\n`;
  });
  
  return response;
}

// Helper functions
function getCurrentSeasonName(month: number): string {
  if ([12, 1, 2].includes(month)) return 'Winter';
  if ([3, 4, 5].includes(month)) return 'Spring';
  if ([6, 7, 8].includes(month)) return 'Summer';
  return 'Fall';
}

function getPriceDirection(trend: string): string {
  switch (trend) {
    case 'increasing': return 'Gradual price increases expected';
    case 'decreasing': return 'Favorable pricing conditions ahead';
    case 'stable': 
    default: return 'Stable with seasonal variations';
  }
}

function getDemandDrivers(trend: string): string[] {
  const commonDrivers = [
    'European travel recovery trends',
    'Luxury segment resilience',
    'Remote work driving extended stays',
    'Sustainable travel preferences'
  ];
  
  if (trend === 'increasing') {
    return [
      'Increased leisure travel demand',
      'Premium accommodation shortages',
      ...commonDrivers.slice(0, 2)
    ];
  } else if (trend === 'decreasing') {
    return [
      'Economic headwinds affecting luxury travel',
      'Increased inventory and competition',
      ...commonDrivers.slice(0, 2)
    ];
  }
  
  return commonDrivers;
} 