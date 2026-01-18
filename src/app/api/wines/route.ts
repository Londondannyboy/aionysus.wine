import { NextRequest, NextResponse } from 'next/server'
import { getAllWines, searchWines, getWineBySlug } from '@/lib/wine-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('q')
    const region = searchParams.get('region')
    const country = searchParams.get('country')
    const wineType = searchParams.get('type')
    const color = searchParams.get('color')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const vintage = searchParams.get('vintage')
    const slug = searchParams.get('slug')
    const limit = searchParams.get('limit')

    // Single wine by slug
    if (slug) {
      const wine = await getWineBySlug(slug)
      if (!wine) {
        return NextResponse.json({ error: 'Wine not found' }, { status: 404 })
      }
      return NextResponse.json(wine)
    }

    // Search with filters
    if (query || region || country || wineType || color || minPrice || maxPrice || vintage) {
      const wines = await searchWines({
        query: query || undefined,
        region: region || undefined,
        country: country || undefined,
        wine_type: wineType || undefined,
        color: color || undefined,
        min_price: minPrice ? parseFloat(minPrice) : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        vintage: vintage ? parseInt(vintage) : undefined,
        limit: limit ? parseInt(limit) : 50
      })
      return NextResponse.json(wines)
    }

    // Default: return all wines with limit
    const wines = await getAllWines(limit ? parseInt(limit) : 100)
    return NextResponse.json(wines)

  } catch (error) {
    console.error('[Wines API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wines' },
      { status: 500 }
    )
  }
}
