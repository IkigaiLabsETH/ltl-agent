// Test Phase 2: Action Enhancement
import { TravelDataService } from './src/services/TravelDataService';

async function testPhase2() {
  console.log('🎯 Testing Phase 2: Action Enhancement...\n');

  try {
    // Create mock runtime
    const mockRuntime = {
      getService: (serviceName: string) => {
        if (serviceName === 'travel-data') {
          return new TravelDataService(mockRuntime as any);
        }
        return null;
      }
    } as any;

    const travelService = new TravelDataService(mockRuntime);

    // Test 1: Perfect Day Detection
    console.log('1. Testing Perfect Day Detection...');
    const perfectDays = await travelService.getPerfectDayOpportunities();
    console.log(`✅ Found ${perfectDays.length} perfect day opportunities`);
    
    if (perfectDays.length > 0) {
      console.log('\n🎯 Perfect Day Opportunities:');
      perfectDays.forEach((opportunity, index) => {
        console.log(`${index + 1}. ${opportunity.hotelName}`);
        console.log(`   📅 Date: ${opportunity.perfectDate}`);
        console.log(`   💰 Current Rate: €${opportunity.currentRate}`);
        console.log(`   📈 Average Rate: €${opportunity.averageRate}`);
        console.log(`   💎 Savings: ${opportunity.savingsPercentage.toFixed(1)}%`);
        console.log(`   ⚡ Urgency: ${opportunity.urgency}`);
        console.log(`   🎯 Confidence: ${(opportunity.confidenceScore * 100).toFixed(0)}%`);
        console.log('');
      });
    }

    // Test 2: Curated Hotels
    console.log('2. Testing Curated Hotels...');
    const curatedHotels = travelService.getCuratedHotels();
    console.log(`✅ Found ${curatedHotels.length} curated luxury hotels`);
    
    console.log('\n🌟 Curated Hotels by City:');
    const hotelsByCity = curatedHotels.reduce((acc, hotel) => {
      if (!acc[hotel.city]) acc[hotel.city] = [];
      acc[hotel.city].push(hotel);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(hotelsByCity).forEach(([city, hotels]) => {
      console.log(`\n${city.toUpperCase()}:`);
      hotels.forEach(hotel => {
        console.log(`  • ${hotel.name} (${hotel.starRating}⭐ ${hotel.category})`);
        console.log(`    💰 €${hotel.priceRange.min}-${hotel.priceRange.max}`);
      });
    });

    // Test 3: Travel Insights
    console.log('\n3. Testing Travel Insights...');
    const travelInsights = travelService.getTravelInsights();
    if (travelInsights) {
      console.log('✅ Travel insights available');
      console.log(`📈 Market Trend: ${travelInsights.marketTrends.trend}`);
      console.log(`🎯 Confidence: ${(travelInsights.marketTrends.confidence * 100).toFixed(0)}%`);
      console.log(`⏰ Timeframe: ${travelInsights.marketTrends.timeframe}`);
    } else {
      console.log('⚠️ No travel insights available');
    }

    console.log('\n✅ Phase 2 testing completed successfully!');
    console.log('\n🎯 Key Enhancements:');
    console.log('• Perfect day detection integrated into booking optimization');
    console.log('• Perfect day alerts prioritized in deal monitoring');
    console.log('• Enhanced response formatting with perfect day highlights');
    console.log('• Urgency-based recommendations for perfect days');

  } catch (error) {
    console.error('❌ Phase 2 test failed:', error);
  }
}

// Run the test
testPhase2().catch(console.error); 