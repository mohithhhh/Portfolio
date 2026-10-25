import { openSource, profile, projects } from '@/content'
import { brandOf, type Brand } from '@/ui/BrandIcon'

export type Bookmark = { title: string; url: string | null; subtitle: string; initial: string; color: string; brand?: Brand }

/** Safari start page, built from profile.json and projects (no invented links). */
export function bookmarkSections(origin: string): Array<{ title: string; items: Bookmark[] }> {
  const pub = profile.publications[0]
  return [
    {
      title: 'Favorites',
      items: [
        ...profile.links.map((l) => ({
          title: l.label,
          url: l.url,
          subtitle: l.url.replace(/^https?:\/\/(www\.)?/, ''),
          initial: l.label[0]!,
          color: '#FFFFFF',
          brand: brandOf(l.id),
        })),
        {
          title: 'Email',
          url: `mailto:${profile.email}`,
          subtitle: profile.email,
          initial: '@',
          color: '#1A73E8',
        },
        { title: 'Resume', url: `${origin}/Resume.pdf`, subtitle: 'Resume.pdf', initial: 'R', color: '#E0342B' },
      ],
    },
    {
      title: 'Writing',
      // Shown only once the paper has a link (profile.publications[0].url);
      // the Writing section is hidden while it's empty.
      items: pub?.url
        ? [{ title: 'ICCIS 2025 paper', url: pub.url, subtitle: pub.url, initial: 'P', color: '#7A4FE0' }]
        : [],
    },
    {
      title: 'Projects',
      items: projects.map((p) => {
        const url = p.demo ?? p.repo ?? `${origin}/projects/${p.slug}`
        return { title: p.name, url, subtitle: url.replace(/^https?:\/\//, ''), initial: p.name[0]!, color: '#2F9E5B' }
      }),
    },
    {
      title: 'Code',
      items: projects
        .filter((p) => p.repo)
        .map((p) => ({
          title: p.name,
          url: p.repo,
          subtitle: p.repo!.replace(/^https?:\/\/(www\.)?github\.com\//, ''),
          initial: p.name[0]!,
          color: '#FFFFFF',
          brand: 'github' as const,
        })),
    },
    {
      title: 'Open Source',
      items: openSource.map((o) => ({
        title: `${o.project} PR`,
        url: o.url,
        subtitle: o.url.replace(/^https?:\/\/(www\.)?github\.com\//, ''),
        initial: o.project[0]!.toUpperCase(),
        color: '#FFFFFF',
        brand: 'github' as const,
      })),
    },
  ]
}
