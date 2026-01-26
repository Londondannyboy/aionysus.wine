import { MetadataRoute } from 'next'
import { neon } from '@neondatabase/serverless'

const BASE_URL = 'https://aionysus.wine'

// Known region page slugs
const REGION_SLUGS = ['gevrey-chambertin', 'chassagne-montrachet']

// High-priority wine pages based on Google Search Console ranking data
// These pages are currently ranking and should receive higher priority
// Priority tiers: 0.95 (top keywords), 0.9 (ranking well), 0.85 (emerging)
const HIGH_PRIORITY_WINES: Record<string, number> = {
  // Top ranking pages (position 1-5 in GSC)
  'boal-borges-1875': 0.95,
  'denbies-wine-estate-demi-sec-nv': 0.95,
  'bolney-estate-pinot-noir-2019': 0.95,
  'madeira-wine-company-malmsey-colheita-1995': 0.95,

  // Good ranking pages (position 5-15)
  'giffords-hall-bacchus-2022': 0.9,
  'leitz-riesling-dragonstone-2022': 0.9,
  'jean-louis-chave-hermitage-blanc-2019': 0.9,
  'barolo-mascarello-2015': 0.9,
  'krug-grande-cuvee-171-nv': 0.9,
  'dom-perignon-vintage-2013': 0.9,

  // Emerging/building rankings (position 15-30)
  'joh-jos-prum-wehlener-sonnenuhr-spatlese-2021': 0.85,
  'chateau-margaux-2010': 0.85,
  'chateau-lafite-rothschild-2010': 0.85,
  'domaine-leroy-musigny-grand-cru-2015': 0.85,
  'domaine-de-la-romanee-conti-romanee-conti-2018': 0.85,
  'salon-blanc-de-blancs-2012': 0.85,
  'screaming-eagle-cabernet-sauvignon-2019': 0.85,
  'petrus-2018': 0.85,
  'chateau-haut-brion-2010': 0.85,
  'bruno-giacosa-barolo-falletto-2016': 0.85,
}

// Get priority for a wine slug
function getWinePriority(slug: string): number {
  return HIGH_PRIORITY_WINES[slug] || 0.7
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sql = neon(process.env.DATABASE_URL!)

  // Fetch all wine slugs from database
  const wines = await sql`
    SELECT aionysus_slug as slug, updated_at
    FROM wines_original
    WHERE aionysus_slug IS NOT NULL
    ORDER BY updated_at DESC NULLS LAST
  `

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/wines`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  // Region pages
  const regionPages: MetadataRoute.Sitemap = REGION_SLUGS.map((slug) => ({
    url: `${BASE_URL}/regions/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  // Individual wine pages with dynamic priority based on GSC ranking data
  const winePages: MetadataRoute.Sitemap = wines.map((wine) => ({
    url: `${BASE_URL}/wines/${wine.slug}`,
    lastModified: wine.updated_at ? new Date(wine.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: getWinePriority(wine.slug),
  }))

  return [...staticPages, ...regionPages, ...winePages]
}
