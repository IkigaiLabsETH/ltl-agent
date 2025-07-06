// Simple test for hotel rate intelligence feature
import { GoogleHotelsScraper } from './src/services/GoogleHotelsScraper';
import { TravelDataService } from './src/services/TravelDataService';

async function testHotelFeature() {
  console.log('🏨 Testing Hotel Rate Intelligence Feature...\n');

  try {
    // Test 1: GoogleHotelsScraper
    console.log('1. Testing GoogleHotelsScraper...');
    const scraper = new GoogleHotelsScraper();
    await scraper.initialize();
    console.log('✅ GoogleHotelsScraper initialized successfully');

    // Test 2: TravelDataService perfect day detection
    console.log('\n2. Testing TravelDataService perfect day detection...');
    
    // Create a mock runtime for testing
    const mockRuntime = {
      getService: (serviceName: string) => {
        if (serviceName === 'travel-data') {
          return new TravelDataService(mockRuntime as any);
        }
        return null;
      }
    } as any;

    const travelService = new TravelDataService(mockRuntime);
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
        console.log(`   🎯 Confidence: ${(opportunity.confidenceScore * 100).toFixed(0)}%`);
        console.log(`   ⚡ Urgency: ${opportunity.urgency}`);
        console.log('');
      });
    }

    // Test 3: Curated hotels
    console.log('3. Testing curated hotels...');
    const curatedHotels = travelService.getCuratedHotels();
    console.log(`✅ Found ${curatedHotels.length} curated luxury hotels`);
    
    console.log('\n🌟 Curated Hotels:');
    curatedHotels.forEach((hotel, index) => {
      console.log(`${index + 1}. ${hotel.name} (${hotel.city})`);
      console.log(`   ⭐ ${hotel.starRating} stars | ${hotel.category}`);
      console.log(`   💰 Price Range: €${hotel.priceRange.min} - €${hotel.priceRange.max}`);
      console.log('');
    });

    // Cleanup
    await scraper.close();
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHotelFeature().catch(console.error); 