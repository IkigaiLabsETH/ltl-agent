import { describe, expect, it } from 'vitest';

// Mock health intelligence responses for demonstration
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
  }
};

describe('Health AI Agent Response Demonstration', () => {
  it('should demonstrate morning health briefing response', () => {
    const morningBriefing = mockHealthResponses.morningHealth;
    
    // Simulate the AI agent's morning health briefing response
    const morningResponse = `🌅 **HEALTH INTELLIGENCE** - ${morningBriefing.date} - ${morningBriefing.trainingDay.toUpperCase()}

💪 **TRAINING**: ${morningBriefing.trainingFocus.workoutType} - ${morningBriefing.trainingFocus.duration}
🏋️ Workout: 3 min jumping jacks + Rowing warm-up + Strength Circuit
📊 KPI Targets: Exercise ${morningBriefing.trainingFocus.kpiTargets.exercise}, HRV ${morningBriefing.trainingFocus.kpiTargets.hrv}, Muscle gain ${morningBriefing.trainingFocus.kpiTargets.muscleGain}
🎯 Focus: ${morningBriefing.trainingFocus.exercises.join(', ')}

🧘 **WELLNESS TIP**: ${morningBriefing.wellnessTips[0].title}
☀️ Protocol: ${morningBriefing.wellnessTips[0].description}
💡 Benefits: ${morningBriefing.wellnessTips[0].benefits.join(', ')}
⚡ Bitcoin Lifestyle: ${morningBriefing.wellnessTips[0].bitcoinLifestyle.join(', ')}

❄️ **BIOHACKING**: ${morningBriefing.biohackingProtocols[0].name}
🌊 Method: ${morningBriefing.biohackingProtocols[0].method}
🔥 Benefits: ${morningBriefing.biohackingProtocols[0].benefits.join(', ')}
💎 Sovereign Living: ${morningBriefing.biohackingProtocols[0].bitcoinLifestyle.join(', ')}

🌙 **RECOVERY**: Sleep Optimization
🛏️ Environment: ${morningBriefing.recoveryPreparation.sleepOptimization}
🌙 Evening Routine: ${morningBriefing.recoveryPreparation.eveningRoutine}
💤 Target: ${morningBriefing.recoveryPreparation.target}

💎 **WEALTH PRESERVATION**: Health as appreciating asset
🌟 **NETWORK OPPORTUNITIES**: Access to exclusive biohacking communities
🏛️ **LEGACY BUILDING**: Multi-generational health optimization

Sound money, sovereign health.`;

    // Verify the response format
    expect(morningResponse).toContain('🌅 **HEALTH INTELLIGENCE**');
    expect(morningResponse).toContain('💪 **TRAINING**:');
    expect(morningResponse).toContain('🧘 **WELLNESS TIP**:');
    expect(morningResponse).toContain('❄️ **BIOHACKING**:');
    expect(morningResponse).toContain('🌙 **RECOVERY**:');
    expect(morningResponse).toContain('💎 **WEALTH PRESERVATION**:');
    expect(morningResponse).toContain('Sound money, sovereign health.');

    // Log the demonstration response
    console.log('\n🌅 MORNING HEALTH BRIEFING DEMONSTRATION:');
    console.log(morningResponse);
  });

  it('should demonstrate evening health recap response', () => {
    const eveningHealth = mockHealthResponses.eveningHealth;
    
    // Simulate the AI agent's evening health recap response
    const eveningResponse = `🌙 **WELLNESS RECAP** - ${eveningHealth.date}

✅ **TRAINING COMPLETED**: ${eveningHealth.progressTracking.trainingCompleted ? 'Yes' : 'No'}
📊 Progress: ${eveningHealth.progressTracking.wellnessTipsCompleted} wellness tips completed
💪 Recovery Score: ${eveningHealth.progressTracking.recoveryScore}/100
😴 Sleep Quality: ${eveningHealth.progressTracking.sleepQuality}/100
😰 Stress Level: ${eveningHealth.progressTracking.stressLevel}/10

🌙 **RECOVERY OPTIMIZATION**:
🛏️ Sleep Protocol: ${eveningHealth.recoveryOptimization.sleepProtocol}
🍽️ Nutrition Timing: ${eveningHealth.recoveryOptimization.nutritionTiming}
🧘 Stress Management: ${eveningHealth.recoveryOptimization.stressManagement}

📊 **TOMORROW'S PREPARATION**:
💪 Training Focus: ${eveningHealth.nextDayPreparation.trainingFocus}
🍳 Nutrition Planning: ${eveningHealth.nextDayPreparation.nutritionPlanning}
🌿 Recovery Needs: ${eveningHealth.nextDayPreparation.recoveryNeeds}

💎 **WEALTH PRESERVATION**: Health optimization as cultural capital
🌟 **NETWORK OPPORTUNITIES**: Access to exclusive wellness communities
🏛️ **LEGACY BUILDING**: Multi-generational health traditions

Sound money, sovereign health.`;

    // Verify the response format
    expect(eveningResponse).toContain('🌙 **WELLNESS RECAP**');
    expect(eveningResponse).toContain('✅ **TRAINING COMPLETED**:');
    expect(eveningResponse).toContain('📊 Progress:');
    expect(eveningResponse).toContain('🌙 **RECOVERY OPTIMIZATION**:');
    expect(eveningResponse).toContain('📊 **TOMORROW\'S PREPARATION**:');
    expect(eveningResponse).toContain('💎 **WEALTH PRESERVATION**:');
    expect(eveningResponse).toContain('Sound money, sovereign health.');

    // Log the demonstration response
    console.log('\n🌙 EVENING HEALTH RECAP DEMONSTRATION:');
    console.log(eveningResponse);
  });

  it('should demonstrate training schedule integration', () => {
    const trainingSchedule = {
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
    };

    // Simulate the AI agent's training schedule response
    const trainingResponse = `💪 **WEEKLY TRAINING SCHEDULE** - Sustainable Fitness Protocol

🌅 **MONDAY**: ${trainingSchedule.monday.workoutType}
⏰ Duration: ${trainingSchedule.monday.duration}
🏋️ Exercises: ${trainingSchedule.monday.exercises.join(', ')}
📊 KPI Targets: Steps ${trainingSchedule.monday.kpiTargets.steps}, Sleep ${trainingSchedule.monday.kpiTargets.sleep}, Heart Rate ${trainingSchedule.monday.kpiTargets.heartRate}

💪 **WEDNESDAY**: ${trainingSchedule.wednesday.workoutType}
⏰ Duration: ${trainingSchedule.wednesday.duration}
🏋️ Exercises: ${trainingSchedule.wednesday.exercises.join(', ')}
📊 KPI Targets: Exercise ${trainingSchedule.wednesday.kpiTargets.exercise}, HRV ${trainingSchedule.wednesday.kpiTargets.hrv}, Muscle Gain ${trainingSchedule.wednesday.kpiTargets.muscleGain}

💎 **BITCOIN LIFESTYLE**: Sustainable performance over short-term gains
🌟 **NETWORK OPPORTUNITIES**: Access to exclusive fitness communities
🏛️ **LEGACY BUILDING**: Multi-generational health traditions

Sound money, sustainable health.`;

    // Verify the response format
    expect(trainingResponse).toContain('💪 **WEEKLY TRAINING SCHEDULE**');
    expect(trainingResponse).toContain('🌅 **MONDAY**:');
    expect(trainingResponse).toContain('💪 **WEDNESDAY**:');
    expect(trainingResponse).toContain('💎 **BITCOIN LIFESTYLE**:');
    expect(trainingResponse).toContain('Sound money, sustainable health.');

    // Log the demonstration response
    console.log('\n💪 TRAINING SCHEDULE DEMONSTRATION:');
    console.log(trainingResponse);
  });

  it('should demonstrate biohacking protocols response', () => {
    const biohackingProtocols = {
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
    };

    // Simulate the AI agent's biohacking protocols response
    const biohackingResponse = `❄️ **BIOHACKING PROTOCOLS** - Sovereign Living Optimization

🌊 **COLD EXPOSURE**:
💧 Method: ${biohackingProtocols.coldExposure.method}
⏰ Frequency: ${biohackingProtocols.coldExposure.frequency}
🔥 Benefits: ${biohackingProtocols.coldExposure.benefits.join(', ')}
💎 Bitcoin Lifestyle: ${biohackingProtocols.coldExposure.bitcoinLifestyle.join(', ')}

🔥 **SAUNA THERAPY**:
🌡️ Method: ${biohackingProtocols.saunaTherapy.method}
⏰ Frequency: ${biohackingProtocols.saunaTherapy.frequency}
🔥 Benefits: ${biohackingProtocols.saunaTherapy.benefits.join(', ')}
💎 Bitcoin Lifestyle: ${biohackingProtocols.saunaTherapy.bitcoinLifestyle.join(', ')}

⏰ **FASTING PROTOCOLS**:
🌅 Daily: ${biohackingProtocols.fastingProtocols.daily}
📅 Quarterly: ${biohackingProtocols.fastingProtocols.quarterly}
🔥 Benefits: ${biohackingProtocols.fastingProtocols.benefits.join(', ')}
💎 Bitcoin Lifestyle: ${biohackingProtocols.fastingProtocols.bitcoinLifestyle.join(', ')}

💎 **WEALTH PRESERVATION**: Biological sovereignty as appreciating asset
🌟 **NETWORK OPPORTUNITIES**: Access to exclusive biohacking communities
🏛️ **LEGACY BUILDING**: Multi-generational optimization knowledge

Sound money, sovereign biology.`;

    // Verify the response format
    expect(biohackingResponse).toContain('❄️ **BIOHACKING PROTOCOLS**');
    expect(biohackingResponse).toContain('🌊 **COLD EXPOSURE**:');
    expect(biohackingResponse).toContain('🔥 **SAUNA THERAPY**:');
    expect(biohackingResponse).toContain('⏰ **FASTING PROTOCOLS**:');
    expect(biohackingResponse).toContain('💎 **WEALTH PRESERVATION**:');
    expect(biohackingResponse).toContain('Sound money, sovereign biology.');

    // Log the demonstration response
    console.log('\n❄️ BIOHACKING PROTOCOLS DEMONSTRATION:');
    console.log(biohackingResponse);
  });
}); 