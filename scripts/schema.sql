-- Aionysus Wine V3 Database Schema
-- Run with: psql $DATABASE_URL -f schema.sql

-- Core wine data (scraped + AI-enriched)
CREATE TABLE IF NOT EXISTS wines (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  winery TEXT,
  vintage INTEGER,

  -- Scraped from Waddesdon
  price_retail DECIMAL(10,2) NOT NULL,
  region TEXT,
  sub_region TEXT,
  country TEXT,
  wine_type TEXT CHECK (wine_type IN ('red', 'white', 'rose', 'sparkling', 'dessert', 'fortified')),
  grape_variety TEXT,
  description TEXT,
  image_url TEXT,
  source_url TEXT,

  -- AI-generated investment data
  investment_score INTEGER CHECK (investment_score BETWEEN 1 AND 100),
  price_trend TEXT CHECK (price_trend IN ('rising', 'stable', 'declining')),
  drinking_window_start INTEGER,
  drinking_window_peak INTEGER,
  drinking_window_end INTEGER,
  estimated_critic_score INTEGER CHECK (estimated_critic_score BETWEEN 70 AND 100),

  -- AI-generated tasting profile
  body TEXT CHECK (body IN ('light', 'medium', 'full')),
  tannins TEXT CHECK (tannins IN ('low', 'medium', 'high')),
  acidity TEXT CHECK (acidity IN ('low', 'medium', 'high')),
  sweetness TEXT CHECK (sweetness IN ('dry', 'off-dry', 'sweet')),
  aromas TEXT[],
  flavors TEXT[],
  tasting_notes TEXT,

  -- Pre-generated MDX content for page
  mdx_content TEXT,

  -- Shopify integration
  shopify_product_id TEXT,
  shopify_variant_id TEXT,
  in_stock BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wine regions for SEO pages
CREATE TABLE IF NOT EXISTS wine_regions (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  parent_region TEXT,

  -- SEO content
  seo_title TEXT,
  seo_description TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,

  -- Rich content
  introduction TEXT,
  terroir_notes TEXT,
  climate TEXT,
  notable_grapes TEXT[],

  -- Statistics (computed)
  wine_count INTEGER DEFAULT 0,
  avg_price DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food pairings for SEO pages
CREATE TABLE IF NOT EXISTS food_pairings (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('meat', 'seafood', 'cheese', 'vegetarian', 'dessert', 'occasion')),

  -- SEO content
  seo_title TEXT,
  seo_description TEXT,
  page_intro TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wine to food pairing relationships
CREATE TABLE IF NOT EXISTS wine_food_pairings (
  wine_id INTEGER REFERENCES wines(id) ON DELETE CASCADE,
  pairing_id INTEGER REFERENCES food_pairings(id) ON DELETE CASCADE,
  pairing_score INTEGER DEFAULT 5 CHECK (pairing_score BETWEEN 1 AND 10),
  pairing_notes TEXT,
  PRIMARY KEY (wine_id, pairing_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wines_slug ON wines(slug);
CREATE INDEX IF NOT EXISTS idx_wines_region ON wines(region);
CREATE INDEX IF NOT EXISTS idx_wines_wine_type ON wines(wine_type);
CREATE INDEX IF NOT EXISTS idx_wines_price ON wines(price_retail);
CREATE INDEX IF NOT EXISTS idx_wines_investment_score ON wines(investment_score);
CREATE INDEX IF NOT EXISTS idx_wines_in_stock ON wines(in_stock);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_wines_search ON wines
  USING gin(to_tsvector('english', name || ' ' || COALESCE(winery, '') || ' ' || COALESCE(region, '')));

-- Region indexes
CREATE INDEX IF NOT EXISTS idx_wine_regions_slug ON wine_regions(slug);
CREATE INDEX IF NOT EXISTS idx_wine_regions_country ON wine_regions(country);

-- Pairing indexes
CREATE INDEX IF NOT EXISTS idx_food_pairings_slug ON food_pairings(slug);
CREATE INDEX IF NOT EXISTS idx_food_pairings_category ON food_pairings(category);

-- Seed common food pairings
INSERT INTO food_pairings (slug, name, category, seo_title, page_intro) VALUES
  ('steak', 'Steak', 'meat', 'Best Wines for Steak | Aionysus', 'Discover the perfect wines to pair with your steak.'),
  ('lamb', 'Lamb', 'meat', 'Best Wines for Lamb | Aionysus', 'Find wines that complement lamb dishes beautifully.'),
  ('chicken', 'Chicken', 'meat', 'Best Wines for Chicken | Aionysus', 'Explore wines perfect for chicken dishes.'),
  ('fish', 'Fish', 'seafood', 'Best Wines for Fish | Aionysus', 'Discover wines that pair wonderfully with fish.'),
  ('seafood', 'Seafood', 'seafood', 'Best Wines for Seafood | Aionysus', 'Find the perfect wines for shellfish and seafood.'),
  ('cheese', 'Cheese', 'cheese', 'Best Wines for Cheese | Aionysus', 'Classic wine and cheese pairings to try.'),
  ('pasta', 'Pasta', 'vegetarian', 'Best Wines for Pasta | Aionysus', 'Wines that elevate your pasta dishes.'),
  ('dessert', 'Dessert', 'dessert', 'Best Wines for Dessert | Aionysus', 'Sweet wines perfect for dessert course.'),
  ('celebration', 'Celebration', 'occasion', 'Best Wines for Celebration | Aionysus', 'Sparkling and special wines for celebrations.')
ON CONFLICT (slug) DO NOTHING;

-- Seed common wine regions
INSERT INTO wine_regions (slug, name, country, seo_title, hero_title) VALUES
  ('bordeaux', 'Bordeaux', 'France', 'Bordeaux Wines | Aionysus', 'Bordeaux Wines'),
  ('burgundy', 'Burgundy', 'France', 'Burgundy Wines | Aionysus', 'Burgundy Wines'),
  ('champagne', 'Champagne', 'France', 'Champagne Wines | Aionysus', 'Champagne Wines'),
  ('rhone', 'Rhône', 'France', 'Rhône Wines | Aionysus', 'Rhône Valley Wines'),
  ('tuscany', 'Tuscany', 'Italy', 'Tuscany Wines | Aionysus', 'Tuscan Wines'),
  ('piedmont', 'Piedmont', 'Italy', 'Piedmont Wines | Aionysus', 'Piedmont Wines'),
  ('rioja', 'Rioja', 'Spain', 'Rioja Wines | Aionysus', 'Rioja Wines'),
  ('napa-valley', 'Napa Valley', 'USA', 'Napa Valley Wines | Aionysus', 'Napa Valley Wines'),
  ('marlborough', 'Marlborough', 'New Zealand', 'Marlborough Wines | Aionysus', 'Marlborough Wines'),
  ('barossa-valley', 'Barossa Valley', 'Australia', 'Barossa Valley Wines | Aionysus', 'Barossa Valley Wines')
ON CONFLICT (slug) DO NOTHING;

-- Function to update wine_count in regions
CREATE OR REPLACE FUNCTION update_region_wine_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wine_regions
  SET wine_count = (
    SELECT COUNT(*) FROM wines WHERE region ILIKE wine_regions.name || '%'
  ),
  avg_price = (
    SELECT AVG(price_retail) FROM wines WHERE region ILIKE wine_regions.name || '%'
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update region stats when wines change
DROP TRIGGER IF EXISTS wines_region_stats_trigger ON wines;
CREATE TRIGGER wines_region_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON wines
FOR EACH STATEMENT
EXECUTE FUNCTION update_region_wine_count();
