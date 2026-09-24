// Single source of truth for portfolio content. Both shells, /simple, the
// deep-link pages and the agent prompt read from here. JSON is validated
// with zod at module load, so bad content fails the build.
import { z } from 'zod'
import profileJson from '@content/profile.json'
import skillsJson from '@content/skills.json'
import projectsJson from '@content/projects/index.json'
import experienceJson from '@content/experience/index.json'
import notesJson from '@content/notes/index.json'
import filesystemJson from '@content/filesystem.json'
import documentsJson from '@/generated/documents.json'
import {
  experienceSchema,
  fsNodeSchema,
  noteSchema,
  profileSchema,
  projectSchema,
  skillsSchema,
  type FSFolder,
} from './schema'

export * from './schema'

export const profile = profileSchema.parse(profileJson)
export const skills = skillsSchema.parse(skillsJson)
export const projects = z.array(projectSchema).parse(projectsJson)
export const experience = z.array(experienceSchema).parse(experienceJson)
export const notes = z.array(noteSchema).parse(notesJson)
export const filesystem = fsNodeSchema.parse(filesystemJson) as FSFolder
/** Raw markdown of every document, keyed by its path under the repo (e.g. content/projects/x.mdx). */
export const documents: Record<string, string> = documentsJson

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return `${MONTHS[Number(m) - 1] ?? ''} ${y}`
}

export function formatRange(start: string, end: string | null): string {
  if (end === start) return formatMonth(start)
  return `${formatMonth(start)} – ${end ? formatMonth(end) : 'present'}`
}

/** Markdown/MDX to plain text, for search snippets and the agent prompt. */
export function plainText(md: string): string {
  return md
    .replace(/^import .*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\|?\s*-{3,}.*$/gm, '')
    .replace(/[*_`>#|]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug)
export const experienceBySlug = (slug: string) => experience.find((e) => e.slug === slug)
export const currentProject = projectBySlug(profile.currentProject)!
export const githubUrl = profile.links.find((l) => l.id === 'github')?.url
export const linkedinUrl = profile.links.find((l) => l.id === 'linkedin')?.url
