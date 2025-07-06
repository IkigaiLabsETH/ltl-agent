import { Service, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { retryOperation } from "../utils/networkUtils";

// Types for health intelligence
interface MorningHealthBriefing {
  date: string;
  trainingSchedule: DailyTrainingSchedule;
  wellnessTips: WellnessTip[];
  biohackingProtocols: BiohackingProtocol[];
  preparationAdvice: string[];
  bitcoinLifestyle: string[];
  dailyFocus: string;
}

interface EveningHealthRecap {
  date: string;
  progressTracking: ProgressMetrics;
  recoveryOptimization: RecoveryStrategy;
  nextDayPreparation: NextDayPrep;
  sleepOptimization: SleepProtocol;
  bitcoinLifestyle: string[];
  eveningRoutine: string[];
}

interface DailyTrainingSchedule {
  dayOfWeek: string;
  workoutType: string;
  duration: string;
  exercises: Exercise[];
  kpiTargets: KPITargets;
  equipment: string[];
  modifications: string[];
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

interface RecoveryStrategy {
  sleepProtocol: SleepProtocol;
  nutritionTiming: NutritionTiming;
  stressManagement: StressManagement;
  biohackingTechniques: BiohackingTechnique[];
  bitcoinLifestyle: string[];
}

interface ProgressMetrics {
  trainingCompleted: boolean;
  wellnessTipsCompleted: number;
  recoveryScore: number;
  sleepQuality: number;
  stressLevel: number;
  bitcoinLifestyle: string[];
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  duration: string;
  technique: string;
  progression: string[];
  bitcoinLifestyle: string[];
}

interface KPITargets {
  steps: string;
  sleep: string;
  heartRate: string;
  hrv: string;
  bodyComposition: string;
  bitcoinLifestyle: string[];
}

interface SleepProtocol {
  environment: string;
  eveningRoutine: string[];
  target: string;
  bitcoinLifestyle: string[];
}

interface NutritionTiming {
  preWorkout: string;
  postWorkout: string;
  mealTiming: string[];
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

interface NextDayPrep {
  trainingFocus: string;
  nutritionPlanning: string[];
  recoveryNeeds: string[];
  bitcoinLifestyle: string[];
}

/**
 * Health Intelligence Service
 * Orchestrates daily health experiences and integrates with existing training schedule
 */
export class HealthIntelligenceService extends BaseDataService {
  private weeklyTrainingSchedule: Record<string, DailyTrainingSchedule> = {
    monday: {
      dayOfWeek: 'monday',
      workoutType: 'Strength & Daily Movement',
      duration: '20-25 min',
      exercises: [
        { name: 'Squats', sets: 3, reps: '12-15', duration: '5 min', technique: 'Bodyweight or weighted', progression: ['Bodyweight', 'Goblet squats', 'Barbell squats'], bitcoinLifestyle: ['Compound movements for maximum efficiency'] },
        { name: 'Push-ups', sets: 3, reps: '8-12', duration: '5 min', technique: 'Full range of motion', progression: ['Knee push-ups', 'Standard push-ups', 'Diamond push-ups'], bitcoinLifestyle: ['No equipment needed, sovereign fitness'] },
        { name: 'Plank', sets: 3, reps: '30-60 sec', duration: '5 min', technique: 'Hold position', progression: ['Standard plank', 'Side plank', 'Plank with leg lifts'], bitcoinLifestyle: ['Core strength for stability and performance'] }
      ],
      kpiTargets: {
        steps: '8,000-10,000',
        sleep: '7-9 hours (85+ score)',
        heartRate: 'Zone 2 (60-70% max)',
        hrv: 'stable/rising',
        bodyComposition: '0.5-1 lb muscle gain/month',
        bitcoinLifestyle: ['Health as appreciating asset']
      },
      equipment: ['None required', 'Optional: resistance bands'],
      modifications: ['Adjust intensity based on recovery', 'Focus on form over weight'],
      bitcoinLifestyle: ['Sustainable fitness for long-term sovereignty']
    },
    wednesday: {
      dayOfWeek: 'wednesday',
      workoutType: 'Strength & Core',
      duration: '20-25 min',
      exercises: [
        { name: 'Lunges', sets: 3, reps: '10-12 each leg', duration: '5 min', technique: 'Forward and reverse lunges', progression: ['Bodyweight', 'Weighted lunges', 'Walking lunges'], bitcoinLifestyle: ['Functional movement for real-world strength'] },
        { name: 'Push-ups', sets: 3, reps: '8-12', duration: '5 min', technique: 'Full range of motion', progression: ['Knee push-ups', 'Standard push-ups', 'Diamond push-ups'], bitcoinLifestyle: ['No equipment needed, sovereign fitness'] },
        { name: 'Russian twists', sets: 3, reps: '15-20 each side', duration: '5 min', technique: 'Seated rotation', progression: ['Bodyweight', 'Weighted twists', 'Legs elevated'], bitcoinLifestyle: ['Rotational strength for daily activities'] },
        { name: 'Plank taps', sets: 3, reps: '10-15 each side', duration: '5 min', technique: 'Plank with shoulder taps', progression: ['Standard plank', 'Plank taps', 'Plank with leg lifts'], bitcoinLifestyle: ['Core stability and coordination'] }
      ],
      kpiTargets: {
        steps: '8,000-10,000',
        sleep: '7-9 hours (85+ score)',
        heartRate: 'Zone 2 (60-70% max)',
        hrv: 'stable/rising',
        bodyComposition: '0.5-1 lb muscle gain/month',
        bitcoinLifestyle: ['Health as appreciating asset']
      },
      equipment: ['None required', 'Optional: resistance bands'],
      modifications: ['Adjust intensity based on recovery', 'Focus on form over weight'],
      bitcoinLifestyle: ['Sustainable fitness for long-term sovereignty']
    },
    friday: {
      dayOfWeek: 'friday',
      workoutType: 'Sprint Protocol & Recovery',
      duration: '25-30 min',
      exercises: [
        { name: 'Sprint Protocol', sets: 6, reps: '10-15 sec all-out', duration: '15 min', technique: 'Hill sprints or flat ground', progression: ['6 sprints', '8 sprints', '10 sprints'], bitcoinLifestyle: ['Maximum efficiency for minimum time investment'] },
        { name: 'Mobility Work', sets: 1, reps: '10-15 min', duration: '10 min', technique: 'Dynamic stretching', progression: ['Basic mobility', 'Advanced mobility', 'Movement prep'], bitcoinLifestyle: ['Recovery investment for long-term performance'] }
      ],
      kpiTargets: {
        steps: '8,000-10,000',
        sleep: '7-9 hours (85+ score)',
        heartRate: 'Zone 4-5 during sprints',
        hrv: 'stable/rising',
        bodyComposition: '0.5-1 lb muscle gain/month',
        bitcoinLifestyle: ['Health as appreciating asset']
      },
      equipment: ['None required', 'Optional: hill or track'],
      modifications: ['Adjust sprint intensity based on recovery', 'Focus on quality over quantity'],
      bitcoinLifestyle: ['Sustainable fitness for long-term sovereignty']
    }
  };

  private wellnessTips: WellnessTip[] = [
    {
      id: 'morning-sunlight',
      category: 'biohacking',
      title: 'Morning Sunlight Exposure',
      description: '10-15 minutes direct sunlight within 30 minutes of waking for vitamin D, nitric oxide, and circadian rhythm regulation',
      duration: '10-15 min',
      difficulty: 'beginner',
      bitcoinLifestyle: ['Natural cortisol optimization without pharmaceuticals', 'Circadian rhythm alignment for optimal performance'],
      knowledgeSource: 'sovereign-living.md'
    },
    {
      id: 'cold-exposure',
      category: 'biohacking',
      title: 'Cold Exposure Protocol',
      description: 'Cold shower 2-3 minutes at 50-60°F for brown adipose activation and norepinephrine boost',
      duration: '2-3 min',
      difficulty: 'intermediate',
      bitcoinLifestyle: ['Controlled hormetic stress for system strengthening', 'Natural stress resilience building'],
      knowledgeSource: 'sovereign-living.md'
    },
    {
      id: 'ruminant-nutrition',
      category: 'nutrition',
      title: 'Ruminant-First Approach',
      description: 'Prioritize grass-fed beef, bison, lamb as primary proteins for complete amino acid profiles',
      duration: 'Daily',
      difficulty: 'beginner',
      bitcoinLifestyle: ['High-quality fuel for optimal performance', 'Nutrient density for cellular optimization'],
      knowledgeSource: 'sustainable-fitness-training.md'
    },
    {
      id: 'sleep-optimization',
      category: 'recovery',
      title: 'Sleep Environment Optimization',
      description: 'Cold bedroom (18-20°C), weighted blanket, complete darkness for optimal sleep temperature',
      duration: '7-9 hours',
      difficulty: 'beginner',
      bitcoinLifestyle: ['Recovery investment for long-term performance', 'Sleep as foundation for daily optimization'],
      knowledgeSource: 'sustainable-fitness-training.md'
    }
  ];

  private biohackingProtocols: BiohackingProtocol[] = [
    {
      name: 'Cold Exposure Protocol',
      description: 'Controlled cold exposure for hormetic stress adaptation',
      duration: '2-3 minutes',
      frequency: '3-4x per week',
      benefits: ['Brown adipose activation', 'norepinephrine boost', 'stress resilience', 'improved circulation'],
      bitcoinLifestyle: ['Controlled hormetic stress for system strengthening', 'Natural stress resilience building'],
      implementation: ['Start with 30 seconds cold shower', 'Gradually increase to 2-3 minutes', 'Monitor response and adjust']
    },
    {
      name: 'Sprint Protocol',
      description: '6-8 × 10-15 sec all-out efforts with 90 sec rest',
      duration: '20-25 min',
      frequency: '2-3x per week',
      benefits: ['Testosterone boost', 'BDNF increase', 'time-efficient fat loss', 'metabolic conditioning'],
      bitcoinLifestyle: ['Maximum efficiency for minimum time investment', 'Natural hormone optimization'],
      implementation: ['5-minute dynamic warm-up', '8 x 15-second all-out sprints', '90-second walking recovery', '5-minute cool-down']
    },
    {
      name: 'Sauna Therapy',
      description: '15-20 minutes at 180-200°F for heat shock protein activation',
      duration: '15-20 min',
      frequency: '3-4x per week',
      benefits: ['Heat shock proteins', 'cardiovascular function', 'protein synthesis', 'stress resilience'],
      bitcoinLifestyle: ['Stress resilience and recovery optimization', 'Natural heat adaptation'],
      implementation: ['Start with 10 minutes', 'Gradually increase to 15-20 minutes', 'Stay hydrated during session']
    }
  ];

  constructor() {
    super("health-intelligence", "Orchestrates daily health experiences and training schedule integration");
  }

  async getMorningHealthBriefing(): Promise<MorningHealthBriefing> {
    try {
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const trainingSchedule = this.weeklyTrainingSchedule[dayOfWeek] || this.weeklyTrainingSchedule.monday;

      const briefing: MorningHealthBriefing = {
        date: today.toISOString().split('T')[0],
        trainingSchedule,
        wellnessTips: this.wellnessTips.slice(0, 2),
        biohackingProtocols: this.biohackingProtocols.slice(0, 2),
        preparationAdvice: [
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
        dailyFocus: `Optimize today's ${trainingSchedule.workoutType} session for long-term health sovereignty`
      };

      logger.info("🌅 Morning health briefing generated successfully");
      return briefing;
    } catch (error) {
      logger.error("❌ Error generating morning health briefing:", error);
      throw new Error(`Failed to generate morning health briefing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEveningHealthRecap(): Promise<EveningHealthRecap> {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDayOfWeek = tomorrow.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const nextTrainingSchedule = this.weeklyTrainingSchedule[tomorrowDayOfWeek] || this.weeklyTrainingSchedule.monday;

      const recap: EveningHealthRecap = {
        date: today.toISOString().split('T')[0],
        progressTracking: {
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
            eveningRoutine: ['No screens 2 hours before bed', '0.2mg melatonin 45 min before', 'No food 3 hours before bed'],
            target: '7-9 hours quality sleep, 85+ sleep score',
            bitcoinLifestyle: ['Recovery investment for long-term performance']
          },
          nutritionTiming: {
            preWorkout: 'Fasted or light protein',
            postWorkout: 'Protein within 30 minutes',
            mealTiming: ['Last meal 3 hours before bed', 'Hydration throughout day'],
            bitcoinLifestyle: ['Optimal nutrition timing for performance']
          },
          stressManagement: {
            breathingProtocols: ['Box breathing 4-4-4-4', 'Evening meditation'],
            meditation: ['10-20 minutes focused breathing', 'Gratitude and reflection'],
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
          bitcoinLifestyle: ['Recovery optimization for sustained performance']
        },
        nextDayPreparation: {
          trainingFocus: `Tomorrow: ${nextTrainingSchedule.workoutType}`,
          nutritionPlanning: ['Anti-inflammatory foods', 'omega-3s', 'adequate protein'],
          recoveryNeeds: ['Light activity', 'mobility work', 'stress reduction'],
          bitcoinLifestyle: ['Preparation for optimal performance']
        },
        sleepOptimization: {
          environment: 'Complete darkness, weighted blanket, ear plugs',
          eveningRoutine: ['No screens 2 hours before bed', '0.2mg melatonin 45 min before'],
          target: '7-9 hours quality sleep, 85+ sleep score',
          bitcoinLifestyle: ['Sleep as foundation for daily optimization']
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

      logger.info("🌙 Evening health recap generated successfully");
      return recap;
    } catch (error) {
      logger.error("❌ Error generating evening health recap:", error);
      throw new Error(`Failed to generate evening health recap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDailyTrainingSchedule(dayOfWeek?: string): Promise<DailyTrainingSchedule> {
    try {
      const targetDay = dayOfWeek || new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
      const schedule = this.weeklyTrainingSchedule[targetDay] || this.weeklyTrainingSchedule.monday;

      logger.info(`💪 Daily training schedule retrieved for ${targetDay}`);
      return schedule;
    } catch (error) {
      logger.error("❌ Error retrieving daily training schedule:", error);
      throw new Error(`Failed to retrieve daily training schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWellnessTips(count: number = 3): Promise<WellnessTip[]> {
    try {
      const tips = this.wellnessTips.slice(0, count);
      logger.info(`🧘 Wellness tips retrieved (${tips.length} tips)`);
      return tips;
    } catch (error) {
      logger.error("❌ Error retrieving wellness tips:", error);
      throw new Error(`Failed to retrieve wellness tips: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecoveryOptimization(): Promise<RecoveryStrategy> {
    try {
      const recovery: RecoveryStrategy = {
        sleepProtocol: {
          environment: '65-68°F, complete darkness, white noise',
          eveningRoutine: ['No screens 2 hours before bed', '0.2mg melatonin 45 min before', 'No food 3 hours before bed'],
          target: '7-9 hours quality sleep, 85+ sleep score',
          bitcoinLifestyle: ['Recovery investment for long-term performance']
        },
        nutritionTiming: {
          preWorkout: 'Fasted or light protein',
          postWorkout: 'Protein within 30 minutes',
          mealTiming: ['Last meal 3 hours before bed', 'Hydration throughout day'],
          bitcoinLifestyle: ['Optimal nutrition timing for performance']
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
        bitcoinLifestyle: ['Recovery optimization for sustained performance']
      };

      logger.info("🌙 Recovery optimization strategy generated");
      return recovery;
    } catch (error) {
      logger.error("❌ Error generating recovery optimization:", error);
      throw new Error(`Failed to generate recovery optimization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 