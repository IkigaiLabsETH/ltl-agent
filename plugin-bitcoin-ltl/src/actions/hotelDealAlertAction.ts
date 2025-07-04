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

interface DealAlertParams {
  hotels?: string[]; // hotel IDs or names
  cities?: string[]; // city names
  maxPrice?: number;
  minSavings?: number; // minimum savings percentage
  dateRange?: {
    start: string;
    end: string;
  };
  alertType?: 'immediate' | 'daily' | 'weekly';
}

interface DealAlert {
  id: string;
  hotel: CuratedHotel;
  currentRate: number;
  previousRate: number;
  savings: number;
  savingsPercentage: number;
  validDates: string[];
  urgency: 'high' | 'medium' | 'low';
  reason: string;
  actionRecommendation: string;
}

export const hotelDealAlertAction: Action = {
  name: "HOTEL_DEAL_ALERT",
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
    "PRICE_DROPS"
  ],
  description: "Monitor hotel rates and alert on significant price drops and booking opportunities",
  
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    
    // Deal and alert keywords
    const dealKeywords = [
      'deal', 'deals', 'alert', 'alerts', 'notification', 'notify', 'monitor',
      'watch', 'track', 'savings', 'discount', 'price drop', 'bargain', 'special'
    ];
    
    // Hotel keywords
    const hotelKeywords = [
      'hotel', 'hotels', 'accommodation', 'booking', 'stay', 'room', 'suite'
    ];
    
    // Price and booking keywords
    const priceKeywords = [
      'price', 'rate', 'cost', 'cheap', 'cheaper', 'best price', 'lowest',
      'when to book', 'optimal', 'timing', 'bargain', 'steal'
    ];
    
    const hasDealKeyword = dealKeywords.some(keyword => text.includes(keyword));
    const hasHotelKeyword = hotelKeywords.some(keyword => text.includes(keyword));
    const hasPriceKeyword = priceKeywords.some(keyword => text.includes(keyword));
    
    // Activate if user mentions deals + hotels or hotels + prices
    return (hasDealKeyword && hasHotelKeyword) || (hasHotelKeyword && hasPriceKeyword);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      elizaLogger.info(`[HotelDealAlertAction] Processing deal alert request: ${message.content.text}`);
      
      // Get the TravelDataService
      const travelService = runtime.getService('travel-data') as TravelDataService;
      if (!travelService) {
        elizaLogger.error('[HotelDealAlertAction] TravelDataService not available');
        await callback({
          text: "❌ Travel monitoring service is currently unavailable. Please try again later.",
          content: { error: "TravelDataService not found" }
        });
        return;
      }

      // Parse alert parameters
      const alertParams = await parseAlertParameters(runtime, message.content.text);
      elizaLogger.info(`[HotelDealAlertAction] Parsed alert params:`, alertParams);

      // Get current travel data
      const travelData = travelService.getTravelData();
      if (!travelData) {
        elizaLogger.warn('[HotelDealAlertAction] No travel data available, forcing update');
        await travelService.forceUpdate();
      }

      // Find current deals and opportunities
      const currentDeals = await findCurrentDeals(travelService, alertParams);
      
      // Generate alert response
      const response = await generateAlertResponse(runtime, alertParams, currentDeals);
      
      elizaLogger.info(`[HotelDealAlertAction] Generated response with ${currentDeals.length} deals`);
      
      await callback({
        text: response,
        content: {
          action: "hotel_deal_alert",
          parameters: alertParams,
          results: {
            dealCount: currentDeals.length,
            highUrgencyDeals: currentDeals.filter(d => d.urgency === 'high').length,
            totalSavings: currentDeals.reduce((sum, d) => sum + d.savings, 0)
          }
        }
      });

    } catch (error) {
      elizaLogger.error('[HotelDealAlertAction] Error processing deal alert:', error);
      await callback({
        text: "❌ I encountered an error while checking for hotel deals. Please try again.",
        content: { error: error.message }
      });
    }
  },

  examples: []
};

async function parseAlertParameters(runtime: IAgentRuntime, text: string): Promise<DealAlertParams> {
  try {
    const text_lower = text.toLowerCase();
    const params: DealAlertParams = { alertType: 'immediate' };
    
    // Extract cities
    const cities = [];
    if (text_lower.includes('biarritz')) cities.push('biarritz');
    if (text_lower.includes('bordeaux')) cities.push('bordeaux');
    if (text_lower.includes('monaco')) cities.push('monaco');
    if (cities.length > 0) params.cities = cities;
    
    // Extract hotel names
    const hotels = [];
    if (text_lower.includes('hôtel du palais') || text_lower.includes('hotel du palais')) hotels.push('Hôtel du Palais');
    if (text_lower.includes('hermitage')) hotels.push('Hôtel Hermitage');
    if (text_lower.includes('metropole')) hotels.push('Hotel Metropole');
    if (hotels.length > 0) params.hotels = hotels;
    
    // Extract max price
    const priceMatch = text.match(/(?:below|under|max|maximum)?\s*€?(\d+(?:,\d+)?)/i);
    if (priceMatch) {
      params.maxPrice = parseInt(priceMatch[1].replace(',', ''));
    }
    
    // Extract minimum savings
    const savingsMatch = text.match(/(\d+)%\s*(?:savings|off|discount)/i);
    if (savingsMatch) {
      params.minSavings = parseInt(savingsMatch[1]);
    }
    
    return params;
  } catch (error) {
    elizaLogger.error('[HotelDealAlertAction] Error parsing parameters:', error);
    return { alertType: 'immediate' };
  }
}

async function findCurrentDeals(travelService: TravelDataService, params: DealAlertParams): Promise<DealAlert[]> {
  const hotels = travelService.getCuratedHotels();
  const optimalWindows = travelService.getOptimalBookingWindows();
  const deals: DealAlert[] = [];

  // Filter hotels based on parameters
  let filteredHotels = hotels;
  
  if (params.cities && params.cities.length > 0) {
    filteredHotels = hotels.filter(hotel => 
      params.cities!.some(city => hotel.city.toLowerCase() === city.toLowerCase())
    );
  }
  
  if (params.hotels && params.hotels.length > 0) {
    filteredHotels = filteredHotels.filter(hotel => 
      params.hotels!.some(name => hotel.name.toLowerCase().includes(name.toLowerCase()))
    );
  }

  // Find deals for each hotel
  for (const hotel of filteredHotels) {
    const optimalWindow = optimalWindows.find(w => w.hotelId === hotel.hotelId);
    
    if (optimalWindow && optimalWindow.bestDates.length > 0) {
      for (const bestDate of optimalWindow.bestDates.slice(0, 3)) { // Top 3 deals per hotel
        // Check if deal meets criteria
        if (params.maxPrice && bestDate.totalPrice > params.maxPrice) continue;
        if (params.minSavings && bestDate.savingsPercentage < params.minSavings) continue;
        
        const savings = bestDate.savings;
        const savingsPercentage = bestDate.savingsPercentage;
        
        // Determine urgency
        let urgency: 'high' | 'medium' | 'low' = 'low';
        if (savingsPercentage >= 60) urgency = 'high';
        else if (savingsPercentage >= 40) urgency = 'medium';
        
        // Generate reason and recommendation
        const reason = generateDealReason(bestDate, hotel);
        const actionRecommendation = generateActionRecommendation(bestDate, hotel, urgency);
        
        deals.push({
          id: `${hotel.hotelId}-${bestDate.checkIn}`,
          hotel,
          currentRate: bestDate.totalPrice,
          previousRate: bestDate.totalPrice + savings,
          savings,
          savingsPercentage,
          validDates: [bestDate.checkIn, bestDate.checkOut],
          urgency,
          reason,
          actionRecommendation
        });
      }
    }
  }

  // Sort by savings percentage (highest first)
  return deals.sort((a, b) => b.savingsPercentage - a.savingsPercentage);
}

function generateDealReason(bestDate: any, hotel: CuratedHotel): string {
  const season = getCurrentSeason(new Date(bestDate.checkIn));
  const savingsPercentage = bestDate.savingsPercentage;
  
  if (savingsPercentage >= 60) {
    return `${season} season pricing - exceptional ${savingsPercentage}% savings`;
  } else if (savingsPercentage >= 40) {
    return `${season} season offering solid ${savingsPercentage}% value`;
  } else {
    return `${season} season with ${savingsPercentage}% savings vs peak`;
  }
}

function generateActionRecommendation(bestDate: any, hotel: CuratedHotel, urgency: string): string {
  if (urgency === 'high') {
    return `Book immediately - exceptional savings rarely available`;
  } else if (urgency === 'medium') {
    return `Book within 7 days - good value window`;
  } else {
    return `Monitor for additional savings or book for guaranteed value`;
  }
}

function getCurrentSeason(date: Date): string {
  const month = date.getMonth() + 1;
  
  if ([12, 1, 2].includes(month)) return 'Winter';
  if ([3, 4, 5].includes(month)) return 'Spring';
  if ([6, 7, 8].includes(month)) return 'Summer';
  return 'Fall';
}

async function generateAlertResponse(runtime: IAgentRuntime, params: DealAlertParams, deals: DealAlert[]): Promise<string> {
  if (deals.length === 0) {
    return "📊 No current deals match your criteria. I'll continue monitoring for opportunities and alert you when rates drop!";
  }

  const highUrgencyDeals = deals.filter(d => d.urgency === 'high');
  const totalSavings = deals.reduce((sum, d) => sum + d.savings, 0);
  
  let response = `🚨 **Hotel Deal Alert - ${deals.length} ${deals.length === 1 ? 'Opportunity' : 'Opportunities'} Found**\n\n`;
  
  if (highUrgencyDeals.length > 0) {
    response += `🔥 **URGENT DEALS (Book Now):**\n\n`;
    
    for (const deal of highUrgencyDeals.slice(0, 2)) {
      const categoryIcon = getCategoryIcon(deal.hotel.category);
      response += `${categoryIcon} **${deal.hotel.name}** (${deal.hotel.city})\n`;
      response += `• **Rate**: €${deal.currentRate}/night (was €${deal.previousRate})\n`;
      response += `• **Savings**: €${deal.savings}/night (${deal.savingsPercentage}% off)\n`;
      response += `• **Dates**: ${formatDateRange(deal.validDates)}\n`;
      response += `• **Reason**: ${deal.reason}\n`;
      response += `• **Action**: ${deal.actionRecommendation}\n\n`;
    }
  }
  
  const mediumDeals = deals.filter(d => d.urgency === 'medium');
  if (mediumDeals.length > 0) {
    response += `💎 **GOOD VALUE OPPORTUNITIES:**\n\n`;
    
    for (const deal of mediumDeals.slice(0, 2)) {
      const categoryIcon = getCategoryIcon(deal.hotel.category);
      response += `${categoryIcon} **${deal.hotel.name}** (${deal.hotel.city})\n`;
      response += `• **Rate**: €${deal.currentRate}/night (${deal.savingsPercentage}% off)\n`;
      response += `• **Savings**: €${deal.savings}/night\n`;
      response += `• **Dates**: ${formatDateRange(deal.validDates)}\n\n`;
    }
  }
  
  response += `📊 **Summary**: ${deals.length} deals found with total savings of €${totalSavings.toLocaleString()}\n\n`;
  response += `💡 **Tip**: Act quickly on high-urgency deals - these rates change frequently!`;
  
  return response;
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

function formatDateRange(dates: string[]): string {
  if (dates.length >= 2) {
    const start = new Date(dates[0]).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    const end = new Date(dates[1]).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  }
  return dates[0] || 'TBD';
} 