// Test Hybrid Hotel Rate Intelligence System
import { TravelDataService } from './src/services/TravelDataService';
import { SeasonalRateService } from './src/services/SeasonalRateService';

async function testHybridSystem() {
  console.log('🎯 Testing Hybrid Hotel Rate Intelligence System\n');

  try {
    // Create mock runtime
    const mockRuntime = {
      getSetting: (key: string) => {
        const settings: { [key: string]: string } = {
          'BOOKING_API_KEY': '',
          'BOOKING_API_SECRET': '',
          'GOOGLE_HOTELS_ENABLED': 'true'
        };
        return settings[key] || '';
      },
      logger: {
        info: (msg: string) => console.log(`ℹ️  ${msg}`),
        warn: (msg: string) => console.log(`⚠️  ${msg}`),
        error: (msg: string, err?: any) => console.log(`❌ ${msg}`, err || ''),
        debug: (msg: string) => console.log(`🔍 ${msg}`)
      }
    };

    // Test TravelDataService (hybrid system)
    console.log('🔗 Testing TravelDataService Hybrid System...\n');
    const travelService = new TravelDataService(mockRuntime as any);

    // Test 1: Perfect Day Detection (combines real-time + seasonal)
    console.log('🎯 PERFECT DAY DETECTION:');
    const perfectDays = await travelService.detectPerfectDays();
    console.log(`Found ${perfectDays.length} perfect day opportunities:`);
    perfectDays.slice(0, 3).forEach((day, index) => {
      console.log(`${index + 1}. ${day.hotelName} - ${day.perfectDate}`);
      console.log(`   💰 €${day.currentRate}/night (vs €${day.averageRate} avg)`);
      console.log(`   💸 ${day.savingsPercentage.toFixed(1)}% savings | 🎯 ${(day.confidenceScore * 100).toFixed(0)}% confidence`);
      console.log(`   📋 ${day.reasons.join(', ')}\n`);
    });

    // Test 2: Weekly Suggestions
    console.log('📅 WEEKLY SUGGESTIONS:');
    const weeklySuggestions = travelService.getWeeklySuggestions(3);
    console.log(`Found ${weeklySuggestions.length} weekly suggestions:`);
    weeklySuggestions.forEach((suggestion: any, index) => {
      console.log(`${index + 1}. ${suggestion.hotelName} (${suggestion.city})`);
      console.log(`   📅 ${suggestion.suggestedDate} | 💰 €${suggestion.currentRate}/night`);
      console.log(`   💸 ${suggestion.savingsPercentage.toFixed(1)}% savings | ⚡ ${suggestion.urgency.toUpperCase()}`);
      console.log(`   ⏰ ${suggestion.bookingWindow}\n`);
    });

    // Test 3: Current Month Opportunities
    console.log('📊 CURRENT MONTH OPPORTUNITIES:');
    const currentMonthOpps = travelService.getCurrentMonthOpportunities();
    console.log(`Found ${currentMonthOpps.length} current month opportunities:`);
    currentMonthOpps.forEach((opp: any, index) => {
      console.log(`${index + 1}. ${opp.hotelName} - ${opp.savingsPercentage.toFixed(1)}% savings`);
    });

    // Test 4: City Analysis
    console.log('\n🏙️  CITY SEASONAL ANALYSIS:');
    const cities = ['biarritz', 'bordeaux', 'monaco'];
    cities.forEach(city => {
      const cityAnalysis = travelService.getCitySeasonalAnalysis(city);
      console.log(`${city.toUpperCase()}: ${cityAnalysis.length} seasonal opportunities`);
    });

    // Test 5: Seasonal Rate Service (direct access)
    console.log('\n🌍 SEASONAL RATE SERVICE (Direct):');
    const seasonalService = new SeasonalRateService();
    const allRates = seasonalService.getAllSeasonalRates();
    console.log(`Total seasonal rate entries: ${allRates.length}`);
    
    // Show best opportunities by city
    cities.forEach(city => {
      const cityRates = allRates.filter(rate => rate.hotelId.startsWith(city));
      const bestRate = cityRates.reduce((best, current) => 
        current.savingsPercentage > best.savingsPercentage ? current : best
      );
      console.log(`${city.toUpperCase()} best: ${bestRate.hotelName} - ${bestRate.savingsPercentage.toFixed(1)}% savings`);
    });

    console.log('\n✅ Hybrid system test completed successfully!');
    console.log('\n🎯 SYSTEM SUMMARY:');
    console.log(`• Perfect days detected: ${perfectDays.length}`);
    console.log(`• Weekly suggestions: ${weeklySuggestions.length}`);
    console.log(`• Current month opportunities: ${currentMonthOpps.length}`);
    console.log(`• Seasonal rate entries: ${allRates.length}`);
    console.log(`• Best savings found: ${Math.max(...perfectDays.map(p => p.savingsPercentage)).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHybridSystem().catch(console.error); 