// Pure Terminal command interpreter over the virtual filesystem.
// The React view (Terminal.tsx) renders its output and performs side effects
// (opening windows, asking the agent) described by the result.
import { documents, plainText, profile, projects, skills, experience } from '@/content'
import { APPS, type AppId } from '@/os/apps-meta'
import {
  displayPath,
  HOME_ID,
  isFolder,
  kindLabel,
  listChildren,
  pathOf,
  resolvePath,
  sortNodes,
  type FSIndex,
} from '@/os/fs'

export type OutLine = { text: string; tone?: 'error' | 'muted' | 'accent' | 'dir' }

export type CommandResult = {
  output: OutLine[]
  cwdId?: string
  clear?: boolean
  open?: { nodeId: string } | { appId: AppId }
  ask?: string
}

export type CommandContext = { ix: FSIndex; cwdId: string; history: string[] }

export const COMMANDS: Array<{ name: string; usage: string; help: string }> = [
  { name: 'help', usage: 'help', help: 'List commands' },
  { name: 'ls', usage: 'ls [-a] [-l] [path]', help: 'List a folder' },
  { name: 'cd', usage: 'cd [path]', help: 'Change folder (~ is home)' },
  { name: 'pwd', usage: 'pwd', help: 'Print the current folder' },
  { name: 'cat', usage: 'cat <file>', help: 'Print a document' },
  { name: 'open', usage: 'open <path> | open -a <App>', help: 'Open a file, folder or app' },
  { name: 'whoami', usage: 'whoami', help: 'Who owns this Mac' },
  { name: 'about', usage: 'about', help: 'System and owner summary' },
  { name: 'history', usage: 'history', help: 'Show previous commands' },
  { name: 'clear', usage: 'clear', help: 'Clear the screen' },
  { name: 'ask', usage: 'ask <question>', help: 'Ask the portfolio agent about my work' },
]

/** Splits a command line into words, honouring quotes and backslash-escaped spaces. */
export function tokenize(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quote: '"' | "'" | null = null
  let has = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (quote) {
      if (ch === quote) quote = null
      else cur += ch
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      has = true
    } else if (ch === '\\' && i + 1 < line.length) {
      cur += line[++i]
      has = true
    } else if (/\s/.test(ch)) {
      if (has) out.push(cur)
      cur = ''
      has = false
    } else {
      cur += ch
      has = true
    }
  }
  if (has) out.push(cur)
  return out
}

const err = (text: string): CommandResult => ({ output: [{ text, tone: 'error' }] })

function findApp(name: string): AppId | undefined {
  const n = name.toLowerCase().replace(/\.app$/, '')
  return (Object.keys(APPS) as AppId[]).find((id) => id === n || APPS[id].name.toLowerCase() === n)
}

export function neofetch(): OutLine[] {
  const art = [
    '   __  __ ____  _  __',
    '  |  \\/  |  _ \\| |/ /',
    '  | |\\/| | | | | \' / ',
    '  | |  | | |_| | . \\ ',
    '  |_|  |_|____/|_|\\_\\',
  ]
  const edu = profile.education[0]
  const info = [
    `${profile.name.toLowerCase().replace(/\s+/g, '')}@portfolio`,
    '-----------------------',
    `Role: ${profile.title}`,
    `Location: ${profile.location}`,
    edu ? `Education: ${edu.degree}, ${edu.institution}` : '',
    `Experience: ${experience.map((e) => e.company).join(', ')}`,
    `Projects: ${projects.map((p) => p.name).join(', ')}`,
    `Skills: ${skills.categories.flatMap((c) => c.items).slice(0, 8).join(', ')}…`,
    `Contact: ${profile.email}`,
  ].filter(Boolean)
  const rows = Math.max(art.length, info.length)
  const out: OutLine[] = []
  for (let i = 0; i < rows; i++) {
    out.push({ text: `${(art[i] ?? '').padEnd(24)}${info[i] ?? ''}`, tone: i < art.length ? 'accent' : undefined })
  }
  return out
}

export function runCommand(line: string, ctx: CommandContext): CommandResult {
  const trimmed = line.trim()
  if (!trimmed) return { output: [] }
  const [cmd = '', ...args] = tokenize(trimmed)
  const { ix, cwdId } = ctx

  switch (cmd) {
    case 'help':
      return {
        output: [
          { text: 'Commands:', tone: 'accent' },
          ...COMMANDS.map((c) => ({ text: `  ${c.usage.padEnd(28)}${c.help}` })),
          { text: '' },
          { text: 'Anything else is sent to the portfolio agent as a question.', tone: 'muted' },
        ],
      }
    case 'pwd':
      return { output: [{ text: pathOf(ix, cwdId) }] }
    case 'whoami':
      return { output: [{ text: `${profile.name} — ${profile.title}. ${profile.tagline}` }] }
    case 'about':
      return { output: neofetch() }
    case 'clear':
      return { output: [], clear: true }
    case 'history':
      return { output: ctx.history.map((h, i) => ({ text: `${String(i + 1).padStart(4)}  ${h}` })) }
    case 'cd': {
      const target = resolvePath(ix, cwdId, args[0] ?? '~')
      if (!target) return err(`cd: no such file or directory: ${args[0]}`)
      if (!isFolder(target)) return err(`cd: not a directory: ${args[0]}`)
      return { output: [], cwdId: target.id }
    }
    case 'ls': {
      const flags = args.filter((a) => a.startsWith('-')).join('')
      const pathArg = args.find((a) => !a.startsWith('-'))
      const target = resolvePath(ix, cwdId, pathArg ?? '.')
      if (!target) return err(`ls: ${pathArg}: No such file or directory`)
      if (!isFolder(target)) return { output: [{ text: target.name }] }
      const items = sortNodes(listChildren(ix, target.id, flags.includes('a')))
      if (items.length === 0) return { output: [] }
      if (flags.includes('l')) {
        return {
          output: items.map((n) => ({
            text: `${n.type === 'folder' ? 'd' : '-'}rw-r--r--  ${(n.type === 'file' ? (n.size ?? '—') : '—').padStart(7)}  ${
              n.type === 'file' ? n.modified : '          '
            }  ${n.name}${n.type === 'folder' ? '/' : ''}`,
            tone: n.type === 'folder' ? ('dir' as const) : undefined,
          })),
        }
      }
      return {
        output: items.map((n) => ({
          text: n.type === 'folder' ? `${n.name}/` : n.name,
          tone: n.type === 'folder' ? ('dir' as const) : undefined,
        })),
      }
    }
    case 'cat': {
      if (!args[0]) return err('usage: cat <file>')
      const target = resolvePath(ix, cwdId, args[0])
      if (!target) return err(`cat: ${args[0]}: No such file or directory`)
      if (isFolder(target)) return err(`cat: ${args[0]}: Is a directory`)
      if (target.kind === 'md') {
        const text = plainText(documents[target.source] ?? '')
        return { output: text.split('\n').map((t) => ({ text: t })) }
      }
      if (target.kind === 'link') return { output: [{ text: target.source }] }
      return {
        output: [
          { text: `cat: ${target.name}: ${kindLabel(target)} (binary). Try: open ${args[0]}`, tone: 'muted' },
        ],
      }
    }
    case 'open': {
      if (args[0] === '-a') {
        const name = args.slice(1).join(' ')
        const app = findApp(name)
        if (!app) return err(`Unable to find application named '${name}'`)
        return { output: [], open: { appId: app } }
      }
      if (!args[0]) return err('usage: open <path> | open -a <App>')
      const target = resolvePath(ix, cwdId, args[0])
      if (!target) {
        const app = findApp(args.join(' '))
        if (app) return { output: [], open: { appId: app } }
        return err(`The file ${displayPath(ix, cwdId)}/${args[0]} does not exist.`)
      }
      return { output: [], open: { nodeId: target.id } }
    }
    case 'ask': {
      const q = args.join(' ').trim()
      if (!q) return err('usage: ask <question>')
      return { output: [], ask: q }
    }
    default:
      return { output: [], ask: trimmed }
  }
}

export const promptFor = (ix: FSIndex, cwdId: string) =>
  `mohith@portfolio ${cwdId === HOME_ID ? '~' : (displayPath(ix, cwdId).split('/').pop() ?? '/') || '/'} %`

