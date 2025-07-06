import {
  IAgentRuntime,
  Provider,
  elizaLogger,
  Memory,
  State,
} from "@elizaos/core";
import { LifestyleDataService } from "../services/LifestyleDataService";
import { DailyCulinaryService } from "../services/DailyCulinaryService";
import { HomeCookingService } from "../services/HomeCookingService";
import { BeverageKnowledgeService } from "../services/BeverageKnowledgeService";

/**
 * Enhanced Lifestyle Provider - Injects contextual lifestyle, luxury destination, and culinary intelligence
 *
 * This dynamic provider adds comprehensive context including:
 * - Weather conditions in luxury European destinations
 * - Marine and surf conditions for coastal cities
 * - Air quality and environmental data
 * - Luxury hotel availability and rates
 * - Seasonal travel recommendations
 * - Optimal booking periods analysis
 * - Daily culinary experiences and restaurant recommendations
 * - Home cooking experiences with Green Egg BBQ and Thermomix
 * - Daily tea, coffee, and wine insights
 * - Cultural heritage and Bitcoin lifestyle integration
 *
 * Usage: Include 'lifestyle' in dynamic providers when lifestyle, travel, or culinary queries are made
 */
export const lifestyleProvider: Provider = {
  name: "lifestyle",
  description:
    "Provides weather, luxury destinations, lifestyle optimization, and comprehensive culinary intelligence",
  dynamic: true, // Only loads when explicitly requested
  position: 6, // After market data and before complex analysis

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    elizaLogger.debug(
      "🌤️ [LifestyleProvider] Providing enhanced lifestyle, destination, and culinary context",
    );

    try {
      // Get all required services with proper typing
      const lifestyleService = runtime.getService(
        "lifestyle-data",
      ) as LifestyleDataService;
      const dailyCulinaryService = runtime.getService(
        "daily-culinary",
      ) as DailyCulinaryService;
      const homeCookingService = runtime.getService(
        "home-cooking",
      ) as HomeCookingService;
      const beverageService = runtime.getService(
        "beverage-knowledge",
      ) as BeverageKnowledgeService;

      // Check service availability
      const serviceAvailability = checkServiceAvailability(
        lifestyleService,
        dailyCulinaryService,
        homeCookingService,
        beverageService,
      );

      // Get traditional lifestyle data
      const lifestyleData = await getLifestyleData(lifestyleService);
      if (!lifestyleData) {
        elizaLogger.warn(
          "[LifestyleProvider] LifestyleDataService not available",
        );
        return {
          text: "Lifestyle and weather data temporarily unavailable.",
          values: {
            lifestyleDataAvailable: false,
            error: "Service not found",
          },
        };
      }

      // Get comprehensive culinary context
      const culinaryContext = await buildCulinaryContext(
        dailyCulinaryService,
        lifestyleService,
        homeCookingService,
        beverageService,
        serviceAvailability,
      );

      // Build enhanced lifestyle context
      const enhancedContext = buildEnhancedLifestyleContext(
        lifestyleData,
        culinaryContext,
        serviceAvailability,
      );

      elizaLogger.debug(
        `[LifestyleProvider] Providing enhanced context with ${lifestyleData.destinationsCount} destinations and culinary intelligence`,
      );

      return {
        text: enhancedContext,
        values: {
          // Traditional lifestyle values
          lifestyleDataAvailable: true,
          destinationsCount: lifestyleData.destinationsCount,
          luxuryHotelsCount: lifestyleData.luxuryHotelsCount,
          bestWeatherCity: lifestyleData.bestWeatherCity,
          bestSurfConditions: lifestyleData.bestSurfConditions,
          averageTemp: lifestyleData.averageTemp,
          windConditions: lifestyleData.windConditions,
          uvRisk: lifestyleData.uvRisk,
          airQuality: lifestyleData.airQuality,
          optimalDestinationsCount: lifestyleData.optimalDestinationsCount,
          travelOpportunitiesCount: lifestyleData.travelOpportunitiesCount,
          currentSeason: lifestyleData.currentSeason,
          
          // Enhanced culinary values
          dailyCulinaryExperience: culinaryContext.dailyExperience,
          restaurantSuggestion: culinaryContext.restaurantSuggestion,
          homeCooking: culinaryContext.homeCooking,
          beverageInsight: culinaryContext.beverageInsight,
          googleVerification: culinaryContext.googleVerification,
          
          // Service availability
          serviceAvailability: serviceAvailability,
          
          // Include data for actions to access
          weatherData: lifestyleData.weatherData,
          luxuryHotels: lifestyleData.luxuryHotels,
          optimalBookingPeriods: lifestyleData.optimalBookingPeriods,
          destinationAnalysis: lifestyleData.destinationAnalysis,
          optimalDestinations: lifestyleData.optimalDestinations,
          travelOpportunities: lifestyleData.travelOpportunities,
        },
      };
    } catch (error) {
      elizaLogger.error(
        "[LifestyleProvider] Error providing enhanced lifestyle context:",
        error,
      );
      return {
        text: "Enhanced lifestyle services encountered an error. Please try again later.",
        values: {
          lifestyleDataAvailable: false,
          error: error.message,
        },
      };
    }
  },
};

/**
 * Check availability of all culinary services
 */
function checkServiceAvailability(
  lifestyleService: LifestyleDataService | null,
  dailyCulinaryService: DailyCulinaryService | null,
  homeCookingService: HomeCookingService | null,
  beverageService: BeverageKnowledgeService | null,
) {
  return {
    lifestyleData: !!lifestyleService,
    dailyCulinary: !!dailyCulinaryService,
    michelinGuide: false, // Not implemented yet
    homeCooking: !!homeCookingService,
    beverageKnowledge: !!beverageService,
  };
}

/**
 * Get traditional lifestyle data
 */
async function getLifestyleData(lifestyleService: LifestyleDataService | null) {
  if (!lifestyleService) return null;

  try {
    const weatherData = lifestyleService.getWeatherData();
    const luxuryHotels = lifestyleService.getLuxuryHotels();
    const optimalBookingPeriods = await lifestyleService.getOptimalBookingPeriods();

    if (!weatherData) {
      elizaLogger.debug("[LifestyleProvider] No lifestyle data available yet");
      return null;
    }

    const destinationAnalysis = analyzeDestinationConditions(weatherData);
    const optimalDestinations = findOptimalDestinations(weatherData, destinationAnalysis);
    const travelOpportunities = analyzeTravelOpportunities(optimalBookingPeriods, weatherData);

    return {
      weatherData,
      luxuryHotels,
      optimalBookingPeriods,
      destinationAnalysis,
      optimalDestinations,
      travelOpportunities,
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
    };
  } catch (error) {
    elizaLogger.error("[LifestyleProvider] Error getting lifestyle data:", error);
    return null;
  }
}

/**
 * Build comprehensive culinary context
 */
async function buildCulinaryContext(
  dailyCulinaryService: DailyCulinaryService | null,
  lifestyleService: LifestyleDataService | null,
  homeCookingService: HomeCookingService | null,
  beverageService: BeverageKnowledgeService | null,
  serviceAvailability: any,
) {
  const context = {
    dailyExperience: null,
    restaurantSuggestion: null,
    michelinHotels: null,
    homeCooking: null,
    beverageInsight: null,
    googleVerification: null,
    seasonalContext: null,
  };

  try {
    // Primary culinary experience
    if (dailyCulinaryService && serviceAvailability.dailyCulinary) {
      try {
        context.dailyExperience = await dailyCulinaryService.getDailyCulinaryExperience();
      } catch (error) {
        elizaLogger.warn("[LifestyleProvider] Error getting daily culinary experience:", error);
      }
    }

    // Restaurant data
    if (lifestyleService && serviceAvailability.lifestyleData) {
      try {
        context.restaurantSuggestion = await lifestyleService.getDailyRestaurantSuggestion();
        if (context.restaurantSuggestion?.restaurant) {
          context.googleVerification = await lifestyleService.verifyRestaurantStatus(context.restaurantSuggestion.restaurant);
        }
      } catch (error) {
        elizaLogger.warn("[LifestyleProvider] Error getting restaurant data:", error);
      }
    }

    // Home cooking and beverage insights
    if (homeCookingService && serviceAvailability.homeCooking) {
      try {
        context.homeCooking = await homeCookingService.getDailyCookingExperience();
      } catch (error) {
        elizaLogger.warn("[LifestyleProvider] Error getting home cooking data:", error);
      }
    }

    if (beverageService && serviceAvailability.beverageKnowledge) {
      try {
        context.beverageInsight = await beverageService.getBeverageInsights();
      } catch (error) {
        elizaLogger.warn("[LifestyleProvider] Error getting beverage data:", error);
      }
    }

    return context;
  } catch (error) {
    elizaLogger.error("[LifestyleProvider] Error building culinary context:", error);
    return context; // Return partial context
  }
}

/**
 * Build enhanced lifestyle context with culinary intelligence
 */
function buildEnhancedLifestyleContext(
  lifestyleData: any,
  culinaryContext: any,
  serviceAvailability: any,
): string {
  const context = [];

  // Enhanced header with culinary intelligence
  context.push(`🍽️ **ENHANCED LIFESTYLE & CULINARY INTELLIGENCE**`);
  context.push(`🏆 Overall conditions: ${lifestyleData.destinationAnalysis.overallConditions}`);
  context.push(`📍 Best weather: ${lifestyleData.bestWeatherCity}`);
  context.push(`🌊 Best surf: ${lifestyleData.bestSurfConditions || "N/A"}`);
  context.push("");

  // Culinary intelligence section
  if (serviceAvailability.dailyCulinary || serviceAvailability.lifestyleData) {
    context.push(`🍴 **DAILY CULINARY EXPERIENCE**`);
    
    // Restaurant suggestion
    if (culinaryContext.restaurantSuggestion) {
      context.push(`🍽️ **RESTAURANT**: ${culinaryContext.restaurantSuggestion.restaurant.name}`);
      context.push(`🏛️ Cultural Heritage: ${culinaryContext.restaurantSuggestion.restaurant.culturalHeritage}`);
      context.push(`💎 Signature Dish: ${culinaryContext.restaurantSuggestion.restaurant.signatureDishes[0]}`);
      
      // Google verification status
      if (culinaryContext.googleVerification) {
        const status = culinaryContext.googleVerification.verificationSource === "google" 
          ? `✅ **GOOGLE VERIFIED**: ${culinaryContext.googleVerification.message}`
          : `ℹ️ **STATUS**: ${culinaryContext.googleVerification.message}`;
        context.push(status);
      }
      context.push("");
    }

    // Home cooking experience
    if (culinaryContext.homeCooking) {
      context.push(`🔥 **HOME COOKING**: ${culinaryContext.homeCooking.recipe.name}`);
      context.push(`🌿 Technique Focus: ${culinaryContext.homeCooking.techniqueFocus}`);
      context.push(`⏰ Equipment: ${culinaryContext.homeCooking.type === 'green-egg-bbq' ? 'Green Egg BBQ' : 'Thermomix'}`);
      context.push("");
    }

    // Beverage insights
    if (culinaryContext.beverageInsight) {
      if (culinaryContext.beverageInsight.tea) {
        context.push(`☕ **TEA**: ${culinaryContext.beverageInsight.tea.teaType} from ${culinaryContext.beverageInsight.tea.region}`);
        context.push(`💡 Daily Tip: ${culinaryContext.beverageInsight.tea.dailyTip}`);
      }
      if (culinaryContext.beverageInsight.wine) {
        context.push(`🍷 **WINE**: ${culinaryContext.beverageInsight.wine.wineType} from ${culinaryContext.beverageInsight.wine.region}`);
        context.push(`💎 Investment Potential: ${culinaryContext.beverageInsight.wine.investmentPotential}`);
      }
      context.push("");
    }

    // Bitcoin lifestyle context
    context.push(`💎 **WEALTH PRESERVATION**: Culinary knowledge as cultural capital`);
    context.push(`🌟 **NETWORK OPPORTUNITIES**: Access to exclusive culinary communities`);
    context.push(`🏛️ **LEGACY BUILDING**: Multi-generational culinary traditions`);
    context.push("");
  }

  // Traditional lifestyle context
  context.push(`🌤️ **TRADITIONAL LIFESTYLE CONTEXT**`);
  context.push(`⚡ CURRENT CONDITIONS:`);
  context.push(`• Average temperature: ${lifestyleData.averageTemp?.toFixed(1)}°C`);
  context.push(`• Wind conditions: ${lifestyleData.windConditions}`);
  context.push(`• UV risk level: ${lifestyleData.uvRisk}`);
  context.push(`• Air quality: ${lifestyleData.airQuality}`);
  context.push("");

  // Optimal destinations
  if (lifestyleData.optimalDestinations.excellent.length > 0) {
    context.push(`🏖️ EXCELLENT CONDITIONS:`);
    lifestyleData.optimalDestinations.excellent
      .slice(0, 3)
      .forEach((dest: any, index: number) => {
        const temp = dest.weather?.current?.temperature_2m?.toFixed(1) || "N/A";
        context.push(
          `${index + 1}. ${dest.displayName}: ${temp}°C (Score: ${dest.lifestyleScore}/100)`,
        );
      });
    context.push("");
  }

  // Beach conditions
  if (lifestyleData.optimalDestinations.beachConditions.length > 0) {
    context.push(`🌊 COASTAL CONDITIONS:`);
    lifestyleData.optimalDestinations.beachConditions.slice(0, 2).forEach((dest: any) => {
      const waveHeight = dest.marine?.current?.wave_height?.toFixed(1) || "N/A";
      const seaTemp = dest.marine?.current?.sea_surface_temperature?.toFixed(1) || "N/A";
      context.push(`• ${dest.displayName}: ${waveHeight}m waves, ${seaTemp}°C sea`);
    });
    context.push("");
  }

  // Travel opportunities
  if (lifestyleData.travelOpportunities.length > 0) {
    context.push(`💰 TRAVEL OPPORTUNITIES:`);
    lifestyleData.travelOpportunities.slice(0, 3).forEach((opp: any, index: number) => {
      context.push(`${index + 1}. ${opp.hotel} (${opp.period})`);
      context.push(`   💸 Save ${opp.savings}%, Weather score: ${opp.weatherScore}/10`);
    });
    context.push("");
  }

  // Service availability summary
  context.push(`🔧 **SERVICE STATUS**:`);
  context.push(`• Lifestyle Data: ${serviceAvailability.lifestyleData ? '✅' : '❌'}`);
  context.push(`• Daily Culinary: ${serviceAvailability.dailyCulinary ? '✅' : '❌'}`);
  context.push(`• Michelin Guide: ${serviceAvailability.michelinGuide ? '✅' : '❌'} (Coming Soon)`);
  context.push(`• Home Cooking: ${serviceAvailability.homeCooking ? '✅' : '❌'}`);
  context.push(`• Beverage Knowledge: ${serviceAvailability.beverageKnowledge ? '✅' : '❌'}`);
  context.push("");

  // Lifestyle insights
  context.push(`💡 **LIFESTYLE INSIGHTS**:`);
  context.push(`• Tracking ${lifestyleData.destinationsCount} luxury destinations`);
  context.push(`• ${lifestyleData.luxuryHotelsCount} curated luxury hotels available`);
  context.push(`• Weather updated every 5 minutes`);
  context.push(`• Culinary intelligence integrated for foodie experiences`);
  context.push(`• Use travel and culinary actions for detailed analysis`);

  return context.join("\n");
}

/**
 * Helper function to analyze destination conditions
 */
function analyzeDestinationConditions(weatherData: any): any {
  const analysis = {
    excellent: [],
    good: [],
    fair: [],
    poor: [],
    overallConditions: "mixed",
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
      analysis.overallConditions = "excellent";
    } else if (analysis.good.length > analysis.fair.length) {
      analysis.overallConditions = "good";
    } else if (analysis.poor.length > analysis.good.length) {
      analysis.overallConditions = "challenging";
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
    excellent: analysis.excellent.sort(
      (a: any, b: any) => b.lifestyleScore - a.lifestyleScore,
    ),
    beachConditions: [],
    wineRegions: [],
    cityBreaks: [],
  };

  if (weatherData?.cities) {
    // Find best beach conditions
    optimal.beachConditions = weatherData.cities
      .filter((city: any) => city.marine && city.lifestyleScore > 60)
      .sort((a: any, b: any) => b.lifestyleScore - a.lifestyleScore);

    // Wine regions (Bordeaux typically)
    optimal.wineRegions = weatherData.cities
      .filter(
        (city: any) =>
          city.city?.includes("bordeaux") ||
          city.displayName?.includes("Bordeaux"),
      )
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
function analyzeTravelOpportunities(
  bookingPeriods: any,
  weatherData: any,
): any[] {
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
          reasons: period.reasonsForLowRates,
        });
      }
    });
  }

  return opportunities.sort(
    (a, b) => b.recommendationScore - a.recommendationScore,
  );
}

/**
 * Helper function to get current season
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  if (month >= 9 && month <= 11) return "Fall";
  return "Winter";
}

export default lifestyleProvider;
