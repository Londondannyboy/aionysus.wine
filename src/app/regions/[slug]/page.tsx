import { getWinesByAppellation, countWinesByAppellation, formatPrice, Wine } from '@/lib/wine-db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { WineCardImage } from '@/components/WineImage'

interface Props {
  params: Promise<{ slug: string }>
}

// Appellation data for SEO-rich region pages
interface AppellationData {
  name: string
  slug: string
  searchTerm: string // database search term
  title: string
  metaDescription: string
  heroImage: string
  heroAlt: string
  introduction: string
  history: string
  terroir: string
  climate: string
  soils: string
  keyGrapes: string[]
  classifications: { name: string; description: string }[]
  famousVineyards: string[]
  famousProducers: string[]
  foodPairings: string[]
  investmentProfile: string
  buyingGuide: string
  travelGuide: string
  bestTimeToVisit: string
  nearbyAttractions: string[]
  investmentStats: { returns: string; grandCrus: string; ageing: string }
  faq: { question: string; answer: string }[]
}

const APPELLATIONS: Record<string, AppellationData> = {
  'gevrey-chambertin': {
    name: 'Gevrey-Chambertin',
    slug: 'gevrey-chambertin',
    searchTerm: 'Gevrey',
    title: 'Gevrey-Chambertin Wine | Buy Gevrey-Chambertin Grand Cru & Premier Cru',
    metaDescription: 'Buy Gevrey-Chambertin wine online. Explore our collection of Gevrey-Chambertin Grand Cru, Premier Cru, and village wines from top Burgundy producers. The king of Burgundy wines.',
    heroImage: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80',
    heroAlt: 'Gevrey-Chambertin wine vineyards in Burgundy, France with rows of Pinot Noir vines in the Côte de Nuits',
    introduction: 'Gevrey-Chambertin is the largest and most prestigious village appellation in the Côte de Nuits, Burgundy. Often called the "King of Burgundy wines," Gevrey-Chambertin produces some of the most powerful, structured, and age-worthy Pinot Noir wines in the world. The appellation boasts nine Grand Cru vineyards — more than any other commune in Burgundy — including the legendary Chambertin and Chambertin-Clos de Bèze.',
    history: 'The history of Gevrey-Chambertin wine stretches back over a thousand years. The village was originally known simply as "Gevrey" until 1847, when it appended the name of its most famous vineyard, Chambertin, to attract prestige. Napoleon Bonaparte was famously devoted to Chambertin, reportedly refusing to drink anything else and even taking barrels on military campaigns. The monks of the Abbey of Cluny first cultivated these vineyards in the 7th century, recognizing the exceptional terroir that makes Gevrey-Chambertin wine so distinctive.',
    terroir: 'The terroir of Gevrey-Chambertin is defined by a gentle east-facing slope at 250-320 metres altitude, with a complex mosaic of limestone, marl, and clay soils. The Grand Cru vineyards sit on a band of Bajocian limestone with thin topsoil, forcing vines to root deeply. This geological diversity is what gives Gevrey-Chambertin wine its remarkable complexity and structure. The famous "combe de Lavaux" — a geological fault — channels cool air across the vineyards, slowing ripening and preserving acidity.',
    climate: 'Continental climate with cold winters and warm, dry summers. The east-facing exposure provides morning sun while protecting vines from harsh afternoon heat. Average annual temperature around 11°C.',
    soils: 'Bajocian limestone with iron-rich clay and marl. Grand Cru sites have thinner topsoil over fractured limestone, while village-level sites have deeper clay soils.',
    keyGrapes: ['Pinot Noir'],
    classifications: [
      { name: 'Grand Cru', description: 'Nine Grand Crus including Chambertin, Chambertin-Clos de Bèze, Chapelle-Chambertin, Charmes-Chambertin, Griotte-Chambertin, Latricières-Chambertin, Mazis-Chambertin, Mazoyères-Chambertin, and Ruchotte-Chambertin.' },
      { name: 'Premier Cru', description: 'Twenty-six Premier Cru vineyards including Les Cazetiers, Clos Saint-Jacques, Lavaux Saint-Jacques, Les Combottes, and Aux Combottes.' },
      { name: 'Village', description: 'Village-level Gevrey-Chambertin wines from vineyards across the commune, offering excellent value and authentic expression of the appellation.' },
    ],
    famousVineyards: ['Chambertin', 'Chambertin-Clos de Bèze', 'Chapelle-Chambertin', 'Charmes-Chambertin', 'Mazis-Chambertin', 'Clos Saint-Jacques (Premier Cru)', 'Les Cazetiers (Premier Cru)', 'Lavaux Saint-Jacques (Premier Cru)'],
    famousProducers: ['Domaine Armand Rousseau', 'Domaine Denis Mortet', 'Domaine Fourrier', 'Domaine Dugat-Py', 'Domaine Trapet', 'Domaine Rossignol-Trapet', 'Heresztyn-Mazzini', 'Domaine Faiveley', 'Christian Sérafin', 'Domaine Tortochot'],
    foodPairings: ['Beef Burgundy (Boeuf Bourguignon)', 'Roast duck with cherry sauce', 'Coq au vin', 'Aged Époisses cheese', 'Venison with blackcurrant jus', 'Wild mushroom risotto', 'Lamb rack with herbs de Provence'],
    investmentProfile: 'Gevrey-Chambertin wine, particularly at Grand Cru level, represents one of the strongest wine investment categories. Chambertin and Clos de Bèze from top producers have delivered consistent annual returns of 8-15%. Premier Cru wines from sites like Clos Saint-Jacques offer exceptional value relative to neighbouring Grand Crus, with strong secondary market demand.',
    buyingGuide: 'When buying Gevrey-Chambertin wine, look for established producers with track records of consistency. Grand Cru wines demand patience — most need 10-20 years of cellaring to reach their peak. Premier Cru wines from top sites like Clos Saint-Jacques and Les Cazetiers often rival Grand Cru quality at a fraction of the price. Village-level Gevrey-Chambertin from producers like Fourrier, Rossignol-Trapet, and Heresztyn-Mazzini offer the best entry point to this prestigious appellation.',
    travelGuide: 'Gevrey-Chambertin is a charming village just 12km south of Dijon, easily reached by car or train. The Route des Grands Crus passes through the village, offering spectacular vineyard views. Many domaines welcome visitors by appointment, and the village has several excellent restaurants.',
    bestTimeToVisit: 'September-October during harvest season, or May-June for warm weather without crowds',
    nearbyAttractions: ['Château du Clos de Vougeot', 'Beaune (historic wine capital)', 'Dijon (Burgundy capital, 12km north)', 'Route des Grands Crus (scenic wine road)', 'Nuits-Saint-Georges'],
    investmentStats: { returns: '8-15%', grandCrus: '9', ageing: '20-50+' },
    faq: [
      { question: 'What does Gevrey-Chambertin wine taste like?', answer: 'Gevrey-Chambertin wine is known for its power and structure compared to other Burgundy appellations. Expect aromas of dark cherry, blackcurrant, liquorice, and violets in youth, developing into complex notes of leather, earth, truffle, and spice with age. Grand Cru wines are exceptionally concentrated with firm tannins that soften over decades.' },
      { question: 'How long should you cellar Gevrey-Chambertin wine?', answer: 'Village-level Gevrey-Chambertin is best drunk between 5-15 years from vintage. Premier Cru wines benefit from 8-20 years of cellaring. Grand Cru Gevrey-Chambertin wines can age gracefully for 20-50+ years, with the very best vintages lasting even longer.' },
      { question: 'What is the difference between Chambertin and Gevrey-Chambertin?', answer: 'Chambertin is a Grand Cru vineyard within the commune of Gevrey-Chambertin. Wines labelled simply "Gevrey-Chambertin" are village-level wines from across the commune. Chambertin Grand Cru is considered one of the finest vineyards in all of Burgundy, producing more concentrated and complex wines than village-level bottlings.' },
      { question: 'Is Gevrey-Chambertin wine a good investment?', answer: 'Yes, Gevrey-Chambertin Grand Cru wines from top producers are among the most sought-after investment wines. Limited production, global demand, and exceptional aging potential create strong price appreciation. Even Premier Cru wines have shown consistent value growth.' },
      { question: 'What food pairs best with Gevrey-Chambertin?', answer: 'Gevrey-Chambertin wine pairs superbly with rich, savoury dishes. Classic pairings include Boeuf Bourguignon, roast duck, venison, aged Époisses cheese, and wild mushroom dishes. The wine\'s structure and depth can handle bold flavours that might overwhelm lighter Burgundies.' },
    ],
  },
  'chassagne-montrachet': {
    name: 'Chassagne-Montrachet',
    slug: 'chassagne-montrachet',
    searchTerm: 'Chassagne',
    title: 'Chassagne-Montrachet Wine | Buy Chassagne-Montrachet Premier Cru & Grand Cru',
    metaDescription: 'Buy Chassagne-Montrachet wine online. Explore our collection of Chassagne-Montrachet 1er Cru white and red wines from top Burgundy producers. Home to legendary Grand Crus.',
    heroImage: 'https://images.unsplash.com/photo-1559519529-0936de9cef79?w=1200&q=80',
    heroAlt: 'Chassagne-Montrachet wine vineyards in Burgundy, France with Chardonnay vines on limestone slopes of the Côte de Beaune',
    introduction: 'Chassagne-Montrachet is one of Burgundy\'s most celebrated white wine appellations, producing rich, mineral-driven Chardonnay wines of extraordinary depth and complexity. Located in the southern Côte de Beaune, this prestigious commune shares three Grand Cru vineyards with neighbouring Puligny-Montrachet — including the legendary Montrachet itself, often considered the greatest white wine vineyard in the world. What many wine lovers don\'t realise is that Chassagne-Montrachet also produces exceptional red wines from Pinot Noir, accounting for nearly half of the commune\'s production.',
    history: 'The history of Chassagne-Montrachet wine dates back to Roman times, when the limestone slopes of the Côte de Beaune were first planted with vines. The village was originally known simply as "Chassagne" until 1879, when it added "Montrachet" — the name of its most famous vineyard — to capitalise on the wine\'s growing reputation. The Cistercian monks of the Abbey of Morgeot were instrumental in identifying the finest vineyard sites, many of which are now classified as Premier Cru. Today, Chassagne-Montrachet wine represents the pinnacle of Burgundian Chardonnay, with a distinctive style that balances richness with mineral precision.',
    terroir: 'The terroir of Chassagne-Montrachet is defined by a complex interplay of limestone, marl, and clay soils on east and south-east facing slopes at 200-350 metres altitude. The village sits on a geological transition zone between the Jurassic limestone of the Côte and the marl-rich soils of the Saône plain. Premier Cru vineyards like Les Caillerets, La Romanée, and Les Chenevottes sit on thin limestone soils that restrict vine vigour and concentrate flavours. This geological complexity gives Chassagne-Montrachet wine its hallmark minerality and ageing potential.',
    climate: 'Continental climate with cold winters and warm summers. The south-east to south-facing slopes receive excellent sun exposure, providing consistent ripening for Chardonnay while maintaining essential freshness.',
    soils: 'Jurassic limestone and marl, with varying proportions of clay. Upper slopes have thinner, more limestone-rich soils ideal for white wines; lower slopes have more clay content suited to Pinot Noir.',
    keyGrapes: ['Chardonnay', 'Pinot Noir'],
    classifications: [
      { name: 'Grand Cru', description: 'Three Grand Cru vineyards shared with Puligny-Montrachet: Montrachet, Bâtard-Montrachet, and Criots-Bâtard-Montrachet. These produce some of the world\'s most expensive and sought-after white wines.' },
      { name: 'Premier Cru', description: 'Fifty-five Premier Cru climats including La Romanée, Les Caillerets, Les Chenevottes, Les Vergers, Morgeot, Les Chaumées, and La Maltroie. These offer exceptional quality-to-price ratio.' },
      { name: 'Village', description: 'Village-level Chassagne-Montrachet in both white and red, offering authentic expression of the commune\'s terroir at accessible price points.' },
    ],
    famousVineyards: ['Montrachet (Grand Cru)', 'Bâtard-Montrachet (Grand Cru)', 'Criots-Bâtard-Montrachet (Grand Cru)', 'La Romanée (Premier Cru)', 'Les Caillerets (Premier Cru)', 'Les Chenevottes (Premier Cru)', 'Morgeot (Premier Cru)', 'Les Chaumées (Premier Cru)', 'Les Vergers (Premier Cru)'],
    famousProducers: ['Domaine Ramonet', 'Domaine Marc Morey', 'Domaine Michel Niellon', 'Domaine Jean-Noël Gagnard', 'Domaine Paul Pillot', 'Domaine Fontaine-Gagnard', 'Domaine Bernard Moreau', 'Domaine du Cellier aux Moines', 'Vincent Dancer', 'Domaine Bachelet-Monnot'],
    foodPairings: ['Lobster thermidor', 'Roast chicken with morel cream sauce', 'Pan-seared turbot', 'Gruyère and Comté cheese', 'Coquilles Saint-Jacques', 'Risotto with white truffle', 'Blanquette de veau'],
    investmentProfile: 'Chassagne-Montrachet wine, particularly Grand Cru and top Premier Cru whites, is among the most collectible white Burgundy. Grand Cru Montrachet and Bâtard-Montrachet from leading producers command extraordinary prices and appreciate consistently. Premier Cru wines from sites like La Romanée and Les Caillerets offer significant investment potential relative to their Puligny counterparts, with growing international recognition driving demand.',
    buyingGuide: 'When buying Chassagne-Montrachet wine, seek out Premier Cru whites from producers like Ramonet, Marc Morey, and Paul Pillot for the best balance of quality and value. Grand Cru wines require significant cellaring (10-25 years) to reach their full potential. Don\'t overlook Chassagne-Montrachet rouge — red wines from top vineyards like Morgeot and Clos Saint-Jean offer remarkable Pinot Noir character at a fraction of Côte de Nuits prices. Village-level whites from established producers provide an excellent entry point.',
    travelGuide: 'Chassagne-Montrachet is a small, picturesque village in the southern Côte de Beaune, easily reached from Beaune (15 minutes by car). The village is quieter than its famous neighbour Puligny-Montrachet, offering a more intimate wine tourism experience. Many domaines welcome visitors by appointment, and the walking trails through the Premier Cru vineyards offer breathtaking views.',
    bestTimeToVisit: 'May-June for warm weather, or September-October during harvest. November for the Hospices de Beaune auction nearby.',
    nearbyAttractions: ['Beaune (historic wine capital, 15 min)', 'Puligny-Montrachet (neighbouring village)', 'Santenay (thermal spa town)', 'Château de Meursault', 'Route des Grands Crus'],
    investmentStats: { returns: '6-12%', grandCrus: '3', ageing: '15-30+' },
    faq: [
      { question: 'What does Chassagne-Montrachet wine taste like?', answer: 'Chassagne-Montrachet white wine is typically rich and full-bodied, with flavours of citrus, white peach, almond, and toasted hazelnut, underlined by a distinctive stony minerality. Premier Cru wines show more complexity with notes of butter, honey, and floral aromatics. Red Chassagne-Montrachet is medium-bodied with cherry fruit, earthy undertones, and fine tannins.' },
      { question: 'Is Chassagne-Montrachet white or red wine?', answer: 'Chassagne-Montrachet produces both white wine (Chardonnay) and red wine (Pinot Noir). While the appellation is best known for its prestigious white wines, nearly half the production is actually red. The reds offer excellent value and authentic Burgundian Pinot Noir character.' },
      { question: 'How long should you cellar Chassagne-Montrachet?', answer: 'Village-level Chassagne-Montrachet white is best enjoyed between 3-8 years from vintage. Premier Cru whites benefit from 5-15 years of cellaring, developing extraordinary complexity. Grand Cru wines (Montrachet, Bâtard-Montrachet) can age 15-30+ years. Red Chassagne-Montrachet drinks well between 5-12 years.' },
      { question: 'What is the difference between Chassagne-Montrachet and Puligny-Montrachet?', answer: 'Both communes produce world-class white Burgundy and share Grand Cru vineyards. Chassagne-Montrachet wines tend to be richer, rounder, and more generously fruited, while Puligny-Montrachet is typically more precise, taut, and mineral-driven. Chassagne also produces significant quantities of red wine, whereas Puligny is almost exclusively white.' },
      { question: 'Is Chassagne-Montrachet a good investment?', answer: 'Yes, particularly Grand Cru wines and top Premier Cru bottlings from producers like Ramonet and Marc Morey. White Burgundy from Chassagne-Montrachet has seen strong price appreciation, though it requires careful storage conditions due to the sensitivity of white wines to temperature fluctuation.' },
    ],
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const appellation = APPELLATIONS[slug]

  if (!appellation) {
    return { title: 'Region Not Found | Aionysus' }
  }

  return {
    title: appellation.title,
    description: appellation.metaDescription,
    alternates: {
      canonical: `https://aionysus.wine/regions/${slug}`,
    },
    openGraph: {
      title: appellation.title,
      description: appellation.metaDescription,
      images: [{ url: appellation.heroImage, alt: appellation.heroAlt }],
    },
  }
}

export default async function RegionPage({ params }: Props) {
  const { slug } = await params
  const appellation = APPELLATIONS[slug]

  if (!appellation) {
    notFound()
  }

  const [wines, totalCount] = await Promise.all([
    getWinesByAppellation(appellation.searchTerm, 24),
    countWinesByAppellation(appellation.searchTerm),
  ])

  // Separate wines by classification for structured display
  const grandCruWines = wines.filter(w =>
    w.classification?.toLowerCase().includes('grand cru') ||
    w.name?.toLowerCase().includes('grand cru')
  )
  const premierCruWines = wines.filter(w =>
    (w.classification?.toLowerCase().includes('premier cru') ||
     w.classification?.toLowerCase().includes('1er cru') ||
     w.name?.toLowerCase().includes('1er cru') ||
     w.name?.toLowerCase().includes('premier cru')) &&
    !grandCruWines.includes(w)
  )
  const villageWines = wines.filter(w =>
    !grandCruWines.includes(w) && !premierCruWines.includes(w)
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: appellation.title,
            description: appellation.metaDescription,
            image: appellation.heroImage,
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Wines', item: 'https://aionysus.wine/wines' },
                { '@type': 'ListItem', position: 2, name: appellation.name, item: `https://aionysus.wine/regions/${appellation.slug}` },
              ],
            },
          }),
        }}
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: appellation.faq.map(item => ({
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

      {/* Hero Section with Vineyard Image */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <img
          src={appellation.heroImage}
          alt={appellation.heroAlt}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-4" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-white/80">
                <li>
                  <Link href="/wines" className="hover:text-white">Wines</Link>
                </li>
                <li className="text-white/50">/</li>
                <li>
                  <Link href="/wines?region=Burgundy" className="hover:text-white">Burgundy</Link>
                </li>
                <li className="text-white/50">/</li>
                <li className="text-white font-medium">{appellation.name}</li>
              </ol>
            </nav>
            {/* H1 - Primary keyword target */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3">
              {appellation.name} Wine
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl">
              Explore {totalCount} exceptional {appellation.name} wines from Burgundy&apos;s most prestigious appellation
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Introduction - keyword-rich opening paragraph */}
        <section className="mb-12" aria-labelledby="intro-heading">
          <h2 id="intro-heading" className="text-3xl font-bold text-stone-900 mb-4">
            About {appellation.name} Wine
          </h2>
          <p className="text-lg text-stone-700 leading-relaxed mb-4">
            {appellation.introduction}
          </p>
          <p className="text-lg text-stone-700 leading-relaxed">
            At Aionysus, we offer a carefully curated selection of <strong>{appellation.name} wine</strong> from
            both established and rising producers. Whether you&apos;re seeking a cellar-worthy Grand Cru or
            an approachable village {appellation.name}, our collection spans the full hierarchy of this
            remarkable appellation.
          </p>
        </section>

        {/* Wine Collection - Grand Cru */}
        {grandCruWines.length > 0 && (
          <section className="mb-12" aria-labelledby="grand-cru-heading">
            <h2 id="grand-cru-heading" className="text-2xl font-bold text-stone-900 mb-2">
              {appellation.name} Grand Cru Wines
            </h2>
            <p className="text-stone-600 mb-6">
              The finest expressions of {appellation.name} wine — from legendary vineyards like Chambertin, Clos de Bèze, and Chapelle-Chambertin.
            </p>
            <WineGrid wines={grandCruWines} appellationName={appellation.name} />
          </section>
        )}

        {/* Wine Collection - Premier Cru */}
        {premierCruWines.length > 0 && (
          <section className="mb-12" aria-labelledby="premier-cru-heading">
            <h2 id="premier-cru-heading" className="text-2xl font-bold text-stone-900 mb-2">
              {appellation.name} Premier Cru Wines
            </h2>
            <p className="text-stone-600 mb-6">
              Outstanding {appellation.name} wines from the finest Premier Cru vineyards including Les Cazetiers, Clos Saint-Jacques, and Les Corbeaux.
            </p>
            <WineGrid wines={premierCruWines} appellationName={appellation.name} />
          </section>
        )}

        {/* Wine Collection - Village */}
        {villageWines.length > 0 && (
          <section className="mb-12" aria-labelledby="village-heading">
            <h2 id="village-heading" className="text-2xl font-bold text-stone-900 mb-2">
              {appellation.name} Village Wines
            </h2>
            <p className="text-stone-600 mb-6">
              Authentic village-level {appellation.name} wine offering excellent value and genuine appellation character from talented producers.
            </p>
            <WineGrid wines={villageWines} appellationName={appellation.name} />
          </section>
        )}

        {/* View All CTA */}
        <div className="text-center mb-16">
          <Link
            href={`/wines?region=${encodeURIComponent(appellation.searchTerm)}`}
            className="inline-block px-8 py-3 bg-burgundy-600 text-white rounded-lg font-semibold hover:bg-burgundy-700 transition-colors"
          >
            View All {appellation.name} Wines ({totalCount})
          </Link>
        </div>

        {/* History Section */}
        <section className="mb-12" aria-labelledby="history-heading">
          <h2 id="history-heading" className="text-2xl font-bold text-stone-900 mb-4">
            The History of {appellation.name} Wine
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-stone-700 leading-relaxed mb-4">
                {appellation.history}
              </p>
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1566903451935-7e8835ed3e97?w=600&q=80"
                alt={`Historic ${appellation.name} wine village and vineyards in Burgundy, France`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Terroir & Climate */}
        <section className="mb-12" aria-labelledby="terroir-heading">
          <h2 id="terroir-heading" className="text-2xl font-bold text-stone-900 mb-4">
            {appellation.name} Terroir &amp; Climate
          </h2>
          <p className="text-stone-700 leading-relaxed mb-6">
            {appellation.terroir}
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
              <h3 className="font-semibold text-stone-900 mb-2">Climate</h3>
              <p className="text-stone-600 text-sm">{appellation.climate}</p>
            </div>
            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
              <h3 className="font-semibold text-stone-900 mb-2">Soils</h3>
              <p className="text-stone-600 text-sm">{appellation.soils}</p>
            </div>
            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
              <h3 className="font-semibold text-stone-900 mb-2">Key Grapes</h3>
              <p className="text-stone-600 text-sm">{appellation.keyGrapes.join(', ')}</p>
            </div>
          </div>
        </section>

        {/* Classifications */}
        <section className="mb-12" aria-labelledby="classifications-heading">
          <h2 id="classifications-heading" className="text-2xl font-bold text-stone-900 mb-4">
            {appellation.name} Wine Classifications
          </h2>
          <p className="text-stone-700 mb-6">
            {appellation.name} wine is produced at three quality levels, each offering a distinct expression of this celebrated Burgundy appellation.
          </p>
          <div className="space-y-4">
            {appellation.classifications.map((classif) => (
              <div key={classif.name} className="bg-stone-50 p-5 rounded-xl border border-stone-200">
                <h3 className="text-lg font-bold text-stone-900 mb-2">{classif.name}</h3>
                <p className="text-stone-600">{classif.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Famous Vineyards */}
        <section className="mb-12" aria-labelledby="vineyards-heading">
          <h2 id="vineyards-heading" className="text-2xl font-bold text-stone-900 mb-4">
            Famous {appellation.name} Vineyards
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-stone-700 mb-4">
                The vineyards of {appellation.name} are among the most revered in the wine world, with {appellation.investmentStats.grandCrus} Grand Cru
                sites and numerous Premier Cru climats offering unparalleled diversity and quality.
              </p>
              <div className="flex flex-wrap gap-2">
                {appellation.famousVineyards.map((vineyard) => (
                  <span key={vineyard} className="px-3 py-1.5 bg-burgundy-50 border border-burgundy-200 rounded-full text-burgundy-700 text-sm font-medium">
                    {vineyard}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&q=80"
                alt={`${appellation.name} vineyard with limestone soils and grapevines in Burgundy`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Famous Producers */}
        <section className="mb-12" aria-labelledby="producers-heading">
          <h2 id="producers-heading" className="text-2xl font-bold text-stone-900 mb-4">
            Top {appellation.name} Wine Producers
          </h2>
          <p className="text-stone-700 mb-4">
            These are some of the most celebrated domaines producing {appellation.name} wine today.
            Many have been tending these vineyards for generations, crafting wines of exceptional quality.
          </p>
          <div className="flex flex-wrap gap-2">
            {appellation.famousProducers.map((producer) => (
              <Link
                key={producer}
                href={`/wines?region=${encodeURIComponent(appellation.searchTerm)}`}
                className="px-4 py-2 bg-stone-100 border border-stone-200 rounded-full text-stone-700 text-sm hover:border-burgundy-400 hover:text-burgundy-700 transition-colors"
              >
                {producer}
              </Link>
            ))}
          </div>
        </section>

        {/* Food Pairings */}
        <section className="mb-12" aria-labelledby="pairings-heading">
          <h2 id="pairings-heading" className="text-2xl font-bold text-stone-900 mb-4">
            Food Pairings for {appellation.name} Wine
          </h2>
          <p className="text-stone-700 mb-4">
            The power and structure of {appellation.name} wine makes it an ideal partner for rich, savoury dishes.
            Here are our recommended food pairings for {appellation.name}:
          </p>
          <div className="flex flex-wrap gap-3">
            {appellation.foodPairings.map((pairing) => (
              <span key={pairing} className="px-4 py-2 bg-stone-100 border border-stone-200 rounded-full text-stone-700">
                {pairing}
              </span>
            ))}
          </div>
        </section>

        {/* Investment Profile */}
        <section className="mb-12 bg-stone-50 border border-stone-200 rounded-xl p-6 md:p-8" aria-labelledby="investment-heading">
          <h2 id="investment-heading" className="text-2xl font-bold text-stone-900 mb-4">
            Investing in {appellation.name} Wine
          </h2>
          <p className="text-stone-700 leading-relaxed mb-4">
            {appellation.investmentProfile}
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-white rounded-lg border border-stone-200">
              <div className="text-2xl font-bold text-green-600">{appellation.investmentStats.returns}</div>
              <div className="text-sm text-stone-500 mt-1">Annual Returns (Grand Cru)</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-stone-200">
              <div className="text-2xl font-bold text-burgundy-600">{appellation.investmentStats.grandCrus}</div>
              <div className="text-sm text-stone-500 mt-1">Grand Cru Vineyards</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-stone-200">
              <div className="text-2xl font-bold text-stone-700">{appellation.investmentStats.ageing}</div>
              <div className="text-sm text-stone-500 mt-1">Years Ageing Potential</div>
            </div>
          </div>
        </section>

        {/* Buying Guide */}
        <section className="mb-12" aria-labelledby="buying-heading">
          <h2 id="buying-heading" className="text-2xl font-bold text-stone-900 mb-4">
            How to Buy {appellation.name} Wine
          </h2>
          <p className="text-stone-700 leading-relaxed">
            {appellation.buyingGuide}
          </p>
        </section>

        {/* Travel Guide */}
        <section className="mb-12" aria-labelledby="travel-heading">
          <h2 id="travel-heading" className="text-2xl font-bold text-stone-900 mb-4">
            Visiting {appellation.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-stone-700 leading-relaxed mb-4">
                {appellation.travelGuide}
              </p>
              <p className="text-stone-600 text-sm">
                <strong>Best time to visit:</strong> {appellation.bestTimeToVisit}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 mb-3">Nearby Attractions</h3>
              <ul className="space-y-2">
                {appellation.nearbyAttractions.map((attraction) => (
                  <li key={attraction} className="flex items-center gap-2 text-stone-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500 flex-shrink-0" />
                    {attraction}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-bold text-stone-900 mb-6">
            Frequently Asked Questions About {appellation.name} Wine
          </h2>
          <div className="space-y-6">
            {appellation.faq.map((item, index) => (
              <div key={index} className="border-b border-stone-200 pb-6 last:border-0">
                <h3 className="text-lg font-semibold text-stone-900 mb-2">{item.question}</h3>
                <p className="text-stone-700">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-burgundy-50 to-stone-50 border border-burgundy-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-3">
            Explore Our {appellation.name} Wine Collection
          </h2>
          <p className="text-stone-600 mb-6 max-w-xl mx-auto">
            Browse {totalCount} carefully selected {appellation.name} wines, or chat with Vic, our AI sommelier,
            for personalised recommendations from this prestigious Burgundy appellation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/wines?region=${encodeURIComponent(appellation.searchTerm)}`}
              className="px-6 py-3 bg-burgundy-600 text-white rounded-lg font-semibold hover:bg-burgundy-700 transition-colors"
            >
              Browse {appellation.name} Wines
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-white border border-stone-300 text-stone-700 rounded-lg font-semibold hover:border-burgundy-400 transition-colors"
            >
              Chat with Vic
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

// Wine card grid component
function WineGrid({ wines, appellationName }: { wines: Wine[]; appellationName: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {wines.map((wine) => (
        <Link
          key={wine.id}
          href={`/wines/${wine.slug}`}
          className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-burgundy-400 hover:shadow-lg transition-all"
        >
          <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden">
            <WineCardImage
              src={wine.image_url}
              alt={`${wine.vintage || ''} ${wine.name} - ${wine.winery} ${appellationName} wine bottle`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {wine.classification && (
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-burgundy-600/90 text-white text-xs rounded-full">
                {wine.classification.includes('Grand') ? 'Grand Cru' :
                 wine.classification.includes('1er') || wine.classification.includes('Premier') ? '1er Cru' : ''}
              </span>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-stone-900 text-sm line-clamp-2 group-hover:text-burgundy-700 transition-colors">
              {wine.vintage && `${wine.vintage} `}{wine.name}
            </h3>
            <p className="text-xs text-stone-500 mt-1">{wine.winery}</p>
            {wine.price_retail && (
              <p className="text-sm font-bold text-stone-900 mt-2">{formatPrice(wine.price_retail)}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
