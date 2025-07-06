import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";

// Beverage knowledge interfaces
export interface TeaInsight {
  teaType: string;
  region: string;
  culturalHeritage: string;
  brewingMethod: string;
  healthBenefits: string[];
  bitcoinLifestyle: string[];
  dailyTip: string;
}

export interface CoffeeInsight {
  coffeeType: string;
  region: string;
  culturalHeritage: string;
  brewingMethod: string;
  flavorProfile: string;
  bitcoinLifestyle: string[];
  dailyTip: string;
}

export interface WineInsight {
  wineType: string;
  region: string;
  varietal: string;
  terroir: string;
  culturalHeritage: string;
  investmentPotential: string;
  bitcoinLifestyle: string[];
  dailyTip: string;
}

export interface BeveragePairing {
  food: string;
  teaPairing: string;
  coffeePairing: string;
  winePairing: string;
  culturalContext: string;
  scientificBasis: string;
}

// Curated beverage knowledge database
const TEA_INSIGHTS: TeaInsight[] = [
  {
    teaType: "Darjeeling First Flush",
    region: "Darjeeling, India",
    culturalHeritage: "Himalayan tea gardens, British colonial heritage",
    brewingMethod: "185°F for 3 minutes",
    healthBenefits: ["Antioxidants", "Mental clarity", "Digestive health"],
    bitcoinLifestyle: ["Cultural heritage preservation", "Artisanal appreciation", "Mindful consumption"],
    dailyTip: "Brew at 185°F for 3 minutes to preserve delicate floral notes and avoid bitterness"
  },
  {
    teaType: "Assam Black",
    region: "Assam, India",
    culturalHeritage: "Indian tea culture, British breakfast tradition",
    brewingMethod: "212°F for 4-5 minutes",
    healthBenefits: ["Energy boost", "Heart health", "Immune support"],
    bitcoinLifestyle: ["Traditional craftsmanship", "Cultural exchange", "Quality appreciation"],
    dailyTip: "Use freshly boiled water and steep for 4-5 minutes for full-bodied flavor"
  },
  {
    teaType: "Ceylon Orange Pekoe",
    region: "Sri Lanka",
    culturalHeritage: "Sri Lankan tea heritage, colonial influence",
    brewingMethod: "200°F for 3-4 minutes",
    healthBenefits: ["Antioxidants", "Mental focus", "Stress relief"],
    bitcoinLifestyle: ["Heritage preservation", "Artisanal excellence", "Cultural appreciation"],
    dailyTip: "Steep at 200°F for 3-4 minutes to balance astringency and sweetness"
  },
  {
    teaType: "Japanese Sencha",
    region: "Japan",
    culturalHeritage: "Japanese tea ceremony, Zen philosophy",
    brewingMethod: "160-170°F for 1-2 minutes",
    healthBenefits: ["Catechin antioxidants", "Metabolism boost", "Calm focus"],
    bitcoinLifestyle: ["Mindful consumption", "Cultural precision", "Quality over quantity"],
    dailyTip: "Use cooler water (160-170°F) and shorter steeping time to preserve delicate umami notes"
  },
  {
    teaType: "Chinese Oolong",
    region: "Fujian, China",
    culturalHeritage: "Chinese tea culture, Gongfu brewing tradition",
    brewingMethod: "185-195°F for 2-3 minutes",
    healthBenefits: ["Weight management", "Heart health", "Mental clarity"],
    bitcoinLifestyle: ["Ancient wisdom", "Cultural heritage", "Artisanal craftsmanship"],
    dailyTip: "Multiple short infusions (2-3 minutes each) reveal different flavor layers"
  }
];

const COFFEE_INSIGHTS: CoffeeInsight[] = [
  {
    coffeeType: "Ethiopian Yirgacheffe",
    region: "Yirgacheffe, Ethiopia",
    culturalHeritage: "Birthplace of coffee, traditional processing",
    brewingMethod: "Pour-over or French press",
    flavorProfile: "Bright, floral, citrus, bergamot",
    bitcoinLifestyle: ["Cultural heritage", "Artisanal processing", "Origin appreciation"],
    dailyTip: "Grind medium-fine and use 1:16 coffee-to-water ratio for optimal extraction"
  },
  {
    coffeeType: "Colombian Huila",
    region: "Huila, Colombia",
    culturalHeritage: "Colombian coffee culture, family farms",
    brewingMethod: "Drip coffee or espresso",
    flavorProfile: "Balanced, chocolate, caramel, nutty",
    bitcoinLifestyle: ["Family tradition", "Sustainable farming", "Quality craftsmanship"],
    dailyTip: "Medium roast preserves the natural sweetness and chocolate notes"
  },
  {
    coffeeType: "Guatemalan Antigua",
    region: "Antigua, Guatemala",
    culturalHeritage: "Mayan heritage, volcanic soil influence",
    brewingMethod: "Pour-over or Chemex",
    flavorProfile: "Full-bodied, spicy, chocolate, smoky",
    bitcoinLifestyle: ["Volcanic terroir", "Indigenous heritage", "Artisanal processing"],
    dailyTip: "Slightly coarser grind and longer extraction time enhance the spicy notes"
  },
  {
    coffeeType: "Kenyan AA",
    region: "Kenya",
    culturalHeritage: "East African coffee tradition, cooperative farming",
    brewingMethod: "Pour-over or Aeropress",
    flavorProfile: "Bright, acidic, berry, wine-like",
    bitcoinLifestyle: ["Cooperative values", "Community support", "Quality standards"],
    dailyTip: "Use slightly cooler water (195°F) to balance the bright acidity"
  },
  {
    coffeeType: "Costa Rican Tarrazú",
    region: "Tarrazú, Costa Rica",
    culturalHeritage: "Central American coffee culture, sustainable practices",
    brewingMethod: "Drip coffee or cold brew",
    flavorProfile: "Clean, bright, citrus, honey",
    bitcoinLifestyle: ["Environmental stewardship", "Sustainable practices", "Quality focus"],
    dailyTip: "Medium-fine grind and 3-4 minute extraction for optimal clarity"
  }
];

const WINE_INSIGHTS: WineInsight[] = [
  {
    wineType: "Château Margaux 2015",
    region: "Médoc, Bordeaux, France",
    varietal: "Cabernet Sauvignon blend",
    terroir: "Gravelly soils, maritime climate",
    culturalHeritage: "Premier Grand Cru Classé, French wine aristocracy",
    investmentPotential: "15% annual appreciation, blue-chip wine investment",
    bitcoinLifestyle: ["Cultural capital preservation", "Wine investment", "Heritage appreciation"],
    dailyTip: "Decant for 2-3 hours to allow the wine to breathe and reveal its complexity"
  },
  {
    wineType: "Dom Pérignon 2012",
    region: "Champagne, France",
    varietal: "Chardonnay and Pinot Noir",
    terroir: "Chalky soils, cool climate",
    culturalHeritage: "Champagne excellence, luxury celebration",
    investmentPotential: "10-12% annual appreciation, collectible value",
    bitcoinLifestyle: ["Luxury lifestyle", "Celebration culture", "Investment potential"],
    dailyTip: "Serve at 45-50°F to preserve the delicate bubbles and enhance aromatics"
  },
  {
    wineType: "Barolo Riserva 2010",
    region: "Piedmont, Italy",
    varietal: "Nebbiolo",
    terroir: "Clay-limestone soils, continental climate",
    culturalHeritage: "King of wines, Italian wine aristocracy",
    investmentPotential: "12-15% annual appreciation, age-worthy investment",
    bitcoinLifestyle: ["Italian heritage", "Age-worthy investment", "Cultural appreciation"],
    dailyTip: "Decant for 4-6 hours to soften tannins and reveal complex aromas"
  },
  {
    wineType: "Château d'Yquem 2015",
    region: "Sauternes, Bordeaux, France",
    varietal: "Sémillon and Sauvignon Blanc",
    terroir: "Botrytized grapes, humid climate",
    culturalHeritage: "Liquid gold, French dessert wine excellence",
    investmentPotential: "20% annual appreciation, ultra-premium investment",
    bitcoinLifestyle: ["Ultra-premium investment", "Cultural heritage", "Luxury appreciation"],
    dailyTip: "Serve at 50-55°F to balance sweetness and acidity"
  },
  {
    wineType: "Opus One 2018",
    region: "Napa Valley, California",
    varietal: "Cabernet Sauvignon blend",
    terroir: "Volcanic soils, Mediterranean climate",
    culturalHeritage: "New World excellence, Franco-American collaboration",
    investmentPotential: "8-10% annual appreciation, New World collectible",
    bitcoinLifestyle: ["New World innovation", "Cultural collaboration", "Investment diversity"],
    dailyTip: "Decant for 2-3 hours to allow the wine to open and reveal its full potential"
  }
];

export class BeverageKnowledgeService extends BaseDataService {
  static serviceType = "beverage-knowledge";
  capabilityDescription = "Provides daily insights on tea, coffee, and wine regions";

  constructor(runtime: IAgentRuntime) {
    super(runtime, "beverageKnowledge");
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("BeverageKnowledgeService starting...");
    const service = new BeverageKnowledgeService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("BeverageKnowledgeService stopping...");
    const service = runtime.getService("beverage-knowledge");
    if (service && service.stop) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    logger.info("BeverageKnowledgeService starting...");
    logger.info("BeverageKnowledgeService started successfully");
  }

  async init() {
    logger.info("BeverageKnowledgeService initialized");
  }

  async stop() {
    logger.info("BeverageKnowledgeService stopped");
  }

  async updateData(): Promise<void> {
    // No external data updates needed for this service
  }

  async forceUpdate(): Promise<void> {
    // No external data updates needed for this service
  }

  // Public API methods
  public async getDailyTeaTip(): Promise<TeaInsight> {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return TEA_INSIGHTS[dayOfYear % TEA_INSIGHTS.length];
  }

  public async getDailyCoffeeTip(): Promise<CoffeeInsight> {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return COFFEE_INSIGHTS[dayOfYear % COFFEE_INSIGHTS.length];
  }

  public async getDailyWineTip(): Promise<WineInsight> {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return WINE_INSIGHTS[dayOfYear % WINE_INSIGHTS.length];
  }

  public async getBeveragePairing(food: string): Promise<BeveragePairing> {
    const pairings: { [key: string]: BeveragePairing } = {
      "lamb": {
        food: "Lamb",
        teaPairing: "Earl Grey or Darjeeling",
        coffeePairing: "Ethiopian Yirgacheffe",
        winePairing: "Bordeaux Rouge or Barolo",
        culturalContext: "Traditional pairing wisdom from European gastronomy",
        scientificBasis: "Tannins in wine complement protein, while tea's astringency cleanses the palate"
      },
      "seafood": {
        food: "Seafood",
        teaPairing: "Green tea or white tea",
        coffeePairing: "Costa Rican Tarrazú",
        winePairing: "Chablis or Sancerre",
        culturalContext: "Asian and European coastal traditions",
        scientificBasis: "Acidity in beverages enhances seafood flavors and cuts through richness"
      },
      "chocolate": {
        food: "Chocolate",
        teaPairing: "Pu-erh or black tea",
        coffeePairing: "Guatemalan Antigua",
        winePairing: "Port or late harvest wine",
        culturalContext: "Luxury dessert traditions from Europe",
        scientificBasis: "Rich, full-bodied beverages complement chocolate's intensity"
      },
      "cheese": {
        food: "Cheese",
        teaPairing: "Oolong or black tea",
        coffeePairing: "Kenyan AA",
        winePairing: "Burgundy or Chianti",
        culturalContext: "European cheese and wine traditions",
        scientificBasis: "Tannins and acidity balance cheese's fat content"
      }
    };

    return pairings[food.toLowerCase()] || {
      food: food,
      teaPairing: "Earl Grey or Darjeeling",
      coffeePairing: "Ethiopian Yirgacheffe",
      winePairing: "Regional wine selection",
      culturalContext: "General pairing principles",
      scientificBasis: "Balance of flavors and textures"
    };
  }

  public async getBeverageInsights(): Promise<{
    tea: TeaInsight;
    coffee: CoffeeInsight;
    wine: WineInsight;
  }> {
    const [tea, coffee, wine] = await Promise.all([
      this.getDailyTeaTip(),
      this.getDailyCoffeeTip(),
      this.getDailyWineTip()
    ]);

    return { tea, coffee, wine };
  }

  public async getRegionalBeverages(region: string): Promise<{
    teas: TeaInsight[];
    coffees: CoffeeInsight[];
    wines: WineInsight[];
  }> {
    const regionalMap: { [key: string]: { teas: string[]; coffees: string[]; wines: string[] } } = {
      "france": {
        teas: [],
        coffees: [],
        wines: ["Château Margaux 2015", "Dom Pérignon 2012", "Château d'Yquem 2015"]
      },
      "italy": {
        teas: [],
        coffees: [],
        wines: ["Barolo Riserva 2010"]
      },
      "japan": {
        teas: ["Japanese Sencha"],
        coffees: [],
        wines: []
      },
      "china": {
        teas: ["Chinese Oolong"],
        coffees: [],
        wines: []
      },
      "india": {
        teas: ["Darjeeling First Flush", "Assam Black"],
        coffees: [],
        wines: []
      },
      "ethiopia": {
        teas: [],
        coffees: ["Ethiopian Yirgacheffe"],
        wines: []
      },
      "colombia": {
        teas: [],
        coffees: ["Colombian Huila"],
        wines: []
      },
      "guatemala": {
        teas: [],
        coffees: ["Guatemalan Antigua"],
        wines: []
      },
      "kenya": {
        teas: [],
        coffees: ["Kenyan AA"],
        wines: []
      },
      "costa-rica": {
        teas: [],
        coffees: ["Costa Rican Tarrazú"],
        wines: []
      },
      "sri-lanka": {
        teas: ["Ceylon Orange Pekoe"],
        coffees: [],
        wines: []
      },
      "california": {
        teas: [],
        coffees: [],
        wines: ["Opus One 2018"]
      }
    };

    const regionData = regionalMap[region.toLowerCase()] || { teas: [], coffees: [], wines: [] };

    return {
      teas: TEA_INSIGHTS.filter(tea => regionData.teas.includes(tea.teaType)),
      coffees: COFFEE_INSIGHTS.filter(coffee => regionData.coffees.includes(coffee.coffeeType)),
      wines: WINE_INSIGHTS.filter(wine => regionData.wines.includes(wine.wineType))
    };
  }
} 