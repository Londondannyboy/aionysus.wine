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

-- Sample wine data for testing
INSERT INTO wines (slug, name, winery, vintage, price_retail, region, country, wine_type, grape_variety, investment_score, price_trend, drinking_window_start, drinking_window_peak, drinking_window_end, estimated_critic_score, body, tannins, acidity, sweetness, aromas, flavors, tasting_notes, in_stock) VALUES
('chateau-margaux-2015', 'Chateau Margaux 2015', 'Chateau Margaux', 2015, 650.00, 'Bordeaux', 'France', 'red', 'Cabernet Sauvignon', 95, 'rising', 2025, 2035, 2055, 98, 'full', 'high', 'medium', 'dry', ARRAY['blackcurrant', 'violet', 'cedar', 'graphite'], ARRAY['cassis', 'dark chocolate', 'tobacco', 'minerals'], 'An exceptional vintage showing remarkable elegance and power. Deep purple with complex aromas of blackcurrant and violet, leading to a palate of extraordinary depth and finesse.', true),

('opus-one-2019', 'Opus One 2019', 'Opus One Winery', 2019, 450.00, 'Napa Valley', 'USA', 'red', 'Cabernet Sauvignon', 88, 'stable', 2024, 2030, 2045, 96, 'full', 'medium', 'medium', 'dry', ARRAY['blackberry', 'cassis', 'vanilla', 'mocha'], ARRAY['dark fruit', 'espresso', 'sweet spice', 'graphite'], 'A harmonious blend showcasing the best of Napa Valley. Rich and opulent with layers of dark fruit, perfectly integrated oak, and a long, silky finish.', true),

('dom-perignon-2012', 'Dom Perignon 2012', 'Moet & Chandon', 2012, 220.00, 'Champagne', 'France', 'sparkling', 'Chardonnay/Pinot Noir', 82, 'rising', 2022, 2027, 2040, 95, 'medium', 'low', 'high', 'dry', ARRAY['brioche', 'citrus', 'white flowers', 'almond'], ARRAY['lemon', 'toast', 'honey', 'minerality'], 'A luminous champagne with exceptional balance. Fine, persistent bubbles carry notes of citrus and brioche to an incredibly long, refined finish.', true),

('penfolds-grange-2018', 'Penfolds Grange 2018', 'Penfolds', 2018, 850.00, 'Barossa Valley', 'Australia', 'red', 'Shiraz', 90, 'rising', 2028, 2040, 2060, 97, 'full', 'high', 'medium', 'dry', ARRAY['blackberry', 'dark chocolate', 'licorice', 'vanilla'], ARRAY['plum', 'spice', 'mocha', 'earth'], 'Australia iconic wine at its finest. Intensely concentrated with waves of dark fruit, chocolate, and spice building to a powerful yet elegant finish.', true),

('cloudy-bay-sauvignon-blanc-2023', 'Cloudy Bay Sauvignon Blanc 2023', 'Cloudy Bay', 2023, 28.00, 'Marlborough', 'New Zealand', 'white', 'Sauvignon Blanc', 45, 'stable', 2024, 2025, 2027, 90, 'light', 'low', 'high', 'dry', ARRAY['grapefruit', 'passionfruit', 'fresh herbs', 'lime'], ARRAY['citrus', 'gooseberry', 'mineral', 'green apple'], 'Crisp and vibrant with explosive aromatics. Classic Marlborough style with zesty citrus, tropical notes, and a refreshingly clean finish.', true),

('barolo-monfortino-2015', 'Barolo Monfortino Riserva 2015', 'Giacomo Conterno', 2015, 750.00, 'Piedmont', 'Italy', 'red', 'Nebbiolo', 94, 'rising', 2030, 2045, 2070, 99, 'full', 'high', 'high', 'dry', ARRAY['rose', 'tar', 'truffle', 'cherry'], ARRAY['dried cherry', 'licorice', 'leather', 'spice'], 'A monumental Barolo that defines the pinnacle of Nebbiolo. Ethereal aromatics of rose and tar give way to incredible depth and a finish that lasts for minutes.', true),

('veuve-clicquot-rose', 'Veuve Clicquot Rose NV', 'Veuve Clicquot', NULL, 65.00, 'Champagne', 'France', 'sparkling', 'Pinot Noir/Chardonnay', 55, 'stable', 2024, 2025, 2028, 89, 'medium', 'low', 'high', 'dry', ARRAY['strawberry', 'raspberry', 'brioche', 'citrus'], ARRAY['red berries', 'toast', 'cream', 'minerals'], 'An elegant rose champagne with beautiful salmon color. Fresh red fruit aromas lead to a palate of finesse and vivacity with a crisp, clean finish.', true),

('tignanello-2020', 'Tignanello 2020', 'Antinori', 2020, 145.00, 'Tuscany', 'Italy', 'red', 'Sangiovese', 78, 'stable', 2025, 2032, 2045, 94, 'full', 'medium', 'high', 'dry', ARRAY['cherry', 'plum', 'tobacco', 'leather'], ARRAY['red fruit', 'spice', 'oak', 'earth'], 'The original Super Tuscan continues to impress. Bright cherry fruit, elegant tannins, and characteristic Tuscan earthiness combine in perfect harmony.', true),

('whispering-angel-rose-2023', 'Whispering Angel Rose 2023', 'Chateau dEsclans', 2023, 22.00, 'Provence', 'France', 'rose', 'Grenache/Rolle', 35, 'stable', 2024, 2024, 2025, 88, 'light', 'low', 'medium', 'dry', ARRAY['strawberry', 'peach', 'citrus', 'herbs'], ARRAY['red fruit', 'melon', 'mineral', 'fresh herbs'], 'The benchmark for Provence rose. Pale pink with delicate aromas of summer fruits and a refreshingly dry, elegant palate perfect for warm days.', true),

('chateau-dyquem-2017', 'Chateau dYquem 2017', 'Chateau dYquem', 2017, 380.00, 'Bordeaux', 'France', 'dessert', 'Semillon/Sauvignon Blanc', 92, 'rising', 2025, 2040, 2080, 97, 'full', 'low', 'high', 'sweet', ARRAY['apricot', 'honey', 'saffron', 'orange peel'], ARRAY['tropical fruit', 'caramel', 'spice', 'botrytis'], 'The worlds greatest dessert wine. Luscious golden nectar with incredible complexity - layers of honey, apricot, and spice unfold endlessly on the palate.', true)

ON CONFLICT (slug) DO NOTHING;
