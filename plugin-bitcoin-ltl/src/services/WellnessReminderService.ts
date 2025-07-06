import { Service, logger, IAgentRuntime } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { retryOperation } from "../utils/networkUtils";

// Types for wellness reminders
interface MorningReminder {
  greeting: string;
  trainingSchedule: TrainingReminder;
  wellnessTips: WellnessTip[];
  biohackingProtocols: BiohackingProtocol[];
  dailyPreparation: string[];
  bitcoinLifestyle: string[];
  motivation: string;
}

interface EveningReminder {
  reflection: string;
  progressSummary: ProgressSummary;
  recoveryOptimization: RecoveryReminder;
  sleepPreparation: SleepPreparation;
  nextDayPreview: NextDayPreview;
  bitcoinLifestyle: string[];
  eveningRoutine: string[];
}

interface TrainingReminder {
  workoutType: string;
  duration: string;
  keyExercises: string[];
  kpiTargets: string[];
  modifications: string[];
  bitcoinLifestyle: string[];
}

interface DailyWellnessTip {
  category: 'training' | 'nutrition' | 'recovery' | 'biohacking';
  title: string;
  description: string;
  actionability: string;
  duration: string;
  bitcoinLifestyle: string[];
  knowledgeSource: string;
}

interface RecoveryReminder {
  sleepProtocol: SleepProtocol;
  stressManagement: StressManagement;
  biohackingTechniques: BiohackingTechnique[];
  nutritionTiming: NutritionTiming;
  bitcoinLifestyle: string[];
}

interface ProgressSummary {
  trainingCompleted: boolean;
  wellnessTipsCompleted: number;
  recoveryScore: number;
  sleepQuality: number;
  stressLevel: number;
  bitcoinLifestyle: string[];
}

interface SleepPreparation {
  environment: string;
  routine: string[];
  target: string;
  bitcoinLifestyle: string[];
}

interface NextDayPreview {
  trainingFocus: string;
  nutritionPlanning: string[];
  recoveryNeeds: string[];
  bitcoinLifestyle: string[];
}

interface SleepProtocol {
  environment: string;
  eveningRoutine: string[];
  target: string;
  bitcoinLifestyle: string[];
}

interface StressManagement {
  breathingProtocols: string[];
  meditation: string[];
  bitcoinLifestyle: string[];
}

interface BiohackingTechnique {
  name: string;
  method: string;
  duration: string;
  benefits: string[];
  bitcoinLifestyle: string[];
}

interface NutritionTiming {
  preWorkout: string;
  postWorkout: string;
  mealTiming: string[];
  bitcoinLifestyle: string[];
}

interface WellnessTip {
  id: string;
  category: 'training' | 'nutrition' | 'recovery' | 'biohacking';
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  bitcoinLifestyle: string[];
  knowledgeSource: string;
}

interface BiohackingProtocol {
  name: string;
  description: string;
  duration: string;
  frequency: string;
  benefits: string[];
  bitcoinLifestyle: string[];
  implementation: string[];
}

/**
 * Wellness Reminder Service
 * Provides morning and evening health reminders with actionable wellness tips
 */
export class WellnessReminderService extends BaseDataService {
  public capabilityDescription = "Provides morning and evening health reminders with actionable wellness tips";

  async updateData(): Promise<void> {
    // Wellness reminder data is static, no external updates needed
  }

  async forceUpdate(): Promise<void> {
    // Wellness reminder data is static, no external updates needed
  }

  private dailyWellnessTips: DailyWellnessTip[] = [
    {
      category: 'biohacking',
      title: 'Morning Sunlight Exposure',
      description: 'Get 10-15 minutes of direct sunlight within 30 minutes of waking',
      actionability: 'Step outside immediately after waking, face the sun, no sunglasses',
      duration: '10-15 min',
      bitcoinLifestyle: ['Natural cortisol optimization without pharmaceuticals', 'Circadian rhythm alignment'],
      knowledgeSource: 'sovereign-living.md'
    },
    {
      category: 'nutrition',
      title: 'Ruminant-First Nutrition',
      description: 'Prioritize grass-fed beef, bison, lamb as primary proteins',
      actionability: 'Plan today\'s meals around high-quality animal proteins',
      duration: 'Daily',
      bitcoinLifestyle: ['High-quality fuel for optimal performance', 'Nutrient density'],
      knowledgeSource: 'sustainable-fitness-training.md'
    },
    {
      category: 'recovery',
      title: 'Sleep Environment Setup',
      description: 'Optimize bedroom for 65-68°F, complete darkness, white noise',
      actionability: 'Set thermostat, install blackout curtains, prepare white noise',
      duration: '7-9 hours',
      bitcoinLifestyle: ['Recovery investment for long-term performance'],
      knowledgeSource: 'sustainable-fitness-training.md'
    },
    {
      category: 'training',
      title: 'Sprint Protocol',
      description: '6-8 × 10-15 sec all-out efforts with 90 sec rest',
      actionability: 'Find a hill or track, warm up properly, execute sprints',
      duration: '20-25 min',
      bitcoinLifestyle: ['Maximum efficiency for minimum time investment'],
      knowledgeSource: 'sovereign-living.md'
    }
  ];

  private biohackingProtocols: BiohackingProtocol[] = [
    {
      name: 'Cold Exposure Protocol',
      description: 'Cold shower 2-3 minutes at 50-60°F for hormetic stress',
      duration: '2-3 min',
      frequency: '3-4x per week',
      benefits: ['Brown adipose activation', 'norepinephrine boost', 'stress resilience'],
      bitcoinLifestyle: ['Controlled hormetic stress for system strengthening'],
      implementation: ['Start with 30 seconds', 'Gradually increase duration', 'Monitor response']
    },
    {
      name: 'Sauna Therapy',
      description: '15-20 minutes at 180-200°F for heat shock proteins',
      duration: '15-20 min',
      frequency: '3-4x per week',
      benefits: ['Heat shock proteins', 'cardiovascular function', 'stress resilience'],
      bitcoinLifestyle: ['Stress resilience and recovery optimization'],
      implementation: ['Start with 10 minutes', 'Stay hydrated', 'Gradually increase time']
    }
  ];

  constructor(runtime: IAgentRuntime) {
    super(runtime, "lifestyleData");
  }

  async getMorningReminder(): Promise<MorningReminder> {
    try {
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      const reminder: MorningReminder = {
        greeting: `🌅 Good morning! Time to optimize your biological hashrate for today's sovereignty mission.`,
        trainingSchedule: {
          workoutType: this.getWorkoutTypeForDay(dayOfWeek),
          duration: '20-25 min',
          keyExercises: this.getKeyExercisesForDay(dayOfWeek),
          kpiTargets: ['Exercise 20-30 min', 'HRV stable/rising', 'Sleep 7-9 hours'],
          modifications: ['Adjust intensity based on recovery', 'Focus on form over weight'],
          bitcoinLifestyle: ['Sustainable fitness for long-term sovereignty']
        },
        wellnessTips: this.dailyWellnessTips.slice(0, 2).map(tip => ({
          id: tip.title.toLowerCase().replace(/\s+/g, '-'),
          category: tip.category,
          title: tip.title,
          description: tip.description,
          duration: tip.duration,
          difficulty: 'beginner' as const,
          bitcoinLifestyle: tip.bitcoinLifestyle,
          knowledgeSource: tip.knowledgeSource
        })),
        biohackingProtocols: this.biohackingProtocols.slice(0, 1),
        dailyPreparation: [
          'Get outdoor light within 30 minutes of waking',
          'Delay coffee by 90 minutes after waking',
          'Set your 14-hour melatonin countdown',
          'Prepare for today\'s training session'
        ],
        bitcoinLifestyle: [
          'Health as appreciating asset',
          'Sovereign living through biological optimization',
          'Sustainable performance over short-term gains'
        ],
        motivation: 'Your body is the engine of your sovereignty. Optimize it like you optimize your Bitcoin stack.'
      };

      logger.info("🌅 Morning wellness reminder generated successfully");
      return reminder;
    } catch (error) {
      logger.error("❌ Error generating morning reminder:", error);
      throw new Error(`Failed to generate morning reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEveningReminder(): Promise<EveningReminder> {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDayOfWeek = tomorrow.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      const reminder: EveningReminder = {
        reflection: `🌙 Evening reflection: How did you optimize your biological hashrate today?`,
        progressSummary: {
          trainingCompleted: true,
          wellnessTipsCompleted: 2,
          recoveryScore: 85,
          sleepQuality: 88,
          stressLevel: 2,
          bitcoinLifestyle: ['Progress tracking for continuous optimization']
        },
        recoveryOptimization: {
          sleepProtocol: {
            environment: 'Complete darkness, weighted blanket, ear plugs',
            eveningRoutine: ['No screens 2 hours before bed', '0.2mg melatonin 45 min before'],
            target: '7-9 hours quality sleep, 85+ sleep score',
            bitcoinLifestyle: ['Recovery investment for long-term performance']
          },
          stressManagement: {
            breathingProtocols: ['Box breathing 4-4-4-4', 'Evening meditation'],
            meditation: ['10-20 minutes focused breathing', 'Gratitude practice'],
            bitcoinLifestyle: ['Nervous system regulation for optimal recovery']
          },
          biohackingTechniques: [
            {
              name: 'Red Light Therapy',
              method: '660/850nm for 10 minutes',
              duration: '10 min',
              benefits: ['Mitochondrial optimization', 'joint recovery', 'hormone regulation'],
              bitcoinLifestyle: ['Cellular optimization for long-term health']
            }
          ],
          nutritionTiming: {
            preWorkout: 'Fasted or light protein',
            postWorkout: 'Protein within 30 minutes',
            mealTiming: ['Last meal 3 hours before bed', 'Hydration throughout day'],
            bitcoinLifestyle: ['Optimal nutrition timing for performance']
          },
          bitcoinLifestyle: ['Recovery optimization for sustained performance']
        },
        sleepPreparation: {
          environment: 'Complete darkness, weighted blanket, ear plugs',
          routine: ['No screens 2 hours before bed', '0.2mg melatonin 45 min before', 'No food 3 hours before bed'],
          target: '7-9 hours quality sleep, 85+ sleep score',
          bitcoinLifestyle: ['Sleep as foundation for daily optimization']
        },
        nextDayPreview: {
          trainingFocus: `Tomorrow: ${this.getWorkoutTypeForDay(tomorrowDayOfWeek)}`,
          nutritionPlanning: ['Anti-inflammatory foods', 'omega-3s', 'adequate protein'],
          recoveryNeeds: ['Light activity', 'mobility work', 'stress reduction'],
          bitcoinLifestyle: ['Preparation for optimal performance']
        },
        bitcoinLifestyle: [
          'Health optimization as cultural capital',
          'Sovereign living through biological mastery',
          'Legacy building through health knowledge'
        ],
        eveningRoutine: [
          'Evening meditation and reflection',
          'Prepare sleep environment',
          'Review tomorrow\'s training plan',
          'Gratitude practice'
        ]
      };

      logger.info("🌙 Evening wellness reminder generated successfully");
      return reminder;
    } catch (error) {
      logger.error("❌ Error generating evening reminder:", error);
      throw new Error(`Failed to generate evening reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDailyWellnessTips(count: number = 3): Promise<DailyWellnessTip[]> {
    try {
      const tips = this.dailyWellnessTips.slice(0, count);
      logger.info(`🧘 Daily wellness tips retrieved (${tips.length} tips)`);
      return tips;
    } catch (error) {
      logger.error("❌ Error retrieving daily wellness tips:", error);
      throw new Error(`Failed to retrieve daily wellness tips: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecoveryReminder(): Promise<RecoveryReminder> {
    try {
      const recovery: RecoveryReminder = {
        sleepProtocol: {
          environment: '65-68°F, complete darkness, white noise',
          eveningRoutine: ['No screens 2 hours before bed', '0.2mg melatonin 45 min before', 'No food 3 hours before bed'],
          target: '7-9 hours quality sleep, 85+ sleep score',
          bitcoinLifestyle: ['Recovery investment for long-term performance']
        },
        stressManagement: {
          breathingProtocols: ['Box breathing 4-4-4-4', 'Wim Hof method'],
          meditation: ['10-20 minutes focused breathing', 'Evening gratitude practice'],
          bitcoinLifestyle: ['Nervous system regulation for optimal recovery']
        },
        biohackingTechniques: [
          {
            name: 'Cold Exposure',
            method: 'Cold shower 2-3 minutes at 50-60°F',
            duration: '2-3 min',
            benefits: ['Inflammation reduction', 'recovery enhancement', 'stress resilience'],
            bitcoinLifestyle: ['Controlled hormetic stress for system strengthening']
          },
          {
            name: 'Red Light Therapy',
            method: '660/850nm for 10 minutes',
            duration: '10 min',
            benefits: ['ATP production', 'cellular repair', 'hormone optimization'],
            bitcoinLifestyle: ['Cellular optimization for long-term health']
          }
        ],
        nutritionTiming: {
          preWorkout: 'Fasted or light protein',
          postWorkout: 'Protein within 30 minutes',
          mealTiming: ['Last meal 3 hours before bed', 'Hydration throughout day'],
          bitcoinLifestyle: ['Optimal nutrition timing for performance']
        },
        bitcoinLifestyle: ['Recovery optimization for sustained performance']
      };

      logger.info("🌙 Recovery reminder generated successfully");
      return recovery;
    } catch (error) {
      logger.error("❌ Error generating recovery reminder:", error);
      throw new Error(`Failed to generate recovery reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getWorkoutTypeForDay(dayOfWeek: string): string {
    const workoutTypes: Record<string, string> = {
      monday: 'Strength & Daily Movement',
      wednesday: 'Strength & Core',
      friday: 'Sprint Protocol & Recovery',
      tuesday: 'Active Recovery',
      thursday: 'Active Recovery & Outdoor Fun',
      saturday: 'Outdoor Activities',
      sunday: 'Complete Rest & Recovery'
    };
    return workoutTypes[dayOfWeek] || 'Active Recovery';
  }

  private getKeyExercisesForDay(dayOfWeek: string): string[] {
    const exercises: Record<string, string[]> = {
      monday: ['Squats', 'Push-ups', 'Plank'],
      wednesday: ['Lunges', 'Push-ups', 'Russian twists', 'Plank taps'],
      friday: ['Sprint Protocol', 'Mobility Work'],
      tuesday: ['Light walking', 'Stretching', 'Mobility work'],
      thursday: ['Outdoor activities', 'Light movement', 'Nature immersion'],
      saturday: ['Hiking', 'Swimming', 'Outdoor sports'],
      sunday: ['Complete rest', 'Light stretching', 'Recovery focus']
    };
    return exercises[dayOfWeek] || ['Light movement', 'Recovery focus'];
  }
} 