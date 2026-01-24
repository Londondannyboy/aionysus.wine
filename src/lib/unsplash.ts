/**
 * Unsplash API for Dynamic Wine Region Backgrounds
 * Changes background based on wine region or type being viewed
 */

// Region to search query mapping for beautiful vineyard backgrounds
const REGION_QUERIES: Record<string, string> = {
  // French regions
  'burgundy': 'burgundy vineyard france',
  'bordeaux': 'bordeaux vineyard chateau',
  'champagne': 'champagne vineyard france',
  'rhone': 'rhone valley vineyard france',
  'loire': 'loire valley vineyard castle',
  'alsace': 'alsace vineyard village',
  'provence': 'provence vineyard lavender',

  // Italian regions
  'tuscany': 'tuscany vineyard rolling hills',
  'piedmont': 'piedmont barolo vineyard',
  'veneto': 'veneto vineyard prosecco',

  // Spanish regions
  'rioja': 'rioja spain vineyard',
  'ribera del duero': 'ribera del duero vineyard',

  // Other
  'napa': 'napa valley vineyard california',
  'sonoma': 'sonoma vineyard california',
  'marlborough': 'marlborough vineyard new zealand',
  'barossa': 'barossa valley vineyard australia',

  // Portuguese regions
  'madeira': 'madeira island portugal ocean cliffs vineyards',
  'douro': 'douro valley portugal vineyard terraces',
  'portugal': 'portugal vineyard douro valley',

  // UK - English wine (Vik's favourite!)
  'england': 'english vineyard sussex',
  'sussex': 'sussex vineyard england',
  'kent': 'kent vineyard england',
  'hampshire': 'hampshire vineyard england',

  // Default
  'default': 'vineyard sunset wine',
}

// Wine type to background mapping
const TYPE_QUERIES: Record<string, string> = {
  'red': 'red wine vineyard sunset',
  'white': 'white wine vineyard morning',
  'rose': 'rose wine provence vineyard',
  'sparkling': 'champagne vineyard celebration',
  'dessert': 'dessert wine vineyard golden',
  'fortified': 'port wine douro valley',
}

export interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string | null
  user: {
    name: string
    username: string
  }
  blur_hash: string | null
}

/**
 * Get background image URL for a wine region
 */
export async function getRegionBackground(region: string): Promise<UnsplashPhoto | null> {
  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    console.warn('Unsplash access key not configured')
    return null
  }

  // Find best matching query
  const normalizedRegion = region.toLowerCase()
  let query = REGION_QUERIES['default']

  for (const [key, value] of Object.entries(REGION_QUERIES)) {
    if (normalizedRegion.includes(key) || key.includes(normalizedRegion)) {
      query = value
      break
    }
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Unsplash API error:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch Unsplash image:', error)
    return null
  }
}

/**
 * Get background image URL for a wine type
 */
export async function getTypeBackground(wineType: string): Promise<UnsplashPhoto | null> {
  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
  if (!accessKey) return null

  const normalizedType = wineType.toLowerCase()
  const query = TYPE_QUERIES[normalizedType] || TYPE_QUERIES['default'] || 'vineyard wine'

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    )

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Get a curated list of backgrounds for preloading
 */
export async function getCuratedBackgrounds(count: number = 5): Promise<UnsplashPhoto[]> {
  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
  if (!accessKey) return []

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=vineyard+wine&count=${count}&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    )

    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

/**
 * Build optimized image URL with Unsplash parameters
 */
export function buildUnsplashUrl(photo: UnsplashPhoto, width: number = 1920, quality: number = 80): string {
  return `${photo.urls.raw}&w=${width}&q=${quality}&fit=crop&auto=format`
}

/**
 * Get attribution string for Unsplash (required by API terms)
 */
export function getAttribution(photo: UnsplashPhoto): string {
  return `Photo by ${photo.user.name} on Unsplash`
}
