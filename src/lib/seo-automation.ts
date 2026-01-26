/**
 * SEO Automation Module
 * Auto-generates SEO data for all wines based on patterns
 * Maps regions to external authority links
 * Creates internal linking rules
 */

import { Wine } from './wine-db'

// ============================================================================
// AUTO-GENERATED SEO DATA
// ============================================================================

export interface AutoSEO {
  title: string
  metaDescription: string
  h1: string
  bodyKeyword: string
  imageAlt: string
  imageTitle: string
}

/**
 * Auto-generate SEO data for any wine based on its properties
 * Uses patterns derived from GSC keyword analysis
 */
export function generateAutoSEO(wine: Wine): AutoSEO {
  const vintage = wine.vintage ? `${wine.vintage} ` : ''
  const fullName = `${vintage}${wine.name}`.trim()

  // Derive the most likely search keyword
  // Patterns from GSC: "wine name", "producer wine", "wine vintage", "producer region"
  const bodyKeyword = deriveKeyword(wine)

  // Title: Keyword first, under 60 chars, include brand
  const titleBase = `${bodyKeyword} | ${wine.winery}`
  const title = titleBase.length > 55
    ? `${bodyKeyword} | Aionysus`
    : `${titleBase} | Aionysus`

  // Meta description: 140-160 chars, keyword included, call to action
  const metaDescription = generateMetaDescription(wine, bodyKeyword)

  // H1: Can be slightly different from title
  const h1 = fullName

  // Image alt and title with keyword
  const imageAlt = `${bodyKeyword} wine bottle - ${wine.winery} ${wine.region} ${wine.country}`
  const imageTitle = `${bodyKeyword} - ${wine.winery} ${wine.vintage || ''} wine`

  return {
    title,
    metaDescription,
    h1,
    bodyKeyword,
    imageAlt,
    imageTitle,
  }
}

/**
 * Derive the most searchable keyword from wine data
 * Based on GSC patterns analysis
 */
function deriveKeyword(wine: Wine): string {
  const vintage = wine.vintage ? `${wine.vintage} ` : ''
  const wineName = wine.name
  const producer = wine.winery

  // Pattern 1: Famous producers - people search "producer wine" or just "producer"
  const famousProducers = [
    'petrus', 'giaconda', 'gunderloch', 'henschke', 'ridgeview',
    'jim barry', 'contino', 'glaetzer', 'smith woodhouse', 'denbies',
    'nyetimber', 'gusbourne', 'chapel down', 'bollinger', 'krug',
    'romanee-conti', 'drc', 'leroy', 'roumier', 'rousseau'
  ]

  const producerLower = (producer || '').toLowerCase()
  const isFamousProducer = famousProducers.some(p => producerLower.includes(p))

  // Pattern 2: Classification-based keywords (Grand Cru, 1er Cru, etc.)
  const hasClassification = wine.classification &&
    ['grand cru', 'premier cru', '1er cru', 'gran reserva', 'riserva'].some(
      c => (wine.classification || '').toLowerCase().includes(c)
    )

  // Pattern 3: Specific wine names that are searched as-is
  // (Camartina, Armagh, Anaperenna, etc.)
  const specificWineNames = [
    'camartina', 'armagh', 'anaperenna', 'hill of roses', 'bloomsbury',
    'fitzrovia', 'english gent', 'petit caro', 'clos du village'
  ]
  const hasSpecificName = specificWineNames.some(n =>
    wineName.toLowerCase().includes(n)
  )

  // Decision logic:
  if (hasSpecificName) {
    // Use the specific wine name with vintage if available
    return `${vintage}${wineName}`.trim()
  }

  if (isFamousProducer) {
    // Famous producers: "Producer WineName" or "Producer Wine"
    const shortName = wineName.split(' ').slice(0, 3).join(' ')
    return `${producer} ${shortName}`.trim()
  }

  if (hasClassification) {
    // Classification wines: include the classification
    return `${vintage}${wineName} ${wine.classification}`.trim()
  }

  // Default: Full wine name with vintage
  return `${vintage}${wineName}`.trim()
}

/**
 * Generate meta description (140-160 chars)
 */
function generateMetaDescription(wine: Wine, keyword: string): string {
  const vintage = wine.vintage ? `${wine.vintage} ` : ''
  const price = wine.price_retail ? `From £${Math.round(wine.price_retail)}. ` : ''

  // Different templates based on wine type/region
  const templates = [
    // Template 1: Buy + keyword + origin + CTA
    `Buy ${keyword} — ${wine.wine_type || 'fine wine'} from ${wine.region}, ${wine.country}. ${price}Expert tasting notes & food pairings.`,

    // Template 2: Keyword + producer focus
    `${keyword} from ${wine.winery}. ${wine.region} ${wine.wine_type || 'wine'}. ${price}Buy online at Aionysus.`,

    // Template 3: Short and punchy
    `Buy ${keyword} — exceptional ${wine.wine_type || 'wine'} from ${wine.winery}. ${price}Free UK delivery available.`,
  ]

  // Pick template that fits within 160 chars
  for (const template of templates) {
    if (template.length <= 160) {
      return template
    }
  }

  // Fallback: truncate first template
  return templates[0].substring(0, 157) + '...'
}

// ============================================================================
// REGION-BASED EXTERNAL LINKS
// ============================================================================

export interface ExternalLink {
  name: string
  url: string
  description: string
}

/**
 * Get authority external links based on wine region/country
 */
export function getRegionExternalLinks(region: string, country: string): ExternalLink[] {
  const regionLower = (region || '').toLowerCase()
  const countryLower = (country || '').toLowerCase()

  // Always include these universal links
  const universalLinks: ExternalLink[] = [
    { name: 'Wine-Searcher', url: 'https://www.wine-searcher.com', description: 'Global wine prices and availability' },
    { name: 'Vivino', url: 'https://www.vivino.com', description: 'World\'s largest wine community' },
  ]

  // Region-specific links
  const regionLinks = REGION_EXTERNAL_LINKS[regionLower] || []
  const countryLinks = COUNTRY_EXTERNAL_LINKS[countryLower] || []

  // Combine and dedupe
  const allLinks = [...universalLinks, ...regionLinks, ...countryLinks]
  const seen = new Set<string>()
  return allLinks.filter(link => {
    if (seen.has(link.url)) return false
    seen.add(link.url)
    return true
  }).slice(0, 12) // Limit to 12 links
}

const REGION_EXTERNAL_LINKS: Record<string, ExternalLink[]> = {
  // FRANCE - Burgundy
  'burgundy': [
    { name: 'BIVB (Burgundy Wine Board)', url: 'https://www.bourgogne-wines.com', description: 'Official Burgundy wine authority' },
    { name: 'Wikipedia: Burgundy Wine', url: 'https://en.wikipedia.org/wiki/Burgundy_wine', description: 'Comprehensive Burgundy wine guide' },
    { name: 'Jancis Robinson: Burgundy', url: 'https://www.jancisrobinson.com/learn/wine-regions/france/burgundy', description: 'Master of Wine expert guide' },
    { name: 'Decanter: Burgundy', url: 'https://www.decanter.com/wine/wine-regions/burgundy/', description: 'Award-winning wine magazine' },
    { name: 'Climats de Bourgogne (UNESCO)', url: 'https://www.climats-bourgogne.com', description: 'UNESCO World Heritage vineyards' },
  ],
  'chablis': [
    { name: 'BIVB: Chablis', url: 'https://www.bourgogne-wines.com/our-wines/our-appellations/chablis', description: 'Official Chablis appellation guide' },
    { name: 'Wikipedia: Chablis', url: 'https://en.wikipedia.org/wiki/Chablis', description: 'Chablis wine region overview' },
    { name: 'Decanter: Chablis Guide', url: 'https://www.decanter.com/wine/wine-regions/chablis/', description: 'Expert Chablis coverage' },
  ],
  'gevrey-chambertin': [
    { name: 'BIVB (Burgundy Wine Board)', url: 'https://www.bourgogne-wines.com', description: 'Official Burgundy wine authority' },
    { name: 'Wikipedia: Gevrey-Chambertin', url: 'https://en.wikipedia.org/wiki/Gevrey-Chambertin', description: 'Gevrey-Chambertin appellation guide' },
    { name: 'Burghound', url: 'https://www.burghound.com', description: 'Burgundy specialist critic' },
  ],
  'gevrey chambertin': [
    { name: 'BIVB (Burgundy Wine Board)', url: 'https://www.bourgogne-wines.com', description: 'Official Burgundy wine authority' },
    { name: 'Wikipedia: Gevrey-Chambertin', url: 'https://en.wikipedia.org/wiki/Gevrey-Chambertin', description: 'Gevrey-Chambertin appellation guide' },
    { name: 'Burghound', url: 'https://www.burghound.com', description: 'Burgundy specialist critic' },
  ],
  'vougeot': [
    { name: 'BIVB (Burgundy Wine Board)', url: 'https://www.bourgogne-wines.com', description: 'Official Burgundy wine authority' },
    { name: 'Wikipedia: Vougeot', url: 'https://en.wikipedia.org/wiki/Vougeot', description: 'Vougeot appellation guide' },
    { name: 'Château du Clos de Vougeot', url: 'https://www.closdevougeot.fr', description: 'Historic Burgundy château' },
  ],
  'pommard': [
    { name: 'BIVB (Burgundy Wine Board)', url: 'https://www.bourgogne-wines.com', description: 'Official Burgundy wine authority' },
    { name: 'Wikipedia: Pommard', url: 'https://en.wikipedia.org/wiki/Pommard', description: 'Pommard appellation guide' },
  ],
  'bâtard montrachet': [
    { name: 'BIVB (Burgundy Wine Board)', url: 'https://www.bourgogne-wines.com', description: 'Official Burgundy wine authority' },
    { name: 'Wikipedia: Montrachet', url: 'https://en.wikipedia.org/wiki/Montrachet', description: 'Montrachet Grand Cru guide' },
  ],

  // FRANCE - Bordeaux
  'bordeaux': [
    { name: 'Bordeaux Wine Council', url: 'https://www.bordeaux.com/en/', description: 'Official Bordeaux wine authority' },
    { name: 'Wikipedia: Bordeaux Wine', url: 'https://en.wikipedia.org/wiki/Bordeaux_wine', description: 'Comprehensive Bordeaux guide' },
    { name: 'Decanter: Bordeaux', url: 'https://www.decanter.com/wine/wine-regions/bordeaux/', description: 'Expert Bordeaux coverage' },
    { name: 'Robert Parker Wine Advocate', url: 'https://www.robertparker.com', description: 'Definitive Bordeaux critic' },
  ],
  'pomerol': [
    { name: 'Bordeaux Wine Council: Pomerol', url: 'https://www.bordeaux.com/en/Our-Terroir/Appellations/Pomerol', description: 'Official Pomerol guide' },
    { name: 'Wikipedia: Pomerol', url: 'https://en.wikipedia.org/wiki/Pomerol', description: 'Pomerol appellation overview' },
  ],

  // FRANCE - Champagne
  'champagne': [
    { name: 'Comité Champagne', url: 'https://www.champagne.fr/en', description: 'Official Champagne authority' },
    { name: 'Wikipedia: Champagne', url: 'https://en.wikipedia.org/wiki/Champagne', description: 'Champagne wine guide' },
    { name: 'Decanter: Champagne', url: 'https://www.decanter.com/wine/wine-regions/champagne/', description: 'Expert Champagne coverage' },
  ],

  // PORTUGAL - Madeira
  'madeira': [
    { name: 'IVBAM (Madeira Wine Institute)', url: 'https://www.ivbam.gov-madeira.pt', description: 'Official Madeira DOC authority' },
    { name: 'Wikipedia: Madeira Wine', url: 'https://en.wikipedia.org/wiki/Madeira_wine', description: 'Comprehensive Madeira guide' },
    { name: 'Visit Madeira', url: 'https://www.visitmadeira.pt', description: 'Official tourism authority' },
    { name: 'BBC Travel: Madeira', url: 'https://www.bbc.com/travel/article/20191110-madeira-the-wine-that-cant-be-destroyed', description: 'BBC feature on Madeira wine' },
  ],

  // PORTUGAL - Port
  'port': [
    { name: 'IVDP (Port Wine Institute)', url: 'https://www.ivdp.pt', description: 'Official Port wine authority' },
    { name: 'Wikipedia: Port Wine', url: 'https://en.wikipedia.org/wiki/Port_wine', description: 'Comprehensive Port wine guide' },
    { name: 'Taylor\'s Port', url: 'https://www.taylor.pt', description: 'Historic Port producer' },
  ],
  'douro': [
    { name: 'IVDP (Port Wine Institute)', url: 'https://www.ivdp.pt', description: 'Official Douro/Port authority' },
    { name: 'Wikipedia: Douro Valley', url: 'https://en.wikipedia.org/wiki/Douro_DOC', description: 'Douro wine region guide' },
  ],

  // ITALY
  'tuscany': [
    { name: 'Consorzio Chianti Classico', url: 'https://www.chianticlassico.com', description: 'Official Chianti authority' },
    { name: 'Wikipedia: Tuscan Wine', url: 'https://en.wikipedia.org/wiki/Tuscan_wine', description: 'Tuscan wine overview' },
    { name: 'Decanter: Tuscany', url: 'https://www.decanter.com/wine/wine-regions/tuscany/', description: 'Expert Tuscany coverage' },
  ],
  'montalcino': [
    { name: 'Consorzio Brunello di Montalcino', url: 'https://www.consorziobrunellodimontalcino.it', description: 'Official Brunello authority' },
    { name: 'Wikipedia: Brunello di Montalcino', url: 'https://en.wikipedia.org/wiki/Brunello_di_Montalcino', description: 'Brunello wine guide' },
  ],
  'barolo': [
    { name: 'Consorzio di Tutela Barolo', url: 'https://www.langhevini.it', description: 'Official Barolo authority' },
    { name: 'Wikipedia: Barolo', url: 'https://en.wikipedia.org/wiki/Barolo', description: 'Barolo wine guide' },
  ],

  // SPAIN
  'rioja': [
    { name: 'Consejo Regulador DOCa Rioja', url: 'https://www.riojawine.com', description: 'Official Rioja authority' },
    { name: 'Wikipedia: Rioja Wine', url: 'https://en.wikipedia.org/wiki/Rioja_(wine)', description: 'Rioja wine guide' },
    { name: 'Decanter: Rioja', url: 'https://www.decanter.com/wine/wine-regions/rioja/', description: 'Expert Rioja coverage' },
  ],

  // GERMANY
  'rheinhessen': [
    { name: 'Wines of Germany', url: 'https://www.germanwines.de', description: 'Official German wine authority' },
    { name: 'Wikipedia: Rheinhessen', url: 'https://en.wikipedia.org/wiki/Rheinhessen_(wine_region)', description: 'Rheinhessen wine guide' },
  ],
  'mosel': [
    { name: 'Wines of Germany', url: 'https://www.germanwines.de', description: 'Official German wine authority' },
    { name: 'Wikipedia: Mosel Wine', url: 'https://en.wikipedia.org/wiki/Mosel_(wine_region)', description: 'Mosel wine region guide' },
  ],

  // AUSTRALIA
  'barossa valley': [
    { name: 'Barossa Australia', url: 'https://www.barossa.com', description: 'Official Barossa tourism' },
    { name: 'Wikipedia: Barossa Valley', url: 'https://en.wikipedia.org/wiki/Barossa_Valley_(wine)', description: 'Barossa Valley wine guide' },
    { name: 'Wine Australia', url: 'https://www.wineaustralia.com', description: 'Official Australian wine authority' },
  ],
  'eden valley': [
    { name: 'Wine Australia', url: 'https://www.wineaustralia.com', description: 'Official Australian wine authority' },
    { name: 'Wikipedia: Eden Valley', url: 'https://en.wikipedia.org/wiki/Eden_Valley_(wine)', description: 'Eden Valley wine guide' },
  ],
  'clare valley': [
    { name: 'Wine Australia', url: 'https://www.wineaustralia.com', description: 'Official Australian wine authority' },
    { name: 'Wikipedia: Clare Valley', url: 'https://en.wikipedia.org/wiki/Clare_Valley', description: 'Clare Valley wine guide' },
  ],
  'beechworth': [
    { name: 'Wine Australia', url: 'https://www.wineaustralia.com', description: 'Official Australian wine authority' },
    { name: 'Wikipedia: Beechworth', url: 'https://en.wikipedia.org/wiki/Beechworth_wine_region', description: 'Beechworth wine guide' },
  ],

  // ARGENTINA
  'mendoza': [
    { name: 'Wines of Argentina', url: 'https://www.winesofargentina.org', description: 'Official Argentine wine authority' },
    { name: 'Wikipedia: Mendoza Wine', url: 'https://en.wikipedia.org/wiki/Mendoza_wine', description: 'Mendoza wine guide' },
  ],

  // ENGLAND
  'sussex': [
    { name: 'Wines of Great Britain', url: 'https://www.winegb.co.uk', description: 'Official English wine authority' },
    { name: 'Wikipedia: English Wine', url: 'https://en.wikipedia.org/wiki/English_wine', description: 'English wine overview' },
    { name: 'Visit Sussex', url: 'https://www.visitsussex.org', description: 'Sussex tourism authority' },
    { name: 'Decanter: English Wine', url: 'https://www.decanter.com/wine/wine-regions/england/', description: 'Expert English wine coverage' },
  ],
  'england': [
    { name: 'Wines of Great Britain', url: 'https://www.winegb.co.uk', description: 'Official English wine authority' },
    { name: 'Wikipedia: English Wine', url: 'https://en.wikipedia.org/wiki/English_wine', description: 'English wine overview' },
    { name: 'Visit England', url: 'https://www.visitengland.com', description: 'England tourism authority' },
  ],
  'hampshire': [
    { name: 'Wines of Great Britain', url: 'https://www.winegb.co.uk', description: 'Official English wine authority' },
    { name: 'Wikipedia: English Wine', url: 'https://en.wikipedia.org/wiki/English_wine', description: 'English wine overview' },
    { name: 'Visit Hampshire', url: 'https://www.visit-hampshire.co.uk', description: 'Hampshire tourism authority' },
  ],
}

const COUNTRY_EXTERNAL_LINKS: Record<string, ExternalLink[]> = {
  'france': [
    { name: 'France.fr Wine', url: 'https://www.france.fr/en/wines-and-spirits', description: 'Official French tourism wine guide' },
    { name: 'Jancis Robinson: France', url: 'https://www.jancisrobinson.com/learn/wine-regions/france', description: 'Master of Wine French wine guide' },
  ],
  'italy': [
    { name: 'Italian Wine Central', url: 'https://italianwinecentral.com', description: 'Comprehensive Italian wine resource' },
  ],
  'spain': [
    { name: 'Wines from Spain', url: 'https://www.winesfromspain.com', description: 'Official Spanish wine authority' },
  ],
  'portugal': [
    { name: 'Wines of Portugal', url: 'https://www.winesofportugal.com', description: 'Official Portuguese wine authority' },
    { name: 'Visit Portugal', url: 'https://www.visitportugal.com', description: 'Official Portuguese tourism' },
  ],
  'germany': [
    { name: 'Wines of Germany', url: 'https://www.germanwines.de', description: 'Official German wine authority' },
  ],
  'australia': [
    { name: 'Wine Australia', url: 'https://www.wineaustralia.com', description: 'Official Australian wine authority' },
  ],
  'argentina': [
    { name: 'Wines of Argentina', url: 'https://www.winesofargentina.org', description: 'Official Argentine wine authority' },
  ],
  'england': [
    { name: 'Wines of Great Britain', url: 'https://www.winegb.co.uk', description: 'Official English wine authority' },
  ],
}

// ============================================================================
// INTERNAL LINKING RULES
// ============================================================================

export interface InternalLink {
  slug: string
  keyword: string
  priority: number // 1 = highest
}

/**
 * Get internal links to feature on a wine page
 * Based on region affinity and priority wines
 */
export function getInternalLinks(
  currentSlug: string,
  region: string,
  _country: string // Prefixed with _ to indicate intentionally unused
): InternalLink[] {
  const links: InternalLink[] = []

  // Priority wines that should be linked from everywhere
  const priorityWines: InternalLink[] = [
    { slug: 'boal-borges-1875', keyword: 'Boal Borges 1875', priority: 1 },
    { slug: '2011-ch-petrus-pomerol', keyword: 'Petrus Red Wine', priority: 1 },
    { slug: '2009-ch-petrus-pomerol', keyword: 'Petrus 2009', priority: 1 },
  ]

  // Add priority wines (excluding current page)
  priorityWines
    .filter(w => w.slug !== currentSlug)
    .forEach(w => links.push(w))

  // Region-based featured wines
  const regionLower = (region || '').toLowerCase()
  const regionFeatured = REGION_FEATURED_WINES[regionLower] || []
  regionFeatured
    .filter(w => w.slug !== currentSlug)
    .forEach(w => links.push(w))

  // Dedupe and sort by priority
  const seen = new Set<string>()
  return links
    .filter(link => {
      if (seen.has(link.slug)) return false
      seen.add(link.slug)
      return true
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 6) // Max 6 internal links
}

const REGION_FEATURED_WINES: Record<string, InternalLink[]> = {
  'burgundy': [
    { slug: '2019-grands-echezeaux-grand-cru-nicole-lamarche', keyword: 'Grands Échézeaux Grand Cru', priority: 2 },
    { slug: '2018-gevrey-chambertin-les-evocelles-domaine-de-la-vougeraie', keyword: 'Gevrey Chambertin Les Evocelles', priority: 2 },
    { slug: '2021-batard-montrachet-grand-cru-marc-antonin-blain', keyword: 'Bâtard Montrachet Grand Cru', priority: 2 },
  ],
  'madeira': [
    { slug: 'boal-borges-1875', keyword: 'Boal Borges 1875', priority: 1 },
  ],
  'pomerol': [
    { slug: '2011-ch-petrus-pomerol', keyword: 'Petrus Red Wine', priority: 1 },
    { slug: '2009-ch-petrus-pomerol', keyword: 'Petrus 2009', priority: 1 },
  ],
  'england': [
    { slug: 'denbies-wine-estate-demi-sec-nv', keyword: 'Denbies Demi Sec', priority: 2 },
    { slug: 'hattingley-valley-the-english-gent-2021', keyword: 'The English Gent', priority: 2 },
    { slug: 'nv-ridgeview-bloomsbury-brut', keyword: 'Ridgeview Bloomsbury', priority: 2 },
  ],
  'sussex': [
    { slug: 'denbies-wine-estate-demi-sec-nv', keyword: 'Denbies Demi Sec', priority: 2 },
    { slug: 'nv-ridgeview-fitzrovia-rose', keyword: 'Ridgeview Rosé', priority: 2 },
    { slug: 'nv-ridgeview-bloomsbury-brut', keyword: 'Ridgeview Bloomsbury', priority: 2 },
  ],
  'barossa valley': [
    { slug: '2006-anaperenna-shiraz-cabernet-sauvignon-ben-glaetzer', keyword: 'Anaperenna Wine', priority: 2 },
  ],
  'eden valley': [
    { slug: '2016-henschke-hill-of-roses', keyword: 'Henschke Hill of Roses', priority: 2 },
  ],
  'clare valley': [
    { slug: '2001-jim-barry-the-armagh-clare-valley', keyword: 'Jim Barry Wine', priority: 2 },
  ],
  'rioja': [
    { slug: '2016-contino-rioja-gran-reserva-cvne', keyword: 'Contino Wine', priority: 2 },
  ],
  'tuscany': [
    { slug: '2004-camartina-toscana-querciabella', keyword: 'Camartina 2004', priority: 2 },
  ],
  'montalcino': [
    { slug: '2010-brunello-di-montalcino-le-lucere-san-filippo', keyword: 'Brunello San Filippo', priority: 2 },
  ],
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

/**
 * Generate "About This Wine" content for non-enriched wines
 * Ensures minimum word count and keyword density
 */
export function generateAboutContent(wine: Wine, keyword: string): string[] {
  const paragraphs: string[] = []

  // Paragraph 1: Introduction with keyword bolded
  paragraphs.push(
    `**${keyword}** is a ${wine.wine_type || 'distinguished wine'} from ${wine.winery}, ` +
    `crafted in the ${wine.region} region of ${wine.country}. ` +
    (wine.vintage
      ? `The ${wine.vintage} vintage of ${keyword} represents an excellent expression of what this producer achieves. `
      : `This wine showcases the dedication to quality that ${wine.winery} is renowned for. `) +
    (wine.grape_variety
      ? `Made from ${wine.grape_variety}, ${keyword} offers distinctive character and depth.`
      : '')
  )

  // Paragraph 2: Region context
  paragraphs.push(
    `${wine.region} has established itself as one of the premier wine regions for producing wines of this style. ` +
    `${keyword} exemplifies the regional characteristics that collectors and enthusiasts seek. ` +
    `${wine.winery}'s approach to winemaking balances respect for tradition with modern techniques, ` +
    `resulting in wines like ${keyword} that offer both immediate appeal and cellaring potential.`
  )

  // Paragraph 3: Classification/quality (if applicable)
  if (wine.classification) {
    paragraphs.push(
      `Classified as ${wine.classification}, ${keyword} sits among the upper echelon of wines from this appellation. ` +
      `This classification reflects exceptional terroir, meticulous viticulture, and skilled winemaking. ` +
      `For collectors and serious wine enthusiasts, ${keyword} represents both quality and value within its category.`
    )
  }

  // Paragraph 4: Buying recommendation
  paragraphs.push(
    `When considering ${keyword} for your collection or cellar, note that wines from ${wine.winery} ` +
    `have shown consistent quality across vintages. ${keyword} pairs excellently with a variety of dishes ` +
    `and occasions, making it a versatile addition to any wine selection.`
  )

  return paragraphs
}
