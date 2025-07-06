// Test Seasonal Rate System
import { SeasonalRateService } from './src/services/SeasonalRateService';
import { TravelDataService } from './src/services/TravelDataService';

async function testSeasonalRates() {
  console.log('🌍 Testing Seasonal Rate System\n');

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

    // Test SeasonalRateService directly
    console.log('📊 Testing SeasonalRateService...\n');
    const seasonalService = new SeasonalRateService();

    // Test 1: Weekly Suggestions
    console.log('🎯 WEEKLY SUGGESTIONS:');
    const weeklySuggestions = seasonalService.getWeeklySuggestions(5);
    weeklySuggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.hotelName} (${suggestion.city})`);
      console.log(`   📅 Date: ${suggestion.suggestedDate}`);
      console.log(`   💰 Rate: €${suggestion.currentRate} (vs €${suggestion.averageRate} avg)`);
      console.log(`   💸 Savings: ${suggestion.savingsPercentage.toFixed(1)}%`);
      console.log(`   🎯 Confidence: ${(suggestion.confidenceScore * 100).toFixed(1)}%`);
      console.log(`   ⚡ Urgency: ${suggestion.urgency.toUpperCase()}`);
      console.log(`   📋 Reasons: ${suggestion.reasons.join(', ')}`);
      console.log(`   ⏰ ${suggestion.bookingWindow}\n`);
    });

    // Test 2: Current Month Opportunities
    console.log('📅 CURRENT MONTH OPPORTUNITIES:');
    const currentMonthOpps = seasonalService.getCurrentMonthOpportunities();
    if (currentMonthOpps.length > 0) {
      currentMonthOpps.forEach((opp, index) => {
        console.log(`${index + 1}. ${opp.hotelName} - ${opp.savingsPercentage.toFixed(1)}% savings`);
      });
    } else {
      console.log('No current month opportunities found');
    }
    console.log('');

    // Test 3: City Analysis
    console.log('🏙️  CITY SEASONAL ANALYSIS:');
    const cities = ['biarritz', 'bordeaux', 'monaco'];
    cities.forEach(city => {
      const cityAnalysis = seasonalService.getCitySeasonalAnalysis(city);
      console.log(`${city.toUpperCase()}: ${cityAnalysis.length} seasonal opportunities`);
    });
    console.log('');

    // Test 4: Perfect Days for Specific Hotel
    console.log('🏨 PERFECT DAYS FOR HÔTEL DU PALAIS:');
    const palaisPerfectDays = seasonalService.getPerfectDaysForHotel('biarritz_palace');
    palaisPerfectDays.forEach((day, index) => {
      console.log(`${index + 1}. ${day.perfectDate} - €${day.currentRate} (${day.savingsPercentage.toFixed(1)}% savings)`);
      console.log(`   Reasons: ${day.reasons.join(', ')}`);
    });
    console.log('');

    // Test 5: TravelDataService Integration
    console.log('🔗 TESTING TRAVELDATASERVICE INTEGRATION:');
    const travelService = new TravelDataService(mockRuntime as any);
    
    // Test perfect day detection
    const perfectDays = await travelService.detectPerfectDays();
    console.log(`Found ${perfectDays.length} perfect day opportunities:`);
    perfectDays.slice(0, 3).forEach((day, index) => {
      console.log(`${index + 1}. ${day.hotelName} - ${day.perfectDate} (${day.savingsPercentage.toFixed(1)}% savings)`);
    });

    // Test weekly suggestions
    const weeklySuggestionsFromService = travelService.getWeeklySuggestions(3);
    console.log(`\nWeekly suggestions from service: ${weeklySuggestionsFromService.length} found`);

    console.log('\n✅ Seasonal rate system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSeasonalRates().catch(console.error); 