# Waddesdon Wine Scraper

## Data Source

**URL**: https://waddesdonwine.co.uk/
**Platform**: Shopify
**Estimated wines**: 300-500

---

## Scraping Strategy

### Phase 1: Product Discovery

Crawl collection pages to discover all product URLs:

```typescript
// scripts/scrape-waddesdon.ts
import Firecrawl from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

// Crawl all product pages
const results = await firecrawl.crawl('https://waddesdonwine.co.uk/collections/all', {
  limit: 1000,
  scrapeOptions: {
    formats: ['markdown', 'html'],
    includeTags: ['product'],
  }
});
```

### Phase 2: Data Extraction

For each product page, extract:

| Field | Selector/Method | Required |
|-------|-----------------|----------|
| name | `<h1>` or `.product-title` | Yes |
| price | `.price` or JSON-LD | Yes |
| image_url | `.product-image img` | Yes |
| description | `.product-description` | No |
| vintage | Parse from name (regex: `\d{4}`) | No |
| region | Parse from tags/description | No |
| source_url | Page URL | Yes |

```typescript
interface ScrapedWine {
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
  vintage?: number;
  region?: string;
  sourceUrl: string;
}
```

### Phase 3: Slug Generation

Generate SEO-friendly slugs:

```typescript
function generateSlug(wine: ScrapedWine): string {
  const base = wine.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Add vintage if available
  return wine.vintage ? `${base}-${wine.vintage}` : base;
}
```

---

## AI Enrichment Pipeline

### scripts/enrich-wines.ts

For each scraped wine, generate AI-enriched data:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function enrichWine(wine: ScrapedWine): Promise<EnrichedWine> {
  const prompt = `
Analyze this wine and provide structured data:

Wine: ${wine.name}
Price: £${wine.price}
Description: ${wine.description || 'N/A'}

Return JSON with:
- wine_type: "red" | "white" | "rose" | "sparkling" | "dessert"
- region: Best guess region name
- country: Country of origin
- grape_variety: Primary grape
- investment_score: 1-100 based on region, producer, vintage
- drinking_window_start: Year to start drinking
- drinking_window_peak: Peak drinking year
- drinking_window_end: Last year to drink
- estimated_critic_score: 70-100
- body: "light" | "medium" | "full"
- tannins: "low" | "medium" | "high" (for reds)
- acidity: "low" | "medium" | "high"
- sweetness: "dry" | "off-dry" | "sweet"
- aromas: Array of 3-5 aroma descriptors
- flavors: Array of 3-5 flavor descriptors
- tasting_notes: 2-3 sentence unique description
- food_pairings: Array of 3-5 food suggestions
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

### Batch Processing

```typescript
async function enrichAllWines() {
  const wines = await db.query('SELECT * FROM wines WHERE investment_score IS NULL');

  for (const wine of wines) {
    try {
      const enriched = await enrichWine(wine);
      await db.query(`
        UPDATE wines SET
          wine_type = $1,
          region = $2,
          country = $3,
          investment_score = $4,
          drinking_window_start = $5,
          drinking_window_peak = $6,
          drinking_window_end = $7,
          estimated_critic_score = $8,
          body = $9,
          tannins = $10,
          acidity = $11,
          sweetness = $12,
          aromas = $13,
          flavors = $14,
          tasting_notes = $15,
          updated_at = NOW()
        WHERE id = $16
      `, [
        enriched.wine_type,
        enriched.region,
        enriched.country,
        enriched.investment_score,
        // ... etc
        wine.id
      ]);

      // Rate limit
      await sleep(500);
    } catch (error) {
      console.error(`Failed to enrich ${wine.name}:`, error);
    }
  }
}
```

---

## MDX Content Generation

After enrichment, generate MDX content for each wine:

```typescript
async function generateMDXContent(wine: EnrichedWine): Promise<string> {
  const prompt = `
Generate MDX content for this wine dashboard page.

Wine Data:
${JSON.stringify(wine, null, 2)}

Use these MDX components (already imported):
- <InvestmentScore score={number} trend={string} />
- <DrinkingWindowChart start={year} peak={year} end={year} />
- <TastingProfile body={} tannins={} acidity={} sweetness={} aromas={[]} flavors={[]} />
- <SimilarWines wines={[]} />
- <AddToCart wineId={number} price={number} inStock={boolean} />

Write engaging copy that weaves the data into a narrative.
Include the components at appropriate points.
Make it SEO-friendly with keywords naturally included.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

---

## Data Validation

Before inserting, validate:

```typescript
function validateEnrichedWine(wine: EnrichedWine): boolean {
  // Investment score in valid range
  if (wine.investment_score < 1 || wine.investment_score > 100) return false;

  // Drinking window makes sense
  if (wine.drinking_window_start > wine.drinking_window_peak) return false;
  if (wine.drinking_window_peak > wine.drinking_window_end) return false;

  // Critic score in valid range
  if (wine.estimated_critic_score < 70 || wine.estimated_critic_score > 100) return false;

  // Required arrays have items
  if (!wine.aromas?.length || !wine.flavors?.length) return false;

  return true;
}
```

---

## Running the Pipeline

```bash
# 1. Scrape Waddesdon
cd scripts && npx tsx scrape-waddesdon.ts

# 2. Enrich with AI
npx tsx enrich-wines.ts

# 3. Generate MDX content
npx tsx generate-mdx.ts

# 4. Verify data
npx tsx validate-wines.ts
```

---

## Incremental Updates

For ongoing updates:

```typescript
// Check for new products weekly
async function checkForNewWines() {
  const newProducts = await scrapeWaddesdon();
  const existingUrls = await db.query('SELECT source_url FROM wines');

  const newWines = newProducts.filter(p =>
    !existingUrls.includes(p.sourceUrl)
  );

  if (newWines.length > 0) {
    console.log(`Found ${newWines.length} new wines`);
    await insertWines(newWines);
    await enrichNewWines(newWines);
  }
}
```
