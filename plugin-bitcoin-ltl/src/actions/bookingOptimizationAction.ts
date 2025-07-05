import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';
import { createActionTemplate, ValidationPatterns, ResponseCreators } from './base/ActionTemplate';
import { TravelDataService } from '../services/TravelDataService';

interface OptimizationCriteria {
  priority: 'price' | 'value' | 'luxury' | 'season' | 'savings';
  budget?: number;
  travelDates?: {
    start: string;
    end: string;
  };
  cities?: string[];
  flexibility?: number;
  partySize?: number;
}

interface HotelComparison {
  hotel: any;
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

export const bookingOptimizationAction: Action = createActionTemplate({
  name: 'BOOKING_OPTIMIZATION',
  description: 'Compare and optimize hotel bookings across multiple properties for maximum value, analyzing rates, timing, and seasonal patterns',
  similes: ['OPTIMIZE_BOOKING', 'COMPARE_HOTELS', 'BEST_VALUE_HOTELS', 'HOTEL_COMPARISON', 'OPTIMIZE_TRAVEL', 'BOOKING_STRATEGY', 'HOTEL_ANALYSIS', 'TRAVEL_OPTIMIZATION', 'SMART_BOOKING', 'BEST_DEALS'],
  
  examples: [
    [
      {
        name: '{{user}}',
        content: { text: 'Compare hotels in Monaco for best value in March' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Monaco hotel optimization: Hotel Hermitage €520/night (33% savings) Apr 5-12 wins overall. Alternatives: Hotel Metropole €680/night (25% off), Monte-Carlo Bay €580/night (28% off). 5 properties compared, 29% average savings. Best value: shoulder season timing. Sound money demands optimal allocation.',
          thought: 'User wants hotel optimization analysis for Monaco. I need to compare available properties, assess value propositions, analyze seasonal pricing, and provide strategic recommendations while maintaining Bitcoin-enabled travel philosophy.',
          actions: ['BOOKING_OPTIMIZATION'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Optimize my luxury hotel booking strategy for French Riviera' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'French Riviera luxury strategy: Book 6-12 months ahead for peak season access. Top choice: Hotel du Cap €1,200/night (May-Sept), alternatives: Villa Ephrussi €980/night, Hotel Negresco €850/night. Luxury optimization: direct booking benefits + VIP recognition. Bitcoin wealth enables premium positioning.',
          thought: 'User seeking luxury booking optimization strategy. I need to analyze premium properties, identify optimal booking windows, assess luxury value propositions, and provide strategic guidance for maximizing luxury travel experiences.',
          actions: ['BOOKING_OPTIMIZATION'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Which hotel gives best value between Biarritz and Bordeaux?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Biarritz vs Bordeaux optimization: Hotel du Palais (Biarritz) €480/night (35% off) Apr 10-15 beats Grand Hotel (Bordeaux) €420/night (28% off). Biarritz wins: oceanfront luxury + higher savings percentage. Value score: 87 vs 76. Coastal Bitcoin lifestyle optimized.',
          thought: 'User comparing cities for best hotel value. I need to analyze properties across both locations, compare value propositions, assess location benefits, and provide clear recommendation with reasoning.',
          actions: ['BOOKING_OPTIMIZATION'],
        },
      },
    ],
  ],
  
  validateFn: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    return ValidationPatterns.isBookingOptimizationRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info('Booking optimization action triggered');
    
    const thoughtProcess = 'User is requesting hotel booking optimization. I need to analyze available properties, compare value propositions, assess seasonal pricing, and provide strategic recommendations while maintaining Bitcoin travel philosophy.';
    
    try {
      const travelService = runtime.getService('travel-data') as TravelDataService;
      
      if (!travelService) {
        logger.warn('TravelDataService not available');
        
        const fallbackResponse = ResponseCreators.createErrorResponse(
          'BOOKING_OPTIMIZATION',
          'Travel service unavailable',
          'Booking optimization service temporarily unavailable. Like Bitcoin network congestion, luxury travel data flows require patience.'
        );
        
        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Parse optimization criteria from message
      const messageText = message.content?.text || '';
      const criteria = parseOptimizationCriteria(messageText);

      // Get travel data
      const travelData = travelService.getTravelData();
      if (!travelData) {
        logger.warn('No travel data available for optimization');
        
        const noDataResponse = ResponseCreators.createErrorResponse(
          'BOOKING_OPTIMIZATION',
          'Hotel data unavailable',
          'Travel data temporarily unavailable. Like blockchain validation, quality optimization requires complete data sets.'
        );
        
        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Perform optimization analysis
      const optimization = performBookingOptimization(travelService, criteria);
      
      if (!optimization || optimization.alternatives.length === 0) {
        logger.info('No optimization results available');
        
        const noResultsResponse = ResponseCreators.createStandardResponse(
          thoughtProcess,
          'No hotels match your optimization criteria currently. Like Bitcoin mining difficulty adjustments, optimal booking windows require patience and timing.',
          'BOOKING_OPTIMIZATION',
          {
            criteria: criteria,
            resultCount: 0
          }
        );
        
        if (callback) {
          await callback(noResultsResponse);
        }
        return true;
      }

      // Generate optimization response
      const responseText = generateOptimizationResponse(criteria, optimization);

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        responseText,
        'BOOKING_OPTIMIZATION',
        {
          criteria: criteria,
          topChoice: optimization.topChoice.hotel.name,
          totalOptions: optimization.summary.totalHotelsCompared,
          averageSavings: optimization.summary.averageSavings,
          bestSavings: optimization.summary.bestSavingsPercentage,
          priceRange: optimization.summary.priceRange
        }
      );

      if (callback) {
        await callback(response);
      }

      logger.info('Booking optimization completed successfully');
      return true;

    } catch (error) {
      logger.error('Failed to process booking optimization:', (error as Error).message);
      
      const errorResponse = ResponseCreators.createErrorResponse(
        'BOOKING_OPTIMIZATION',
        (error as Error).message,
        'Booking optimization failed. Like Bitcoin transactions, sometimes the optimal path requires multiple attempts.'
      );
      
      if (callback) {
        await callback(errorResponse);
      }
      
      return false;
    }
  },
});

/**
 * Parse optimization criteria from message text
 */
function parseOptimizationCriteria(text: string): OptimizationCriteria {
  const criteria: OptimizationCriteria = { priority: 'value' };
  
  // Determine priority
  if (text.includes('cheap') || text.includes('budget') || text.includes('lowest price')) {
    criteria.priority = 'price';
  } else if (text.includes('luxury') || text.includes('best hotel') || text.includes('premium')) {
    criteria.priority = 'luxury';
  } else if (text.includes('savings') || text.includes('deal') || text.includes('discount')) {
    criteria.priority = 'savings';
  } else if (text.includes('season') || text.includes('timing') || text.includes('when')) {
    criteria.priority = 'season';
  }
  
  // Extract budget
  const budgetMatch = text.match(/(?:budget|under|max|maximum)?\s*€?(\d+(?:,\d+)?)/i);
  if (budgetMatch) {
    criteria.budget = parseInt(budgetMatch[1].replace(',', ''));
  }
  
  // Extract cities
  const cities = [];
  if (text.includes('biarritz')) cities.push('biarritz');
  if (text.includes('bordeaux')) cities.push('bordeaux');
  if (text.includes('monaco')) cities.push('monaco');
  if (cities.length > 0) criteria.cities = cities;
  
  // Extract flexibility
  const flexibilityMatch = text.match(/(\d+)\s*days?\s*flexible?/i);
  if (flexibilityMatch) {
    criteria.flexibility = parseInt(flexibilityMatch[1]);
  }
  
  return criteria;
}

/**
 * Perform booking optimization analysis
 */
function performBookingOptimization(travelService: TravelDataService, criteria: OptimizationCriteria): OptimizedRecommendation | null {
  const hotels = travelService.getCuratedHotels() || [];
  const optimalWindows = travelService.getOptimalBookingWindows() || [];
  
  // Filter hotels based on criteria
  let filteredHotels = hotels;
  
  if (criteria.cities && criteria.cities.length > 0) {
    filteredHotels = hotels.filter(hotel => 
      criteria.cities!.some(city => hotel.city?.toLowerCase() === city.toLowerCase())
    );
  }
  
  if (criteria.budget) {
    filteredHotels = filteredHotels.filter(hotel => hotel.priceRange?.min <= criteria.budget!);
  }
  
  // Calculate comparison scores for each hotel
  const comparisons: HotelComparison[] = [];
  
  for (const hotel of filteredHotels) {
    const optimalWindow = optimalWindows.find(w => w.hotelId === hotel.hotelId);
    
    if (optimalWindow && optimalWindow.bestDates?.length > 0) {
      const bestDate = optimalWindow.bestDates[0]; // Use best available deal
      
      const valueScore = calculateValueScore(hotel, bestDate);
      const luxuryScore = calculateLuxuryScore(hotel);
      const seasonScore = calculateSeasonScore(bestDate);
      const overallScore = calculateOverallScore(criteria, valueScore, luxuryScore, seasonScore);
      
      comparisons.push({
        hotel,
        bestRate: bestDate.totalPrice || 0,
        savings: bestDate.savings || 0,
        savingsPercentage: bestDate.savingsPercentage || 0,
        checkIn: bestDate.checkIn || '',
        checkOut: bestDate.checkOut || '',
        valueScore,
        luxuryScore,
        seasonScore,
        overallScore,
        reasoning: generateReasoning(criteria, hotel, bestDate, overallScore)
      });
    }
  }
  
  if (comparisons.length === 0) {
    return null;
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

/**
 * Calculate value score for hotel
 */
function calculateValueScore(hotel: any, bestDate: any): number {
  // Value = (Savings Percentage * 0.4) + (Hotel Rating * 0.3) + (Amenities * 0.3)
  const savingsScore = Math.min((bestDate.savingsPercentage || 0) / 100, 1) * 40;
  const ratingScore = ((hotel.starRating || 0) / 5) * 30;
  const amenitiesScore = Math.min((hotel.amenities?.length || 0) / 10, 1) * 30;
  
  return savingsScore + ratingScore + amenitiesScore;
}

/**
 * Calculate luxury score for hotel
 */
function calculateLuxuryScore(hotel: any): number {
  // Luxury = Star Rating (40%) + Category Weight (30%) + Amenities (30%)
  const ratingScore = ((hotel.starRating || 0) / 5) * 40;
  
  const categoryWeights: { [key: string]: number } = { 
    palace: 30, 
    luxury: 25, 
    resort: 20, 
    boutique: 15 
  };
  const categoryScore = categoryWeights[hotel.category] || 10;
  
  const luxuryAmenities = ['spa', 'michelin-dining', 'private-beach', 'golf', 'thalasso-spa'];
  const luxuryAmenitiesCount = (hotel.amenities || []).filter((a: string) => luxuryAmenities.includes(a)).length;
  const amenitiesScore = Math.min(luxuryAmenitiesCount / 5, 1) * 30;
  
  return ratingScore + categoryScore + amenitiesScore;
}

/**
 * Calculate season score for booking dates
 */
function calculateSeasonScore(bestDate: any): number {
  const checkInDate = new Date(bestDate.checkIn);
  const month = checkInDate.getMonth() + 1;
  
  // Higher scores for shoulder season (better weather + good value)
  if ([4, 5, 9, 10].includes(month)) return 90; // Spring/Fall
  if ([11, 12, 1, 2, 3].includes(month)) return 70; // Winter (great savings)
  if ([6, 7, 8].includes(month)) return 50; // Summer (high season)
  
  return 60;
}

/**
 * Calculate overall score based on criteria
 */
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

/**
 * Generate reasoning for hotel recommendation
 */
function generateReasoning(criteria: OptimizationCriteria, hotel: any, bestDate: any, score: number): string {
  const reasons = [];
  
  if ((bestDate.savingsPercentage || 0) > 50) {
    reasons.push(`Exceptional ${(bestDate.savingsPercentage || 0).toFixed(0)}% savings`);
  } else if ((bestDate.savingsPercentage || 0) > 30) {
    reasons.push(`Strong ${(bestDate.savingsPercentage || 0).toFixed(0)}% value`);
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
  
  if (hotel.amenities?.includes('spa')) {
    reasons.push('Premium spa amenities');
  }
  
  return reasons.slice(0, 3).join(', ') || 'Solid overall value proposition';
}

/**
 * Generate optimization response text
 */
function generateOptimizationResponse(criteria: OptimizationCriteria, optimization: OptimizedRecommendation): string {
  const { topChoice, alternatives, summary } = optimization;
  
  // Format top choice
  const topChoiceText = `${topChoice.hotel.name} €${topChoice.bestRate}/night (${topChoice.savingsPercentage.toFixed(0)}% savings) ${formatDateRange([topChoice.checkIn, topChoice.checkOut])}`;
  
  // Format alternatives
  let alternativesText = '';
  if (alternatives.length > 0) {
    const altTexts = alternatives.slice(0, 2).map(alt => 
      `${alt.hotel.name} €${alt.bestRate}/night (${alt.savingsPercentage.toFixed(0)}% off)`
    );
    alternativesText = `. Alternatives: ${altTexts.join(', ')}`;
  }
  
  // Format summary
  const summaryText = `${summary.totalHotelsCompared} properties compared, ${summary.averageSavings.toFixed(0)}% average savings`;
  
  // Add Bitcoin philosophy
  const bitcoinQuotes = [
    'Sound money demands optimal allocation.',
    'Bitcoin wealth enables premium positioning.',
    'Hard money, smart choices.',
    'Stack sats, optimize stays.',
    'Digital gold, analog luxury.'
  ];
  
  const bitcoinQuote = bitcoinQuotes[Math.floor(Math.random() * bitcoinQuotes.length)];
  
  return `${getCityDisplayName(criteria.cities)} hotel optimization: ${topChoiceText} wins overall${alternativesText}. ${summaryText}. Best value: ${topChoice.reasoning.toLowerCase()}. ${bitcoinQuote}`;
}

/**
 * Get display name for cities
 */
function getCityDisplayName(cities?: string[]): string {
  if (!cities || cities.length === 0) return 'Multi-city';
  
  const cityMap: { [key: string]: string } = {
    'biarritz': 'Biarritz',
    'bordeaux': 'Bordeaux', 
    'monaco': 'Monaco'
  };
  
  if (cities.length === 1) {
    return cityMap[cities[0]] || cities[0];
  }
  
  return cities.map(city => cityMap[city] || city).join(' & ');
}

/**
 * Format date range for display
 */
function formatDateRange(dates: string[]): string {
  if (dates.length >= 2) {
    const start = new Date(dates[0]).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    const end = new Date(dates[1]).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    return `${start}-${end}`;
  }
  return dates[0] || 'TBD';
} 