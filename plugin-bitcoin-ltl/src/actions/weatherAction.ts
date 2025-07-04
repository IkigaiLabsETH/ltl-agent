import { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
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

export const weatherAction: Action = {
  name: 'WEATHER_ANALYSIS',
  similes: [
    'WEATHER_REPORT',
    'CURRENT_WEATHER',
    'WEATHER_CONDITIONS',
    'CITY_WEATHER',
    'SURF_CONDITIONS',
    'AIR_QUALITY',
    'BIARRITZ_SURF',
    'SURF_REPORT'
  ],
  description: 'Provides real-time weather and surf analysis for European lifestyle cities, especially Biarritz surf conditions',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content.text?.toLowerCase() || '';
    const triggers = [
      'weather', 'temperature', 'wind', 'conditions', 'forecast',
      'biarritz', 'bordeaux', 'monaco', 'surf', 'waves', 'marine',
      'air quality', 'uv', 'storm', 'sunny', 'cloudy', 'rain',
      'sea temperature', 'wave height', 'wave period'
    ];
    
    return triggers.some(trigger => content.includes(trigger));
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback) => {
    try {
      const lifestyleDataService = runtime.getService('lifestyle-data') as LifestyleDataService;
      
      if (!lifestyleDataService) {
        callback({
          text: "Weather data service unavailable. The system is initializing - please try again in a moment.",
          action: 'WEATHER_ANALYSIS'
        });
        return;
      }

      // Check if force refresh is requested
      const forceRefresh = message.content.text?.toLowerCase().includes('refresh') || 
                          message.content.text?.toLowerCase().includes('latest') ||
                          message.content.text?.toLowerCase().includes('current');

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
        callback({
          text: "Weather data temporarily unavailable. Unable to fetch current conditions from weather services.",
          action: 'WEATHER_ANALYSIS'
        });
        return;
      }

      const { cities, summary } = weatherData;
      const messageText = message.content.text?.toLowerCase() || '';
      
      // Find specific city data
      const biarritz = cities.find(c => c.city === 'biarritz');
      const bordeaux = cities.find(c => c.city === 'bordeaux');
      const monaco = cities.find(c => c.city === 'monaco');

      // Check if user is specifically asking about Biarritz surf
      const isBiarritzSurfQuery = messageText.includes('biarritz') && 
                                  (messageText.includes('surf') || messageText.includes('wave'));
      
      if (isBiarritzSurfQuery && biarritz && biarritz.marine) {
        // Provide detailed Biarritz surf report
        const marine = biarritz.marine.current;
        const weather = biarritz.weather.current;
        const airQuality = biarritz.airQuality?.current;

        let surfReport = "**🏄‍♂️ BIARRITZ SURF REPORT**\n\n";
        
        surfReport += `**Current Conditions:**\n`;
        surfReport += `• Wave Height: ${formatValue(marine.wave_height, 'm')}\n`;
        surfReport += `• Wave Period: ${formatValue(marine.wave_period, 's')}\n`;
        surfReport += `• Wave Direction: ${marine.wave_direction ? `${marine.wave_direction}°` : 'N/A'}\n`;
        surfReport += `• Sea Temperature: ${formatTemp(marine.sea_surface_temperature)}\n`;
        
        if (weather) {
          surfReport += `• Air Temperature: ${formatTemp(weather.temperature_2m)}\n`;
          surfReport += `• Wind Speed: ${formatValue(weather.wind_speed_10m, 'km/h', 0)}\n`;
          if (weather.wind_direction_10m) {
            surfReport += `• Wind Direction: ${weather.wind_direction_10m}°\n`;
          }
        }
        
        if (airQuality) {
          surfReport += `• UV Index: ${formatValue(airQuality.uv_index, '', 0)}\n`;
        }

        // Surf condition assessment
        surfReport += `\n**Surf Assessment:**\n`;
        if (marine.wave_height >= 1.5) {
          surfReport += `• Wave conditions: Good size (${formatValue(marine.wave_height, 'm')})\n`;
        } else if (marine.wave_height >= 0.8) {
          surfReport += `• Wave conditions: Moderate (${formatValue(marine.wave_height, 'm')})\n`;
        } else {
          surfReport += `• Wave conditions: Small (${formatValue(marine.wave_height, 'm')})\n`;
        }

        if (marine.wave_period >= 8) {
          surfReport += `• Wave quality: Long period swells (${formatValue(marine.wave_period, 's')})\n`;
        } else if (marine.wave_period >= 6) {
          surfReport += `• Wave quality: Moderate period (${formatValue(marine.wave_period, 's')})\n`;
        } else {
          surfReport += `• Wave quality: Short period (${formatValue(marine.wave_period, 's')})\n`;
        }

        // Suitable skill level
        if (marine.wave_height >= 2.0 && marine.wave_period >= 8) {
          surfReport += `• Suitable for: Advanced surfers\n`;
        } else if (marine.wave_height >= 1.0 && marine.wave_period >= 6) {
          surfReport += `• Suitable for: Intermediate surfers\n`;
        } else {
          surfReport += `• Suitable for: Beginners to intermediate\n`;
        }

        surfReport += `\n**Satoshi's Surf Philosophy:**\n`;
        surfReport += "The ocean's energy is nature's proof-of-work. Each wave represents accumulated energy from distant storms, ";
        surfReport += "distributed through a decentralized network of swells. Like Bitcoin mining difficulty, ";
        surfReport += "surf conditions adjust based on natural consensus mechanisms. ";
        surfReport += "Respect the ocean's volatility, ride the energy waves.";

        const lastUpdated = new Date(biarritz.marine.current.time).toLocaleTimeString();
        surfReport += `\n\n*Last updated: ${lastUpdated}*`;

        callback({
          text: surfReport,
          action: 'WEATHER_ANALYSIS'
        });
        return;
      }

      // Generate comprehensive weather analysis for all cities
      let analysis = "**🌍 EUROPEAN LIFESTYLE WEATHER REPORT**\n\n";

      // Current conditions overview
      analysis += `**Regional Summary:**\n`;
      analysis += `• Best Weather: ${summary.bestWeatherCity} (${formatTemp(summary.averageTemp)} avg)\n`;
      analysis += `• Wind Conditions: ${summary.windConditions}\n`;
      analysis += `• Air Quality: ${summary.airQuality}\n`;
      analysis += `• UV Risk: ${summary.uvRisk}\n`;
      if (summary.bestSurfConditions) {
        analysis += `• Best Surf: ${summary.bestSurfConditions}\n`;
      }
      analysis += `\n`;

      // City-by-city breakdown
      analysis += `**City Details:**\n`;
      
      if (biarritz) {
        const temp = formatTemp(biarritz.weather.current?.temperature_2m);
        const wind = formatValue(biarritz.weather.current?.wind_speed_10m, 'km/h', 0);
        analysis += `• **Biarritz**: ${temp}, ${wind} wind`;
        if (biarritz.marine) {
          const waveHeight = formatValue(biarritz.marine.current.wave_height, 'm');
          const seaTemp = formatTemp(biarritz.marine.current.sea_surface_temperature);
          analysis += `, ${waveHeight} waves (${seaTemp} water)`;
        }
        analysis += `\n`;
      }
      
      if (bordeaux) {
        const temp = formatTemp(bordeaux.weather.current?.temperature_2m);
        const wind = formatValue(bordeaux.weather.current?.wind_speed_10m, 'km/h', 0);
        analysis += `• **Bordeaux**: ${temp}, ${wind} wind`;
        if (bordeaux.airQuality) {
          const pm25 = formatValue(bordeaux.airQuality.current.pm2_5, 'μg/m³', 0);
          analysis += `, PM2.5: ${pm25}`;
        }
        analysis += `\n`;
      }
      
      if (monaco) {
        const temp = formatTemp(monaco.weather.current?.temperature_2m);
        const wind = formatValue(monaco.weather.current?.wind_speed_10m, 'km/h', 0);
        analysis += `• **Monaco**: ${temp}, ${wind} wind`;
        if (monaco.marine) {
          const waveHeight = formatValue(monaco.marine.current.wave_height, 'm');
          analysis += `, ${waveHeight} waves`;
        }
        if (monaco.airQuality) {
          const uv = formatValue(monaco.airQuality.current.uv_index, '', 0);
          analysis += `, UV: ${uv}`;
        }
        analysis += `\n`;
      }

      // Satoshi's weather philosophy
      analysis += `\n**🧠 SATOSHI'S WEATHER PERSPECTIVE:**\n`;
      
      if (summary.averageTemp > 20) {
        analysis += "Optimal conditions for sovereign living. ";
      } else if (summary.averageTemp < 10) {
        analysis += "Cold snap across the region. Time for indoor contemplation and code review. ";
      } else {
        analysis += "Moderate conditions. Perfect for focused work and strategic thinking. ";
      }

      if (summary.windConditions === 'stormy') {
        analysis += "Storm conditions remind us that volatility exists in all systems - weather and markets alike. ";
      } else if (summary.windConditions === 'calm') {
        analysis += "Calm conditions. Like consolidation phases in markets, these moments precede action. ";
      }

      if (summary.bestSurfConditions && biarritz?.marine) {
        const waveHeight = biarritz.marine.current.wave_height;
        if (waveHeight > 1) {
          analysis += `${summary.bestSurfConditions} showing ${formatValue(waveHeight, 'm')} waves - nature's proof-of-work in action. `;
        }
      }

      analysis += "\n\nWeather systems are decentralized networks processing energy and information. ";
      analysis += "Unlike central bank monetary policy, weather cannot be artificially manipulated. ";
      analysis += "Respect natural cycles, stack sats during storms.";

      // Activity recommendations
      analysis += `\n\n**🎯 SOVEREIGN LIVING RECOMMENDATIONS:**\n`;
      if (summary.airQuality === 'excellent' && summary.averageTemp > 18) {
        analysis += "• Excellent day for outdoor activities and coastal walks\n";
      }
      if (summary.uvRisk === 'high' || summary.uvRisk === 'very-high') {
        analysis += "• High UV - optimize vitamin D synthesis but protect skin\n";
      }
      if (biarritz?.marine && biarritz.marine.current.wave_height > 1) {
        analysis += `• Surf conditions favorable in Biarritz (${formatValue(biarritz.marine.current.wave_height, 'm')} waves)\n`;
      }
      if (bordeaux && bordeaux.weather.current && bordeaux.weather.current.temperature_2m > 15 && (bordeaux.weather.current.wind_speed_10m || 0) < 15) {
        analysis += "• Bordeaux conditions optimal for vineyard visits\n";
      }

      const lastUpdated = new Date(weatherData.lastUpdated).toLocaleTimeString();
      analysis += `\n*Data updated: ${lastUpdated}*`;

      callback({
        text: analysis,
        action: 'WEATHER_ANALYSIS'
      });

    } catch (error) {
      console.error('Error in weatherAction:', error);
      callback({
        text: "Weather analysis failed. Unable to connect to weather services. Please try again in a moment.",
        action: 'WEATHER_ANALYSIS'
      });
    }
  },
  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "How are the surf conditions in Biarritz?" }
      },
      {
        name: "Satoshi",
        content: { 
          text: "Biarritz surf report: 1.2m waves, 8.5s period, 15°C water. Wave conditions: Moderate size. Wave quality: Moderate period. Suitable for: Intermediate surfers. The ocean's energy is nature's proof-of-work. Each wave represents accumulated energy from distant storms.",
          actions: ["WEATHER_ANALYSIS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: { text: "What's the weather like in our European cities?" }
      },
      {
        name: "Satoshi",
        content: {
          text: "European weather: Biarritz 18°C, 1.2m waves. Bordeaux 16°C, calm winds. Monaco 20°C, 0.8m waves. Best weather: Monaco. Air quality excellent. Optimal conditions for sovereign living. Weather systems are decentralized networks processing energy.",
          actions: ["WEATHER_ANALYSIS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Is it a good day for outdoor activities?" }
      },
      {
        name: "Satoshi",
        content: {
          text: "Air quality: excellent, average temp: 19°C, wind conditions: calm. Excellent day for outdoor activities and coastal walks. UV risk: moderate - optimize vitamin D synthesis but protect skin. Respect natural cycles.",
          actions: ["WEATHER_ANALYSIS"]
        }
      }
    ]
  ]
}; 