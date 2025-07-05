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
import { LifestyleDataService } from '../services/LifestyleDataService';

// Helper function to safely format values
const formatValue = (value: number | undefined | null, unit: string = '', decimals: number = 1): string => {
  if (value === undefined || value === null || !isFinite(value)) return 'N/A';
  return `${value.toFixed(decimals)}${unit}`;
};

// Helper function to format temperature
const formatTemp = (temp: number | undefined | null): string => {
  if (temp === undefined || temp === null || !isFinite(temp)) return 'N/A';
  return `${Math.round(temp)}°C`;
};

export const weatherAction: Action = createActionTemplate({
  name: 'WEATHER_ANALYSIS',
  description: 'Comprehensive weather and surf analysis for European lifestyle cities, with detailed Biarritz surf conditions and regional weather intelligence',
  similes: ['WEATHER_REPORT', 'SURF_REPORT', 'WEATHER_CONDITIONS', 'SURF_CONDITIONS', 'CITY_WEATHER'],
  
  examples: [
    [
      {
        name: '{{user}}',
        content: { text: 'How are the surf conditions in Biarritz?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Biarritz surf: 1.2m waves, 8.5s period, 15°C water. Wave conditions: Moderate size. Wave quality: Long period swells. Suitable for intermediate surfers. The ocean\'s energy is nature\'s proof-of-work - each wave represents accumulated energy from distant storms, distributed through a decentralized network of swells.',
          thought: 'User is asking specifically about Biarritz surf conditions. I need to provide detailed surf metrics including wave height, period, water temperature, and assess the conditions for different skill levels while incorporating the philosophical perspective on ocean energy systems.',
          actions: ['WEATHER_ANALYSIS'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'What\'s the weather like in our European cities?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'European weather: Biarritz 18°C, 1.2m waves (15°C water). Bordeaux 16°C, calm winds, PM2.5: 12μg/m³. Monaco 20°C, 0.8m waves, UV: 6. Best weather: Monaco. Air quality excellent. Optimal conditions for sovereign living. Weather systems are decentralized networks processing energy.',
          thought: 'User wants a comprehensive European weather overview. I should provide temperature, wave conditions, air quality, and UV data for all monitored cities, then synthesize this into actionable insights for lifestyle decisions.',
          actions: ['WEATHER_ANALYSIS'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Is it a good day for outdoor activities?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Excellent day for outdoor activities. Air quality: excellent, average temp: 19°C, wind conditions: calm. UV risk: moderate - optimize vitamin D synthesis but protect skin. Surf conditions favorable in Biarritz (1.2m waves). Bordeaux optimal for vineyard visits. Respect natural cycles, stack sats during storms.',
          thought: 'User is asking about outdoor activity suitability. I need to assess air quality, UV levels, wind conditions, and temperatures to provide specific recommendations for different activities.',
          actions: ['WEATHER_ANALYSIS'],
        },
      },
    ],
  ],
  
  validateFn: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    return ValidationPatterns.isWeatherRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info('Weather analysis action triggered');
    
    const messageText = message.content?.text?.toLowerCase() || '';
    
    // Determine thought process based on query type
    let thoughtProcess = 'User is requesting weather information. I need to analyze current conditions across European lifestyle cities and provide actionable insights for daily decisions.';
    
    if (messageText.includes('surf') || messageText.includes('wave')) {
      thoughtProcess = 'User is asking about surf conditions. I need to provide detailed wave analysis including height, period, water temperature, and suitability assessment for different skill levels, particularly for Biarritz.';
    } else if (messageText.includes('outdoor') || messageText.includes('activities')) {
      thoughtProcess = 'User wants to know about outdoor activity suitability. I should assess air quality, UV levels, wind conditions, and temperatures to provide specific recommendations for different activities.';
    }
    
    try {
      const lifestyleDataService = runtime.getService('lifestyle-data') as LifestyleDataService;
      
      if (!lifestyleDataService) {
        logger.warn('Lifestyle data service not available');
        
        const fallbackResponse = ResponseCreators.createErrorResponse(
          'WEATHER_ANALYSIS',
          'Weather service unavailable',
          'Weather data service temporarily unavailable. The system is initializing - natural weather patterns continue regardless of our monitoring capabilities. Please try again in a moment.'
        );
        
        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Check if force refresh is requested
      const forceRefresh = messageText.includes('refresh') || 
                          messageText.includes('latest') ||
                          messageText.includes('current');

      let weatherData;
      if (forceRefresh) {
        weatherData = await lifestyleDataService.forceWeatherUpdate();
      } else {
        weatherData = lifestyleDataService.getWeatherData();
        // If no cached data, force an update
        if (!weatherData) {
          weatherData = await lifestyleDataService.forceWeatherUpdate();
        }
      }

      if (!weatherData || !weatherData.cities || weatherData.cities.length === 0) {
        logger.warn('No weather data available');
        
        const noDataResponse = ResponseCreators.createErrorResponse(
          'WEATHER_ANALYSIS',
          'Weather data unavailable',
          'Weather data temporarily unavailable. Unable to fetch current conditions from weather services. Natural systems continue operating independently of our monitoring.'
        );
        
        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      const { cities, summary } = weatherData;
      
      // Find specific city data
      const biarritz = cities.find(c => c.city === 'biarritz');
      const bordeaux = cities.find(c => c.city === 'bordeaux');
      const monaco = cities.find(c => c.city === 'monaco');

      // Check if user is specifically asking about Biarritz surf
      const isBiarritzSurfQuery = messageText.includes('biarritz') && 
                                  (messageText.includes('surf') || messageText.includes('wave'));
      
      let responseText: string;
      let responseData: any = {
        cities: cities.map(city => ({
          name: city.city,
          temperature: city.weather.current?.temperature_2m,
          windSpeed: city.weather.current?.wind_speed_10m,
          waveHeight: city.marine?.current?.wave_height,
          seaTemp: city.marine?.current?.sea_surface_temperature
        })),
        summary,
        lastUpdated: weatherData.lastUpdated
      };
      
      if (isBiarritzSurfQuery && biarritz && biarritz.marine) {
        // Generate detailed Biarritz surf report
        responseText = generateBiarritzSurfReport(biarritz);
        responseData.surfReport = {
          waveHeight: biarritz.marine.current.wave_height,
          wavePeriod: biarritz.marine.current.wave_period,
          seaTemp: biarritz.marine.current.sea_surface_temperature,
          assessment: assessSurfConditions(biarritz.marine.current)
        };
      } else {
        // Generate comprehensive weather analysis
        responseText = generateWeatherAnalysis(cities, summary, biarritz, bordeaux, monaco);
      }
      
      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        responseText,
        'WEATHER_ANALYSIS',
        responseData
      );
      
      if (callback) {
        await callback(response);
      }
      
      logger.info('Weather analysis delivered successfully');
      return true;
      
    } catch (error) {
      logger.error('Failed to get weather data:', (error as Error).message);
      
      // Enhanced error handling with context-specific responses
      let errorMessage = 'Weather monitoring systems operational. Natural patterns continue regardless of our observation capabilities.';
      
      const errorMsg = (error as Error).message.toLowerCase();
      if (errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('too many requests')) {
        errorMessage = 'Weather data rate limited. Like Bitcoin mining difficulty, natural systems have their own rate limits. Will retry shortly.';
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('fetch')) {
        errorMessage = 'Weather service connectivity issues. Natural weather patterns continue independently of our monitoring infrastructure.';
      } else if (errorMsg.includes('api') || errorMsg.includes('service')) {
        errorMessage = 'Weather API temporarily down. The weather itself remains decentralized and operational - only our monitoring is affected.';
      }
      
      const errorResponse = ResponseCreators.createErrorResponse(
        'WEATHER_ANALYSIS',
        (error as Error).message,
        errorMessage
      );
      
      if (callback) {
        await callback(errorResponse);
      }
      
      return false;
    }
  },
});

/**
 * Generate detailed Biarritz surf report
 */
function generateBiarritzSurfReport(biarritz: any): string {
  const marine = biarritz.marine.current;
  const weather = biarritz.weather.current;
  const airQuality = biarritz.airQuality?.current;

  let surfReport = `Biarritz surf: ${formatValue(marine.wave_height, 'm')} waves, ${formatValue(marine.wave_period, 's')} period, ${formatTemp(marine.sea_surface_temperature)} water.`;
  
  // Add air conditions
  if (weather) {
    surfReport += ` Air: ${formatTemp(weather.temperature_2m)}, ${formatValue(weather.wind_speed_10m, 'km/h', 0)} wind.`;
  }
  
  // Surf assessment
  const conditions = assessSurfConditions(marine);
  surfReport += ` ${conditions.size}. ${conditions.quality}. ${conditions.suitability}.`;
  
  // Add philosophical perspective
  surfReport += ` The ocean's energy is nature's proof-of-work - each wave represents accumulated energy from distant storms, distributed through a decentralized network of swells. Like Bitcoin mining difficulty, surf conditions adjust based on natural consensus mechanisms.`;
  
  return surfReport;
}

/**
 * Generate comprehensive weather analysis
 */
function generateWeatherAnalysis(cities: any[], summary: any, biarritz: any, bordeaux: any, monaco: any): string {
  let analysis = `European weather: `;
  
  // City-by-city summary
  if (biarritz) {
    const temp = formatTemp(biarritz.weather.current?.temperature_2m);
    const wind = formatValue(biarritz.weather.current?.wind_speed_10m, 'km/h', 0);
    analysis += `Biarritz ${temp}, ${wind} wind`;
    if (biarritz.marine) {
      const waveHeight = formatValue(biarritz.marine.current.wave_height, 'm');
      const seaTemp = formatTemp(biarritz.marine.current.sea_surface_temperature);
      analysis += `, ${waveHeight} waves (${seaTemp} water)`;
    }
    analysis += `. `;
  }
  
  if (bordeaux) {
    const temp = formatTemp(bordeaux.weather.current?.temperature_2m);
    const wind = formatValue(bordeaux.weather.current?.wind_speed_10m, 'km/h', 0);
    analysis += `Bordeaux ${temp}, ${wind} wind`;
    if (bordeaux.airQuality) {
      const pm25 = formatValue(bordeaux.airQuality.current.pm2_5, 'μg/m³', 0);
      analysis += `, PM2.5: ${pm25}`;
    }
    analysis += `. `;
  }
  
  if (monaco) {
    const temp = formatTemp(monaco.weather.current?.temperature_2m);
    const wind = formatValue(monaco.weather.current?.wind_speed_10m, 'km/h', 0);
    analysis += `Monaco ${temp}, ${wind} wind`;
    if (monaco.marine) {
      const waveHeight = formatValue(monaco.marine.current.wave_height, 'm');
      analysis += `, ${waveHeight} waves`;
    }
    if (monaco.airQuality) {
      const uv = formatValue(monaco.airQuality.current.uv_index, '', 0);
      analysis += `, UV: ${uv}`;
    }
    analysis += `. `;
  }
  
  // Summary insights
  analysis += `Best weather: ${summary.bestWeatherCity}. Air quality: ${summary.airQuality}. `;
  
  // Philosophical perspective
  if (summary.averageTemp > 20) {
    analysis += `Optimal conditions for sovereign living. `;
  } else if (summary.averageTemp < 10) {
    analysis += `Cold conditions - perfect for indoor contemplation and code review. `;
  }
  
  analysis += `Weather systems are decentralized networks processing energy and information. Unlike central bank monetary policy, weather cannot be artificially manipulated. Respect natural cycles.`;
  
  return analysis;
}

/**
 * Assess surf conditions based on marine data
 */
function assessSurfConditions(marine: any): { size: string; quality: string; suitability: string } {
  const waveHeight = marine.wave_height;
  const wavePeriod = marine.wave_period;
  
  let size: string;
  if (waveHeight >= 1.5) {
    size = 'Wave conditions: Good size';
  } else if (waveHeight >= 0.8) {
    size = 'Wave conditions: Moderate size';
  } else {
    size = 'Wave conditions: Small';
  }
  
  let quality: string;
  if (wavePeriod >= 8) {
    quality = 'Wave quality: Long period swells';
  } else if (wavePeriod >= 6) {
    quality = 'Wave quality: Moderate period';
  } else {
    quality = 'Wave quality: Short period';
  }
  
  let suitability: string;
  if (waveHeight >= 2.0 && wavePeriod >= 8) {
    suitability = 'Suitable for advanced surfers';
  } else if (waveHeight >= 1.0 && wavePeriod >= 6) {
    suitability = 'Suitable for intermediate surfers';
  } else {
    suitability = 'Suitable for beginners to intermediate';
  }
  
  return { size, quality, suitability };
} 