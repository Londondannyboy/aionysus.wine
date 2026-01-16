/**
 * Cyprus Destination Data
 *
 * Content for populating Cyprus topic cluster and page contexts.
 * Used by: node scripts/populate-destination.js cyprus
 */

module.exports = {
  // Topic Cluster
  cluster: {
    name: 'cyprus',
    display_name: 'Cyprus Relocation',
    hub_page_slug: '/destinations/cyprus',
    description: 'Complete guide to relocating to Cyprus - visas, jobs, cost of living, lifestyle, tax benefits',
    spoke_pages: [
      '/guides/moving-to-cyprus',
      '/guides/cyprus-expat-jobs',
      '/guides/cyprus-digital-nomad',
      '/guides/cyprus-tax-benefits',
      '/guides/cyprus-cost-of-living',
    ],
    keywords: [
      'move to cyprus',
      'cyprus relocation',
      'cyprus expat',
      'cyprus digital nomad',
      'cyprus visa',
      'cyprus non-dom',
      'limassol expat',
      'paphos expat',
      'cyprus 60 day rule',
      'cyprus permanent residency',
    ],
    priority: 8,
  },

  // Page Contexts
  pages: [
    // Main destination page
    {
      page_slug: '/destinations/cyprus',
      page_title: 'Moving to Cyprus - Complete Relocation Guide 2026',
      page_type: 'destination',
      destination_slug: 'cyprus',
      voice_context: `User is viewing the Cyprus relocation guide. Key topics to discuss:
- Digital Nomad Visa: 1-year permit for remote workers, €3,500/month income requirement
- Permanent Residency: Fast-track Category F for €300k property investment
- Tax Benefits: Non-dom status (17 years), 60-day tax residency rule, no tax on dividends
- Cost of Living: Limassol €2,000-3,000/month, Paphos €1,500-2,500/month
- Popular Areas: Limassol (business hub), Paphos (expats/retirees), Larnaca (affordable), Nicosia (capital)
- Lifestyle: 340 days sunshine, Mediterranean beaches, English widely spoken, EU member
- Job Market: Finance, shipping, tech, tourism. Many remote workers.`,
      available_sections: ['overview', 'visas', 'costs', 'jobs', 'lifestyle', 'tax', 'areas', 'faqs'],
      related_tools: ['cost-calculator', 'visa-timeline', 'compare'],
      keywords: ['move to cyprus', 'cyprus relocation guide', 'cyprus expat', 'living in cyprus', 'cyprus digital nomad'],
      hero_variant: 'destination',
      hero_title: 'Moving to Cyprus',
      hero_subtitle: 'Island life with EU benefits and Mediterranean sunshine',
      hero_image: 'https://images.unsplash.com/photo-1560717465-a91c6d6d1f0d?w=1600',
      meta_title: 'Moving to Cyprus 2026 | Complete Relocation Guide',
      meta_description: 'Everything you need to know about relocating to Cyprus. Visa options, cost of living, tax benefits, and lifestyle guide for expats.',
      content_summary: `Cyprus offers an attractive relocation option with its EU membership, favorable tax regime, and Mediterranean lifestyle. The island provides multiple visa pathways including a digital nomad visa for remote workers and fast-track permanent residency through property investment. With English widely spoken, 340 days of sunshine, and a growing tech scene, Cyprus has become a popular destination for digital nomads, entrepreneurs, and retirees alike.`,
      priority: 10,
    },

    // Guide: Moving to Cyprus
    {
      page_slug: '/guides/moving-to-cyprus',
      page_title: 'Complete Guide to Moving to Cyprus',
      page_type: 'guide',
      voice_context: `User is reading comprehensive Cyprus moving guide. Cover practical aspects:
- Step-by-step relocation process
- Finding housing (rent €800-2,000/month depending on area)
- Opening a bank account (Bank of Cyprus, Hellenic Bank)
- Healthcare (GESY national system, private options)
- Schools (international schools in Limassol, Paphos)
- Getting around (car essential outside cities)
- Shipping belongings, pets
- First weeks checklist`,
      available_sections: ['overview', 'before-you-go', 'visas', 'housing', 'banking', 'healthcare', 'schools', 'transport', 'checklist'],
      related_tools: ['cost-calculator'],
      keywords: ['moving to cyprus', 'cyprus expat guide', 'relocate to cyprus', 'cyprus living guide'],
      hero_variant: 'guide',
      hero_title: 'Moving to Cyprus',
      hero_subtitle: 'Your complete step-by-step guide',
      hero_gradient: 'from-amber-500 to-orange-600',
      meta_title: 'Moving to Cyprus | Step-by-Step Relocation Guide',
      meta_description: 'Complete guide to moving to Cyprus. Housing, banking, healthcare, schools, and everything you need for a smooth relocation.',
      priority: 8,
    },

    // Guide: Cyprus Expat Jobs
    {
      page_slug: '/guides/cyprus-expat-jobs',
      page_title: 'Finding Jobs in Cyprus as an Expat',
      page_type: 'guide',
      voice_context: `User is looking for job opportunities in Cyprus. Key info:
- In-demand sectors: Finance, shipping, tech, iGaming, tourism
- Average salaries: €20,000-40,000 for professionals, higher in finance/tech
- Remote work: Growing trend, many international companies
- Work permits: EU citizens can work freely, non-EU need employer sponsorship
- Job sites: Kariera.com.cy, ErgoDotisi, LinkedIn
- Freelancing: Digital nomad visa allows self-employment
- Networking: Limassol has active tech/startup community`,
      available_sections: ['overview', 'job-market', 'sectors', 'salaries', 'remote-work', 'work-permits', 'job-search', 'networking'],
      related_tools: [],
      keywords: ['cyprus jobs', 'expat jobs cyprus', 'working in cyprus', 'cyprus job market', 'cyprus salary'],
      hero_variant: 'guide',
      hero_title: 'Cyprus Expat Jobs',
      hero_subtitle: 'Find work opportunities on the island',
      hero_gradient: 'from-cyan-500 to-blue-600',
      meta_title: 'Cyprus Expat Jobs | Find Work in Cyprus 2026',
      meta_description: 'Guide to finding jobs in Cyprus as an expat. In-demand sectors, salaries, remote work options, and job search resources.',
      priority: 7,
    },

    // Guide: Cyprus Digital Nomad Visa
    {
      page_slug: '/guides/cyprus-digital-nomad',
      page_title: 'Cyprus Digital Nomad Visa Guide',
      page_type: 'guide',
      voice_context: `User is interested in Cyprus digital nomad visa. Key details:
- Visa duration: 1 year, renewable for 2 more years
- Income requirement: €3,500/month (or €42,000/year)
- Who qualifies: Remote workers, freelancers, self-employed
- Processing time: 4-6 weeks
- Required documents: Proof of income, health insurance, clean criminal record
- Tax implications: Can become tax resident with 60-day rule
- Benefits: Live in EU, travel Schengen, favorable tax
- Popular spots: Limassol (most popular), Paphos, Larnaca`,
      available_sections: ['overview', 'requirements', 'income', 'application', 'documents', 'timeline', 'tax', 'lifestyle', 'faqs'],
      related_tools: ['visa-timeline'],
      keywords: ['cyprus digital nomad visa', 'cyprus remote work visa', 'work from cyprus', 'cyprus freelancer visa'],
      hero_variant: 'guide',
      hero_title: 'Cyprus Digital Nomad Visa',
      hero_subtitle: 'Work remotely from the Mediterranean',
      hero_gradient: 'from-purple-600 to-pink-600',
      meta_title: 'Cyprus Digital Nomad Visa 2026 | Requirements & How to Apply',
      meta_description: 'Complete guide to the Cyprus digital nomad visa. Income requirements, application process, and benefits for remote workers.',
      priority: 9,
    },

    // Guide: Cyprus Tax Benefits
    {
      page_slug: '/guides/cyprus-tax-benefits',
      page_title: 'Cyprus Tax Benefits for Expats',
      page_type: 'guide',
      voice_context: `User is researching Cyprus tax advantages. Key benefits:
- Non-dom status: No tax on dividends, interest, rental income from abroad (17 years)
- 60-day rule: Become tax resident with just 60 days if conditions met
- Corporate tax: 12.5% (among lowest in EU)
- No inheritance tax, no wealth tax
- IP Box regime: 2.5% effective tax on intellectual property income
- Personal tax: Progressive 0-35%, but many exemptions
- Conditions for 60-day rule: Not resident elsewhere, Cyprus company/job, own/rent property
- Pension income: Can be taxed at flat 5%`,
      available_sections: ['overview', 'non-dom', '60-day-rule', 'corporate-tax', 'personal-tax', 'exemptions', 'planning', 'faqs'],
      related_tools: [],
      keywords: ['cyprus tax benefits', 'cyprus non-dom', 'cyprus 60 day rule', 'cyprus tax residency', 'cyprus expat tax'],
      hero_variant: 'guide',
      hero_title: 'Cyprus Tax Benefits',
      hero_subtitle: 'Understanding the favorable tax regime',
      hero_gradient: 'from-emerald-600 to-teal-700',
      meta_title: 'Cyprus Tax Benefits for Expats | Non-Dom & 60-Day Rule',
      meta_description: 'Complete guide to Cyprus tax advantages. Non-dom status, 60-day rule, corporate tax, and tax planning for expats.',
      priority: 8,
    },
  ],
};
