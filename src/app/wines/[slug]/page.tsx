import { getWineBySlug, formatPrice, getWineInvestmentData, WineInvestmentData } from '@/lib/wine-db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
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

function InvestmentCard({ data }: { data: WineInvestmentData }) {
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

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Investment Profile</h2>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${ratingColors[data.investment_rating || 'C']}`}>
            {data.investment_rating || 'N/A'}
          </span>
          <span className={`font-semibold ${recommendationColors[data.analyst_recommendation || 'HOLD']}`}>
            {data.analyst_recommendation || 'HOLD'}
          </span>
        </div>
      </div>

      {/* Price History Chart (Simple Bar) */}
      <div className="mb-6">
        <h3 className="text-sm text-slate-400 mb-3">Historical Performance</h3>
        <div className="flex items-end gap-2 h-24">
          {prices.map((p, i) => {
            const height = ((Number(p.price) - minPrice) / range) * 80 + 20
            return (
              <div key={p.year} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t transition-all ${i === prices.length - 1 ? 'bg-purple-500' : 'bg-slate-700'}`}
                  style={{ height: `${height}%` }}
                  title={`£${Number(p.price).toLocaleString()}`}
                />
                <span className="text-xs text-slate-500 mt-1">{p.year.slice(2)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-green-400">
            {data.annual_return_pct ? `+${data.annual_return_pct}%` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">Annual Return</div>
        </div>
        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-purple-400">
            {data.projected_5yr_return ? `+${data.projected_5yr_return}%` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">5yr Projection</div>
        </div>
        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">
            {data.volatility_score || 'N/A'}<span className="text-sm text-slate-400">/10</span>
          </div>
          <div className="text-xs text-slate-400">Volatility</div>
        </div>
        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
          <div className="text-2xl font-bold text-white">
            {data.liquidity_score || 'N/A'}<span className="text-sm text-slate-400">/10</span>
          </div>
          <div className="text-xs text-slate-400">Liquidity</div>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-4 text-center">
        Investment data is for illustrative purposes. Past performance does not guarantee future results.
      </p>
    </div>
  )
}

export default async function WineDetailPage({ params }: Props) {
  const { slug } = await params
  const wine = await getWineBySlug(slug)

  if (!wine) {
    notFound()
  }

  // Fetch investment data
  const investmentData = await getWineInvestmentData(wine.id)

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-slate-400">
            <li>
              <Link href="/wines" className="hover:text-white">Wines</Link>
            </li>
            <li>/</li>
            <li className="text-white">{wine.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Wine Image */}
          <div className="aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            {wine.image_url ? (
              <img
                src={wine.image_url}
                alt={wine.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-9xl">
                🍷
              </div>
            )}
          </div>

          {/* Wine Details */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {wine.vintage && `${wine.vintage} `}{wine.name}
            </h1>
            <p className="text-xl text-purple-400 mb-4">{wine.winery}</p>

            {/* Price */}
            <div className="text-3xl font-bold text-white mb-6">
              {formatPrice(wine.price_retail)}
              {wine.bottle_size && (
                <span className="text-base font-normal text-slate-400 ml-2">
                  / {wine.bottle_size}
                </span>
              )}
            </div>

            {/* Attributes */}
            <div className="space-y-3 mb-6">
              {wine.region && (
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Region</span>
                  <span className="text-white">{wine.region}</span>
                </div>
              )}
              {wine.country && (
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Country</span>
                  <span className="text-white">{wine.country}</span>
                </div>
              )}
              {wine.grape_variety && (
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Grape</span>
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

            {/* Add to Cart Button */}
            <button
              className="w-full py-4 bg-purple-600 text-white rounded-xl font-semibold text-lg hover:bg-purple-500 transition-colors mb-4"
            >
              Add to Cart
            </button>

            {/* Original Source */}
            {wine.original_url && (
              <a
                href={wine.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-slate-400"
              >
                View on Goedhuis Waddesdon →
              </a>
            )}
          </div>
        </div>

        {/* Tasting Notes */}
        {wine.tasting_notes && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-white mb-4">Tasting Notes</h2>
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: wine.tasting_notes }}
            />
          </div>
        )}

        {/* Investment Profile */}
        {investmentData && <InvestmentCard data={investmentData} />}
      </div>
    </div>
  )
}
