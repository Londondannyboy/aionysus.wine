import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface Wine {
  id: number;
  slug: string;
  name: string;
  winery: string | null;
  vintage: number | null;
  price_retail: number;
  region: string | null;
  sub_region: string | null;
  country: string | null;
  wine_type: string | null;
  grape_variety: string | null;
  description: string | null;
  image_url: string | null;
  source_url: string | null;
  investment_score: number | null;
  price_trend: 'rising' | 'stable' | 'declining' | null;
  drinking_window_start: number | null;
  drinking_window_peak: number | null;
  drinking_window_end: number | null;
  estimated_critic_score: number | null;
  body: 'light' | 'medium' | 'full' | null;
  tannins: 'low' | 'medium' | 'high' | null;
  acidity: 'low' | 'medium' | 'high' | null;
  sweetness: 'dry' | 'off-dry' | 'sweet' | null;
  aromas: string[] | null;
  flavors: string[] | null;
  tasting_notes: string | null;
  mdx_content: string | null;
  shopify_product_id: string | null;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface WineRegion {
  id: number;
  slug: string;
  name: string;
  country: string;
  seo_title: string | null;
  seo_description: string | null;
  hero_title: string | null;
  introduction: string | null;
  wine_count: number;
  avg_price: number | null;
}

export interface FoodPairing {
  id: number;
  slug: string;
  name: string;
  category: string | null;
  seo_title: string | null;
  page_intro: string | null;
}

// Wine queries
export async function getWines(filters?: {
  region?: string;
  wine_type?: string;
  max_price?: number;
  min_price?: number;
  limit?: number;
  offset?: number;
}): Promise<Wine[]> {
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  // Use tagged template for Neon serverless driver
  // For simplicity, fetch all wines and filter in memory (fine for ~500 wines)
  let result;

  if (filters?.region && filters?.wine_type) {
    result = await sql`
      SELECT * FROM wines
      WHERE in_stock = true
        AND region ILIKE ${'%' + filters.region + '%'}
        AND wine_type = ${filters.wine_type}
      ORDER BY investment_score DESC NULLS LAST, price_retail DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (filters?.region) {
    result = await sql`
      SELECT * FROM wines
      WHERE in_stock = true
        AND region ILIKE ${'%' + filters.region + '%'}
      ORDER BY investment_score DESC NULLS LAST, price_retail DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (filters?.wine_type) {
    result = await sql`
      SELECT * FROM wines
      WHERE in_stock = true
        AND wine_type = ${filters.wine_type}
      ORDER BY investment_score DESC NULLS LAST, price_retail DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    result = await sql`
      SELECT * FROM wines
      WHERE in_stock = true
      ORDER BY investment_score DESC NULLS LAST, price_retail DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  // Apply price filters in memory if needed
  let wines = result as Wine[];
  if (filters?.max_price) {
    wines = wines.filter(w => w.price_retail <= filters.max_price!);
  }
  if (filters?.min_price) {
    wines = wines.filter(w => w.price_retail >= filters.min_price!);
  }

  return wines;
}

export async function getWineBySlug(slug: string): Promise<Wine | null> {
  const result = await sql`
    SELECT * FROM wines WHERE slug = ${slug} LIMIT 1
  `;
  return (result[0] as Wine) || null;
}

export async function searchWines(query: string, limit = 20): Promise<Wine[]> {
  const result = await sql`
    SELECT * FROM wines
    WHERE to_tsvector('english', name || ' ' || COALESCE(winery, '')) @@ plainto_tsquery('english', ${query})
    OR name ILIKE ${'%' + query + '%'}
    OR winery ILIKE ${'%' + query + '%'}
    ORDER BY investment_score DESC NULLS LAST
    LIMIT ${limit}
  `;
  return result as Wine[];
}

export async function getWinesByRegion(region: string): Promise<Wine[]> {
  const result = await sql`
    SELECT * FROM wines
    WHERE region ILIKE ${region + '%'}
    ORDER BY investment_score DESC NULLS LAST
    LIMIT 50
  `;
  return result as Wine[];
}

export async function getWinesByPairing(pairingSlug: string): Promise<Wine[]> {
  const result = await sql`
    SELECT w.* FROM wines w
    JOIN wine_food_pairings wfp ON w.id = wfp.wine_id
    JOIN food_pairings fp ON wfp.pairing_id = fp.id
    WHERE fp.slug = ${pairingSlug}
    ORDER BY wfp.pairing_score DESC, w.investment_score DESC
    LIMIT 50
  `;
  return result as Wine[];
}

// Region queries
export async function getAllRegions(): Promise<WineRegion[]> {
  const result = await sql`
    SELECT * FROM wine_regions ORDER BY wine_count DESC
  `;
  return result as WineRegion[];
}

export async function getRegionBySlug(slug: string): Promise<WineRegion | null> {
  const result = await sql`
    SELECT * FROM wine_regions WHERE slug = ${slug} LIMIT 1
  `;
  return (result[0] as WineRegion) || null;
}

// Pairing queries
export async function getAllPairings(): Promise<FoodPairing[]> {
  const result = await sql`
    SELECT * FROM food_pairings ORDER BY name
  `;
  return result as FoodPairing[];
}

export async function getPairingBySlug(slug: string): Promise<FoodPairing | null> {
  const result = await sql`
    SELECT * FROM food_pairings WHERE slug = ${slug} LIMIT 1
  `;
  return (result[0] as FoodPairing) || null;
}
