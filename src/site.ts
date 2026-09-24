import { profile } from '@/content'

/** Turns "example.com", "https://example.com/" or "" into a valid origin, or undefined. */
function toOrigin(value: string | undefined): string | undefined {
  const v = value?.trim()
  if (!v) return undefined
  try {
    return new URL(/^https?:\/\//.test(v) ? v : `https://${v}`).origin
  } catch {
    return undefined
  }
}

/**
 * Canonical site URL: NEXT_PUBLIC_SITE_URL, else Vercel's production domain,
 * else the deployment URL, else localhost. Empty or invalid values are skipped
 * so a blank env var can't break the build.
 */
export const SITE_URL =
  toOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
  toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  toOrigin(process.env.VERCEL_URL) ??
  'http://localhost:3000'

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
