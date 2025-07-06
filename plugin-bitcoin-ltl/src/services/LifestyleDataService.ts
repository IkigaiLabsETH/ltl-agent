import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";

// Weather and lifestyle data interfaces (extracted from RealTimeDataService)
export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
    wind_speed_10m?: string;
    wind_direction_10m?: string;
  };
  hourly: {
    time: string[];
    temperature_2m: (number | null)[];
    wind_speed_10m?: (number | null)[];
    wind_direction_10m?: (number | null)[];
  };
  current?: {
    time: string;
    interval: number;
    temperature_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
  };
}

export interface MarineData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  current_units: {
    time: string;
    wave_height: string;
    wave_direction: string;
    wave_period: string;
    sea_surface_temperature: string;
  };
  current: {
    time: string;
    wave_height: number;
    wave_direction: number;
    wave_period: number;
    sea_surface_temperature: number;
  };
}

export interface AirQualityData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    pm10: string;
    pm2_5: string;
    uv_index: string;
    uv_index_clear_sky: string;
  };
  current: {
    time: string;
    pm10: number;
    pm2_5: number;
    uv_index: number;
    uv_index_clear_sky: number;
  };
}

export interface CityWeatherData {
  city: string;
  displayName: string;
  weather: WeatherData;
  marine?: MarineData;
  airQuality?: AirQualityData;
  lastUpdated: Date;
}

export interface ComprehensiveWeatherData {
  cities: CityWeatherData[];
  summary: {
    bestWeatherCity: string;
    bestSurfConditions: string | null;
    averageTemp: number;
    windConditions: "calm" | "breezy" | "windy" | "stormy";
    uvRisk: "low" | "moderate" | "high" | "very-high";
    airQuality: "excellent" | "good" | "moderate" | "poor";
  };
  lastUpdated: Date;
}

export interface WeatherCache {
  data: ComprehensiveWeatherData;
  timestamp: number;
}

// Travel data interfaces (prepared for Booking.com API integration)
export interface LuxuryHotel {
  id: string;
  name: string;
  location: string;
  city: keyof typeof LIFESTYLE_CITIES;
  stars: number;
  description: string;
  amenities: string[];
  website?: string;
  bookingComId?: string; // For Booking.com API integration
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface HotelRateData {
  hotelId: string;
  date: string;
  rateEur: number;
  availability: "available" | "limited" | "soldout";
  roomType: string;
  restrictions?: {
    minNights?: number;
    maxNights?: number;
    checkinDay?: string[];
    checkoutDay?: string[];
  };
  cancellationPolicy: "free" | "partial" | "non-refundable";
  lastUpdated: Date;
}

export interface OptimalBookingPeriod {
  hotelId: string;
  hotelName: string;
  period: {
    startDate: string;
    endDate: string;
    monthName: string;
  };
  averageRate: number;
  lowestRate: number;
  savingsFromPeak: {
    amount: number;
    percentage: number;
  };
  reasonsForLowRates: string[];
  weatherDuringPeriod: {
    averageTemp: number;
    conditions: string;
    suitabilityScore: number; // 1-10 scale
  };
  recommendationScore: number; // 1-100 scale considering price + weather + availability
}

export interface TravelDataCache {
  hotelRates: { [hotelId: string]: HotelRateData[] };
  optimalPeriods: { [hotelId: string]: OptimalBookingPeriod[] };
  timestamp: number;
}

// Restaurant and culinary data interfaces
export interface CuratedRestaurant {
  id: string;
  name: string;
  city: string;
  cuisine: string;
  priceRange: "luxury" | "premium" | "fine-dining";
  culturalHeritage: string;
  signatureDishes: string[];
  wineList: string;
  chef: string;
  culinaryPhilosophy: string;
  bitcoinLifestyle: string[];
  googlePlaceId?: string; // For Google Places API integration
  michelinStars?: number; // Michelin star rating
  michelinGuideUrl?: string; // Michelin Guide reference
  address: string;
  phone?: string;
  website?: string;
}

export interface MichelinHotel {
  id: string;
  name: string;
  city: string;
  hotelDescription: string;
  michelinRestaurants: MichelinRestaurant[];
  roomServiceQuality: string;
  bistroQuality: string;
  culinaryPhilosophy: string;
  foodieCulture: string[];
  bitcoinLifestyle: string[];
  googlePlaceId?: string;
  address: string;
  website?: string;
}

export interface MichelinRestaurant {
  id: string;
  name: string;
  stars: number;
  cuisine: string;
  chef: string;
  culinaryPhilosophy: string;
  signatureDishes: string[];
  michelinGuideUrl: string;
  seasonalHighlights: string[];
}

export interface RestaurantSuggestion {
  restaurant: CuratedRestaurant;
  dailyContext: string;
  culturalSignificance: string;
  bitcoinLifestyle: string[];
  recommendedDishes: string[];
  winePairing: string;
  bookingAdvice: string;
  googleStatus?: RestaurantStatus; // Optional real-time Google verification
  isCurrentlyOpen?: boolean; // Optional when Google API unavailable
  nextOpeningTime?: string; // Optional when Google API unavailable
  googleVerificationAvailable: boolean; // Indicates if Google verification was used
}

export interface RestaurantStatus {
  isOpen?: boolean; // Optional when Google API unavailable
  currentHours?: string; // Optional when Google API unavailable
  todayHours?: string; // Optional when Google API unavailable
  specialAnnouncements?: string[];
  lastUpdated: Date;
  googleData?: GoogleRestaurantData; // Optional when Google API unavailable
  verificationSource: "google" | "cached" | "unavailable";
  message?: string; // Explains verification status
}

export interface GoogleRestaurantData {
  placeId: string;
  currentStatus: "OPEN" | "CLOSED" | "CLOSED_TEMPORARILY" | "UNKNOWN";
  openingHours: {
    openNow: boolean;
    periods: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    weekdayText: string[];
  };
  rating?: number;
  userRatingsTotal?: number;
  photos?: string[];
  priceLevel?: number;
  lastUpdated: Date;
}

export interface RestaurantDataCache {
  restaurants: { [city: string]: CuratedRestaurant[] };
  michelinHotels: { [city: string]: MichelinHotel[] };
  timestamp: number;
}

// European lifestyle cities configuration
export const LIFESTYLE_CITIES = {
  biarritz: {
    lat: 43.4833,
    lon: -1.5586,
    displayName: "Biarritz",
    description: "French Basque coast, surfing paradise",
    country: "France",
    season: {
      peak: ["July", "August", "September"],
      shoulder: ["May", "June", "October"],
      low: ["November", "December", "January", "February", "March", "April"],
    },
  },
  bordeaux: {
    lat: 44.8378,
    lon: -0.5792,
    displayName: "Bordeaux",
    description: "Wine capital, luxury living",
    country: "France",
    season: {
      peak: ["September", "October"], // Harvest season
      shoulder: ["May", "June", "July", "August"],
      low: ["November", "December", "January", "February", "March", "April"],
    },
  },
  monaco: {
    lat: 43.7384,
    lon: 7.4246,
    displayName: "Monaco",
    description: "Tax haven, Mediterranean luxury",
    country: "Monaco",
    season: {
      peak: ["May", "June", "July", "August"], // Monaco GP and summer
      shoulder: ["April", "September", "October"],
      low: ["November", "December", "January", "February", "March"],
    },
  },
} as const;

// Curated luxury hotels for rate tracking
export const CURATED_LUXURY_HOTELS: LuxuryHotel[] = [
  {
    id: "hotel-du-palais-biarritz",
    name: "Hôtel du Palais",
    location: "Biarritz, France",
    city: "biarritz",
    stars: 5,
    description:
      "Iconic palace hotel on Biarritz beach, former residence of Napoleon III",
    amenities: ["Beach Access", "Spa", "Michelin Restaurant", "Golf", "Casino"],
    website: "https://www.hotel-du-palais.com",
    coordinates: { lat: 43.4844, lon: -1.5619 },
  },
  {
    id: "les-sources-de-caudalie-bordeaux",
    name: "Les Sources de Caudalie",
    location: "Bordeaux-Martillac, France",
    city: "bordeaux",
    stars: 5,
    description:
      "Luxury vineyard resort in Bordeaux wine country with vinotherapy spa",
    amenities: [
      "Vineyard",
      "Vinotherapy Spa",
      "Wine Tasting",
      "Michelin Restaurant",
    ],
    website: "https://www.sources-caudalie.com",
    coordinates: { lat: 44.7167, lon: -0.55 },
  },
  {
    id: "hotel-metropole-monaco",
    name: "Hotel Metropole Monte-Carlo",
    location: "Monaco",
    city: "monaco",
    stars: 5,
    description:
      "Belle Époque palace in the heart of Monaco with Joël Robuchon restaurant",
    amenities: [
      "Casino Access",
      "Michelin Restaurant",
      "Spa",
      "Shopping District",
    ],
    website: "https://www.metropole.com",
    coordinates: { lat: 43.7403, lon: 7.4278 },
  },
  {
    id: "hotel-hermitage-monaco",
    name: "Hotel Hermitage Monte-Carlo",
    location: "Monaco",
    city: "monaco",
    stars: 5,
    description: "Legendary Belle Époque hotel overlooking the Mediterranean",
    amenities: ["Sea View", "Casino Access", "Thermae Spa", "Fine Dining"],
    coordinates: { lat: 43.7394, lon: 7.4282 },
  },
];

// Curated restaurants for daily culinary intelligence
export const CURATED_RESTAURANTS: CuratedRestaurant[] = [
  // Biarritz Restaurants
  {
    id: "le-petit-paris-biarritz",
    name: "Le Petit Paris",
    city: "biarritz",
    cuisine: "French Basque",
    priceRange: "fine-dining",
    culturalHeritage: "Traditional Basque cuisine meets French elegance",
    signatureDishes: ["Turbot à la Basque", "Axoa de Veau", "Gateau Basque"],
    wineList: "Extensive Basque and Bordeaux selection",
    chef: "Chef Jean-Michel Llorca",
    culinaryPhilosophy: "Respect for Basque traditions with French refinement",
    bitcoinLifestyle: ["Cultural heritage preservation", "Artisanal excellence", "Regional authenticity"],
    address: "1 Rue des Halles, 64200 Biarritz, France",
    phone: "+33 5 59 24 00 00",
    website: "https://lepetitparis-biarritz.com"
  },
  {
    id: "les-ramparts-biarritz",
    name: "Les Ramparts",
    city: "biarritz",
    cuisine: "Modern Basque",
    priceRange: "luxury",
    culturalHeritage: "Contemporary interpretation of Basque coastal cuisine",
    signatureDishes: ["Lotte à l'Armoricaine", "Poulet Basquaise", "Tarte Tatin"],
    wineList: "Curated selection of Irouléguy and Jurançon wines",
    chef: "Chef Alexandre Drouard",
    culinaryPhilosophy: "Innovation rooted in Basque terroir",
    bitcoinLifestyle: ["Innovation in tradition", "Terroir appreciation", "Culinary evolution"],
    address: "17 Rue des Goélands, 64200 Biarritz, France",
    phone: "+33 5 59 24 00 00",
    website: "https://lesramparts-biarritz.com"
  },
  // Bordeaux Restaurants
  {
    id: "le-chapon-fin-bordeaux",
    name: "Le Chapon Fin",
    city: "bordeaux",
    cuisine: "Classic French",
    priceRange: "luxury",
    culturalHeritage: "Historic Bordeaux institution since 1825",
    signatureDishes: ["Canard à l'Orange", "Sole Meunière", "Soufflé au Chocolat"],
    wineList: "Premier Bordeaux selection with rare vintages",
    chef: "Chef Nicolas Frion",
    culinaryPhilosophy: "Preservation of French culinary heritage",
    bitcoinLifestyle: ["Historical preservation", "Culinary legacy", "Wine culture"],
    address: "5 Rue Montesquieu, 33000 Bordeaux, France",
    phone: "+33 5 56 79 10 10",
    website: "https://lechaponfin-bordeaux.com"
  },
  {
    id: "la-tupina-bordeaux",
    name: "La Tupina",
    city: "bordeaux",
    cuisine: "Southwest French",
    priceRange: "fine-dining",
    culturalHeritage: "Authentic Southwest French cuisine in historic setting",
    signatureDishes: ["Confit de Canard", "Cèpes à la Bordelaise", "Pintade aux Morilles"],
    wineList: "Bordeaux and Southwest French wines",
    chef: "Chef Jean-Pierre Xiradakis",
    culinaryPhilosophy: "Authentic Southwest French traditions",
    bitcoinLifestyle: ["Regional authenticity", "Traditional techniques", "Cultural preservation"],
    address: "6 Rue Porte de la Monnaie, 33000 Bordeaux, France",
    phone: "+33 5 56 91 56 37",
    website: "https://latupina-bordeaux.com"
  },
  // Monaco Restaurants
  {
    id: "le-louis-xv-monaco",
    name: "Le Louis XV - Alain Ducasse",
    city: "monaco",
    cuisine: "Mediterranean French",
    priceRange: "luxury",
    culturalHeritage: "Three Michelin-starred restaurant in Hôtel de Paris",
    signatureDishes: ["Loup de Mer", "Risotto aux Truffes", "Soufflé au Grand Marnier"],
    wineList: "Exceptional wine cellar with rare vintages",
    chef: "Chef Alain Ducasse",
    culinaryPhilosophy: "Mediterranean excellence with French refinement",
    bitcoinLifestyle: ["Culinary excellence", "Mediterranean heritage", "Luxury dining"],
    michelinStars: 3,
    michelinGuideUrl: "https://guide.michelin.com/fr/fr/monaco/restaurant/le-louis-xv-alain-ducasse",
    address: "Place du Casino, 98000 Monaco",
    phone: "+377 98 06 88 64",
    website: "https://www.alain-ducasse.com"
  },
  {
    id: "joel-robuchon-monaco",
    name: "Joël Robuchon Monte-Carlo",
    city: "monaco",
    cuisine: "Modern French",
    priceRange: "luxury",
    culturalHeritage: "Two Michelin-starred restaurant in Hotel Metropole",
    signatureDishes: ["Caviar Osciètre", "Homard Bleu", "Tarte Tatin"],
    wineList: "Extensive international wine selection",
    chef: "Chef Joël Robuchon",
    culinaryPhilosophy: "Modern French cuisine with global influences",
    bitcoinLifestyle: ["International excellence", "Modern innovation", "Luxury lifestyle"],
    michelinStars: 2,
    michelinGuideUrl: "https://guide.michelin.com/fr/fr/monaco/restaurant/joel-robuchon-monte-carlo",
    address: "4 Avenue de la Madone, 98000 Monaco",
    phone: "+377 93 15 15 15",
    website: "https://www.metropole.com"
  }
];

// Michelin-starred hotels for foodie culture alignment
export const MICHELIN_STARRED_HOTELS: MichelinHotel[] = [
  {
    id: "hotel-du-palais-biarritz-michelin",
    name: "Hôtel du Palais Biarritz",
    city: "biarritz",
    hotelDescription: "Former summer palace of Empress Eugénie, culinary excellence since 1855",
    michelinRestaurants: [
      {
        id: "les-ailerons-biarritz",
        name: "Les Ailerons",
        stars: 2,
        cuisine: "French Basque",
        chef: "Chef Aurélien Largeau",
        culinaryPhilosophy: "Basque traditions with French refinement",
        signatureDishes: ["Turbot à la Basque", "Axoa de Veau", "Gateau Basque"],
        michelinGuideUrl: "https://guide.michelin.com/fr/fr/biarritz/restaurant/les-ailerons",
        seasonalHighlights: ["Spring: Asparagus and wild herbs", "Summer: Fresh seafood", "Autumn: Game and mushrooms"]
      }
    ],
    roomServiceQuality: "Even room service reflects the same passion for Basque cuisine",
    bistroQuality: "Hotel bistro maintains culinary excellence with casual elegance",
    culinaryPhilosophy: "Culinary heritage preservation with modern innovation",
    foodieCulture: ["Basque culinary traditions", "Royal summer retreat heritage", "Ocean sports culture"],
    bitcoinLifestyle: ["Cultural capital preservation", "Royal heritage access", "Basque cultural immersion"],
    address: "1 Avenue de l'Impératrice, 64200 Biarritz, France",
    website: "https://www.hotel-du-palais.com"
  },
  {
    id: "intercontinental-bordeaux-michelin",
    name: "InterContinental Bordeaux",
    city: "bordeaux",
    hotelDescription: "Wine capital luxury with Michelin-starred dining",
    michelinRestaurants: [
      {
        id: "le-pressoir-bordeaux",
        name: "Le Pressoir d'Argent",
        stars: 2,
        cuisine: "Modern French",
        chef: "Chef Gordon Ramsay",
        culinaryPhilosophy: "Modern French cuisine with British precision",
        signatureDishes: ["Lobster Thermidor", "Beef Wellington", "Sticky Toffee Pudding"],
        michelinGuideUrl: "https://guide.michelin.com/fr/fr/bordeaux/restaurant/le-pressoir-d-argent",
        seasonalHighlights: ["Spring: White asparagus", "Summer: Fresh herbs", "Autumn: Truffles and game"]
      }
    ],
    roomServiceQuality: "Room service reflects the same culinary standards as the starred restaurant",
    bistroQuality: "Hotel bistro offers wine country authenticity with casual sophistication",
    culinaryPhilosophy: "Wine country gastronomy with international excellence",
    foodieCulture: ["Wine culture", "UNESCO heritage", "Gastronomic traditions"],
    bitcoinLifestyle: ["Wine investment culture", "UNESCO cultural capital", "Gastronomic heritage"],
    address: "2-5 Place de la Comédie, 33000 Bordeaux, France",
    website: "https://www.intercontinental.com/bordeaux"
  },
  {
    id: "hotel-de-paris-monaco-michelin",
    name: "Hôtel de Paris Monte-Carlo",
    city: "monaco",
    hotelDescription: "Legendary Belle Époque hotel with three Michelin stars",
    michelinRestaurants: [
      {
        id: "le-louis-xv-monaco-hotel",
        name: "Le Louis XV - Alain Ducasse",
        stars: 3,
        cuisine: "Mediterranean French",
        chef: "Chef Alain Ducasse",
        culinaryPhilosophy: "Mediterranean excellence with French refinement",
        signatureDishes: ["Loup de Mer", "Risotto aux Truffes", "Soufflé au Grand Marnier"],
        michelinGuideUrl: "https://guide.michelin.com/fr/fr/monaco/restaurant/le-louis-xv-alain-ducasse",
        seasonalHighlights: ["Spring: Mediterranean herbs", "Summer: Fresh seafood", "Autumn: Truffles and mushrooms"]
      }
    ],
    roomServiceQuality: "Room service maintains the same three-star standards",
    bistroQuality: "Hotel bistro offers Mediterranean luxury with casual elegance",
    culinaryPhilosophy: "Mediterranean luxury with French culinary excellence",
    foodieCulture: ["Mediterranean luxury", "Royal traditions", "Casino culture"],
    bitcoinLifestyle: ["Mediterranean cultural capital", "Royal heritage access", "Luxury lifestyle"],
    address: "Place du Casino, 98000 Monaco",
    website: "https://www.montecarloresort.com"
  }
];

export class LifestyleDataService extends BaseDataService {
  static serviceType = "lifestyle-data";
  capabilityDescription =
    "Provides comprehensive lifestyle data including weather, luxury hotels, travel insights, curated restaurants, and Michelin-starred hotel recommendations";

  // Cache storage and durations
  private weatherCache: WeatherCache | null = null;
  private readonly WEATHER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (matches website)

  // Travel data cache (prepared for future implementation)
  private travelDataCache: TravelDataCache | null = null;
  private readonly TRAVEL_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for hotel rates

  // Restaurant data cache
  private restaurantDataCache: RestaurantDataCache | null = null;
  private readonly RESTAURANT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for restaurant data

  constructor(runtime: IAgentRuntime) {
    super(runtime, "lifestyleData");
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("LifestyleDataService starting...");
    const service = new LifestyleDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("LifestyleDataService stopping...");
    const service = runtime.getService("lifestyle-data");
    if (service && service.stop) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    logger.info("LifestyleDataService starting...");
    await this.updateData();
    logger.info("LifestyleDataService started successfully");
  }

  async init() {
    logger.info("LifestyleDataService initialized");

    // Initial data load
    await this.updateWeatherData();
  }

  async stop() {
    logger.info("LifestyleDataService stopped");
    // Clear cache and clean up any resources
    this.weatherCache = null;
    this.travelDataCache = null;
  }

  // Required abstract method implementations
  async updateData(): Promise<void> {
    await Promise.all([
      this.updateWeatherData(),
      // Future: this.updateTravelData()
    ]);
  }

  async forceUpdate(): Promise<void> {
    // Clear all caches to force fresh data
    this.weatherCache = null;
    this.travelDataCache = null;
    await this.updateData();
  }

  // Public API methods - Weather
  public getWeatherData(): ComprehensiveWeatherData | null {
    if (!this.weatherCache || !this.isWeatherCacheValid()) {
      return null;
    }
    return this.weatherCache.data;
  }

  public async forceWeatherUpdate(): Promise<ComprehensiveWeatherData | null> {
    return await this.fetchWeatherData();
  }

  // Public API methods - Travel (prepared for future implementation)
  public getLuxuryHotels(): LuxuryHotel[] {
    return CURATED_LUXURY_HOTELS;
  }

  public getHotelsForCity(city: keyof typeof LIFESTYLE_CITIES): LuxuryHotel[] {
    return CURATED_LUXURY_HOTELS.filter((hotel) => hotel.city === city);
  }

  public async getOptimalBookingPeriods(
    hotelId?: string,
  ): Promise<OptimalBookingPeriod[] | null> {
    // Future implementation will integrate with Booking.com API
    // For now, return null until we implement rate tracking
    logger.info(
      "[LifestyleDataService] Optimal booking periods not yet implemented - requires Booking.com API integration",
    );
    return null;
  }

  // Public API methods - Restaurant and Culinary
  public getCuratedRestaurants(city?: string): CuratedRestaurant[] {
    if (city) {
      return CURATED_RESTAURANTS.filter(restaurant => restaurant.city === city);
    }
    return CURATED_RESTAURANTS;
  }

  public getMichelinStarredHotels(city?: string): MichelinHotel[] {
    if (city) {
      return MICHELIN_STARRED_HOTELS.filter(hotel => hotel.city === city);
    }
    return MICHELIN_STARRED_HOTELS;
  }

  public async getDailyRestaurantSuggestion(city?: string): Promise<RestaurantSuggestion> {
    const restaurants = this.getCuratedRestaurants(city);
    if (restaurants.length === 0) {
      throw new Error(`No restaurants found for city: ${city}`);
    }

    // Select a restaurant for today (simple rotation based on date)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const selectedRestaurant = restaurants[dayOfYear % restaurants.length];

    // Check if Google API key is available
    const googleApiKey = this.runtime.getSetting('GOOGLE_PLACES_API_KEY');
    const googleVerificationAvailable = !!googleApiKey;

    let restaurantStatus: RestaurantStatus | undefined;
    if (googleVerificationAvailable) {
      try {
        restaurantStatus = await this.verifyRestaurantStatus(selectedRestaurant);
      } catch (error) {
        logger.warn(`[LifestyleDataService] Google verification failed: ${error.message}`);
        restaurantStatus = {
          verificationSource: "unavailable",
          lastUpdated: new Date(),
          message: "Google verification unavailable - please check directly"
        };
      }
    } else {
      restaurantStatus = {
        verificationSource: "unavailable",
        lastUpdated: new Date(),
        message: "Hours verification unavailable - please check directly"
      };
    }

    // Generate daily context based on restaurant
    const dailyContext = this.generateDailyContext(selectedRestaurant);
    const culturalSignificance = this.generateCulturalSignificance(selectedRestaurant);
    const bitcoinLifestyle = selectedRestaurant.bitcoinLifestyle;
    const recommendedDishes = selectedRestaurant.signatureDishes.slice(0, 2);
    const winePairing = selectedRestaurant.wineList;
    const bookingAdvice = this.generateBookingAdvice(selectedRestaurant);

    return {
      restaurant: selectedRestaurant,
      dailyContext,
      culturalSignificance,
      bitcoinLifestyle,
      recommendedDishes,
      winePairing,
      bookingAdvice,
      googleStatus: restaurantStatus,
      googleVerificationAvailable
    };
  }

  public async verifyRestaurantStatus(restaurant: CuratedRestaurant): Promise<RestaurantStatus> {
    const googleApiKey = this.runtime.getSetting('GOOGLE_PLACES_API_KEY');
    
    if (!googleApiKey || !restaurant.googlePlaceId) {
      return {
        verificationSource: "unavailable",
        lastUpdated: new Date(),
        message: "Google Places API key or restaurant Place ID not available"
      };
    }

    try {
      const googleData = await this.getGoogleRestaurantData(restaurant.googlePlaceId);
      if (!googleData) {
        return {
          verificationSource: "unavailable",
          lastUpdated: new Date(),
          message: "Unable to fetch Google data"
        };
      }

      return {
        isOpen: googleData.currentStatus === "OPEN",
        currentHours: googleData.openingHours.weekdayText.join(", "),
        todayHours: googleData.openingHours.weekdayText[new Date().getDay()] || "Hours not available",
        lastUpdated: new Date(),
        googleData,
        verificationSource: "google",
        message: `Currently ${googleData.currentStatus.toLowerCase()}`
      };
    } catch (error) {
      logger.error(`[LifestyleDataService] Error verifying restaurant status: ${error.message}`);
      return {
        verificationSource: "unavailable",
        lastUpdated: new Date(),
        message: `Error verifying status: ${error.message}`
      };
    }
  }

  public async getGoogleRestaurantData(placeId: string): Promise<GoogleRestaurantData | null> {
    const googleApiKey = this.runtime.getSetting('GOOGLE_PLACES_API_KEY');
    
    if (!googleApiKey) {
      logger.info("[LifestyleDataService] Google Places API key not available");
      return null;
    }

    try {
      // This would be the actual Google Places API call
      // For now, return null to indicate API key is available but not implemented
      logger.info(`[LifestyleDataService] Google Places API integration not yet implemented for place ID: ${placeId}`);
      return null;
    } catch (error) {
      logger.error(`[LifestyleDataService] Error fetching Google restaurant data: ${error.message}`);
      return null;
    }
  }

  // Helper methods for generating restaurant suggestions
  private generateDailyContext(restaurant: CuratedRestaurant): string {
    const contexts = [
      `Experience ${restaurant.cuisine} excellence at ${restaurant.name}`,
      `Discover ${restaurant.chef}'s culinary vision at ${restaurant.name}`,
      `Immerse yourself in ${restaurant.culturalHeritage} at ${restaurant.name}`,
      `Savor ${restaurant.cuisine} traditions at ${restaurant.name}`
    ];
    return contexts[Math.floor(Math.random() * contexts.length)];
  }

  private generateCulturalSignificance(restaurant: CuratedRestaurant): string {
    return restaurant.culturalHeritage;
  }

  private generateBookingAdvice(restaurant: CuratedRestaurant): string {
    const advice = [
      "Reservations recommended, especially for dinner",
      "Book at least 24 hours in advance for optimal experience",
      "Consider lunch for a more relaxed experience",
      "Weekend reservations fill quickly - book early"
    ];
    return advice[Math.floor(Math.random() * advice.length)];
  }

  // Cache validation methods
  private isWeatherCacheValid(): boolean {
    if (!this.weatherCache) return false;
    return (
      Date.now() - this.weatherCache.timestamp < this.WEATHER_CACHE_DURATION
    );
  }

  private isTravelCacheValid(): boolean {
    if (!this.travelDataCache) return false;
    return (
      Date.now() - this.travelDataCache.timestamp < this.TRAVEL_CACHE_DURATION
    );
  }

  // Data update methods
  private async updateWeatherData(): Promise<void> {
    if (!this.isWeatherCacheValid()) {
      const data = await this.fetchWeatherData();
      if (data) {
        this.weatherCache = {
          data,
          timestamp: Date.now(),
        };
      }
    }
  }

  // Core weather data fetching (extracted from RealTimeDataService)
  private async fetchWeatherData(): Promise<ComprehensiveWeatherData | null> {
    try {
      logger.info(
        "[LifestyleDataService] Fetching weather data for European luxury cities...",
      );

      const cities = Object.entries(LIFESTYLE_CITIES);
      const cityWeatherPromises = cities.map(async ([cityKey, cityConfig]) => {
        try {
          // Fetch weather data
          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${cityConfig.lat}&longitude=${cityConfig.lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,wind_speed_10m,wind_direction_10m`,
            { signal: AbortSignal.timeout(5000) },
          );

          if (!weatherResponse.ok) {
            logger.warn(
              `Failed to fetch weather for ${cityKey}: ${weatherResponse.status}`,
            );
            return null;
          }

          const weatherData = await weatherResponse.json();

          // If no current data, use latest hourly data as fallback
          if (!weatherData.current && weatherData.hourly) {
            const latestIndex = weatherData.hourly.time.length - 1;
            if (latestIndex >= 0) {
              weatherData.current = {
                time: weatherData.hourly.time[latestIndex],
                interval: 3600, // 1 hour in seconds
                temperature_2m: weatherData.hourly.temperature_2m[latestIndex],
                wind_speed_10m:
                  weatherData.hourly.wind_speed_10m?.[latestIndex],
                wind_direction_10m:
                  weatherData.hourly.wind_direction_10m?.[latestIndex],
              };
            }
          }

          // Fetch marine data (for coastal cities)
          let marineData = null;
          if (cityKey === "biarritz" || cityKey === "monaco") {
            try {
              const marineResponse = await fetch(
                `https://marine-api.open-meteo.com/v1/marine?latitude=${cityConfig.lat}&longitude=${cityConfig.lon}&current=wave_height,wave_direction,wave_period,sea_surface_temperature`,
                { signal: AbortSignal.timeout(5000) },
              );
              if (marineResponse.ok) {
                marineData = await marineResponse.json();
              }
            } catch (error) {
              logger.warn(`Failed to fetch marine data for ${cityKey}:`, error);
            }
          }

          // Fetch air quality data
          let airQualityData = null;
          try {
            const airQualityResponse = await fetch(
              `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${cityConfig.lat}&longitude=${cityConfig.lon}&current=pm10,pm2_5,uv_index,uv_index_clear_sky`,
              { signal: AbortSignal.timeout(5000) },
            );
            if (airQualityResponse.ok) {
              airQualityData = await airQualityResponse.json();
            }
          } catch (error) {
            logger.warn(
              `Failed to fetch air quality data for ${cityKey}:`,
              error,
            );
          }

          return {
            city: cityKey,
            displayName: cityConfig.displayName,
            weather: weatherData,
            marine: marineData,
            airQuality: airQualityData,
            lastUpdated: new Date(),
          } as CityWeatherData;
        } catch (error) {
          logger.error(`Error fetching weather for ${cityKey}:`, error);
          return null;
        }
      });

      // Add delays between requests to avoid rate limits
      const cityWeatherData: CityWeatherData[] = [];
      for (let i = 0; i < cityWeatherPromises.length; i++) {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 300)); // 300ms delay
        }
        try {
          const result = await cityWeatherPromises[i];
          if (result) {
            cityWeatherData.push(result);
          }
        } catch (error) {
          logger.error(`Error processing weather for city ${i}:`, error);
        }
      }

      // Calculate summary statistics
      if (cityWeatherData.length === 0) {
        logger.warn("No weather data retrieved for any city");
        return null;
      }

      // Get valid temperatures (handle optional/null values)
      const temperatures = cityWeatherData
        .map((city) => city.weather.current?.temperature_2m)
        .filter((temp): temp is number => temp !== undefined && temp !== null);

      if (temperatures.length === 0) {
        logger.warn("No valid temperature data available");
        return null;
      }

      const averageTemp =
        temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;

      // Find best weather city (highest temp, lowest wind) - handle optional values
      const bestWeatherCity = cityWeatherData.reduce((best, current) => {
        const bestTemp = best.weather.current?.temperature_2m || 0;
        const bestWind = best.weather.current?.wind_speed_10m || 0;
        const currentTemp = current.weather.current?.temperature_2m || 0;
        const currentWind = current.weather.current?.wind_speed_10m || 0;

        const bestScore = bestTemp - bestWind * 0.5;
        const currentScore = currentTemp - currentWind * 0.5;
        return currentScore > bestScore ? current : best;
      }).displayName;

      // Find best surf conditions (coastal cities only)
      const coastalCities = cityWeatherData.filter((city) => city.marine);
      let bestSurfConditions = null;
      if (coastalCities.length > 0) {
        const bestSurf = coastalCities.reduce((best, current) => {
          if (!best.marine || !current.marine) return best;
          const bestWaves =
            best.marine.current.wave_height * best.marine.current.wave_period;
          const currentWaves =
            current.marine.current.wave_height *
            current.marine.current.wave_period;
          return currentWaves > bestWaves ? current : best;
        });
        bestSurfConditions = bestSurf.displayName;
      }

      // Wind conditions assessment - handle optional values
      const windSpeeds = cityWeatherData
        .map((city) => city.weather.current?.wind_speed_10m)
        .filter(
          (speed): speed is number => speed !== undefined && speed !== null,
        );

      const maxWindSpeed = windSpeeds.length > 0 ? Math.max(...windSpeeds) : 0;
      let windConditions: "calm" | "breezy" | "windy" | "stormy";
      if (maxWindSpeed < 10) windConditions = "calm";
      else if (maxWindSpeed < 20) windConditions = "breezy";
      else if (maxWindSpeed < 35) windConditions = "windy";
      else windConditions = "stormy";

      // UV risk assessment
      const uvIndices = cityWeatherData
        .filter((city) => city.airQuality?.current.uv_index !== undefined)
        .map((city) => city.airQuality!.current.uv_index);

      let uvRisk: "low" | "moderate" | "high" | "very-high" = "low";
      if (uvIndices.length > 0) {
        const maxUV = Math.max(...uvIndices);
        if (maxUV >= 8) uvRisk = "very-high";
        else if (maxUV >= 6) uvRisk = "high";
        else if (maxUV >= 3) uvRisk = "moderate";
      }

      // Air quality assessment
      const pm25Values = cityWeatherData
        .filter((city) => city.airQuality?.current.pm2_5 !== undefined)
        .map((city) => city.airQuality!.current.pm2_5);

      let airQuality: "excellent" | "good" | "moderate" | "poor" = "excellent";
      if (pm25Values.length > 0) {
        const maxPM25 = Math.max(...pm25Values);
        if (maxPM25 > 35) airQuality = "poor";
        else if (maxPM25 > 15) airQuality = "moderate";
        else if (maxPM25 > 5) airQuality = "good";
      }

      const result: ComprehensiveWeatherData = {
        cities: cityWeatherData,
        summary: {
          bestWeatherCity,
          bestSurfConditions,
          averageTemp,
          windConditions,
          uvRisk,
          airQuality,
        },
        lastUpdated: new Date(),
      };

      logger.info(
        `[LifestyleDataService] Fetched weather data: ${cityWeatherData.length} cities, avg temp: ${averageTemp.toFixed(1)}°C, best weather: ${bestWeatherCity}`,
      );
      return result;
    } catch (error) {
      logger.error("Error in fetchWeatherData:", error);
      return null;
    }
  }

  // Travel data methods (prepared for future Booking.com API integration)
  /**
   * Future method to fetch hotel rates from Booking.com API
   * Based on the API documentation: https://developers.booking.com/connectivity/docs/ari
   *
   * This will implement:
   * - Rate retrieval for curated luxury hotels
   * - Analysis of seasonal pricing patterns
   * - Identification of optimal booking windows
   * - Price trend analysis and alerts
   */
  private async fetchHotelRates(): Promise<void> {
    logger.info(
      "[LifestyleDataService] Hotel rate fetching prepared for Booking.com API integration",
    );

    // Future implementation will:
    // 1. Iterate through CURATED_LUXURY_HOTELS
    // 2. Use Booking.com Rates & Availability API to fetch rates
    // 3. Analyze pricing patterns (Standard/Derived/OBP/LOS pricing types)
    // 4. Calculate optimal booking periods based on:
    //    - Lowest rates vs peak season
    //    - Weather conditions during those periods
    //    - Availability and restrictions
    // 5. Generate OptimalBookingPeriod recommendations

    // Example API call structure:
    // GET /inventory/rates?property_id={id}&date_from={start}&date_to={end}
    // POST /inventory/rates with pricing type configuration

    // This aligns with the user's goal of finding "best day of the month to book"
    // when rates are lowest, avoiding expensive high season periods
  }

  /**
   * Analyze rate patterns to find optimal booking windows
   * Will identify periods when luxury hotels offer significant savings
   */
  private analyzeOptimalBookingPeriods(
    hotelRates: HotelRateData[],
  ): OptimalBookingPeriod[] {
    // Future implementation will:
    // 1. Group rates by month/season
    // 2. Calculate average rates and identify low periods
    // 3. Factor in weather data for suitability
    // 4. Generate recommendation scores
    // 5. Return ranked optimal booking periods

    logger.info(
      "[LifestyleDataService] Rate analysis prepared for implementation",
    );
    return [];
  }
}
