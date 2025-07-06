import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseAction, ActionContext, ActionResult } from "./BaseAction";

export class DailyCulinaryAction extends BaseAction {
  static actionName = "DAILY_CULINARY";
  static description = "Provides complete daily culinary experience with restaurant, home cooking, and beverage insights";

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  protected getActionDescription(): string {
    return DailyCulinaryAction.description;
  }

  protected async executeAction(params: any, context: ActionContext): Promise<string> {
    try {
      logger.info(`[DailyCulinaryAction] Executing daily culinary experience for city: ${params.city || 'all'}`);

      // For now, return a sample response since services are not yet integrated
      const sampleResponse = this.generateSampleDailyCulinaryResponse(params.city);
      
      logger.info(`[DailyCulinaryAction] Successfully generated daily culinary experience`);
      return sampleResponse;

    } catch (error) {
      logger.error(`[DailyCulinaryAction] Error executing daily culinary action: ${error.message}`);
      return this.formatErrorResponse(error);
    }
  }

  private generateSampleDailyCulinaryResponse(city?: string): string {
    const today = new Date().toISOString().split('T')[0];
    const selectedCity = city || "biarritz";
    
    return `🍽️ **DAILY CULINARY EXPERIENCE** - ${today}

🍴 **RESTAURANT**: Le Petit Paris, ${selectedCity}
ℹ️ **STATUS**: Hours verification unavailable - please check directly
🏛️ Cultural Heritage: Traditional Basque cuisine meets French elegance
💎 Signature Dish: Turbot à la Basque, Axoa de Veau
🍷 Wine Pairing: Irouléguy Blanc 2022

🔥 **HOME COOKING**: Basque-Style Lamb Chops
🌿 Technique Focus: Low-and-slow smoking with local herbs
⏰ Timing: 3 hours at 225°F for perfect tenderness
🍷 Wine Pairing: Irouléguy Rouge or Rioja Reserva

☕ **TEA**: Darjeeling First Flush from Makaibari Estate
🏔️ Region: Darjeeling, India - Spring harvest excellence
💡 Daily Tip: Brew at 185°F for 3 minutes to preserve delicate notes

☕ **COFFEE**: Ethiopian Yirgacheffe
🌍 Region: Yirgacheffe, Ethiopia - Birthplace of coffee
💡 Daily Tip: Grind medium-fine and use 1:16 coffee-to-water ratio

🍷 **WINE**: Château Margaux 2015, Bordeaux
🏰 Region: Médoc, France - Premier Grand Cru Classé
💎 Investment Potential: 15% annual appreciation, cultural capital
💡 Daily Tip: Decant for 2-3 hours to allow the wine to breathe

🎯 **CULTURAL THEME**: Cultural heritage preservation through culinary excellence

💎 **WEALTH PRESERVATION**:
• Cultural knowledge as appreciating asset
• Culinary skills as generational wealth
• Wine investment potential
• Cultural capital preservation
• Network access through culinary excellence

🌟 **BITCOIN LIFESTYLE**:
• Cultural heritage preservation
• Artisanal excellence
• Regional authenticity
• Traditional cooking mastery
• Cultural heritage appreciation

Sound money, sophisticated taste.`;
  }

  private formatDailyCulinaryResponse(dailyExperience: any): string {
    const { restaurant, homeCooking, teaTip, coffeeTip, wineTip, culturalTheme, bitcoinLifestyle, wealthPreservation } = dailyExperience;

    // Format Google verification status
    const googleStatus = restaurant.googleStatus?.message || "Hours verification unavailable - please check directly";
    const googleIcon = restaurant.googleVerificationAvailable ? "✅" : "ℹ️";

    // Format home cooking equipment icon
    const cookingIcon = homeCooking.type === "green-egg-bbq" ? "🔥" : "⚡";

    return `🍽️ **DAILY CULINARY EXPERIENCE** - ${dailyExperience.date}

🍴 **RESTAURANT**: ${restaurant.restaurant.name}, ${restaurant.restaurant.city}
${googleIcon} **STATUS**: ${googleStatus}
🏛️ Cultural Heritage: ${restaurant.culturalSignificance}
💎 Signature Dish: ${restaurant.recommendedDishes.join(", ")}
🍷 Wine Pairing: ${restaurant.winePairing}

${cookingIcon} **HOME COOKING**: ${homeCooking.recipe.name}
🌿 Technique Focus: ${homeCooking.techniqueFocus}
⏰ Timing: ${homeCooking.recipe.timing || "Follow recipe instructions"}
🍷 Wine Pairing: ${homeCooking.winePairing}

☕ **TEA**: ${teaTip.teaType} from ${teaTip.region}
🏔️ Region: ${teaTip.region} - ${teaTip.culturalHeritage}
💡 Daily Tip: ${teaTip.dailyTip}

☕ **COFFEE**: ${coffeeTip.coffeeType} from ${coffeeTip.region}
🌍 Region: ${coffeeTip.region} - ${coffeeTip.culturalHeritage}
💡 Daily Tip: ${coffeeTip.dailyTip}

🍷 **WINE**: ${wineTip.wineType}, ${wineTip.region}
🏰 Region: ${wineTip.region} - ${wineTip.culturalHeritage}
💎 Investment Potential: ${wineTip.investmentPotential}
💡 Daily Tip: ${wineTip.dailyTip}

🎯 **CULTURAL THEME**: ${culturalTheme}

💎 **WEALTH PRESERVATION**:
${wealthPreservation.map(item => `• ${item}`).join('\n')}

🌟 **BITCOIN LIFESTYLE**:
${bitcoinLifestyle.map(item => `• ${item}`).join('\n')}

Sound money, sophisticated taste.`;
  }

  private formatErrorResponse(error: Error): string {
    return `❌ **DAILY CULINARY EXPERIENCE ERROR**

Unable to generate today's culinary experience due to: ${error.message}

Please try again later or contact support if the issue persists.

Sound money, sophisticated taste.`;
  }
} 