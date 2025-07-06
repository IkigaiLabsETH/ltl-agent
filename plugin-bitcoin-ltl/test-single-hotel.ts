// Test Single Hotel: Hôtel du Palais
import { GoogleHotelsScraper } from './src/services/GoogleHotelsScraper';
import { TravelDataService } from './src/services/TravelDataService';

async function testSingleHotel() {
  console.log('🏨 Testing Enhanced Scraper: Hôtel du Palais\n');

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

    // Get Hôtel du Palais from TravelDataService
    const travelService = new TravelDataService(mockRuntime as any);
    const curatedHotels = travelService.getCuratedHotels();
    const hotelDuPalais = curatedHotels.find(h => h.name.includes('Palais') && h.city === 'biarritz');

    if (!hotelDuPalais) {
      console.log('❌ Hôtel du Palais not found in curated hotels');
      return;
    }

    console.log(`✅ Found hotel: ${hotelDuPalais.name}`);
    console.log(`📍 Location: ${hotelDuPalais.location.displayName}`);
    console.log(`⭐ Category: ${hotelDuPalais.category}`);
    console.log(`💰 Price Range: €${hotelDuPalais.priceRange.min}-${hotelDuPalais.priceRange.max}\n`);

    // Initialize scraper with anti-bot measures
    console.log('🚀 Initializing enhanced scraper with anti-bot measures...');
    const scraper = new GoogleHotelsScraper();
    await scraper.initialize();

    console.log('🎯 Starting single hotel scrape test...\n');

    // Test the scraper
    const startTime = Date.now();
    const priceData = await scraper.scrapePriceChart(hotelDuPalais);
    const endTime = Date.now();

    console.log('\n📊 SCRAPING RESULTS:');
    console.log(`⏱️  Time taken: ${endTime - startTime}ms`);
    console.log(`💰 Price: €${priceData.currentPrice}`);
    console.log(`💱 Currency: ${priceData.currency}`);
    console.log(`📅 Last Updated: ${priceData.lastUpdated}`);
    console.log(`🔗 Source: ${priceData.source}`);
    console.log(`🎯 Confidence: ${(priceData.confidence * 100).toFixed(1)}%`);

    if (priceData.source === 'Google Hotels') {
      console.log('\n🎉 SUCCESS: Real price data extracted from Google Hotels!');
      console.log('✅ Anti-bot measures are working');
    } else {
      console.log('\n⚠️  FALLBACK: Using simulated data');
      console.log('ℹ️  This is expected if Google blocks the scraper');
    }

    await scraper.close();
    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSingleHotel().catch(console.error); 