/**
 * Wine Investment Data Setup
 *
 * Creates wine_investment_data table and seeds with realistic investment metrics
 * based on wine characteristics (region, classification, vintage, etc.)
 *
 * Usage: npx tsx scripts/setup-investment-data.ts
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

// Investment profiles based on region/classification
const INVESTMENT_PROFILES: Record<string, {
  baseReturn: number      // Base annual return %
  volatility: number      // 1-10
  liquidity: number       // 1-10
  premiumMultiplier: number
}> = {
  // Premium Bordeaux
  'Pauillac': { baseReturn: 8, volatility: 3, liquidity: 9, premiumMultiplier: 1.5 },
  'Margaux': { baseReturn: 7.5, volatility: 3, liquidity: 9, premiumMultiplier: 1.4 },
  'St Julien': { baseReturn: 7, volatility: 3, liquidity: 8, premiumMultiplier: 1.3 },
  'St Estèphe': { baseReturn: 6.5, volatility: 4, liquidity: 8, premiumMultiplier: 1.2 },
  'Pessac-Léognan': { baseReturn: 7, volatility: 3, liquidity: 8, premiumMultiplier: 1.3 },
  'Pomerol': { baseReturn: 9, volatility: 4, liquidity: 7, premiumMultiplier: 1.6 },
  'St Emilion': { baseReturn: 7.5, volatility: 4, liquidity: 8, premiumMultiplier: 1.3 },

  // Burgundy
  'Côte de Nuits': { baseReturn: 12, volatility: 5, liquidity: 6, premiumMultiplier: 2.0 },
  'Côte de Beaune': { baseReturn: 10, volatility: 5, liquidity: 6, premiumMultiplier: 1.7 },
  'Chablis': { baseReturn: 6, volatility: 4, liquidity: 7, premiumMultiplier: 1.1 },
  'Gevrey-Chambertin': { baseReturn: 11, volatility: 5, liquidity: 6, premiumMultiplier: 1.8 },
  'Vosne-Romanée': { baseReturn: 15, volatility: 6, liquidity: 5, premiumMultiplier: 2.5 },
  'Chambolle-Musigny': { baseReturn: 11, volatility: 5, liquidity: 6, premiumMultiplier: 1.8 },
  'Nuits-St-Georges': { baseReturn: 9, volatility: 5, liquidity: 6, premiumMultiplier: 1.5 },
  'Meursault': { baseReturn: 8, volatility: 4, liquidity: 7, premiumMultiplier: 1.4 },
  'Puligny-Montrachet': { baseReturn: 10, volatility: 5, liquidity: 6, premiumMultiplier: 1.7 },

  // Champagne
  'Champagne': { baseReturn: 5, volatility: 2, liquidity: 9, premiumMultiplier: 1.2 },

  // Rhône
  'Côte-Rôtie': { baseReturn: 8, volatility: 4, liquidity: 6, premiumMultiplier: 1.4 },
  'Hermitage': { baseReturn: 9, volatility: 4, liquidity: 6, premiumMultiplier: 1.5 },
  'Châteauneuf-du-Pape': { baseReturn: 6, volatility: 4, liquidity: 7, premiumMultiplier: 1.2 },

  // Italy
  'Barolo': { baseReturn: 8, volatility: 5, liquidity: 6, premiumMultiplier: 1.4 },
  'Barbaresco': { baseReturn: 7, volatility: 5, liquidity: 6, premiumMultiplier: 1.3 },
  'Brunello di Montalcino': { baseReturn: 7, volatility: 5, liquidity: 6, premiumMultiplier: 1.3 },
  'Bolgheri': { baseReturn: 6, volatility: 4, liquidity: 7, premiumMultiplier: 1.2 },

  // English Wine - Vic's favourites!
  'Sussex': { baseReturn: 12, volatility: 7, liquidity: 4, premiumMultiplier: 1.8 },
  'Kent': { baseReturn: 10, volatility: 7, liquidity: 4, premiumMultiplier: 1.5 },
  'Hampshire': { baseReturn: 11, volatility: 7, liquidity: 4, premiumMultiplier: 1.6 },
  'England': { baseReturn: 11, volatility: 7, liquidity: 4, premiumMultiplier: 1.6 },

  // Default for other regions
  'default': { baseReturn: 4, volatility: 5, liquidity: 5, premiumMultiplier: 1.0 },
}

// Classification multipliers
const CLASSIFICATION_MULTIPLIERS: Record<string, number> = {
  '1er Cru': 1.8,
  '1er Grand Cru': 2.0,
  'Grand Cru': 1.6,
  'Premier Cru': 1.5,
  '2ème Cru': 1.4,
  '3ème Cru': 1.3,
  '4ème Cru': 1.2,
  '5ème Cru': 1.1,
  'Cru Bourgeois': 1.05,
}

function getInvestmentProfile(region: string | null, country: string | null) {
  if (!region) return INVESTMENT_PROFILES['default']

  // Check for exact match first
  if (INVESTMENT_PROFILES[region]) {
    return INVESTMENT_PROFILES[region]
  }

  // Check for partial matches
  for (const [key, profile] of Object.entries(INVESTMENT_PROFILES)) {
    if (region.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(region.toLowerCase())) {
      return profile
    }
  }

  // Check country for English wines
  if (country?.toLowerCase() === 'england' || country?.toLowerCase() === 'uk') {
    return INVESTMENT_PROFILES['England']
  }

  return INVESTMENT_PROFILES['default']
}

function getClassificationMultiplier(classification: string | null, name: string): number {
  if (!classification && !name) return 1.0

  const searchText = `${classification || ''} ${name}`.toLowerCase()

  for (const [key, multiplier] of Object.entries(CLASSIFICATION_MULTIPLIERS)) {
    if (searchText.includes(key.toLowerCase())) {
      return multiplier
    }
  }

  return 1.0
}

function generateHistoricalPrices(
  currentPrice: number,
  annualReturn: number,
  volatility: number
): { price2020: number; price2021: number; price2022: number; price2023: number; price2024: number; price2025: number } {
  // Work backwards from current price
  const prices: number[] = [currentPrice]
  const baseGrowth = 1 + (annualReturn / 100)

  for (let i = 0; i < 5; i++) {
    // Add some randomness based on volatility
    const variance = (Math.random() - 0.5) * (volatility / 10) * 0.2
    const growth = baseGrowth + variance
    const prevPrice = prices[0] / growth
    prices.unshift(Math.round(prevPrice * 100) / 100)
  }

  return {
    price2020: prices[0],
    price2021: prices[1],
    price2022: prices[2],
    price2023: prices[3],
    price2024: prices[4],
    price2025: prices[5],
  }
}

function calculateInvestmentRating(annualReturn: number, volatility: number, liquidity: number): string {
  // Score based on risk-adjusted returns
  const sharpeProxy = (annualReturn - 2) / (volatility * 1.5) // Simplified Sharpe-like ratio
  const liquidityBonus = liquidity / 20

  const score = sharpeProxy + liquidityBonus

  if (score >= 1.5) return 'A+'
  if (score >= 1.2) return 'A'
  if (score >= 0.9) return 'B+'
  if (score >= 0.6) return 'B'
  return 'C'
}

function getAnalystRecommendation(annualReturn: number, rating: string): string {
  if (rating === 'A+' || rating === 'A') return 'BUY'
  if (rating === 'B+' && annualReturn > 7) return 'BUY'
  if (rating === 'B+' || rating === 'B') return 'HOLD'
  return 'HOLD'
}

async function main() {
  console.log('='.repeat(60))
  console.log('Wine Investment Data Setup')
  console.log('='.repeat(60))

  // Create table
  console.log('\nCreating wine_investment_data table...')

  await sql`
    CREATE TABLE IF NOT EXISTS wine_investment_data (
      id SERIAL PRIMARY KEY,
      wine_id INTEGER REFERENCES wines_original(id) ON DELETE CASCADE,

      -- Historical Performance
      price_2020 DECIMAL(10,2),
      price_2021 DECIMAL(10,2),
      price_2022 DECIMAL(10,2),
      price_2023 DECIMAL(10,2),
      price_2024 DECIMAL(10,2),
      price_2025 DECIMAL(10,2),

      -- Investment Metrics
      annual_return_pct DECIMAL(5,2),
      volatility_score INTEGER CHECK (volatility_score >= 1 AND volatility_score <= 10),
      investment_rating VARCHAR(2),
      liquidity_score INTEGER CHECK (liquidity_score >= 1 AND liquidity_score <= 10),

      -- Predictions
      projected_5yr_return DECIMAL(5,2),
      analyst_recommendation VARCHAR(20),

      -- Metadata
      last_updated TIMESTAMP DEFAULT NOW(),

      UNIQUE(wine_id)
    )
  `

  console.log('Table created!')

  // Get all wines
  console.log('\nFetching wines...')
  const wines = await sql`
    SELECT id, name, region, country, classification, price_retail
    FROM wines
    WHERE is_active = true AND price_retail IS NOT NULL AND price_retail > 0
  `

  console.log(`Found ${wines.length} wines with prices`)

  // Generate and insert investment data
  console.log('\nGenerating investment data...')

  let processed = 0
  let skipped = 0

  for (const wine of wines) {
    try {
      const currentPrice = parseFloat(wine.price_retail) || 50
      const profile = getInvestmentProfile(wine.region, wine.country)
      const classMultiplier = getClassificationMultiplier(wine.classification, wine.name)

      // Calculate metrics
      const annualReturn = Math.round((profile.baseReturn * classMultiplier + (Math.random() - 0.5) * 2) * 10) / 10
      const volatility = Math.min(10, Math.max(1, profile.volatility + Math.floor(Math.random() * 3) - 1))
      const liquidity = Math.min(10, Math.max(1, profile.liquidity + Math.floor(Math.random() * 3) - 1))

      const rating = calculateInvestmentRating(annualReturn, volatility, liquidity)
      const recommendation = getAnalystRecommendation(annualReturn, rating)
      const projected5yr = Math.round(annualReturn * 5 * (1 + Math.random() * 0.2) * 10) / 10

      const prices = generateHistoricalPrices(currentPrice, annualReturn, volatility)

      // Insert or update
      await sql`
        INSERT INTO wine_investment_data (
          wine_id, price_2020, price_2021, price_2022, price_2023, price_2024, price_2025,
          annual_return_pct, volatility_score, investment_rating, liquidity_score,
          projected_5yr_return, analyst_recommendation
        ) VALUES (
          ${wine.id}, ${prices.price2020}, ${prices.price2021}, ${prices.price2022},
          ${prices.price2023}, ${prices.price2024}, ${prices.price2025},
          ${annualReturn}, ${volatility}, ${rating}, ${liquidity},
          ${projected5yr}, ${recommendation}
        )
        ON CONFLICT (wine_id) DO UPDATE SET
          price_2020 = EXCLUDED.price_2020,
          price_2021 = EXCLUDED.price_2021,
          price_2022 = EXCLUDED.price_2022,
          price_2023 = EXCLUDED.price_2023,
          price_2024 = EXCLUDED.price_2024,
          price_2025 = EXCLUDED.price_2025,
          annual_return_pct = EXCLUDED.annual_return_pct,
          volatility_score = EXCLUDED.volatility_score,
          investment_rating = EXCLUDED.investment_rating,
          liquidity_score = EXCLUDED.liquidity_score,
          projected_5yr_return = EXCLUDED.projected_5yr_return,
          analyst_recommendation = EXCLUDED.analyst_recommendation,
          last_updated = NOW()
      `

      processed++

      if (processed % 500 === 0) {
        console.log(`  Processed ${processed}/${wines.length}...`)
      }
    } catch (error) {
      skipped++
      console.error(`  Error for wine ${wine.id}: ${error}`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('SETUP COMPLETE')
  console.log('='.repeat(60))
  console.log(`Processed: ${processed}`)
  console.log(`Skipped: ${skipped}`)

  // Show sample data
  const samples = await sql`
    SELECT w.name, w.region, i.annual_return_pct, i.investment_rating, i.analyst_recommendation
    FROM wine_investment_data i
    JOIN wines w ON w.id = i.wine_id
    ORDER BY i.annual_return_pct DESC
    LIMIT 10
  `

  console.log('\nTop 10 Investment Wines:')
  for (const s of samples) {
    console.log(`  ${s.investment_rating} | ${s.annual_return_pct}% | ${s.analyst_recommendation} | ${s.name} (${s.region})`)
  }

  // Show English wine investments (Vic's picks!)
  const englishWines = await sql`
    SELECT w.name, w.region, i.annual_return_pct, i.investment_rating, i.analyst_recommendation
    FROM wine_investment_data i
    JOIN wines w ON w.id = i.wine_id
    WHERE w.country ILIKE '%england%' OR w.country ILIKE '%uk%'
    ORDER BY i.annual_return_pct DESC
    LIMIT 5
  `

  if (englishWines.length > 0) {
    console.log('\nEnglish Wine Investments (Vic\'s Picks!):')
    for (const s of englishWines) {
      console.log(`  ${s.investment_rating} | ${s.annual_return_pct}% | ${s.analyst_recommendation} | ${s.name}`)
    }
  }
}

main().catch(console.error)
