import { Service, IAgentRuntime } from "@elizaos/core";

export interface CulturalContext {
  city: string;
  country: string;
  culturalHeritage: {
    historicalSignificance: string;
    architecturalStyle: string;
    culturalTraditions: string[];
    localCuisine: string[];
    artAndCulture: string[];
  };
  lifestyleIntegration: {
    bitcoinLifestyle: string[];
    luxuryTraditions: string[];
    wellnessCulture: string[];
    outdoorActivities: string[];
    socialScene: string[];
  };
  seasonalHighlights: {
    spring: string[];
    summer: string[];
    autumn: string[];
    winter: string[];
  };
  perfectDayContext: {
    culturalExperiences: string[];
    localInsights: string[];
    hiddenGems: string[];
    authenticMoments: string[];
  };
  wealthPreservation: {
    culturalCapital: string[];
    experientialValue: string[];
    networkOpportunities: string[];
    legacyBuilding: string[];
  };
}

export interface DestinationInsight {
  city: string;
  perfectDayOpportunity: any;
  culturalContext: CulturalContext;
  enhancedRecommendation: {
    culturalExperiences: string[];
    localInsights: string[];
    authenticMoments: string[];
    wealthPreservation: string[];
  };
}

export class CulturalContextService extends Service {
  private culturalContexts: Map<string, CulturalContext> = new Map();

  static serviceType = "cultural-context";

  constructor(runtime: IAgentRuntime) {
    super();
    this.runtime = runtime;
    this.initializeCulturalContexts();
  }

  static async start(runtime: IAgentRuntime): Promise<CulturalContextService> {
    const service = new CulturalContextService(runtime);
    return service;
  }

  get capabilityDescription(): string {
    return "Provides rich cultural context and destination insights for luxury travel experiences";
  }

  async stop(): Promise<void> {
    // No cleanup needed for static cultural context
    return;
  }

  private initializeCulturalContexts(): void {
    // Biarritz Cultural Context
    this.culturalContexts.set("biarritz", {
      city: "Biarritz",
      country: "France",
      culturalHeritage: {
        historicalSignificance: "Founded as a whaling village in the 12th century, Biarritz became the summer playground of European royalty in the 19th century, particularly favored by Empress Eugénie and Napoleon III.",
        architecturalStyle: "Belle Époque grandeur meets Basque coastal charm, with elegant villas, grand hotels, and traditional Basque architecture.",
        culturalTraditions: [
          "Basque pelota and traditional sports",
          "Surfing culture and ocean sports heritage",
          "Royal summer retreat traditions",
          "Artisan fishing and maritime culture"
        ],
        localCuisine: [
          "Basque pintxos and tapas culture",
          "Fresh Atlantic seafood and fish markets",
          "Local wines from Irouléguy and Jurançon",
          "Traditional Basque cider and cheese"
        ],
        artAndCulture: [
          "Surfing museums and ocean sports heritage",
          "Basque cultural festivals and music",
          "Art galleries showcasing local and international artists",
          "Historical museums preserving royal heritage"
        ]
      },
      lifestyleIntegration: {
        bitcoinLifestyle: [
          "Oceanfront luxury with sound money principles",
          "Basque cultural preservation through luxury tourism",
          "Sustainable luxury with local community integration",
          "Multi-generational appeal with cultural significance"
        ],
        luxuryTraditions: [
          "Royal summer retreat heritage",
          "Grand hotel traditions and service excellence",
          "Oceanfront luxury with Basque authenticity",
          "Artisan craftsmanship and local partnerships"
        ],
        wellnessCulture: [
          "Thalassotherapy using Atlantic waters",
          "Surfing and ocean sports wellness",
          "Basque spa traditions and natural therapies",
          "Meditation and mindfulness by the ocean"
        ],
        outdoorActivities: [
          "World-class surfing and water sports",
          "Coastal hiking and nature trails",
          "Golf at prestigious courses",
          "Yacht charters and sailing experiences"
        ],
        socialScene: [
          "Exclusive beach clubs and oceanfront dining",
          "Basque cultural events and festivals",
          "Luxury shopping and artisan boutiques",
          "International jet-set social scene"
        ]
      },
      seasonalHighlights: {
        spring: [
          "Basque cultural festivals and traditional celebrations",
          "Spring surfing with optimal wave conditions",
          "Wildflower blooms along coastal trails",
          "Wine tasting at local vineyards"
        ],
        summer: [
          "Royal summer atmosphere and grand hotel experiences",
          "Beach culture and ocean sports",
          "International surfing competitions",
          "Basque music and cultural events"
        ],
        autumn: [
          "Harvest festivals and wine celebrations",
          "Mild weather perfect for outdoor activities",
          "Cultural events and art exhibitions",
          "Seafood festivals and culinary experiences"
        ],
        winter: [
          "Coastal luxury with dramatic Atlantic views",
          "Spa and wellness retreats",
          "Cultural preservation and local traditions",
          "Intimate luxury experiences"
        ]
      },
      perfectDayContext: {
        culturalExperiences: [
          "Visit the historic Hôtel du Palais, former summer palace of Empress Eugénie",
          "Experience Basque pelota at a local fronton",
          "Explore the Grand Plage and its Belle Époque architecture",
          "Taste local wines at traditional Basque bars"
        ],
        localInsights: [
          "Book spa treatments using Atlantic seawater for authentic thalassotherapy",
          "Visit local fish markets for fresh Atlantic seafood",
          "Experience traditional Basque cider houses",
          "Learn about surfing heritage at local surf schools"
        ],
        hiddenGems: [
          "Secret surf spots known only to locals",
          "Traditional Basque restaurants away from tourist areas",
          "Hidden coastal viewpoints and walking trails",
          "Artisan workshops preserving local crafts"
        ],
        authenticMoments: [
          "Sunset cocktails on the Grand Plage terrace",
          "Morning surf sessions with local surfers",
          "Traditional Basque music performances",
          "Artisan market visits and local interactions"
        ]
      },
      wealthPreservation: {
        culturalCapital: [
          "Access to Basque cultural heritage and traditions",
          "Royal summer retreat historical significance",
          "Ocean sports and surfing culture immersion",
          "Artisan craftsmanship and local partnerships"
        ],
        experientialValue: [
          "Authentic Basque cultural experiences",
          "Oceanfront luxury with cultural authenticity",
          "Multi-generational appeal and family traditions",
          "Sustainable luxury with community integration"
        ],
        networkOpportunities: [
          "International surfing and ocean sports community",
          "Basque cultural preservation networks",
          "Luxury hospitality and service excellence",
          "Artisan craftsmanship and cultural heritage"
        ],
        legacyBuilding: [
          "Cultural preservation through luxury tourism",
          "Multi-generational family traditions",
          "Sustainable luxury with local community",
          "Royal heritage and historical significance"
        ]
      }
    });

    // Bordeaux Cultural Context
    this.culturalContexts.set("bordeaux", {
      city: "Bordeaux",
      country: "France",
      culturalHeritage: {
        historicalSignificance: "Founded by the Romans in 56 BC, Bordeaux became the world's wine capital, with its golden age in the 18th century when it was the largest port in France and a center of Enlightenment culture.",
        architecturalStyle: "18th-century neoclassical architecture with UNESCO World Heritage status, featuring elegant squares, grand boulevards, and historic wine merchant houses.",
        culturalTraditions: [
          "Wine culture and château traditions",
          "Artisan food culture and gastronomy",
          "Enlightenment heritage and intellectual traditions",
          "Maritime and port city heritage"
        ],
        localCuisine: [
          "Bordeaux wine and wine pairing culture",
          "Artisan cheese and charcuterie",
          "Fresh seafood from the Atlantic coast",
          "Traditional French pastries and bread"
        ],
        artAndCulture: [
          "Wine museums and château visits",
          "Art galleries and cultural institutions",
          "Historical architecture and UNESCO sites",
          "Music festivals and cultural events"
        ]
      },
      lifestyleIntegration: {
        bitcoinLifestyle: [
          "Wine capital luxury with sound money principles",
          "Cultural preservation through luxury tourism",
          "Sustainable luxury with local wine community",
          "Multi-generational appeal with cultural significance"
        ],
        luxuryTraditions: [
          "Wine merchant traditions and château hospitality",
          "Artisan food culture and gastronomic excellence",
          "18th-century elegance and architectural heritage",
          "Cultural sophistication and intellectual traditions"
        ],
        wellnessCulture: [
          "Wine therapy and vinotherapy treatments",
          "Gastronomic wellness and healthy dining",
          "Cultural wellness through art and history",
          "Meditation and mindfulness in historic settings"
        ],
        outdoorActivities: [
          "Wine country cycling and vineyard tours",
          "River cruises on the Garonne",
          "Golf at prestigious courses",
          "Cultural walking tours and architectural exploration"
        ],
        socialScene: [
          "Wine tasting events and château visits",
          "Gastronomic restaurants and food culture",
          "Cultural events and intellectual gatherings",
          "Luxury shopping and artisan boutiques"
        ]
      },
      seasonalHighlights: {
        spring: [
          "Vineyard tours and wine education",
          "Spring festivals and cultural events",
          "Garden tours and floral displays",
          "Wine tasting and château visits"
        ],
        summer: [
          "Wine harvest preparation and vineyard experiences",
          "Cultural festivals and outdoor events",
          "River cruises and water activities",
          "Gastronomic experiences and food festivals"
        ],
        autumn: [
          "Wine harvest and grape picking experiences",
          "Harvest festivals and wine celebrations",
          "Cultural events and art exhibitions",
          "Gastronomic experiences and food culture"
        ],
        winter: [
          "Wine cellar tours and tastings",
          "Cultural events and indoor activities",
          "Gastronomic experiences and fine dining",
          "Historical tours and architectural exploration"
        ]
      },
      perfectDayContext: {
        culturalExperiences: [
          "Visit premier cru châteaux for wine tastings",
          "Explore the historic center and UNESCO architecture",
          "Experience traditional wine merchant culture",
          "Attend cultural events and art exhibitions"
        ],
        localInsights: [
          "Book wine education programs with master sommeliers",
          "Visit local markets for artisan food products",
          "Experience traditional wine bar culture",
          "Learn about wine history and traditions"
        ],
        hiddenGems: [
          "Secret wine bars and traditional establishments",
          "Hidden architectural gems and historic sites",
          "Local artisan workshops and craft studios",
          "Traditional food markets and specialty shops"
        ],
        authenticMoments: [
          "Wine tasting with château owners",
          "Traditional wine bar experiences",
          "Cultural events and intellectual gatherings",
          "Artisan market visits and local interactions"
        ]
      },
      wealthPreservation: {
        culturalCapital: [
          "Access to wine culture and château traditions",
          "UNESCO World Heritage architectural significance",
          "Gastronomic culture and artisan traditions",
          "Enlightenment heritage and intellectual traditions"
        ],
        experientialValue: [
          "Authentic wine country experiences",
          "Cultural sophistication and architectural beauty",
          "Multi-generational appeal and family traditions",
          "Sustainable luxury with local community"
        ],
        networkOpportunities: [
          "Global wine community and château networks",
          "Gastronomic culture and food community",
          "Cultural preservation and heritage networks",
          "Artisan craftsmanship and cultural traditions"
        ],
        legacyBuilding: [
          "Cultural preservation through luxury tourism",
          "Multi-generational family traditions",
          "Sustainable luxury with local community",
          "Wine heritage and cultural significance"
        ]
      }
    });

    // Monaco Cultural Context
    this.culturalContexts.set("monaco", {
      city: "Monaco",
      country: "Monaco",
      culturalHeritage: {
        historicalSignificance: "Founded in 1215, Monaco has been ruled by the Grimaldi family since 1297, becoming a symbol of Mediterranean luxury and sophistication, particularly during the Belle Époque era.",
        architecturalStyle: "Belle Époque grandeur with Mediterranean elegance, featuring grand hotels, historic casinos, and sophisticated urban planning.",
        culturalTraditions: [
          "Royal traditions and Grimaldi heritage",
          "Casino culture and entertainment traditions",
          "Mediterranean luxury and sophistication",
          "International jet-set culture"
        ],
        localCuisine: [
          "Mediterranean cuisine with French influence",
          "Fresh seafood and Mediterranean specialties",
          "International fine dining and gastronomy",
          "Traditional Monaco specialties and pastries"
        ],
        artAndCulture: [
          "Monte-Carlo Opera and cultural institutions",
          "Art galleries and international exhibitions",
          "Historical museums and royal heritage",
          "International events and cultural festivals"
        ]
      },
      lifestyleIntegration: {
        bitcoinLifestyle: [
          "Mediterranean luxury with sound money principles",
          "Royal heritage preservation through luxury tourism",
          "Sustainable luxury with local community integration",
          "Multi-generational appeal with cultural significance"
        ],
        luxuryTraditions: [
          "Royal hospitality and Grimaldi traditions",
          "Casino culture and entertainment excellence",
          "Mediterranean luxury and sophistication",
          "International jet-set social scene"
        ],
        wellnessCulture: [
          "Mediterranean therapy and wellness treatments",
          "Luxury spa culture and relaxation",
          "Cultural wellness through art and history",
          "Meditation and mindfulness in luxury settings"
        ],
        outdoorActivities: [
          "Mediterranean beach access and water sports",
          "Yacht charters and sailing experiences",
          "Golf at prestigious courses",
          "Cultural walking tours and architectural exploration"
        ],
        socialScene: [
          "Casino gaming and entertainment",
          "International events and cultural gatherings",
          "Luxury shopping and designer boutiques",
          "Exclusive clubs and social venues"
        ]
      },
      seasonalHighlights: {
        spring: [
          "Spring cultural events and festivals",
          "Mediterranean weather and outdoor activities",
          "Cultural exhibitions and art events",
          "Luxury experiences and entertainment"
        ],
        summer: [
          "Mediterranean beach culture and water sports",
          "International events and cultural festivals",
          "Luxury entertainment and casino culture",
          "Yacht culture and sailing experiences"
        ],
        autumn: [
          "Cultural events and art exhibitions",
          "Mild Mediterranean weather",
          "Luxury experiences and entertainment",
          "Cultural heritage and historical tours"
        ],
        winter: [
          "Luxury spa and wellness experiences",
          "Cultural events and indoor activities",
          "Casino culture and entertainment",
          "Historical tours and architectural exploration"
        ]
      },
      perfectDayContext: {
        culturalExperiences: [
          "Visit Casino de Monte-Carlo and experience gaming culture",
          "Explore the historic center and royal heritage",
          "Experience Mediterranean luxury and sophistication",
          "Attend cultural events and international exhibitions"
        ],
        localInsights: [
          "Book luxury spa treatments with Mediterranean therapies",
          "Visit local markets for Mediterranean specialties",
          "Experience traditional Monaco culture",
          "Learn about royal heritage and Grimaldi traditions"
        ],
        hiddenGems: [
          "Secret Mediterranean viewpoints and hidden spots",
          "Traditional Monaco establishments and local culture",
          "Hidden architectural gems and historic sites",
          "Local artisan workshops and craft studios"
        ],
        authenticMoments: [
          "Mediterranean sunset experiences",
          "Traditional Monaco cultural events",
          "Royal heritage and historical tours",
          "Local market visits and cultural interactions"
        ]
      },
      wealthPreservation: {
        culturalCapital: [
          "Access to royal heritage and Grimaldi traditions",
          "Mediterranean luxury and cultural significance",
          "Casino culture and entertainment heritage",
          "International jet-set culture and sophistication"
        ],
        experientialValue: [
          "Authentic Mediterranean luxury experiences",
          "Royal heritage and cultural sophistication",
          "Multi-generational appeal and family traditions",
          "Sustainable luxury with local community"
        ],
        networkOpportunities: [
          "International jet-set and luxury community",
          "Royal heritage and cultural networks",
          "Casino culture and entertainment networks",
          "Mediterranean luxury and cultural traditions"
        ],
        legacyBuilding: [
          "Cultural preservation through luxury tourism",
          "Multi-generational family traditions",
          "Sustainable luxury with local community",
          "Royal heritage and Mediterranean significance"
        ]
      }
    });
  }

  async getCulturalContext(city: string): Promise<CulturalContext | null> {
    const normalizedCity = city.toLowerCase();
    return this.culturalContexts.get(normalizedCity) || null;
  }

  async enhancePerfectDayOpportunity(perfectDay: any): Promise<DestinationInsight> {
    const city = perfectDay.hotelName?.toLowerCase().includes('biarritz') ? 'biarritz' :
                 perfectDay.hotelName?.toLowerCase().includes('bordeaux') ? 'bordeaux' :
                 perfectDay.hotelName?.toLowerCase().includes('monaco') ? 'monaco' : 'biarritz';

    const culturalContext = await this.getCulturalContext(city);
    
    if (!culturalContext) {
      return {
        city,
        perfectDayOpportunity: perfectDay,
        culturalContext: this.getDefaultCulturalContext(),
        enhancedRecommendation: this.getDefaultEnhancedRecommendation()
      };
    }

    const enhancedRecommendation = this.generateEnhancedRecommendation(perfectDay, culturalContext);

    return {
      city,
      perfectDayOpportunity: perfectDay,
      culturalContext,
      enhancedRecommendation
    };
  }

  private generateEnhancedRecommendation(perfectDay: any, culturalContext: CulturalContext): any {
    const currentSeason = this.getCurrentSeason();
    const seasonalHighlights = culturalContext.seasonalHighlights[currentSeason as keyof typeof culturalContext.seasonalHighlights] || [];

    return {
      culturalExperiences: [
        ...culturalContext.perfectDayContext.culturalExperiences.slice(0, 2),
        ...seasonalHighlights.slice(0, 1)
      ],
      localInsights: [
        ...culturalContext.perfectDayContext.localInsights.slice(0, 2),
        `Experience ${culturalContext.city}'s ${currentSeason} highlights`
      ],
      authenticMoments: [
        ...culturalContext.perfectDayContext.authenticMoments.slice(0, 2),
        `Immerse in ${culturalContext.city}'s cultural heritage`
      ],
      wealthPreservation: [
        ...culturalContext.wealthPreservation.culturalCapital.slice(0, 1),
        ...culturalContext.wealthPreservation.experientialValue.slice(0, 1),
        `Build cultural legacy in ${culturalContext.city}`
      ]
    };
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private getDefaultCulturalContext(): CulturalContext {
    return {
      city: "Unknown",
      country: "Unknown",
      culturalHeritage: {
        historicalSignificance: "Rich cultural heritage",
        architecturalStyle: "Traditional luxury",
        culturalTraditions: ["Local traditions"],
        localCuisine: ["Local cuisine"],
        artAndCulture: ["Cultural experiences"]
      },
      lifestyleIntegration: {
        bitcoinLifestyle: ["Sound money principles"],
        luxuryTraditions: ["Luxury traditions"],
        wellnessCulture: ["Wellness culture"],
        outdoorActivities: ["Outdoor activities"],
        socialScene: ["Social scene"]
      },
      seasonalHighlights: {
        spring: ["Spring highlights"],
        summer: ["Summer highlights"],
        autumn: ["Autumn highlights"],
        winter: ["Winter highlights"]
      },
      perfectDayContext: {
        culturalExperiences: ["Cultural experiences"],
        localInsights: ["Local insights"],
        hiddenGems: ["Hidden gems"],
        authenticMoments: ["Authentic moments"]
      },
      wealthPreservation: {
        culturalCapital: ["Cultural capital"],
        experientialValue: ["Experiential value"],
        networkOpportunities: ["Network opportunities"],
        legacyBuilding: ["Legacy building"]
      }
    };
  }

  private getDefaultEnhancedRecommendation(): any {
    return {
      culturalExperiences: ["Explore local culture"],
      localInsights: ["Discover local insights"],
      authenticMoments: ["Experience authentic moments"],
      wealthPreservation: ["Build cultural wealth"]
    };
  }

  async getAllCulturalContexts(): Promise<Map<string, CulturalContext>> {
    return this.culturalContexts;
  }

  async getSeasonalInsights(city: string): Promise<string[]> {
    const culturalContext = await this.getCulturalContext(city);
    if (!culturalContext) return [];

    const currentSeason = this.getCurrentSeason();
    return culturalContext.seasonalHighlights[currentSeason as keyof typeof culturalContext.seasonalHighlights] || [];
  }

  async getLifestyleIntegration(city: string): Promise<string[]> {
    const culturalContext = await this.getCulturalContext(city);
    if (!culturalContext) return [];

    return [
      ...culturalContext.lifestyleIntegration.bitcoinLifestyle,
      ...culturalContext.lifestyleIntegration.luxuryTraditions
    ];
  }
} 