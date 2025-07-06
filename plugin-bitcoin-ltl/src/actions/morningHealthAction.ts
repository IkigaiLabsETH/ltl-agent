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
 * Morning Health Action
 * Provides complete morning health briefing with training schedule and wellness tips
 */
export const morningHealthAction: Action = {
  name: "MORNING_HEALTH",
  similes: ["MORNING_BRIEFING", "HEALTH_BRIEFING", "DAILY_HEALTH", "WELLNESS_BRIEFING"],
  description: "Provides complete morning health briefing with training schedule and wellness tips",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("morning health") ||
      text.includes("health briefing") ||
      text.includes("daily health") ||
      text.includes("wellness briefing") ||
      text.includes("morning briefing") ||
      text.includes("today's health") ||
      text.includes("health routine") ||
      text.includes("morning routine")
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
      logger.info("🌅 Executing morning health action");
      
      // For now, provide a static response since the service isn't fully integrated yet
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Static morning briefing data
      const morningBriefing = {
        date: today.toISOString().split('T')[0],
        trainingSchedule: {
          dayOfWeek,
          workoutType: dayOfWeek === 'monday' ? 'Strength & Daily Movement' : 
                      dayOfWeek === 'wednesday' ? 'Strength & Core' : 
                      dayOfWeek === 'friday' ? 'Sprint Protocol & Recovery' : 'Active Recovery',
          duration: '20-25 min',
          exercises: [
            { name: 'Squats', sets: 3, reps: '12-15', duration: '5 min', technique: 'Bodyweight or weighted', progression: ['Bodyweight', 'Goblet squats'], bitcoinLifestyle: ['Compound movements for maximum efficiency'] },
            { name: 'Push-ups', sets: 3, reps: '8-12', duration: '5 min', technique: 'Full range of motion', progression: ['Knee push-ups', 'Standard push-ups'], bitcoinLifestyle: ['No equipment needed, sovereign fitness'] },
            { name: 'Plank', sets: 3, reps: '30-60 sec', duration: '5 min', technique: 'Hold position', progression: ['Standard plank', 'Side plank'], bitcoinLifestyle: ['Core strength for stability and performance'] }
          ],
          kpiTargets: {
            exercise: '20-30 min',
            hrv: 'stable/rising',
            sleep: '7-9 hours (85+ score)',
            heartRate: 'Zone 2 (60-70% max)',
            bodyComposition: '0.5-1 lb muscle gain/month',
            bitcoinLifestyle: ['Health as appreciating asset']
          }
        },
        wellnessTips: [{
          id: 'morning-sunlight',
          category: 'biohacking' as const,
          title: 'Morning Sunlight Exposure',
          description: '10-15 minutes direct sunlight within 30 minutes of waking',
          duration: '10-15 min',
          difficulty: 'beginner' as const,
          bitcoinLifestyle: ['Natural cortisol optimization without pharmaceuticals', 'Circadian rhythm alignment'],
          knowledgeSource: 'sovereign-living.md'
        }],
        biohackingProtocols: [{
          name: 'Cold Exposure Protocol',
          description: 'Cold shower 2-3 minutes at 50-60°F for hormetic stress',
          duration: '2-3 min',
          frequency: '3-4x per week',
          benefits: ['Brown adipose activation', 'norepinephrine boost', 'stress resilience'],
          bitcoinLifestyle: ['Controlled hormetic stress for system strengthening'],
          implementation: ['Start with 30 seconds', 'Gradually increase duration', 'Monitor response']
        }],
        bitcoinLifestyle: ['Health as appreciating asset', 'Sovereign living through biological optimization']
      };
      
      // Format the response with Bitcoin lifestyle philosophy
      const response = `🌅 **HEALTH INTELLIGENCE** - ${morningBriefing.date} - ${morningBriefing.trainingSchedule.dayOfWeek.toUpperCase()}

💪 **TRAINING**: ${morningBriefing.trainingSchedule.workoutType} - ${morningBriefing.trainingSchedule.duration}
🏋️ Workout: ${morningBriefing.trainingSchedule.exercises.map(ex => ex.name).join(', ')}
📊 KPI Targets: ${morningBriefing.trainingSchedule.kpiTargets.exercise}, HRV ${morningBriefing.trainingSchedule.kpiTargets.hrv}
🎯 Focus: ${morningBriefing.trainingSchedule.exercises.slice(0, 4).map(ex => ex.name).join(', ')}

🧘 **WELLNESS TIP**: ${morningBriefing.wellnessTips[0]?.title}
☀️ Protocol: ${morningBriefing.wellnessTips[0]?.description}
💡 Benefits: ${morningBriefing.wellnessTips[0]?.bitcoinLifestyle.join(', ')}
⚡ Bitcoin Lifestyle: ${morningBriefing.wellnessTips[0]?.bitcoinLifestyle.join(', ')}

❄️ **BIOHACKING**: ${morningBriefing.biohackingProtocols[0]?.name}
🌊 Method: ${morningBriefing.biohackingProtocols[0]?.description}
🔥 Benefits: ${morningBriefing.biohackingProtocols[0]?.benefits.join(', ')}
💎 Sovereign Living: ${morningBriefing.biohackingProtocols[0]?.bitcoinLifestyle.join(', ')}

🌙 **RECOVERY**: Sleep Optimization
🛏️ Environment: ${morningBriefing.trainingSchedule.kpiTargets.sleep}
🌙 Evening Routine: No screens 2 hours before bed, 0.2mg melatonin 45 min before
💤 Target: 7-9 hours quality sleep, 85+ sleep score

💎 **WEALTH PRESERVATION**: ${morningBriefing.bitcoinLifestyle.join(', ')}
🌟 **NETWORK OPPORTUNITIES**: Access to exclusive biohacking communities
🏛️ **LEGACY BUILDING**: Multi-generational health optimization

Sound money, sovereign health.`;

      logger.info("✅ Morning health briefing generated successfully");
      
      const responseContent: Content = {
        text: response,
        actions: ["MORNING_HEALTH"],
        source: message.content.source || "morning-health",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error("❌ Error in morning health action:", error);
      
      // Fallback response
      const fallbackResponse = `🌅 **MORNING HEALTH BRIEFING**

💪 **TRAINING**: Today's sovereignty mission begins with biological optimization
🧘 **WELLNESS**: Get outdoor light within 30 minutes of waking
❄️ **BIOHACKING**: Cold exposure for hormetic stress adaptation
🌙 **RECOVERY**: Optimize sleep environment for 7-9 hours quality rest

💎 **WEALTH PRESERVATION**: Health as appreciating asset
🌟 **NETWORK OPPORTUNITIES**: Access to exclusive biohacking communities
🏛️ **LEGACY BUILDING**: Multi-generational health optimization

Sound money, sovereign health.`;

      const errorContent: Content = {
        text: fallbackResponse,
        actions: ["MORNING_HEALTH"],
        source: message.content.source || "morning-health",
      };

      await callback(errorContent);
      return errorContent;
    }
  },
}; 