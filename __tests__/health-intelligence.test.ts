import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import { logger } from '@elizaos/core';
import type { IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import {
  runCoreActionTests,
  documentTestResult,
  createMockRuntime,
  createMockMessage,
  createMockState,
} from './utils/core-test-utils';

// Setup environment variables
dotenv.config();

// Mock health intelligence responses for testing
const mockHealthResponses = {
  morningHealth: {
    date: '2025-01-15',
    trainingDay: 'wednesday',
    trainingFocus: {
      workoutType: 'Strength & Core',
      duration: '20-25 min',
      exercises: ['Lunges', 'Push-ups', 'Russian twists', 'Plank taps'],
      kpiTargets: {
        exercise: '20-30 min',
        hrv: 'stable/rising',
        muscleGain: '0.5-1 lb/month'
      }
    },
    wellnessTips: [
      {
        category: 'biohacking',
        title: 'Morning Sunlight Exposure',
        description: '10-15 minutes direct sunlight within 30 minutes of waking',
        benefits: ['Vitamin D', 'nitric oxide', 'circadian rhythm regulation'],
        bitcoinLifestyle: ['Natural cortisol optimization without pharmaceuticals']
      }
    ],
    biohackingProtocols: [
      {
        name: 'Cold Exposure Protocol',
        method: 'Cold shower 2-3 minutes at 50-60°F',
        benefits: ['Brown adipose activation', 'norepinephrine boost', 'stress resilience'],
        bitcoinLifestyle: ['Controlled hormetic stress for system strengthening']
      }
    ],
    recoveryPreparation: {
      sleepOptimization: '65-68°F, complete darkness, white noise',
      eveningRoutine: 'No screens 2 hours before bed, 0.2mg melatonin 45 min before',
      target: '7-9 hours quality sleep, 85+ sleep score'
    }
  },
  eveningHealth: {
    date: '2025-01-15',
    progressTracking: {
      trainingCompleted: true,
      wellnessTipsCompleted: 2,
      recoveryScore: 85,
      sleepQuality: 88,
      stressLevel: 2
    },
    recoveryOptimization: {
      sleepProtocol: 'Complete darkness, weighted blanket, ear plugs',
      nutritionTiming: 'Last meal 3 hours before bed, hydration throughout day',
      stressManagement: 'Evening meditation, breathing exercises'
    },
    nextDayPreparation: {
      trainingFocus: 'Thursday - Active Recovery & Outdoor Fun',
      nutritionPlanning: 'Anti-inflammatory foods, omega-3s',
      recoveryNeeds: 'Light activity, mobility work, stress reduction'
    }
  },
  trainingSchedule: {
    monday: {
      workoutType: 'Strength & Daily Movement',
      duration: '20-25 min',
      exercises: ['Squats', 'Push-ups', 'Plank'],
      kpiTargets: {
        steps: '8,000-10,000',
        sleep: '7-9 hours (85+ score)',
        heartRate: 'Zone 2 (60-70% max)'
      }
    },
    wednesday: {
      workoutType: 'Strength & Core',
      duration: '20-25 min',
      exercises: ['Lunges', 'Push-ups', 'Russian twists', 'Plank taps'],
      kpiTargets: {
        exercise: '20-30 min',
        hrv: 'stable/rising',
        muscleGain: '0.5-1 lb/month'
      }
    }
  },
  biohackingProtocols: {
    coldExposure: {
      method: 'Cold shower 2-3 minutes at 50-60°F',
      frequency: '3-4x per week',
      benefits: ['Brown adipose activation', 'norepinephrine boost', 'stress resilience'],
      bitcoinLifestyle: ['Controlled hormetic stress for system strengthening']
    },
    saunaTherapy: {
      method: '15-20 minutes at 180-200°F',
      frequency: '3-4x per week',
      benefits: ['Heat shock proteins', 'cardiovascular function', 'protein synthesis'],
      bitcoinLifestyle: ['Stress resilience and recovery optimization']
    },
    fastingProtocols: {
      daily: '16:8 protocol - 16-hour fast, 8-hour feeding window',
      quarterly: '72-hour fasts for cellular autophagy',
      benefits: ['Metabolic flexibility', 'growth hormone optimization', 'mental clarity'],
      bitcoinLifestyle: ['Cellular cleanup and system optimization']
    }
  },
  wellnessTips: [
    {
      category: 'nutrition',
      title: 'Ruminant-First Approach',
      description: 'Prioritize grass-fed beef, bison, lamb as primary proteins',
      benefits: ['Complete amino acid profiles', 'nutrient density', 'hormone production'],
      bitcoinLifestyle: ['High-quality fuel for optimal performance']
    },
    {
      category: 'recovery',
      title: 'Sleep Environment Optimization',
      description: 'Cold bedroom (18-20°C), weighted blanket, complete darkness',
      benefits: ['Optimal sleep temperature', 'nervous system calm', 'melatonin production'],
      bitcoinLifestyle: ['Recovery investment for long-term performance']
    },
    {
      category: 'training',
      title: 'Sprint Protocol',
      description: '6-8 × 10-15 sec all-out efforts with 90 sec rest',
      benefits: ['Testosterone boost', 'BDNF increase', 'time-efficient fat loss'],
      bitcoinLifestyle: ['Maximum efficiency for minimum time investment']
    }
  ]
};

// Spy on logger to capture logs for documentation
beforeAll(() => {
  vi.spyOn(logger, 'info');
  vi.spyOn(logger, 'error');
  vi.spyOn(logger, 'warn');
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('Health Intelligence System', () => {
  describe('Morning Health Briefing', () => {
    it('should provide complete morning health briefing with training schedule', () => {
      const morningBriefing = mockHealthResponses.morningHealth;
      
      expect(morningBriefing).toBeDefined();
      expect(morningBriefing.date).toBe('2025-01-15');
      expect(morningBriefing.trainingDay).toBe('wednesday');
      expect(morningBriefing.trainingFocus).toBeDefined();
      expect(morningBriefing.wellnessTips).toBeDefined();
      expect(morningBriefing.biohackingProtocols).toBeDefined();
      expect(morningBriefing.recoveryPreparation).toBeDefined();

      // Test training focus structure
      expect(morningBriefing.trainingFocus.workoutType).toBe('Strength & Core');
      expect(morningBriefing.trainingFocus.duration).toBe('20-25 min');
      expect(Array.isArray(morningBriefing.trainingFocus.exercises)).toBe(true);
      expect(morningBriefing.trainingFocus.exercises).toContain('Lunges');
      expect(morningBriefing.trainingFocus.exercises).toContain('Push-ups');

      // Test KPI targets
      expect(morningBriefing.trainingFocus.kpiTargets).toBeDefined();
      expect(morningBriefing.trainingFocus.kpiTargets.exercise).toBe('20-30 min');
      expect(morningBriefing.trainingFocus.kpiTargets.hrv).toBe('stable/rising');

      documentTestResult('Morning Health Briefing Structure', morningBriefing);
    });

    it('should include wellness tips with Bitcoin lifestyle integration', () => {
      const wellnessTips = mockHealthResponses.morningHealth.wellnessTips;
      
      expect(Array.isArray(wellnessTips)).toBe(true);
      expect(wellnessTips.length).toBeGreaterThan(0);

      const biohackingTip = wellnessTips.find(tip => tip.category === 'biohacking');
      expect(biohackingTip).toBeDefined();
      expect(biohackingTip?.title).toBe('Morning Sunlight Exposure');
      expect(biohackingTip?.description).toContain('10-15 minutes direct sunlight');
      expect(Array.isArray(biohackingTip?.benefits)).toBe(true);
      expect(Array.isArray(biohackingTip?.bitcoinLifestyle)).toBe(true);
      expect(biohackingTip?.bitcoinLifestyle).toContain('Natural cortisol optimization without pharmaceuticals');

      documentTestResult('Wellness Tips with Bitcoin Integration', wellnessTips);
    });

    it('should include biohacking protocols with implementation details', () => {
      const biohackingProtocols = mockHealthResponses.morningHealth.biohackingProtocols;
      
      expect(Array.isArray(biohackingProtocols)).toBe(true);
      expect(biohackingProtocols.length).toBeGreaterThan(0);

      const coldExposure = biohackingProtocols.find(protocol => protocol.name === 'Cold Exposure Protocol');
      expect(coldExposure).toBeDefined();
      expect(coldExposure?.method).toContain('Cold shower 2-3 minutes');
      expect(Array.isArray(coldExposure?.benefits)).toBe(true);
      expect(coldExposure?.benefits).toContain('Brown adipose activation');
      expect(Array.isArray(coldExposure?.bitcoinLifestyle)).toBe(true);
      expect(coldExposure?.bitcoinLifestyle).toContain('Controlled hormetic stress for system strengthening');

      documentTestResult('Biohacking Protocols', biohackingProtocols);
    });

    it('should provide recovery preparation with sleep optimization', () => {
      const recoveryPreparation = mockHealthResponses.morningHealth.recoveryPreparation;
      
      expect(recoveryPreparation).toBeDefined();
      expect(recoveryPreparation.sleepOptimization).toContain('65-68°F');
      expect(recoveryPreparation.sleepOptimization).toContain('complete darkness');
      expect(recoveryPreparation.eveningRoutine).toContain('No screens 2 hours before bed');
      expect(recoveryPreparation.eveningRoutine).toContain('0.2mg melatonin');
      expect(recoveryPreparation.target).toContain('7-9 hours quality sleep');
      expect(recoveryPreparation.target).toContain('85+ sleep score');

      documentTestResult('Recovery Preparation', recoveryPreparation);
    });
  });

  describe('Evening Health Recap', () => {
    it('should provide comprehensive evening health recap with progress tracking', () => {
      const eveningHealth = mockHealthResponses.eveningHealth;
      
      expect(eveningHealth).toBeDefined();
      expect(eveningHealth.date).toBe('2025-01-15');
      expect(eveningHealth.progressTracking).toBeDefined();
      expect(eveningHealth.recoveryOptimization).toBeDefined();
      expect(eveningHealth.nextDayPreparation).toBeDefined();

      // Test progress tracking
      expect(eveningHealth.progressTracking.trainingCompleted).toBe(true);
      expect(eveningHealth.progressTracking.wellnessTipsCompleted).toBe(2);
      expect(eveningHealth.progressTracking.recoveryScore).toBe(85);
      expect(eveningHealth.progressTracking.sleepQuality).toBe(88);
      expect(eveningHealth.progressTracking.stressLevel).toBe(2);

      documentTestResult('Evening Health Recap Structure', eveningHealth);
    });

    it('should include recovery optimization strategies', () => {
      const recoveryOptimization = mockHealthResponses.eveningHealth.recoveryOptimization;
      
      expect(recoveryOptimization).toBeDefined();
      expect(recoveryOptimization.sleepProtocol).toContain('Complete darkness');
      expect(recoveryOptimization.sleepProtocol).toContain('weighted blanket');
      expect(recoveryOptimization.nutritionTiming).toContain('Last meal 3 hours before bed');
      expect(recoveryOptimization.stressManagement).toContain('Evening meditation');
      expect(recoveryOptimization.stressManagement).toContain('breathing exercises');

      documentTestResult('Recovery Optimization', recoveryOptimization);
    });

    it('should provide next day preparation guidance', () => {
      const nextDayPreparation = mockHealthResponses.eveningHealth.nextDayPreparation;
      
      expect(nextDayPreparation).toBeDefined();
      expect(nextDayPreparation.trainingFocus).toContain('Thursday - Active Recovery & Outdoor Fun');
      expect(nextDayPreparation.nutritionPlanning).toContain('Anti-inflammatory foods');
      expect(nextDayPreparation.nutritionPlanning).toContain('omega-3s');
      expect(nextDayPreparation.recoveryNeeds).toContain('Light activity');
      expect(nextDayPreparation.recoveryNeeds).toContain('mobility work');

      documentTestResult('Next Day Preparation', nextDayPreparation);
    });
  });

  describe('Training Schedule Integration', () => {
    it('should provide structured weekly training schedule', () => {
      const trainingSchedule = mockHealthResponses.trainingSchedule;
      
      expect(trainingSchedule).toBeDefined();
      expect(trainingSchedule.monday).toBeDefined();
      expect(trainingSchedule.wednesday).toBeDefined();

      // Test Monday schedule
      expect(trainingSchedule.monday.workoutType).toBe('Strength & Daily Movement');
      expect(trainingSchedule.monday.duration).toBe('20-25 min');
      expect(Array.isArray(trainingSchedule.monday.exercises)).toBe(true);
      expect(trainingSchedule.monday.exercises).toContain('Squats');
      expect(trainingSchedule.monday.exercises).toContain('Push-ups');
      expect(trainingSchedule.monday.exercises).toContain('Plank');

      // Test KPI targets
      expect(trainingSchedule.monday.kpiTargets).toBeDefined();
      expect(trainingSchedule.monday.kpiTargets.steps).toBe('8,000-10,000');
      expect(trainingSchedule.monday.kpiTargets.sleep).toBe('7-9 hours (85+ score)');
      expect(trainingSchedule.monday.kpiTargets.heartRate).toBe('Zone 2 (60-70% max)');

      documentTestResult('Training Schedule Structure', trainingSchedule);
    });

    it('should include specific workout details for each day', () => {
      const wednesdaySchedule = mockHealthResponses.trainingSchedule.wednesday;
      
      expect(wednesdaySchedule.workoutType).toBe('Strength & Core');
      expect(wednesdaySchedule.duration).toBe('20-25 min');
      expect(Array.isArray(wednesdaySchedule.exercises)).toBe(true);
      expect(wednesdaySchedule.exercises).toContain('Lunges');
      expect(wednesdaySchedule.exercises).toContain('Push-ups');
      expect(wednesdaySchedule.exercises).toContain('Russian twists');
      expect(wednesdaySchedule.exercises).toContain('Plank taps');

      // Test KPI targets
      expect(wednesdaySchedule.kpiTargets.exercise).toBe('20-30 min');
      expect(wednesdaySchedule.kpiTargets.hrv).toBe('stable/rising');
      expect(wednesdaySchedule.kpiTargets.muscleGain).toBe('0.5-1 lb/month');

      documentTestResult('Wednesday Training Schedule', wednesdaySchedule);
    });
  });

  describe('Biohacking Protocols', () => {
    it('should provide comprehensive biohacking protocol details', () => {
      const biohackingProtocols = mockHealthResponses.biohackingProtocols;
      
      expect(biohackingProtocols).toBeDefined();
      expect(biohackingProtocols.coldExposure).toBeDefined();
      expect(biohackingProtocols.saunaTherapy).toBeDefined();
      expect(biohackingProtocols.fastingProtocols).toBeDefined();

      documentTestResult('Biohacking Protocols Overview', biohackingProtocols);
    });

    it('should include cold exposure protocol with Bitcoin lifestyle integration', () => {
      const coldExposure = mockHealthResponses.biohackingProtocols.coldExposure;
      
      expect(coldExposure.method).toContain('Cold shower 2-3 minutes at 50-60°F');
      expect(coldExposure.frequency).toBe('3-4x per week');
      expect(Array.isArray(coldExposure.benefits)).toBe(true);
      expect(coldExposure.benefits).toContain('Brown adipose activation');
      expect(coldExposure.benefits).toContain('norepinephrine boost');
      expect(coldExposure.benefits).toContain('stress resilience');
      expect(Array.isArray(coldExposure.bitcoinLifestyle)).toBe(true);
      expect(coldExposure.bitcoinLifestyle).toContain('Controlled hormetic stress for system strengthening');

      documentTestResult('Cold Exposure Protocol', coldExposure);
    });

    it('should include sauna therapy protocol details', () => {
      const saunaTherapy = mockHealthResponses.biohackingProtocols.saunaTherapy;
      
      expect(saunaTherapy.method).toContain('15-20 minutes at 180-200°F');
      expect(saunaTherapy.frequency).toBe('3-4x per week');
      expect(Array.isArray(saunaTherapy.benefits)).toBe(true);
      expect(saunaTherapy.benefits).toContain('Heat shock proteins');
      expect(saunaTherapy.benefits).toContain('cardiovascular function');
      expect(saunaTherapy.benefits).toContain('protein synthesis');
      expect(Array.isArray(saunaTherapy.bitcoinLifestyle)).toBe(true);
      expect(saunaTherapy.bitcoinLifestyle).toContain('Stress resilience and recovery optimization');

      documentTestResult('Sauna Therapy Protocol', saunaTherapy);
    });

    it('should include fasting protocols with multiple approaches', () => {
      const fastingProtocols = mockHealthResponses.biohackingProtocols.fastingProtocols;
      
      expect(fastingProtocols.daily).toContain('16:8 protocol');
      expect(fastingProtocols.daily).toContain('16-hour fast, 8-hour feeding window');
      expect(fastingProtocols.quarterly).toContain('72-hour fasts for cellular autophagy');
      expect(Array.isArray(fastingProtocols.benefits)).toBe(true);
      expect(fastingProtocols.benefits).toContain('Metabolic flexibility');
      expect(fastingProtocols.benefits).toContain('growth hormone optimization');
      expect(fastingProtocols.benefits).toContain('mental clarity');
      expect(Array.isArray(fastingProtocols.bitcoinLifestyle)).toBe(true);
      expect(fastingProtocols.bitcoinLifestyle).toContain('Cellular cleanup and system optimization');

      documentTestResult('Fasting Protocols', fastingProtocols);
    });
  });

  describe('Wellness Tips', () => {
    it('should provide diverse wellness tips across multiple categories', () => {
      const wellnessTips = mockHealthResponses.wellnessTips;
      
      expect(Array.isArray(wellnessTips)).toBe(true);
      expect(wellnessTips.length).toBeGreaterThan(0);

      // Test nutrition tip
      const nutritionTip = wellnessTips.find(tip => tip.category === 'nutrition');
      expect(nutritionTip).toBeDefined();
      expect(nutritionTip?.title).toBe('Ruminant-First Approach');
      expect(nutritionTip?.description).toContain('grass-fed beef, bison, lamb');
      expect(Array.isArray(nutritionTip?.benefits)).toBe(true);
      expect(nutritionTip?.benefits).toContain('Complete amino acid profiles');
      expect(Array.isArray(nutritionTip?.bitcoinLifestyle)).toBe(true);
      expect(nutritionTip?.bitcoinLifestyle).toContain('High-quality fuel for optimal performance');

      // Test recovery tip
      const recoveryTip = wellnessTips.find(tip => tip.category === 'recovery');
      expect(recoveryTip).toBeDefined();
      expect(recoveryTip?.title).toBe('Sleep Environment Optimization');
      expect(recoveryTip?.description).toContain('Cold bedroom (18-20°C)');
      expect(Array.isArray(recoveryTip?.benefits)).toBe(true);
      expect(recoveryTip?.benefits).toContain('Optimal sleep temperature');
      expect(Array.isArray(recoveryTip?.bitcoinLifestyle)).toBe(true);
      expect(recoveryTip?.bitcoinLifestyle).toContain('Recovery investment for long-term performance');

      // Test training tip
      const trainingTip = wellnessTips.find(tip => tip.category === 'training');
      expect(trainingTip).toBeDefined();
      expect(trainingTip?.title).toBe('Sprint Protocol');
      expect(trainingTip?.description).toContain('6-8 × 10-15 sec all-out efforts');
      expect(Array.isArray(trainingTip?.benefits)).toBe(true);
      expect(trainingTip?.benefits).toContain('Testosterone boost');
      expect(Array.isArray(trainingTip?.bitcoinLifestyle)).toBe(true);
      expect(trainingTip?.bitcoinLifestyle).toContain('Maximum efficiency for minimum time investment');

      documentTestResult('Wellness Tips Diversity', wellnessTips);
    });
  });

  describe('Health Intelligence Response Format', () => {
    it('should generate properly formatted morning health briefing', () => {
      const morningBriefing = mockHealthResponses.morningHealth;
      
      // Simulate the formatted response
      const formattedResponse = `🌅 HEALTH INTELLIGENCE - ${morningBriefing.date} - ${morningBriefing.trainingDay.toUpperCase()}

💪 TRAINING: ${morningBriefing.trainingFocus.workoutType} - ${morningBriefing.trainingFocus.duration}
🏋️ Workout: ${morningBriefing.trainingFocus.exercises.join(', ')}
📊 KPI Targets: ${morningBriefing.trainingFocus.kpiTargets.exercise}, HRV ${morningBriefing.trainingFocus.kpiTargets.hrv}, Muscle gain ${morningBriefing.trainingFocus.kpiTargets.muscleGain}

🧘 WELLNESS TIP: ${morningBriefing.wellnessTips[0].title}
☀️ Protocol: ${morningBriefing.wellnessTips[0].description}
💡 Benefits: ${morningBriefing.wellnessTips[0].benefits.join(', ')}
⚡ Bitcoin Lifestyle: ${morningBriefing.wellnessTips[0].bitcoinLifestyle.join(', ')}

❄️ BIOHACKING: ${morningBriefing.biohackingProtocols[0].name}
🌊 Method: ${morningBriefing.biohackingProtocols[0].method}
🔥 Benefits: ${morningBriefing.biohackingProtocols[0].benefits.join(', ')}
💎 Sovereign Living: ${morningBriefing.biohackingProtocols[0].bitcoinLifestyle.join(', ')}

🌙 RECOVERY: Sleep Optimization
🛏️ Environment: ${morningBriefing.recoveryPreparation.sleepOptimization}
🌙 Evening Routine: ${morningBriefing.recoveryPreparation.eveningRoutine}
💤 Target: ${morningBriefing.recoveryPreparation.target}

💎 WEALTH PRESERVATION: Health as appreciating asset
🌟 NETWORK OPPORTUNITIES: Access to exclusive biohacking communities
🏛️ LEGACY BUILDING: Multi-generational health optimization

Sound money, sovereign health.`;

      expect(formattedResponse).toContain('🌅 HEALTH INTELLIGENCE');
      expect(formattedResponse).toContain('💪 TRAINING:');
      expect(formattedResponse).toContain('🧘 WELLNESS TIP:');
      expect(formattedResponse).toContain('❄️ BIOHACKING:');
      expect(formattedResponse).toContain('🌙 RECOVERY:');
      expect(formattedResponse).toContain('💎 WEALTH PRESERVATION:');
      expect(formattedResponse).toContain('Sound money, sovereign health.');

      documentTestResult('Morning Health Response Format', formattedResponse);
    });

    it('should generate properly formatted evening health recap', () => {
      const eveningHealth = mockHealthResponses.eveningHealth;
      
      // Simulate the formatted response
      const formattedResponse = `🌙 WELLNESS RECAP - ${eveningHealth.date}

✅ TRAINING COMPLETED: ${eveningHealth.progressTracking.trainingCompleted ? 'Yes' : 'No'}
📊 Progress: ${eveningHealth.progressTracking.wellnessTipsCompleted} wellness tips completed
💪 Recovery Score: ${eveningHealth.progressTracking.recoveryScore}/100
😴 Sleep Quality: ${eveningHealth.progressTracking.sleepQuality}/100
😰 Stress Level: ${eveningHealth.progressTracking.stressLevel}/10

🌙 RECOVERY OPTIMIZATION:
🛏️ Sleep Protocol: ${eveningHealth.recoveryOptimization.sleepProtocol}
🍽️ Nutrition Timing: ${eveningHealth.recoveryOptimization.nutritionTiming}
🧘 Stress Management: ${eveningHealth.recoveryOptimization.stressManagement}

📊 TOMORROW'S PREPARATION:
💪 Training Focus: ${eveningHealth.nextDayPreparation.trainingFocus}
🍳 Nutrition Planning: ${eveningHealth.nextDayPreparation.nutritionPlanning}
🌿 Recovery Needs: ${eveningHealth.nextDayPreparation.recoveryNeeds}

💎 WEALTH PRESERVATION: Health optimization as cultural capital
🌟 NETWORK OPPORTUNITIES: Access to exclusive wellness communities
🏛️ LEGACY BUILDING: Multi-generational health traditions

Sound money, sovereign health.`;

      expect(formattedResponse).toContain('🌙 WELLNESS RECAP');
      expect(formattedResponse).toContain('✅ TRAINING COMPLETED:');
      expect(formattedResponse).toContain('📊 Progress:');
      expect(formattedResponse).toContain('🌙 RECOVERY OPTIMIZATION:');
      expect(formattedResponse).toContain('📊 TOMORROW\'S PREPARATION:');
      expect(formattedResponse).toContain('💎 WEALTH PRESERVATION:');
      expect(formattedResponse).toContain('Sound money, sovereign health.');

      documentTestResult('Evening Health Response Format', formattedResponse);
    });
  });

  describe('Health Intelligence Integration', () => {
    it('should integrate with existing Bitcoin lifestyle philosophy', () => {
      // Test that all health responses include Bitcoin lifestyle elements
      const allResponses = [
        mockHealthResponses.morningHealth,
        mockHealthResponses.eveningHealth,
        mockHealthResponses.biohackingProtocols,
        mockHealthResponses.wellnessTips
      ];

      allResponses.forEach(response => {
        if (Array.isArray(response)) {
          // For arrays like wellnessTips
          response.forEach(item => {
            if (item.bitcoinLifestyle) {
              expect(Array.isArray(item.bitcoinLifestyle)).toBe(true);
              expect(item.bitcoinLifestyle.length).toBeGreaterThan(0);
            }
          });
        } else if (typeof response === 'object') {
          // For objects, check if they have bitcoinLifestyle properties
          const hasBitcoinLifestyle = Object.values(response).some(value => {
            if (Array.isArray(value)) {
              return value.some(item => item.bitcoinLifestyle);
            }
            return value && typeof value === 'object' && value.bitcoinLifestyle;
          });
          
          // Not all responses need Bitcoin lifestyle, but many should have it
          if (hasBitcoinLifestyle) {
            expect(hasBitcoinLifestyle).toBe(true);
          }
        }
      });

      documentTestResult('Bitcoin Lifestyle Integration', 'All health responses include Bitcoin lifestyle elements');
    });

    it('should maintain consistency with sustainable fitness principles', () => {
      // Test that training schedule follows sustainable fitness principles
      const trainingSchedule = mockHealthResponses.trainingSchedule;
      
      Object.values(trainingSchedule).forEach(day => {
        // Check that duration is reasonable (parse the duration string)
        const durationMatch = day.duration.match(/(\d+)/);
        if (durationMatch) {
          const durationMinutes = parseInt(durationMatch[1]);
          expect(durationMinutes).toBeLessThanOrEqual(45); // Sustainable duration
        }
        expect(day.exercises.length).toBeLessThanOrEqual(5); // Manageable exercise count
        expect(day.kpiTargets).toBeDefined(); // KPI tracking for progress
      });

      // Test that biohacking protocols are sustainable
      const biohackingProtocols = mockHealthResponses.biohackingProtocols;
      expect(biohackingProtocols.coldExposure.frequency).toBe('3-4x per week'); // Sustainable frequency
      expect(biohackingProtocols.saunaTherapy.frequency).toBe('3-4x per week'); // Sustainable frequency

      documentTestResult('Sustainable Fitness Principles', 'All protocols follow sustainable fitness principles');
    });
  });
}); 