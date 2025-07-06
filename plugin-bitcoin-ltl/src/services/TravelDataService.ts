import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { GoogleHotelsScraper } from "./GoogleHotelsScraper";
import { SeasonalRateService } from "./SeasonalRateService";

// Travel and hotel booking interfaces
export interface HotelLocation {
  city: string;
  displayName: string;
  description: string;
  lat: number;
  lon: number;
  country: string;
  timezone: string;
}

export interface CuratedHotel {
  hotelId: string;
  name: string;
  address: string;
  city: string;
  location: HotelLocation;
  category: "luxury" | "boutique" | "resort" | "palace";
  starRating: number;
  description: string;
  amenities: string[];
  bookingUrl?: string;
  averageRating?: number;
  reviewCount?: number;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface HotelRateData {
  hotelId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  rateId: string;
  roomType: string;
  rateType: "standard" | "flexible" | "non-refundable";
  totalPrice: number;
  basePrice: number;
  taxes: number;
  fees: number;
  currency: string;
  occupancy: {
    adults: number;
    children: number;
  };
  cancellationPolicy: string;
  availability: boolean;
  availableRooms: number;
  lastUpdated: Date;
}

export interface DateRangeQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  lengthOfStay: number; // nights
  flexibility: number; // +/- days
}

export interface OptimalBookingWindow {
  hotelId: string;
  hotelName: string;
  city: string;
  bestDates: {
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    savings: number;
    savingsPercentage: number;
  }[];
  seasonalAnalysis: {
    season: "high" | "mid" | "low";
    averagePrice: number;
    priceRange: { min: number; max: number };
    demandLevel: "very-low" | "low" | "moderate" | "high" | "very-high";
  };
  recommendations: {
    bestValue: string; // date
    bestAvailability: string; // date
    avoidDates: string[]; // high price dates
  };
  lastAnalyzed: Date;
}

export interface SeasonalPricePattern {
  month: number;
  monthName: string;
  averagePrice: number;
  priceVariation: number;
  occupancyRate: number;
  events: string[]; // local events affecting prices
  recommendation: "excellent" | "good" | "fair" | "avoid";
}

export interface TravelInsights {
  cityAnalysis: {
    city: string;
    bestMonths: number[];
    worstMonths: number[];
    averageSavings: number;
    optimalStayLength: number;
  }[];
  pricePatterns: SeasonalPricePattern[];
  marketTrends: {
    trend: "increasing" | "decreasing" | "stable";
    confidence: number;
    timeframe: string;
  };
  lastUpdated: Date;
}

export interface ComprehensiveTravelData {
  hotels: CuratedHotel[];
  currentRates: HotelRateData[];
  optimalBookingWindows: OptimalBookingWindow[];
  travelInsights: TravelInsights;
  lastUpdated: Date;
}

export interface TravelDataCache {
  data: ComprehensiveTravelData;
  timestamp: number;
}

export interface PerfectDayOpportunity {
  hotelId: string;
  hotelName: string;
  perfectDate: string;
  currentRate: number;
  averageRate: number;
  savingsPercentage: number;
  confidenceScore: number;
  reasons: string[];
  urgency: "high" | "medium" | "low";
}

// Enhanced interfaces for hybrid intelligence
export interface MarketInsight {
  type: "trend" | "opportunity" | "warning" | "recommendation";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  timeframe: string;
  confidence: number;
  dataSource: "real-time" | "seasonal" | "hybrid";
}

export interface DealAlert {
  hotelId: string;
  hotelName: string;
  dealType: "perfect-day" | "seasonal" | "flash" | "last-minute";
  currentRate: number;
  originalRate: number;
  savingsPercentage: number;
  validUntil: string;
  urgency: "high" | "medium" | "low";
  confidence: number;
  reasons: string[];
  bookingRecommendation: string;
}

export interface EnhancedTravelData {
  perfectDays: PerfectDayOpportunity[];
  weeklySuggestions: any[]; // Using existing WeeklySuggestion type from SeasonalRateService
  currentDeals: DealAlert[];
  marketInsights: MarketInsight[];
  lastUpdated: Date;
}

/**
 * TravelDataService
 *
 * Provides hotel rate intelligence, perfect day detection, and booking optimization.
 *
 * Integrates with Google Hotels scraping (primary) and optionally Booking.com API (if credentials are provided).
 *
 * If Booking.com API credentials are missing, all Booking.com logic is skipped and the system uses Google Hotels and/or simulated data.
 *
 * Booking.com integration is fully optional and not required for core functionality.
 */
export class TravelDataService extends BaseDataService {
  static serviceType = "travel-data";
  capabilityDescription =
    "Provides smart hotel booking optimization and travel insights for European luxury destinations";

  protected serviceName = "TravelDataService";
  protected updateInterval = 6 * 60 * 60 * 1000; // 6 hours - hotel rates don't change as frequently

  private travelDataCache: TravelDataCache | null = null;
  private readonly TRAVEL_CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
  private googleHotelsScraper: GoogleHotelsScraper | null = null;
  private seasonalRateService: SeasonalRateService;

  // European luxury cities for lifestyle travel
  private readonly luxuryLocations: HotelLocation[] = [
    {
      city: "biarritz",
      displayName: "Biarritz",
      description:
        "French Basque coast, surfing paradise & luxury seaside resort",
      lat: 43.4833,
      lon: -1.5586,
      country: "France",
      timezone: "Europe/Paris",
    },
    {
      city: "bordeaux",
      displayName: "Bordeaux",
      description: "Wine capital, UNESCO heritage & luxury gastronomy",
      lat: 44.8378,
      lon: -0.5792,
      country: "France",
      timezone: "Europe/Paris",
    },
    {
      city: "monaco",
      displayName: "Monaco",
      description: "Tax haven, Mediterranean luxury & Grand Prix glamour",
      lat: 43.7384,
      lon: 7.4246,
      country: "Monaco",
      timezone: "Europe/Monaco",
    },
  ];

  // Curated luxury hotels in target cities
  private readonly curatedHotels: CuratedHotel[] = [
    // Biarritz Luxury Hotels
    {
      hotelId: "biarritz_palace",
      name: "Hôtel du Palais",
      address: "1 Avenue de l'Impératrice, 64200 Biarritz",
      city: "biarritz",
      location: this.luxuryLocations[0],
      category: "palace",
      starRating: 5,
      description:
        "Imperial palace hotel with ocean views, Napoleon III heritage",
      amenities: [
        "spa",
        "ocean-view",
        "michelin-dining",
        "golf",
        "private-beach",
      ],
      priceRange: { min: 400, max: 2000, currency: "EUR" },
    },
    {
      hotelId: "biarritz_regina",
      name: "Hôtel Villa Eugénie",
      address: "Rue Broquedis, 64200 Biarritz",
      city: "biarritz",
      location: this.luxuryLocations[0],
      category: "boutique",
      starRating: 4,
      description: "Boutique elegance near Grande Plage, Art Deco charm",
      amenities: ["boutique", "beach-access", "spa", "fine-dining"],
      priceRange: { min: 200, max: 800, currency: "EUR" },
    },
    {
      hotelId: "biarritz_sofitel",
      name: "Sofitel Biarritz Le Miramar Thalassa Sea & Spa",
      address: "13 Rue Louison Bobet, 64200 Biarritz",
      city: "biarritz",
      location: this.luxuryLocations[0],
      category: "luxury",
      starRating: 5,
      description: "Luxury thalassotherapy resort with panoramic ocean views",
      amenities: [
        "thalasso-spa",
        "ocean-view",
        "fine-dining",
        "wellness",
        "private-beach",
      ],
      priceRange: { min: 300, max: 1500, currency: "EUR" },
    },
    {
      hotelId: "biarritz_beaumanoir",
      name: "Beaumanoir Small Luxury Hotels",
      address: "10 Avenue Carnot, 64200 Biarritz",
      city: "biarritz",
      location: this.luxuryLocations[0],
      category: "boutique",
      starRating: 4,
      description: "Art Deco boutique hotel near casino and beach",
      amenities: ["boutique", "art-deco", "casino-proximity", "beach-access"],
      priceRange: { min: 180, max: 600, currency: "EUR" },
    },

    // Bordeaux Luxury Hotels
    {
      hotelId: "bordeaux_intercontinental",
      name: "InterContinental Bordeaux - Le Grand Hotel",
      address: "2-5 Place de la Comédie, 33000 Bordeaux",
      city: "bordeaux",
      location: this.luxuryLocations[1],
      category: "luxury",
      starRating: 5,
      description:
        "Historic grand hotel in city center, luxury shopping district",
      amenities: [
        "city-center",
        "spa",
        "fine-dining",
        "shopping",
        "wine-cellar",
      ],
      priceRange: { min: 300, max: 1200, currency: "EUR" },
    },
    {
      hotelId: "bordeaux_burdigala",
      name: "Burdigala Hotel",
      address: "115 Rue Georges Bonnac, 33000 Bordeaux",
      city: "bordeaux",
      location: this.luxuryLocations[1],
      category: "boutique",
      starRating: 4,
      description:
        "Contemporary luxury near Jardin Public, wine country gateway",
      amenities: ["contemporary", "wine-focus", "spa", "gourmet-dining"],
      priceRange: { min: 180, max: 600, currency: "EUR" },
    },
    {
      hotelId: "bordeaux_la_grand_maison",
      name: "La Grand'Maison Hotel & Restaurant",
      address: "5 Rue Labottière, 33000 Bordeaux",
      city: "bordeaux",
      location: this.luxuryLocations[1],
      category: "luxury",
      starRating: 5,
      description:
        "Luxury hotel with Michelin-starred restaurant, wine expertise",
      amenities: ["michelin-dining", "wine-expertise", "luxury", "gourmet"],
      priceRange: { min: 400, max: 1800, currency: "EUR" },
    },

    // Monaco Luxury Hotels
    {
      hotelId: "monaco_hermitage",
      name: "Hôtel Hermitage Monte-Carlo",
      address: "Square Beaumarchais, 98000 Monaco",
      city: "monaco",
      location: this.luxuryLocations[2],
      category: "palace",
      starRating: 5,
      description:
        "Belle Époque palace with Mediterranean gardens, casino proximity",
      amenities: [
        "palace",
        "mediterranean-view",
        "casino",
        "spa",
        "michelin-dining",
      ],
      priceRange: { min: 500, max: 3000, currency: "EUR" },
    },
    {
      hotelId: "monaco_metropole",
      name: "Hotel Metropole Monte-Carlo",
      address: "4 Avenue de la Madone, 98000 Monaco",
      city: "monaco",
      location: this.luxuryLocations[2],
      category: "luxury",
      starRating: 5,
      description: "Luxury resort with spa, two minutes from casino",
      amenities: [
        "luxury-resort",
        "spa",
        "casino-proximity",
        "fine-dining",
        "shopping",
      ],
      priceRange: { min: 400, max: 2500, currency: "EUR" },
    },
    {
      hotelId: "monaco_monte_carlo_bay",
      name: "Monte-Carlo Bay Hotel & Resort",
      address: "40 Avenue Princesse Grace, 98000 Monaco",
      city: "monaco",
      location: this.luxuryLocations[2],
      category: "resort",
      starRating: 4,
      description: "Modern resort with lagoon, spa, and Mediterranean views",
      amenities: [
        "resort",
        "lagoon",
        "spa",
        "mediterranean-view",
        "family-friendly",
      ],
      priceRange: { min: 300, max: 1800, currency: "EUR" },
    },
    {
      hotelId: "monaco_port_palace",
      name: "Port Palace",
      address: "7 Avenue Président J.F. Kennedy, 98000 Monaco",
      city: "monaco",
      location: this.luxuryLocations[2],
      category: "luxury",
      starRating: 4,
      description: "Contemporary luxury overlooking Port Hercules marina",
      amenities: ["marina-view", "contemporary", "luxury", "port-proximity"],
      priceRange: { min: 280, max: 1500, currency: "EUR" },
    },
  ];

  // Seasonal events affecting hotel prices
  private readonly seasonalEvents = {
    biarritz: [
      { month: 7, event: "Biarritz Surf Festival", impact: "high" },
      { month: 8, event: "Summer Peak Season", impact: "very-high" },
      { month: 9, event: "Biarritz Film Festival", impact: "medium" },
      { month: 12, event: "Christmas/New Year", impact: "high" },
    ],
    bordeaux: [
      { month: 6, event: "Bordeaux Wine Festival", impact: "very-high" },
      { month: 9, event: "Harvest Season", impact: "high" },
      { month: 10, event: "Bordeaux International Fair", impact: "medium" },
      { month: 12, event: "Christmas Markets", impact: "high" },
    ],
    monaco: [
      { month: 5, event: "Monaco Grand Prix", impact: "extreme" },
      { month: 7, event: "Monaco Red Cross Ball", impact: "high" },
      { month: 8, event: "Summer Season Peak", impact: "very-high" },
      { month: 12, event: "New Year Celebrations", impact: "very-high" },
    ],
  };

  constructor(runtime: IAgentRuntime) {
    super(runtime, "travelData");
    this.validateConfiguration();
    this.seasonalRateService = new SeasonalRateService();
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("TravelDataService starting...");
    const service = new TravelDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("TravelDataService stopping...");
    const service = runtime.getService("travel-data");
    if (service && service.stop) {
      await service.stop();
    }
  }

  async init() {
    logger.info("TravelDataService initialized");
    await this.updateData();
  }

  private validateConfiguration(): void {
    const bookingApiKey = this.runtime.getSetting("BOOKING_API_KEY");
    const bookingApiSecret = this.runtime.getSetting("BOOKING_API_SECRET");

    if (!bookingApiKey || !bookingApiSecret) {
      this.logWarning(
        "Booking.com API credentials not configured (optional) – using Google Hotels and/or simulated data. This is not an error."
      );
    }
  }

  async start(): Promise<void> {
    this.logInfo("TravelDataService starting...");
    this.validateConfiguration();
    await this.updateData();
    this.logInfo("TravelDataService started successfully");
  }

  async updateData(): Promise<void> {
    try {
      this.logInfo("Updating comprehensive travel data...");

      // Parallel data fetching for efficiency
      const [currentRates, optimalBookingWindows, travelInsights] =
        await Promise.all([
          this.fetchCurrentHotelRates(),
          this.analyzeOptimalBookingWindows(),
          this.generateTravelInsights(),
        ]);

      const comprehensiveData: ComprehensiveTravelData = {
        hotels: this.curatedHotels,
        currentRates: currentRates || [],
        optimalBookingWindows: optimalBookingWindows || [],
        travelInsights: travelInsights || this.getFallbackTravelInsights(),
        lastUpdated: new Date(),
      };

      this.travelDataCache = {
        data: comprehensiveData,
        timestamp: Date.now(),
      };

      this.logInfo(
        `Travel data updated: ${this.curatedHotels.length} hotels, ${currentRates?.length || 0} rates analyzed`,
      );
    } catch (error) {
      this.logError("Failed to update travel data", error);
      throw error;
    }
  }

  public async forceUpdate(): Promise<void> {
    this.travelDataCache = null;
    await this.updateData();
  }

  async stop(): Promise<void> {
    this.logInfo("TravelDataService stopping...");
    // Clear cache and clean up any resources
    this.travelDataCache = null;
  }

  private async fetchCurrentHotelRates(): Promise<HotelRateData[]> {
    const bookingApiKey = this.runtime.getSetting("BOOKING_API_KEY");

    if (!bookingApiKey) {
      this.logWarning(
        "Booking.com API key not configured (optional), using Google Hotels and/or simulated data."
      );
      return this.generateSimulatedRates();
    }

    try {
      const rates: HotelRateData[] = [];

      // Query rates for next 3 months with flexible dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      for (const hotel of this.curatedHotels) {
        const hotelRates = await this.fetchHotelRatesForDateRange(
          hotel,
          startDate,
          endDate,
        );
        rates.push(...hotelRates);

        // Rate limiting to avoid API throttling
        await this.delay(1000);
      }

      return rates;
    } catch (error) {
      this.logError("Error fetching hotel rates", error);
      return this.generateSimulatedRates();
    }
  }

  private async fetchHotelRatesForDateRange(
    hotel: CuratedHotel,
    startDate: Date,
    endDate: Date,
  ): Promise<HotelRateData[]> {
    const rates: HotelRateData[] = [];

    // Booking.com ARI API integration (optional)
    const bookingApiKey = this.runtime.getSetting("BOOKING_API_KEY");
    const bookingApiSecret = this.runtime.getSetting("BOOKING_API_SECRET");

    if (!bookingApiKey || !bookingApiSecret) {
      this.logWarning(
        `Booking.com API credentials not configured (optional) for hotel ${hotel.name} – skipping Booking.com rates.`
      );
      return [];
    }

    try {
      // Generate flexible date combinations (3-7 night stays)
      const stayLengths = [3, 4, 5, 7];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        for (const stayLength of stayLengths) {
          const checkIn = new Date(currentDate);
          const checkOut = new Date(currentDate);
          checkOut.setDate(checkOut.getDate() + stayLength);

          // Skip if checkout is beyond our end date
          if (checkOut > endDate) continue;

          // Query Booking.com API for availability and rates
          const rateData = await this.queryBookingComAPI(
            hotel,
            checkIn,
            checkOut,
          );

          if (rateData) {
            rates.push(rateData);
          }

          // Rate limiting between requests
          await this.delay(200);
        }

        // Move to next week to avoid too many requests
        currentDate.setDate(currentDate.getDate() + 7);
      }

      return rates;
    } catch (error) {
      this.logError(`Error fetching rates for ${hotel.name}`, error);
      return [];
    }
  }

  private async queryBookingComAPI(
    hotel: CuratedHotel,
    checkIn: Date,
    checkOut: Date,
  ): Promise<HotelRateData | null> {
    const bookingApiKey = this.runtime.getSetting("BOOKING_API_KEY");
    const bookingApiSecret = this.runtime.getSetting("BOOKING_API_SECRET");

    if (!bookingApiKey || !bookingApiSecret) {
      this.logWarning(
        `Booking.com API credentials not configured (optional) for hotel ${hotel.name} – skipping Booking.com API call.`
      );
      return null;
    }

    try {
      // Booking.com ARI API endpoint
      const apiUrl = "https://supply-xml.booking.com/api/ari";

      const requestBody = {
        hotel_id: hotel.hotelId,
        checkin: checkIn.toISOString().split("T")[0],
        checkout: checkOut.toISOString().split("T")[0],
        adults: 2,
        children: 0,
        currency: "EUR",
        language: "en",
      };

      const authHeader = this.generateBookingAuthHeader(
        bookingApiKey,
        bookingApiSecret,
      );

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          "User-Agent": "LiveTheLifeTV-TravelBot/1.0",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        if (response.status === 429) {
          this.logWarning(`Rate limited for ${hotel.name}, backing off`);
          await this.delay(5000);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Parse Booking.com response and convert to our format
      return this.parseBookingComResponse(data, hotel, checkIn, checkOut);
    } catch (error) {
      this.logError(`Error querying Booking.com API for ${hotel.name}`, error);
      return null;
    }
  }

  private generateBookingAuthHeader(apiKey: string, apiSecret: string): string {
    // Generate proper authentication header for Booking.com API
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.random().toString(36).substring(2, 15);

    // Create signature (simplified - real implementation would use proper OAuth)
    const signature = Buffer.from(
      `${apiKey}:${apiSecret}:${timestamp}:${nonce}`,
    ).toString("base64");

    return `Bearer ${signature}`;
  }

  private parseBookingComResponse(
    data: any,
    hotel: CuratedHotel,
    checkIn: Date,
    checkOut: Date,
  ): HotelRateData | null {
    if (!data || !data.rates || data.rates.length === 0) {
      return null;
    }

    const bestRate = data.rates[0]; // Usually sorted by price

    return {
      hotelId: hotel.hotelId,
      hotelName: hotel.name,
      checkIn: checkIn.toISOString().split("T")[0],
      checkOut: checkOut.toISOString().split("T")[0],
      rateId: bestRate.id || "standard",
      roomType: bestRate.room_type || "Standard Room",
      rateType: bestRate.cancellation_policy ? "flexible" : "non-refundable",
      totalPrice: parseFloat(bestRate.total_price || bestRate.price || 0),
      basePrice: parseFloat(bestRate.base_price || bestRate.price || 0),
      taxes: parseFloat(bestRate.taxes || 0),
      fees: parseFloat(bestRate.fees || 0),
      currency: bestRate.currency || "EUR",
      occupancy: {
        adults: 2,
        children: 0,
      },
      cancellationPolicy: bestRate.cancellation_policy || "Non-refundable",
      availability: bestRate.available !== false,
      availableRooms: parseInt(bestRate.available_rooms || "5"),
      lastUpdated: new Date(),
    };
  }

  private generateSimulatedRates(): HotelRateData[] {
    const rates: HotelRateData[] = [];
    const startDate = new Date();

    this.curatedHotels.forEach((hotel) => {
      // Generate 30 days of simulated rates
      for (let i = 0; i < 30; i++) {
        const checkIn = new Date(startDate);
        checkIn.setDate(checkIn.getDate() + i);

        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 3); // 3-night stay

        // Apply seasonal pricing logic
        const seasonalMultiplier = this.getSeasonalPriceMultiplier(
          hotel.city,
          checkIn.getMonth() + 1,
        );
        const basePrice = (hotel.priceRange.min + hotel.priceRange.max) / 2;
        const totalPrice = basePrice * seasonalMultiplier;

        rates.push({
          hotelId: hotel.hotelId,
          hotelName: hotel.name,
          checkIn: checkIn.toISOString().split("T")[0],
          checkOut: checkOut.toISOString().split("T")[0],
          rateId: "simulated_standard",
          roomType: "Standard Room",
          rateType: "flexible",
          totalPrice: Math.round(totalPrice),
          basePrice: Math.round(basePrice),
          taxes: Math.round(totalPrice * 0.1),
          fees: Math.round(totalPrice * 0.05),
          currency: "EUR",
          occupancy: { adults: 2, children: 0 },
          cancellationPolicy: "Free cancellation until 24h before arrival",
          availability: true,
          availableRooms: Math.floor(Math.random() * 10) + 1,
          lastUpdated: new Date(),
        });
      }
    });

    return rates;
  }

  private getSeasonalPriceMultiplier(city: string, month: number): number {
    const events =
      this.seasonalEvents[city as keyof typeof this.seasonalEvents] || [];
    const event = events.find((e) => e.month === month);

    if (event) {
      switch (event.impact) {
        case "extreme":
          return 3.5;
        case "very-high":
          return 2.8;
        case "high":
          return 2.2;
        case "medium":
          return 1.5;
        default:
          return 1.0;
      }
    }

    // Base seasonal patterns
    const summerMonths = [6, 7, 8]; // June, July, August
    const shoulderMonths = [4, 5, 9, 10]; // April, May, September, October
    const winterMonths = [11, 12, 1, 2]; // November, December, January, February

    if (summerMonths.includes(month)) return 2.0;
    if (shoulderMonths.includes(month)) return 1.3;
    if (winterMonths.includes(month)) return 0.7;

    return 1.0; // Spring months
  }

  private async analyzeOptimalBookingWindows(): Promise<
    OptimalBookingWindow[]
  > {
    const windows: OptimalBookingWindow[] = [];

    for (const hotel of this.curatedHotels) {
      try {
        const window = await this.analyzeHotelOptimalBooking(hotel);
        if (window) {
          windows.push(window);
        }
      } catch (error) {
        this.logError(
          `Error analyzing optimal booking for ${hotel.name}`,
          error,
        );
      }
    }

    return windows;
  }

  private async analyzeHotelOptimalBooking(
    hotel: CuratedHotel,
  ): Promise<OptimalBookingWindow | null> {
    try {
      // Get current rates for this hotel
      const hotelRates = (this.travelDataCache?.data.currentRates || [])
        .filter((rate) => rate.hotelId === hotel.hotelId)
        .sort((a, b) => a.totalPrice - b.totalPrice);

      if (hotelRates.length === 0) {
        return null;
      }

      const allPrices = hotelRates.map((rate) => rate.totalPrice);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const avgPrice =
        allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;

      // Find best value dates (lowest 25% of prices)
      const bestValueThreshold = minPrice + (avgPrice - minPrice) * 0.5;
      const bestDates = hotelRates
        .filter((rate) => rate.totalPrice <= bestValueThreshold)
        .slice(0, 5)
        .map((rate) => ({
          checkIn: rate.checkIn,
          checkOut: rate.checkOut,
          totalPrice: rate.totalPrice,
          savings: maxPrice - rate.totalPrice,
          savingsPercentage: ((maxPrice - rate.totalPrice) / maxPrice) * 100,
        }));

      // Seasonal analysis
      const currentMonth = new Date().getMonth() + 1;
      const seasonalMultiplier = this.getSeasonalPriceMultiplier(
        hotel.city,
        currentMonth,
      );

      let season: "high" | "mid" | "low" = "mid";
      let demandLevel: "very-low" | "low" | "moderate" | "high" | "very-high" =
        "moderate";

      if (seasonalMultiplier >= 2.5) {
        season = "high";
        demandLevel = "very-high";
      } else if (seasonalMultiplier >= 1.5) {
        season = "mid";
        demandLevel = "high";
      } else if (seasonalMultiplier <= 0.8) {
        season = "low";
        demandLevel = "low";
      }

      // Generate recommendations
      const bestValueDate =
        bestDates.length > 0 ? bestDates[0].checkIn : hotelRates[0].checkIn;
      const bestAvailabilityDate =
        hotelRates
          .filter((rate) => rate.availableRooms > 5)
          .sort((a, b) => b.availableRooms - a.availableRooms)[0]?.checkIn ||
        bestValueDate;

      const highPriceThreshold = avgPrice + (maxPrice - avgPrice) * 0.7;
      const avoidDates = hotelRates
        .filter((rate) => rate.totalPrice >= highPriceThreshold)
        .slice(0, 3)
        .map((rate) => rate.checkIn);

      return {
        hotelId: hotel.hotelId,
        hotelName: hotel.name,
        city: hotel.city,
        bestDates,
        seasonalAnalysis: {
          season,
          averagePrice: avgPrice,
          priceRange: { min: minPrice, max: maxPrice },
          demandLevel,
        },
        recommendations: {
          bestValue: bestValueDate,
          bestAvailability: bestAvailabilityDate,
          avoidDates,
        },
        lastAnalyzed: new Date(),
      };
    } catch (error) {
      this.logError(`Error analyzing optimal booking for ${hotel.name}`, error);
      return null;
    }
  }

  private async generateTravelInsights(): Promise<TravelInsights> {
    const insights: TravelInsights = {
      cityAnalysis: [],
      pricePatterns: [],
      marketTrends: {
        trend: "stable",
        confidence: 0.7,
        timeframe: "next 3 months",
      },
      lastUpdated: new Date(),
    };

    // Analyze each city
    for (const location of this.luxuryLocations) {
      const cityHotels = this.curatedHotels.filter(
        (h) => h.city === location.city,
      );
      const cityRates = (this.travelDataCache?.data.currentRates || []).filter(
        (rate) => cityHotels.some((h) => h.hotelId === rate.hotelId),
      );

      if (cityRates.length > 0) {
        const avgPrice =
          cityRates.reduce((sum, rate) => sum + rate.totalPrice, 0) /
          cityRates.length;
        const minPrice = Math.min(...cityRates.map((r) => r.totalPrice));
        const maxPrice = Math.max(...cityRates.map((r) => r.totalPrice));
        const avgSavings = ((maxPrice - minPrice) / maxPrice) * 100;

        insights.cityAnalysis.push({
          city: location.displayName,
          bestMonths: this.getBestMonthsForCity(location.city),
          worstMonths: this.getWorstMonthsForCity(location.city),
          averageSavings: avgSavings,
          optimalStayLength: this.getOptimalStayLength(cityRates),
        });
      }
    }

    // Generate seasonal price patterns
    for (let month = 1; month <= 12; month++) {
      const monthName = new Date(2024, month - 1, 1).toLocaleString("en", {
        month: "long",
      });
      const avgMultiplier =
        this.luxuryLocations.reduce(
          (sum, loc) => sum + this.getSeasonalPriceMultiplier(loc.city, month),
          0,
        ) / this.luxuryLocations.length;

      const events = this.luxuryLocations
        .map(
          (loc) =>
            this.seasonalEvents[loc.city as keyof typeof this.seasonalEvents] ||
            [],
        )
        .flat()
        .filter((e) => e.month === month);

      insights.pricePatterns.push({
        month,
        monthName,
        averagePrice: avgMultiplier * 500,
        priceVariation: avgMultiplier,
        occupancyRate: this.getEstimatedOccupancyRate(month),
        events: events.map((e) => e.event),
        recommendation: this.getMonthRecommendation(avgMultiplier),
      });
    }

    return insights;
  }

  private getBestMonthsForCity(city: string): number[] {
    const events =
      this.seasonalEvents[city as keyof typeof this.seasonalEvents] || [];
    const highImpactMonths = events
      .filter(
        (e) =>
          e.impact === "high" ||
          e.impact === "very-high" ||
          e.impact === "extreme",
      )
      .map((e) => e.month);

    return [1, 2, 3, 4, 10, 11, 12]
      .filter((month) => !highImpactMonths.includes(month))
      .slice(0, 3);
  }

  private getWorstMonthsForCity(city: string): number[] {
    const events =
      this.seasonalEvents[city as keyof typeof this.seasonalEvents] || [];
    return events
      .filter((e) => e.impact === "very-high" || e.impact === "extreme")
      .map((e) => e.month);
  }

  private getOptimalStayLength(rates: HotelRateData[]): number {
    const stayLengths = rates.map((rate) => {
      const checkIn = new Date(rate.checkIn);
      const checkOut = new Date(rate.checkOut);
      return Math.round(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );
    });

    const avgStayLength =
      stayLengths.reduce((sum, length) => sum + length, 0) / stayLengths.length;
    return Math.round(avgStayLength);
  }

  private getEstimatedOccupancyRate(month: number): number {
    const occupancyRates = {
      1: 0.4,
      2: 0.3,
      3: 0.5,
      4: 0.6,
      5: 0.7,
      6: 0.8,
      7: 0.9,
      8: 0.95,
      9: 0.7,
      10: 0.6,
      11: 0.4,
      12: 0.5,
    };

    return occupancyRates[month as keyof typeof occupancyRates] || 0.6;
  }

  private getMonthRecommendation(
    multiplier: number,
  ): "excellent" | "good" | "fair" | "avoid" {
    if (multiplier <= 0.8) return "excellent";
    if (multiplier <= 1.2) return "good";
    if (multiplier <= 2.0) return "fair";
    return "avoid";
  }

  private getFallbackTravelInsights(): TravelInsights {
    return {
      cityAnalysis: this.luxuryLocations.map((loc) => ({
        city: loc.displayName,
        bestMonths: [2, 3, 4, 10, 11],
        worstMonths: [7, 8],
        averageSavings: 35,
        optimalStayLength: 4,
      })),
      pricePatterns: [],
      marketTrends: {
        trend: "stable",
        confidence: 0.5,
        timeframe: "next 3 months",
      },
      lastUpdated: new Date(),
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Public API methods
  public getTravelData(): ComprehensiveTravelData | null {
    if (
      !this.travelDataCache ||
      !this.isCacheValid(
        this.travelDataCache.timestamp,
        this.TRAVEL_CACHE_DURATION,
      )
    ) {
      return null;
    }
    return this.travelDataCache.data;
  }

  public getCuratedHotels(): CuratedHotel[] {
    return this.curatedHotels;
  }

  public getOptimalBookingWindows(): OptimalBookingWindow[] {
    const data = this.getTravelData();
    return data?.optimalBookingWindows || [];
  }

  public getTravelInsights(): TravelInsights | null {
    const data = this.getTravelData();
    return data?.travelInsights || null;
  }

  public getHotelRatesForCity(city: string): HotelRateData[] {
    const data = this.getTravelData();
    if (!data) return [];

    const cityHotels = this.curatedHotels.filter((h) => h.city === city);
    return data.currentRates.filter((rate) =>
      cityHotels.some((h) => h.hotelId === rate.hotelId),
    );
  }

  protected logInfo(message: string): void {
    logger.info(`[${this.serviceName}] ${message}`);
  }

  protected logWarning(message: string): void {
    logger.warn(`[${this.serviceName}] ${message}`);
  }

  protected logError(message: string, error?: any): void {
    logger.error(`[${this.serviceName}] ${message}`, error);
  }

  // Perfect Day Detection Methods
  public async detectPerfectDays(): Promise<PerfectDayOpportunity[]> {
    try {
      // First, try to get real-time data from Google Hotels scraper
      if (this.googleHotelsScraper) {
        try {
          const priceData = await this.googleHotelsScraper.scrapeAllHotels(this.curatedHotels);
          const opportunities = await this.googleHotelsScraper.detectBelowAverageRates(priceData);
          
          if (opportunities.length > 0) {
            logger.info(`Found ${opportunities.length} real-time perfect day opportunities`);
            return opportunities.map(opp => ({
              hotelId: opp.hotelId,
              hotelName: opp.hotelName,
              perfectDate: opp.date,
              currentRate: opp.currentPrice,
              averageRate: opp.averagePrice,
              savingsPercentage: opp.savingsPercentage,
              confidenceScore: opp.confidence,
              reasons: ['Real-time rate analysis', 'Below average pricing'],
              urgency: opp.savingsPercentage >= 25 ? 'high' : opp.savingsPercentage >= 15 ? 'medium' : 'low'
            }));
          }
        } catch (error) {
          logger.warn('Google Hotels scraping failed, falling back to seasonal data:', error);
        }
      }

      // Fallback to seasonal rate service
      logger.info('Using seasonal rate service for perfect day detection');
      const seasonalOpportunities: PerfectDayOpportunity[] = [];
      
      for (const hotel of this.curatedHotels) {
        const hotelOpportunities = this.seasonalRateService.getPerfectDaysForHotel(hotel.hotelId);
        seasonalOpportunities.push(...hotelOpportunities);
      }

      // Sort by savings percentage and return top opportunities
      return seasonalOpportunities
        .sort((a, b) => b.savingsPercentage - a.savingsPercentage)
        .slice(0, 10); // Return top 10 opportunities

    } catch (error) {
      logger.error('Error detecting perfect days:', error);
      return this.generateFallbackPerfectDays();
    }
  }

  private generateFallbackPerfectDays(): PerfectDayOpportunity[] {
    // Generate fallback perfect day opportunities using existing hotel data
    const fallbackOpportunities: PerfectDayOpportunity[] = [];
    
    // Select a few hotels and generate simulated perfect days
    const selectedHotels = this.curatedHotels.slice(0, 3);
    
    selectedHotels.forEach((hotel, index) => {
      const currentRate = hotel.priceRange.min + Math.random() * (hotel.priceRange.max - hotel.priceRange.min) * 0.8;
      const averageRate = (hotel.priceRange.min + hotel.priceRange.max) / 2;
      const savingsPercentage = ((averageRate - currentRate) / averageRate) * 100;
      
      if (savingsPercentage >= 10) {
        fallbackOpportunities.push({
          hotelId: hotel.hotelId,
          hotelName: hotel.name,
          perfectDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          currentRate: Math.round(currentRate),
          averageRate: Math.round(averageRate),
          savingsPercentage: Math.round(savingsPercentage * 10) / 10,
          confidenceScore: 0.3, // Low confidence for fallback data
          reasons: ['Simulated data - check for actual availability'],
          urgency: savingsPercentage >= 20 ? 'high' : 'medium'
        });
      }
    });

    return fallbackOpportunities.sort((a, b) => b.savingsPercentage - a.savingsPercentage);
  }

  public async getPerfectDayOpportunities(): Promise<PerfectDayOpportunity[]> {
    return this.detectPerfectDays();
  }

  /**
   * Get hybrid perfect days combining real-time and seasonal data
   * Prioritizes real-time data but includes seasonal as backup
   */
  public async getHybridPerfectDays(): Promise<PerfectDayOpportunity[]> {
    try {
      const realTimeOpportunities: PerfectDayOpportunity[] = [];
      const seasonalOpportunities: PerfectDayOpportunity[] = [];

      // Get real-time opportunities from Google Hotels scraper
      if (this.googleHotelsScraper) {
        try {
          const priceData = await this.googleHotelsScraper.scrapeAllHotels(this.curatedHotels);
          const opportunities = await this.googleHotelsScraper.detectBelowAverageRates(priceData);
          
          realTimeOpportunities.push(...opportunities.map(opp => ({
            hotelId: opp.hotelId,
            hotelName: opp.hotelName,
            perfectDate: opp.date,
            currentRate: opp.currentPrice,
            averageRate: opp.averagePrice,
            savingsPercentage: opp.savingsPercentage,
            confidenceScore: opp.confidence,
            reasons: ['Real-time rate analysis', 'Below average pricing'],
            urgency: (opp.savingsPercentage >= 25 ? 'high' : opp.savingsPercentage >= 15 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
          })));
          
          logger.info(`Found ${realTimeOpportunities.length} real-time perfect day opportunities`);
        } catch (error) {
          logger.warn('Google Hotels scraping failed for hybrid detection:', error);
        }
      }

      // Get seasonal opportunities as backup
      for (const hotel of this.curatedHotels) {
        const hotelOpportunities = this.seasonalRateService.getPerfectDaysForHotel(hotel.hotelId);
        seasonalOpportunities.push(...hotelOpportunities);
      }

      // Merge and rank opportunities
      return this.mergeAndRankOpportunities(realTimeOpportunities, seasonalOpportunities);

    } catch (error) {
      logger.error('Error in hybrid perfect day detection:', error);
      return this.generateFallbackPerfectDays();
    }
  }

  /**
   * Smart merging of real-time and seasonal opportunities
   * Prioritizes real-time data but includes seasonal as backup
   */
  private mergeAndRankOpportunities(
    realTime: PerfectDayOpportunity[], 
    seasonal: any[]
  ): PerfectDayOpportunity[] {
    const mergedOpportunities: PerfectDayOpportunity[] = [];
    const seenCombinations = new Set<string>();

    // Add real-time opportunities first (higher priority)
    realTime.forEach(opp => {
      const key = `${opp.hotelId}-${opp.perfectDate}`;
      if (!seenCombinations.has(key)) {
        mergedOpportunities.push({
          ...opp,
          confidenceScore: opp.confidenceScore * 1.2, // Boost confidence for real-time data
          reasons: [...opp.reasons, 'Real-time data source']
        });
        seenCombinations.add(key);
      }
    });

    // Add seasonal opportunities as backup
    seasonal.forEach(opp => {
      const key = `${opp.hotelId}-${opp.perfectDate}`;
      if (!seenCombinations.has(key)) {
        mergedOpportunities.push({
          ...opp,
          confidenceScore: opp.confidenceScore * 0.8, // Reduce confidence for seasonal data
          reasons: [...opp.reasons, 'Seasonal pattern analysis']
        });
        seenCombinations.add(key);
      }
    });

    // Sort by savings percentage and confidence
    return mergedOpportunities
      .sort((a, b) => {
        // Primary sort by savings percentage
        if (Math.abs(b.savingsPercentage - a.savingsPercentage) > 5) {
          return b.savingsPercentage - a.savingsPercentage;
        }
        // Secondary sort by confidence score
        return b.confidenceScore - a.confidenceScore;
      })
      .slice(0, 10); // Return top 10 opportunities
  }

  /**
   * Get comprehensive enhanced travel data
   * Combines perfect days, weekly suggestions, current deals, and market insights
   */
  public async getEnhancedTravelData(): Promise<EnhancedTravelData> {
    try {
      // Get hybrid perfect days
      const perfectDays = await this.getHybridPerfectDays();

      // Get weekly suggestions from seasonal service
      const weeklySuggestions = this.seasonalRateService.getWeeklySuggestions(10);

      // Generate current deals from perfect days
      const currentDeals: DealAlert[] = perfectDays.map(opp => ({
        hotelId: opp.hotelId,
        hotelName: opp.hotelName,
        dealType: 'perfect-day',
        currentRate: opp.currentRate,
        originalRate: opp.averageRate,
        savingsPercentage: opp.savingsPercentage,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        urgency: opp.urgency,
        confidence: opp.confidenceScore,
        reasons: opp.reasons,
        bookingRecommendation: this.generateBookingRecommendation(opp)
      }));

      // Generate market insights
      const marketInsights = this.generateMarketInsights(perfectDays, weeklySuggestions);

      return {
        perfectDays,
        weeklySuggestions,
        currentDeals,
        marketInsights,
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error('Error generating enhanced travel data:', error);
      return this.getFallbackEnhancedTravelData();
    }
  }

  /**
   * Generate booking recommendations based on opportunity data
   */
  private generateBookingRecommendation(opp: PerfectDayOpportunity): string {
    if (opp.urgency === 'high') {
      return 'Book immediately - exceptional value';
    } else if (opp.urgency === 'medium') {
      return 'Book within 7 days - good value';
    } else {
      return 'Book within 14 days - decent value';
    }
  }

  /**
   * Generate market insights from travel data
   */
  private generateMarketInsights(
    perfectDays: PerfectDayOpportunity[], 
    weeklySuggestions: any[]
  ): MarketInsight[] {
    const insights: MarketInsight[] = [];

    // Analyze perfect day trends
    if (perfectDays.length > 0) {
      const avgSavings = perfectDays.reduce((sum, opp) => sum + opp.savingsPercentage, 0) / perfectDays.length;
      const highValueCount = perfectDays.filter(opp => opp.savingsPercentage >= 25).length;

      if (avgSavings > 30) {
        insights.push({
          type: 'opportunity',
          title: 'Exceptional Value Period',
          description: `Average savings of ${avgSavings.toFixed(1)}% across ${perfectDays.length} opportunities`,
          impact: 'high',
          timeframe: 'next 30 days',
          confidence: 0.9,
          dataSource: 'hybrid'
        });
      }

      if (highValueCount >= 3) {
        insights.push({
          type: 'trend',
          title: 'Multiple High-Value Opportunities',
          description: `${highValueCount} opportunities with 25%+ savings available`,
          impact: 'medium',
          timeframe: 'next 14 days',
          confidence: 0.8,
          dataSource: 'hybrid'
        });
      }
    }

    // Analyze city distribution
    const cityCounts = perfectDays.reduce((acc, opp) => {
      const hotel = this.curatedHotels.find(h => h.hotelId === opp.hotelId);
      const city = hotel?.city || 'unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(cityCounts).forEach(([city, count]) => {
      if (count >= 2) {
        insights.push({
          type: 'recommendation',
          title: `${city.charAt(0).toUpperCase() + city.slice(1)} Value Cluster`,
          description: `${count} opportunities in ${city} - consider multi-property booking`,
          impact: 'medium',
          timeframe: 'next 30 days',
          confidence: 0.7,
          dataSource: 'hybrid'
        });
      }
    });

    // Add seasonal insights
    if (weeklySuggestions.length > 0) {
      insights.push({
        type: 'trend',
        title: 'Seasonal Pattern Recognition',
        description: `${weeklySuggestions.length} weekly suggestions based on historical patterns`,
        impact: 'medium',
        timeframe: 'ongoing',
        confidence: 0.6,
        dataSource: 'seasonal'
      });
    }

    return insights;
  }

  /**
   * Fallback enhanced travel data when primary methods fail
   */
  private getFallbackEnhancedTravelData(): EnhancedTravelData {
    const fallbackPerfectDays = this.generateFallbackPerfectDays();
    
    return {
      perfectDays: fallbackPerfectDays,
      weeklySuggestions: this.seasonalRateService.getWeeklySuggestions(5),
      currentDeals: fallbackPerfectDays.map(opp => ({
        hotelId: opp.hotelId,
        hotelName: opp.hotelName,
        dealType: 'perfect-day',
        currentRate: opp.currentRate,
        originalRate: opp.averageRate,
        savingsPercentage: opp.savingsPercentage,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        urgency: opp.urgency,
        confidence: opp.confidenceScore,
        reasons: [...opp.reasons, 'Fallback data'],
        bookingRecommendation: 'Verify availability before booking'
      })),
      marketInsights: [{
        type: 'warning',
        title: 'Using Fallback Data',
        description: 'Real-time data unavailable - using simulated and seasonal data',
        impact: 'medium',
        timeframe: 'current',
        confidence: 0.3,
        dataSource: 'seasonal'
      }],
      lastUpdated: new Date()
    };
  }

  /**
   * Get comprehensive travel data with all available information
   */
  public async getComprehensiveTravelData(): Promise<ComprehensiveTravelData> {
    try {
      const hotels = this.curatedHotels;
      const currentRates: HotelRateData[] = []; // Simplified for now
      const optimalBookingWindows: OptimalBookingWindow[] = []; // Simplified for now
      const travelInsights = this.getTravelInsights() || this.getFallbackTravelInsights();

      return {
        hotels,
        currentRates,
        optimalBookingWindows,
        travelInsights,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error getting comprehensive travel data:', error);
      throw error;
    }
  }

  /**
   * Cache travel data for performance optimization
   */
  public async cacheTravelData(): Promise<void> {
    try {
      const data = await this.getComprehensiveTravelData();
      const cache: TravelDataCache = {
        data,
        timestamp: Date.now()
      };
      
      await this.runtime.setCache('travel_data', cache);
      logger.info('Travel data cached successfully');
    } catch (error) {
      logger.error('Error caching travel data:', error);
    }
  }

  /**
   * Get cached travel data if available and fresh
   */
  public async getCachedTravelData(): Promise<ComprehensiveTravelData | null> {
    try {
      const cache = await this.runtime.getCache<TravelDataCache>('travel_data');
      if (cache && Date.now() - cache.timestamp < 30 * 60 * 1000) { // 30 minutes
        return cache.data;
      }
      return null;
    } catch (error) {
      logger.warn('Error getting cached travel data:', error);
      return null;
    }
  }

  /**
   * Get travel data with caching optimization
   */
  public async getOptimizedTravelData(): Promise<ComprehensiveTravelData> {
    const cached = await this.getCachedTravelData();
    if (cached) {
      return cached;
    }
    
    const fresh = await this.getComprehensiveTravelData();
    await this.cacheTravelData();
    return fresh;
  }
}
