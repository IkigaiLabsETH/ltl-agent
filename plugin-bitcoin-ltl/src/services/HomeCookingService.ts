import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";

// Home cooking interfaces
export interface CookingExperience {
  type: "green-egg-bbq" | "thermomix";
  recipe: BBQRecipe | ThermomixRecipe;
  culturalContext: string;
  bitcoinLifestyle: string[];
  seasonalIngredients: string[];
  techniqueFocus: string;
  winePairing: string;
}

export interface BBQRecipe {
  name: string;
  ingredients: string[];
  equipment: string[];
  temperature: string;
  timing: string;
  technique: string;
  culturalHeritage: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface ThermomixRecipe {
  name: string;
  ingredients: string[];
  settings: { temperature: number; speed: number; time: number }[];
  steps: string[];
  culturalHeritage: string;
  efficiency: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface CulinaryTechnique {
  name: string;
  description: string;
  equipment: string[];
  tips: string[];
  troubleshooting: string[];
  culturalSignificance: string;
  videoReference?: string;
}

// Curated recipes database
const GREEN_EGG_RECIPES: BBQRecipe[] = [
  {
    name: "Basque-Style Lamb Chops",
    ingredients: [
      "8 lamb chops",
      "4 cloves garlic, minced",
      "2 tbsp fresh rosemary, chopped",
      "2 tbsp fresh thyme, chopped",
      "1/4 cup olive oil",
      "1 tbsp sea salt",
      "1 tbsp black pepper",
      "1 lemon, zested and juiced"
    ],
    equipment: ["Big Green Egg", "Plate Setter", "Grill Grate", "Meat Thermometer"],
    temperature: "225°F for smoking, 450°F for searing",
    timing: "3 hours smoking + 5 minutes searing",
    technique: "Low-and-slow smoking with reverse sear finish",
    culturalHeritage: "Basque coastal traditions with French refinement",
    difficulty: "intermediate"
  },
  {
    name: "Bordeaux Wine Country Beef Ribs",
    ingredients: [
      "4 beef short ribs",
      "2 cups red wine (Bordeaux)",
      "4 shallots, minced",
      "3 cloves garlic, minced",
      "2 tbsp Dijon mustard",
      "1 tbsp fresh thyme",
      "1 tbsp sea salt",
      "1 tbsp black pepper"
    ],
    equipment: ["Big Green Egg", "Plate Setter", "Drip Pan", "Meat Thermometer"],
    temperature: "250°F",
    timing: "6-8 hours",
    technique: "Low-and-slow smoking with wine braising",
    culturalHeritage: "Bordeaux wine country traditions",
    difficulty: "advanced"
  },
  {
    name: "Mediterranean Sea Bass",
    ingredients: [
      "2 whole sea bass",
      "4 lemons, sliced",
      "1 bunch fresh herbs (rosemary, thyme, oregano)",
      "1/4 cup olive oil",
      "4 cloves garlic, minced",
      "1 tbsp sea salt",
      "1 tbsp black pepper"
    ],
    equipment: ["Big Green Egg", "Fish Basket", "Cedar Planks"],
    temperature: "350°F",
    timing: "25-30 minutes",
    technique: "Plank grilling with Mediterranean herbs",
    culturalHeritage: "Mediterranean coastal traditions",
    difficulty: "beginner"
  }
];

const THERMOMIX_RECIPES: ThermomixRecipe[] = [
  {
    name: "French Onion Soup",
    ingredients: [
      "1kg onions, sliced",
      "50g butter",
      "1L beef stock",
      "200ml white wine",
      "2 tbsp flour",
      "1 tbsp thyme",
      "1 bay leaf",
      "Salt and pepper to taste"
    ],
    settings: [
      { temperature: 120, speed: 1, time: 20 }, // Sauté onions
      { temperature: 100, speed: 1, time: 30 }, // Simmer soup
      { temperature: 0, speed: 4, time: 10 }    // Blend if needed
    ],
    steps: [
      "Add butter and onions, sauté at 120°C for 20 minutes",
      "Add flour and cook for 2 minutes",
      "Add wine, stock, and herbs",
      "Simmer at 100°C for 30 minutes",
      "Season to taste"
    ],
    culturalHeritage: "Classic French bistro tradition",
    efficiency: "All-in-one preparation with precise temperature control",
    difficulty: "beginner"
  },
  {
    name: "Basque Piperade",
    ingredients: [
      "4 red peppers, sliced",
      "2 green peppers, sliced",
      "4 tomatoes, chopped",
      "2 onions, sliced",
      "4 cloves garlic, minced",
      "4 eggs",
      "2 tbsp olive oil",
      "1 tbsp paprika",
      "Salt and pepper to taste"
    ],
    settings: [
      { temperature: 120, speed: 1, time: 15 }, // Sauté vegetables
      { temperature: 100, speed: 1, time: 20 }, // Simmer
      { temperature: 100, speed: 1, time: 5 }   // Add eggs
    ],
    steps: [
      "Sauté peppers and onions at 120°C for 15 minutes",
      "Add tomatoes and garlic, simmer at 100°C for 20 minutes",
      "Add beaten eggs and cook for 5 minutes",
      "Season with paprika, salt, and pepper"
    ],
    culturalHeritage: "Traditional Basque breakfast dish",
    efficiency: "One-bowl preparation with perfect texture control",
    difficulty: "intermediate"
  },
  {
    name: "Monaco-Style Ratatouille",
    ingredients: [
      "2 eggplants, cubed",
      "4 zucchini, sliced",
      "4 tomatoes, chopped",
      "2 red peppers, sliced",
      "2 onions, sliced",
      "4 cloves garlic, minced",
      "1/4 cup olive oil",
      "1 tbsp herbes de Provence",
      "Salt and pepper to taste"
    ],
    settings: [
      { temperature: 120, speed: 1, time: 10 }, // Sauté vegetables
      { temperature: 100, speed: 1, time: 25 }, // Simmer
      { temperature: 0, speed: 3, time: 5 }     // Light blend
    ],
    steps: [
      "Sauté onions and garlic at 120°C for 5 minutes",
      "Add vegetables and herbs, sauté for 5 minutes",
      "Simmer at 100°C for 25 minutes",
      "Lightly blend for texture",
      "Season to taste"
    ],
    culturalHeritage: "Mediterranean Provençal tradition",
    efficiency: "Perfect vegetable texture with minimal effort",
    difficulty: "beginner"
  }
];

export class HomeCookingService extends BaseDataService {
  static serviceType = "home-cooking";
  capabilityDescription = "Provides home cooking experiences with Green Egg BBQ and Thermomix";

  constructor(runtime: IAgentRuntime) {
    super(runtime, "homeCooking");
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("HomeCookingService starting...");
    const service = new HomeCookingService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("HomeCookingService stopping...");
    const service = runtime.getService("home-cooking");
    if (service && service.stop) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    logger.info("HomeCookingService starting...");
    logger.info("HomeCookingService started successfully");
  }

  async init() {
    logger.info("HomeCookingService initialized");
  }

  async stop() {
    logger.info("HomeCookingService stopped");
  }

  async updateData(): Promise<void> {
    // No external data updates needed for this service
  }

  async forceUpdate(): Promise<void> {
    // No external data updates needed for this service
  }

  // Public API methods
  public async getDailyCookingExperience(): Promise<CookingExperience> {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Alternate between Green Egg BBQ and Thermomix
    const useGreenEgg = dayOfYear % 2 === 0;
    
    if (useGreenEgg) {
      const recipe = await this.getGreenEggBBQRecipe();
      return {
        type: "green-egg-bbq",
        recipe,
        culturalContext: this.generateCulturalContext(recipe),
        bitcoinLifestyle: this.generateBitcoinLifestyle(recipe),
        seasonalIngredients: this.generateSeasonalIngredients(recipe),
        techniqueFocus: this.generateTechniqueFocus(recipe),
        winePairing: this.generateWinePairing(recipe)
      };
    } else {
      const recipe = await this.getThermomixRecipe();
      return {
        type: "thermomix",
        recipe,
        culturalContext: this.generateCulturalContext(recipe),
        bitcoinLifestyle: this.generateBitcoinLifestyle(recipe),
        seasonalIngredients: this.generateSeasonalIngredients(recipe),
        techniqueFocus: this.generateTechniqueFocus(recipe),
        winePairing: this.generateWinePairing(recipe)
      };
    }
  }

  public async getGreenEggBBQRecipe(): Promise<BBQRecipe> {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return GREEN_EGG_RECIPES[dayOfYear % GREEN_EGG_RECIPES.length];
  }

  public async getThermomixRecipe(): Promise<ThermomixRecipe> {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return THERMOMIX_RECIPES[dayOfYear % THERMOMIX_RECIPES.length];
  }

  public async getCulinaryTechnique(technique: string): Promise<CulinaryTechnique> {
    const techniques: { [key: string]: CulinaryTechnique } = {
      "low-and-slow": {
        name: "Low-and-Slow Smoking",
        description: "Cooking at low temperatures (225-250°F) for extended periods to achieve tender, flavorful results",
        equipment: ["Big Green Egg", "Plate Setter", "Meat Thermometer"],
        tips: [
          "Maintain consistent temperature",
          "Use quality wood chunks for smoke",
          "Allow meat to rest after cooking",
          "Monitor internal temperature"
        ],
        troubleshooting: [
          "If temperature drops, check fuel level",
          "If meat is dry, wrap in foil during cooking",
          "If smoke is bitter, use less wood"
        ],
        culturalSignificance: "Traditional smoking techniques from American BBQ culture"
      },
      "reverse-sear": {
        name: "Reverse Sear",
        description: "Smoking meat at low temperature first, then finishing with high-heat sear",
        equipment: ["Big Green Egg", "Plate Setter", "Grill Grate", "Meat Thermometer"],
        tips: [
          "Smoke to 10-15°F below target temperature",
          "Remove plate setter for searing",
          "Sear quickly to avoid overcooking",
          "Rest meat after searing"
        ],
        troubleshooting: [
          "If sear is weak, increase temperature",
          "If meat overcooks, reduce sear time",
          "If temperature spikes, control airflow"
        ],
        culturalSignificance: "Modern BBQ technique combining smoking and grilling traditions"
      },
      "precision-cooking": {
        name: "Precision Cooking",
        description: "Using exact temperature and time control for consistent results",
        equipment: ["Thermomix TM7", "Built-in Scale", "Temperature Probe"],
        tips: [
          "Follow recipe settings exactly",
          "Use built-in scale for accuracy",
          "Monitor temperature with probe",
          "Don't open lid during cooking"
        ],
        troubleshooting: [
          "If food is undercooked, increase time",
          "If food is overcooked, reduce time",
          "If texture is wrong, adjust speed"
        ],
        culturalSignificance: "Modern European precision cooking techniques"
      }
    };

    return techniques[technique] || {
      name: technique,
      description: "Culinary technique information not available",
      equipment: [],
      tips: [],
      troubleshooting: [],
      culturalSignificance: "Technique information to be added"
    };
  }

  // Helper methods for generating cooking experience context
  private generateCulturalContext(recipe: BBQRecipe | ThermomixRecipe): string {
    return recipe.culturalHeritage;
  }

  private generateBitcoinLifestyle(recipe: BBQRecipe | ThermomixRecipe): string[] {
    const baseLifestyle = ["Culinary knowledge preservation", "Cultural heritage appreciation"];
    
    if ('technique' in recipe) {
      // BBQ Recipe
      return [...baseLifestyle, "Traditional cooking mastery", "Artisanal technique preservation"];
    } else {
      // Thermomix Recipe
      return [...baseLifestyle, "Modern efficiency", "Precision cooking excellence"];
    }
  }

  private generateSeasonalIngredients(recipe: BBQRecipe | ThermomixRecipe): string[] {
    const currentMonth = new Date().getMonth();
    const season = this.getSeason(currentMonth);
    
    const seasonalMap: { [key: string]: string[] } = {
      spring: ["Fresh herbs", "Spring vegetables", "Young lamb"],
      summer: ["Fresh seafood", "Summer vegetables", "Grilled fruits"],
      autumn: ["Game meats", "Root vegetables", "Autumn herbs"],
      winter: ["Hearty meats", "Winter vegetables", "Preserved ingredients"]
    };

    return seasonalMap[season] || ["Fresh ingredients", "Local produce"];
  }

  private generateTechniqueFocus(recipe: BBQRecipe | ThermomixRecipe): string {
    if ('technique' in recipe) {
      return recipe.technique;
    } else {
      return "Precision temperature and speed control";
    }
  }

  private generateWinePairing(recipe: BBQRecipe | ThermomixRecipe): string {
    const pairings: { [key: string]: string } = {
      "Basque-Style Lamb Chops": "Irouléguy Rouge or Rioja Reserva",
      "Bordeaux Wine Country Beef Ribs": "Bordeaux Rouge or Cabernet Sauvignon",
      "Mediterranean Sea Bass": "Provence Rosé or Chablis",
      "French Onion Soup": "Bordeaux Blanc or Chardonnay",
      "Basque Piperade": "Txakoli or Albariño",
      "Monaco-Style Ratatouille": "Provence Rosé or Bandol Rouge"
    };

    return pairings[recipe.name] || "Regional wine selection";
  }

  private getSeason(month: number): string {
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "autumn";
    return "winter";
  }
} 