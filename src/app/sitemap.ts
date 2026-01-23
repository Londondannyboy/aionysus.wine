import { MetadataRoute } from 'next'
import { neon } from '@neondatabase/serverless'

const BASE_URL = 'https://aionysus.wine'

// Known region page slugs
const REGION_SLUGS = ['gevrey-chambertin', 'chassagne-montrachet']

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

  // Individual wine pages
  const winePages: MetadataRoute.Sitemap = wines.map((wine) => ({
    url: `${BASE_URL}/wines/${wine.slug}`,
    lastModified: wine.updated_at ? new Date(wine.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...regionPages, ...winePages]
}
