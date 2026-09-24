// Validates everything in content/ against the zod schemas and writes
// src/generated/documents.json (raw markdown of every document, keyed by
// its content/ path) for Spotlight, the agent prompt and /simple.
// Runs before dev, build, typecheck and tests. Fails loudly on bad content.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import {
  experienceSchema,
  fsNodeSchema,
  noteSchema,
  profileSchema,
  projectSchema,
  skillsSchema,
  type FSNode,
} from '../src/content/schema.ts'

const root = join(import.meta.dirname, '..')
const readJson = (p: string): unknown => JSON.parse(readFileSync(join(root, p), 'utf8'))
const errors: string[] = []

function check<T>(label: string, schema: z.ZodType<T>, value: unknown): T | undefined {
  const r = schema.safeParse(value)
  if (!r.success) {
    errors.push(`${label}:\n${z.prettifyError(r.error)}`)
    return undefined
  }
  return r.data
}

const profile = check('content/profile.json', profileSchema, readJson('content/profile.json'))
check('content/skills.json', skillsSchema, readJson('content/skills.json'))
const projects = check('content/projects/index.json', z.array(projectSchema), readJson('content/projects/index.json')) ?? []
const experience =
  check('content/experience/index.json', z.array(experienceSchema), readJson('content/experience/index.json')) ?? []
const notes = check('content/notes/index.json', z.array(noteSchema), readJson('content/notes/index.json')) ?? []
const tree = check('content/filesystem.json', fsNodeSchema, readJson('content/filesystem.json'))

const documents: Record<string, string> = {}
const addDoc = (path: string) => {
  if (!existsSync(join(root, path))) {
    errors.push(`missing document: ${path}`)
    return
  }
  documents[path] = readFileSync(join(root, path), 'utf8')
}
for (const p of projects) addDoc(`content/projects/${p.slug}.mdx`)
for (const e of experience) addDoc(`content/experience/${e.slug}.mdx`)
for (const n of notes) addDoc(`content/notes/${n.slug}.mdx`)

if (profile && !projects.some((p) => p.slug === profile.currentProject)) {
  errors.push(`profile.currentProject "${profile.currentProject}" is not a project slug`)
}

const ids = new Set<string>()
function walk(node: FSNode, path: string) {
  if (ids.has(node.id)) errors.push(`duplicate filesystem id: ${node.id}`)
  ids.add(node.id)
  if (node.type === 'folder') {
    for (const c of node.children) walk(c, `${path}/${c.name}`)
    return
  }
  if (node.kind === 'md') {
    if (!node.source.startsWith('content/')) errors.push(`${path}: md source must live under content/`)
    else addDoc(node.source)
  } else if (node.kind === 'pdf' || node.kind === 'image' || node.kind === 'video') {
    if (!node.source.startsWith('public/') || !existsSync(join(root, node.source))) {
      errors.push(`${path}: missing file ${node.source}`)
    }
  }
}
if (tree) walk(tree, '')

if (errors.length) {
  console.error(`Content validation failed:\n\n${errors.join('\n\n')}`)
  process.exit(1)
}

mkdirSync(join(root, 'src/generated'), { recursive: true })
writeFileSync(join(root, 'src/generated/documents.json'), JSON.stringify(documents, null, 2) + '\n')
console.log(`content ok: ${Object.keys(documents).length} documents, ${ids.size} filesystem nodes`)
