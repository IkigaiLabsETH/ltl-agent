import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { RestaurantSuggestion, LifestyleDataService } from "./LifestyleDataService";
import { CookingExperience, HomeCookingService } from "./HomeCookingService";
import { TeaInsight, CoffeeInsight, WineInsight, BeverageKnowledgeService } from "./BeverageKnowledgeService";

// Daily culinary experience interfaces
export interface DailyCulinaryExperience {
  date: string;
  restaurant: RestaurantSuggestion;
  homeCooking: CookingExperience;
  teaTip: TeaInsight;
  coffeeTip: CoffeeInsight;
  wineTip: WineInsight;
  culturalTheme: string;
  bitcoinLifestyle: string[];
  wealthPreservation: string[];
}

export interface CulinaryReport {
  dailyExperience: DailyCulinaryExperience;
  culturalContext: string;
  learningObjectives: string[];
  networkOpportunities: string[];
  legacyBuilding: string[];
}

export interface WeeklyTheme {
  theme: string;
  culturalFocus: string;
  dailyExperiences: string[];
  learningProgression: string[];
  bitcoinLifestyle: string[];
}

export class DailyCulinaryService extends BaseDataService {
  static serviceType = "daily-culinary";
  capabilityDescription = "Orchestrates daily culinary experiences and recommendations";

  constructor(runtime: IAgentRuntime) {
    super(runtime, "dailyCulinary");
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("DailyCulinaryService starting...");
    const service = new DailyCulinaryService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("DailyCulinaryService stopping...");
    const service = runtime.getService("daily-culinary");
    if (service && service.stop) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    logger.info("DailyCulinaryService starting...");
    logger.info("DailyCulinaryService started successfully");
  }

  async init() {
    logger.info("DailyCulinaryService initialized");
  }

  async stop() {
    logger.info("DailyCulinaryService stopped");
  }

  async updateData(): Promise<void> {
    // No external data updates needed for this service
  }

  async forceUpdate(): Promise<void> {
    // No external data updates needed for this service
  }

  // Public API methods
  public async getDailyCulinaryExperience(city?: string): Promise<DailyCulinaryExperience> {
    try {
      // Get all required services
      const lifestyleService = this.runtime.getService("lifestyle-data") as LifestyleDataService;
      const homeCookingService = this.runtime.getService("home-cooking") as HomeCookingService;
      const beverageService = this.runtime.getService("beverage-knowledge") as BeverageKnowledgeService;

      if (!lifestyleService || !homeCookingService || !beverageService) {
        throw new Error("Required culinary services not available");
      }

      // Fetch all daily experiences
      const [restaurant, homeCooking, teaTip, coffeeTip, wineTip] = await Promise.all([
        lifestyleService.getDailyRestaurantSuggestion(city),
        homeCookingService.getDailyCookingExperience(),
        beverageService.getDailyTeaTip(),
        beverageService.getDailyCoffeeTip(),
        beverageService.getDailyWineTip()
      ]);

      // Generate cultural theme based on the day's experiences
      const culturalTheme = this.generateCulturalTheme(restaurant, homeCooking, teaTip, coffeeTip, wineTip);
      
      // Combine Bitcoin lifestyle elements
      const bitcoinLifestyle = this.combineBitcoinLifestyle(restaurant, homeCooking, teaTip, coffeeTip, wineTip);
      
      // Generate wealth preservation insights
      const wealthPreservation = this.generateWealthPreservation(restaurant, homeCooking, teaTip, coffeeTip, wineTip);

      return {
        date: new Date().toISOString().split('T')[0],
        restaurant,
        homeCooking,
        teaTip,
        coffeeTip,
        wineTip,
        culturalTheme,
        bitcoinLifestyle,
        wealthPreservation
      };
    } catch (error) {
      logger.error(`[DailyCulinaryService] Error getting daily culinary experience: ${error.message}`);
      throw error;
    }
  }

  public async generateDailyCulinaryReport(city?: string): Promise<CulinaryReport> {
    const dailyExperience = await this.getDailyCulinaryExperience(city);
    
    const culturalContext = this.generateCulturalContext(dailyExperience);
    const learningObjectives = this.generateLearningObjectives(dailyExperience);
    const networkOpportunities = this.generateNetworkOpportunities(dailyExperience);
    const legacyBuilding = this.generateLegacyBuilding(dailyExperience);

    return {
      dailyExperience,
      culturalContext,
      learningObjectives,
      networkOpportunities,
      legacyBuilding
    };
  }

  public async getWeeklyCulinaryTheme(): Promise<WeeklyTheme> {
    const today = new Date();
    const weekOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24 * 7));
    
    const weeklyThemes: WeeklyTheme[] = [
      {
        theme: "Basque Coastal Traditions",
        culturalFocus: "Basque culinary heritage and coastal influences",
        dailyExperiences: [
          "Basque-style lamb chops on Green Egg BBQ",
          "Traditional Basque restaurants in Biarritz",
          "Irouléguy wines and regional pairings",
          "Basque tea and coffee traditions"
        ],
        learningProgression: [
          "Understanding Basque terroir",
          "Coastal cooking techniques",
          "Regional wine appreciation",
          "Cultural heritage preservation"
        ],
        bitcoinLifestyle: ["Cultural capital preservation", "Regional authenticity", "Heritage appreciation"]
      },
      {
        theme: "Bordeaux Wine Country Excellence",
        culturalFocus: "Bordeaux wine culture and gastronomic traditions",
        dailyExperiences: [
          "Bordeaux wine country beef ribs",
          "Classic French restaurants in Bordeaux",
          "Premier Grand Cru wine selections",
          "French tea and coffee culture"
        ],
        learningProgression: [
          "Wine investment fundamentals",
          "French culinary techniques",
          "Terroir understanding",
          "Investment-grade wine appreciation"
        ],
        bitcoinLifestyle: ["Wine investment culture", "Cultural capital", "Investment diversification"]
      },
      {
        theme: "Mediterranean Luxury",
        culturalFocus: "Mediterranean coastal luxury and culinary excellence",
        dailyExperiences: [
          "Mediterranean sea bass grilling",
          "Monaco luxury restaurants",
          "Champagne and Mediterranean wines",
          "Luxury beverage culture"
        ],
        learningProgression: [
          "Mediterranean cooking techniques",
          "Luxury dining culture",
          "Champagne appreciation",
          "Luxury lifestyle integration"
        ],
        bitcoinLifestyle: ["Luxury lifestyle", "Cultural sophistication", "Investment-grade experiences"]
      },
      {
        theme: "French Bistro Traditions",
        culturalFocus: "Classic French bistro culture and techniques",
        dailyExperiences: [
          "French onion soup in Thermomix",
          "Traditional French bistros",
          "Burgundy and Loire wines",
          "French tea and coffee traditions"
        ],
        learningProgression: [
          "French culinary fundamentals",
          "Bistro culture understanding",
          "Regional wine knowledge",
          "Cultural heritage appreciation"
        ],
        bitcoinLifestyle: ["Cultural heritage", "Traditional craftsmanship", "Artisanal appreciation"]
      }
    ];

    return weeklyThemes[weekOfYear % weeklyThemes.length];
  }

  // Helper methods for generating culinary experiences
  private generateCulturalTheme(
    restaurant: RestaurantSuggestion,
    homeCooking: CookingExperience,
    teaTip: TeaInsight,
    coffeeTip: CoffeeInsight,
    wineTip: WineInsight
  ): string {
    const themes = [
      "Cultural heritage preservation through culinary excellence",
      "Regional authenticity and traditional techniques",
      "Luxury lifestyle with cultural sophistication",
      "Investment-grade culinary experiences",
      "Artisanal craftsmanship and cultural appreciation"
    ];

    // Select theme based on the combination of experiences
    const experienceHash = restaurant.restaurant.cuisine.length + 
                          homeCooking.type.length + 
                          teaTip.region.length + 
                          coffeeTip.region.length + 
                          wineTip.region.length;
    
    return themes[experienceHash % themes.length];
  }

  private combineBitcoinLifestyle(
    restaurant: RestaurantSuggestion,
    homeCooking: CookingExperience,
    teaTip: TeaInsight,
    coffeeTip: CoffeeInsight,
    wineTip: WineInsight
  ): string[] {
    const allLifestyle = [
      ...restaurant.bitcoinLifestyle,
      ...homeCooking.bitcoinLifestyle,
      ...teaTip.bitcoinLifestyle,
      ...coffeeTip.bitcoinLifestyle,
      ...wineTip.bitcoinLifestyle
    ];

    // Remove duplicates and return unique values
    return [...new Set(allLifestyle)];
  }

  private generateWealthPreservation(
    restaurant: RestaurantSuggestion,
    homeCooking: CookingExperience,
    teaTip: TeaInsight,
    coffeeTip: CoffeeInsight,
    wineTip: WineInsight
  ): string[] {
    const wealthElements = [
      "Cultural knowledge as appreciating asset",
      "Culinary skills as generational wealth",
      "Wine investment potential",
      "Cultural capital preservation",
      "Network access through culinary excellence",
      "Legacy building through cultural traditions"
    ];

    // Add specific elements based on experiences
    if (wineTip.investmentPotential) {
      wealthElements.push(`Wine investment: ${wineTip.investmentPotential}`);
    }

    if (restaurant.restaurant.michelinStars) {
      wealthElements.push(`Michelin-starred dining as cultural capital`);
    }

    return wealthElements;
  }

  private generateCulturalContext(dailyExperience: DailyCulinaryExperience): string {
    return `Today's culinary journey combines ${dailyExperience.restaurant.restaurant.cuisine} excellence with ${dailyExperience.homeCooking.type} mastery, while exploring ${dailyExperience.teaTip.region} tea traditions, ${dailyExperience.coffeeTip.region} coffee culture, and ${dailyExperience.wineTip.region} wine heritage. This creates a comprehensive cultural experience that preserves and grows wealth through culinary knowledge and cultural capital.`;
  }

  private generateLearningObjectives(dailyExperience: DailyCulinaryExperience): string[] {
    return [
      `Master ${dailyExperience.homeCooking.techniqueFocus} technique`,
      `Understand ${dailyExperience.restaurant.restaurant.cuisine} cultural heritage`,
      `Appreciate ${dailyExperience.teaTip.region} tea traditions`,
      `Explore ${dailyExperience.coffeeTip.region} coffee culture`,
      `Learn ${dailyExperience.wineTip.region} wine investment potential`,
      `Develop cultural sophistication through culinary excellence`
    ];
  }

  private generateNetworkOpportunities(dailyExperience: DailyCulinaryExperience): string[] {
    return [
      `Access to ${dailyExperience.restaurant.restaurant.cuisine} culinary communities`,
      `Wine investment networks in ${dailyExperience.wineTip.region}`,
      `Tea culture enthusiasts from ${dailyExperience.teaTip.region}`,
      `Coffee aficionados from ${dailyExperience.coffeeTip.region}`,
      `Michelin-starred restaurant networks`,
      `Cultural heritage preservation communities`
    ];
  }

  private generateLegacyBuilding(dailyExperience: DailyCulinaryExperience): string[] {
    return [
      `Multi-generational culinary knowledge transfer`,
      `Cultural heritage preservation for future generations`,
      `Wine collection as family legacy`,
      `Culinary traditions as cultural capital`,
      `Investment-grade experiences as wealth preservation`,
      `Cultural sophistication as generational advantage`
    ];
  }
} 