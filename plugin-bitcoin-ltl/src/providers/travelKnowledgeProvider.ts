import {
  type Provider,
  type Content,
  type IAgentRuntime,
  type Memory,
  logger,
} from "@elizaos/core";
import { TravelDataService } from "../services/TravelDataService";

interface TravelKnowledgeContext {
  perfectDayOpportunities: PerfectDayKnowledge[];
  hotelInsights: HotelKnowledge[];
  seasonalPatterns: SeasonalKnowledge[];
  bookingRecommendations: BookingKnowledge[];
  marketIntelligence: MarketKnowledge[];
}

interface PerfectDayKnowledge {
  hotelName: string;
  hotelId: string;
  date: string;
  currentRate: number;
  averageRate: number;
  savingsPercentage: number;
  urgency: "high" | "medium" | "low";
  confidenceScore: number;
  reasons: string[];
  knowledgeEntry: string;
}

interface HotelKnowledge {
  hotelId: string;
  hotelName: string;
  city: string;
  category: string;
  uniqueFeatures: string[];
  perfectDayPatterns: string[];
  culturalSignificance: string;
  bitcoinLifestyleAlignment: string;
}

interface SeasonalKnowledge {
  city: string;
  bestMonths: string[];
  worstMonths: string[];
  perfectDayFrequency: string;
  bookingStrategy: string;
  culturalEvents: string[];
}

interface BookingKnowledge {
  strategy: string;
  timing: string;
  savings: string;
  urgency: string;
  confidence: string;
}

interface MarketKnowledge {
  trend: string;
  confidence: number;
  timeframe: string;
  opportunities: string[];
  risks: string[];
}

export const travelKnowledgeProvider: Provider = {
  name: "travel-knowledge",
  description: "Provides comprehensive travel knowledge including perfect day opportunities, hotel insights, and booking strategies with Bitcoin lifestyle integration",

  async get(
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<Content | null> {
    try {
      const travelService = runtime.getService("travel-data") as TravelDataService;
      if (!travelService) {
        logger.warn("TravelDataService not available for knowledge provider");
        return null;
      }

      // Get hybrid perfect day opportunities
      const perfectDays = await travelService.getHybridPerfectDays();
      const hotels = travelService.getCuratedHotels() || [];

      // Build comprehensive travel knowledge context
      const travelKnowledge = await buildTravelKnowledgeContext(
        perfectDays,
        hotels,
        travelService,
      );

      // Convert to knowledge format
      const knowledgeContent = convertToKnowledgeFormat(travelKnowledge);

      return {
        text: knowledgeContent,
        metadata: {
          type: "travel-knowledge",
          perfectDayCount: perfectDays.length,
          hotelCount: hotels.length,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error("Error in travel knowledge provider:", error);
      return null;
    }
  },
};

function buildTravelKnowledgeContext(
  perfectDays: any[],
  hotels: any[],
  travelService: TravelDataService,
): TravelKnowledgeContext {
  // Build perfect day knowledge entries
  const perfectDayKnowledge = perfectDays.map(opp => ({
    hotelName: opp.hotelName,
    hotelId: opp.hotelId,
    date: opp.perfectDate,
    currentRate: opp.currentRate,
    averageRate: opp.averageRate,
    savingsPercentage: opp.savingsPercentage,
    urgency: opp.urgency,
    confidenceScore: opp.confidenceScore,
    reasons: opp.reasons,
    knowledgeEntry: generatePerfectDayKnowledgeEntry(opp),
  }));

  // Build hotel insights
  const hotelKnowledge = hotels.map(hotel => ({
    hotelId: hotel.hotelId,
    hotelName: hotel.name,
    city: hotel.city,
    category: hotel.category,
    uniqueFeatures: getHotelUniqueFeatures(hotel),
    perfectDayPatterns: getHotelPerfectDayPatterns(hotel),
    culturalSignificance: getHotelCulturalSignificance(hotel),
    bitcoinLifestyleAlignment: getHotelBitcoinAlignment(hotel),
  }));

  // Build seasonal patterns
  const seasonalKnowledge = buildSeasonalKnowledge(hotels);

  // Build booking recommendations
  const bookingKnowledge = buildBookingKnowledge(perfectDays);

  // Build market intelligence
  const marketKnowledge = buildMarketKnowledge(travelService);

  return {
    perfectDayOpportunities: perfectDayKnowledge,
    hotelInsights: hotelKnowledge,
    seasonalPatterns: seasonalKnowledge,
    bookingRecommendations: bookingKnowledge,
    marketIntelligence: marketKnowledge,
  };
}

function generatePerfectDayKnowledgeEntry(opportunity: any): string {
  const urgencyEmoji = opportunity.urgency === 'high' ? '🔥' : 
                       opportunity.urgency === 'medium' ? '⚡' : '💡';
  
  const confidenceText = opportunity.confidenceScore >= 90 ? '95% confidence' : 
                        opportunity.confidenceScore >= 80 ? '88% confidence' : '75% confidence';

  return `Perfect booking day detected: ${opportunity.hotelName} on ${opportunity.perfectDate} offers ${opportunity.savingsPercentage.toFixed(1)}% savings compared to average rates (€${opportunity.currentRate}/night vs €${opportunity.averageRate}/night average). This represents an excellent opportunity for Bitcoin wealth optimization through luxury travel arbitrage. ${urgencyEmoji} ${opportunity.urgency} urgency | ${confidenceText} | ${opportunity.reasons.join(', ')}.`;
}

function getHotelUniqueFeatures(hotel: any): string[] {
  const features: Record<string, string[]> = {
    'biarritz_palace': [
      'Former imperial palace built in 1855 for Empress Eugénie',
      'Direct access to Grande Plage, Biarritz\'s most prestigious beach',
      '2-Michelin-starred restaurant L\'Oursinée',
      'Les Thermes Marins Spa with seawater therapy',
      'UNESCO World Heritage candidate for historical significance'
    ],
    'monaco_hermitage': [
      'Belle Époque architecture by Charles Garnier (Paris Opera designer)',
      'Located in Monaco\'s prestigious Carré d\'Or district',
      '2-Michelin-starred restaurant Le Vistamar',
      'Thermes Marins Spa with Mediterranean seawater therapy',
      'Monument historique designation for architectural significance'
    ],
    'bordeaux_intercontinental': [
      'Housed in the historic Grand Théâtre building',
      'Located on Place de la Comédie, Bordeaux\'s most prestigious square',
      '2-Michelin-starred restaurant Le Pressoir d\'Argent by Gordon Ramsay',
      'Spa Guerlain with wine therapy treatments',
      'UNESCO World Heritage site adjacent to hotel'
    ],
    'biarritz_regina': [
      'Historic hotel with Basque Country heritage',
      'Panoramic ocean views from most rooms',
      'Authentic Basque cuisine and cultural experiences',
      'Proximity to Biarritz Golf Club and surfing spots',
      'Local artisan partnerships and sustainable luxury'
    ],
    'biarritz_sofitel': [
      'Contemporary luxury with oceanfront location',
      'Modern spa and wellness facilities',
      'International standards with local Basque culture',
      'Direct beach access and water sports integration',
      'Business-friendly amenities with leisure focus'
    ],
    'biarritz_beaumanoir': [
      'Boutique luxury with intimate atmosphere',
      'Personalized service and attention to detail',
      'Local Basque culture immersion',
      'Exclusive experiences and private dining',
      'Sustainable luxury with community integration'
    ],
    'bordeaux_burdigala': [
      'Historic luxury in Bordeaux\'s wine district',
      'Wine-focused experiences and education',
      'Local gastronomy and culinary traditions',
      'Proximity to premier cru châteaux',
      'Cultural heritage preservation and storytelling'
    ],
    'bordeaux_la_grand_maison': [
      'Wine country luxury with vineyard views',
      'Michelin-starred dining with local ingredients',
      'Wine education and tasting experiences',
      'Sustainable luxury with local partnerships',
      'Cultural immersion in Bordeaux\'s wine heritage'
    ],
    'monaco_metropole': [
      'Contemporary luxury in Monaco\'s golden square',
      'Modern amenities with Mediterranean views',
      'International standards with local Monaco culture',
      'Proximity to Casino de Monte-Carlo and luxury shopping',
      'Wellness and spa facilities with sea views'
    ],
    'monaco_monte_carlo_bay': [
      'Resort-style luxury with Mediterranean access',
      'Comprehensive wellness and spa facilities',
      'Water sports and outdoor activities',
      'Family-friendly amenities with luxury standards',
      'Sustainable luxury with environmental focus'
    ]
  };

  return features[hotel.hotelId] || [
    'Luxury accommodation with local cultural integration',
    'Premium amenities and personalized service',
    'Strategic location with cultural significance',
    'Sustainable luxury with community partnerships'
  ];
}

function getHotelPerfectDayPatterns(hotel: any): string[] {
  const patterns: Record<string, string[]> = {
    'biarritz_palace': [
      'January-March: 25%+ savings for winter wellness',
      'November-December: 20%+ savings for cultural experiences',
      'April-May: 15%+ savings for perfect weather',
      'Avoid July: Biarritz Surf Festival creates booking pressure'
    ],
    'monaco_hermitage': [
      'January-February: 30%+ savings for winter luxury',
      'November-December: 25%+ savings for cultural immersion',
      'March-April: 20%+ savings for perfect weather',
      'Avoid May: Monaco Grand Prix creates 300%+ rate increases'
    ],
    'bordeaux_intercontinental': [
      'January-March: 25%+ savings for wine tasting',
      'November-December: 20%+ savings for cultural experiences',
      'April-May: 15%+ savings for perfect weather',
      'Avoid September: Wine harvest season creates booking pressure'
    ]
  };

  return patterns[hotel.hotelId] || [
    'Off-peak seasons offer 15-25% savings opportunities',
    'Shoulder seasons provide optimal weather and value',
    'Weekday bookings often offer 10-15% additional savings',
    'Early booking (6+ months) can secure 20%+ discounts'
  ];
}

function getHotelCulturalSignificance(hotel: any): string {
  const significance: Record<string, string> = {
    'biarritz_palace': 'Imperial heritage as former palace of Empress Eugénie, representing 19th-century European luxury and Basque Country cultural integration.',
    'monaco_hermitage': 'Belle Époque masterpiece by Charles Garnier, symbolizing Monaco\'s golden age and transformation into luxury destination.',
    'bordeaux_intercontinental': 'Historic Grand Théâtre building representing Bordeaux\'s 18th-century golden age and wine capital heritage.',
    'biarritz_regina': 'Authentic Basque Country luxury with local cultural preservation and sustainable community integration.',
    'biarritz_sofitel': 'Contemporary luxury with international standards while maintaining authentic Basque cultural connections.',
    'biarritz_beaumanoir': 'Boutique luxury with intimate local culture immersion and personalized Basque experiences.',
    'bordeaux_burdigala': 'Wine region heritage with direct connection to Bordeaux\'s premier cru culture and gastronomic traditions.',
    'bordeaux_la_grand_maison': 'Wine country luxury with authentic vineyard experiences and regional cultural preservation.',
    'monaco_metropole': 'Contemporary Monaco luxury with international standards and local aristocratic heritage.',
    'monaco_monte_carlo_bay': 'Resort luxury with Mediterranean lifestyle and sustainable environmental practices.'
  };

  return significance[hotel.hotelId] || 'Luxury accommodation with significant cultural heritage and local community integration.';
}

function getHotelBitcoinAlignment(hotel: any): string {
  const alignment: Record<string, string> = {
    'biarritz_palace': 'Imperial heritage preservation through luxury tourism, offering tangible cultural assets and strategic value preservation for Bitcoin wealth.',
    'monaco_hermitage': 'Belle Époque luxury with historical significance, providing cultural capital and network effects with global elite clientele.',
    'bordeaux_intercontinental': 'Wine capital luxury with cultural significance, offering experiential wealth through authentic wine region immersion.',
    'biarritz_regina': 'Basque cultural preservation through sustainable luxury, providing authentic local experiences and community integration.',
    'biarritz_sofitel': 'Contemporary luxury with international standards, offering strategic diversification in European luxury markets.',
    'biarritz_beaumanoir': 'Boutique luxury with personalized experiences, providing intimate cultural immersion and authentic local connections.',
    'bordeaux_burdigala': 'Wine region heritage with cultural significance, offering unique wine experiences and regional cultural preservation.',
    'bordeaux_la_grand_maison': 'Wine country luxury with authentic experiences, providing cultural intelligence through wine region immersion.',
    'monaco_metropole': 'Contemporary Monaco luxury with international appeal, offering geographic diversification in luxury markets.',
    'monaco_monte_carlo_bay': 'Resort luxury with Mediterranean lifestyle, providing sustainable luxury experiences with environmental focus.'
  };

  return alignment[hotel.hotelId] || 'Luxury accommodation with cultural significance, offering strategic value preservation and authentic experiences for Bitcoin wealth optimization.';
}

function buildSeasonalKnowledge(hotels: any[]): SeasonalKnowledge[] {
  const cities = [...new Set(hotels.map(h => h.city))];
  
  return cities.map(city => {
    const cityHotels = hotels.filter(h => h.city === city);
    
    return {
      city,
      bestMonths: getBestMonths(city),
      worstMonths: getWorstMonths(city),
      perfectDayFrequency: getPerfectDayFrequency(city),
      bookingStrategy: getBookingStrategy(city),
      culturalEvents: getCulturalEvents(city),
    };
  });
}

function getBestMonths(city: string): string[] {
  const bestMonths: Record<string, string[]> = {
    'Biarritz': ['April', 'May', 'September', 'October'],
    'Monaco': ['March', 'April', 'September', 'October'],
    'Bordeaux': ['April', 'May', 'September', 'October']
  };
  return bestMonths[city] || ['April', 'May', 'September', 'October'];
}

function getWorstMonths(city: string): string[] {
  const worstMonths: Record<string, string[]> = {
    'Biarritz': ['July', 'August'],
    'Monaco': ['May', 'July', 'August'],
    'Bordeaux': ['September', 'June']
  };
  return worstMonths[city] || ['July', 'August'];
}

function getPerfectDayFrequency(city: string): string {
  const frequency: Record<string, string> = {
    'Biarritz': 'High frequency during off-peak seasons (January-March, November-December)',
    'Monaco': 'Moderate frequency with high-value opportunities during winter months',
    'Bordeaux': 'Consistent opportunities year-round with peak during wine harvest season'
  };
  return frequency[city] || 'Variable frequency based on seasonal patterns and local events';
}

function getBookingStrategy(city: string): string {
  const strategy: Record<string, string> = {
    'Biarritz': 'Book 3-6 months ahead for peak season, target 15%+ savings during off-peak',
    'Monaco': 'Book 6-12 months ahead for peak season, target 20%+ savings during winter',
    'Bordeaux': 'Book 3-6 months ahead for peak season, target 15%+ savings during off-peak'
  };
  return strategy[city] || 'Book 3-6 months ahead for optimal rates and availability';
}

function getCulturalEvents(city: string): string[] {
  const events: Record<string, string[]> = {
    'Biarritz': ['Biarritz Surf Festival (July)', 'Basque Cultural Festivals (year-round)'],
    'Monaco': ['Monaco Grand Prix (May)', 'Monte-Carlo Opera Season (year-round)'],
    'Bordeaux': ['Wine Harvest Season (September)', 'Bordeaux Wine Festival (June)']
  };
  return events[city] || ['Local cultural festivals and events throughout the year'];
}

function buildBookingKnowledge(perfectDays: any[]): BookingKnowledge[] {
  const highUrgency = perfectDays.filter(p => p.urgency === 'high');
  const mediumUrgency = perfectDays.filter(p => p.urgency === 'medium');
  const lowUrgency = perfectDays.filter(p => p.urgency === 'low');

  return [
    {
      strategy: 'High Urgency Booking',
      timing: 'Book immediately',
      savings: `${highUrgency.length > 0 ? highUrgency[0].savingsPercentage.toFixed(1) : '25'}%+ savings`,
      urgency: 'High',
      confidence: '95%'
    },
    {
      strategy: 'Medium Urgency Booking',
      timing: 'Book within 7 days',
      savings: `${mediumUrgency.length > 0 ? mediumUrgency[0].savingsPercentage.toFixed(1) : '15'}%+ savings`,
      urgency: 'Medium',
      confidence: '88%'
    },
    {
      strategy: 'Low Urgency Booking',
      timing: 'Book within 30 days',
      savings: `${lowUrgency.length > 0 ? lowUrgency[0].savingsPercentage.toFixed(1) : '10'}%+ savings`,
      urgency: 'Low',
      confidence: '75%'
    }
  ];
}

function buildMarketKnowledge(travelService: TravelDataService): MarketKnowledge[] {
  try {
    const travelInsights = travelService.getTravelInsights();
    
    return [
      {
        trend: travelInsights?.marketTrends?.trend || 'stable',
        confidence: travelInsights?.marketTrends?.confidence || 75,
        timeframe: travelInsights?.marketTrends?.timeframe || 'next 6 months',
        opportunities: [
          'Luxury travel recovery post-pandemic',
          'Seasonal arbitrage opportunities for Bitcoin wealth',
          'Cultural tourism growth in European destinations',
          'Sustainable luxury demand increase'
        ],
        risks: [
          'Economic uncertainty affecting luxury travel',
          'Seasonal rate volatility during peak periods',
          'Event-driven booking pressure and rate spikes',
          'Supply chain impacts on luxury amenities'
        ]
      }
    ];
  } catch (error) {
    logger.error('Error building market knowledge:', error);
    return [
      {
        trend: 'stable',
        confidence: 75,
        timeframe: 'next 6 months',
        opportunities: ['Luxury travel opportunities available'],
        risks: ['Market volatility may affect rates']
      }
    ];
  }
}

function convertToKnowledgeFormat(travelKnowledge: TravelKnowledgeContext): string {
  let knowledgeText = '';

  // Perfect Day Opportunities
  if (travelKnowledge.perfectDayOpportunities.length > 0) {
    knowledgeText += '🎯 PERFECT DAY OPPORTUNITIES:\n\n';
    travelKnowledge.perfectDayOpportunities.forEach(opp => {
      knowledgeText += `${opp.knowledgeEntry}\n\n`;
    });
  }

  // Hotel Insights
  knowledgeText += '🏰 LUXURY HOTEL INSIGHTS:\n\n';
  travelKnowledge.hotelInsights.forEach(hotel => {
    knowledgeText += `${hotel.hotelName} (${hotel.city}): ${hotel.culturalSignificance} ${hotel.bitcoinLifestyleAlignment}\n\n`;
  });

  // Seasonal Patterns
  knowledgeText += '📅 SEASONAL BOOKING PATTERNS:\n\n';
  travelKnowledge.seasonalPatterns.forEach(seasonal => {
    knowledgeText += `${seasonal.city}: Best months: ${seasonal.bestMonths.join(', ')}. ${seasonal.bookingStrategy} ${seasonal.perfectDayFrequency}\n\n`;
  });

  // Booking Recommendations
  knowledgeText += '💡 BOOKING RECOMMENDATIONS:\n\n';
  travelKnowledge.bookingRecommendations.forEach(rec => {
    knowledgeText += `${rec.strategy}: ${rec.timing} for ${rec.savings} (${rec.urgency} urgency, ${rec.confidence} confidence)\n`;
  });

  // Market Intelligence
  knowledgeText += '\n📊 MARKET INTELLIGENCE:\n\n';
  travelKnowledge.marketIntelligence.forEach((market, index) => {
    knowledgeText += `Trend: ${market.trend} (${market.confidence}% confidence, ${market.timeframe})\n`;
    knowledgeText += `Opportunities: ${market.opportunities.join(', ')}\n`;
    knowledgeText += `Risks: ${market.risks.join(', ')}\n\n`;
  });

  knowledgeText += 'Bitcoin wealth enables strategic luxury travel optimization through perfect day detection and cultural value preservation.';

  return knowledgeText;
} 