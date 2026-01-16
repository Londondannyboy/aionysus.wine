/**
 * Run database schema using Neon serverless driver
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function runSchema() {
  console.log('Dropping old tables...');
  await sql`DROP TABLE IF EXISTS wine_food_pairings CASCADE`;
  await sql`DROP TABLE IF EXISTS food_pairings CASCADE`;
  await sql`DROP TABLE IF EXISTS wine_regions CASCADE`;
  await sql`DROP TABLE IF EXISTS wines CASCADE`;
  console.log('  ✓ old tables dropped');

  console.log('\nCreating tables...');

  // Create wines table
  await sql`
    CREATE TABLE IF NOT EXISTS wines (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      winery TEXT,
      vintage INTEGER,
      price_retail DECIMAL(10,2) NOT NULL,
      region TEXT,
      sub_region TEXT,
      country TEXT,
      wine_type TEXT,
      grape_variety TEXT,
      description TEXT,
      image_url TEXT,
      source_url TEXT,
      investment_score INTEGER,
      price_trend TEXT,
      drinking_window_start INTEGER,
      drinking_window_peak INTEGER,
      drinking_window_end INTEGER,
      estimated_critic_score INTEGER,
      body TEXT,
      tannins TEXT,
      acidity TEXT,
      sweetness TEXT,
      aromas TEXT[],
      flavors TEXT[],
      tasting_notes TEXT,
      mdx_content TEXT,
      shopify_product_id TEXT,
      shopify_variant_id TEXT,
      in_stock BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✓ wines table');

  // Create wine_regions table
  await sql`
    CREATE TABLE IF NOT EXISTS wine_regions (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      parent_region TEXT,
      seo_title TEXT,
      seo_description TEXT,
      hero_title TEXT,
      hero_subtitle TEXT,
      introduction TEXT,
      terroir_notes TEXT,
      climate TEXT,
      notable_grapes TEXT[],
      wine_count INTEGER DEFAULT 0,
      avg_price DECIMAL(10,2),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✓ wine_regions table');

  // Create food_pairings table
  await sql`
    CREATE TABLE IF NOT EXISTS food_pairings (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      seo_title TEXT,
      seo_description TEXT,
      page_intro TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✓ food_pairings table');

  // Create wine_food_pairings table
  await sql`
    CREATE TABLE IF NOT EXISTS wine_food_pairings (
      wine_id INTEGER REFERENCES wines(id) ON DELETE CASCADE,
      pairing_id INTEGER REFERENCES food_pairings(id) ON DELETE CASCADE,
      pairing_score INTEGER DEFAULT 5,
      pairing_notes TEXT,
      PRIMARY KEY (wine_id, pairing_id)
    )
  `;
  console.log('  ✓ wine_food_pairings table');

  // Create indexes
  console.log('\nCreating indexes...');
  await sql`CREATE INDEX IF NOT EXISTS idx_wines_slug ON wines(slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_wines_region ON wines(region)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_wines_wine_type ON wines(wine_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_wines_in_stock ON wines(in_stock)`;
  console.log('  ✓ indexes created');

  // Seed food pairings
  console.log('\nSeeding food pairings...');
  const pairings = [
    { slug: 'steak', name: 'Steak', category: 'meat' },
    { slug: 'lamb', name: 'Lamb', category: 'meat' },
    { slug: 'chicken', name: 'Chicken', category: 'meat' },
    { slug: 'fish', name: 'Fish', category: 'seafood' },
    { slug: 'seafood', name: 'Seafood', category: 'seafood' },
    { slug: 'cheese', name: 'Cheese', category: 'cheese' },
    { slug: 'pasta', name: 'Pasta', category: 'vegetarian' },
    { slug: 'dessert', name: 'Dessert', category: 'dessert' },
    { slug: 'celebration', name: 'Celebration', category: 'occasion' },
  ];

  for (const p of pairings) {
    await sql`
      INSERT INTO food_pairings (slug, name, category)
      VALUES (${p.slug}, ${p.name}, ${p.category})
      ON CONFLICT (slug) DO NOTHING
    `;
  }
  console.log('  ✓ food pairings seeded');

  // Seed wine regions
  console.log('\nSeeding wine regions...');
  const regions = [
    { slug: 'bordeaux', name: 'Bordeaux', country: 'France' },
    { slug: 'burgundy', name: 'Burgundy', country: 'France' },
    { slug: 'champagne', name: 'Champagne', country: 'France' },
    { slug: 'rhone', name: 'Rhône', country: 'France' },
    { slug: 'tuscany', name: 'Tuscany', country: 'Italy' },
    { slug: 'piedmont', name: 'Piedmont', country: 'Italy' },
    { slug: 'rioja', name: 'Rioja', country: 'Spain' },
    { slug: 'napa-valley', name: 'Napa Valley', country: 'USA' },
    { slug: 'marlborough', name: 'Marlborough', country: 'New Zealand' },
    { slug: 'barossa-valley', name: 'Barossa Valley', country: 'Australia' },
  ];

  for (const r of regions) {
    await sql`
      INSERT INTO wine_regions (slug, name, country, hero_title)
      VALUES (${r.slug}, ${r.name}, ${r.country}, ${r.name + ' Wines'})
      ON CONFLICT (slug) DO NOTHING
    `;
  }
  console.log('  ✓ wine regions seeded');

  // Seed sample wines
  console.log('\nSeeding sample wines...');

  const wines = [
    {
      slug: 'chateau-margaux-2015',
      name: 'Chateau Margaux 2015',
      winery: 'Chateau Margaux',
      vintage: 2015,
      price_retail: 650.00,
      region: 'Bordeaux',
      country: 'France',
      wine_type: 'red',
      grape_variety: 'Cabernet Sauvignon',
      investment_score: 95,
      price_trend: 'rising',
      drinking_window_start: 2025,
      drinking_window_peak: 2035,
      drinking_window_end: 2055,
      estimated_critic_score: 98,
      body: 'full',
      tannins: 'high',
      acidity: 'medium',
      sweetness: 'dry',
      aromas: ['blackcurrant', 'violet', 'cedar', 'graphite'],
      flavors: ['cassis', 'dark chocolate', 'tobacco', 'minerals'],
      tasting_notes: 'An exceptional vintage showing remarkable elegance and power.',
    },
    {
      slug: 'opus-one-2019',
      name: 'Opus One 2019',
      winery: 'Opus One Winery',
      vintage: 2019,
      price_retail: 450.00,
      region: 'Napa Valley',
      country: 'USA',
      wine_type: 'red',
      grape_variety: 'Cabernet Sauvignon',
      investment_score: 88,
      price_trend: 'stable',
      drinking_window_start: 2024,
      drinking_window_peak: 2030,
      drinking_window_end: 2045,
      estimated_critic_score: 96,
      body: 'full',
      tannins: 'medium',
      acidity: 'medium',
      sweetness: 'dry',
      aromas: ['blackberry', 'cassis', 'vanilla', 'mocha'],
      flavors: ['dark fruit', 'espresso', 'sweet spice', 'graphite'],
      tasting_notes: 'A harmonious blend showcasing the best of Napa Valley.',
    },
    {
      slug: 'dom-perignon-2012',
      name: 'Dom Perignon 2012',
      winery: 'Moet & Chandon',
      vintage: 2012,
      price_retail: 220.00,
      region: 'Champagne',
      country: 'France',
      wine_type: 'sparkling',
      grape_variety: 'Chardonnay/Pinot Noir',
      investment_score: 82,
      price_trend: 'rising',
      drinking_window_start: 2022,
      drinking_window_peak: 2027,
      drinking_window_end: 2040,
      estimated_critic_score: 95,
      body: 'medium',
      tannins: 'low',
      acidity: 'high',
      sweetness: 'dry',
      aromas: ['brioche', 'citrus', 'white flowers', 'almond'],
      flavors: ['lemon', 'toast', 'honey', 'minerality'],
      tasting_notes: 'A luminous champagne with exceptional balance.',
    },
    {
      slug: 'cloudy-bay-sauvignon-blanc-2023',
      name: 'Cloudy Bay Sauvignon Blanc 2023',
      winery: 'Cloudy Bay',
      vintage: 2023,
      price_retail: 28.00,
      region: 'Marlborough',
      country: 'New Zealand',
      wine_type: 'white',
      grape_variety: 'Sauvignon Blanc',
      investment_score: 45,
      price_trend: 'stable',
      drinking_window_start: 2024,
      drinking_window_peak: 2025,
      drinking_window_end: 2027,
      estimated_critic_score: 90,
      body: 'light',
      tannins: 'low',
      acidity: 'high',
      sweetness: 'dry',
      aromas: ['grapefruit', 'passionfruit', 'fresh herbs', 'lime'],
      flavors: ['citrus', 'gooseberry', 'mineral', 'green apple'],
      tasting_notes: 'Crisp and vibrant with explosive aromatics.',
    },
    {
      slug: 'whispering-angel-rose-2023',
      name: 'Whispering Angel Rose 2023',
      winery: 'Chateau dEsclans',
      vintage: 2023,
      price_retail: 22.00,
      region: 'Provence',
      country: 'France',
      wine_type: 'rose',
      grape_variety: 'Grenache/Rolle',
      investment_score: 35,
      price_trend: 'stable',
      drinking_window_start: 2024,
      drinking_window_peak: 2024,
      drinking_window_end: 2025,
      estimated_critic_score: 88,
      body: 'light',
      tannins: 'low',
      acidity: 'medium',
      sweetness: 'dry',
      aromas: ['strawberry', 'peach', 'citrus', 'herbs'],
      flavors: ['red fruit', 'melon', 'mineral', 'fresh herbs'],
      tasting_notes: 'The benchmark for Provence rose.',
    },
  ];

  for (const w of wines) {
    await sql`
      INSERT INTO wines (
        slug, name, winery, vintage, price_retail, region, country, wine_type,
        grape_variety, investment_score, price_trend, drinking_window_start,
        drinking_window_peak, drinking_window_end, estimated_critic_score,
        body, tannins, acidity, sweetness, aromas, flavors, tasting_notes, in_stock
      ) VALUES (
        ${w.slug}, ${w.name}, ${w.winery}, ${w.vintage}, ${w.price_retail},
        ${w.region}, ${w.country}, ${w.wine_type}, ${w.grape_variety},
        ${w.investment_score}, ${w.price_trend}, ${w.drinking_window_start},
        ${w.drinking_window_peak}, ${w.drinking_window_end}, ${w.estimated_critic_score},
        ${w.body}, ${w.tannins}, ${w.acidity}, ${w.sweetness}, ${w.aromas},
        ${w.flavors}, ${w.tasting_notes}, true
      )
      ON CONFLICT (slug) DO UPDATE SET
        price_retail = EXCLUDED.price_retail,
        investment_score = EXCLUDED.investment_score,
        updated_at = NOW()
    `;
    console.log(`  ✓ ${w.name}`);
  }

  console.log('\n✅ Schema complete! Database ready.');
}

runSchema().catch(console.error);
