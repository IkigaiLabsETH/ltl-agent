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
import { TravelDataService, PerfectDayOpportunity } from "../services/TravelDataService";

interface DealAlert {
  id: string;
  hotel: any;
  currentRate: number;
  previousRate: number;
  savings: number;
  savingsPercentage: number;
  validDates: string[];
  urgency: "high" | "medium" | "low";
  reason: string;
  actionRecommendation: string;
}

export const hotelDealAlertAction: Action = createActionTemplate({
  name: "HOTEL_DEAL_ALERT",
  description:
    "Monitor hotel rates and alert on significant price drops and booking opportunities with urgency-based recommendations",
  similes: [
    "HOTEL_ALERTS",
    "DEAL_ALERTS",
    "PRICE_ALERTS",
    "HOTEL_DEALS",
    "BOOKING_ALERTS",
    "SAVINGS_ALERTS",
    "RATE_MONITORING",
    "HOTEL_NOTIFICATIONS",
    "DEAL_FINDER",
    "PRICE_DROPS",
  ],

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "Any hotel deals available right now?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "🚨 Hotel deals: Ritz-Carlton €450/night (was €720, 37% off) Mar 15-20, Hotel du Palais €380/night (45% off) Apr 5-12. 2 urgent opportunities found. Book immediately - exceptional savings rarely available. Sound money enables swift decisions.",
          thought:
            "User wants current hotel deal alerts. I need to scan for price drops, assess urgency levels, identify booking windows, and provide actionable recommendations while maintaining Bitcoin-enabled travel philosophy.",
          actions: ["HOTEL_DEAL_ALERT"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Alert me to Monaco hotel discounts over 30%" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Monaco deal alert set: 30%+ savings threshold. Current: Hotel Hermitage €520/night (was €780, 33% off) Feb 20-25. High-urgency deal - Monaco rates rarely drop this much. Monitor daily for additional opportunities. Bitcoin wealth creates booking flexibility.",
          thought:
            "User setting up deal monitoring for Monaco with specific savings threshold. I should scan current deals meeting criteria, explain alert setup, and provide immediate opportunities while emphasizing Bitcoin-enabled decisiveness.",
          actions: ["HOTEL_DEAL_ALERT"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Show me luxury hotel price drops this week" },
      },
      {
        name: "Satoshi",
        content: {
          text: "📉 Luxury price drops: Four Seasons €580/night (was €850, 32% off), Conrad €420/night (was €650, 35% off), Le Bristol €690/night (was €920, 25% off). 3 deals found. Best window: next 7 days. Strike while rates are down.",
          thought:
            "User wants recent luxury hotel price drops. I need to identify significant rate reductions, categorize by urgency, provide booking windows, and emphasize the temporary nature of these opportunities.",
          actions: ["HOTEL_DEAL_ALERT"],
        },
      },
    ],
  ],

  validateFn: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return ValidationPatterns.isHotelDealRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    logger.info("Hotel deal alert action triggered");

    const thoughtProcess =
      "User is requesting hotel deal monitoring. I need to scan for price drops, assess urgency levels, identify booking opportunities, and provide actionable recommendations while maintaining Bitcoin travel philosophy.";

    try {
      const travelDataService = runtime.getService(
        "travel-data",
      ) as TravelDataService;

      if (!travelDataService) {
        logger.warn("TravelDataService not available");

        const fallbackResponse = ResponseCreators.createErrorResponse(
          "HOTEL_DEAL_ALERT",
          "Deal monitoring service unavailable",
          "Hotel deal monitoring temporarily unavailable. Like Bitcoin's price discovery, luxury travel deals require patience and timing.",
        );

        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Parse alert parameters from message
      const messageText = message.content?.text || "";
      const alertParams = extractAlertParameters(messageText);

      // Get current travel data
      const travelData = travelDataService.getTravelData();
      if (!travelData) {
        logger.warn("No travel data available for deal monitoring");

        const noDataResponse = ResponseCreators.createErrorResponse(
          "HOTEL_DEAL_ALERT",
          "Hotel data unavailable",
          "Hotel data temporarily unavailable. Like network congestion, sometimes data flows require patience.",
        );

        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Find current deals based on parameters
      const currentDeals = await findCurrentDeals(travelDataService, alertParams);

      if (currentDeals.length === 0) {
        logger.info("No current deals match criteria");

        const noDealsResponse = ResponseCreators.createStandardResponse(
          thoughtProcess,
          "No current deals match your criteria. I'll continue monitoring for opportunities and alert you when rates drop! Like Bitcoin accumulation, patience is rewarded.",
          "HOTEL_DEAL_ALERT",
          {
            dealCount: 0,
            monitoringActive: true,
            criteria: alertParams,
          },
        );

        if (callback) {
          await callback(noDealsResponse);
        }
        return true;
      }

      // Format deals response
      const responseText = formatDealsResponse(currentDeals, alertParams);

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        responseText,
        "HOTEL_DEAL_ALERT",
        {
          dealCount: currentDeals.length,
          highUrgencyDeals: currentDeals.filter((d) => d.urgency === "high")
            .length,
          totalSavings: currentDeals.reduce((sum, d) => sum + d.savings, 0),
          averageSavings:
            currentDeals.reduce((sum, d) => sum + d.savingsPercentage, 0) /
            currentDeals.length,
          bestDeal: currentDeals[0]?.hotel?.name,
        },
      );

      if (callback) {
        await callback(response);
      }

      logger.info("Hotel deal alerts delivered successfully");
      return true;
    } catch (error) {
      logger.error(
        "Failed to process hotel deal alerts:",
        (error as Error).message,
      );

      const errorResponse = ResponseCreators.createErrorResponse(
        "HOTEL_DEAL_ALERT",
        (error as Error).message,
        "Deal monitoring failed. Like Bitcoin's mempool, sometimes transactions need patience to clear.",
      );

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },
});

/**
 * Extract alert parameters from message text
 */
function extractAlertParameters(text: string): {
  cities?: string[];
  hotels?: string[];
  maxPrice?: number;
  minSavings?: number;
  alertType: string;
} {
  const params: {
    cities?: string[];
    hotels?: string[];
    maxPrice?: number;
    minSavings?: number;
    alertType: string;
  } = { alertType: "immediate" };

  // Extract cities
  const cities = [];
  if (text.toLowerCase().includes("biarritz")) cities.push("biarritz");
  if (text.toLowerCase().includes("bordeaux")) cities.push("bordeaux");
  if (text.toLowerCase().includes("monaco")) cities.push("monaco");
  if (cities.length > 0) params.cities = cities;

  // Extract hotel names
  const hotels = [];
  if (
    text.toLowerCase().includes("ritz") ||
    text.toLowerCase().includes("ritz-carlton")
  )
    hotels.push("Ritz-Carlton");
  if (text.toLowerCase().includes("four seasons")) hotels.push("Four Seasons");
  if (text.toLowerCase().includes("conrad")) hotels.push("Conrad");
  if (hotels.length > 0) params.hotels = hotels;

  // Extract max price
  const priceMatch = text.match(
    /(?:below|under|max|maximum)?\s*€?(\d+(?:,\d+)?)/i,
  );
  if (priceMatch) {
    params.maxPrice = parseInt(priceMatch[1].replace(",", ""));
  }

  // Extract minimum savings
  const savingsMatch = text.match(/(\d+)%\s*(?:savings|off|discount)/i);
  if (savingsMatch) {
    params.minSavings = parseInt(savingsMatch[1]);
  }

  return params;
}

/**
 * Find current deals based on parameters
 */
async function findCurrentDeals(
  travelService: TravelDataService,
  params: any,
): Promise<DealAlert[]> {
  const hotels = travelService.getCuratedHotels() || [];
  const optimalWindows = travelService.getOptimalBookingWindows() || [];
  const deals: DealAlert[] = [];

  // Get perfect day opportunities
  const perfectDays = await travelService.getPerfectDayOpportunities();

  // Filter hotels based on parameters
  let filteredHotels = hotels;

  if (params.cities && params.cities.length > 0) {
    filteredHotels = hotels.filter((hotel) =>
      params.cities.some(
        (city: string) => hotel.city?.toLowerCase() === city.toLowerCase(),
      ),
    );
  }

  if (params.hotels && params.hotels.length > 0) {
    filteredHotels = filteredHotels.filter((hotel) =>
      params.hotels.some((name: string) =>
        hotel.name?.toLowerCase().includes(name.toLowerCase()),
      ),
    );
  }

  // Find deals for each hotel
  for (const hotel of filteredHotels) {
    const optimalWindow = optimalWindows.find(
      (w) => w.hotelId === hotel.hotelId,
    );

    if (optimalWindow && optimalWindow.bestDates?.length > 0) {
      for (const bestDate of optimalWindow.bestDates.slice(0, 2)) {
        // Top 2 deals per hotel
        // Check if deal meets criteria
        if (params.maxPrice && bestDate.totalPrice > params.maxPrice) continue;
        if (params.minSavings && bestDate.savingsPercentage < params.minSavings)
          continue;

        const savings = bestDate.savings || 0;
        const savingsPercentage = bestDate.savingsPercentage || 0;

        // Determine urgency
        let urgency: "high" | "medium" | "low" = "low";
        if (savingsPercentage >= 40) urgency = "high";
        else if (savingsPercentage >= 25) urgency = "medium";

        // Generate reason and recommendation
        const reason = generateDealReason(bestDate, savingsPercentage);
        const actionRecommendation = generateActionRecommendation(urgency);

        deals.push({
          id: `${hotel.hotelId}-${bestDate.checkIn}`,
          hotel,
          currentRate: bestDate.totalPrice || 0,
          previousRate: (bestDate.totalPrice || 0) + savings,
          savings,
          savingsPercentage,
          validDates: [bestDate.checkIn, bestDate.checkOut],
          urgency,
          reason,
          actionRecommendation,
        });
      }
    }
  }

  // Add perfect day opportunities as high-priority deals
  for (const perfectDay of perfectDays) {
    // Check if perfect day meets criteria
    if (params.maxPrice && perfectDay.currentRate > params.maxPrice) continue;
    if (params.minSavings && perfectDay.savingsPercentage < params.minSavings) continue;

    // Check city filter
    if (params.cities && params.cities.length > 0) {
      const hotel = hotels.find(h => h.hotelId === perfectDay.hotelId);
      if (!hotel || !params.cities.some((city: string) => hotel.city?.toLowerCase() === city.toLowerCase())) {
        continue;
      }
    }

    // Check hotel name filter
    if (params.hotels && params.hotels.length > 0) {
      if (!params.hotels.some((name: string) => perfectDay.hotelName?.toLowerCase().includes(name.toLowerCase()))) {
        continue;
      }
    }

    deals.push({
      id: `perfect-${perfectDay.hotelId}-${perfectDay.perfectDate}`,
      hotel: { name: perfectDay.hotelName, hotelId: perfectDay.hotelId },
      currentRate: perfectDay.currentRate,
      previousRate: perfectDay.averageRate,
      savings: perfectDay.averageRate - perfectDay.currentRate,
      savingsPercentage: perfectDay.savingsPercentage,
      validDates: [perfectDay.perfectDate, perfectDay.perfectDate],
      urgency: perfectDay.urgency,
      reason: `PERFECT DAY: ${perfectDay.reasons.join(', ')}`,
      actionRecommendation: perfectDay.urgency === 'high' ? 'Book immediately - perfect day opportunity' : 'Book within 7 days - excellent value',
    });
  }

  // Sort by savings percentage (highest first), with perfect days prioritized
  return deals.sort((a, b) => {
    // Perfect days get priority
    const aIsPerfect = a.id.startsWith('perfect-');
    const bIsPerfect = b.id.startsWith('perfect-');
    
    if (aIsPerfect && !bIsPerfect) return -1;
    if (!aIsPerfect && bIsPerfect) return 1;
    
    // Then sort by savings percentage
    return b.savingsPercentage - a.savingsPercentage;
  });
}

/**
 * Generate deal reason based on savings
 */
function generateDealReason(bestDate: any, savingsPercentage: number): string {
  const checkInDate = new Date(bestDate.checkIn);
  const month = checkInDate.getMonth() + 1;

  let season = "Winter";
  if ([3, 4, 5].includes(month)) season = "Spring";
  else if ([6, 7, 8].includes(month)) season = "Summer";
  else if ([9, 10, 11].includes(month)) season = "Fall";

  if (savingsPercentage >= 50) {
    return `${season} season pricing - exceptional ${savingsPercentage.toFixed(0)}% savings`;
  } else if (savingsPercentage >= 30) {
    return `${season} season offering solid ${savingsPercentage.toFixed(0)}% value`;
  } else {
    return `${season} season with ${savingsPercentage.toFixed(0)}% savings vs peak`;
  }
}

/**
 * Generate action recommendation based on urgency
 */
function generateActionRecommendation(urgency: string): string {
  if (urgency === "high") {
    return "Book immediately - exceptional savings rarely available";
  } else if (urgency === "medium") {
    return "Book within 7 days - good value window";
  } else {
    return "Monitor for additional savings or book for guaranteed value";
  }
}

/**
 * Format deals response
 */
function formatDealsResponse(deals: DealAlert[], params: any): string {
  const highUrgencyDeals = deals.filter((d) => d.urgency === "high");
  const perfectDayDeals = deals.filter((d) => d.id.startsWith('perfect-'));
  const totalSavings = deals.reduce((sum, d) => sum + d.savings, 0);

  let responseText = "";

  // Highlight perfect days first
  if (perfectDayDeals.length > 0) {
    responseText += `🎯 **PERFECT DAY ALERTS**: `;
    const perfectDayTexts = perfectDayDeals
      .slice(0, 2)
      .map((deal) => {
        const dates = formatDateRange(deal.validDates);
        return `${deal.hotel.name} €${deal.currentRate}/night (${deal.savingsPercentage.toFixed(1)}% below average) ${dates}`;
      })
      .join(", ");
    responseText += `${perfectDayTexts}. `;
  }

  // Show regular deals
  const regularDeals = deals.filter((d) => !d.id.startsWith('perfect-'));
  if (regularDeals.length > 0) {
    if (perfectDayDeals.length > 0) {
      responseText += `\n\n🚨 **Additional Deals**: `;
    } else {
      responseText += `🚨 **Hotel deals**: `;
    }
    
    const topDeals = regularDeals
      .slice(0, 3)
      .map((deal) => {
        const dates = formatDateRange(deal.validDates);
        return `${deal.hotel.name} €${deal.currentRate}/night (was €${deal.previousRate}, ${deal.savingsPercentage.toFixed(0)}% off) ${dates}`;
      })
      .join(", ");

    responseText += `${topDeals}. `;
  }

  responseText += `${deals.length} ${deals.length === 1 ? "opportunity" : "opportunities"} found. `;

  if (highUrgencyDeals.length > 0) {
    responseText += `${highUrgencyDeals[0].actionRecommendation}. `;
  }

  // Add Bitcoin travel philosophy
  const bitcoinQuotes = [
    "Sound money enables swift decisions.",
    "Bitcoin wealth creates booking flexibility.",
    "Strike while rates are down.",
    "Hard money, soft adventures.",
    "Stack sats, book deals.",
  ];

  responseText +=
    bitcoinQuotes[Math.floor(Math.random() * bitcoinQuotes.length)];

  return responseText;
}

/**
 * Format date range for display
 */
function formatDateRange(dates: string[]): string {
  if (dates.length >= 2) {
    const start = new Date(dates[0]).toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
    });
    const end = new Date(dates[1]).toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
    });
    return `${start}-${end}`;
  }
  return dates[0] || "TBD";
}
