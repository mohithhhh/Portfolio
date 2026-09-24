import { profile, projects } from '@/content'
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
      items: pub
        ? [
            {
              title: 'ICCIS 2025 paper',
              url: pub.url,
              subtitle: pub.url ? pub.url : 'TODO(owner): add the paper link',
              initial: 'P',
              color: '#7A4FE0',
            },
          ]
        : [],
    },
    {
      title: 'Projects',
      items: projects.map((p) => ({
        title: p.name,
        url: `${origin}/projects/${p.slug}`,
        subtitle: p.repo ?? `${origin.replace(/^https?:\/\//, '')}/projects/${p.slug}`,
        initial: p.name[0]!,
        color: '#2F9E5B',
      })),
    },
  ]
}
