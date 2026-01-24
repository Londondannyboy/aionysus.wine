import { getWineBySlug, formatPrice, getWineInvestmentData, WineInvestmentData, getSimilarWines, Wine, getMerchantConfig, MerchantConfig } from '@/lib/wine-db'
import { getWineEnrichment } from '@/lib/wine-enrichment'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { WineCardImage } from '@/components/WineImage'
import { WinePageContext } from '@/components/WinePageContext'

interface Props {
  params: Promise<{ slug: string }>
}

// Generate metadata for SEO - wine name appears multiple times
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const wine = await getWineBySlug(slug)

  if (!wine) {
    return { title: 'Wine Not Found | Aionysus' }
  }

  const enrichment = getWineEnrichment(slug)
  const fullName = `${wine.vintage ? `${wine.vintage} ` : ''}${wine.name}`
  const priceStr = wine.price_retail ? ` | From £${Math.round(wine.price_retail)}` : ''
  const title = enrichment?.seo?.title || `${fullName} | ${wine.winery}${priceStr} | Aionysus`
  const description = enrichment?.seo?.metaDescription || `${fullName} from ${wine.winery}, ${wine.region}${wine.country ? `, ${wine.country}` : ''}.${wine.price_retail ? ` From £${Math.round(wine.price_retail)}.` : ''} Expert tasting notes, food pairings${wine.classification ? `, ${wine.classification}` : ''}. Buy ${wine.name} online at Aionysus.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://aionysus.wine/wines/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: wine.image_url ? [wine.image_url] : [],
    },
  }
}

// Investment Rating Badge Colors (light theme)
const ratingColors: Record<string, string> = {
  'A+': 'bg-green-600 text-white',
  'A': 'bg-green-500 text-white',
  'B+': 'bg-amber-500 text-white',
  'B': 'bg-amber-400 text-black',
  'C': 'bg-orange-500 text-white',
}

// Recommendation Colors (light theme)
const recommendationColors: Record<string, string> = {
  'BUY': 'text-green-600 font-bold',
  'HOLD': 'text-amber-600 font-bold',
  'SELL': 'text-red-600 font-bold',
}

// Food pairings based on wine type
function getFoodPairings(wineType: string | null, grapeVariety: string | null): string[] {
  const type = (wineType || '').toLowerCase()
  const grape = (grapeVariety || '').toLowerCase()

  if (type.includes('champagne') || type.includes('sparkling') || grape.includes('chardonnay') && type.includes('sparkling')) {
    return ['Oysters & seafood', 'Smoked salmon canapés', 'Aged Parmesan', 'Fried chicken', 'Celebration desserts']
  }
  if (grape.includes('pinot noir')) {
    return ['Duck confit', 'Roast chicken', 'Salmon', 'Mushroom risotto', 'Beef Burgundy']
  }
  if (grape.includes('cabernet')) {
    return ['Ribeye steak', 'Lamb chops', 'Aged cheddar', 'Beef Wellington', 'Braised short ribs']
  }
  if (grape.includes('merlot')) {
    return ['Roast pork', 'Mushroom dishes', 'Blue cheese', 'Pasta with meat sauce', 'Grilled vegetables']
  }
  if (grape.includes('chardonnay')) {
    return ['Lobster', 'Roast chicken', 'Creamy pasta', 'Grilled fish', 'Brie cheese']
  }
  if (type.includes('red')) {
    return ['Grilled meats', 'Hard cheeses', 'Rich pasta dishes', 'Game meats', 'Charcuterie']
  }
  if (type.includes('white')) {
    return ['Seafood', 'Light salads', 'Goat cheese', 'Asian cuisine', 'Grilled vegetables']
  }
  if (type.includes('fortified') || type.includes('madeira') || type.includes('port')) {
    return ['Dark chocolate', 'Blue cheese', 'Nuts & dried fruits', 'Crème brûlée', 'Foie gras']
  }
  return ['Cheese board', 'Charcuterie', 'Grilled dishes', 'Mediterranean cuisine']
}

// Drinking window estimation
function getDrinkingWindow(vintage: number | null, wineType: string | null, classification: string | null): string {
  if (!vintage) return 'Ready to drink'

  const currentYear = new Date().getFullYear()
  const age = currentYear - vintage
  const type = (wineType || '').toLowerCase()
  const classif = (classification || '').toLowerCase()

  // Grand Cru / First Growth - very long aging
  if (classif.includes('grand cru') || classif.includes('premier cru') || classif.includes('first growth')) {
    const peakStart = vintage + 10
    const peakEnd = vintage + 40
    if (currentYear < peakStart) return `${peakStart} - ${peakEnd} (cellaring recommended)`
    if (currentYear <= peakEnd) return `Now - ${peakEnd} (at peak)`
    return `Drink now (mature)`
  }

  // Fortified wines - essentially immortal
  if (type.includes('fortified') || type.includes('madeira') || type.includes('port')) {
    return 'Now - indefinitely (will improve for decades)'
  }

  // Standard aging estimates
  if (age < 3) return `${vintage + 3} - ${vintage + 15}`
  if (age < 10) return `Now - ${vintage + 15}`
  return 'Drink now (fully mature)'
}

// Extended region information with travel guides
interface RegionData {
  description: string
  climate: string
  soils: string
  grapes: string[]
  travelGuide: string
  whereToStay: { name: string; description: string; link: string }[]
  wineTours: { name: string; description: string; link: string }[]
  bestTimeToVisit: string
  famousProducers: string[]
  externalLinks: { name: string; url: string }[]
}

const REGION_INFO: Record<string, RegionData> = {
  'Bordeaux': {
    description: 'Bordeaux is the world\'s most prestigious wine region, home to legendary estates and the birthplace of fine wine investment. The region spans both sides of the Gironde estuary, with the Left Bank famous for Cabernet Sauvignon-dominant wines from communes like Pauillac, Margaux, and Saint-Julien, while the Right Bank in Saint-Émilion and Pomerol excels with Merlot-based blends.',
    climate: 'Maritime climate with mild winters and warm summers, moderated by the Atlantic Ocean and Gironde estuary.',
    soils: 'Gravel, limestone, and clay soils across the Left and Right Banks.',
    grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot', 'Malbec'],
    travelGuide: 'Bordeaux is a UNESCO World Heritage city with stunning 18th-century architecture, world-class restaurants, and easy access to the wine châteaux.',
    whereToStay: [
      { name: 'Les Sources de Caudalie', description: 'Luxury spa hotel in Pessac-Léognan', link: 'https://www.sources-caudalie.com' },
      { name: 'La Grande Maison', description: 'Elegant hotel with Robuchon restaurant', link: 'https://www.lagrandemaison-bordeaux.com' },
      { name: 'InterContinental Bordeaux', description: 'Grand central hotel', link: 'https://www.ihg.com/intercontinental/hotels/gb/en/bordeaux' },
    ],
    wineTours: [
      { name: 'Bordeaux Wine Trails', description: 'Custom private tours', link: 'https://www.bordeaux-wine-trails.com' },
      { name: 'France Intense', description: 'Luxury wine experiences', link: 'https://www.france-intense.com' },
    ],
    bestTimeToVisit: 'September-October during harvest, or April-June',
    famousProducers: ['Château Lafite Rothschild', 'Château Margaux', 'Château Latour', 'Petrus', 'Château Cheval Blanc'],
    externalLinks: [
      { name: 'Bordeaux Wine Council', url: 'https://www.bordeaux.com' },
      { name: 'Wine Spectator Bordeaux', url: 'https://www.winespectator.com/regions/bordeaux' },
    ],
  },
  'Burgundy': {
    description: 'Burgundy represents the pinnacle of Pinot Noir and Chardonnay, with terroir-driven wines that command top prices worldwide.',
    climate: 'Continental climate with cold winters and warm summers.',
    soils: 'Limestone and marl soils, with each climat offering unique characteristics.',
    grapes: ['Pinot Noir', 'Chardonnay', 'Gamay', 'Aligoté'],
    travelGuide: 'Burgundy offers an intimate wine experience with small family domaines, charming villages, and exceptional gastronomy.',
    whereToStay: [
      { name: 'Hostellerie de Levernois', description: 'Relais & Châteaux near Beaune', link: 'https://www.levernois.com' },
      { name: 'Le Cep', description: 'Elegant hotel in Beaune', link: 'https://www.hotel-cep-beaune.com' },
    ],
    wineTours: [
      { name: 'Bourgogne Gold Tour', description: 'Private tours with local guides', link: 'https://www.bourgogne-gold-tour.com' },
    ],
    bestTimeToVisit: 'September-October for harvest, or May-June',
    famousProducers: ['Domaine de la Romanée-Conti', 'Domaine Leroy', 'Domaine Armand Rousseau'],
    externalLinks: [
      { name: 'Bourgogne Wines Official', url: 'https://www.bourgogne-wines.com' },
    ],
  },
  'Champagne': {
    description: 'The Champagne region produces the world\'s most celebrated sparkling wines, using traditional method fermentation.',
    climate: 'Cool continental climate at the northern limit of viticulture.',
    soils: 'Chalk subsoils that retain moisture and reflect heat.',
    grapes: ['Chardonnay', 'Pinot Noir', 'Pinot Meunier'],
    travelGuide: 'Visit grand maisons with impressive underground cellars and small grower-producers.',
    whereToStay: [
      { name: 'Royal Champagne Hotel', description: 'Luxury hotel overlooking vineyards', link: 'https://www.royalchampagne.com' },
    ],
    wineTours: [
      { name: 'A La Française Champagne', description: 'Premium producer tours', link: 'https://www.alafrancaise.fr' },
    ],
    bestTimeToVisit: 'April-October, harvest in September-October',
    famousProducers: ['Krug', 'Dom Pérignon', 'Salon', 'Bollinger'],
    externalLinks: [
      { name: 'Champagne Official', url: 'https://www.champagne.fr' },
    ],
  },
  'Madeira': {
    description: 'Madeira produces some of the world\'s longest-lived wines, with a unique heated aging process that creates extraordinary complexity.',
    climate: 'Subtropical maritime climate with warm temperatures year-round.',
    soils: 'Volcanic basalt soils on steep terraced vineyards.',
    grapes: ['Sercial', 'Verdelho', 'Boal', 'Malmsey', 'Tinta Negra'],
    travelGuide: 'Madeira combines wine culture with dramatic landscapes. Funchal offers easy access to historic lodges.',
    whereToStay: [
      { name: 'Belmond Reid\'s Palace', description: 'Legendary clifftop hotel', link: 'https://www.belmond.com/hotels/europe/portugal/madeira/belmond-reids-palace/' },
    ],
    wineTours: [
      { name: 'Blandy\'s Wine Lodge', description: 'Historic lodge tours', link: 'https://www.blandys.com' },
    ],
    bestTimeToVisit: 'Year-round destination',
    famousProducers: ['Blandy\'s', 'Henriques & Henriques', 'Barbeito', 'd\'Oliveiras'],
    externalLinks: [
      { name: 'Visit Madeira', url: 'https://www.visitmadeira.pt' },
    ],
  },
}

// Burgundy sub-regions mapping
const BURGUNDY_COMMUNES = [
  'Gevrey Chambertin', 'Chambolle Musigny', 'Vosne Romanée', 'Nuits Saint Georges',
  'Volnay', 'Corton', 'Clos de Vougeot', 'Meursault', 'Puligny Montrachet',
]

function getRegionInfo(region: string | null): (RegionData & { name: string }) | null {
  if (!region) return null
  if (REGION_INFO[region]) return { name: region, ...REGION_INFO[region] }

  const regionLower = region.toLowerCase()
  for (const commune of BURGUNDY_COMMUNES) {
    if (regionLower.includes(commune.toLowerCase())) {
      return { name: 'Burgundy', ...REGION_INFO['Burgundy'] }
    }
  }

  for (const [key, info] of Object.entries(REGION_INFO)) {
    if (regionLower.includes(key.toLowerCase())) {
      return { name: key, ...info }
    }
  }
  return null
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
    <section className="bg-stone-50 border border-stone-200 rounded-xl p-6 mt-10" aria-labelledby="investment-heading">
      <div className="flex items-center justify-between mb-6">
        <h2 id="investment-heading" className="text-2xl font-bold text-stone-900">
          {wineName} Investment Profile
        </h2>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${ratingColors[data.investment_rating || 'C']}`}>
            {data.investment_rating || 'N/A'}
          </span>
          <span className={recommendationColors[data.analyst_recommendation || 'HOLD']}>
            {data.analyst_recommendation || 'HOLD'}
          </span>
        </div>
      </div>

      {/* SEO: Wine name mentioned in investment context */}
      <div className="mb-6 text-stone-700">
        <p className="mb-3">
          <strong className="text-stone-900">{wineName}</strong> has demonstrated{' '}
          {data.annual_return_pct && data.annual_return_pct > 8 ? 'exceptional' : 'solid'}{' '}
          investment performance with an annual return of <strong className="text-green-700">{data.annual_return_pct}%</strong>.
        </p>
        <p>
          Over the past five years, {wineName} has grown by approximately <strong className="text-burgundy-700">{totalGrowth}%</strong>,
          making it an attractive option for wine investors.
        </p>
      </div>

      {/* Price History Chart */}
      <h3 className="text-lg font-semibold text-stone-900 mb-3">{wineName} Price History</h3>
      <div className="flex items-end gap-2 h-32 mb-6">
        {prices.map((p, i) => {
          const height = ((Number(p.price) - minPrice) / range) * 80 + 20
          return (
            <div key={p.year} className="flex-1 flex flex-col items-center">
              <div className="text-xs text-stone-500 mb-1">£{Number(p.price).toLocaleString()}</div>
              <div
                className={`w-full rounded-t transition-all ${i === prices.length - 1 ? 'bg-burgundy-600' : 'bg-stone-300'}`}
                style={{ height: `${height}%` }}
              />
              <span className="text-sm text-stone-500 mt-2">{p.year}</span>
            </div>
          )
        })}
      </div>

      {/* Key Metrics */}
      <h4 className="text-md font-semibold text-stone-900 mb-3">Key Metrics for {wineName}</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white rounded-lg border border-stone-200">
          <div className="text-2xl font-bold text-green-600">{data.annual_return_pct ? `+${data.annual_return_pct}%` : 'N/A'}</div>
          <div className="text-sm text-stone-500 mt-1">Annual Return</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border border-stone-200">
          <div className="text-2xl font-bold text-burgundy-600">{data.projected_5yr_return ? `+${data.projected_5yr_return}%` : 'N/A'}</div>
          <div className="text-sm text-stone-500 mt-1">5-Year Projection</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border border-stone-200">
          <div className="text-2xl font-bold text-stone-700">{data.volatility_score || 'N/A'}<span className="text-sm text-stone-400">/10</span></div>
          <div className="text-sm text-stone-500 mt-1">Volatility</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border border-stone-200">
          <div className="text-2xl font-bold text-stone-700">{data.liquidity_score || 'N/A'}<span className="text-sm text-stone-400">/10</span></div>
          <div className="text-sm text-stone-500 mt-1">Liquidity</div>
        </div>
      </div>

      <p className="text-xs text-stone-400 mt-6 text-center">
        Investment data for {wineName} is illustrative. Past performance does not guarantee future results.
      </p>
    </section>
  )
}

function RegionSection({ region, wineName }: { region: string; wineName: string }) {
  const info = getRegionInfo(region)
  if (!info) return null

  return (
    <section className="mt-10 space-y-6" aria-labelledby="region-heading">
      <h2 id="region-heading" className="text-2xl font-bold text-stone-900">
        About {info.name}: Home of {wineName}
      </h2>

      <div className="prose prose-stone max-w-none">
        <p className="text-stone-700 text-lg">
          {info.description} <strong>{wineName}</strong> exemplifies the quality this exceptional region produces.
        </p>
      </div>

      {/* Terroir Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
          <h4 className="font-semibold text-stone-900 mb-2">Climate</h4>
          <p className="text-stone-600 text-sm">{info.climate}</p>
        </div>
        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
          <h4 className="font-semibold text-stone-900 mb-2">Terroir</h4>
          <p className="text-stone-600 text-sm">{info.soils}</p>
        </div>
        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
          <h4 className="font-semibold text-stone-900 mb-2">Key Grapes</h4>
          <p className="text-stone-600 text-sm">{info.grapes.join(', ')}</p>
        </div>
      </div>

      {/* Famous Producers */}
      <div>
        <h3 className="text-xl font-bold text-stone-900 mb-3">Famous {info.name} Producers</h3>
        <div className="flex flex-wrap gap-2">
          {info.famousProducers.map((producer) => (
            <span key={producer} className="px-3 py-1 bg-burgundy-50 border border-burgundy-200 rounded-full text-burgundy-700 text-sm">
              {producer}
            </span>
          ))}
        </div>
      </div>

      {/* Travel Section */}
      <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl p-6 border border-stone-200">
        <h3 className="text-xl font-bold text-stone-900 mb-3">Visit {info.name}</h3>
        <p className="text-stone-700 mb-4">{info.travelGuide}</p>
        <p className="text-sm text-stone-600"><strong>Best time to visit:</strong> {info.bestTimeToVisit}</p>
      </div>

      {/* Where to Stay */}
      {info.whereToStay.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-stone-900 mb-3">Where to Stay in {info.name}</h4>
          <div className="grid md:grid-cols-3 gap-4">
            {info.whereToStay.map((hotel) => (
              <a key={hotel.name} href={hotel.link} target="_blank" rel="noopener noreferrer"
                className="block bg-white p-4 rounded-lg border border-stone-200 hover:border-burgundy-400 transition-colors">
                <h5 className="font-semibold text-stone-900">{hotel.name}</h5>
                <p className="text-stone-600 text-sm mt-1">{hotel.description}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* External Links */}
      <div className="flex flex-wrap gap-3">
        {info.externalLinks.map((link) => (
          <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-600 hover:text-burgundy-700 text-sm transition-colors">
            {link.name} →
          </a>
        ))}
      </div>
    </section>
  )
}

function SimilarWinesSection({ wines, currentRegion, wineName }: { wines: Wine[]; currentRegion: string | null; wineName: string }) {
  if (wines.length === 0) return null

  return (
    <section className="mt-10" aria-labelledby="similar-wines-heading">
      <h2 id="similar-wines-heading" className="text-2xl font-bold text-stone-900 mb-6">
        Similar Wines to {wineName}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {wines.map((wine) => (
          <Link key={wine.id} href={`/wines/${wine.slug}`}
            className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-burgundy-400 hover:shadow-lg transition-all">
            <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden">
              <WineCardImage
                src={wine.image_url}
                alt={`${wine.vintage || ''} ${wine.name} from ${wine.winery}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-stone-900 text-sm line-clamp-2 group-hover:text-burgundy-700 transition-colors">
                {wine.vintage && `${wine.vintage} `}{wine.name}
              </h3>
              <p className="text-xs text-stone-500 mt-1">{wine.winery}</p>
              <p className="text-xs text-burgundy-600 mt-1">{wine.region}</p>
              {wine.price_retail && (
                <p className="text-sm font-bold text-stone-900 mt-2">{formatPrice(wine.price_retail)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
      {currentRegion && (
        <div className="mt-6 text-center">
          <Link href={`/wines?region=${encodeURIComponent(currentRegion)}`}
            className="text-burgundy-600 hover:text-burgundy-800 font-medium">
            View all {currentRegion} wines →
          </Link>
        </div>
      )}
    </section>
  )
}

export default async function WineDetailPage({ params }: Props) {
  const { slug } = await params
  const wine = await getWineBySlug(slug)

  if (!wine) {
    notFound()
  }

  const [investmentData, similarWines, merchantConfig] = await Promise.all([
    getWineInvestmentData(wine.id),
    getSimilarWines(wine.id, wine.region, wine.winery, 4),
    getMerchantConfig(),
  ])

  // Check for skyscraper enrichment content
  const enrichment = getWineEnrichment(slug)

  // Map regions to dedicated region pages for internal linking
  const REGION_PAGE_MAP: Record<string, { slug: string; name: string }> = {
    'gevrey': { slug: 'gevrey-chambertin', name: 'Gevrey-Chambertin' },
    'gevrey-chambertin': { slug: 'gevrey-chambertin', name: 'Gevrey-Chambertin' },
    'gevrey chambertin': { slug: 'gevrey-chambertin', name: 'Gevrey-Chambertin' },
    'chassagne': { slug: 'chassagne-montrachet', name: 'Chassagne-Montrachet' },
    'chassagne-montrachet': { slug: 'chassagne-montrachet', name: 'Chassagne-Montrachet' },
    'chassagne montrachet': { slug: 'chassagne-montrachet', name: 'Chassagne-Montrachet' },
  }
  const regionLower = (wine.region || '').toLowerCase()
  const regionPage = Object.entries(REGION_PAGE_MAP).find(([key]) => regionLower.includes(key))?.[1] || null

  // Full wine name for SEO (used 6+ times throughout page)
  const fullWineName = `${wine.vintage ? `${wine.vintage} ` : ''}${wine.name}`
  const seoH1 = enrichment?.seo?.h1 || fullWineName
  const seoKeyword = enrichment?.seo?.bodyKeyword || fullWineName
  const seoImageAlt = enrichment?.seo?.imageAlt || `${fullWineName} wine bottle - ${wine.winery} ${wine.region} ${wine.country}`
  const foodPairings = getFoodPairings(wine.wine_type, wine.grape_variety)
  const drinkingWindow = getDrinkingWindow(wine.vintage, wine.wine_type, wine.classification)

  // Structured data values from merchant config
  const productImage = wine.image_url || merchantConfig.placeholder_image_url
  const availabilityUrl = `https://schema.org/${merchantConfig.product_availability}`

  return (
    <>
      {/* Provide wine context to CopilotKit so Vic knows about this wine */}
      <WinePageContext wine={wine} merchantConfig={merchantConfig} />

      {/* JSON-LD Structured Data for Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: fullWineName,
            description: `${fullWineName} from ${wine.winery}, ${wine.region}. ${wine.classification ? `${wine.classification}. ` : ''}${wine.grape_variety ? `${wine.grape_variety} wine` : 'Fine wine'} from ${wine.country}.`,
            image: productImage,
            brand: { '@type': 'Brand', name: wine.winery },
            category: wine.wine_type || 'Wine',
            ...(wine.price_retail && {
              offers: {
                '@type': 'Offer',
                price: wine.price_retail,
                priceCurrency: merchantConfig.price_currency,
                availability: availabilityUrl,
                seller: { '@type': 'Organization', name: merchantConfig.merchant_name },
                url: `${merchantConfig.merchant_url}/wines/${wine.slug}`,
                shippingDetails: {
                  '@type': 'OfferShippingDetails',
                  shippingDestination: {
                    '@type': 'DefinedRegion',
                    addressCountry: merchantConfig.shipping_country_code,
                  },
                  deliveryTime: {
                    '@type': 'ShippingDeliveryTime',
                    handlingTime: {
                      '@type': 'QuantitativeValue',
                      minValue: merchantConfig.shipping_handling_days_min,
                      maxValue: merchantConfig.shipping_handling_days_max,
                      unitCode: 'DAY',
                    },
                  },
                  shippingRate: {
                    '@type': 'MonetaryAmount',
                    value: merchantConfig.shipping_cost_value,
                    currency: merchantConfig.shipping_cost_currency,
                  },
                },
                hasMerchantReturnPolicy: {
                  '@type': 'MerchantReturnPolicy',
                  applicableCountry: merchantConfig.shipping_country_code,
                  returnPolicyCategory: `https://schema.org/${merchantConfig.return_policy_category}`,
                },
              },
            }),
            additionalProperty: [
              ...(wine.region ? [{ '@type': 'PropertyValue', name: 'Region', value: wine.region }] : []),
              ...(wine.vintage ? [{ '@type': 'PropertyValue', name: 'Vintage', value: wine.vintage.toString() }] : []),
              ...(wine.grape_variety ? [{ '@type': 'PropertyValue', name: 'Grape Variety', value: wine.grape_variety }] : []),
              ...(wine.classification ? [{ '@type': 'PropertyValue', name: 'Classification', value: wine.classification }] : []),
            ],
          }),
        }}
      />

      <div className="min-h-screen bg-white">
        {/* Full-Width Hero for Enriched Wines */}
        {enrichment?.regionImages && (
          <div className="relative w-full aspect-[21/9] lg:aspect-[3/1] overflow-hidden">
            <img
              src={enrichment.regionImages.hero}
              alt={`${seoKeyword} - ${wine.region}, ${wine.country}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <p className="text-white/70 text-sm uppercase tracking-[0.3em] mb-4 font-light">
                {wine.region} &middot; {wine.country}
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-light text-white tracking-tight mb-4">
                {seoKeyword}
              </h2>
              <p className="text-white/80 text-lg lg:text-xl font-light max-w-2xl italic">
                A journey through {wine.region}&apos;s most extraordinary wines
              </p>
            </div>
          </div>
        )}

        {/* Header Bar */}
        <div className="bg-stone-50 border-b border-stone-200 py-2">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-stone-500 text-sm text-center">
              <strong>Beta Platform</strong> — Wine purchases coming soon. Chat with Vic, our AI sommelier.
            </p>
          </div>
        </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-stone-500" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/wines" className="hover:text-burgundy-700" itemProp="item">
                <span itemProp="name">Wines</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <li className="text-stone-300">/</li>
            {wine.region && (
              <>
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Link
                    href={regionPage ? `/regions/${regionPage.slug}` : `/wines?region=${encodeURIComponent(wine.region)}`}
                    className="hover:text-burgundy-700"
                    itemProp="item"
                  >
                    <span itemProp="name">{regionPage ? regionPage.name : wine.region}</span>
                  </Link>
                  <meta itemProp="position" content="2" />
                </li>
                <li className="text-stone-300">/</li>
              </>
            )}
            <li className="text-stone-900 font-medium" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name">{wine.name}</span>
              <meta itemProp="position" content={wine.region ? "3" : "2"} />
            </li>
          </ol>
        </nav>

        {/* Main Content */}
        <article itemScope itemType="https://schema.org/Product">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Wine Image */}
            <div>
              <div className="aspect-[3/4] bg-stone-100 rounded-xl overflow-hidden border border-stone-200">
                {wine.image_url ? (
                  <img
                    src={wine.image_url}
                    alt={seoImageAlt}
                    className="w-full h-full object-cover"
                    itemProp="image"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                    <span className="text-9xl opacity-40">🍷</span>
                    <meta itemProp="image" content={merchantConfig.placeholder_image_url} />
                  </div>
                )}
              </div>
              {wine.image_credit && (
                <p className="text-xs text-stone-400 mt-2 text-center">
                  <a href={wine.image_credit_url || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 transition-colors">
                    Image: {wine.image_credit} ↗
                  </a>
                </p>
              )}
            </div>

            {/* Wine Details */}
            <div>
              {/* H1 - Wine Name (SEO Critical - Mention 1) */}
              <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-2" itemProp="name">
                {seoH1}
              </h1>
              <p className="text-xl text-burgundy-700 mb-4 font-medium" itemProp="brand">{wine.winery}</p>

              {/* Price */}
              <div className="text-3xl font-bold text-stone-900 mb-6" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                <span itemProp="price" content={wine.price_retail?.toString() || '0'}>
                  {formatPrice(wine.price_retail)}
                </span>
                <meta itemProp="priceCurrency" content={merchantConfig.price_currency} />
                <link itemProp="availability" href={availabilityUrl} />
                {wine.bottle_size && (
                  <span className="text-base font-normal text-stone-500 ml-2">/ {wine.bottle_size}</span>
                )}
              </div>

              {/* Wine Description (SEO - Mention 2 with bold) */}
              <p className="text-stone-700 mb-6 text-lg leading-relaxed" itemProp="description">
                <strong className="text-stone-900">{seoKeyword}</strong> is an exceptional wine from {wine.winery},
                crafted in the prestigious {wine.region} region of {wine.country}.
                {wine.classification && ` Classified as ${wine.classification},`}
                {wine.grape_variety && ` this ${wine.grape_variety} wine`} represents outstanding winemaking tradition
                and is highly sought after by collectors and investors.
              </p>

              {/* Quick Facts Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <div className="text-sm text-stone-500 mb-1">Region</div>
                  <Link href={`/wines?region=${encodeURIComponent(wine.region || '')}`} className="font-semibold text-stone-900 hover:text-burgundy-700">
                    {wine.region}
                  </Link>
                </div>
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <div className="text-sm text-stone-500 mb-1">Country</div>
                  <Link href={`/wines?country=${encodeURIComponent(wine.country || '')}`} className="font-semibold text-stone-900 hover:text-burgundy-700">
                    {wine.country}
                  </Link>
                </div>
                {wine.grape_variety && (
                  <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                    <div className="text-sm text-stone-500 mb-1">Grape Variety</div>
                    <div className="font-semibold text-stone-900">{wine.grape_variety}</div>
                  </div>
                )}
                {wine.vintage && (
                  <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                    <div className="text-sm text-stone-500 mb-1">Vintage</div>
                    <div className="font-semibold text-stone-900">{wine.vintage}</div>
                  </div>
                )}
              </div>

              {/* Drinking Window & Classification */}
              <div className="bg-burgundy-50 border border-burgundy-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-burgundy-600 mb-1">Drinking Window</div>
                    <div className="font-bold text-burgundy-900">{drinkingWindow}</div>
                  </div>
                  {wine.classification && (
                    <div className="text-right">
                      <div className="text-sm text-burgundy-600 mb-1">Classification</div>
                      <div className="font-bold text-burgundy-900">{wine.classification}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                disabled
                className="w-full py-4 bg-stone-200 text-stone-500 rounded-lg font-semibold text-lg cursor-not-allowed mb-3"
              >
                Coming Soon — Demo Mode
              </button>
              <p className="text-sm text-stone-500 text-center">
                Chat with Vic to learn more about <strong>{wine.name}</strong>
              </p>
            </div>
          </div>

          {/* Food Pairings Section (H2 with wine name - Mention 3) */}
          <section className="mt-10" aria-labelledby="pairings-heading">
            <h2 id="pairings-heading" className="text-2xl font-bold text-stone-900 mb-4">
              Food Pairings for {seoKeyword}
            </h2>
            <p className="text-stone-700 mb-4">
              {seoKeyword} pairs beautifully with a variety of dishes. Here are our recommended pairings:
            </p>
            <div className="flex flex-wrap gap-3">
              {foodPairings.map((pairing) => (
                <span key={pairing} className="px-4 py-2 bg-stone-100 border border-stone-200 rounded-full text-stone-700">
                  {pairing}
                </span>
              ))}
            </div>
          </section>

          {/* Tasting Notes (H2 with wine name - Mention 4) */}
          {wine.tasting_notes && (
            <section className="mt-10" aria-labelledby="tasting-heading">
              <h2 id="tasting-heading" className="text-2xl font-bold text-stone-900 mb-4">
                {seoKeyword} Tasting Notes
              </h2>
              <div className="prose prose-stone max-w-none text-stone-700"
                dangerouslySetInnerHTML={{ __html: wine.tasting_notes }}
              />
            </section>
          )}

          {/* Region Travel Section (for enriched wines with travel content) */}
          {enrichment?.regionTravel && enrichment?.regionImages && (
            <section className="mt-16 -mx-6 relative overflow-hidden" aria-labelledby="region-travel-heading">
              <div className="relative aspect-[21/9] lg:aspect-[3/1]">
                <img
                  src={enrichment.regionImages.mid}
                  alt={`${wine.region}, ${wine.country} - home of ${seoKeyword}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-3xl px-8 lg:px-16">
                    <h2 id="region-travel-heading" className="text-3xl lg:text-5xl font-light text-white tracking-tight mb-4">
                      {enrichment.regionTravel.title}
                    </h2>
                    <p className="text-white/85 text-base lg:text-lg leading-relaxed mb-6 max-w-2xl">
                      {enrichment.regionTravel.intro}
                    </p>
                    <ul className="space-y-2">
                      {enrichment.regionTravel.highlights.map((highlight, i) => (
                        <li key={i} className="text-white/75 text-sm lg:text-base flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Skyscraper Enrichment Sections (for priority wines) */}
          {enrichment && (
            <>
              {/* Why This Wine Is Special */}
              <section className="mt-10" aria-labelledby="special-heading">
                <h2 id="special-heading" className="text-2xl font-bold text-stone-900 mb-4">
                  Why {seoKeyword} Is Special
                </h2>
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <ul className="space-y-3">
                    {enrichment.whySpecial.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-burgundy-500 flex-shrink-0 mt-2" />
                        <span className="text-stone-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                    <img
                      src={enrichment.heroImage}
                      alt={enrichment.heroAlt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </section>

              {/* Producer Profile */}
              <section className="mt-10 bg-stone-50 border border-stone-200 rounded-xl p-6 md:p-8" aria-labelledby="producer-heading">
                <h2 id="producer-heading" className="text-2xl font-bold text-stone-900 mb-4">
                  About {enrichment.producerProfile.name}
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <p className="text-stone-700 leading-relaxed">{enrichment.producerProfile.history}</p>
                    <p className="text-stone-700 leading-relaxed"><strong>Philosophy:</strong> {enrichment.producerProfile.philosophy}</p>
                  </div>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                    <img
                      src={enrichment.producerProfile.image}
                      alt={enrichment.producerProfile.imageAlt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </section>

              {/* Vintage Analysis */}
              <section className="mt-10" aria-labelledby="vintage-heading">
                <h2 id="vintage-heading" className="text-2xl font-bold text-stone-900 mb-4">
                  {seoKeyword}: Vintage Analysis
                </h2>
                <p className="text-stone-700 leading-relaxed text-lg">{enrichment.vintageAnalysis}</p>
              </section>

              {/* Critical Acclaim */}
              {enrichment.criticalAcclaim.length > 0 && (
                <section className="mt-10" aria-labelledby="acclaim-heading">
                  <h2 id="acclaim-heading" className="text-2xl font-bold text-stone-900 mb-4">
                    {seoKeyword} Critical Acclaim
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enrichment.criticalAcclaim.map((review, i) => (
                      <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-stone-600">{review.source}</span>
                          <span className="px-2 py-1 bg-burgundy-100 text-burgundy-700 text-sm font-bold rounded">{review.score}</span>
                        </div>
                        <p className="text-stone-700 text-sm italic">&ldquo;{review.quote}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Context Section (unique deep-dive content) */}
              <section className="mt-10" aria-labelledby="context-heading">
                <h2 id="context-heading" className="text-2xl font-bold text-stone-900 mb-4">
                  {enrichment.contextSection.title}
                </h2>
                <p className="text-stone-700 leading-relaxed text-lg">{enrichment.contextSection.content}</p>
              </section>

              {/* Cellaring Guide */}
              <section className="mt-10 bg-stone-50 border border-stone-200 rounded-xl p-6 md:p-8" aria-labelledby="cellar-heading">
                <h2 id="cellar-heading" className="text-2xl font-bold text-stone-900 mb-4">
                  Cellaring {seoKeyword}
                </h2>
                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-semibold text-stone-500 w-24 flex-shrink-0">Temperature</span>
                      <span className="text-stone-700">{enrichment.cellaring.temperature}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-semibold text-stone-500 w-24 flex-shrink-0">Humidity</span>
                      <span className="text-stone-700">{enrichment.cellaring.humidity}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-semibold text-stone-500 w-24 flex-shrink-0">Position</span>
                      <span className="text-stone-700">{enrichment.cellaring.position}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-semibold text-stone-500 w-24 flex-shrink-0">Peak Window</span>
                      <span className="text-stone-700 font-medium">{enrichment.cellaring.peakWindow}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-stone-700 leading-relaxed">{enrichment.cellaring.advice}</p>
                  </div>
                </div>
              </section>

              {/* Enhanced Food Pairings */}
              <section className="mt-10" aria-labelledby="enhanced-pairings-heading">
                <h2 id="enhanced-pairings-heading" className="text-2xl font-bold text-stone-900 mb-4">
                  Expert Food Pairings for {seoKeyword}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {enrichment.additionalFoodPairings.map((pairing) => (
                    <span key={pairing} className="px-4 py-2 bg-burgundy-50 border border-burgundy-200 rounded-full text-burgundy-700">
                      {pairing}
                    </span>
                  ))}
                </div>
              </section>

              {/* Collector's Notes */}
              <section className="mt-10 bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-xl p-6 md:p-8" aria-labelledby="collectors-heading">
                <h2 id="collectors-heading" className="text-2xl font-bold text-stone-900 mb-4">
                  Collector&apos;s Notes: {seoKeyword}
                </h2>
                <p className="text-stone-700 leading-relaxed">{enrichment.collectorsNotes}</p>
              </section>

              {/* External Authority Links */}
              {enrichment.externalLinks.length > 0 && (
                <section className="mt-10" aria-labelledby="resources-heading">
                  <h2 id="resources-heading" className="text-2xl font-bold text-stone-900 mb-4">
                    Further Reading &amp; Resources
                  </h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {enrichment.externalLinks.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-4 bg-white border border-stone-200 rounded-lg hover:border-burgundy-400 transition-colors"
                      >
                        <div>
                          <span className="font-medium text-stone-900 hover:text-burgundy-700">{link.name}</span>
                          <p className="text-sm text-stone-500 mt-0.5">{link.description}</p>
                        </div>
                        <span className="text-stone-400 flex-shrink-0 mt-0.5">&rarr;</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* CTA Footer with Region Image (for enriched wines) */}
          {enrichment?.regionImages && (
            <section className="mt-16 -mx-6 relative overflow-hidden">
              <div className="relative py-20 lg:py-28">
                <img
                  src={enrichment.regionImages.footer}
                  alt={`Experience ${seoKeyword} - ${wine.region}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/55" />
                <div className="relative text-center px-6">
                  <h3 className="text-3xl lg:text-4xl font-light text-white tracking-tight mb-4">
                    Experience {seoKeyword}
                  </h3>
                  <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                    Discover the story behind this extraordinary wine. Chat with Vic, our AI sommelier.
                  </p>
                  <Link
                    href="/"
                    className="inline-block px-8 py-4 bg-white text-stone-900 font-semibold rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    Chat with Vic →
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Investment Profile (H2 with wine name - Mention 5) */}
          {investmentData && <InvestmentCard data={investmentData} wineName={fullWineName} />}

          {/* Region Information (H2 with wine name - Mention 6) */}
          {wine.region && (
            <RegionSection region={wine.region} wineName={fullWineName} />
          )}

          {/* Similar Wines */}
          <SimilarWinesSection wines={similarWines} currentRegion={wine.region} wineName={fullWineName} />

          {/* Final CTA */}
          <section className="mt-10 bg-stone-50 border border-stone-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold text-stone-900 mb-2">
              Interested in {wine.name}?
            </h3>
            <p className="text-stone-600 mb-4">
              Speak with Vic, our AI sommelier, to learn more about this wine and get personalized recommendations.
            </p>
            <Link href="/" className="inline-block px-6 py-3 bg-burgundy-600 text-white rounded-lg font-semibold hover:bg-burgundy-700 transition-colors">
              Chat with Vic
            </Link>
          </section>
        </article>
      </div>
      </div>
    </>
  )
}
