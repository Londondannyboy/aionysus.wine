import { getWineBySlug, formatPrice, getWineInvestmentData, getSimilarWines, getWinesFromRegion, Wine, getMerchantConfig } from '@/lib/wine-db'
import { getWineEnrichment, getEnrichedWineLinks, getWineSEO } from '@/lib/wine-enrichment'
import { generateAutoSEO, getRegionExternalLinks, getInternalLinks, generateAboutContent } from '@/lib/seo-automation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { WineCardImage } from '@/components/WineImage'
import { WinePageContext } from '@/components/WinePageContext'
import { InvestmentCharts } from '@/components/InvestmentCharts'

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

  // Check for full enrichment first, then lightweight SEO overrides, then auto-generate
  const enrichment = getWineEnrichment(slug)
  const seoOverride = getWineSEO(slug)
  const autoSEO = generateAutoSEO(wine)

  // Priority: enrichment.seo > seoOverride > autoSEO
  const title = enrichment?.seo?.title || seoOverride?.title || autoSEO.title
  const description = enrichment?.seo?.metaDescription || seoOverride?.metaDescription || autoSEO.metaDescription

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

// Investment data visualization handled by InvestmentCharts client component

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
      { name: 'Wikipedia: Bordeaux Wine', url: 'https://en.wikipedia.org/wiki/Bordeaux_wine' },
      { name: 'Wine Spectator: Bordeaux', url: 'https://www.winespectator.com/regions/bordeaux' },
      { name: 'Jancis Robinson: Bordeaux', url: 'https://www.jancisrobinson.com/learn/wine-regions/france/bordeaux' },
      { name: 'Decanter: Bordeaux Guide', url: 'https://www.decanter.com/wine/wine-regions/bordeaux/' },
      { name: 'Liv-ex: Bordeaux Market', url: 'https://www.liv-ex.com' },
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
      { name: 'Bourgogne Wines (BIVB)', url: 'https://www.bourgogne-wines.com' },
      { name: 'Wikipedia: Burgundy Wine', url: 'https://en.wikipedia.org/wiki/Burgundy_wine' },
      { name: 'Climats de Bourgogne (UNESCO)', url: 'https://www.climats-bourgogne.com' },
      { name: 'Jancis Robinson: Burgundy', url: 'https://www.jancisrobinson.com/learn/wine-regions/france/burgundy' },
      { name: 'Decanter: Burgundy Guide', url: 'https://www.decanter.com/wine/wine-regions/burgundy/' },
      { name: 'Burghound', url: 'https://www.burghound.com' },
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
      { name: 'Comité Champagne', url: 'https://www.champagne.fr' },
      { name: 'Wikipedia: Champagne', url: 'https://en.wikipedia.org/wiki/Champagne_(wine)' },
      { name: 'Wine Spectator: Champagne', url: 'https://www.winespectator.com/regions/champagne' },
      { name: 'Jancis Robinson: Champagne', url: 'https://www.jancisrobinson.com/learn/wine-regions/france/champagne' },
      { name: 'Decanter: Champagne Guide', url: 'https://www.decanter.com/wine/wine-regions/champagne/' },
    ],
  },
  'Madeira': {
    description: 'Madeira produces some of the world\'s longest-lived wines, with a unique heated aging process that creates extraordinary complexity. The island\'s pre-phylloxera vintages, like the legendary Boal Borges 1875, represent some of the oldest drinkable wines in existence.',
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
    famousProducers: ['Blandy\'s', 'H.M. Borges', 'Henriques & Henriques', 'Barbeito', 'd\'Oliveiras'],
    externalLinks: [
      { name: 'Visit Madeira', url: 'https://www.visitmadeira.pt' },
      { name: 'Wikipedia: Madeira Wine', url: 'https://en.wikipedia.org/wiki/Madeira_wine' },
      { name: 'Madeira Wine Institute (IVBAM)', url: 'https://www.ivbam.gov-madeira.pt' },
      { name: 'Jancis Robinson: Madeira', url: 'https://www.jancisrobinson.com/learn/wine-regions/portugal/madeira' },
      { name: 'Decanter: Madeira Guide', url: 'https://www.decanter.com/wine/wine-regions/madeira/' },
      { name: 'Wine Spectator: Madeira', url: 'https://www.winespectator.com/articles/vintage-madeira' },
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
      <div className="bg-stone-50 rounded-xl p-6 border border-stone-200">
        <h4 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-4">Authority Resources</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {info.externalLinks.map((link) => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
              className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-700 hover:text-burgundy-700 hover:border-burgundy-300 text-sm font-medium transition-colors">
              {link.name} →
            </a>
          ))}
        </div>
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

/**
 * Tasting Notes Display Component
 * Parses HTML tasting notes and renders them as a beautiful styled component
 * with Nose, Palate, and Finish sections with icons
 */
function TastingNotesDisplay({ notes }: { notes: string }) {
  // Parse the HTML into sections
  const sections: { type: string; icon: string; label: string; content: string }[] = []
  let introContent = ''

  // Extract Nose, Palate, Finish sections from HTML
  const noseMatch = notes.match(/<strong>Nose:<\/strong>\s*([\s\S]*?)(?=<\/p>|<strong>)/i)
  const palateMatch = notes.match(/<strong>Palate:<\/strong>\s*([\s\S]*?)(?=<\/p>|<strong>)/i)
  const finishMatch = notes.match(/<strong>Finish:<\/strong>\s*([\s\S]*?)(?=<\/p>|$)/i)

  // Extract intro (everything before first <strong>)
  const introMatch = notes.match(/^<p>([\s\S]*?)(?=<strong>|<\/p>)/i)
  if (introMatch) {
    introContent = introMatch[1].replace(/<[^>]+>/g, '').trim()
  }

  if (noseMatch) sections.push({ type: 'nose', icon: '👃', label: 'Nose', content: noseMatch[1].replace(/<[^>]+>/g, '').trim() })
  if (palateMatch) sections.push({ type: 'palate', icon: '👅', label: 'Palate', content: palateMatch[1].replace(/<[^>]+>/g, '').trim() })
  if (finishMatch) sections.push({ type: 'finish', icon: '✨', label: 'Finish', content: finishMatch[1].replace(/<[^>]+>/g, '').trim() })

  // If no structured sections found, fall back to plain display
  if (sections.length === 0) {
    return (
      <div className="text-white/85 leading-loose text-lg space-y-6"
        dangerouslySetInnerHTML={{ __html: notes }}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Intro paragraph */}
      {introContent && (
        <p className="text-white/70 text-lg leading-loose italic border-l-4 border-white/30 pl-6">
          {introContent}
        </p>
      )}

      {/* Tasting sections grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div
            key={section.type}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 lg:p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{section.icon}</span>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                {section.label}
              </h3>
            </div>
            <p className="text-white/85 leading-loose text-[15px]">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
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

  // Fetch region wines, excluding those already in similar wines
  const similarIds = similarWines.map(w => w.id)
  const regionWines = await getWinesFromRegion(wine.id, wine.region, similarIds, 4)

  // Check for skyscraper enrichment content and lightweight SEO overrides
  const enrichment = getWineEnrichment(slug)
  const seoOverride = getWineSEO(slug)
  const autoSEO = generateAutoSEO(wine)

  // Get enriched wines for internal linking (keyword anchor text)
  const featuredWineLinks = getEnrichedWineLinks(slug)

  // Get auto-generated internal links based on region
  const autoInternalLinks = getInternalLinks(slug, wine.region, wine.country)

  // Get auto-generated external links based on region
  const autoExternalLinks = getRegionExternalLinks(wine.region, wine.country)

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
  // Priority: enrichment.seo > seoOverride > autoSEO
  const fullWineName = `${wine.vintage ? `${wine.vintage} ` : ''}${wine.name}`
  const seoH1 = enrichment?.seo?.h1 || seoOverride?.h1 || autoSEO.h1
  const seoKeyword = enrichment?.seo?.bodyKeyword || seoOverride?.bodyKeyword || autoSEO.bodyKeyword
  const seoImageAlt = enrichment?.seo?.imageAlt || autoSEO.imageAlt
  const seoImageTitle = autoSEO.imageTitle
  const foodPairings = getFoodPairings(wine.wine_type, wine.grape_variety)
  const drinkingWindow = getDrinkingWindow(wine.vintage, wine.wine_type, wine.classification)

  // Generate "About" content for non-enriched wines
  const aboutContent = !enrichment ? generateAboutContent(wine, seoKeyword) : []

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
              title={`${seoKeyword} - Boal Borges 1875 Madeira wine from ${wine.region}`}
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
                    title={seoImageTitle}
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
              <div className="mb-8 space-y-4" itemProp="description">
                <p className="text-stone-700 text-lg leading-loose">
                  <strong className="text-stone-900">{seoKeyword}</strong> is an exceptional wine from {wine.winery}, crafted in the prestigious {wine.region} region of {wine.country}.
                </p>
                <p className="text-stone-700 text-lg leading-loose">
                  {wine.classification && `Classified as ${wine.classification}, `}
                  {wine.grape_variety ? `this ${wine.grape_variety} wine` : 'This wine'} represents outstanding winemaking tradition and is highly sought after by collectors and investors.
                </p>
              </div>

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

          {/* About This Wine Section - SEO content for non-enriched wines */}
          {!enrichment && aboutContent.length > 0 && (
            <section className="mt-14 bg-stone-50 rounded-2xl p-8 border border-stone-200" aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-2xl font-bold text-stone-900 mb-4">
                About {seoKeyword}
              </h2>
              <div className="prose prose-stone max-w-none">
                {aboutContent.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="text-stone-700 leading-relaxed mb-4"
                    dangerouslySetInnerHTML={{ __html: paragraph }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Food Pairings Section (H2 with wine name - Mention 3) */}
          <section className="mt-14" aria-labelledby="pairings-heading">
            <h2 id="pairings-heading" className="text-2xl font-bold text-stone-900 mb-3">
              Food Pairings for {seoKeyword}
            </h2>
            <p className="text-stone-700 mb-8 text-lg leading-loose">
              {seoKeyword} pairs beautifully with a variety of dishes. Here are our recommended pairings for {seoKeyword}:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {foodPairings.slice(0, 8).map((pairing, i) => {
                const foodImages = [
                  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
                  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
                  'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=400&q=80',
                  'https://images.unsplash.com/photo-1546039907-7fa05f864c02?w=400&q=80',
                  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
                  'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80',
                  'https://images.unsplash.com/photo-1482049016530-d79f36437c8a?w=400&q=80',
                  'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80',
                ]
                return (
                  <div key={pairing} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                    <img
                      src={foodImages[i % foodImages.length]}
                      alt={`${pairing} paired with ${seoKeyword}`}
                      title={`${seoKeyword} food pairing - ${pairing}`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <span className="text-white font-semibold text-sm drop-shadow-lg">{pairing}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Investment Profile (moved higher for prominence) */}
          {investmentData && (
            <section className="mt-14" aria-labelledby="investment-heading">
              <h2 id="investment-heading" className="text-2xl font-bold text-stone-900 mb-6">
                {seoKeyword}
              </h2>
              <InvestmentCharts
                prices={[
                  { year: '2020', price: investmentData.price_2020 },
                  { year: '2021', price: investmentData.price_2021 },
                  { year: '2022', price: investmentData.price_2022 },
                  { year: '2023', price: investmentData.price_2023 },
                  { year: '2024', price: investmentData.price_2024 },
                  { year: '2025', price: investmentData.price_2025 },
                ]}
                annualReturn={investmentData.annual_return_pct}
                volatility={investmentData.volatility_score}
                liquidity={investmentData.liquidity_score}
                projectedReturn={investmentData.projected_5yr_return}
                rating={investmentData.investment_rating}
                recommendation={investmentData.analyst_recommendation}
                wineName={seoKeyword}
              />
            </section>
          )}

          {/* Tasting Notes (H2 with wine name - Mention 4) */}
          {wine.tasting_notes && (
            <section className="mt-16 -mx-6 relative overflow-hidden rounded-2xl" aria-labelledby="tasting-heading">
              <div className="relative min-h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=1200&q=80"
                  alt={`Wine tasting notes for ${seoKeyword}`}
                  title={`${seoKeyword} tasting notes - Boal Borges 1875 Madeira`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/60" />
                <div className="relative py-12 px-8 md:px-12">
                  <h2 id="tasting-heading" className="text-3xl font-light text-white tracking-tight mb-8">
                    {seoKeyword} Tasting Notes
                  </h2>
                  <TastingNotesDisplay notes={wine.tasting_notes} />
                </div>
              </div>
            </section>
          )}

          {/* Region Travel Section (for enriched wines with travel content) */}
          {enrichment?.regionTravel && enrichment?.regionImages && (
            <section className="mt-16 -mx-6 relative overflow-hidden" aria-labelledby="region-travel-heading">
              <div className="relative min-h-[500px] lg:min-h-[600px]">
                <img
                  src={enrichment.regionImages.mid}
                  alt={`${wine.region}, ${wine.country} - home of ${seoKeyword}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-transparent" />
                <div className="relative py-16 lg:py-24 px-8 lg:px-16 max-w-3xl">
                  <h2 id="region-travel-heading" className="text-3xl lg:text-5xl font-light text-white tracking-tight mb-8">
                    {enrichment.regionTravel.title}
                  </h2>
                  <p className="text-white/90 text-base lg:text-lg leading-loose mb-10 max-w-2xl">
                    {enrichment.regionTravel.intro}
                  </p>
                  <ul className="space-y-4">
                    {enrichment.regionTravel.highlights.map((highlight, i) => (
                      <li key={i} className="text-white/80 text-sm lg:text-base flex items-center gap-4">
                        <span className="w-2 h-2 rounded-full bg-white/70 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Skyscraper Enrichment Sections (for priority wines) */}
          {enrichment && (
            <>
              {/* Why This Wine Is Special - Hero Banner */}
              <section className="mt-16 -mx-6 relative overflow-hidden rounded-2xl" aria-labelledby="special-heading">
                <div className="relative min-h-[450px]">
                  <img
                    src={enrichment.heroImage}
                    alt={enrichment.heroAlt}
                    title={`Why ${seoKeyword} is special - Boal Borges 1875 vintage Madeira wine`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                  <div className="relative py-14 px-8 md:px-12 max-w-2xl">
                    <h2 id="special-heading" className="text-3xl font-light text-white tracking-tight mb-8">
                      Why This Vintage Is Special
                    </h2>
                    <ul className="space-y-4">
                      {enrichment.whySpecial.map((point, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <span className="w-2 h-2 rounded-full bg-white/70 flex-shrink-0 mt-2" />
                          <span className="text-white/90 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Producer Profile - Hero Banner */}
              <section className="mt-16 -mx-6 relative overflow-hidden rounded-2xl" aria-labelledby="producer-heading">
                <div className="relative min-h-[400px]">
                  <img
                    src={enrichment.producerProfile.image}
                    alt={enrichment.producerProfile.imageAlt}
                    title={`${enrichment.producerProfile.name} - producer of ${seoKeyword}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-black/10" />
                  <div className="relative py-14 px-8 md:px-12 flex flex-col justify-end min-h-[400px]">
                    <h2 id="producer-heading" className="text-3xl font-light text-white tracking-tight mb-6">
                      About {enrichment.producerProfile.name}
                    </h2>
                    <div className="space-y-5 max-w-3xl">
                      <div>
                        <h3 className="text-sm uppercase tracking-widest text-white/60 mb-2 font-semibold">History &amp; Heritage</h3>
                        <p className="text-white/90 leading-relaxed text-[15px]">{enrichment.producerProfile.history}</p>
                      </div>
                      <div>
                        <h3 className="text-sm uppercase tracking-widest text-white/60 mb-2 font-semibold">Winemaking Philosophy</h3>
                        <p className="text-white/90 leading-relaxed text-[15px]">{enrichment.producerProfile.philosophy}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Vintage Analysis - Hero Banner */}
              <section className="mt-16 -mx-6 relative overflow-hidden rounded-2xl" aria-labelledby="vintage-heading">
                <div className="relative min-h-[350px]">
                  <img
                    src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80"
                    alt={`Vineyard harvest - vintage analysis for ${seoKeyword}`}
                    title={`${seoKeyword} vintage analysis - 1875 Boal Borges Madeira`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/20" />
                  <div className="relative py-12 px-8 md:px-12 max-w-3xl">
                    <h2 id="vintage-heading" className="text-3xl font-light text-white tracking-tight mb-4">
                      {seoKeyword}: Vintage Analysis
                    </h2>
                    <h3 className="text-sm uppercase tracking-widest text-white/60 mb-6 font-semibold">Growing Conditions &amp; Wine Character</h3>
                    <div className="space-y-5">
                      {enrichment.vintageAnalysis.split('. ').reduce((acc: string[], sentence, i, arr) => {
                        const chunkSize = Math.ceil(arr.length / 3)
                        const chunkIndex = Math.floor(i / chunkSize)
                        if (!acc[chunkIndex]) acc[chunkIndex] = ''
                        acc[chunkIndex] += sentence + (i < arr.length - 1 ? '. ' : '')
                        return acc
                      }, []).map((para, i) => (
                        <p key={i} className="text-white/90 leading-relaxed text-[15px]">{para}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Critical Acclaim - Hero Banner */}
              {enrichment.criticalAcclaim.length > 0 && (
                <section className="mt-16 -mx-6 relative overflow-hidden rounded-2xl" aria-labelledby="acclaim-heading">
                  <div className="relative min-h-[400px]">
                    <img
                      src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80"
                      alt={`Wine tasting - critical acclaim for ${seoKeyword}`}
                      title={`${seoKeyword} critical reviews - Boal Borges 1875 scores`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative py-12 px-8 md:px-12">
                      <h2 id="acclaim-heading" className="text-3xl font-light text-white tracking-tight mb-8">
                        {seoKeyword} Critical Acclaim
                      </h2>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {enrichment.criticalAcclaim.map((review, i) => (
                          <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-white/70">{review.source}</span>
                              <span className="px-2 py-1 bg-white/20 text-white text-sm font-bold rounded">{review.score}</span>
                            </div>
                            <p className="text-white/80 text-sm italic">&ldquo;{review.quote}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Context Section - Hero Banner */}
              <section className="mt-16 -mx-6 relative overflow-hidden rounded-2xl" aria-labelledby="context-heading">
                <div className="relative min-h-[400px]">
                  <img
                    src="https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1200&q=80"
                    alt={`Wine history - ${enrichment.contextSection.title}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/45 to-black/25" />
                  <div className="relative py-14 px-8 md:px-12 max-w-3xl">
                    <h2 id="context-heading" className="text-3xl font-light text-white tracking-tight mb-4">
                      {enrichment.contextSection.title}
                    </h2>
                    <h3 className="text-sm uppercase tracking-widest text-white/60 mb-6 font-semibold">Historical Context &amp; Significance</h3>
                    <div className="space-y-5">
                      {enrichment.contextSection.content.split('. ').reduce((acc: string[], sentence, i, arr) => {
                        const chunkSize = Math.ceil(arr.length / 3)
                        const chunkIndex = Math.floor(i / chunkSize)
                        if (!acc[chunkIndex]) acc[chunkIndex] = ''
                        acc[chunkIndex] += sentence + (i < arr.length - 1 ? '. ' : '')
                        return acc
                      }, []).map((para, i) => (
                        <p key={i} className="text-white/90 leading-relaxed text-[15px]">{para}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Cellaring Guide */}
              <section className="mt-16 -mx-6 relative overflow-hidden rounded-2xl" aria-labelledby="cellar-heading">
                <div className="relative min-h-[400px]">
                  <img
                    src="https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?w=1200&q=80"
                    alt={`Wine cellar - cellaring guide for ${seoKeyword}`}
                    title={`Cellaring ${seoKeyword} - storage tips for Boal Borges 1875`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/20" />
                  <div className="relative py-12 px-8 md:px-12">
                    <h2 id="cellar-heading" className="text-3xl font-light text-white tracking-tight mb-2">
                      Cellaring This Vintage
                    </h2>
                    <h3 className="text-sm uppercase tracking-widest text-white/60 mb-8 font-semibold">Storage Recommendations &amp; Drinking Window</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-5">
                        <div className="flex items-start gap-4">
                          <span className="text-sm font-semibold text-white/60 w-28 flex-shrink-0 uppercase tracking-wider">Temperature</span>
                          <span className="text-white/90">{enrichment.cellaring.temperature}</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-sm font-semibold text-white/60 w-28 flex-shrink-0 uppercase tracking-wider">Humidity</span>
                          <span className="text-white/90">{enrichment.cellaring.humidity}</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-sm font-semibold text-white/60 w-28 flex-shrink-0 uppercase tracking-wider">Position</span>
                          <span className="text-white/90">{enrichment.cellaring.position}</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-sm font-semibold text-white/60 w-28 flex-shrink-0 uppercase tracking-wider">Peak Window</span>
                          <span className="text-white font-medium text-lg">{enrichment.cellaring.peakWindow}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-white/80 leading-loose text-base">{enrichment.cellaring.advice}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Enhanced Food Pairings - Image Strip */}
              <section className="mt-16" aria-labelledby="enhanced-pairings-heading">
                <h2 id="enhanced-pairings-heading" className="text-2xl font-bold text-stone-900 mb-3">
                  Expert Sommelier Food Pairings
                </h2>
                <p className="text-stone-600 mb-6">Curated pairings recommended by our sommelier team for {seoKeyword}.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {enrichment.additionalFoodPairings.slice(0, 8).map((pairing, i) => {
                    const expertFoodImages = [
                      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80',
                      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80',
                      'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80',
                      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&q=80',
                      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80',
                      'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&q=80',
                      'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80',
                      'https://images.unsplash.com/photo-1515778767554-42f384dba9c6?w=400&q=80',
                    ]
                    return (
                      <div key={pairing} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                        <img
                          src={expertFoodImages[i % expertFoodImages.length]}
                          alt={`${pairing} - expert pairing for ${seoKeyword}`}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <span className="text-white font-semibold text-sm drop-shadow-lg">{pairing}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Collector's Notes - with hero image */}
              <section className="mt-16 -mx-6 relative overflow-hidden rounded-2xl" aria-labelledby="collectors-heading">
                <div className="relative min-h-[350px]">
                  <img
                    src="https://images.unsplash.com/photo-1516594915307-8f71463e904b?w=1200&q=80"
                    alt={`Wine collection - collector's notes for ${seoKeyword}`}
                    title={`${seoKeyword} collector's notes - Boal Borges 1875 provenance`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/20" />
                  <div className="relative py-12 px-8 md:px-12 max-w-3xl">
                    <h2 id="collectors-heading" className="text-3xl font-light text-white tracking-tight mb-2">
                      Collector&apos;s Notes
                    </h2>
                    <h3 className="text-sm uppercase tracking-widest text-white/60 mb-6 font-semibold">Provenance, Authentication &amp; Value</h3>
                    <div className="space-y-5">
                      {enrichment.collectorsNotes.split('. ').reduce((acc: string[], sentence, i, arr) => {
                        const chunkSize = Math.ceil(arr.length / 3)
                        const chunkIndex = Math.floor(i / chunkSize)
                        if (!acc[chunkIndex]) acc[chunkIndex] = ''
                        acc[chunkIndex] += sentence + (i < arr.length - 1 ? '. ' : '')
                        return acc
                      }, []).map((para, i) => (
                        <p key={i} className="text-white/90 leading-relaxed text-[15px]">{para}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* FAQ Section for SEO */}
              {enrichment.faq && enrichment.faq.length > 0 && (
                <section className="mt-14" aria-labelledby="faq-heading">
                  <h2 id="faq-heading" className="text-2xl font-bold text-stone-900 mb-6">
                    Frequently Asked Questions About {seoKeyword}
                  </h2>
                  <div className="space-y-4">
                    {enrichment.faq.map((item, i) => (
                      <details key={i} className="group bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
                        <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-stone-900 hover:bg-stone-100 transition-colors">
                          <span>{item.question}</span>
                          <span className="ml-4 text-stone-400 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="px-5 pb-5 text-stone-700 leading-relaxed">
                          {item.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                  {/* FAQ Schema.org structured data */}
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                      __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: enrichment.faq.map((item) => ({
                          '@type': 'Question',
                          name: item.question,
                          acceptedAnswer: {
                            '@type': 'Answer',
                            text: item.answer,
                          },
                        })),
                      }),
                    }}
                  />
                </section>
              )}

              {/* External Authority Links */}
              {enrichment.externalLinks.length > 0 && (
                <section className="mt-14 bg-stone-50 rounded-2xl p-8 border border-stone-200" aria-labelledby="resources-heading">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-burgundy-100 rounded-lg flex items-center justify-center">
                      <span className="text-burgundy-700 text-sm font-bold">+</span>
                    </div>
                    <h2 id="resources-heading" className="text-2xl font-bold text-stone-900">
                      Further Reading &amp; Resources
                    </h2>
                  </div>
                  <p className="text-stone-600 mb-6 ml-11">Expert guides, official sources, and authority references for {seoKeyword}.</p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {enrichment.externalLinks.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-3 p-4 bg-white border border-stone-200 rounded-xl hover:border-burgundy-400 hover:shadow-md transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-stone-900 group-hover:text-burgundy-700 transition-colors text-sm">{link.name}</span>
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">{link.description}</p>
                        </div>
                        <span className="text-stone-300 group-hover:text-burgundy-500 flex-shrink-0 mt-0.5 transition-colors">&rarr;</span>
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

          {/* Region Information (H2 with wine name - Mention 6) */}
          {wine.region && (
            <RegionSection region={wine.region} wineName={fullWineName} />
          )}

          {/* Auto-generated External Links for non-enriched wines */}
          {!enrichment && autoExternalLinks.length > 0 && (
            <section className="mt-14 bg-stone-50 rounded-2xl p-8 border border-stone-200" aria-labelledby="auto-resources-heading">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-burgundy-100 rounded-lg flex items-center justify-center">
                  <span className="text-burgundy-700 text-sm font-bold">+</span>
                </div>
                <h2 id="auto-resources-heading" className="text-xl font-semibold text-stone-900">
                  Learn More About {wine.region} Wines
                </h2>
              </div>
              <p className="text-stone-600 mb-6">
                Explore authoritative resources about {wine.region} and {seoKeyword}:
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {autoExternalLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 bg-white border border-stone-200 rounded-lg hover:border-burgundy-400 hover:shadow-sm transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-stone-900 text-sm group-hover:text-burgundy-700 transition-colors">
                        {link.name}
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{link.description}</p>
                    </div>
                    <span className="text-stone-400 group-hover:text-burgundy-600 transition-colors">↗</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Auto-generated Internal Links for non-enriched wines */}
          {!enrichment && autoInternalLinks.length > 0 && (
            <section className="mt-10" aria-labelledby="auto-internal-heading">
              <h3 id="auto-internal-heading" className="text-lg font-semibold text-stone-900 mb-4">
                You Might Also Like
              </h3>
              <div className="flex flex-wrap gap-3">
                {autoInternalLinks.map((link) => (
                  <Link
                    key={link.slug}
                    href={`/wines/${link.slug}`}
                    className="px-4 py-2 bg-burgundy-50 border border-burgundy-200 rounded-lg text-burgundy-700 hover:bg-burgundy-100 hover:border-burgundy-400 transition-colors text-sm font-medium"
                  >
                    {link.keyword}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Similar Wines */}
          <SimilarWinesSection wines={similarWines} currentRegion={wine.region} wineName={fullWineName} />

          {/* From the Same Region */}
          {regionWines.length > 0 && wine.region && (
            <section className="mt-14" aria-labelledby="region-wines-heading">
              <h2 id="region-wines-heading" className="text-2xl font-bold text-stone-900 mb-2">
                More from {wine.region}
              </h2>
              <p className="text-stone-600 mb-6">
                Explore other wines from the {wine.region} region — different producers, vintages, and styles.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {regionWines.map((rw) => (
                  <Link key={rw.id} href={`/wines/${rw.slug}`}
                    className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-burgundy-400 hover:shadow-lg transition-all">
                    <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden">
                      <WineCardImage
                        src={rw.image_url}
                        alt={`${rw.vintage || ''} ${rw.name} from ${rw.winery}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-stone-900 text-sm line-clamp-2 group-hover:text-burgundy-700 transition-colors">
                        {rw.vintage && `${rw.vintage} `}{rw.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">{rw.winery}</p>
                      {rw.price_retail && (
                        <p className="text-sm font-bold text-stone-900 mt-2">{formatPrice(rw.price_retail)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Featured Collection - Internal keyword links for SEO */}
          {featuredWineLinks.length > 0 && (
            <section className="mt-14" aria-labelledby="featured-heading">
              <h3 id="featured-heading" className="text-lg font-semibold text-stone-900 mb-4">
                From Our Featured Collection
              </h3>
              <div className="flex flex-wrap gap-3">
                {featuredWineLinks.map((fw) => (
                  <Link
                    key={fw.slug}
                    href={`/wines/${fw.slug}`}
                    className="px-4 py-2 bg-burgundy-50 border border-burgundy-200 rounded-lg text-burgundy-700 hover:bg-burgundy-100 hover:border-burgundy-400 transition-colors text-sm font-medium"
                  >
                    {fw.keyword}
                  </Link>
                ))}
              </div>
            </section>
          )}

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
