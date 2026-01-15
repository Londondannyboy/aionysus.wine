/**
 * Waddesdon Wine Scraper
 *
 * Scrapes wine data from https://waddesdonwine.co.uk/
 * Uses Firecrawl for reliable web scraping
 */

import 'dotenv/config';
import Firecrawl from '@mendable/firecrawl-js';
import { neon } from '@neondatabase/serverless';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });
const sql = neon(process.env.DATABASE_URL!);

interface ScrapedWine {
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  vintage?: number;
  region?: string;
  sourceUrl: string;
}

function generateSlug(name: string, vintage?: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return vintage ? `${base}-${vintage}` : base;
}

function extractVintage(name: string): number | undefined {
  const match = name.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : undefined;
}

function extractPrice(priceStr: string): number | undefined {
  const match = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(match);
  return isNaN(price) ? undefined : price;
}

async function scrapeWaddesdonPage(url: string): Promise<ScrapedWine[]> {
  console.log(`Scraping: ${url}`);

  const result = await firecrawl.scrapeUrl(url, {
    formats: ['markdown', 'html'],
  });

  if (!result.success) {
    console.error(`Failed to scrape ${url}`);
    return [];
  }

  // Extract product data from the scraped content
  // This is a simplified extraction - adjust based on actual page structure
  const wines: ScrapedWine[] = [];

  // Parse the HTML/markdown to extract wine data
  // The exact parsing depends on Waddesdon's page structure
  const content = result.markdown || '';

  // Look for product patterns in the content
  const productPattern = /\[([^\]]+)\]\(([^)]+)\).*?£([\d.]+)/g;
  let match;

  while ((match = productPattern.exec(content)) !== null) {
    const [, name, productUrl, priceStr] = match;
    const price = extractPrice(priceStr);

    if (name && price && productUrl.includes('/products/')) {
      wines.push({
        name: name.trim(),
        price,
        vintage: extractVintage(name),
        sourceUrl: productUrl.startsWith('http')
          ? productUrl
          : `https://waddesdonwine.co.uk${productUrl}`,
      });
    }
  }

  return wines;
}

async function crawlAllProducts(): Promise<ScrapedWine[]> {
  console.log('Starting full crawl of Waddesdon Wine...');

  const result = await firecrawl.crawl('https://waddesdonwine.co.uk/collections/all', {
    limit: 500,
    scrapeOptions: {
      formats: ['markdown'],
    },
  });

  if (!result.success) {
    console.error('Crawl failed');
    return [];
  }

  const wines: ScrapedWine[] = [];
  const seenUrls = new Set<string>();

  for (const page of result.data || []) {
    // Extract wine data from each crawled page
    if (page.metadata?.sourceURL?.includes('/products/')) {
      const url = page.metadata.sourceURL;
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      // Extract wine info from the page content
      const name = page.metadata?.title?.replace(' – Goedhuis Waddesdon', '').trim();
      const content = page.markdown || '';

      // Try to find price
      const priceMatch = content.match(/£([\d.]+)/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;

      // Try to find image
      const imageMatch = content.match(/!\[.*?\]\((https:\/\/[^\s)]+\.(?:jpg|png|webp))/i);
      const imageUrl = imageMatch ? imageMatch[1] : undefined;

      if (name && price) {
        wines.push({
          name,
          price,
          vintage: extractVintage(name),
          imageUrl,
          description: content.slice(0, 500),
          sourceUrl: url,
        });
      }
    }
  }

  console.log(`Found ${wines.length} wines`);
  return wines;
}

async function insertWines(wines: ScrapedWine[]): Promise<void> {
  console.log(`Inserting ${wines.length} wines into database...`);

  for (const wine of wines) {
    const slug = generateSlug(wine.name, wine.vintage);

    try {
      await sql`
        INSERT INTO wines (slug, name, price_retail, vintage, image_url, description, source_url, in_stock)
        VALUES (${slug}, ${wine.name}, ${wine.price}, ${wine.vintage || null}, ${wine.imageUrl || null}, ${wine.description || null}, ${wine.sourceUrl}, true)
        ON CONFLICT (slug) DO UPDATE SET
          price_retail = EXCLUDED.price_retail,
          image_url = COALESCE(EXCLUDED.image_url, wines.image_url),
          description = COALESCE(EXCLUDED.description, wines.description),
          updated_at = NOW()
      `;
      console.log(`  ✓ ${wine.name}`);
    } catch (error) {
      console.error(`  ✗ ${wine.name}: ${error}`);
    }
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('Aionysus Wine Scraper');
  console.log('='.repeat(50));

  // Option 1: Full crawl (slower but more complete)
  const wines = await crawlAllProducts();

  // Option 2: Scrape specific collection pages (faster)
  // const wines = await scrapeWaddesdonPage('https://waddesdonwine.co.uk/collections/all');

  if (wines.length === 0) {
    console.log('No wines found. Check the scraper configuration.');
    return;
  }

  await insertWines(wines);

  console.log('='.repeat(50));
  console.log(`Scraping complete. ${wines.length} wines processed.`);
  console.log('Next step: Run `npm run enrich` to add AI-generated data.');
}

main().catch(console.error);
