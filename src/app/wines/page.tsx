'use client'

import { useState, useEffect } from 'react'
import { Wine, formatPrice } from '@/lib/wine-db'
import Link from 'next/link'

export default function WinesPage() {
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  useEffect(() => {
    fetchWines()
  }, [search, regionFilter])

  async function fetchWines() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (regionFilter) params.set('region', regionFilter)
      params.set('limit', '100')

      const res = await fetch(`/api/wines?${params}`)
      const data = await res.json()
      setWines(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch wines:', error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Wine Collection</h1>
          <p className="text-slate-400">Browse our selection of 3,900+ fine wines</p>
        </div>

        {/* Featured: Rare & Historic Wines */}
        <div className="mb-10 p-6 bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-600/30 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Collector&apos;s Corner</span>
              <h2 className="text-xl font-bold text-white mt-1">Rare & Historic Wines</h2>
              <p className="text-white/60 text-sm mt-1">
                Discover extraordinary bottles including <Link href="/wines/boal-borges-1875" className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2">Boal Borges 1875</Link> — one of the oldest wines in the world.
              </p>
            </div>
            <Link
              href="/wines/boal-borges-1875"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-500 transition-colors whitespace-nowrap"
            >
              Explore Boal Borges 1875
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <input
            type="text"
            placeholder="Search wines, regions, producers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Regions</option>
            <option value="Burgundy">Burgundy</option>
            <option value="Bordeaux">Bordeaux</option>
            <option value="Champagne">Champagne</option>
            <option value="Madeira">Madeira</option>
            <option value="Rhone">Rhone</option>
            <option value="Italy">Italy</option>
            <option value="Barolo">Barolo</option>
          </select>
        </div>

        {/* Wine Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wines.map((wine) => (
              <Link
                key={wine.id}
                href={`/wines/${wine.slug}`}
                className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10"
              >
                {/* Wine Image */}
                <div className="aspect-[3/4] bg-slate-800 relative">
                  {wine.image_url ? (
                    <img
                      src={wine.image_url}
                      alt={wine.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🍷
                    </div>
                  )}
                </div>

                {/* Wine Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white line-clamp-2 mb-1">
                    {wine.vintage && `${wine.vintage} `}{wine.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-2">{wine.winery}</p>
                  <p className="text-xs text-purple-400 mb-3">{wine.region}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">
                      {formatPrice(wine.price_retail)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {wine.bottle_size}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && wines.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            No wines found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
