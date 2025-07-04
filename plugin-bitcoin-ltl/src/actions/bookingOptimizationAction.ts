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

interface OptimizationCriteria {
  priority: 'price' | 'value' | 'luxury' | 'season' | 'savings';
  budget?: number;
  travelDates?: {
    start: string;
    end: string;
  };
  cities?: string[];
  flexibility?: number; // days
  partySize?: number;
}

interface HotelComparison {
  hotel: CuratedHotel;
  bestRate: number;
  savings: number;
  savingsPercentage: number;
  checkIn: string;
  checkOut: string;
  valueScore: number;
  luxuryScore: number;
  seasonScore: number;
  overallScore: number;
  reasoning: string;
}

interface OptimizedRecommendation {
  topChoice: HotelComparison;
  alternatives: HotelComparison[];
  budgetOption: HotelComparison;
  luxuryOption: HotelComparison;
  bestValue: HotelComparison;
  summary: {
    totalHotelsCompared: number;
    averageSavings: number;
    bestSavingsPercentage: number;
    priceRange: { min: number; max: number };
  };
}

export const bookingOptimizationAction: Action = {
  name: "BOOKING_OPTIMIZATION",
  similes: [
    "OPTIMIZE_BOOKING",
    "COMPARE_HOTELS",
    "BEST_VALUE_HOTELS",
    "HOTEL_COMPARISON",
    "OPTIMIZE_TRAVEL",
    "BOOKING_STRATEGY",
    "HOTEL_ANALYSIS",
    "TRAVEL_OPTIMIZATION",
    "SMART_BOOKING",
    "BEST_DEALS"
  ],
  description: "Compare and optimize hotel bookings across multiple properties and cities for the best value",
  
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    
    // Optimization and comparison keywords
    const optimizationKeywords = [
      'optimize', 'compare', 'best', 'better', 'analysis', 'recommendation',
      'versus', 'vs', 'choose', 'decide', 'which hotel', 'what\'s better',
      'smart booking', 'strategy', 'value', 'worth it'
    ];
    
    // Hotel keywords
    const hotelKeywords = [
      'hotel', 'hotels', 'accommodation', 'booking', 'stay', 'property'
    ];
    
    // Multiple options keywords
    const comparisonKeywords = [
      'compare', 'choice', 'options', 'alternatives', 'between', 'among',
      'all hotels', 'different hotels', 'multiple', 'various'
    ];
    
    const hasOptimizationKeyword = optimizationKeywords.some(keyword => text.includes(keyword));
    const hasHotelKeyword = hotelKeywords.some(keyword => text.includes(keyword));
    const hasComparisonKeyword = comparisonKeywords.some(keyword => text.includes(keyword));
    
    // Activate if user wants optimization or comparison
    return (hasOptimizationKeyword && hasHotelKeyword) || (hasHotelKeyword && hasComparisonKeyword);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      elizaLogger.info(`[BookingOptimizationAction] Processing booking optimization request: ${message.content.text}`);
      
      // Get the TravelDataService
      const travelService = runtime.getService('travel-data') as TravelDataService;
      if (!travelService) {
        elizaLogger.error('[BookingOptimizationAction] TravelDataService not available');
        await callback({
          text: "❌ Travel optimization service is currently unavailable. Please try again later.",
          content: { error: "TravelDataService not found" }
        });
        return;
      }

      // Parse optimization criteria
      const criteria = await parseOptimizationCriteria(runtime, message.content.text);
      elizaLogger.info(`[BookingOptimizationAction] Parsed criteria:`, criteria);

      // Get travel data
      const travelData = travelService.getTravelData();
      if (!travelData) {
        elizaLogger.warn('[BookingOptimizationAction] No travel data available, forcing update');
        await travelService.forceUpdate();
      }

      // Perform optimization analysis
      const optimization = await performBookingOptimization(travelService, criteria);
      
      // Generate optimization response
      const response = await generateOptimizationResponse(criteria, optimization);
      
      elizaLogger.info(`[BookingOptimizationAction] Generated optimization with ${optimization.alternatives.length} options`);
      
      await callback({
        text: response,
        content: {
          action: "booking_optimization",
          criteria: criteria,
          results: {
            topChoice: optimization.topChoice.hotel.name,
            totalOptions: optimization.summary.totalHotelsCompared,
            averageSavings: optimization.summary.averageSavings,
            bestSavings: optimization.summary.bestSavingsPercentage
          }
        }
      });

    } catch (error) {
      elizaLogger.error('[BookingOptimizationAction] Error processing booking optimization:', error);
      await callback({
        text: "❌ I encountered an error while optimizing your booking. Please try again.",
        content: { error: error.message }
      });
    }
  },

  examples: []
};

async function parseOptimizationCriteria(runtime: IAgentRuntime, text: string): Promise<OptimizationCriteria> {
  try {
    const text_lower = text.toLowerCase();
    const criteria: OptimizationCriteria = { priority: 'value' };
    
    // Determine priority
    if (text_lower.includes('cheap') || text_lower.includes('budget') || text_lower.includes('lowest price')) {
      criteria.priority = 'price';
    } else if (text_lower.includes('luxury') || text_lower.includes('best hotel') || text_lower.includes('premium')) {
      criteria.priority = 'luxury';
    } else if (text_lower.includes('savings') || text_lower.includes('deal') || text_lower.includes('discount')) {
      criteria.priority = 'savings';
    } else if (text_lower.includes('season') || text_lower.includes('timing') || text_lower.includes('when')) {
      criteria.priority = 'season';
    }
    
    // Extract budget
    const budgetMatch = text.match(/(?:budget|under|max|maximum)?\s*€?(\d+(?:,\d+)?)/i);
    if (budgetMatch) {
      criteria.budget = parseInt(budgetMatch[1].replace(',', ''));
    }
    
    // Extract cities
    const cities = [];
    if (text_lower.includes('biarritz')) cities.push('biarritz');
    if (text_lower.includes('bordeaux')) cities.push('bordeaux');
    if (text_lower.includes('monaco')) cities.push('monaco');
    if (cities.length > 0) criteria.cities = cities;
    
    // Extract flexibility
    const flexibilityMatch = text.match(/(\d+)\s*days?\s*flexible?/i);
    if (flexibilityMatch) {
      criteria.flexibility = parseInt(flexibilityMatch[1]);
    }
    
    return criteria;
  } catch (error) {
    elizaLogger.error('[BookingOptimizationAction] Error parsing criteria:', error);
    return { priority: 'value' };
  }
}

async function performBookingOptimization(travelService: TravelDataService, criteria: OptimizationCriteria): Promise<OptimizedRecommendation> {
  const hotels = travelService.getCuratedHotels();
  const optimalWindows = travelService.getOptimalBookingWindows();
  
  // Filter hotels based on criteria
  let filteredHotels = hotels;
  
  if (criteria.cities && criteria.cities.length > 0) {
    filteredHotels = hotels.filter(hotel => 
      criteria.cities!.some(city => hotel.city.toLowerCase() === city.toLowerCase())
    );
  }
  
  if (criteria.budget) {
    filteredHotels = filteredHotels.filter(hotel => hotel.priceRange.min <= criteria.budget!);
  }
  
  // Calculate comparison scores for each hotel
  const comparisons: HotelComparison[] = [];
  
  for (const hotel of filteredHotels) {
    const optimalWindow = optimalWindows.find(w => w.hotelId === hotel.hotelId);
    
    if (optimalWindow && optimalWindow.bestDates.length > 0) {
      const bestDate = optimalWindow.bestDates[0]; // Use best available deal
      
      const valueScore = calculateValueScore(hotel, bestDate);
      const luxuryScore = calculateLuxuryScore(hotel);
      const seasonScore = calculateSeasonScore(bestDate);
      const overallScore = calculateOverallScore(criteria, valueScore, luxuryScore, seasonScore);
      
      comparisons.push({
        hotel,
        bestRate: bestDate.totalPrice,
        savings: bestDate.savings,
        savingsPercentage: bestDate.savingsPercentage,
        checkIn: bestDate.checkIn,
        checkOut: bestDate.checkOut,
        valueScore,
        luxuryScore,
        seasonScore,
        overallScore,
        reasoning: generateReasoning(criteria, hotel, bestDate, overallScore)
      });
    }
  }
  
  // Sort by overall score
  comparisons.sort((a, b) => b.overallScore - a.overallScore);
  
  // Identify top choices for different categories
  const topChoice = comparisons[0];
  const alternatives = comparisons.slice(1, 4); // Top 3 alternatives
  
  const budgetOption = [...comparisons].sort((a, b) => a.bestRate - b.bestRate)[0];
  const luxuryOption = [...comparisons].sort((a, b) => b.luxuryScore - a.luxuryScore)[0];
  const bestValue = [...comparisons].sort((a, b) => b.valueScore - a.valueScore)[0];
  
  // Calculate summary statistics
  const summary = {
    totalHotelsCompared: comparisons.length,
    averageSavings: comparisons.reduce((sum, c) => sum + c.savingsPercentage, 0) / comparisons.length,
    bestSavingsPercentage: Math.max(...comparisons.map(c => c.savingsPercentage)),
    priceRange: {
      min: Math.min(...comparisons.map(c => c.bestRate)),
      max: Math.max(...comparisons.map(c => c.bestRate))
    }
  };
  
  return {
    topChoice,
    alternatives,
    budgetOption,
    luxuryOption,
    bestValue,
    summary
  };
}

function calculateValueScore(hotel: CuratedHotel, bestDate: any): number {
  // Value = (Savings Percentage * 0.4) + (Hotel Rating * 0.3) + (Amenities * 0.3)
  const savingsScore = Math.min(bestDate.savingsPercentage / 100, 1) * 40;
  const ratingScore = (hotel.starRating / 5) * 30;
  const amenitiesScore = Math.min(hotel.amenities.length / 10, 1) * 30;
  
  return savingsScore + ratingScore + amenitiesScore;
}

function calculateLuxuryScore(hotel: CuratedHotel): number {
  // Luxury = Star Rating (40%) + Category Weight (30%) + Amenities (30%)
  const ratingScore = (hotel.starRating / 5) * 40;
  
  const categoryWeights = { palace: 30, luxury: 25, resort: 20, boutique: 15 };
  const categoryScore = categoryWeights[hotel.category] || 10;
  
  const luxuryAmenities = ['spa', 'michelin-dining', 'private-beach', 'golf', 'thalasso-spa'];
  const luxuryAmenitiesCount = hotel.amenities.filter(a => luxuryAmenities.includes(a)).length;
  const amenitiesScore = Math.min(luxuryAmenitiesCount / 5, 1) * 30;
  
  return ratingScore + categoryScore + amenitiesScore;
}

function calculateSeasonScore(bestDate: any): number {
  // Season score based on timing (when the deal is valid)
  const checkInDate = new Date(bestDate.checkIn);
  const month = checkInDate.getMonth() + 1;
  
  // Higher scores for shoulder season (better weather + good value)
  if ([4, 5, 9, 10].includes(month)) return 90; // Spring/Fall
  if ([11, 12, 1, 2, 3].includes(month)) return 70; // Winter (great savings)
  if ([6, 7, 8].includes(month)) return 50; // Summer (high season)
  
  return 60;
}

function calculateOverallScore(criteria: OptimizationCriteria, valueScore: number, luxuryScore: number, seasonScore: number): number {
  switch (criteria.priority) {
    case 'price':
      return valueScore * 0.6 + seasonScore * 0.3 + luxuryScore * 0.1;
    case 'luxury':
      return luxuryScore * 0.6 + valueScore * 0.3 + seasonScore * 0.1;
    case 'savings':
      return valueScore * 0.5 + seasonScore * 0.4 + luxuryScore * 0.1;
    case 'season':
      return seasonScore * 0.5 + valueScore * 0.3 + luxuryScore * 0.2;
    case 'value':
    default:
      return valueScore * 0.4 + luxuryScore * 0.3 + seasonScore * 0.3;
  }
}

function generateReasoning(criteria: OptimizationCriteria, hotel: CuratedHotel, bestDate: any, score: number): string {
  const reasons = [];
  
  if (bestDate.savingsPercentage > 50) {
    reasons.push(`Exceptional ${bestDate.savingsPercentage}% savings`);
  } else if (bestDate.savingsPercentage > 30) {
    reasons.push(`Strong ${bestDate.savingsPercentage}% value`);
  }
  
  if (hotel.category === 'palace') {
    reasons.push('Palace-level luxury');
  } else if (hotel.starRating === 5) {
    reasons.push('5-star premium experience');
  }
  
  const month = new Date(bestDate.checkIn).getMonth() + 1;
  if ([4, 5, 9, 10].includes(month)) {
    reasons.push('Optimal shoulder season timing');
  } else if ([11, 12, 1, 2, 3].includes(month)) {
    reasons.push('Winter season value');
  }
  
  if (hotel.amenities.includes('spa')) {
    reasons.push('Premium spa amenities');
  }
  
  return reasons.slice(0, 3).join(', ') || 'Solid overall value proposition';
}

async function generateOptimizationResponse(criteria: OptimizationCriteria, optimization: OptimizedRecommendation): Promise<string> {
  const { topChoice, alternatives, budgetOption, luxuryOption, bestValue, summary } = optimization;
  
  let response = `🎯 **Smart Booking Optimization Results**\n\n`;
  response += `📊 **Analysis**: Compared ${summary.totalHotelsCompared} luxury properties\n`;
  response += `💰 **Savings Range**: ${summary.averageSavings.toFixed(0)}% average, up to ${summary.bestSavingsPercentage.toFixed(0)}%\n`;
  response += `💵 **Price Range**: €${summary.priceRange.min}-${summary.priceRange.max}/night\n\n`;
  
  // Top recommendation
  const categoryIcon = getCategoryIcon(topChoice.hotel.category);
  response += `🏆 **TOP RECOMMENDATION**\n\n`;
  response += `${categoryIcon} **${topChoice.hotel.name}** (${getCityDisplayName(topChoice.hotel.city)})\n`;
  response += `• **Rate**: €${topChoice.bestRate}/night (${topChoice.savingsPercentage.toFixed(0)}% savings)\n`;
  response += `• **Dates**: ${formatDateRange([topChoice.checkIn, topChoice.checkOut])}\n`;
  response += `• **Why**: ${topChoice.reasoning}\n`;
  response += `• **Score**: ${topChoice.overallScore.toFixed(0)}/100 (${criteria.priority} optimized)\n\n`;
  
  // Category-specific recommendations
  response += `🎭 **CATEGORY LEADERS**\n\n`;
  
  if (budgetOption.hotel.hotelId !== topChoice.hotel.hotelId) {
    response += `💰 **Best Budget**: ${budgetOption.hotel.name} - €${budgetOption.bestRate}/night\n`;
  }
  
  if (luxuryOption.hotel.hotelId !== topChoice.hotel.hotelId) {
    response += `👑 **Most Luxurious**: ${luxuryOption.hotel.name} - ${luxuryOption.hotel.category} level\n`;
  }
  
  if (bestValue.hotel.hotelId !== topChoice.hotel.hotelId) {
    response += `⭐ **Best Value**: ${bestValue.hotel.name} - ${bestValue.savingsPercentage.toFixed(0)}% savings\n`;
  }
  
  response += `\n🔄 **ALTERNATIVES**\n\n`;
  
  for (let i = 0; i < Math.min(2, alternatives.length); i++) {
    const alt = alternatives[i];
    const altIcon = getCategoryIcon(alt.hotel.category);
    response += `${altIcon} **${alt.hotel.name}** (${getCityDisplayName(alt.hotel.city)})\n`;
    response += `• €${alt.bestRate}/night (${alt.savingsPercentage.toFixed(0)}% off) | ${formatDateRange([alt.checkIn, alt.checkOut])}\n`;
    response += `• ${alt.reasoning}\n\n`;
  }
  
  response += `💡 **Optimization Tip**: Based on your "${criteria.priority}" priority, the analysis weighted ${getCriteriaWeighting(criteria.priority)} most heavily.`;
  
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

function getCityDisplayName(city: string): string {
  const cityMap = {
    'biarritz': 'Biarritz',
    'bordeaux': 'Bordeaux', 
    'monaco': 'Monaco'
  };
  return cityMap[city as keyof typeof cityMap] || city;
}

function formatDateRange(dates: string[]): string {
  if (dates.length >= 2) {
    const start = new Date(dates[0]).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    const end = new Date(dates[1]).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  }
  return dates[0] || 'TBD';
}

function getCriteriaWeighting(priority: string): string {
  const weightings = {
    'price': 'lowest rates and budget considerations',
    'luxury': 'premium amenities and service quality',
    'savings': 'maximum discount percentages',
    'season': 'optimal timing and weather',
    'value': 'balanced value proposition'
  };
  return weightings[priority as keyof typeof weightings] || 'overall value';
} 