import { getWineBySlug, formatPrice, getWineInvestmentData, WineInvestmentData } from '@/lib/wine-db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const wine = await getWineBySlug(slug)

  if (!wine) {
    return { title: 'Wine Not Found | Aionysus' }
  }

  const title = `${wine.vintage ? `${wine.vintage} ` : ''}${wine.name} | ${wine.winery} | Aionysus Wine Investment`
  const description = `Discover ${wine.name} from ${wine.winery}, ${wine.region}. View investment profile, tasting notes, and buy this exceptional ${wine.country} wine. ${wine.classification ? `Classification: ${wine.classification}.` : ''}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: wine.image_url ? [wine.image_url] : [],
    },
  }
}

// Investment Rating Badge Colors
const ratingColors: Record<string, string> = {
  'A+': 'bg-green-500 text-white',
  'A': 'bg-green-400 text-white',
  'B+': 'bg-yellow-500 text-black',
  'B': 'bg-yellow-400 text-black',
  'C': 'bg-orange-500 text-white',
}

// Recommendation Colors
const recommendationColors: Record<string, string> = {
  'BUY': 'text-green-400',
  'HOLD': 'text-yellow-400',
  'SELL': 'text-red-400',
}

// Region information for SEO content
const REGION_INFO: Record<string, { description: string; climate: string; soils: string; grapes: string[] }> = {
  'Bordeaux': {
    description: 'Bordeaux is the world\'s most prestigious wine region, home to legendary estates and the birthplace of fine wine investment.',
    climate: 'Maritime climate with mild winters and warm summers, moderated by the Atlantic Ocean and Gironde estuary.',
    soils: 'Gravel, limestone, and clay soils across the Left and Right Banks.',
    grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot'],
  },
  'Burgundy': {
    description: 'Burgundy represents the pinnacle of Pinot Noir and Chardonnay, with terroir-driven wines that command top prices worldwide.',
    climate: 'Continental climate with cold winters and warm summers, creating ideal conditions for elegant wines.',
    soils: 'Limestone and marl soils, with each climat offering unique characteristics.',
    grapes: ['Pinot Noir', 'Chardonnay', 'Gamay', 'Aligoté'],
  },
  'Champagne': {
    description: 'The Champagne region produces the world\'s most celebrated sparkling wines, using traditional method fermentation.',
    climate: 'Cool continental climate at the northern limit of viticulture, creating high-acid base wines.',
    soils: 'Chalk subsoils that retain moisture and reflect heat back to the vines.',
    grapes: ['Chardonnay', 'Pinot Noir', 'Pinot Meunier'],
  },
  'Madeira': {
    description: 'Madeira produces some of the world\'s longest-lived wines, with a unique heated aging process that creates extraordinary complexity.',
    climate: 'Subtropical maritime climate with warm temperatures year-round.',
    soils: 'Volcanic basalt soils on steep terraced vineyards.',
    grapes: ['Sercial', 'Verdelho', 'Boal', 'Malmsey', 'Tinta Negra'],
  },
  'Sussex': {
    description: 'Sussex has emerged as England\'s premier sparkling wine region, with chalk soils identical to Champagne producing award-winning wines.',
    climate: 'Cool maritime climate with long growing seasons ideal for high-acid sparkling wines.',
    soils: 'Chalk downland soils matching the terroir of Champagne.',
    grapes: ['Chardonnay', 'Pinot Noir', 'Pinot Meunier'],
  },
  'Port': {
    description: 'The Douro Valley produces Port wine, one of the world\'s great fortified wines with excellent aging potential.',
    climate: 'Hot, dry continental climate protected by mountains.',
    soils: 'Schist and granite soils on steep terraced vineyards.',
    grapes: ['Touriga Nacional', 'Touriga Franca', 'Tinta Roriz', 'Tinta Barroca'],
  },
}

function getRegionInfo(region: string | null) {
  if (!region) return null
  // Try exact match first, then partial match
  if (REGION_INFO[region]) return { name: region, ...REGION_INFO[region] }
  for (const [key, info] of Object.entries(REGION_INFO)) {
    if (region.toLowerCase().includes(key.toLowerCase())) {
      return { name: key, ...info }
    }
  }
  return null
}

// Unsplash image URLs for regions (using static URLs to avoid API calls)
const REGION_IMAGES: Record<string, string[]> = {
  'Bordeaux': [
    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800',
    'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800',
  ],
  'Burgundy': [
    'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800',
    'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=800',
  ],
  'Champagne': [
    'https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=800',
    'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800',
  ],
  'Sussex': [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800',
  ],
  'Madeira': [
    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
  ],
}

function getRegionImages(region: string | null): string[] {
  if (!region) return []
  for (const [key, images] of Object.entries(REGION_IMAGES)) {
    if (region.toLowerCase().includes(key.toLowerCase())) {
      return images
    }
  }
  return []
}

function InvestmentCard({ data, wineName }: { data: WineInvestmentData; wineName: string }) {
  const prices = [
    { year: '2020', price: data.price_2020 },
    { year: '2021', price: data.price_2021 },
    { year: '2022', price: data.price_2022 },
    { year: '2023', price: data.price_2023 },
    { year: '2024', price: data.price_2024 },
    { year: '2025', price: data.price_2025 },
  ].filter(p => p.price !== null)

  const maxPrice = Math.max(...prices.map(p => Number(p.price) || 0))
  const minPrice = Math.min(...prices.map(p => Number(p.price) || 0))
  const range = maxPrice - minPrice || 1
  const totalGrowth = minPrice > 0 ? ((maxPrice - minPrice) / minPrice * 100).toFixed(1) : '0'

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mt-8" aria-labelledby="investment-heading">
      <div className="flex items-center justify-between mb-6">
        <h2 id="investment-heading" className="text-2xl font-bold text-white">
          {wineName} Investment Profile
        </h2>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${ratingColors[data.investment_rating || 'C']}`}>
            {data.investment_rating || 'N/A'}
          </span>
          <span className={`font-semibold ${recommendationColors[data.analyst_recommendation || 'HOLD']}`}>
            {data.analyst_recommendation || 'HOLD'}
          </span>
        </div>
      </div>

      {/* Investment Summary */}
      <div className="mb-6 text-slate-300">
        <p className="mb-3">
          <strong className="text-white">{wineName}</strong> has demonstrated{' '}
          {data.annual_return_pct && data.annual_return_pct > 8 ? 'exceptional' : data.annual_return_pct && data.annual_return_pct > 5 ? 'solid' : 'moderate'}{' '}
          investment performance with an annual return of <strong className="text-green-400">{data.annual_return_pct}%</strong>.
        </p>
        <p className="mb-3">
          Over the past five years, {wineName} has grown by approximately <strong className="text-purple-400">{totalGrowth}%</strong>,
          reflecting {data.liquidity_score && data.liquidity_score > 7 ? 'strong market demand and excellent liquidity' : 'steady collector interest'}.
        </p>
        <p>
          Based on current market conditions and historical performance, our analysts rate {wineName} as a{' '}
          <strong className={recommendationColors[data.analyst_recommendation || 'HOLD']}>
            {data.analyst_recommendation}
          </strong>{' '}
          with projected 5-year returns of {data.projected_5yr_return}%.
        </p>
      </div>

      {/* Price History Chart */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">{wineName} Historical Performance</h3>
        <div className="flex items-end gap-2 h-32">
          {prices.map((p, i) => {
            const height = ((Number(p.price) - minPrice) / range) * 80 + 20
            return (
              <div key={p.year} className="flex-1 flex flex-col items-center">
                <div className="text-xs text-slate-400 mb-1">£{Number(p.price).toLocaleString()}</div>
                <div
                  className={`w-full rounded-t transition-all ${i === prices.length - 1 ? 'bg-purple-500' : 'bg-slate-700'}`}
                  style={{ height: `${height}%` }}
                  title={`${p.year}: £${Number(p.price).toLocaleString()}`}
                />
                <span className="text-sm text-slate-400 mt-2">{p.year}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Key Metrics */}
      <h3 className="text-lg font-semibold text-white mb-3">Key Investment Metrics for {wineName}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-3xl font-bold text-green-400">
            {data.annual_return_pct ? `+${data.annual_return_pct}%` : 'N/A'}
          </div>
          <div className="text-sm text-slate-400 mt-1">Annual Return</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-3xl font-bold text-purple-400">
            {data.projected_5yr_return ? `+${data.projected_5yr_return}%` : 'N/A'}
          </div>
          <div className="text-sm text-slate-400 mt-1">5-Year Projection</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-3xl font-bold text-white">
            {data.volatility_score || 'N/A'}<span className="text-sm text-slate-400">/10</span>
          </div>
          <div className="text-sm text-slate-400 mt-1">Volatility Score</div>
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-3xl font-bold text-white">
            {data.liquidity_score || 'N/A'}<span className="text-sm text-slate-400">/10</span>
          </div>
          <div className="text-sm text-slate-400 mt-1">Liquidity Score</div>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-6 text-center italic">
        Investment data for {wineName} is for illustrative purposes only. Past performance does not guarantee future results.
        This is a demonstration platform - wine purchases are not currently available.
      </p>
    </section>
  )
}

function RegionSection({ region, country, wineName }: { region: string; country: string; wineName: string }) {
  const info = getRegionInfo(region)
  const images = getRegionImages(region)

  if (!info) return null

  return (
    <section className="mt-12" aria-labelledby="region-heading">
      <h2 id="region-heading" className="text-2xl font-bold text-white mb-6">
        About {info.name}, {country}
      </h2>

      {/* Region Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {images.map((img, i) => (
            <div key={i} className="aspect-video rounded-xl overflow-hidden">
              <img
                src={img}
                alt={`${info.name} wine region vineyard - home of ${wineName}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      <div className="prose prose-invert max-w-none">
        <p className="text-lg text-slate-300 mb-4">
          {info.description} <strong>{wineName}</strong> is a prime example of what this exceptional region can produce.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-2">Climate</h4>
            <p className="text-slate-400 text-sm">{info.climate}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-2">Terroir</h4>
            <p className="text-slate-400 text-sm">{info.soils}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-2">Key Grapes</h4>
            <p className="text-slate-400 text-sm">{info.grapes.join(', ')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default async function WineDetailPage({ params }: Props) {
  const { slug } = await params
  const wine = await getWineBySlug(slug)

  if (!wine) {
    notFound()
  }

  const investmentData = await getWineInvestmentData(wine.id)
  const fullWineName = `${wine.vintage ? `${wine.vintage} ` : ''}${wine.name}`

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Beta Disclaimer Banner */}
        <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg px-4 py-2 mb-6 text-center">
          <p className="text-amber-200 text-sm">
            <strong>Beta Platform:</strong> This is a demonstration site. Wine purchases are not currently available.
          </p>
        </div>

        {/* Breadcrumb with Schema */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-slate-400" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/wines" className="hover:text-white" itemProp="item">
                <span itemProp="name">Wines</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <li>/</li>
            {wine.region && (
              <>
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Link href={`/wines?region=${encodeURIComponent(wine.region)}`} className="hover:text-white" itemProp="item">
                    <span itemProp="name">{wine.region}</span>
                  </Link>
                  <meta itemProp="position" content="2" />
                </li>
                <li>/</li>
              </>
            )}
            <li className="text-white" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name">{wine.name}</span>
              <meta itemProp="position" content={wine.region ? "3" : "2"} />
            </li>
          </ol>
        </nav>

        {/* Main Content */}
        <article itemScope itemType="https://schema.org/Product">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Wine Image */}
            <div className="aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
              {wine.image_url ? (
                <img
                  src={wine.image_url}
                  alt={`${fullWineName} - ${wine.winery} wine from ${wine.region}, ${wine.country}`}
                  className="w-full h-full object-cover"
                  itemProp="image"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-9xl bg-gradient-to-br from-slate-800 to-slate-900">
                  🍷
                </div>
              )}
            </div>

            {/* Wine Details */}
            <div>
              {/* H1 - Wine Name (SEO Critical) */}
              <h1 className="text-3xl font-bold text-white mb-2" itemProp="name">
                {fullWineName}
              </h1>
              <p className="text-xl text-purple-400 mb-4" itemProp="brand">{wine.winery}</p>

              {/* Price */}
              <div className="text-3xl font-bold text-white mb-6" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                <span itemProp="price" content={wine.price_retail?.toString() || '0'}>
                  {formatPrice(wine.price_retail)}
                </span>
                <meta itemProp="priceCurrency" content="GBP" />
                {wine.bottle_size && (
                  <span className="text-base font-normal text-slate-400 ml-2">
                    / {wine.bottle_size}
                  </span>
                )}
              </div>

              {/* Wine Description (SEO - mentions wine name) */}
              <p className="text-slate-300 mb-6" itemProp="description">
                <strong className="text-white">{fullWineName}</strong> is an exceptional wine from {wine.winery},
                crafted in the prestigious {wine.region} region of {wine.country}.
                {wine.classification && ` Classified as ${wine.classification}, this`}
                {wine.grape_variety && ` This ${wine.grape_variety} wine`} represents the pinnacle of winemaking tradition.
              </p>

              {/* Attributes */}
              <div className="space-y-3 mb-6">
                {wine.region && (
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Region</span>
                    <Link href={`/wines?region=${encodeURIComponent(wine.region)}`} className="text-white hover:text-purple-400">
                      {wine.region}
                    </Link>
                  </div>
                )}
                {wine.country && (
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Country</span>
                    <Link href={`/wines?country=${encodeURIComponent(wine.country)}`} className="text-white hover:text-purple-400">
                      {wine.country}
                    </Link>
                  </div>
                )}
                {wine.grape_variety && (
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Grape Variety</span>
                    <span className="text-white">{wine.grape_variety}</span>
                  </div>
                )}
                {wine.classification && (
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Classification</span>
                    <span className="text-white">{wine.classification}</span>
                  </div>
                )}
                {wine.case_size && (
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Case Size</span>
                    <span className="text-white">{wine.case_size} bottles</span>
                  </div>
                )}
              </div>

              {/* Add to Cart Button (Disabled for Beta) */}
              <button
                disabled
                className="w-full py-4 bg-slate-700 text-slate-400 rounded-xl font-semibold text-lg cursor-not-allowed mb-2"
                title="Purchases coming soon"
              >
                Coming Soon - Demo Mode
              </button>
              <p className="text-xs text-slate-500 text-center mb-4">
                Chat with Vic, our AI sommelier, to learn more about {wine.name}
              </p>

              {/* Original Source */}
              {wine.original_url && (
                <a
                  href={wine.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 hover:text-slate-400"
                >
                  View original listing →
                </a>
              )}
            </div>
          </div>

          {/* Tasting Notes */}
          {wine.tasting_notes && (
            <section className="mt-12" aria-labelledby="tasting-heading">
              <h2 id="tasting-heading" className="text-2xl font-bold text-white mb-4">
                {fullWineName} Tasting Notes
              </h2>
              <div
                className="prose prose-invert max-w-none text-slate-300"
                dangerouslySetInnerHTML={{ __html: wine.tasting_notes }}
              />
            </section>
          )}

          {/* Investment Profile */}
          {investmentData && <InvestmentCard data={investmentData} wineName={fullWineName} />}

          {/* Region Information */}
          {wine.region && wine.country && (
            <RegionSection region={wine.region} country={wine.country} wineName={fullWineName} />
          )}

          {/* Related Wines CTA */}
          <section className="mt-12 bg-purple-900/20 border border-purple-800/50 rounded-xl p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Explore More {wine.region} Wines</h2>
            <p className="text-slate-400 mb-4">
              Discover other exceptional wines from the {wine.region} region like {wine.name}.
            </p>
            <Link
              href={`/wines?region=${encodeURIComponent(wine.region || '')}`}
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-500 transition-colors"
            >
              Browse {wine.region} Collection
            </Link>
          </section>
        </article>
      </div>
    </div>
  )
}
