import { getWineBySlug, formatPrice } from '@/lib/wine-db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function WineDetailPage({ params }: Props) {
  const { slug } = await params
  const wine = await getWineBySlug(slug)

  if (!wine) {
    notFound()
  }

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
      </div>
    </div>
  )
}
