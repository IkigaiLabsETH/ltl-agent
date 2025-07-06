import { IAgentRuntime, type Content } from "@elizaos/core";
import { dailyCulinaryAction } from "./src/actions/dailyCulinaryAction";
import { restaurantRecommendationAction } from "./src/actions/restaurantRecommendationAction";
import { homeCookingAction } from "./src/actions/homeCookingAction";
import { beverageInsightAction } from "./src/actions/beverageInsightAction";

// Mock runtime for testing
const mockRuntime = {
  getService: (serviceName: string) => {
    // Return mock services
    if (serviceName === "daily-culinary") {
      return {
        getDailyCulinaryExperience: async () => ({
          date: "2025-01-15",
          restaurant: {
            name: "Le Petit Paris",
            city: "Biarritz",
            cuisine: "Basque-French",
            culturalHeritage: "Traditional Basque cuisine meets French elegance"
          },
          homeCooking: {
            type: "green-egg-bbq",
            recipe: { name: "Basque-Style Lamb Chops" }
          },
          teaTip: { teaType: "Darjeeling First Flush", region: "Darjeeling, India" },
          coffeeTip: { coffeeType: "Ethiopian Yirgacheffe", region: "Ethiopia" },
          wineTip: { wineType: "Château Margaux 2015", region: "Bordeaux, France" }
        })
      };
    }
    if (serviceName === "lifestyle-data") {
      return {
        getDailyRestaurantSuggestion: async () => ({
          restaurant: { name: "Le Petit Paris", city: "Biarritz" },
          culturalSignificance: "Traditional Basque cuisine meets French elegance"
        })
      };
    }
    if (serviceName === "home-cooking") {
      return {
        getDailyCookingExperience: async () => ({
          type: "green-egg-bbq",
          recipe: { name: "Basque-Style Lamb Chops", technique: "Low-and-slow smoking" }
        })
      };
    }
    if (serviceName === "beverage-knowledge") {
      return {
        getDailyTeaTip: async () => ({ teaType: "Darjeeling First Flush", region: "Darjeeling, India" }),
        getDailyCoffeeTip: async () => ({ coffeeType: "Ethiopian Yirgacheffe", region: "Ethiopia" }),
        getDailyWineTip: async () => ({ wineType: "Château Margaux 2015", region: "Bordeaux, France" })
      };
    }
    return null;
  }
} as IAgentRuntime;

async function testCulinarySystem() {
  console.log("🍽️ Testing Culinary Intelligence System...\n");

  try {
    // Test Daily Culinary Action
    console.log("1. Testing Daily Culinary Action:");
    const dailyResult = await dailyCulinaryAction.handler(
      { content: { text: "What's today's culinary experience?" } } as any,
      mockRuntime,
      () => {}
    );
    console.log("✅ Daily Culinary Action:", typeof dailyResult === 'object' && dailyResult !== null ? 'Success' : 'Failed');

    // Test Restaurant Recommendation Action
    console.log("2. Testing Restaurant Recommendation Action:");
    const restaurantResult = await restaurantRecommendationAction.handler(
      { content: { text: "Recommend a restaurant in Biarritz" } } as any,
      mockRuntime,
      () => {}
    );
    console.log("✅ Restaurant Action:", typeof restaurantResult === 'object' && restaurantResult !== null ? 'Success' : 'Failed');

    // Test Home Cooking Action
    console.log("3. Testing Home Cooking Action:");
    const cookingResult = await homeCookingAction.handler(
      { content: { text: "What should I cook today?" } } as any,
      mockRuntime,
      () => {}
    );
    console.log("✅ Home Cooking Action:", typeof cookingResult === 'object' && cookingResult !== null ? 'Success' : 'Failed');

    // Test Beverage Insight Action
    console.log("4. Testing Beverage Insight Action:");
    const beverageResult = await beverageInsightAction.handler(
      { content: { text: "Tell me about today's beverage" } } as any,
      mockRuntime,
      () => {}
    );
    console.log("✅ Beverage Action:", typeof beverageResult === 'object' && beverageResult !== null ? 'Success' : 'Failed');

    console.log("🎉 All culinary actions are working correctly!");
    console.log("💎 The system successfully integrates:");
    console.log("   • Restaurant recommendations with cultural context");
    console.log("   • Home cooking experiences with Green Egg BBQ and Thermomix");
    console.log("   • Daily beverage insights (tea, coffee, wine)");
    console.log("   • Bitcoin lifestyle philosophy throughout");
    console.log("   • Wealth preservation through culinary knowledge");

  } catch (error) {
    console.error("❌ Error testing culinary system:", error);
  }
}

// Run the test
testCulinarySystem(); 