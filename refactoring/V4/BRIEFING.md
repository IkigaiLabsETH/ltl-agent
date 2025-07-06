# Hotel Rate Intelligence MVP: One-Day Implementation with Cursor

## Executive Summary

**Goal**: Build perfect day booking detection in ONE DAY using Cursor, leveraging ElizaOS architecture and existing travel services.

**Core Value**: Agent identifies when rates are 10%+ below average at our 10 curated 5-star hotels.

## Current Architecture Analysis

### ✅ Strong Foundation (Leverage This)
- **TravelDataService**: Already has hotel metadata, seasonal patterns, simulated rates
- **Booking Optimization Actions**: Advanced algorithms exist
- **Hotel Database**: 10 curated luxury hotels ready
- **ElizaOS Framework**: Actions, Services, Providers architecture in place

### 🎯 One-Day MVP Scope
**Focus**: Add real rate data + perfect day detection to existing services

## Implementation Strategy: Cursor Prompts

### Phase 1: Rate Data Service Enhancement (2 hours)

**Cursor Prompt 1:**
```
You are working on a TypeScript project using ElizaOS framework. 

Current file: src/services/TravelDataService.ts
- Has 10 curated luxury hotels with simulated rates
- Needs real rate data from Google Hotels scraping
- Must maintain existing interface compatibility

Task: Create a GoogleHotelsScraper class and enhance fetchCurrentHotelRates() to use Google Hotels data.

Requirements:
1. Keep existing HotelRateData interface
2. Create GoogleHotelsScraper class with Puppeteer-based scraping
3. Extract price charts and historical trends from Google Hotels
4. Maintain error handling and fallback to simulated data
5. Update every 4 hours (existing cache duration)
6. Focus on 10 hotels with their Google Hotels URLs

The scraper should extract price charts for each of our 10 curated hotels showing current vs historical pricing to identify below-average rates.

Focus on the specific hotel URLs from our curated database rather than general city pages.
```

**Cursor Prompt 2:**
```
Create GoogleHotelsScraper class for extracting price data.

Create new file: src/services/GoogleHotelsScraper.ts

Requirements:
1. Use Puppeteer for headless browser scraping
2. Extract price charts from specific hotel Google Hotels pages
3. Parse historical pricing trends for each hotel
4. Identify below-average rate periods
5. Handle rate limiting with intelligent delays

Key methods to implement:
- scrapePriceChart(hotel: CuratedHotel): Promise<PriceData>
- extractHistoricalTrends(page: Page): Promise<TrendData>
- detectBelowAverageRates(priceData: PriceData[]): Promise<RateOpportunity[]>

Use the existing curatedHotels array from TravelDataService to get specific hotel information and URLs.
```

**Cursor Prompt 3:**
```
Extend TravelDataService to add perfect day detection.

Add new method: detectPerfectDays(): PerfectDayOpportunity[]

Interface to add:
interface PerfectDayOpportunity {
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

Algorithm:
1. Use GoogleHotelsScraper to get price data
2. Calculate average rate for each hotel (last 30 days)
3. Find dates with rates 10%+ below average
4. Calculate confidence score based on data quality
5. Sort by savings percentage
6. Return top 5 opportunities

Integrate this into the existing getTravelData() method.
```

### Phase 2: Action Enhancement (2 hours)

**Cursor Prompt 4:**
```
Enhance bookingOptimizationAction.ts to include perfect day detection.

Current file has:
- performBookingOptimization() function
- HotelComparison interface
- Optimization criteria parsing

Add to the optimization:
1. Call travelService.detectPerfectDays()
2. Include perfect days in response
3. Prioritize perfect days in recommendations
4. Add urgency indicators

Update generateOptimizationResponse() to highlight perfect days:
"PERFECT DAY: Hotel X on Date Y - €Z/night (X% below average)"

Keep existing Bitcoin philosophy and response format.
```

**Cursor Prompt 5:**
```
Enhance hotelDealAlertAction.ts to focus on perfect days.

Current file has:
- findCurrentDeals() function
- DealAlert interface
- Alert parameter parsing

Modify to:
1. Prioritize perfect day opportunities (10%+ savings)
2. Add "PERFECT DAY ALERT" prefix for high-value deals
3. Include confidence scores in alerts
4. Sort by savings percentage first

Update formatDealsResponse() to highlight perfect days prominently.
```

### Phase 3: Provider Enhancement (1 hour)

**Cursor Prompt 6:**
```
Enhance travelProvider.ts to include perfect day opportunities.

Current provider gives:
- Current deals
- Seasonal recommendations
- Travel context

Add to the context:
1. Perfect day opportunities (top 3)
2. Savings percentages
3. Urgency indicators
4. Booking recommendations

Update buildTravelContext() to include:
"🎯 PERFECT DAYS: Hotel X (Date Y) - €Z/night (X% savings)"
```

### Phase 4: Testing & Validation (1 hour)

**Cursor Prompt 7:**
```
Test the perfect day detection system.

Create test scenarios:
1. Query: "Show me perfect booking days"
2. Query: "What are the best hotel deals right now?"
3. Query: "Find luxury hotels with big savings"

Expected responses should include:
- Perfect day opportunities
- Savings percentages
- Urgency indicators
- Booking recommendations

Verify all actions work together and provide consistent perfect day information.
```

## Target Hotels

### Our 10 Curated Luxury Hotels
The system will focus on these specific hotels from our existing database:

**Biarritz (4 hotels):**
- Hôtel du Palais (biarritz_palace)
- Hôtel Villa Eugénie (biarritz_regina) 
- Sofitel Biarritz Le Miramar (biarritz_sofitel)
- Beaumanoir Small Luxury Hotels (biarritz_beaumanoir)

**Bordeaux (3 hotels):**
- InterContinental Bordeaux (bordeaux_intercontinental)
- Burdigala Hotel (bordeaux_burdigala)
- La Grand'Maison Hotel & Restaurant (bordeaux_la_grand_maison)

**Monaco (3 hotels):**
- Hotel Hermitage Monte-Carlo (monaco_hermitage)
- Hotel Metropole Monte-Carlo (monaco_metropole)
- Monte-Carlo Bay Hotel & Resort (monaco_monte_carlo_bay)
- Port Palace (monaco_port_palace)

### Google Hotels Scraping Strategy
- Use existing `curatedHotels` array from TravelDataService
- Extract specific hotel URLs from the database
- Scrape individual hotel pages for price charts
- Focus on visual trend analysis for each property

## Technical Implementation Details

### Database Schema (Add to existing)
```sql
-- Add to existing database
CREATE TABLE IF NOT EXISTS perfect_day_opportunities (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(50) NOT NULL,
  perfect_date DATE NOT NULL,
  current_rate DECIMAL(10,2) NOT NULL,
  average_rate DECIMAL(10,2) NOT NULL,
  savings_percentage DECIMAL(5,2) NOT NULL,
  confidence_score INTEGER NOT NULL,
  reasons TEXT[],
  urgency VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(hotel_id, perfect_date)
);
```

### Key Interfaces to Add
```typescript
// Add to TravelDataService.ts
interface PerfectDayOpportunity {
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

// Add to existing actions
interface EnhancedOptimizationResult {
  perfectDays: PerfectDayOpportunity[];
  // ... existing fields
}
```

## Success Criteria (End of Day)

### Functional Requirements
- ✅ Agent responds to "perfect booking days" queries
- ✅ Shows 10%+ savings opportunities
- ✅ Covers all 10 curated hotels
- ✅ Response time <5 seconds
- ✅ Integrates with existing actions

### Technical Requirements
- ✅ Google Hotels scraping integration
- ✅ Perfect day detection algorithm
- ✅ Enhanced action responses
- ✅ Provider context updates
- ✅ Error handling and fallbacks

## Risk Mitigation

### Technical Risks
1. **Scraping Rate Limits**: Use intelligent delays and user agents
2. **Data Quality**: Fallback to simulated data if scraping fails
3. **Algorithm Accuracy**: Start with 10% threshold, adjust based on testing

### Time Risks
1. **Scope Creep**: Focus only on perfect day detection
2. **Integration Issues**: Leverage existing service architecture
3. **Testing Delays**: Use existing test patterns

## Cursor Workflow

### Morning (4 hours)
1. **9-11 AM**: Rate data service enhancement
2. **11-1 PM**: Action enhancement

### Afternoon (4 hours)
1. **1-2 PM**: Provider enhancement
2. **2-4 PM**: Testing and validation
3. **4-5 PM**: Final integration and polish

### Key Cursor Tips
- Use existing code patterns and interfaces
- Leverage TypeScript for type safety
- Follow ElizaOS service/action/provider patterns
- Test incrementally after each enhancement
- Use existing error handling patterns
- Add Puppeteer dependency: `bun add puppeteer`
- Use headless browser for scraping
- Implement intelligent delays between requests

## Expected User Experience

### Query: "Show me perfect booking days"
**Response:**
```
🎯 PERFECT DAYS DETECTED:

• Hôtel du Palais Biarritz: Dec 15, 2024 - €450/night (15% below average)
  💰 Save €80/night | 🔥 High urgency | Book immediately

• Hotel Hermitage Monte-Carlo: Jan 5, 2025 - €720/night (12% below average)  
  💰 Save €100/night | ⚡ Medium urgency | Book within 7 days

• Les Sources de Caudalie: Dec 20, 2024 - €280/night (18% below average)
  💰 Save €60/night | 🔥 High urgency | Book immediately

3 perfect opportunities found. Bitcoin wealth enables swift decisions.
```

## Conclusion

This one-day implementation leverages your strong ElizaOS foundation to add the critical missing piece: **perfect day detection**. 

**Key Success Factors:**
1. Use existing service architecture
2. Enhance, don't rebuild
3. Focus on core algorithm
4. Leverage Cursor's code understanding
5. Test incrementally

**Deliverable**: Agent that identifies perfect booking days with 10%+ savings across all 10 luxury hotels.

**Next Day**: Monitor performance, adjust thresholds, add advanced features.
