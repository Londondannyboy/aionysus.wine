import Link from 'next/link';
import Image from 'next/image';
import { getWines, Wine } from '@/lib/db';

export const metadata = {
  title: 'Browse Wines | Aionysus',
  description: 'Explore our curated collection of fine wines with AI-powered investment analysis and tasting notes.',
};

export default async function WinesPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; type?: string; max_price?: string }>;
}) {
  const params = await searchParams;

  const wines = await getWines({
    region: params.region,
    wine_type: params.type,
    max_price: params.max_price ? parseFloat(params.max_price) : undefined,
    limit: 50,
  });

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 text-center">
          <h1 className="mb-4 font-serif text-4xl font-bold text-gold-300">
            Browse Wines
          </h1>
          <p className="text-wine-200">
            {wines.length} wines available with investment analysis
          </p>
        </header>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <FilterButton href="/wines" label="All" active={!params.type && !params.region} />
          <FilterButton href="/wines?type=red" label="Red" active={params.type === 'red'} />
          <FilterButton href="/wines?type=white" label="White" active={params.type === 'white'} />
          <FilterButton href="/wines?type=sparkling" label="Sparkling" active={params.type === 'sparkling'} />
          <FilterButton href="/wines?type=rose" label="Rosé" active={params.type === 'rose'} />
        </div>

        {/* Wine Grid */}
        {wines.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wines.map((wine) => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-wine-800/30 p-12 text-center">
            <p className="text-wine-200">No wines found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function FilterButton({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-gold-500 text-wine-950'
          : 'bg-wine-800/50 text-wine-200 hover:bg-wine-700/50'
      }`}
    >
      {label}
    </Link>
  );
}

function WineCard({ wine }: { wine: Wine }) {
  return (
    <Link
      href={`/wines/${wine.slug}`}
      className="group rounded-xl bg-wine-800/30 p-4 backdrop-blur transition hover:bg-wine-800/50"
    >
      {/* Image */}
      <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-lg bg-wine-900/50">
        {wine.image_url ? (
          <Image
            src={wine.image_url}
            alt={wine.name}
            fill
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-wine-600">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}

        {/* Investment Score Badge */}
        {wine.investment_score && (
          <div className="absolute right-2 top-2 rounded-full bg-gold-500 px-2 py-1 text-xs font-bold text-wine-950">
            {wine.investment_score}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h3 className="mb-1 font-serif text-lg font-semibold text-gold-300 line-clamp-2">
          {wine.name}
        </h3>
        {wine.winery && (
          <p className="mb-2 text-sm text-wine-300">{wine.winery}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gold-400">
            £{wine.price_retail?.toFixed(2)}
          </span>
          {wine.vintage && (
            <span className="text-sm text-wine-400">{wine.vintage}</span>
          )}
        </div>
        {wine.region && (
          <p className="mt-2 text-xs text-wine-400">{wine.region}</p>
        )}
      </div>
    </Link>
  );
}
