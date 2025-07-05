import { IAgentRuntime, Provider, elizaLogger, Memory, State } from '@elizaos/core';
import { LifestyleDataService } from '../services/LifestyleDataService';

/**
 * Lifestyle Provider - Injects contextual lifestyle and luxury destination information
 * 
 * This dynamic provider adds lifestyle context including:
 * - Weather conditions in luxury European destinations
 * - Marine and surf conditions for coastal cities
 * - Air quality and environmental data
 * - Luxury hotel availability and rates
 * - Seasonal travel recommendations
 * - Optimal booking periods analysis
 * 
 * Usage: Include 'lifestyle' in dynamic providers when lifestyle or travel-related queries are made
 */
export const lifestyleProvider: Provider = {
  name: 'lifestyle',
  description: 'Provides weather, luxury destinations, and lifestyle optimization data',
  dynamic: true, // Only loads when explicitly requested
  position: 6, // After market data and before complex analysis
  
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    elizaLogger.debug('🌤️ [LifestyleProvider] Providing lifestyle and destination context');
    
    try {
      // Get the lifestyle data service
      const lifestyleService = runtime.getService('lifestyle-data') as LifestyleDataService;
      if (!lifestyleService) {
        elizaLogger.warn('[LifestyleProvider] LifestyleDataService not available');
        return {
          text: 'Lifestyle and weather data temporarily unavailable.',
          values: {
            lifestyleDataAvailable: false,
            error: 'Service not found'
          },
        };
      }

      // Get comprehensive lifestyle data
      const weatherData = lifestyleService.getWeatherData();
      const luxuryHotels = lifestyleService.getLuxuryHotels();
      const optimalBookingPeriods = await lifestyleService.getOptimalBookingPeriods();
      
      if (!weatherData) {
        elizaLogger.debug('[LifestyleProvider] No lifestyle data available yet');
        return {
          text: 'Lifestyle and weather data is being updated. Please try again in a few moments.',
          values: {
            lifestyleDataAvailable: false,
            updating: true
          },
        };
      }

      // Analyze current conditions
      const destinationAnalysis = analyzeDestinationConditions(weatherData);
      
      // Find optimal destinations
      const optimalDestinations = findOptimalDestinations(weatherData, destinationAnalysis);
      
      // Analyze travel opportunities
      const travelOpportunities = analyzeTravelOpportunities(optimalBookingPeriods, weatherData);
      
      // Build lifestyle context
      const lifestyleContext = buildLifestyleContext(
        destinationAnalysis,
        optimalDestinations,
        travelOpportunities,
        weatherData,
        luxuryHotels
      );

      elizaLogger.debug(`[LifestyleProvider] Providing context for ${weatherData.cities.length} luxury destinations`);
      
      return {
        text: lifestyleContext,
        values: {
          lifestyleDataAvailable: true,
          destinationsCount: weatherData.cities.length,
          luxuryHotelsCount: luxuryHotels.length,
          bestWeatherCity: weatherData.summary.bestWeatherCity,
          bestSurfConditions: weatherData.summary.bestSurfConditions,
          averageTemp: weatherData.summary.averageTemp,
          windConditions: weatherData.summary.windConditions,
          uvRisk: weatherData.summary.uvRisk,
          airQuality: weatherData.summary.airQuality,
          optimalDestinationsCount: optimalDestinations.excellent.length,
          travelOpportunitiesCount: travelOpportunities.length,
          currentSeason: getCurrentSeason(),
          // Include data for actions to access
          weatherData: weatherData,
          luxuryHotels: luxuryHotels,
          optimalBookingPeriods: optimalBookingPeriods,
          destinationAnalysis: destinationAnalysis,
          optimalDestinations: optimalDestinations,
          travelOpportunities: travelOpportunities
        },
      };
      
    } catch (error) {
      elizaLogger.error('[LifestyleProvider] Error providing lifestyle context:', error);
      return {
        text: 'Lifestyle services encountered an error. Please try again later.',
        values: {
          lifestyleDataAvailable: false,
          error: error.message
        },
      };
    }
  }
};

/**
 * Helper function to analyze destination conditions
 */
function analyzeDestinationConditions(weatherData: any): any {
  const analysis = {
    excellent: [],
    good: [],
    fair: [],
    poor: [],
    overallConditions: 'mixed'
  };
  
  if (weatherData?.cities) {
    weatherData.cities.forEach((city: any) => {
      const score = calculateDestinationScore(city);
      city.lifestyleScore = score;
      
      if (score >= 80) {
        analysis.excellent.push(city);
      } else if (score >= 65) {
        analysis.good.push(city);
      } else if (score >= 50) {
        analysis.fair.push(city);
      } else {
        analysis.poor.push(city);
      }
    });
    
    // Determine overall conditions
    if (analysis.excellent.length > 0) {
      analysis.overallConditions = 'excellent';
    } else if (analysis.good.length > analysis.fair.length) {
      analysis.overallConditions = 'good';
    } else if (analysis.poor.length > analysis.good.length) {
      analysis.overallConditions = 'challenging';
    }
  }
  
  return analysis;
}

/**
 * Helper function to calculate destination score
 */
function calculateDestinationScore(city: any): number {
  let score = 50; // Base score
  
  if (city.weather?.current?.temperature_2m) {
    const temp = city.weather.current.temperature_2m;
    // Optimal temp range 18-26°C
    if (temp >= 18 && temp <= 26) {
      score += 20;
    } else if (temp >= 15 && temp <= 30) {
      score += 10;
    } else if (temp < 10 || temp > 35) {
      score -= 20;
    }
  }
  
  if (city.weather?.current?.wind_speed_10m) {
    const wind = city.weather.current.wind_speed_10m;
    // Light to moderate wind is preferred
    if (wind <= 15) {
      score += 10;
    } else if (wind > 25) {
      score -= 15;
    }
  }
  
  if (city.airQuality?.current?.pm2_5) {
    const pm25 = city.airQuality.current.pm2_5;
    // Good air quality
    if (pm25 <= 10) {
      score += 15;
    } else if (pm25 <= 25) {
      score += 5;
    } else if (pm25 > 50) {
      score -= 10;
    }
  }
  
  if (city.airQuality?.current?.uv_index) {
    const uv = city.airQuality.current.uv_index;
    // Moderate UV is ideal
    if (uv >= 3 && uv <= 6) {
      score += 10;
    } else if (uv > 8) {
      score -= 5;
    }
  }
  
  // Marine conditions bonus for coastal cities
  if (city.marine) {
    if (city.marine.current?.wave_height <= 2) {
      score += 10; // Calm seas
    }
    if (city.marine.current?.sea_surface_temperature >= 18) {
      score += 10; // Comfortable water
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Helper function to find optimal destinations
 */
function findOptimalDestinations(weatherData: any, analysis: any): any {
  const optimal = {
    excellent: analysis.excellent.sort((a: any, b: any) => b.lifestyleScore - a.lifestyleScore),
    beachConditions: [],
    wineRegions: [],
    cityBreaks: []
  };
  
  if (weatherData?.cities) {
    // Find best beach conditions
    optimal.beachConditions = weatherData.cities
      .filter((city: any) => city.marine && city.lifestyleScore > 60)
      .sort((a: any, b: any) => b.lifestyleScore - a.lifestyleScore);
    
    // Wine regions (Bordeaux typically)
    optimal.wineRegions = weatherData.cities
      .filter((city: any) => city.city?.includes('bordeaux') || city.displayName?.includes('Bordeaux'))
      .filter((city: any) => city.lifestyleScore > 50);
    
    // City breaks (any with good scores)
    optimal.cityBreaks = weatherData.cities
      .filter((city: any) => city.lifestyleScore > 65)
      .sort((a: any, b: any) => b.lifestyleScore - a.lifestyleScore);
  }
  
  return optimal;
}

/**
 * Helper function to analyze travel opportunities
 */
function analyzeTravelOpportunities(bookingPeriods: any, weatherData: any): any[] {
  const opportunities = [];
  
  if (bookingPeriods && Array.isArray(bookingPeriods)) {
    bookingPeriods.forEach((period: any) => {
      if (period.recommendationScore > 70) {
        opportunities.push({
          hotel: period.hotelName,
          period: period.period.monthName,
          savings: period.savingsFromPeak.percentage,
          weatherScore: period.weatherDuringPeriod.suitabilityScore,
          recommendationScore: period.recommendationScore,
          reasons: period.reasonsForLowRates
        });
      }
    });
  }
  
  return opportunities.sort((a, b) => b.recommendationScore - a.recommendationScore);
}

/**
 * Helper function to get current season
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
}

/**
 * Helper function to build lifestyle context
 */
function buildLifestyleContext(
  destinationAnalysis: any,
  optimalDestinations: any,
  travelOpportunities: any[],
  weatherData: any,
  luxuryHotels: any[]
): string {
  const context = [];
  
  // Lifestyle overview
  context.push(`🌤️ LIFESTYLE & DESTINATIONS CONTEXT`);
  context.push(`🏆 Overall conditions: ${destinationAnalysis.overallConditions}`);
  context.push(`📍 Best weather: ${weatherData.summary.bestWeatherCity}`);
  context.push(`🌊 Best surf: ${weatherData.summary.bestSurfConditions || 'N/A'}`);
  context.push('');
  
  // Current conditions summary
  context.push(`⚡ CURRENT CONDITIONS:`);
  context.push(`• Average temperature: ${weatherData.summary.averageTemp?.toFixed(1)}°C`);
  context.push(`• Wind conditions: ${weatherData.summary.windConditions}`);
  context.push(`• UV risk level: ${weatherData.summary.uvRisk}`);
  context.push(`• Air quality: ${weatherData.summary.airQuality}`);
  context.push('');
  
  // Optimal destinations
  if (optimalDestinations.excellent.length > 0) {
    context.push(`🏖️ EXCELLENT CONDITIONS:`);
    optimalDestinations.excellent.slice(0, 3).forEach((dest: any, index: number) => {
      const temp = dest.weather?.current?.temperature_2m?.toFixed(1) || 'N/A';
      context.push(`${index + 1}. ${dest.displayName}: ${temp}°C (Score: ${dest.lifestyleScore}/100)`);
    });
    context.push('');
  }
  
  // Beach conditions
  if (optimalDestinations.beachConditions.length > 0) {
    context.push(`🌊 COASTAL CONDITIONS:`);
    optimalDestinations.beachConditions.slice(0, 2).forEach((dest: any) => {
      const waveHeight = dest.marine?.current?.wave_height?.toFixed(1) || 'N/A';
      const seaTemp = dest.marine?.current?.sea_surface_temperature?.toFixed(1) || 'N/A';
      context.push(`• ${dest.displayName}: ${waveHeight}m waves, ${seaTemp}°C sea`);
    });
    context.push('');
  }
  
  // Travel opportunities
  if (travelOpportunities.length > 0) {
    context.push(`💰 TRAVEL OPPORTUNITIES:`);
    travelOpportunities.slice(0, 3).forEach((opp: any, index: number) => {
      context.push(`${index + 1}. ${opp.hotel} (${opp.period})`);
      context.push(`   💸 Save ${opp.savings}%, Weather score: ${opp.weatherScore}/10`);
    });
    context.push('');
  }
  
  // Lifestyle insights
  context.push(`💡 LIFESTYLE INSIGHTS:`);
  context.push(`• Tracking ${weatherData.cities?.length || 0} luxury destinations`);
  context.push(`• ${luxuryHotels.length} curated luxury hotels available`);
  context.push(`• Weather updated every 5 minutes`);
  context.push(`• Use travel actions for detailed booking analysis`);
  
  return context.join('\n');
}

export default lifestyleProvider; 