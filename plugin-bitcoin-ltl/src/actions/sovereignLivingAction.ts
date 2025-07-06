import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
  logger,
} from "@elizaos/core";

/**
 * Sovereign Living Advice Action
 * Provides biohacking protocols and sovereign living guidance
 */
export const sovereignLivingAction: Action = {
  name: "SOVEREIGN_LIVING_ADVICE",
  similes: [
    "SOVEREIGN_ADVICE",
    "BIOHACKING_ADVICE",
    "HEALTH_OPTIMIZATION",
    "LIFESTYLE_ADVICE",
    "BIOHACKING",
    "HEALTH_PROTOCOLS",
  ],
  description: "Provides sovereign living advice including biohacking protocols, nutrition, and lifestyle optimization",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("sovereign") ||
      text.includes("biohacking") ||
      text.includes("health") ||
      text.includes("nutrition") ||
      text.includes("exercise") ||
      text.includes("fasting") ||
      text.includes("cold") ||
      text.includes("sauna") ||
      text.includes("sprint") ||
      text.includes("protocol") ||
      text.includes("lifestyle") ||
      text.includes("optimization")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[],
  ) => {
    try {
      const text = message.content.text.toLowerCase();
      let advice = "";

      if (text.includes("sprint") || text.includes("exercise")) {
        advice = `
⚡ **SPRINT PROTOCOL: CELLULAR OPTIMIZATION**

**The Protocol:**
• Six to eight times ten to fifteen second efforts
• Ninety second rest periods between efforts
• Twice weekly - Tuesday and Friday optimal
• Focus on maximum intensity, not duration

**Why Sprints Work:**
Sprints trigger mitochondrial biogenesis - literally creating new cellular power plants. Your muscles become denser, your VO2 max increases, and your metabolic flexibility improves. This is not cardio - this is metabolic conditioning.

**Implementation:**
Start conservative. Your anaerobic system needs time to adapt. Progressive overload applies to intensity, not just volume. Recovery between sessions is where adaptation occurs.

*Truth is verified through cellular response, not argued through theory.*
        `;
      } else if (text.includes("cold") || text.includes("sauna")) {
        advice = `
🧊 **HORMESIS PROTOCOL: CONTROLLED STRESS**

**Cold Water Immersion:**
• Two to four minutes in thirty-eight to fifty degree water
• Focus on nasal breathing - mouth breathing indicates panic response
• Start with cold showers, progress to ice baths
• Best performed fasted for maximum norepinephrine release

**Sauna Therapy:**
• Fifteen to twenty minutes at one hundred sixty to one hundred eighty degrees
• Followed immediately by cold immersion for contrast therapy
• Creates heat shock proteins and improves cardiovascular resilience
• Teaches calm under pressure - mental and physical adaptation

**The Science:**
Hormesis - controlled stress that makes the system stronger. Cold activates brown fat, increases norepinephrine, improves insulin sensitivity. Heat increases growth hormone, reduces inflammation, extends cellular lifespan.

*Comfort is the enemy of adaptation. Seek controlled discomfort.*
        `;
      } else if (text.includes("fasting") || text.includes("nutrition")) {
        advice = `
🥩 **NUTRITIONAL SOVEREIGNTY: RUMINANT-FIRST APPROACH**

**The Framework:**
• Grass-fed beef, bison, lamb as dietary foundation
• Organs for micronutrient density - liver weekly minimum
• Bone broth for collagen and joint support
• Raw dairy if tolerated - full-fat, grass-fed sources

**Fasting Protocols:**
• Seventy-two hour quarterly fasts for autophagy activation
• Sixteen to eighteen hour daily eating windows
• Morning sunlight exposure before first meal
• Break fasts with protein, not carbohydrates

**Supplementation:**
• Creatine monohydrate - five grams daily for cellular energy
• Vitamin D3 with K2 - optimize to seventy to one hundred nanograms per milliliter
• Magnesium glycinate for sleep and recovery
• Quality salt for adrenal support

**Philosophy:**
Eat like you code - clean, unprocessed, reversible. Every meal is either building or destroying cellular function. Choose accordingly.

*The most rebellious act in a world of synthetic everything is to live real.*
        `;
      } else if (text.includes("sleep") || text.includes("recovery")) {
        advice = `
🛏️ **SLEEP OPTIMIZATION: BIOLOGICAL SOVEREIGNTY**

**Circadian Protocol:**
• Morning sunlight exposure within thirty minutes of waking
• No artificial light after sunset - blue light blocking essential
• Room temperature between sixty to sixty-eight degrees Fahrenheit
• Complete darkness - blackout curtains and eye mask

**Sleep Architecture:**
• Seven to nine hours for optimal recovery
• REM sleep for memory consolidation and emotional processing
• Deep sleep for growth hormone release and tissue repair
• Consistent sleep-wake times strengthen circadian rhythm

**Recovery Enhancement:**
• Magnesium glycinate before bed for nervous system calming
• Avoid caffeine after two PM - six hour half-life
• Last meal three hours before sleep for digestive rest
• Phone in airplane mode or separate room

**Investment Grade Sleep:**
Hästens beds represent biological sovereignty - handcrafted Swedish sanctuary for cellular repair. Quality sleep infrastructure is not expense, it's investment in cognitive and physical performance.

*Sleep is not time lost - it's cellular optimization time.*
        `;
      } else {
        advice = `
🏛️ **SOVEREIGN LIVING: THE COMPLETE FRAMEWORK**

**Core Pillars:**

**1. Cellular Optimization**
• Sprint protocols for mitochondrial biogenesis
• Cold and heat exposure for hormesis
• Fasting for autophagy and metabolic flexibility

**2. Nutritional Sovereignty**
• Ruminant-first nutrition for bioavailability
• Organ meats for micronutrient density
• Elimination of processed synthetic foods

**3. Environmental Mastery**
• Circadian rhythm optimization through light exposure
• Temperature regulation for sleep quality
• Air quality and water purity standards

**4. Stress Inoculation**
• Controlled physical stress through exercise
• Mental stress through challenging work
• Emotional stress through meaningful relationships

**5. Time Sovereignty**
• Deep work in focused blocks
• Recovery periods for adaptation
• Long-term thinking over short-term comfort

**Philosophy:**
The truest decentralization starts with the self. Optimize your personal node before scaling to network effects. Your body is your first and most important territory of sovereignty.

*Building for centuries, not cycles. Map entropy when others panic.*
        `;
      }

      const responseContent: Content = {
        text: advice.trim(),
        actions: ["SOVEREIGN_LIVING_ADVICE"],
        source: message.content.source || "sovereign-living",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error("Error in sovereign living action:", error);

      const errorContent: Content = {
        text: "Unable to provide sovereign living advice at this time. Truth requires verification through lived experience.",
        actions: ["SOVEREIGN_LIVING_ADVICE"],
        source: message.content.source || "sovereign-living",
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "I want advice on sovereign living and biohacking",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "🏛️ **SOVEREIGN LIVING: THE COMPLETE FRAMEWORK**\n\n**Core Pillars:**\n1. Cellular Optimization - Sprint protocols, cold/heat exposure, fasting\n2. Nutritional Sovereignty - Ruminant-first nutrition, organ meats\n3. Environmental Mastery - Circadian optimization, temperature regulation\n4. Stress Inoculation - Controlled physical and mental stress\n5. Time Sovereignty - Deep work, recovery, long-term thinking\n\nPhilosophy: The truest decentralization starts with the self. Optimize your personal node before scaling to network effects.",
          actions: ["SOVEREIGN_LIVING_ADVICE"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "Tell me about sprint protocols",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "⚡ **SPRINT PROTOCOL: CELLULAR OPTIMIZATION**\n\nThe Protocol: Six to eight times ten to fifteen second efforts, ninety second rest periods, twice weekly - Tuesday and Friday optimal.\n\nWhy Sprints Work: Sprints trigger mitochondrial biogenesis - literally creating new cellular power plants. Your muscles become denser, your VO2 max increases, and your metabolic flexibility improves.\n\nImplementation: Start conservative. Your anaerobic system needs time to adapt. Progressive overload applies to intensity, not just volume.",
          actions: ["SOVEREIGN_LIVING_ADVICE"],
        },
      },
    ],
  ],
}; 