/**
 * Wine Enrichment Data
 *
 * Skyscraper-level content for high-priority wine pages.
 * These pages get additional rich sections beyond the standard template.
 */

export interface WineEnrichment {
  slug: string
  heroImage: string
  heroAlt: string
  producerProfile: {
    name: string
    history: string
    philosophy: string
    image: string
    imageAlt: string
  }
  whySpecial: string[]
  vintageAnalysis: string
  cellaring: {
    temperature: string
    humidity: string
    position: string
    advice: string
    peakWindow: string
  }
  criticalAcclaim: { source: string; score: string; quote: string }[]
  contextSection: {
    title: string
    content: string
  }
  additionalFoodPairings: string[]
  collectorsNotes: string
  externalLinks: { name: string; url: string; description: string }[]
  seo?: {
    title: string
    h1: string
    metaDescription: string
    imageAlt: string
    bodyKeyword: string
  }
  regionImages?: {
    hero: string
    mid: string
    footer: string
  }
  regionTravel?: {
    title: string
    intro: string
    highlights: string[]
  }
}

export const WINE_ENRICHMENTS: Record<string, WineEnrichment> = {
  'boal-borges-1875': {
    slug: 'boal-borges-1875',
    heroImage: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=800&q=80',
    heroAlt: 'Boal Borges 1875 Madeira wine - one of the oldest wines in the world from the historic island of Madeira',
    producerProfile: {
      name: 'H.M. Borges',
      history: 'H.M. Borges is one of the most historic wine houses on the island of Madeira, founded in 1877 by Henrique Menezes Borges. The house has been family-owned for over 145 years, maintaining the traditional canteiro ageing method that makes Madeira among the most long-lived wines on earth. Their cellars in Funchal contain wines dating back to the early 19th century, including this extraordinary 1875 Boal — a wine that predates the founding of the company itself, acquired from older reserves.',
      philosophy: 'H.M. Borges follows the centuries-old canteiro ageing method, where wines are placed in warm lofts (estufas naturais) and aged slowly in American oak casks for decades. This patient, natural oxidative ageing creates wines of extraordinary complexity that are virtually indestructible, capable of lasting centuries in bottle.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80',
      imageAlt: 'Historic Madeira wine lodge interior with aged oak casks containing rare vintage Boal Madeira',
    },
    whySpecial: [
      'One of the oldest commercially available wines in the world — over 145 years old',
      'Pre-phylloxera vintage from 1875, when European vines were still on their own rootstock',
      'Boal (Bual) is one of the four noble grape varieties of Madeira, producing medium-sweet wines of extraordinary complexity',
      'Madeira is virtually indestructible — this wine will continue to improve for centuries',
      'A living piece of viticultural history that predates automobiles, electricity, and the telephone',
      'The canteiro ageing method gives Madeira its unique caramelised, smoky character',
    ],
    vintageAnalysis: 'The 1875 vintage on Madeira preceded the phylloxera epidemic that devastated the island\'s vineyards in the 1880s. Wines from this era are made from ungrafted vines — the original pre-phylloxera rootstock — which many believe produced wines of even greater concentration and complexity than modern plantings. The year 1875 saw favourable growing conditions on Madeira, with warm temperatures and moderate rainfall producing grapes of exceptional ripeness and concentration. After over 145 years of canteiro ageing, Boal Borges 1875 has achieved a level of complexity that is almost impossible to describe — each sip reveals new layers of flavour that have been building for over a century and a half.',
    cellaring: {
      temperature: '12-18°C (Madeira is extremely resilient to temperature variation)',
      humidity: '60-70% (less critical than for table wines due to oxidative style)',
      position: 'Upright is acceptable for Madeira — the high acidity and fortification protect the wine',
      advice: 'This 1875 Boal H.M. Borges Madeira is among the most robust wines ever made. Unlike table wines, aged Madeira actually benefits from its exposure to heat and air during the ageing process. Once opened, this wine will remain in perfect condition for months — even years — as the oxidative ageing process means there is no degradation from air exposure.',
      peakWindow: 'Now — essentially indefinite. This 1875 Boal will not decline in our lifetimes.',
    },
    criticalAcclaim: [
      { source: 'Richard Mayson (Madeira Expert)', score: 'Exceptional', quote: 'Pre-phylloxera Madeira wines represent the absolute pinnacle of the winemaker\'s art — wines that have defeated time itself.' },
      { source: 'The Wine Advocate', score: '97+', quote: 'Century-old Madeira offers a tasting experience unlike anything else in the wine world — hauntingly complex and seemingly immortal.' },
      { source: 'Jancis Robinson MW', score: '19/20', quote: 'Great aged Madeira is arguably the most extraordinary wine experience available to collectors.' },
    ],
    contextSection: {
      title: 'Understanding Boal Borges 1875: Pre-Phylloxera Madeira',
      content: 'Boal Borges 1875 belongs to a vanishingly rare category of wines: pre-phylloxera Madeira. Phylloxera — a vine-killing insect from North America — devastated Madeira\'s vineyards between 1852 and 1885. While many vineyards were destroyed earlier, the remoter plantings survived into the mid-1870s, producing wines from ancient, ungrafted vines. These pre-phylloxera wines are prized for their extraordinary concentration, as the original European rootstock produced smaller berries with more intense flavours. Today, fewer than a hundred casks of pre-phylloxera Madeira remain in existence, making each bottle of Boal Borges 1875 a genuine museum piece — yet one that is still vibrantly alive and drinking superbly.',
    },
    additionalFoodPairings: ['Crème caramel', 'Pecan pie', 'Aged Mimolette cheese', 'Cigar accompaniment', 'Roasted chestnuts', 'Dark chocolate truffles with sea salt', 'Blue Stilton', 'Foie gras terrine'],
    collectorsNotes: 'Boal Borges 1875 is an extraordinary collector\'s wine. Pre-phylloxera Madeira from the 1800s represents one of the most secure wine investments, as the wine is essentially indestructible and the supply can only diminish over time. Provenance is key — ensure bottles of Boal Borges 1875 come directly from the Borges lodge in Funchal or from reputable auction houses. Authentication can be verified through H.M. Borges directly. This wine makes an exceptional birth-year gift, anniversary celebration, or legacy cellar centrepiece.',
    externalLinks: [
      { name: 'H.M. Borges Official', url: 'https://www.hmborges.com', description: 'Official producer website with history and collection' },
      { name: 'Madeira Wine Institute (IVBAM)', url: 'https://www.ivbam.gov-madeira.pt', description: 'Official Madeira DOC regulatory body' },
      { name: 'Visit Madeira', url: 'https://www.visitmadeira.pt', description: 'Tourism and wine route information' },
      { name: 'Wine-Searcher: Boal Madeira', url: 'https://www.wine-searcher.com/grape-1628-boal', description: 'Market prices and availability worldwide' },
    ],
    seo: {
      title: 'Boal Borges 1875 - Vintage Madeira Wine | Aionysus',
      h1: 'Boal Borges 1875 Madeira',
      metaDescription: 'Boal Borges 1875 — buy this rare pre-phylloxera H.M. Borges Madeira wine. Over 145 years old, one of the oldest commercially available wines. Expert tasting notes, investment analysis & food pairings.',
      imageAlt: 'Boal Borges 1875 wine bottle - rare pre-phylloxera H.M. Borges vintage Madeira',
      bodyKeyword: 'Boal Borges 1875',
    },
    regionImages: {
      hero: 'https://images.unsplash.com/photo-1722607784426-74d7887bde05?w=1920&q=80&fit=crop',
      mid: 'https://images.unsplash.com/photo-1628413283166-a7666966d26b?w=1920&q=80&fit=crop',
      footer: 'https://images.unsplash.com/photo-1722608194896-1bce8c325480?w=1920&q=80&fit=crop',
    },
    regionTravel: {
      title: 'Discover Madeira: The Island of Eternal Wine',
      intro: 'Rising from the Atlantic Ocean 600km off the African coast, Madeira is a volcanic paradise where wine has been produced for over 500 years. The island\'s unique canteiro ageing method and subtropical climate create wines of Boal Borges 1875 calibre that are virtually immortal — no other wine region on earth can claim bottles from the 1700s that still drink beautifully today. Visiting the historic wine lodges of Funchal is a pilgrimage for anyone who appreciates Boal Borges 1875 and the extraordinary tradition behind it.',
      highlights: [
        'Tour the historic wine lodges of Funchal where Boal Borges 1875 was aged',
        'Walk the levadas through ancient laurel forests',
        'Visit Câmara de Lobos, the fishing village that inspired Churchill',
        'Taste vintages spanning three centuries in a single sitting',
      ],
    },
  },

  '2011-ch-petrus-pomerol': {
    slug: '2011-ch-petrus-pomerol',
    heroImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    heroAlt: 'Château Pétrus Pomerol 2011 - the legendary Merlot wine from Bordeaux Right Bank',
    producerProfile: {
      name: 'Château Pétrus',
      history: 'Château Pétrus is arguably the most famous wine estate in the world, located on a unique plateau of blue clay in the heart of Pomerol, Bordeaux. Unlike the grand châteaux of the Médoc, Pétrus is a modest farmhouse surrounded by just 11.5 hectares of vines — yet it produces one of the most expensive and sought-after wines on earth. The estate\'s modern reputation was built by Jean-Pierre Moueix, who acquired it in 1964, and is now managed by his son Jean-François Moueix. Only around 2,500 cases are produced annually.',
      philosophy: 'Pétrus is defined by its unique terroir: a button of blue clay (smectite) that is found nowhere else in Bordeaux. This exceptional soil retains water during drought and swells to push away excess moisture during rain, creating perfect growing conditions for Merlot. The estate practices meticulous viticulture — harvest is entirely by hand, sometimes completed in a single afternoon, and the grapes are sorted berry by berry. Only the finest lots are selected for the Grand Vin.',
      image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&q=80',
      imageAlt: 'Pomerol vineyard landscape with Merlot vines on the famous blue clay terroir of Château Pétrus',
    },
    whySpecial: [
      'Château Pétrus is widely considered the greatest Merlot-based wine in the world',
      'Only 2,500 cases produced annually from 11.5 hectares of prime blue clay terroir',
      'The unique button of Cretaceous-era smectite clay creates conditions found nowhere else in Bordeaux',
      'Pétrus achieved mythical status after being served to the Kennedys at the White House',
      'No official classification in Pomerol — but universally acknowledged as the region\'s First Growth',
      'The 2011 vintage shows Pétrus\'s ability to shine even in challenging years',
    ],
    vintageAnalysis: 'The 2011 vintage in Bordeaux was characterised by an unusually warm, dry spring followed by a cooler, wetter summer. While many estates struggled, Pétrus\'s extraordinary blue clay terroir proved its worth — the clay\'s moisture-retaining properties ensured the old Merlot vines never suffered water stress during the dry spring, while draining excess water during the summer rains. The result is a Pétrus of perhaps less power than the legendary 2009 or 2010, but with remarkable elegance, purity, and aromatic complexity. The 2011 Pétrus offers a rare opportunity to acquire this legendary wine at a relative value compared to the surrounding blockbuster vintages.',
    cellaring: {
      temperature: '12-14°C (consistent temperature is critical)',
      humidity: '65-75% (essential for preserving corks over decades)',
      position: 'Horizontal, ensuring cork remains moist',
      advice: 'The 2011 Pétrus should be stored in professional-grade conditions or bonded warehouse. This wine demands perfect provenance — any temperature deviation can be detrimental. Cork quality at Pétrus is exceptional, but regular assessment every 25 years is advisable for long-term cellaring.',
      peakWindow: '2025 - 2055. Beginning to show well now but will reward patience.',
    },
    criticalAcclaim: [
      { source: 'Robert Parker / Wine Advocate', score: '94', quote: 'Pétrus 2011 is a wine of sensational quality given the vintage. Remarkable purity and silky tannins.' },
      { source: 'James Suckling', score: '96', quote: 'So refined and elegant with beautiful tannins. This is serious Pétrus.' },
      { source: 'Neal Martin / Vinous', score: '93', quote: 'The 2011 Pétrus has a gorgeous bouquet with pure blackberry, truffle, and graphite notes.' },
    ],
    contextSection: {
      title: 'Why Pétrus Commands Legendary Status',
      content: 'Château Pétrus\'s rise to the pinnacle of the wine world is one of the great stories in oenology. In the 1940s, Madame Loubat — the estate\'s formidable owner — introduced Pétrus to fashionable Parisian society and, crucially, to the American market. When Pétrus was served at a White House dinner for the Kennedys in the 1960s, its international reputation was sealed. Today, Pétrus is the benchmark for Merlot worldwide, and its unique blue clay terroir — a geological anomaly dating to the Cretaceous era — is recognised as one of the most extraordinary vineyard sites on earth. What makes Pétrus truly remarkable is the consistency of quality across vintages: even in challenging years like 2011, the estate produces wines of extraordinary refinement.',
    },
    additionalFoodPairings: ['Wagyu beef', 'Black truffle risotto', 'Aged Parmigiano-Reggiano (36+ months)', 'Roast pigeon with foie gras', 'Venison loin with blackberry jus', 'Beef cheek bourguignon', 'Slow-roasted lamb shoulder'],
    collectorsNotes: 'The 2011 Château Pétrus represents exceptional value within the Pétrus portfolio. While the blockbuster 2009 and 2010 command extraordinary premiums, the 2011 offers genuine Pétrus quality and terroir expression at a significant discount. For collectors, this vintage offers an accessible entry point to one of the world\'s most legendary wines. Ensure all purchases are from reputable sources with complete provenance documentation. Château Pétrus wines are among the most counterfeited in the world — authentication services are recommended for secondary market purchases.',
    externalLinks: [
      { name: 'Établissements Jean-Pierre Moueix', url: 'https://www.moueix.com', description: 'Official Pétrus owner and négociant' },
      { name: 'Bordeaux Wine Council', url: 'https://www.bordeaux.com/en/Our-Terroir/Appellations/Pomerol', description: 'Official Pomerol appellation information' },
      { name: 'Wine Spectator: Pétrus', url: 'https://www.winespectator.com/articles/petrus-pomerol', description: 'Expert reviews and vintage ratings' },
      { name: 'Liv-ex Fine Wine Exchange', url: 'https://www.liv-ex.com', description: 'Secondary market trading platform for fine wine' },
    ],
  },

  '2009-ch-petrus-pomerol': {
    slug: '2009-ch-petrus-pomerol',
    heroImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    heroAlt: 'Château Pétrus Pomerol 2009 - one of the greatest wines ever produced in Bordeaux',
    producerProfile: {
      name: 'Château Pétrus',
      history: 'Château Pétrus is arguably the most famous wine estate in the world, located on a unique plateau of blue clay in the heart of Pomerol, Bordeaux. Unlike the grand châteaux of the Médoc, Pétrus is a modest farmhouse surrounded by just 11.5 hectares of vines — yet it produces one of the most expensive and sought-after wines on earth. The estate\'s modern reputation was built by Jean-Pierre Moueix, who acquired it in 1964, and is now managed by his son Jean-François Moueix. Only around 2,500 cases are produced annually.',
      philosophy: 'Pétrus is defined by its unique terroir: a button of blue clay (smectite) that is found nowhere else in Bordeaux. This exceptional soil retains water during drought and swells to push away excess moisture during rain, creating perfect growing conditions for Merlot. The estate practices meticulous viticulture — harvest is entirely by hand, sometimes completed in a single afternoon, and the grapes are sorted berry by berry. Only the finest lots are selected for the Grand Vin.',
      image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&q=80',
      imageAlt: 'Pomerol vineyard landscape with Merlot vines on the famous blue clay terroir of Château Pétrus',
    },
    whySpecial: [
      'The 2009 is widely considered one of the greatest Pétrus vintages ever produced',
      'Perfect or near-perfect scores from every major wine critic',
      'Only 2,500 cases produced — among the rarest fine wines in the world',
      'The 2009 vintage in Bordeaux was exceptional, with ideal growing conditions throughout',
      'Will age gracefully for 50-100+ years, making it a true legacy wine',
      'Represents the pinnacle of what Merlot can achieve on Pomerol\'s blue clay terroir',
    ],
    vintageAnalysis: 'The 2009 vintage in Bordeaux is universally acclaimed as one of the greatest of the modern era. A warm, dry growing season with ideal conditions from flowering through harvest produced wines of extraordinary concentration, ripeness, and balance. For Pétrus, the conditions were nothing short of perfect — the blue clay terroir regulated moisture precisely, and the old Merlot vines (average age 40+ years) produced tiny berries of incredible intensity. The resulting wine is monumental in scale yet possessed of an ethereal elegance that elevates it to the very highest level. Many critics consider the 2009 Pétrus among the ten greatest wines ever made in Bordeaux.',
    cellaring: {
      temperature: '12-14°C (consistent temperature is absolutely critical)',
      humidity: '65-75% (professional storage essential)',
      position: 'Horizontal, in vibration-free environment',
      advice: 'A wine of this value and ageing potential demands professional storage — bonded warehouse or purpose-built cellar. The 2009 Pétrus has the structure and concentration to age for 50-100+ years. Given its extraordinary value (typically £10,000+), provenance documentation and professional storage records are essential for future resale.',
      peakWindow: '2030 - 2080+. Will be magnificent for decades to come.',
    },
    criticalAcclaim: [
      { source: 'Robert Parker / Wine Advocate', score: '100', quote: 'Perfection. The 2009 Pétrus is one of the greatest wines I have ever tasted. Monumental.' },
      { source: 'James Suckling', score: '100', quote: 'This is sheer perfection in a glass. The greatest Pétrus I have ever tasted.' },
      { source: 'Jancis Robinson MW', score: '19.5/20', quote: 'Extraordinarily fine and concentrated. A wine for the ages.' },
      { source: 'Neal Martin / Vinous', score: '99', quote: 'The 2009 Pétrus is breathtaking. Staggering concentration with ethereal elegance.' },
    ],
    contextSection: {
      title: 'The 2009 Vintage: A Legendary Year for Pétrus',
      content: 'The 2009 Pétrus sits alongside the 1945, 1947, 1961, 1982, and 2000 as one of the defining vintages of this legendary estate. What makes 2009 so extraordinary is the rare combination of power and finesse — the wine is massively concentrated yet never heavy, with a purity and precision that seems almost impossible at this level of richness. The Moueix family consider it among their finest achievements. For collectors and investors, the 2009 Pétrus represents the gold standard of fine wine — a wine whose reputation, rarity, and quality make it one of the most secure wine investments in existence. Secondary market prices have appreciated consistently since release, and demand shows no sign of abating.',
    },
    additionalFoodPairings: ['Kobe beef teppanyaki', 'Black truffle soufflé', 'Roast grouse', 'Venison Wellington', 'Aged Comté cheese (24+ months)', 'Wild boar with blackberry reduction', 'Tournedos Rossini'],
    collectorsNotes: 'The 2009 Château Pétrus is one of the most coveted wines in the world. With perfect scores from multiple critics and production of only 2,500 cases, demand far exceeds supply. Prices have appreciated consistently since the en primeur release and show no signs of plateauing. Authentication is critical at this price point — always purchase from established merchants or auction houses with full provenance documentation. This is a cornerstone wine for any serious collection and a potential heirloom piece that will outlast its owner.',
    externalLinks: [
      { name: 'Établissements Jean-Pierre Moueix', url: 'https://www.moueix.com', description: 'Official Pétrus owner and négociant' },
      { name: 'Bordeaux Wine Council: Pomerol', url: 'https://www.bordeaux.com/en/Our-Terroir/Appellations/Pomerol', description: 'Official Pomerol appellation information' },
      { name: 'Wine Advocate', url: 'https://www.robertparker.com', description: 'Robert Parker\'s 100-point score for this wine' },
      { name: 'Liv-ex Fine Wine Exchange', url: 'https://www.liv-ex.com', description: 'Secondary market trading and price data' },
    ],
  },

  '2019-grands-echezeaux-grand-cru-nicole-lamarche': {
    slug: '2019-grands-echezeaux-grand-cru-nicole-lamarche',
    heroImage: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
    heroAlt: '2019 Grands Echézeaux Grand Cru Nicole Lamarche - prestigious Burgundy Grand Cru Pinot Noir from Domaine Lamarche',
    producerProfile: {
      name: 'Domaine Lamarche',
      history: 'Domaine Lamarche is one of the most significant estates in Vosne-Romanée, Burgundy, with holdings that include a monopole in La Grande Rue Grand Cru — one of only six Grand Cru vineyards in the commune. The domaine was founded by Henri Lamarche in the early 20th century and is now run by Nicole Lamarche, who has elevated quality dramatically since taking charge. Their holdings in Echézeaux and Grands Echézeaux are among the largest of any domaine, with old vines producing wines of exceptional depth.',
      philosophy: 'Nicole Lamarche practices careful, sustainable viticulture with minimal intervention in the cellar. Yields are kept deliberately low, and the wines are aged in a proportion of new French oak that varies by vintage and cuvée. The approach emphasises purity of fruit expression and terroir transparency — letting the Grand Cru vineyard speak for itself rather than masking it with winemaking technique.',
      image: 'https://images.unsplash.com/photo-1566903451935-7e8835ed3e97?w=600&q=80',
      imageAlt: 'Echézeaux Grand Cru vineyard in Vosne-Romanée, Burgundy with Pinot Noir vines on limestone slopes',
    },
    whySpecial: [
      'Grands Echézeaux is one of Burgundy\'s most prestigious Grand Cru vineyards, directly adjacent to Clos de Vougeot',
      'Domaine Lamarche holds significant old-vine parcels in this exceptional vineyard',
      'The 2019 vintage in Burgundy produced wines of outstanding concentration and balance',
      'Nicole Lamarche has transformed quality at the domaine in recent vintages',
      'Grands Echézeaux sits a tier above Echézeaux, producing more concentrated, age-worthy wines',
      'Significantly more affordable than neighbouring Romanée-Saint-Vivant or Richebourg Grand Crus',
    ],
    vintageAnalysis: 'The 2019 vintage in Burgundy was marked by a warm, dry summer that produced ripe, concentrated wines with excellent structure. Some estates struggled with the heat, but those with deep-rooted old vines — like Domaine Lamarche\'s parcels in Grands Echézeaux — produced wines of remarkable depth and freshness. The 2019 Grands Echézeaux shows the vintage\'s characteristic generosity of fruit while maintaining the mineral precision and acidity that defines great Burgundy Grand Cru. This is a vintage that will age beautifully, with the concentration to support 20-30 years of cellaring.',
    cellaring: {
      temperature: '11-13°C (Burgundy requires cooler storage than Bordeaux)',
      humidity: '70-80% (critical for delicate Burgundy corks)',
      position: 'Horizontal, in dark conditions (Pinot Noir is light-sensitive)',
      advice: 'Burgundy Grand Cru demands meticulous storage conditions. The 2019 Grands Echézeaux has the concentration for long ageing but Pinot Noir is more fragile than Cabernet-based wines. Professional storage is strongly recommended. Avoid any temperature fluctuation.',
      peakWindow: '2029 - 2049. Best to wait at least 5-7 years from vintage for Grand Cru Burgundy.',
    },
    criticalAcclaim: [
      { source: 'Burghound (Allen Meadows)', score: '93-95', quote: 'Impressive concentration and energy. The Lamarche Grands Echézeaux is one of the domaine\'s finest efforts.' },
      { source: 'Jasper Morris MW', score: '17.5/20', quote: 'Beautifully composed with real Grand Cru depth. Nicole Lamarche continues to impress.' },
      { source: 'Wine Spectator', score: '94', quote: 'Rich and layered, with superb balance. A Grand Cru of genuine distinction.' },
    ],
    contextSection: {
      title: 'Grands Echézeaux: The Hidden Gem of Burgundy Grand Cru',
      content: 'Grands Echézeaux is one of Burgundy\'s most underappreciated Grand Cru vineyards. Located on the slope directly above Clos de Vougeot and adjacent to the legendary vineyards of Vosne-Romanée (Romanée-Saint-Vivant, Richebourg), it produces wines of extraordinary complexity at prices significantly below its more famous neighbours. The vineyard was classified as Grand Cru separately from the larger Echézeaux appellation, recognising its superior terroir — thinner topsoil over Bajocian limestone gives wines of greater mineral intensity and structure. For collectors seeking genuine Burgundy Grand Cru quality without the astronomical prices of DRC or Leroy, Grands Echézeaux from producers like Domaine Lamarche represents one of the finest opportunities in Burgundy.',
    },
    additionalFoodPairings: ['Duck breast with cherry reduction', 'Wild mushroom tart', 'Aged Époisses cheese', 'Roast quail with truffle jus', 'Boeuf Bourguignon (the classic pairing)', 'Pan-seared pigeon breast', 'Risotto with porcini mushrooms'],
    collectorsNotes: 'The 2019 Grands Echézeaux from Domaine Lamarche represents outstanding value in the Grand Cru Burgundy market. While neighbouring vineyards (Romanée-Saint-Vivant, Richebourg) command prices 5-10x higher, Grands Echézeaux offers comparable quality and ageing potential. Domaine Lamarche\'s old vines and Nicole Lamarche\'s improved winemaking make this a compelling acquisition for serious Burgundy collections. Limited production ensures consistent secondary market demand.',
    externalLinks: [
      { name: 'Bourgogne Wines Official', url: 'https://www.bourgogne-wines.com', description: 'Official Burgundy wines information body (BIVB)' },
      { name: 'Domaine Lamarche', url: 'https://www.domaine-lamarche.com', description: 'Official producer website' },
      { name: 'Climats de Bourgogne (UNESCO)', url: 'https://www.climats-bourgogne.com', description: 'UNESCO World Heritage Burgundy vineyard classification' },
      { name: 'Burghound', url: 'https://www.burghound.com', description: 'Allen Meadows\' Burgundy specialist reviews' },
    ],
  },
}

export function getWineEnrichment(slug: string): WineEnrichment | null {
  return WINE_ENRICHMENTS[slug] || null
}
