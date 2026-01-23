import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/', '/account/', '/cart'],
      },
    ],
    sitemap: 'https://aionysus.wine/sitemap.xml',
  }
}
