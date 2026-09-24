import { z } from 'zod'

export const APP_IDS = [
  'finder',
  'preview',
  'textedit',
  'notes',
  'mail',
  'terminal',
  'safari',
  'settings',
  'about',
  'activity-monitor',
  'trash',
] as const
export type AppId = (typeof APP_IDS)[number]

const isoMonth = z.string().regex(/^\d{4}-\d{2}$/, 'expected YYYY-MM')
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD')

export type FSFolder = {
  type: 'folder'
  id: string
  name: string
  children: FSNode[]
  icon?: string
}
export type FSFile = {
  type: 'file'
  id: string
  name: string
  kind: 'pdf' | 'md' | 'image' | 'video' | 'link' | 'app-shortcut'
  source: string
  opensWith: AppId
  modified: string
  size?: string
  icon?: string
}
export type FSNode = FSFolder | FSFile

export const fsFileSchema = z.object({
  type: z.literal('file'),
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['pdf', 'md', 'image', 'video', 'link', 'app-shortcut']),
  source: z.string().min(1),
  opensWith: z.enum(APP_IDS),
  modified: isoDate,
  size: z.string().optional(),
  icon: z.string().optional(),
})

export const fsNodeSchema: z.ZodType<FSNode> = z.lazy(() =>
  z.union([
    fsFileSchema,
    z.object({
      type: z.literal('folder'),
      id: z.string().min(1),
      name: z.string().min(1),
      children: z.array(fsNodeSchema),
      icon: z.string().optional(),
    }),
  ]),
)

export const profileSchema = z.object({
  name: z.string(),
  monogram: z.string().max(4),
  title: z.string(),
  headline: z.string(),
  tagline: z.string(),
  location: z.string(),
  email: z.email(),
  phone: z.string(),
  availability: z.object({ open: z.boolean(), label: z.string() }),
  currentProject: z.string(),
  links: z.array(z.object({ id: z.string(), label: z.string(), url: z.url(), handle: z.string() })),
  education: z.array(
    z.object({
      id: z.string(),
      institution: z.string(),
      location: z.string(),
      degree: z.string(),
      start: isoMonth,
      end: isoMonth,
      coursework: z.array(z.string()),
    }),
  ),
  publications: z.array(
    z.object({
      id: z.string(),
      authors: z.string(),
      title: z.string(),
      venue: z.string(),
      location: z.string(),
      publisher: z.string(),
      year: z.number().int(),
      url: z.url().nullable(),
      project: z.string().optional(),
    }),
  ),
  achievements: z.array(z.object({ id: z.string(), title: z.string(), detail: z.string() })),
})

export const skillsSchema = z.object({
  categories: z.array(z.object({ id: z.string(), label: z.string(), items: z.array(z.string()).min(1) })),
  specRows: z.array(z.object({ label: z.string(), value: z.string() })),
})

const slug = z.string().regex(/^[a-z0-9-]+$/)

export const projectSchema = z.object({
  slug,
  name: z.string(),
  kind: z.string(),
  start: isoMonth,
  end: isoMonth.nullable(),
  summary: z.string(),
  tags: z.array(z.string()),
  highlights: z.array(z.string()),
  repo: z.url().nullable(),
  demo: z.url().nullable(),
})

export const experienceSchema = z.object({
  slug,
  company: z.string(),
  role: z.string(),
  location: z.string(),
  start: isoMonth,
  end: isoMonth.nullable(),
  summary: z.string(),
  tags: z.array(z.string()),
})

export const noteSchema = z.object({
  slug,
  title: z.string(),
  folder: z.string(),
  pinned: z.boolean(),
  modified: isoDate,
})

export type Profile = z.infer<typeof profileSchema>
export type Skills = z.infer<typeof skillsSchema>
export type Project = z.infer<typeof projectSchema>
export type Experience = z.infer<typeof experienceSchema>
export type Note = z.infer<typeof noteSchema>
