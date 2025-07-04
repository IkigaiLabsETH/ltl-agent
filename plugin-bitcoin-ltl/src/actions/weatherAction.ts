import { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { RealTimeDataService } from '../services/RealTimeDataService';
import { LifestyleDataService } from '../services/LifestyleDataService';

export const weatherAction: Action = {
  name: 'WEATHER_ANALYSIS',
  similes: [
    'WEATHER_REPORT',
    'CURRENT_WEATHER',
    'WEATHER_CONDITIONS',
    'CITY_WEATHER',
    'SURF_CONDITIONS',
    'AIR_QUALITY'
  ],
  description: 'Provides weather analysis for curated European lifestyle cities including Biarritz, Bordeaux, and Monaco',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content.text?.toLowerCase() || '';
    const triggers = [
      'weather', 'temperature', 'wind', 'conditions', 'forecast',
      'biarritz', 'bordeaux', 'monaco', 'surf', 'waves', 'marine',
      'air quality', 'uv', 'storm', 'sunny', 'cloudy', 'rain'
    ];
    
    return triggers.some(trigger => content.includes(trigger));
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback) => {
    try {
      const lifestyleDataService = runtime.getService('lifestyle-data') as LifestyleDataService;
      
      if (!lifestyleDataService) {
        callback({
          text: "Weather data temporarily unavailable. Like Bitcoin's network, sometimes we need patience for the next block.",
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
      }

      if (!weatherData) {
        callback({
          text: "Weather data unavailable. Like mining difficulty adjustments, weather patterns require patience and observation.",
          action: 'WEATHER_ANALYSIS'
        });
        return;
      }

      const { cities, summary } = weatherData;
      
      // Find specific city data
      const biarritz = cities.find(c => c.city === 'biarritz');
      const bordeaux = cities.find(c => c.city === 'bordeaux');
      const monaco = cities.find(c => c.city === 'monaco');

      // Generate weather analysis
      let analysis = "**European Lifestyle Weather Report**\n\n";

      // Current conditions overview
      analysis += `**Current Conditions:**\n`;
      analysis += `• Best Weather: ${summary.bestWeatherCity} (${summary.averageTemp.toFixed(1)}°C avg)\n`;
      analysis += `• Wind: ${summary.windConditions} conditions across region\n`;
      analysis += `• Air Quality: ${summary.airQuality}\n`;
      analysis += `• UV Risk: ${summary.uvRisk}\n`;
      if (summary.bestSurfConditions) {
        analysis += `• Best Surf: ${summary.bestSurfConditions}\n`;
      }
      analysis += `\n`;

      // City-by-city breakdown
      analysis += `**City Details:**\n`;
      
      if (biarritz) {
        const temp = biarritz.weather.current?.temperature_2m || 'N/A';
        const wind = biarritz.weather.current?.wind_speed_10m || 'N/A';
        analysis += `• **Biarritz**: ${temp}°C, ${wind}km/h wind`;
        if (biarritz.marine) {
          analysis += `, ${biarritz.marine.current.wave_height}m waves (${biarritz.marine.current.sea_surface_temperature}°C water)`;
        }
        analysis += `\n`;
      }
      
      if (bordeaux) {
        const temp = bordeaux.weather.current?.temperature_2m || 'N/A';
        const wind = bordeaux.weather.current?.wind_speed_10m || 'N/A';
        analysis += `• **Bordeaux**: ${temp}°C, ${wind}km/h wind`;
        if (bordeaux.airQuality) {
          analysis += `, PM2.5: ${bordeaux.airQuality.current.pm2_5}μg/m³`;
        }
        analysis += `\n`;
      }
      
      if (monaco) {
        const temp = monaco.weather.current?.temperature_2m || 'N/A';
        const wind = monaco.weather.current?.wind_speed_10m || 'N/A';
        analysis += `• **Monaco**: ${temp}°C, ${wind}km/h wind`;
        if (monaco.marine) {
          analysis += `, ${monaco.marine.current.wave_height}m waves`;
        }
        if (monaco.airQuality) {
          analysis += `, UV: ${monaco.airQuality.current.uv_index}`;
        }
        analysis += `\n`;
      }

      // Satoshi's weather philosophy
      analysis += `\n**Satoshi's Perspective:**\n`;
      
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

      if (summary.bestSurfConditions) {
        analysis += `${summary.bestSurfConditions} showing the best waves - nature's proof-of-work in action. `;
      }

      analysis += "\n\n**Truth Check:** Weather systems are decentralized networks processing energy and information. ";
      analysis += "Unlike central bank monetary policy, weather cannot be artificially manipulated. ";
      analysis += "Respect natural cycles, stack sats during storms.";

      // Activity recommendations
      analysis += `\n\n**Sovereign Living Recommendations:**\n`;
      if (summary.airQuality === 'excellent' && summary.averageTemp > 18) {
        analysis += "• Excellent day for outdoor sprint protocols or coastal walks\n";
      }
      if (summary.uvRisk === 'high' || summary.uvRisk === 'very-high') {
        analysis += "• High UV - optimize vitamin D synthesis but protect skin\n";
      }
      if (summary.bestSurfConditions && biarritz?.marine && biarritz.marine.current.wave_height > 1) {
        analysis += "• Surf conditions favorable in Biarritz - nature's volatility trading\n";
      }
      if (bordeaux && bordeaux.weather.current.temperature_2m > 15 && bordeaux.weather.current.wind_speed_10m < 15) {
        analysis += "• Bordeaux conditions optimal for vineyard visits and wine contemplation\n";
      }

      callback({
        text: analysis,
        action: 'WEATHER_ANALYSIS'
      });

    } catch (error) {
      console.error('Error in weatherAction:', error);
      callback({
        text: "Weather analysis failed. Like network congestion, sometimes data takes longer to propagate.",
        action: 'WEATHER_ANALYSIS'
      });
    }
  },
  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "How's the weather in our European cities?" }
      },
      {
        name: "Satoshi",
        content: { 
          text: "Biarritz: 18°C, 12km/h wind, 1.2m waves. Bordeaux: 16°C, calm conditions. Monaco: 20°C, 0.8m waves. Best weather: Monaco. Air quality excellent. Optimal conditions for sovereign living. Respect natural cycles, stack sats during storms.",
          actions: ["WEATHER_ANALYSIS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Are surf conditions good in Biarritz?" }
      },
      {
        name: "Satoshi",
        content: {
          text: "Biarritz surf: 1.8m waves, 8-second period, 15°C water. Best surf conditions showing in Biarritz - nature's proof-of-work in action. Moderate UV risk. Surf conditions favorable - nature's volatility trading.",
          actions: ["WEATHER_ANALYSIS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: { text: "What's the air quality like today?" }
      },
      {
        name: "Satoshi",
        content: {
          text: "Air quality excellent across region. PM2.5 levels optimal in Bordeaux (8μg/m³). UV index moderate in Monaco (4). Weather systems are decentralized networks processing energy. Unlike central banks, weather cannot be artificially manipulated.",
          actions: ["WEATHER_ANALYSIS"]
        }
      }
    ]
  ]
}; 