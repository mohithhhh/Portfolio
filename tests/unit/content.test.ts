import { describe, expect, it } from 'vitest'
import { documents, experience, filesystem, formatRange, fsNodeSchema, plainText, profile, projects, skills } from '@/content'
import { buildIndex, fuzzyScore, search } from '@/os/search'
import { listChildren } from '@/os/fs'
import { vfs } from '@/os/vfs'
import { median } from '@/server/stats'

describe('content', () => {
  it('validates the filesystem schema', () => {
    expect(fsNodeSchema.safeParse(filesystem).success).toBe(true)
    expect(fsNodeSchema.safeParse({ type: 'file', id: 'x', name: 'x', kind: 'exe', source: 'a', opensWith: 'finder', modified: '2020-01-01' }).success).toBe(false)
  })

  it('has a folder and README for every project, newest-first roles, and role files', () => {
    for (const p of projects) {
      expect(vfs.byId.get(`project-${p.slug}`)?.type).toBe('folder')
      expect(documents[`content/projects/${p.slug}.mdx`]).toBeTruthy()
    }
    for (const e of experience) {
      expect(vfs.byId.get(`experience-${e.slug}-role`)?.name).toBe('role.md')
    }
    const starts = experience.map((e) => e.start)
    expect(starts).toEqual([...starts].sort().reverse())
  })

  it('puts the resume, a README and a photo on the Desktop', () => {
    const names = listChildren(vfs, 'desktop').map((n) => n.name)
    expect(names).toEqual(expect.arrayContaining(['Resume.pdf', 'README.md']))
  })

  it('carries every resume fact that the spec maps', () => {
    const all = Object.values(documents).join('\n')
    for (const fact of ['F1: 0.91', '88.33%', '3,462', '85% detection accuracy', '10 fine-tuning epochs', 'ICCIS 2025']) {
      expect(all.replace(/\*\*/g, '')).toContain(fact)
    }
    expect(profile.education[0]?.institution).toBe('PES University')
    expect(profile.publications[0]?.publisher).toBe('Springer LNCS')
    expect(profile.achievements[0]?.title).toContain('HACK-AI')
    expect(skills.categories.flatMap((c) => c.items)).toEqual(expect.arrayContaining(['Python', 'PyTorch', 'FastAPI', 'Docker', 'Wireshark']))
  })

  it('formats ranges and strips markdown', () => {
    expect(formatRange('2024-09', null)).toBe('Sep 2024 – present')
    expect(formatRange('2024-10', '2024-10')).toBe('Oct 2024')
    expect(plainText('# Hi **there** [link](http://x)')).toBe('Hi there link')
  })
})

describe('search', () => {
  const index = buildIndex(vfs)
  it('scores prefixes above subsequences', () => {
    expect(fuzzyScore('arsen', 'ArsenicCure')).toBeGreaterThan(fuzzyScore('acr', 'ArsenicCure'))
    expect(fuzzyScore('xyz', 'ArsenicCure')).toBe(0)
  })
  it('finds projects, apps and files', () => {
    expect(search(index, 'arsenic')[0]?.title).toBe('ArsenicCure')
    expect(search(index, 'termin')[0]?.title).toBe('Terminal')
    expect(search(index, 'resume').some((h) => h.title === 'Resume.pdf')).toBe(true)
    expect(search(index, 'maersk')[0]?.category).toBe('Experience')
    expect(search(index, '')).toEqual([])
  })
})

describe('stats', () => {
  it('computes medians', () => {
    expect(median([])).toBeNull()
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
  })
})
