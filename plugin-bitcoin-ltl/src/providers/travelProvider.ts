import { IAgentRuntime, Provider, elizaLogger, Memory, State } from '@elizaos/core';
import { TravelDataService } from '../services/TravelDataService';

/**
 * Travel Provider - Injects contextual travel information and booking opportunities
 * 
 * This dynamic provider adds travel context including:
 * - Current hotel deals and availability
 * - Seasonal pricing insights
 * - Optimal booking windows
 * - Luxury destination recommendations
 * 
 * Usage: Include 'travel' in dynamic providers when travel-related queries are made
 */
export const travelProvider: Provider = {
  name: 'travel',
  description: 'Provides luxury travel bookings, hotel deals, and destination insights',
  position: 5, // After market data providers but before complex analysis
  
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    elizaLogger.debug('📍 [TravelProvider] Providing travel context and booking opportunities');
    
    try {
      // Get the travel data service
      const travelService = runtime.getService('travel-data') as TravelDataService;
      if (!travelService) {
        elizaLogger.warn('[TravelProvider] TravelDataService not available');
        return {
          text: 'Travel booking services temporarily unavailable.',
          values: {
            travelAvailable: false,
            error: 'Service not found'
          },
        };
      }

      // Get comprehensive travel data
      const travelData = travelService.getTravelData();
      const travelInsights = travelService.getTravelInsights();
      const bookingWindows = travelService.getOptimalBookingWindows();
      const curatedHotels = travelService.getCuratedHotels();
      
      if (!travelData) {
        elizaLogger.debug('[TravelProvider] No travel data available yet');
        return {
          text: 'Travel data is being updated. Please try again in a few moments.',
          values: {
            travelAvailable: false,
            updating: true
          },
        };
      }

      // Current date for contextual relevance
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentSeason = getCurrentSeason(currentMonth);
      
      // Find current best deals
      const bestDeals = findBestCurrentDeals(travelData.currentRates, bookingWindows);
      
      // Get seasonal recommendations
      const seasonalRecommendations = getSeasonalRecommendations(travelInsights, currentMonth);
      
      // Build travel context
      const travelContext = buildTravelContext(
        curatedHotels,
        bestDeals,
        seasonalRecommendations,
        currentSeason,
        travelData.lastUpdated
      );

      elizaLogger.debug(`[TravelProvider] Providing context for ${curatedHotels.length} hotels, ${bestDeals.length} current deals`);
      
      return {
        text: travelContext,
        values: {
          travelAvailable: true,
          hotelsCount: curatedHotels.length,
          currentDeals: bestDeals.length,
          lastUpdated: travelData.lastUpdated,
          currentSeason: currentSeason,
          bestDestinations: seasonalRecommendations.map(r => r.city),
          averageSavings: calculateAverageSavings(bestDeals),
          // Include data in values for access
          hotels: curatedHotels,
          deals: bestDeals,
          insights: travelInsights,
          bookingWindows: bookingWindows,
          seasonalRecommendations: seasonalRecommendations
        },
      };
      
    } catch (error) {
      elizaLogger.error('[TravelProvider] Error providing travel context:', error);
      return {
        text: 'Travel booking services encountered an error. Please try again later.',
        values: {
          travelAvailable: false,
          error: error.message
        },
      };
    }
  }
};

/**
 * Helper function to determine current season
 */
function getCurrentSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
}

/**
 * Helper function to find best current deals
 */
function findBestCurrentDeals(rates: any[], bookingWindows: any[]): any[] {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  
  return bookingWindows
    .filter(window => window.bestDates && window.bestDates.length > 0)
    .map(window => {
      const bestDate = window.bestDates[0];
      return {
        hotelId: window.hotelId,
        hotelName: window.hotelName,
        city: window.city,
        checkIn: bestDate.checkIn,
        checkOut: bestDate.checkOut,
        totalPrice: bestDate.totalPrice,
        savings: bestDate.savings,
        savingsPercentage: bestDate.savingsPercentage,
        season: window.seasonalAnalysis.season,
        demandLevel: window.seasonalAnalysis.demandLevel
      };
    })
    .filter(deal => deal.savings > 0)
    .sort((a, b) => b.savingsPercentage - a.savingsPercentage)
    .slice(0, 5); // Top 5 deals
}

/**
 * Helper function to get seasonal recommendations
 */
function getSeasonalRecommendations(insights: any, currentMonth: number): any[] {
  if (!insights || !insights.cityAnalysis) return [];
  
  return insights.cityAnalysis
    .filter(city => city.bestMonths.includes(currentMonth))
    .map(city => ({
      city: city.city,
      reason: 'optimal_season',
      averageSavings: city.averageSavings,
      optimalStayLength: city.optimalStayLength
    }))
    .sort((a, b) => b.averageSavings - a.averageSavings);
}

/**
 * Helper function to calculate average savings
 */
function calculateAverageSavings(deals: any[]): number {
  if (!deals || deals.length === 0) return 0;
  const totalSavings = deals.reduce((sum, deal) => sum + deal.savingsPercentage, 0);
  return Math.round(totalSavings / deals.length);
}

/**
 * Helper function to build travel context
 */
function buildTravelContext(
  hotels: any[],
  deals: any[],
  seasonalRecommendations: any[],
  currentSeason: string,
  lastUpdated: Date
): string {
  const context = [];
  
  // Current season context
  context.push(`🏨 TRAVEL CONTEXT (${currentSeason})`);
  context.push(`📅 Data updated: ${lastUpdated.toLocaleDateString()}`);
  context.push('');
  
  // Available luxury destinations
  const cities = [...new Set(hotels.map(h => h.city))];
  context.push(`🌍 LUXURY DESTINATIONS AVAILABLE: ${cities.join(', ')}`);
  context.push(`📍 Total curated hotels: ${hotels.length}`);
  context.push('');
  
  // Current best deals
  if (deals.length > 0) {
    context.push('💰 CURRENT BEST DEALS:');
    deals.forEach((deal, index) => {
      context.push(`${index + 1}. ${deal.hotelName} (${deal.city})`);
      context.push(`   💸 Save ${deal.savingsPercentage}% (€${deal.savings})`);
      context.push(`   📅 ${deal.checkIn} - ${deal.checkOut}`);
      context.push(`   🏷️ €${deal.totalPrice} total, ${deal.season} season`);
      context.push('');
    });
  }
  
  // Seasonal recommendations
  if (seasonalRecommendations.length > 0) {
    context.push('🌟 SEASONAL RECOMMENDATIONS:');
    seasonalRecommendations.forEach(rec => {
      context.push(`• ${rec.city}: Optimal season, avg ${rec.averageSavings}% savings`);
      context.push(`  💡 Recommended stay: ${rec.optimalStayLength} nights`);
    });
    context.push('');
  }
  
  // Booking insights
  context.push('📊 BOOKING INSIGHTS:');
  context.push(`• European luxury destinations with Booking.com integration`);
  context.push(`• Real-time rate monitoring and optimization`);
  context.push(`• Seasonal price analysis and demand forecasting`);
  context.push(`• Optimal booking windows for maximum savings`);
  context.push('');
  
  // Usage note
  context.push('💡 Ask about specific destinations, dates, or use hotel booking actions for detailed searches.');
  
  return context.join('\n');
}

export default travelProvider; 