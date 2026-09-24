import { profile } from '@/content'

/** Canonical site URL: NEXT_PUBLIC_SITE_URL, else Vercel's production domain, else localhost. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
).replace(/\/$/, '')

export const SITE_TITLE = `${profile.name} — ${profile.headline}`
export const SITE_DESCRIPTION = `${profile.name}: ${profile.tagline}`

export function personJsonLd() {
  const edu = profile.education[0]
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    email: `mailto:${profile.email}`,
    url: SITE_URL,
    image: `${SITE_URL}/me.jpg`,
    address: { '@type': 'PostalAddress', addressLocality: 'Bangalore', addressRegion: 'Karnataka', addressCountry: 'IN' },
    sameAs: profile.links.map((l) => l.url),
    alumniOf: edu ? { '@type': 'CollegeOrUniversity', name: edu.institution } : undefined,
    knowsAbout: ['Machine Learning', 'Deep Learning', 'NLP', 'LLM', 'RAG', 'PyTorch'],
  }
}

export const jsonLdScript = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
