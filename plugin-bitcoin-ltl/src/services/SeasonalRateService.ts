import { logger } from '@elizaos/core';
import type { PerfectDayOpportunity } from '../types';
import type { CuratedHotel } from './TravelDataService';

export interface SeasonalRateData {
  hotelId: string;
  hotelName: string;
  month: number; // 1-12
  averageRate: number;
  lowRate: number;
  highRate: number;
  perfectDayRate: number;
  perfectDayDate: string; // YYYY-MM-DD format
  savingsPercentage: number;
  seasonalFactors: string[];
  bookingRecommendation: 'excellent' | 'good' | 'fair' | 'avoid';
}

export interface WeeklySuggestion {
  hotelId: string;
  hotelName: string;
  city: string;
  suggestedDate: string;
  currentRate: number;
  averageRate: number;
  savingsPercentage: number;
  confidenceScore: number;
  reasons: string[];
  urgency: 'high' | 'medium' | 'low';
  bookingWindow: string; // e.g., "Book within 7 days"
}

export class SeasonalRateService {
  private readonly seasonalRates: SeasonalRateData[] = [
    // BIARRITZ HOTELS
    {
      hotelId: 'biarritz_palace',
      hotelName: 'Hôtel du Palais',
      month: 1, // January
      averageRate: 650,
      lowRate: 450,
      highRate: 850,
      perfectDayRate: 420,
      perfectDayDate: '2025-01-15',
      savingsPercentage: 35,
      seasonalFactors: ['Off-season', 'Post-holiday', 'Surf season ends'],
      bookingRecommendation: 'excellent'
    },
    {
      hotelId: 'biarritz_palace',
      hotelName: 'Hôtel du Palais',
      month: 2,
      averageRate: 600,
      lowRate: 400,
      highRate: 800,
      perfectDayRate: 380,
      perfectDayDate: '2025-02-20',
      savingsPercentage: 37,
      seasonalFactors: ['Winter rates', 'Low demand', 'Perfect for spa'],
      bookingRecommendation: 'excellent'
    },
    {
      hotelId: 'biarritz_palace',
      hotelName: 'Hôtel du Palais',
      month: 6, // June
      averageRate: 1200,
      lowRate: 900,
      highRate: 1500,
      perfectDayRate: 850,
      perfectDayDate: '2025-06-10',
      savingsPercentage: 29,
      seasonalFactors: ['Early summer', 'Before peak season', 'Great weather'],
      bookingRecommendation: 'good'
    },
    {
      hotelId: 'biarritz_palace',
      hotelName: 'Hôtel du Palais',
      month: 9, // September
      averageRate: 1000,
      lowRate: 700,
      highRate: 1300,
      perfectDayRate: 650,
      perfectDayDate: '2025-09-15',
      savingsPercentage: 35,
      seasonalFactors: ['Post-summer', 'Still warm', 'Less crowded'],
      bookingRecommendation: 'excellent'
    },
    {
      hotelId: 'biarritz_palace',
      hotelName: 'Hôtel du Palais',
      month: 12, // December
      averageRate: 800,
      lowRate: 500,
      highRate: 1200,
      perfectDayRate: 450,
      perfectDayDate: '2025-12-05',
      savingsPercentage: 44,
      seasonalFactors: ['Pre-holiday', 'Winter rates', 'Festive atmosphere'],
      bookingRecommendation: 'excellent'
    },

    // BORDEAUX HOTELS
    {
      hotelId: 'bordeaux_intercontinental',
      hotelName: 'InterContinental Bordeaux',
      month: 1,
      averageRate: 350,
      lowRate: 250,
      highRate: 450,
      perfectDayRate: 220,
      perfectDayDate: '2025-01-20',
      savingsPercentage: 37,
      seasonalFactors: ['Post-holiday', 'Wine season quiet', 'Cultural events'],
      bookingRecommendation: 'excellent'
    },
    {
      hotelId: 'bordeaux_intercontinental',
      hotelName: 'InterContinental Bordeaux',
      month: 5, // May
      averageRate: 450,
      lowRate: 350,
      highRate: 550,
      perfectDayRate: 320,
      perfectDayDate: '2025-05-12',
      savingsPercentage: 29,
      seasonalFactors: ['Spring wine tours', 'Before summer peak', 'Perfect weather'],
      bookingRecommendation: 'good'
    },
    {
      hotelId: 'bordeaux_intercontinental',
      hotelName: 'InterContinental Bordeaux',
      month: 10, // October
      averageRate: 400,
      lowRate: 300,
      highRate: 500,
      perfectDayRate: 280,
      perfectDayDate: '2025-10-18',
      savingsPercentage: 30,
      seasonalFactors: ['Harvest season', 'Wine festivals', 'Autumn colors'],
      bookingRecommendation: 'excellent'
    },

    // MONACO HOTELS
    {
      hotelId: 'monaco_hermitage',
      hotelName: 'Hotel Hermitage Monte-Carlo',
      month: 1,
      averageRate: 800,
      lowRate: 600,
      highRate: 1000,
      perfectDayRate: 550,
      perfectDayDate: '2025-01-25',
      savingsPercentage: 31,
      seasonalFactors: ['Post-holiday', 'Winter rates', 'Luxury shopping'],
      bookingRecommendation: 'excellent'
    },
    {
      hotelId: 'monaco_hermitage',
      hotelName: 'Hotel Hermitage Monte-Carlo',
      month: 3, // March
      averageRate: 900,
      lowRate: 700,
      highRate: 1100,
      perfectDayRate: 650,
      perfectDayDate: '2025-03-08',
      savingsPercentage: 28,
      seasonalFactors: ['Pre-spring', 'Before Grand Prix', 'Mild weather'],
      bookingRecommendation: 'good'
    },
    {
      hotelId: 'monaco_hermitage',
      hotelName: 'Hotel Hermitage Monte-Carlo',
      month: 11, // November
      averageRate: 750,
      lowRate: 550,
      highRate: 950,
      perfectDayRate: 500,
      perfectDayDate: '2025-11-22',
      savingsPercentage: 33,
      seasonalFactors: ['Post-summer', 'Before holidays', 'Cultural events'],
      bookingRecommendation: 'excellent'
    },

    // Additional hotels with key seasonal opportunities
    {
      hotelId: 'biarritz_regina',
      hotelName: 'Hôtel Villa Eugénie',
      month: 4, // April
      averageRate: 550,
      lowRate: 400,
      highRate: 700,
      perfectDayRate: 350,
      perfectDayDate: '2025-04-15',
      savingsPercentage: 36,
      seasonalFactors: ['Spring surf', 'Before summer', 'Easter period'],
      bookingRecommendation: 'excellent'
    },
    {
      hotelId: 'bordeaux_burdigala',
      hotelName: 'Burdigala Hotel',
      month: 7, // July
      averageRate: 380,
      lowRate: 300,
      highRate: 460,
      perfectDayRate: 280,
      perfectDayDate: '2025-07-08',
      savingsPercentage: 26,
      seasonalFactors: ['Summer wine tours', 'Festival season', 'Peak demand'],
      bookingRecommendation: 'good'
    },
    {
      hotelId: 'monaco_metropole',
      hotelName: 'Hotel Metropole Monte-Carlo',
      month: 8, // August
      averageRate: 1200,
      lowRate: 900,
      highRate: 1500,
      perfectDayRate: 850,
      perfectDayDate: '2025-08-12',
      savingsPercentage: 29,
      seasonalFactors: ['Peak summer', 'Beach season', 'Luxury demand'],
      bookingRecommendation: 'good'
    }
  ];

  /**
   * Get weekly hotel suggestions based on current date and seasonal patterns
   */
  public getWeeklySuggestions(limit: number = 5): WeeklySuggestion[] {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const suggestions: WeeklySuggestion[] = [];

    // Get seasonal rates for current and next 2 months
    const relevantMonths = [currentMonth, currentMonth + 1, currentMonth + 2].map(m => m > 12 ? m - 12 : m);
    
    for (const month of relevantMonths) {
      const monthRates = this.seasonalRates.filter(rate => rate.month === month);
      
      for (const rate of monthRates) {
        const perfectDate = new Date(rate.perfectDayDate);
        const daysUntilPerfect = Math.ceil((perfectDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only suggest if perfect day is within next 30 days
        if (daysUntilPerfect >= 0 && daysUntilPerfect <= 30) {
          const urgency = this.calculateUrgency(daysUntilPerfect, rate.savingsPercentage);
          const confidenceScore = this.calculateConfidence(rate.savingsPercentage, rate.seasonalFactors.length);
          
          suggestions.push({
            hotelId: rate.hotelId,
            hotelName: rate.hotelName,
            city: this.getCityFromHotelId(rate.hotelId),
            suggestedDate: rate.perfectDayDate,
            currentRate: rate.perfectDayRate,
            averageRate: rate.averageRate,
            savingsPercentage: rate.savingsPercentage,
            confidenceScore: confidenceScore,
            reasons: rate.seasonalFactors,
            urgency: urgency,
            bookingWindow: this.getBookingWindow(daysUntilPerfect)
          });
        }
      }
    }

    // Sort by savings percentage and confidence score
    suggestions.sort((a, b) => {
      const aScore = a.savingsPercentage * a.confidenceScore;
      const bScore = b.savingsPercentage * b.confidenceScore;
      return bScore - aScore;
    });

    return suggestions.slice(0, limit);
  }

  /**
   * Get perfect day opportunities for a specific hotel
   */
  public getPerfectDaysForHotel(hotelId: string): PerfectDayOpportunity[] {
    const hotelRates = this.seasonalRates.filter(rate => rate.hotelId === hotelId);
    const opportunities: PerfectDayOpportunity[] = [];

    for (const rate of hotelRates) {
      if (rate.savingsPercentage >= 25) { // Only include significant savings
        opportunities.push({
          hotelId: rate.hotelId,
          hotelName: rate.hotelName,
          perfectDate: rate.perfectDayDate,
          currentRate: rate.perfectDayRate,
          averageRate: rate.averageRate,
          savingsPercentage: rate.savingsPercentage,
          confidenceScore: this.calculateConfidence(rate.savingsPercentage, rate.seasonalFactors.length),
          reasons: rate.seasonalFactors,
          urgency: this.calculateUrgency(0, rate.savingsPercentage) // Assume immediate availability
        });
      }
    }

    return opportunities.sort((a, b) => b.savingsPercentage - a.savingsPercentage);
  }

  /**
   * Get seasonal analysis for a specific city
   */
  public getCitySeasonalAnalysis(city: string): SeasonalRateData[] {
    const cityHotels = this.seasonalRates.filter(rate => 
      this.getCityFromHotelId(rate.hotelId) === city.toLowerCase()
    );
    
    return cityHotels.sort((a, b) => a.month - b.month);
  }

  /**
   * Get current month's best opportunities
   */
  public getCurrentMonthOpportunities(): WeeklySuggestion[] {
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthRates = this.seasonalRates.filter(rate => rate.month === currentMonth);
    
    return currentMonthRates
      .filter(rate => rate.savingsPercentage >= 20)
      .map(rate => ({
        hotelId: rate.hotelId,
        hotelName: rate.hotelName,
        city: this.getCityFromHotelId(rate.hotelId),
        suggestedDate: rate.perfectDayDate,
        currentRate: rate.perfectDayRate,
        averageRate: rate.averageRate,
        savingsPercentage: rate.savingsPercentage,
        confidenceScore: this.calculateConfidence(rate.savingsPercentage, rate.seasonalFactors.length),
        reasons: rate.seasonalFactors,
        urgency: 'high' as const,
        bookingWindow: 'Book immediately'
      }))
      .sort((a, b) => b.savingsPercentage - a.savingsPercentage);
  }

  private calculateUrgency(daysUntilPerfect: number, savingsPercentage: number): 'high' | 'medium' | 'low' {
    if (daysUntilPerfect <= 7 || savingsPercentage >= 35) return 'high';
    if (daysUntilPerfect <= 14 || savingsPercentage >= 25) return 'medium';
    return 'low';
  }

  private calculateConfidence(savingsPercentage: number, factorCount: number): number {
    // Base confidence on savings percentage and number of supporting factors
    const baseConfidence = Math.min(savingsPercentage / 40, 1); // Max 100% confidence at 40% savings
    const factorBonus = Math.min(factorCount * 0.1, 0.3); // Up to 30% bonus for multiple factors
    return Math.min(baseConfidence + factorBonus, 1);
  }

  private getBookingWindow(daysUntilPerfect: number): string {
    if (daysUntilPerfect <= 3) return 'Book immediately';
    if (daysUntilPerfect <= 7) return 'Book within 7 days';
    if (daysUntilPerfect <= 14) return 'Book within 14 days';
    return 'Book within 30 days';
  }

  private getCityFromHotelId(hotelId: string): string {
    if (hotelId.startsWith('biarritz')) return 'biarritz';
    if (hotelId.startsWith('bordeaux')) return 'bordeaux';
    if (hotelId.startsWith('monaco')) return 'monaco';
    return 'unknown';
  }

  /**
   * Get all seasonal rate data (for debugging/testing)
   */
  public getAllSeasonalRates(): SeasonalRateData[] {
    return this.seasonalRates;
  }
} 