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

// Extended region information with travel guides and destination content
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
    climate: 'Maritime climate with mild winters and warm summers, moderated by the Atlantic Ocean and Gironde estuary. The maritime influence provides consistent temperatures but also brings humidity, making vintage variation a hallmark of Bordeaux.',
    soils: 'Gravel, limestone, and clay soils across the Left and Right Banks. The famous gravel beds of the Médoc provide excellent drainage, while the limestone plateau of Saint-Émilion offers different terroir expression.',
    grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot', 'Malbec'],
    travelGuide: 'Bordeaux is a UNESCO World Heritage city with stunning 18th-century architecture, world-class restaurants, and easy access to the wine châteaux. The city underwent a remarkable transformation in recent years, with a beautiful riverfront promenade and the innovative Cité du Vin wine museum. Rent a car to explore the surrounding appellations, or join organized tours that handle the logistics.',
    whereToStay: [
      { name: 'Les Sources de Caudalie', description: 'Luxury spa hotel in Pessac-Léognan set among Château Smith Haut Lafitte\'s vineyards', link: 'https://www.sources-caudalie.com' },
      { name: 'La Grande Maison', description: 'Bernard Magrez\'s elegant hotel with Robuchon restaurant', link: 'https://www.lagrandemaison-bordeaux.com' },
      { name: 'InterContinental Bordeaux', description: 'Grand central hotel in a historic building', link: 'https://www.ihg.com/intercontinental/hotels/gb/en/bordeaux' },
    ],
    wineTours: [
      { name: 'Bordeaux Wine Trails', description: 'Custom private tours with expert guides', link: 'https://www.bordeaux-wine-trails.com' },
      { name: 'France Intense', description: 'Luxury wine experiences across Bordeaux appellations', link: 'https://www.france-intense.com' },
      { name: 'Millésima Wine Tours', description: 'Tours organized by major wine merchant', link: 'https://www.millesima.com' },
    ],
    bestTimeToVisit: 'September-October during harvest, or April-June for pleasant weather and open châteaux',
    famousProducers: ['Château Lafite Rothschild', 'Château Margaux', 'Château Latour', 'Petrus', 'Château Cheval Blanc'],
    externalLinks: [
      { name: 'Bordeaux Wine Council', url: 'https://www.bordeaux.com' },
      { name: 'Wine Spectator Bordeaux Guide', url: 'https://www.winespectator.com/regions/bordeaux' },
      { name: 'Decanter Bordeaux Features', url: 'https://www.decanter.com/wine/wine-regions/bordeaux-wines/' },
    ],
  },
  'Burgundy': {
    description: 'Burgundy represents the pinnacle of Pinot Noir and Chardonnay, with terroir-driven wines that command top prices worldwide. The region\'s complex classification system of Grands Crus, Premiers Crus, and village wines reflects centuries of understanding about how specific vineyard sites influence wine character.',
    climate: 'Continental climate with cold winters and warm summers, creating ideal conditions for elegant wines. The region is susceptible to spring frosts and hail, making viticulture challenging but rewarding.',
    soils: 'Limestone and marl soils, with each climat offering unique characteristics. The famous Côte d\'Or slope exposes different strata at various elevations, creating the patchwork of quality levels.',
    grapes: ['Pinot Noir', 'Chardonnay', 'Gamay', 'Aligoté'],
    travelGuide: 'Burgundy offers an intimate wine experience with small family domaines, charming villages, and exceptional gastronomy. The region is best explored slowly, ideally by bicycle along the Route des Grands Crus from Dijon to Santenay. Beaune serves as the wine capital, hosting the famous Hospices de Beaune auction each November.',
    whereToStay: [
      { name: 'Hostellerie de Levernois', description: 'Relais & Châteaux property near Beaune with starred restaurant', link: 'https://www.levernois.com' },
      { name: 'Le Cep', description: 'Elegant hotel in the heart of Beaune', link: 'https://www.hotel-cep-beaune.com' },
      { name: 'Château de Gilly', description: 'Medieval château hotel near Vougeot', link: 'https://www.chateau-gilly.com' },
    ],
    wineTours: [
      { name: 'Bourgogne Gold Tour', description: 'Private tours with passionate local guides', link: 'https://www.bourgogne-gold-tour.com' },
      { name: 'Authentica Tours', description: 'Small group and private domaine visits', link: 'https://www.authentica-tours.com' },
      { name: 'Active Burgundy', description: 'Cycling wine tours through the vineyards', link: 'https://www.activeburgundy.com' },
    ],
    bestTimeToVisit: 'September-October for harvest, or May-June for pleasant weather',
    famousProducers: ['Domaine de la Romanée-Conti', 'Domaine Leroy', 'Domaine Armand Rousseau', 'Domaine Coche-Dury'],
    externalLinks: [
      { name: 'Bourgogne Wines Official', url: 'https://www.bourgogne-wines.com' },
      { name: 'Wine Spectator Burgundy', url: 'https://www.winespectator.com/regions/burgundy' },
      { name: 'Decanter Burgundy Guide', url: 'https://www.decanter.com/wine/wine-regions/burgundy-wines/' },
    ],
  },
  'Champagne': {
    description: 'The Champagne region produces the world\'s most celebrated sparkling wines, using traditional method fermentation. Only wines from this specific region can legally bear the name Champagne, and the grandes marques houses have built global prestige over centuries.',
    climate: 'Cool continental climate at the northern limit of viticulture, creating high-acid base wines perfect for sparkling production. The marginal climate requires careful vineyard management.',
    soils: 'Chalk subsoils that retain moisture and reflect heat back to the vines. The famous chalk cellars provide perfect aging conditions at constant temperature and humidity.',
    grapes: ['Chardonnay', 'Pinot Noir', 'Pinot Meunier'],
    travelGuide: 'Champagne offers the unique experience of visiting both grand maisons with their impressive underground cellars and small grower-producers. Reims and Épernay are the twin capitals, connected by the Avenue de Champagne featuring famous houses. The region\'s gastronomy pairs perfectly with the wines.',
    whereToStay: [
      { name: 'Royal Champagne Hotel', description: 'Luxury contemporary hotel overlooking the vineyards', link: 'https://www.royalchampagne.com' },
      { name: 'Les Crayères', description: 'Relais & Châteaux hotel in Reims with two-star restaurant', link: 'https://www.lescrayeres.com' },
      { name: 'L\'Assiette Champenoise', description: 'Boutique hotel with three-star Michelin restaurant', link: 'https://www.assiettechampenoise.com' },
    ],
    wineTours: [
      { name: 'A La Française Champagne', description: 'Premium tours of grower and grande marque producers', link: 'https://www.alafrancaise.fr' },
      { name: 'Exclusive Champagne Tours', description: 'VIP access to prestigious houses', link: 'https://www.exclusivechampagnetours.com' },
      { name: 'O Chateau Champagne Tours', description: 'Day trips from Paris', link: 'https://www.o-chateau.com' },
    ],
    bestTimeToVisit: 'April-October, with harvest in September-October being particularly special',
    famousProducers: ['Krug', 'Dom Pérignon', 'Salon', 'Bollinger', 'Louis Roederer', 'Egly-Ouriet'],
    externalLinks: [
      { name: 'Champagne Official Site', url: 'https://www.champagne.fr' },
      { name: 'Comité Champagne', url: 'https://www.comite-champagne.com' },
      { name: 'Decanter Champagne Guide', url: 'https://www.decanter.com/wine/wine-regions/champagne/' },
    ],
  },
  'Sussex': {
    description: 'Sussex has emerged as England\'s premier sparkling wine region, with chalk soils identical to Champagne producing award-winning wines. The South Downs provide perfect south-facing slopes, and English sparkling wines have beaten Champagne in blind tastings, attracting serious attention from wine investors.',
    climate: 'Cool maritime climate with long growing seasons ideal for high-acid sparkling wines. Climate change has made the region increasingly viable for quality viticulture.',
    soils: 'Chalk downland soils matching the terroir of Champagne, providing excellent drainage and mineral character.',
    grapes: ['Chardonnay', 'Pinot Noir', 'Pinot Meunier'],
    travelGuide: 'Sussex offers a delightful English wine country experience, combining vineyard visits with the beautiful South Downs National Park. Many estates have excellent restaurants and offer tasting experiences. The region is easily accessible from London, making it perfect for day trips or weekend escapes.',
    whereToStay: [
      { name: 'Gravetye Manor', description: 'Country house hotel with starred restaurant and gardens', link: 'https://www.gravetyemanor.co.uk' },
      { name: 'The Grand Brighton', description: 'Victorian seafront hotel for coastal luxury', link: 'https://www.grandbrighton.co.uk' },
      { name: 'Goodwood Hotel', description: 'Country estate with spa and racing heritage', link: 'https://www.goodwood.com' },
    ],
    wineTours: [
      { name: 'English Wine Tours', description: 'Guided tours of Sussex vineyards', link: 'https://www.english-wine-tours.co.uk' },
      { name: 'Nyetimber', description: 'Tours of England\'s most famous sparkling wine producer', link: 'https://www.nyetimber.com' },
      { name: 'Ridgeview Wine Estate', description: 'Award-winning producer with restaurant', link: 'https://www.ridgeview.co.uk' },
    ],
    bestTimeToVisit: 'May-September, with harvest in late September-October',
    famousProducers: ['Nyetimber', 'Ridgeview', 'Wiston Estate', 'Gusbourne', 'Bolney Wine Estate'],
    externalLinks: [
      { name: 'Wine GB', url: 'https://www.winegb.co.uk' },
      { name: 'English Wine Producers', url: 'https://www.englishwineproducers.co.uk' },
      { name: 'Decanter English Wine', url: 'https://www.decanter.com/wine/wine-regions/england/' },
    ],
  },
  'Madeira': {
    description: 'Madeira produces some of the world\'s longest-lived wines, with a unique heated aging process called estufagem that creates extraordinary complexity. Historic Madeiras from the 18th and 19th centuries are still drinkable today, making these wines legendary among collectors.',
    climate: 'Subtropical maritime climate with warm temperatures year-round. The island\'s dramatic topography creates numerous microclimates.',
    soils: 'Volcanic basalt soils on steep terraced vineyards called poios, carved into the mountainside over centuries.',
    grapes: ['Sercial', 'Verdelho', 'Boal', 'Malmsey', 'Tinta Negra'],
    travelGuide: 'Madeira is a stunning island destination combining wine culture with dramatic landscapes. The capital Funchal offers easy access to historic lodges and modern producers. Beyond wine, visitors enjoy the levada walks, botanical gardens, and some of the world\'s most spectacular coastal scenery.',
    whereToStay: [
      { name: 'Belmond Reid\'s Palace', description: 'Legendary clifftop hotel with afternoon tea tradition', link: 'https://www.belmond.com/hotels/europe/portugal/madeira/belmond-reids-palace/' },
      { name: 'The Vine Hotel', description: 'Design hotel in Funchal with rooftop bar', link: 'https://www.hotelthevine.com' },
      { name: 'Quinta da Casa Branca', description: 'Manor house hotel in subtropical gardens', link: 'https://www.quintadacasabranca.com' },
    ],
    wineTours: [
      { name: 'Blandy\'s Wine Lodge', description: 'Historic lodge tours and tastings', link: 'https://www.blandys.com' },
      { name: 'Madeira Wine Company', description: 'Premium tastings including vintage wines', link: 'https://www.madeirawinecompany.com' },
      { name: 'Henriques & Henriques', description: 'Family producer offering extensive tours', link: 'https://www.henriquesehenriques.pt' },
    ],
    bestTimeToVisit: 'Year-round destination, with festivals in September',
    famousProducers: ['Blandy\'s', 'Henriques & Henriques', 'Barbeito', 'd\'Oliveiras', 'Justino\'s'],
    externalLinks: [
      { name: 'Wine Institute of Madeira', url: 'https://www.vfranca.com' },
      { name: 'Visit Madeira', url: 'https://www.visitmadeira.pt' },
      { name: 'Decanter Madeira Guide', url: 'https://www.decanter.com/learn/madeira-wine-guide/' },
    ],
  },
  'Barolo': {
    description: 'Barolo is Italy\'s most prestigious red wine, made exclusively from Nebbiolo grapes in the Langhe hills of Piedmont. Known as the "King of Wines and Wine of Kings," Barolo produces powerful, tannic wines that age magnificently for decades.',
    climate: 'Continental climate with foggy autumns (nebbia means "fog" in Italian, giving Nebbiolo its name). The region experiences hot summers and cold winters.',
    soils: 'Calcareous marl and sandstone soils in the Langhe hills. Different communes produce distinct styles based on soil composition.',
    grapes: ['Nebbiolo'],
    travelGuide: 'The Langhe is a UNESCO World Heritage site offering stunning hilltop villages, white truffles in autumn, and exceptional Piedmontese cuisine. Alba is the main town, famous for its truffle fair. The rolling vineyard-covered hills provide spectacular views and intimate winery visits.',
    whereToStay: [
      { name: 'Casa di Langa', description: 'Luxury hillside resort with panoramic vineyard views', link: 'https://www.casadilanga.com' },
      { name: 'Relais San Maurizio', description: 'Converted monastery with spa and fine dining', link: 'https://www.relaissanmaurizio.it' },
      { name: 'Villa d\'Amelia', description: 'Boutique hotel in historic villa', link: 'https://www.villadamelia.it' },
    ],
    wineTours: [
      { name: 'Barolo Wine Tours', description: 'Expert-led tours of top producers', link: 'https://www.barolowinetours.com' },
      { name: 'Piedmont Wine Tours', description: 'Small group Langhe experiences', link: 'https://www.piedmontwinetours.com' },
      { name: 'Made in Piedmont', description: 'Food and wine experiences', link: 'https://www.madeinpiedmont.it' },
    ],
    bestTimeToVisit: 'September-November for harvest and truffle season, or April-June for pleasant weather',
    famousProducers: ['Giacomo Conterno', 'Bruno Giacosa', 'Bartolo Mascarello', 'Giuseppe Rinaldi', 'Aldo Conterno'],
    externalLinks: [
      { name: 'Consorzio Barolo', url: 'https://www.langhevini.it' },
      { name: 'Wine Spectator Barolo', url: 'https://www.winespectator.com/regions/barolo' },
      { name: 'Decanter Barolo Guide', url: 'https://www.decanter.com/wine/wine-regions/piedmont/' },
    ],
  },
  'Pauillac': {
    description: 'Pauillac is the most prestigious commune in Bordeaux\'s Médoc, home to three of the five First Growth châteaux: Lafite Rothschild, Latour, and Mouton Rothschild. The wines are powerful yet elegant, dominated by Cabernet Sauvignon.',
    climate: 'Maritime climate moderated by the Gironde estuary and Atlantic Ocean. The famous gravel soils provide excellent drainage.',
    soils: 'Deep gravel beds over limestone and clay, creating exceptional drainage ideal for Cabernet Sauvignon.',
    grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot'],
    travelGuide: 'Pauillac offers the quintessential Bordeaux experience with legendary châteaux, elegant architecture, and waterfront dining. The small riverside town makes an excellent base for exploring the Médoc. Many top châteaux offer tours by appointment.',
    whereToStay: [
      { name: 'Château Cordeillan-Bages', description: 'Relais & Châteaux hotel with two-star restaurant', link: 'https://www.cordeillanbages.com' },
      { name: 'Les Sources de Caudalie', description: 'Nearby spa hotel in Pessac-Léognan', link: 'https://www.sources-caudalie.com' },
      { name: 'Hotel & Spa du Château Grand Barrail', description: 'Château hotel near Saint-Émilion', link: 'https://www.grand-barrail.com' },
    ],
    wineTours: [
      { name: 'Médoc Wine Tour', description: 'Specialized Pauillac and Médoc tours', link: 'https://www.medoc-winetour.com' },
      { name: 'Bordeaux Wine Trails', description: 'First Growth experiences', link: 'https://www.bordeaux-wine-trails.com' },
      { name: 'Lynch-Bages Village', description: 'Boutique hotel with wine experiences', link: 'https://www.lynchbages.com' },
    ],
    bestTimeToVisit: 'April-October, with harvest in September-October',
    famousProducers: ['Château Lafite Rothschild', 'Château Latour', 'Château Mouton Rothschild', 'Château Pichon Baron', 'Château Lynch-Bages'],
    externalLinks: [
      { name: 'Pauillac Wine Council', url: 'https://www.pauillac-medoc.com' },
      { name: 'Wine Spectator Pauillac', url: 'https://www.winespectator.com/regions/pauillac' },
      { name: 'Decanter Médoc Guide', url: 'https://www.decanter.com/wine/wine-regions/bordeaux-wines/' },
    ],
  },
  'St Emilion': {
    description: 'Saint-Émilion is a UNESCO World Heritage site and one of Bordeaux\'s most historic wine regions. The Right Bank appellation is dominated by Merlot, producing rich, approachable wines from prestigious châteaux including Cheval Blanc and Ausone.',
    climate: 'Continental influence with warmer temperatures than the Médoc, favoring Merlot and Cabernet Franc.',
    soils: 'Limestone plateau (côtes) and gravel-clay plains (graves), producing different wine styles.',
    grapes: ['Merlot', 'Cabernet Franc', 'Cabernet Sauvignon'],
    travelGuide: 'The medieval village of Saint-Émilion is one of France\'s most beautiful, with underground wine cellars, Romanesque churches, and cobblestone streets. The compact appellation is perfect for cycling between châteaux, and the village has excellent restaurants and wine shops.',
    whereToStay: [
      { name: 'Hostellerie de Plaisance', description: 'Luxury hotel in the heart of the village', link: 'https://www.hostelleriedeplaisance.com' },
      { name: 'Château Grand Barrail', description: 'Château hotel with spa', link: 'https://www.grand-barrail.com' },
      { name: 'Logis de la Cadène', description: 'Boutique B&B in medieval building', link: 'https://www.logisdelacadene.fr' },
    ],
    wineTours: [
      { name: 'Saint-Émilion Tourist Office', description: 'Official guided tours', link: 'https://www.saint-emilion-tourisme.com' },
      { name: 'Ophorus', description: 'Premium wine tours from Bordeaux', link: 'https://www.ophorus.com' },
      { name: 'Bordeaux Wine Tours', description: 'Right Bank specialists', link: 'https://www.bordeauxwinetours.fr' },
    ],
    bestTimeToVisit: 'April-October, with the Jurade wine festivals in June and September',
    famousProducers: ['Château Cheval Blanc', 'Château Ausone', 'Château Angélus', 'Château Pavie', 'Château Figeac'],
    externalLinks: [
      { name: 'Saint-Émilion Wine Council', url: 'https://www.saint-emilion.com' },
      { name: 'Wine Spectator Saint-Émilion', url: 'https://www.winespectator.com/regions/saint-emilion' },
      { name: 'UNESCO World Heritage', url: 'https://whc.unesco.org/en/list/932' },
    ],
  },
  'Pomerol': {
    description: 'Pomerol is Bordeaux\'s smallest yet most exclusive appellation, home to Petrus and Le Pin. Without a formal classification, quality is everything in this tiny commune where Merlot reigns supreme on unique iron-rich clay soils.',
    climate: 'Continental influence with clay soils retaining water, ideal for Merlot.',
    soils: 'Famous "buttonhole" of iron-rich clay (crasse de fer) at the plateau, with gravel and sand elsewhere.',
    grapes: ['Merlot', 'Cabernet Franc'],
    travelGuide: 'Pomerol is an understated commune of small, family-owned estates without grand châteaux. The humble church square belies the extraordinary value of the wines produced here. Visits require advance booking and often personal introductions.',
    whereToStay: [
      { name: 'Château de la Rivière', description: 'Castle hotel overlooking the Dordogne', link: 'https://www.chateau-de-la-riviere.com' },
      { name: 'Hostellerie de Plaisance', description: 'Nearby in Saint-Émilion', link: 'https://www.hostelleriedeplaisance.com' },
      { name: 'Les Sources de Caudalie', description: 'Luxury option near Bordeaux', link: 'https://www.sources-caudalie.com' },
    ],
    wineTours: [
      { name: 'Bordeaux Wine Trails', description: 'Exclusive Pomerol access', link: 'https://www.bordeaux-wine-trails.com' },
      { name: 'Ophorus', description: 'Right Bank specialists', link: 'https://www.ophorus.com' },
      { name: 'Private Bordeaux Tours', description: 'Bespoke Pomerol experiences', link: 'https://www.privatebordeauxtours.com' },
    ],
    bestTimeToVisit: 'April-June or September-October',
    famousProducers: ['Petrus', 'Le Pin', 'Château Lafleur', 'Château Trotanoy', 'Vieux Château Certan'],
    externalLinks: [
      { name: 'Pomerol Wine Syndicate', url: 'https://www.vins-pomerol.fr' },
      { name: 'Wine Spectator Pomerol', url: 'https://www.winespectator.com/regions/pomerol' },
      { name: 'Liv-ex Pomerol Analysis', url: 'https://www.liv-ex.com' },
    ],
  },
}

// Burgundy sub-regions that should map to Burgundy
const BURGUNDY_COMMUNES = [
  'Gevrey Chambertin', 'Chambolle Musigny', 'Vosne Romanée', 'Nuits Saint Georges',
  'Volnay', 'Corton', 'Clos de Vougeot', 'Charmes Chambertin', 'Morey Saint Denis',
  'Meursault', 'Puligny Montrachet', 'Chassagne Montrachet', 'Pommard', 'Beaune',
  'Savigny', 'Aloxe Corton', 'Fixin', 'Marsannay', 'Santenay', 'Romanée',
  'Echézeaux', 'Grands Echézeaux', 'Richebourg', 'La Tâche', 'Musigny',
  'Bonnes Mares', 'Clos de la Roche', 'Clos Saint Denis', 'Red Burgundy', 'White Burgundy'
]

function getRegionInfo(region: string | null): (RegionData & { name: string }) | null {
  if (!region) return null

  // Try exact match first
  if (REGION_INFO[region]) return { name: region, ...REGION_INFO[region] }

  // Check for Burgundy communes
  const regionLower = region.toLowerCase()
  for (const commune of BURGUNDY_COMMUNES) {
    if (regionLower.includes(commune.toLowerCase()) || commune.toLowerCase().includes(regionLower)) {
      return { name: 'Burgundy', ...REGION_INFO['Burgundy'] }
    }
  }

  // Try partial match with existing regions
  for (const [key, info] of Object.entries(REGION_INFO)) {
    if (regionLower.includes(key.toLowerCase())) {
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
  'Barolo': [
    'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800',
    'https://images.unsplash.com/photo-1534531173927-aeb928d54385?w=800',
  ],
  'Pauillac': [
    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  ],
  'St Emilion': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800',
  ],
  'Pomerol': [
    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ],
}

function getRegionImages(region: string | null): string[] {
  if (!region) return []

  // Check for Burgundy communes first
  const regionLower = region.toLowerCase()
  for (const commune of BURGUNDY_COMMUNES) {
    if (regionLower.includes(commune.toLowerCase()) || commune.toLowerCase().includes(regionLower)) {
      return REGION_IMAGES['Burgundy'] || []
    }
  }

  // Try partial match
  for (const [key, images] of Object.entries(REGION_IMAGES)) {
    if (regionLower.includes(key.toLowerCase())) {
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
    <section className="mt-12 space-y-8" aria-labelledby="region-heading">
      {/* Region Overview */}
      <div>
        <h2 id="region-heading" className="text-3xl font-bold text-white mb-6">
          Discover {info.name}: Home of {wineName}
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
        </div>
      </div>

      {/* Terroir & Climate */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Terroir & Winemaking</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-800">
            <h4 className="text-lg font-semibold text-white mb-3">Climate</h4>
            <p className="text-slate-400">{info.climate}</p>
          </div>
          <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-800">
            <h4 className="text-lg font-semibold text-white mb-3">Terroir</h4>
            <p className="text-slate-400">{info.soils}</p>
          </div>
          <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-800">
            <h4 className="text-lg font-semibold text-white mb-3">Key Grapes</h4>
            <p className="text-slate-400">{info.grapes.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Famous Producers */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Famous {info.name} Producers</h3>
        <p className="text-slate-400 mb-4">
          {info.name} is home to some of the world&apos;s most prestigious wine estates. Notable producers include:
        </p>
        <div className="flex flex-wrap gap-3">
          {info.famousProducers.map((producer) => (
            <span
              key={producer}
              className="px-4 py-2 bg-purple-900/30 border border-purple-700/50 rounded-full text-purple-300 text-sm"
            >
              {producer}
            </span>
          ))}
        </div>
      </div>

      {/* Travel Guide */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-slate-700">
        <h3 className="text-2xl font-bold text-white mb-4">
          Planning Your {info.name} Wine Trip
        </h3>
        <p className="text-slate-300 text-lg mb-6">
          {info.travelGuide}
        </p>
        <div className="inline-block bg-purple-900/50 px-4 py-2 rounded-lg border border-purple-700/50">
          <span className="text-purple-300 font-medium">Best Time to Visit:</span>
          <span className="text-white ml-2">{info.bestTimeToVisit}</span>
        </div>
      </div>

      {/* Where to Stay */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">
          Where to Stay in {info.name}
        </h3>
        <p className="text-slate-400 mb-6">
          Experience the best of {info.name} wine country with these exceptional accommodations, perfect for wine lovers exploring the region.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {info.whereToStay.map((hotel) => (
            <a
              key={hotel.name}
              href={hotel.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-slate-900/50 p-5 rounded-lg border border-slate-800 hover:border-purple-600 transition-colors group"
            >
              <h4 className="text-lg font-semibold text-white group-hover:text-purple-400 mb-2">
                {hotel.name} ↗
              </h4>
              <p className="text-slate-400 text-sm">{hotel.description}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Wine Tours */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4">
          {info.name} Wine Tours & Experiences
        </h3>
        <p className="text-slate-400 mb-6">
          Discover {info.name}&apos;s finest producers with these recommended wine tour operators. Whether you prefer intimate private tastings or group excursions, there&apos;s an experience for every wine lover.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {info.wineTours.map((tour) => (
            <a
              key={tour.name}
              href={tour.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-slate-900/50 p-5 rounded-lg border border-slate-800 hover:border-green-600 transition-colors group"
            >
              <h4 className="text-lg font-semibold text-white group-hover:text-green-400 mb-2">
                {tour.name} ↗
              </h4>
              <p className="text-slate-400 text-sm">{tour.description}</p>
            </a>
          ))}
        </div>
      </div>

      {/* External Resources */}
      <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800">
        <h3 className="text-xl font-bold text-white mb-4">
          Learn More About {info.name} Wines
        </h3>
        <p className="text-slate-400 mb-4">
          Explore these authoritative resources to deepen your knowledge of {info.name} wines like {wineName}:
        </p>
        <div className="flex flex-wrap gap-4">
          {info.externalLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors text-sm"
            >
              {link.name} ↗
            </a>
          ))}
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
