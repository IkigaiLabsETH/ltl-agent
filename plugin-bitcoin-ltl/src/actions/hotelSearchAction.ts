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

export const hotelSearchAction: Action = createActionTemplate({
  name: "HOTEL_SEARCH_ACTION",
  description:
    "Search for hotels with real-time pricing, availability, and location intelligence for optimized travel planning",
  similes: [
    "HOTEL_SEARCH",
    "HOTEL_BOOKING",
    "HOTEL_AVAILABILITY",
    "HOTEL_PRICES",
    "HOTEL_DEALS",
    "FIND_HOTELS",
    "SEARCH_HOTELS",
    "HOTEL_RECOMMENDATIONS",
    "ACCOMMODATION_SEARCH",
    "PLACE_TO_STAY",
  ],

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "Find hotels in Miami for this weekend" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Miami hotels this weekend: The Ritz-Carlton $489/night (South Beach), 1 Hotel $392/night (Mid Beach), Four Seasons $567/night (Brickell). 3 luxury options found. Beach proximity premium: 15-30%. Book early for better rates. Travel while you can - Bitcoin gives you the freedom to go anywhere.",
          thought:
            "User wants hotel search for Miami this weekend. I need to search for available hotels, analyze pricing, location advantages, and provide actionable booking recommendations while maintaining perspective on Bitcoin-enabled travel freedom.",
          actions: ["HOTEL_SEARCH_ACTION"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "What are the best hotels in Tokyo under $300 per night?",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "Tokyo hotels under $300: Park Hyatt $285/night (Shinjuku views), Andaz $245/night (Toranomon Hills), Conrad $275/night (Shiodome). 3 luxury options within budget. Shibuya alternatives: $180-220/night. Book 2-3 weeks ahead for optimal rates. Stack sats, see the world.",
          thought:
            "User looking for Tokyo hotels under $300. I should search for available options, compare locations and amenities, identify value propositions, and provide clear booking recommendations with Bitcoin travel philosophy.",
          actions: ["HOTEL_SEARCH_ACTION"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "Show me hotel options near Bitcoin conference in Nashville",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "Nashville Bitcoin conference hotels: Omni $275/night (downtown, 0.3mi), Westin $225/night (Music Row, 0.8mi), Hutton $195/night (downtown, 0.5mi). 3 options within walking distance. Conference premium: 20-35%. Book immediately - Bitcoin conferences drive massive demand. This is how we build the future.",
          thought:
            "User searching for hotels near Bitcoin conference in Nashville. I need to find accommodations close to the venue, analyze conference-related pricing premiums, and emphasize the importance of early booking for Bitcoin events.",
          actions: ["HOTEL_SEARCH_ACTION"],
        },
      },
    ],
  ],

  validateFn: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return ValidationPatterns.isHotelSearchRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    logger.info("Hotel search action triggered");

    const thoughtProcess =
      "User is requesting hotel search. I need to analyze their travel requirements, search for available accommodations, compare pricing and locations, and provide actionable booking recommendations while maintaining Bitcoin travel philosophy.";

    try {
      const travelDataService = runtime.getService(
        "travel-data",
      ) as TravelDataService;

      if (!travelDataService) {
        logger.warn("TravelDataService not available");

        const fallbackResponse = ResponseCreators.createErrorResponse(
          "HOTEL_SEARCH_ACTION",
          "Travel data service unavailable",
          "Hotel search service temporarily unavailable. Use this time to stack more sats - travel becomes easier when you have sound money.",
        );

        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Extract search parameters from message
      const messageText = message.content?.text || "";
      const searchParams = extractHotelSearchParams(messageText);

      if (!searchParams.destination) {
        logger.warn("No destination specified in hotel search");

        const noDestinationResponse = ResponseCreators.createErrorResponse(
          "HOTEL_SEARCH_ACTION",
          "No destination specified",
          "Please specify a destination for hotel search. Where would you like to stay?",
        );

        if (callback) {
          await callback(noDestinationResponse);
        }
        return false;
      }

      // Get travel data (using existing service method)
      const travelData = travelDataService.getTravelData();

      if (!travelData || !travelData.hotels || travelData.hotels.length === 0) {
        logger.warn("No hotel data available");

        const noResultsResponse = ResponseCreators.createErrorResponse(
          "HOTEL_SEARCH_ACTION",
          "No hotels found",
          `No hotels found for ${searchParams.destination}. Try broadening your search criteria or different dates.`,
        );

        if (callback) {
          await callback(noResultsResponse);
        }
        return false;
      }

      // Filter hotels based on search parameters
      const filteredHotels = filterHotels(travelData.hotels, searchParams);

      if (filteredHotels.length === 0) {
        logger.warn("No hotels match search criteria");

        const noMatchResponse = ResponseCreators.createErrorResponse(
          "HOTEL_SEARCH_ACTION",
          "No matching hotels",
          `No hotels match your criteria for ${searchParams.destination}. Try adjusting your search parameters.`,
        );

        if (callback) {
          await callback(noMatchResponse);
        }
        return false;
      }

      // Create search results object
      const searchResults = {
        hotels: filteredHotels,
        averagePrice: calculateAveragePrice(filteredHotels),
        priceRange: calculatePriceRange(filteredHotels),
      };

      // Format search results
      const responseText = formatHotelSearchResults(
        searchResults,
        searchParams,
      );

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        responseText,
        "HOTEL_SEARCH_ACTION",
        {
          destination: searchParams.destination,
          totalHotels: searchResults.hotels.length,
          averagePrice: searchResults.averagePrice,
          priceRange: searchResults.priceRange,
          checkIn: searchParams.checkIn,
          checkOut: searchParams.checkOut,
          searchDate: new Date().toISOString(),
        },
      );

      if (callback) {
        await callback(response);
      }

      logger.info("Hotel search results delivered successfully");
      return true;
    } catch (error) {
      logger.error("Failed to search hotels:", (error as Error).message);

      const errorResponse = ResponseCreators.createErrorResponse(
        "HOTEL_SEARCH_ACTION",
        (error as Error).message,
        "Hotel search failed. Like the Bitcoin network, sometimes connections need time to establish. Try again in a moment.",
      );

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },
});

/**
 * Filter hotels based on search parameters
 */
function filterHotels(hotels: any[], params: any): any[] {
  let filtered = hotels;

  // Filter by destination
  if (params.destination) {
    const destination = params.destination.toLowerCase();
    filtered = filtered.filter(
      (hotel) =>
        hotel.city?.toLowerCase().includes(destination) ||
        hotel.name?.toLowerCase().includes(destination) ||
        hotel.location?.toLowerCase().includes(destination),
    );
  }

  // Filter by max price
  if (params.maxPrice) {
    filtered = filtered.filter((hotel) => hotel.price <= params.maxPrice);
  }

  // Filter by star rating
  if (params.starRating) {
    filtered = filtered.filter(
      (hotel) => hotel.starRating >= params.starRating,
    );
  }

  return filtered;
}

/**
 * Calculate average price from hotel list
 */
function calculateAveragePrice(hotels: any[]): number {
  if (hotels.length === 0) return 0;
  const total = hotels.reduce((sum, hotel) => sum + (hotel.price || 0), 0);
  return Math.round(total / hotels.length);
}

/**
 * Calculate price range from hotel list
 */
function calculatePriceRange(hotels: any[]): { min: number; max: number } {
  if (hotels.length === 0) return { min: 0, max: 0 };

  const prices = hotels.map((hotel) => hotel.price || 0);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

/**
 * Extract hotel search parameters from message text
 */
function extractHotelSearchParams(text: string): {
  destination: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  maxPrice?: number;
  starRating?: number;
} {
  const params: any = {};

  // Extract destination (basic pattern matching)
  const destinationMatch = text.match(
    /(?:in|to|at|for)\s+([A-Za-z\s]+?)(?:\s+for|\s+from|\s+under|\s+$)/i,
  );
  if (destinationMatch) {
    params.destination = destinationMatch[1].trim();
  }

  // Extract price constraint
  const priceMatch = text.match(/under\s+\$?(\d+)/i);
  if (priceMatch) {
    params.maxPrice = parseInt(priceMatch[1]);
  }

  // Extract time period
  if (text.includes("this weekend")) {
    const now = new Date();
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + ((6 - now.getDay()) % 7));
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);

    params.checkIn = saturday.toISOString().split("T")[0];
    params.checkOut = sunday.toISOString().split("T")[0];
  }

  // Extract guest count
  const guestsMatch = text.match(/(\d+)\s+guests?/i);
  if (guestsMatch) {
    params.guests = parseInt(guestsMatch[1]);
  }

  return params;
}

/**
 * Format hotel search results into readable response
 */
function formatHotelSearchResults(results: any, params: any): string {
  const { hotels, averagePrice, priceRange } = results;
  const { destination, maxPrice } = params;

  // Format top hotels
  const topHotels = hotels
    .slice(0, 3)
    .map((hotel: any) => {
      const distance = hotel.distance ? ` (${hotel.distance})` : "";
      const starRating = hotel.starRating ? ` ${hotel.starRating}★` : "";
      return `${hotel.name} $${hotel.price}/night${distance}${starRating}`;
    })
    .join(", ");

  let responseText = `${destination} hotels`;

  // Add time context if available
  if (params.checkIn) {
    responseText += ` ${params.checkIn}`;
  }

  responseText += `: ${topHotels}. `;

  // Add search summary
  responseText += `${hotels.length} options found. `;

  // Add price analysis
  if (maxPrice) {
    const withinBudget = hotels.filter((h: any) => h.price <= maxPrice).length;
    responseText += `${withinBudget} within $${maxPrice} budget. `;
  }

  if (priceRange) {
    responseText += `Price range: $${priceRange.min}-${priceRange.max}. `;
  }

  // Add booking advice
  if (hotels.length > 0) {
    const avgPrice = Math.round(averagePrice);
    responseText += `Average: $${avgPrice}/night. `;

    // Add location premium analysis
    const locationPremium = analyzeLocationPremium(hotels);
    if (locationPremium > 10) {
      responseText += `Premium location adds ${locationPremium}%. `;
    }

    // Add booking timing advice
    responseText += getBookingAdvice(params);
  }

  // Add Bitcoin travel philosophy
  const bitcoinQuotes = [
    "Travel while you can - Bitcoin gives you the freedom to go anywhere.",
    "Stack sats, see the world.",
    "Bitcoin enables sovereign travel - no permission needed.",
    "Sound money makes global exploration possible.",
    "Hard money, soft adventures.",
  ];

  responseText +=
    bitcoinQuotes[Math.floor(Math.random() * bitcoinQuotes.length)];

  return responseText;
}

/**
 * Analyze location premium from hotel pricing
 */
function analyzeLocationPremium(hotels: any[]): number {
  if (hotels.length < 3) return 0;

  const sorted = hotels.sort((a: any, b: any) => a.price - b.price);
  const cheapest = sorted[0].price;
  const expensive = sorted[sorted.length - 1].price;

  return Math.round(((expensive - cheapest) / cheapest) * 100);
}

/**
 * Get booking timing advice based on search parameters
 */
function getBookingAdvice(params: any): string {
  const { destination, checkIn } = params;

  if (checkIn) {
    const checkInDate = new Date(checkIn);
    const now = new Date();
    const daysUntil = Math.ceil(
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntil <= 2) {
      return "Book immediately - last minute bookings limited. ";
    } else if (daysUntil <= 7) {
      return "Book early for better rates. ";
    } else {
      return "Book 2-3 weeks ahead for optimal rates. ";
    }
  }

  // Default advice for major cities
  if (
    destination?.toLowerCase().includes("bitcoin") ||
    destination?.toLowerCase().includes("conference")
  ) {
    return "Book immediately - Bitcoin conferences drive massive demand. ";
  }

  return "Book early for better availability. ";
}
