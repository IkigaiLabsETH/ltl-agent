import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '@elizaos/core';
import { CuratedHotel } from './TravelDataService';

export interface PriceData {
  hotelId: string;
  hotelName: string;
  currentPrice: number;
  averagePrice: number;
  priceHistory: {
    date: string;
    price: number;
  }[];
  lastUpdated: Date;
  confidence: number;
}

export interface TrendData {
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  averagePrice: number;
  priceVariation: number;
  dataPoints: number;
}

export interface RateOpportunity {
  hotelId: string;
  hotelName: string;
  perfectDate: string;
  currentRate: number;
  averageRate: number;
  savingsPercentage: number;
  confidenceScore: number;
  reasons: string[];
  urgency: 'high' | 'medium' | 'low';
}

export class GoogleHotelsScraper {
  private browser: Browser | null = null;
  private readonly USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private readonly DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.browser = null;
  }

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      logger.info('GoogleHotelsScraper initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize GoogleHotelsScraper:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapePriceChart(hotel: CuratedHotel): Promise<PriceData> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    try {
      await page.setUserAgent(this.USER_AGENT);
      await page.setViewport({ width: 1920, height: 1080 });

      // Construct Google Hotels URL for the specific hotel
      const googleHotelsUrl = this.constructGoogleHotelsUrl(hotel);
      
      logger.info(`Scraping price data for ${hotel.name} from ${googleHotelsUrl}`);

      await page.goto(googleHotelsUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for price elements to load
      await page.waitForSelector('[data-price]', { timeout: 10000 }).catch(() => {
        logger.warn(`Price elements not found for ${hotel.name}`);
      });

      // Extract price data
      const priceData = await this.extractPriceData(page, hotel);
      
      // Add delay between requests
      await this.delay(this.DELAY_BETWEEN_REQUESTS);

      return priceData;
    } catch (error) {
      logger.error(`Error scraping price data for ${hotel.name}:`, error);
      // Return fallback data
      return this.generateFallbackPriceData(hotel);
    } finally {
      await page.close();
    }
  }

  private constructGoogleHotelsUrl(hotel: CuratedHotel): string {
    // Construct a Google Hotels search URL for the specific hotel
    const hotelName = encodeURIComponent(hotel.name);
    const city = encodeURIComponent(hotel.city);
    
    // Base URL for Google Hotels
    return `https://www.google.com/travel/hotels?q=${hotelName}%20${city}&hl=en`;
  }

  private async extractPriceData(page: Page, hotel: CuratedHotel): Promise<PriceData> {
    try {
      // Extract current prices from the page
      const currentPrices = await page.evaluate(() => {
        const priceElements = document.querySelectorAll('[data-price], .price, .rate');
        const prices: number[] = [];
        
        priceElements.forEach(element => {
          const priceText = element.textContent?.replace(/[^\d.,]/g, '');
          if (priceText) {
            const price = parseFloat(priceText.replace(',', '.'));
            if (!isNaN(price) && price > 0) {
              prices.push(price);
            }
          }
        });
        
        return prices;
      });

      // Extract historical price data if available
      const priceHistory = await this.extractHistoricalTrends(page);

      // Calculate average price
      const currentPrice = currentPrices.length > 0 ? Math.min(...currentPrices) : hotel.priceRange.min;
      const averagePrice = currentPrices.length > 0 
        ? currentPrices.reduce((sum, price) => sum + price, 0) / currentPrices.length
        : hotel.priceRange.min;

      return {
        hotelId: hotel.hotelId,
        hotelName: hotel.name,
        currentPrice,
        averagePrice,
        priceHistory,
        lastUpdated: new Date(),
        confidence: currentPrices.length > 0 ? 0.8 : 0.3
      };
    } catch (error) {
      logger.error(`Error extracting price data for ${hotel.name}:`, error);
      return this.generateFallbackPriceData(hotel);
    }
  }

  private async extractHistoricalTrends(page: Page): Promise<{ date: string; price: number }[]> {
    try {
      // Look for price charts or historical data
      const historicalData = await page.evaluate(() => {
        // This is a simplified extraction - in practice, you'd need to identify
        // the specific elements containing historical price data
        const chartElements = document.querySelectorAll('.price-chart, .trend-chart, [data-historical]');
        const data: { date: string; price: number }[] = [];
        
        // For now, return empty array - this would be enhanced based on actual page structure
        return data;
      });

      return historicalData;
    } catch (error) {
      logger.warn('Could not extract historical trends:', error);
      return [];
    }
  }

  private generateFallbackPriceData(hotel: CuratedHotel): PriceData {
    // Generate fallback data when scraping fails
    const currentPrice = hotel.priceRange.min + Math.random() * (hotel.priceRange.max - hotel.priceRange.min);
    const averagePrice = (hotel.priceRange.min + hotel.priceRange.max) / 2;

    return {
      hotelId: hotel.hotelId,
      hotelName: hotel.name,
      currentPrice: Math.round(currentPrice),
      averagePrice: Math.round(averagePrice),
      priceHistory: [],
      lastUpdated: new Date(),
      confidence: 0.1 // Low confidence for fallback data
    };
  }

  async detectBelowAverageRates(priceData: PriceData[]): Promise<RateOpportunity[]> {
    const opportunities: RateOpportunity[] = [];

    for (const data of priceData) {
      if (data.confidence < 0.5) continue; // Skip low-confidence data

      const savingsPercentage = ((data.averagePrice - data.currentPrice) / data.averagePrice) * 100;
      
      if (savingsPercentage >= 10) { // 10% or more savings
        const urgency = this.calculateUrgency(savingsPercentage, data.confidence);
        const reasons = this.generateReasons(savingsPercentage, data);

        opportunities.push({
          hotelId: data.hotelId,
          hotelName: data.hotelName,
          perfectDate: new Date().toISOString().split('T')[0], // Today's date
          currentRate: data.currentPrice,
          averageRate: data.averagePrice,
          savingsPercentage,
          confidenceScore: data.confidence,
          reasons,
          urgency
        });
      }
    }

    // Sort by savings percentage (highest first)
    return opportunities.sort((a, b) => b.savingsPercentage - a.savingsPercentage);
  }

  private calculateUrgency(savingsPercentage: number, confidence: number): 'high' | 'medium' | 'low' {
    if (savingsPercentage >= 20 && confidence >= 0.7) return 'high';
    if (savingsPercentage >= 15 && confidence >= 0.5) return 'medium';
    return 'low';
  }

  private generateReasons(savingsPercentage: number, data: PriceData): string[] {
    const reasons: string[] = [];
    
    if (savingsPercentage >= 20) {
      reasons.push('Exceptional value - 20%+ below average');
    } else if (savingsPercentage >= 15) {
      reasons.push('Great value - 15%+ below average');
    } else {
      reasons.push('Good value - 10%+ below average');
    }

    if (data.confidence >= 0.8) {
      reasons.push('High confidence data');
    } else if (data.confidence >= 0.5) {
      reasons.push('Moderate confidence data');
    }

    return reasons;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeAllHotels(hotels: CuratedHotel[]): Promise<PriceData[]> {
    const priceData: PriceData[] = [];
    
    for (const hotel of hotels) {
      try {
        const data = await this.scrapePriceChart(hotel);
        priceData.push(data);
        
        // Add delay between hotels to avoid rate limiting
        await this.delay(this.DELAY_BETWEEN_REQUESTS);
      } catch (error) {
        logger.error(`Failed to scrape ${hotel.name}:`, error);
        // Add fallback data
        priceData.push(this.generateFallbackPriceData(hotel));
      }
    }

    return priceData;
  }
} 