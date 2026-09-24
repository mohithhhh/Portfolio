import type { MetadataRoute } from 'next'
import { experience, projects } from '@/content'
import { SITE_URL } from '@/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/simple`, priority: 0.9 },
    ...projects.map((p) => ({ url: `${SITE_URL}/projects/${p.slug}`, priority: 0.8 })),
    ...experience.map((e) => ({ url: `${SITE_URL}/experience/${e.slug}`, priority: 0.7 })),
  ]
}
