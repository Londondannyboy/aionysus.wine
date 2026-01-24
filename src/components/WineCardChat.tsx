'use client'

interface WineCardChatProps {
  wine: {
    name: string
    slug: string
    winery: string
    region: string
    country: string
    vintage: number | null
    price_retail: number | null
    image_url: string | null
    shopify_product_id: string | null
    grape_variety?: string | null
  }
  onAddToCart?: (slug: string) => void
}

export function WineCardChat({ wine, onAddToCart }: WineCardChatProps) {
  const fullName = `${wine.vintage || ''} ${wine.name}`.trim()
  const price = wine.price_retail ? `£${wine.price_retail.toLocaleString()}` : 'Price on request'
  const hasImage = wine.image_url && !wine.image_url.includes('/Users/') && !wine.image_url.includes('placeholder')
  const canBuy = !!wine.shopify_product_id

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden max-w-[320px] my-2">
      {/* Wine Image */}
      <div className="relative h-40 bg-stone-100 flex items-center justify-center">
        {hasImage ? (
          <img
            src={wine.image_url!}
            alt={fullName}
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <div className="text-4xl">🍷</div>
        )}
        {wine.vintage && (
          <span className="absolute top-2 left-2 bg-stone-900/80 text-white text-xs px-2 py-0.5 rounded-full">
            {wine.vintage}
          </span>
        )}
      </div>

      {/* Wine Details */}
      <div className="p-4">
        <h4 className="font-semibold text-stone-900 text-sm leading-tight mb-1">{fullName}</h4>
        <p className="text-xs text-stone-500 mb-2">{wine.winery}</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{wine.region}</span>
          {wine.grape_variety && (
            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{wine.grape_variety}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-stone-900">{price}</span>
          <div className="flex gap-2">
            <a
              href={`/wines/${wine.slug}`}
              className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
            >
              View
            </a>
            {canBuy && onAddToCart && (
              <button
                onClick={() => onAddToCart(wine.slug)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors"
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function WineCardChatLoading() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden max-w-[320px] my-2 animate-pulse">
      <div className="h-40 bg-stone-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-stone-200 rounded w-3/4" />
        <div className="h-3 bg-stone-100 rounded w-1/2" />
        <div className="h-8 bg-stone-100 rounded w-full mt-3" />
      </div>
    </div>
  )
}
