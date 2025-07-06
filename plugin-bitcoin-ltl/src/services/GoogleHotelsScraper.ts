import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';
import { logger } from '@elizaos/core';
import type { PriceData, RateOpportunity } from '../types';
import type { CuratedHotel } from './TravelDataService';

// Apply stealth plugin
puppeteer.use(StealthPlugin());

// Apply user preferences plugin to set realistic browser preferences
puppeteer.use(
  UserPreferencesPlugin({
    userPrefs: {
      profile: {
        content_settings: {
          exceptions: {
            images: {
              '*,*': {
                setting: 1
              }
            }
          }
        }
      }
    }
  })
);

export class GoogleHotelsScraper {
  private browser: any = null;
  private readonly USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  private readonly PRICE_SELECTORS = [
    '.qQOQpe.prxS3d', // Primary selector from user inspection
    '.B5rJxb', // Common Google Hotels price class
    '.YMlIz', // Alternative price class
    '[data-price]', // Data attribute selector
    '.price', // Generic price class
    '.hotel-price', // Hotel-specific price class
    'span[aria-label*="price"]', // Aria label containing price
    'span[aria-label*="€"]', // Euro symbol in aria label
    'span[aria-label*="$"]', // Dollar symbol in aria label
    '.prxS3d', // Partial class match
    '.qQOQpe' // Partial class match
  ];

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
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-javascript',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--window-size=1920,1080',
          '--user-agent=' + this.getRandomUserAgent()
        ],
        timeout: 30000
      });

      logger.info('GoogleHotelsScraper initialized successfully with anti-bot measures');
    } catch (error) {
      logger.error('Failed to initialize GoogleHotelsScraper:', error);
      throw error;
    }
  }

  private getRandomUserAgent(): string {
    return this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
  }

  private async handleConsentPage(page: any): Promise<boolean> {
    try {
      // Wait for potential consent page elements
      const consentSelectors = [
        'button[aria-label*="Accept"]',
        'button[aria-label*="Accept all"]',
        'button:contains("Accept")',
        'button:contains("Accept all")',
        'button[data-identifier*="accept"]',
        'button[data-identifier*="consent"]',
        '#L2AGLb', // Google consent button ID
        'button[aria-label*="I agree"]',
        'button:contains("I agree")',
        'button[data-identifier*="agree"]'
      ];

      for (const selector of consentSelectors) {
        try {
          const consentButton = await page.$(selector);
          if (consentButton) {
            logger.info(`Found consent button with selector: ${selector}`);
            await consentButton.click();
            await page.waitForTimeout(2000);
            return true;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Try clicking by text content
      const buttons = await page.$$('button');
      for (const button of buttons) {
        try {
          const text = await button.evaluate((el: any) => el.textContent?.toLowerCase());
          if (text && (text.includes('accept') || text.includes('agree') || text.includes('continue'))) {
            logger.info(`Found consent button by text: ${text}`);
            await button.click();
            await page.waitForTimeout(2000);
            return true;
          }
        } catch (e) {
          // Continue to next button
        }
      }

      return false;
    } catch (error) {
      logger.warn('Error handling consent page:', error);
      return false;
    }
  }

  private async waitForPageLoad(page: any, maxWaitTime: number = 10000): Promise<void> {
    try {
      await page.waitForFunction(
        () => document.readyState === 'complete',
        { timeout: maxWaitTime }
      );
      await page.waitForTimeout(1000); // Additional wait for dynamic content
    } catch (error) {
      logger.warn('Page load wait timeout, continuing anyway');
    }
  }

  private async extractPriceData(page: any, hotelName: string): Promise<PriceData | null> {
    try {
      // Wait for page to be fully loaded
      await this.waitForPageLoad(page);

      // Try multiple selectors for price extraction
      for (const selector of this.PRICE_SELECTORS) {
        try {
          logger.info(`Trying price selector: ${selector}`);
          
          // Wait for selector with shorter timeout
          await page.waitForSelector(selector, { timeout: 5000 });
          
          // Extract price text
          const priceText = await page.$eval(selector, (el: any) => {
            const text = el.textContent?.trim();
            return text;
          });

          if (priceText) {
            logger.info(`Found price with selector ${selector}: ${priceText}`);
            
            // Parse price (remove currency symbols, commas, etc.)
            const cleanPrice = priceText.replace(/[^\d,.]/g, '').replace(',', '.');
            const price = parseFloat(cleanPrice);
            
            if (!isNaN(price) && price > 0) {
              return {
                currentPrice: price,
                currency: 'EUR',
                lastUpdated: new Date().toISOString(),
                source: 'Google Hotels',
                confidence: 0.8
              };
            }
          }
        } catch (e) {
          logger.debug(`Selector ${selector} failed:`, e.message);
          continue;
        }
      }

      // If no price found, try to extract from page content
      logger.warn(`No price found with any selector for ${hotelName}`);
      
      // Get page title and URL for debugging
      const pageTitle = await page.title();
      const pageUrl = page.url();
      
      logger.info(`Page title: ${pageTitle}`);
      logger.info(`Page URL: ${pageUrl}`);
      
      // Check if we're on a consent page
      if (pageUrl.includes('consent.google.com') || pageTitle.toLowerCase().includes('consent')) {
        logger.warn('Still on consent page, attempting to handle...');
        const handled = await this.handleConsentPage(page);
        if (handled) {
          // Retry price extraction after handling consent
          return await this.extractPriceData(page, hotelName);
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error extracting price data for ${hotelName}:`, error);
      return null;
    }
  }

  async scrapePriceChart(hotel: CuratedHotel): Promise<PriceData> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    try {
      // Set realistic viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(this.getRandomUserAgent());

      // Set additional headers to appear more human-like
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      // Construct Google Hotels URL for the specific hotel
      const googleHotelsUrl = this.constructGoogleHotelsUrl(hotel);
      
      logger.info(`Scraping price data for ${hotel.name} from ${googleHotelsUrl}`);

      // Navigate to the page
      await page.goto(googleHotelsUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Handle consent page if present
      const consentHandled = await this.handleConsentPage(page);
      if (consentHandled) {
        logger.info('Consent page handled successfully');
        // Wait a bit more after handling consent
        await page.waitForTimeout(3000);
      }

      // Extract price data
      const priceData = await this.extractPriceData(page, hotel.name);
      
      if (priceData) {
        logger.info(`Successfully extracted price data for ${hotel.name}: €${priceData.currentPrice}`);
        return priceData;
      } else {
        logger.warn(`Failed to extract price data for ${hotel.name}, using fallback`);
        return this.generateFallbackPriceData(hotel);
      }

    } catch (error) {
      logger.error(`Error scraping ${hotel.name}:`, error);
      return this.generateFallbackPriceData(hotel);
    } finally {
      await page.close();
    }
  }

  private constructGoogleHotelsUrl(hotel: CuratedHotel): string {
    const hotelName = encodeURIComponent(hotel.name);
    const location = encodeURIComponent(hotel.location.displayName);
    return `https://www.google.com/travel/hotels?q=${hotelName}%20${location}&hl=en`;
  }

  private generateFallbackPriceData(hotel: CuratedHotel): PriceData {
    // Generate realistic fallback data based on hotel category
    const basePrice = hotel.category === 'luxury' ? 400 : hotel.category === 'boutique' ? 250 : 150;
    const variation = Math.random() * 0.3 - 0.15; // ±15% variation
    const price = Math.round(basePrice * (1 + variation));
    
    return {
      currentPrice: price,
      currency: 'EUR',
      lastUpdated: new Date().toISOString(),
      source: 'Fallback Data',
      confidence: 0.3
    };
  }

  // Additional methods required by TravelDataService
  async scrapeAllHotels(hotels: CuratedHotel[]): Promise<PriceData[]> {
    const results: PriceData[] = [];
    
    for (const hotel of hotels) {
      try {
        // Add random delay between requests to avoid detection
        const delay = Math.random() * 2000 + 1000; // 1-3 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const priceData = await this.scrapePriceChart(hotel);
        results.push(priceData);
      } catch (error) {
        logger.error(`Error scraping ${hotel.name}:`, error);
        // Add fallback data for failed scrapes
        results.push(this.generateFallbackPriceData(hotel));
      }
    }
    
    return results;
  }

  async detectBelowAverageRates(priceData: PriceData[]): Promise<RateOpportunity[]> {
    const opportunities: RateOpportunity[] = [];
    
    // Simple algorithm to detect below-average rates
    const averagePrice = priceData.reduce((sum, data) => sum + data.currentPrice, 0) / priceData.length;
    
    for (const data of priceData) {
      const savingsPercentage = ((averagePrice - data.currentPrice) / averagePrice) * 100;
      
      if (savingsPercentage >= 10) { // 10% or more savings
        opportunities.push({
          hotelId: 'unknown', // Would need hotel ID mapping
          hotelName: 'Unknown Hotel', // Would need hotel name mapping
          date: new Date().toISOString().split('T')[0],
          currentPrice: data.currentPrice,
          averagePrice: averagePrice,
          savingsPercentage: savingsPercentage,
          confidence: data.confidence
        });
      }
    }
    
    return opportunities;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
} 