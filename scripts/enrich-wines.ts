/**
 * AI Wine Enrichment Script
 *
 * Adds AI-generated investment data, tasting profiles, and drinking windows
 * to wines that have been scraped but not yet enriched.
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { neon } from '@neondatabase/serverless';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const sql = neon(process.env.DATABASE_URL!);

interface EnrichedWineData {
  wine_type: string;
  region: string;
  country: string;
  grape_variety: string;
  investment_score: number;
  price_trend: string;
  drinking_window_start: number;
  drinking_window_peak: number;
  drinking_window_end: number;
  estimated_critic_score: number;
  body: string;
  tannins: string;
  acidity: string;
  sweetness: string;
  aromas: string[];
  flavors: string[];
  tasting_notes: string;
  food_pairings: string[];
}

async function enrichWine(
  name: string,
  price: number,
  description?: string
): Promise<EnrichedWineData | null> {
  const prompt = `Analyze this wine and provide structured data. Be accurate based on the wine name, producer, and region.

Wine: ${name}
Price: £${price}
Description: ${description || 'N/A'}

Return ONLY valid JSON (no markdown, no explanation) with these exact fields:
{
  "wine_type": "red" | "white" | "rose" | "sparkling" | "dessert",
  "region": "Region name (e.g., Bordeaux, Burgundy, Napa Valley)",
  "country": "Country name",
  "grape_variety": "Primary grape variety",
  "investment_score": 1-100 (based on region prestige, producer reputation, vintage quality),
  "price_trend": "rising" | "stable" | "declining",
  "drinking_window_start": year to start drinking (integer),
  "drinking_window_peak": peak drinking year (integer),
  "drinking_window_end": last year to drink (integer),
  "estimated_critic_score": 70-100,
  "body": "light" | "medium" | "full",
  "tannins": "low" | "medium" | "high" (for reds, use "low" for whites),
  "acidity": "low" | "medium" | "high",
  "sweetness": "dry" | "off-dry" | "sweet",
  "aromas": ["aroma1", "aroma2", "aroma3"] (3-5 items),
  "flavors": ["flavor1", "flavor2", "flavor3"] (3-5 items),
  "tasting_notes": "2-3 sentence unique tasting description",
  "food_pairings": ["food1", "food2", "food3"] (3-5 items)
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean up the response - remove markdown code blocks if present
    const jsonStr = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(jsonStr) as EnrichedWineData;
  } catch (error) {
    console.error(`Failed to enrich wine: ${error}`);
    return null;
  }
}

function validateEnrichment(data: EnrichedWineData): boolean {
  // Investment score in valid range
  if (data.investment_score < 1 || data.investment_score > 100) return false;

  // Drinking window makes sense
  if (data.drinking_window_start > data.drinking_window_peak) return false;
  if (data.drinking_window_peak > data.drinking_window_end) return false;

  // Critic score in valid range
  if (data.estimated_critic_score < 70 || data.estimated_critic_score > 100) return false;

  // Required arrays have items
  if (!data.aromas?.length || !data.flavors?.length) return false;

  return true;
}

async function getUnenrichedWines(): Promise<Array<{ id: number; name: string; price_retail: number; description: string | null }>> {
  const result = await sql`
    SELECT id, name, price_retail, description
    FROM wines
    WHERE investment_score IS NULL
    ORDER BY price_retail DESC
    LIMIT 50
  `;
  return result as Array<{ id: number; name: string; price_retail: number; description: string | null }>;
}

async function updateWineWithEnrichment(wineId: number, data: EnrichedWineData): Promise<void> {
  await sql`
    UPDATE wines SET
      wine_type = ${data.wine_type},
      region = ${data.region},
      country = ${data.country},
      grape_variety = ${data.grape_variety},
      investment_score = ${data.investment_score},
      price_trend = ${data.price_trend},
      drinking_window_start = ${data.drinking_window_start},
      drinking_window_peak = ${data.drinking_window_peak},
      drinking_window_end = ${data.drinking_window_end},
      estimated_critic_score = ${data.estimated_critic_score},
      body = ${data.body},
      tannins = ${data.tannins},
      acidity = ${data.acidity},
      sweetness = ${data.sweetness},
      aromas = ${data.aromas},
      flavors = ${data.flavors},
      tasting_notes = ${data.tasting_notes},
      updated_at = NOW()
    WHERE id = ${wineId}
  `;

  // Also add food pairings
  for (const food of data.food_pairings) {
    const slug = food.toLowerCase().replace(/\s+/g, '-');

    // Find or create the pairing
    const existingPairing = await sql`
      SELECT id FROM food_pairings WHERE slug = ${slug} LIMIT 1
    `;

    let pairingId: number;
    if (existingPairing.length > 0) {
      pairingId = existingPairing[0].id as number;
    } else {
      const newPairing = await sql`
        INSERT INTO food_pairings (slug, name, category)
        VALUES (${slug}, ${food}, 'meat')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;
      pairingId = newPairing[0].id as number;
    }

    // Link wine to pairing
    await sql`
      INSERT INTO wine_food_pairings (wine_id, pairing_id, pairing_score)
      VALUES (${wineId}, ${pairingId}, 7)
      ON CONFLICT (wine_id, pairing_id) DO NOTHING
    `;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('Aionysus Wine AI Enrichment');
  console.log('='.repeat(50));

  const wines = await getUnenrichedWines();

  if (wines.length === 0) {
    console.log('All wines are already enriched!');
    return;
  }

  console.log(`Found ${wines.length} wines to enrich\n`);

  let successCount = 0;
  let failCount = 0;

  for (const wine of wines) {
    console.log(`Processing: ${wine.name}`);

    const enriched = await enrichWine(wine.name, wine.price_retail, wine.description || undefined);

    if (!enriched) {
      console.log(`  ✗ Failed to generate AI data`);
      failCount++;
      continue;
    }

    if (!validateEnrichment(enriched)) {
      console.log(`  ✗ Validation failed`);
      failCount++;
      continue;
    }

    try {
      await updateWineWithEnrichment(wine.id, enriched);
      console.log(`  ✓ Score: ${enriched.investment_score}, Type: ${enriched.wine_type}, Region: ${enriched.region}`);
      successCount++;
    } catch (error) {
      console.log(`  ✗ Database error: ${error}`);
      failCount++;
    }

    // Rate limit to avoid API throttling
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Enrichment complete: ${successCount} succeeded, ${failCount} failed`);
}

main().catch(console.error);
