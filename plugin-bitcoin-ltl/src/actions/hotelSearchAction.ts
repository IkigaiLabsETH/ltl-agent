import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  elizaLogger,
  type ActionExample
} from '@elizaos/core';
import { TravelDataService, type CuratedHotel, type OptimalBookingWindow } from '../services/TravelDataService';

interface HotelSearchParams {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  flexibility?: number;
  maxPrice?: number;
  minStarRating?: number;
  preferredCategory?: 'luxury' | 'boutique' | 'resort' | 'palace';
}

interface HotelSearchResult {
  hotels: CuratedHotel[];
  optimalBookingWindows: OptimalBookingWindow[];
  bestDeals: {
    hotel: CuratedHotel;
    savings: number;
    savingsPercentage: number;
  }[];
  seasonalAdvice: {
    currentSeason: 'high' | 'mid' | 'low';
    bestMonths: string[];
    worstMonths: string[];
    recommendation: string;
  };
}

export const hotelSearchAction: Action = {
  name: "HOTEL_SEARCH",
  similes: [
    "FIND_HOTELS",
    "SEARCH_HOTELS", 
    "BOOK_HOTEL",
    "HOTEL_RATES",
    "LUXURY_HOTELS",
    "TRAVEL_SEARCH"
  ],
  description: "Search for luxury hotels and find optimal booking windows",
  
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    
    const hotelKeywords = [
      'hotel', 'hotels', 'accommodation', 'booking', 'stay', 'property'
    ];
    
    const searchKeywords = [
      'find', 'search', 'look for', 'show me', 'available', 'book', 'reserve'
    ];
    
    const locationKeywords = [
      'biarritz', 'bordeaux', 'monaco', 'french riviera', 'southwestern france'
    ];
    
    const hasHotelKeyword = hotelKeywords.some(keyword => text.includes(keyword));
    const hasSearchKeyword = searchKeywords.some(keyword => text.includes(keyword));
    const hasLocationKeyword = locationKeywords.some(keyword => text.includes(keyword));
    
    return hasHotelKeyword && (hasSearchKeyword || hasLocationKeyword);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      elizaLogger.info(`[HotelSearchAction] Processing hotel search: ${message.content.text}`);
      
      const travelService = runtime.getService('travel-data') as TravelDataService;
      if (!travelService) {
        elizaLogger.error('[HotelSearchAction] TravelDataService not available');
        await callback({
          text: "❌ Hotel search service is currently unavailable. Please try again later.",
          content: { error: "TravelDataService not found" }
        });
        return;
      }

      // Parse search parameters
      const params = parseSearchParameters(message.content.text);
      elizaLogger.info(`[HotelSearchAction] Parsed parameters:`, params);

      // Get travel data
      const travelData = travelService.getTravelData();
      if (!travelData) {
        elizaLogger.warn('[HotelSearchAction] No travel data available, forcing update');
        await travelService.forceUpdate();
      }

      // Perform hotel search
      const result = performHotelSearch(travelService, params);
      
      // Generate response
      const response = generateSearchResponse(params, result);
      
      elizaLogger.info(`[HotelSearchAction] Found ${result.hotels.length} hotels`);
      
      await callback({
        text: response,
        content: {
          action: "hotel_search",
          params: params,
          results: {
            hotelCount: result.hotels.length,
            bestDealsCount: result.bestDeals.length,
            hasSeasonalAdvice: !!result.seasonalAdvice.recommendation
          }
        }
      });

    } catch (error) {
      elizaLogger.error('[HotelSearchAction] Error processing hotel search:', error);
      await callback({
        text: "❌ I encountered an error while searching for hotels. Please try again.",
        content: { error: error.message }
      });
    }
  },

  examples: []
};

// Helper functions
function parseSearchParameters(text: string): HotelSearchParams {
  try {
    const text_lower = text.toLowerCase();
    const params: HotelSearchParams = {};
    
    // Extract city
    if (text_lower.includes('biarritz')) params.city = 'biarritz';
    else if (text_lower.includes('bordeaux')) params.city = 'bordeaux';
    else if (text_lower.includes('monaco')) params.city = 'monaco';
    
    // Extract price range
    const priceMatch = text.match(/(\d+)\s*(?:eur|€|euros?)/i);
    if (priceMatch) {
      params.maxPrice = parseInt(priceMatch[1]);
    }
    
    // Extract category preference
    if (text_lower.includes('luxury')) params.preferredCategory = 'luxury';
    else if (text_lower.includes('boutique')) params.preferredCategory = 'boutique';
    else if (text_lower.includes('palace')) params.preferredCategory = 'palace';
    else if (text_lower.includes('resort')) params.preferredCategory = 'resort';
    
    elizaLogger.info('[HotelSearchAction] Extracted parameters:', params);
    return params;
  } catch (error) {
    elizaLogger.error('[HotelSearchAction] Error parsing parameters:', error);
    return {};
  }
}

function performHotelSearch(travelService: TravelDataService, params: HotelSearchParams): HotelSearchResult {
  const allHotels = travelService.getCuratedHotels();
  const optimalWindows = travelService.getOptimalBookingWindows();
  
  // Filter hotels based on search parameters
  let filteredHotels = allHotels;
  
  if (params.city) {
    filteredHotels = filteredHotels.filter(hotel => hotel.city === params.city);
  }
  
  if (params.preferredCategory) {
    filteredHotels = filteredHotels.filter(hotel => hotel.category === params.preferredCategory);
  }
  
  if (params.minStarRating) {
    filteredHotels = filteredHotels.filter(hotel => hotel.starRating >= params.minStarRating);
  }
  
  if (params.maxPrice) {
    filteredHotels = filteredHotels.filter(hotel => hotel.priceRange.min <= params.maxPrice);
  }

  // Get optimal booking windows for filtered hotels
  const relevantWindows = optimalWindows.filter(window => 
    filteredHotels.some(hotel => hotel.hotelId === window.hotelId)
  );

  // Find best deals (highest savings percentage)
  const bestDeals = relevantWindows
    .filter(window => window.bestDates.length > 0)
    .map(window => {
      const hotel = filteredHotels.find(h => h.hotelId === window.hotelId)!;
      const bestDate = window.bestDates[0];
      return {
        hotel,
        savings: bestDate.savings,
        savingsPercentage: bestDate.savingsPercentage
      };
    })
    .sort((a, b) => b.savingsPercentage - a.savingsPercentage)
    .slice(0, 3);

  // Generate seasonal advice
  const currentMonth = new Date().getMonth() + 1;
  const seasonalAdvice = {
    currentSeason: getCurrentSeason(currentMonth),
    bestMonths: ['April', 'May', 'September', 'October'],
    worstMonths: ['July', 'August', 'December'],
    recommendation: generateSeasonalRecommendation(currentMonth, params.city)
  };

  return {
    hotels: filteredHotels,
    optimalBookingWindows: relevantWindows,
    bestDeals,
    seasonalAdvice
  };
}

function generateSearchResponse(params: HotelSearchParams, result: HotelSearchResult): string {
  const { hotels, bestDeals, seasonalAdvice } = result;
  
  if (hotels.length === 0) {
    return "❌ No hotels found matching your criteria. Try adjusting your search parameters or exploring our luxury properties in Biarritz, Bordeaux, or Monaco.";
  }

  const cityName = params.city ? getCityDisplayName(params.city) : "Multiple Cities";
  const hotelCount = hotels.length;
  
  let response = `🏨 **Luxury Hotels in ${cityName}**\n\n`;
  response += `✨ **${hotelCount} Premium ${hotelCount === 1 ? 'Property' : 'Properties'} Found**\n\n`;

  // Show top 3 hotels with key details
  const topHotels = hotels.slice(0, 3);
  for (const hotel of topHotels) {
    const categoryIcon = getCategoryIcon(hotel.category);
    const dealInfo = bestDeals.find(deal => deal.hotel.hotelId === hotel.hotelId);
    
    response += `${categoryIcon} **${hotel.name}** (${hotel.category})\n`;
    response += `• ${hotel.description}\n`;
    response += `• Rate: €${hotel.priceRange.min}-${hotel.priceRange.max}/night`;
    
    if (dealInfo && dealInfo.savingsPercentage > 20) {
      response += ` | **${Math.round(dealInfo.savingsPercentage)}% savings available!**`;
    }
    
    response += `\n• Amenities: ${hotel.amenities.slice(0, 4).join(', ')}\n\n`;
  }

  // Add seasonal insights
  if (seasonalAdvice.recommendation) {
    response += `📊 **Seasonal Insights:**\n`;
    response += `• **Current**: ${seasonalAdvice.currentSeason} season\n`;
    
    if (seasonalAdvice.bestMonths.length > 0) {
      response += `• **Best Value**: ${seasonalAdvice.bestMonths.join(', ')}\n`;
    }
    
    if (seasonalAdvice.worstMonths.length > 0) {
      response += `• **Avoid**: ${seasonalAdvice.worstMonths.join(', ')} (premium rates)\n`;
    }
    
    response += `\n💡 **Smart Booking Tip**: ${seasonalAdvice.recommendation}`;
  }

  return response;
}

// Utility functions
function getCurrentSeason(month: number): 'high' | 'mid' | 'low' {
  if ([6, 7, 8].includes(month)) return 'high';
  if ([4, 5, 9, 10].includes(month)) return 'mid';
  return 'low';
}

function getCityDisplayName(city: string): string {
  const cityMap = {
    'biarritz': 'Biarritz',
    'bordeaux': 'Bordeaux', 
    'monaco': 'Monaco'
  };
  return cityMap[city as keyof typeof cityMap] || city;
}

function getCategoryIcon(category: string): string {
  const iconMap = {
    'palace': '🏰',
    'luxury': '✨',
    'boutique': '🌟',
    'resort': '🌊'
  };
  return iconMap[category as keyof typeof iconMap] || '🏨';
}

function generateSeasonalRecommendation(currentMonth: number, city?: string): string {
  const season = getCurrentSeason(currentMonth);
  
  if (season === 'high') {
    return "Consider booking shoulder season (April/May or September/October) for 30-50% savings.";
  } else if (season === 'mid') {
    return "Good timing! Shoulder season offers excellent value with pleasant weather.";
  } else {
    return "Excellent value season! Book now for up to 60% savings vs peak summer rates.";
  }
} 