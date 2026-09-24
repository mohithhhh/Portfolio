import { describe, expect, it } from 'vitest'
import { runCommand, tokenize } from '@/apps/terminal/commands'
import { HOME_ID } from '@/os/fs'
import { vfs } from '@/os/vfs'

const run = (line: string, cwdId = HOME_ID) => runCommand(line, { ix: vfs, cwdId, history: [] })
const text = (line: string, cwdId?: string) => run(line, cwdId).output.map((l) => l.text).join('\n')

describe('terminal parser', () => {
  it('tokenizes quotes and escaped spaces', () => {
    expect(tokenize('cd "Temporal Belief"')).toEqual(['cd', 'Temporal Belief'])
    expect(tokenize("cat 'a b' c")).toEqual(['cat', 'a b', 'c'])
    expect(tokenize('open Desktop/Resume\\ Copy.pdf')).toEqual(['open', 'Desktop/Resume Copy.pdf'])
    expect(tokenize('  ls   -l  ')).toEqual(['ls', '-l'])
    expect(tokenize('echo ""')).toEqual(['echo', ''])
  })

  it('lists folders, with -a showing dotfiles', () => {
    expect(text('ls')).toContain('Projects/')
    expect(text('ls')).not.toContain('.Trash')
    expect(text('ls -a')).toContain('.Trash/')
    expect(text('ls Desktop')).toContain('Resume.pdf')
    expect(run('ls nope').output[0]?.tone).toBe('error')
  })

  it('changes directory and reports errors', () => {
    expect(run('cd Projects').cwdId).toBe('projects')
    expect(run('cd').cwdId).toBe(HOME_ID)
    expect(run('cd ..', 'projects').cwdId).toBe(HOME_ID)
    expect(text('cd Desktop/Resume.pdf')).toContain('not a directory')
    expect(text('cd missing')).toContain('no such file or directory')
    expect(text('pwd', 'projects')).toBe('/Users/mohith/Projects')
  })

  it('prints markdown documents with cat', () => {
    expect(text('cat Desktop/README.md')).toContain('Start here')
    expect(text('cat Projects/ArsenicCure/README.md')).toContain('88.33% test accuracy')
    expect(text('cat Desktop/Resume.pdf')).toContain('binary')
    expect(text('cat Projects')).toContain('Is a directory')
  })

  it('opens files and apps', () => {
    expect(run('open Desktop/Resume.pdf').open).toEqual({ nodeId: 'resume' })
    expect(run('open -a Notes').open).toEqual({ appId: 'notes' })
    expect(run('open -a "System Settings"').open).toEqual({ appId: 'settings' })
    expect(run('open Safari').open).toEqual({ appId: 'safari' })
    expect(text('open -a Photoshop')).toContain('Unable to find application')
  })

  it('routes questions to the agent', () => {
    expect(run('ask what do you build?').ask).toBe('what do you build?')
    expect(run('what is ArsenicCure?').ask).toBe('what is ArsenicCure?')
    expect(text('ask')).toContain('usage')
  })

  it('handles clear, help, whoami, about and history', () => {
    expect(run('clear').clear).toBe(true)
    expect(text('help')).toContain('ask <question>')
    expect(text('whoami')).toContain('Mohith D K')
    expect(text('about')).toContain('PES University')
    expect(runCommand('history', { ix: vfs, cwdId: HOME_ID, history: ['ls', 'pwd'] }).output).toHaveLength(2)
    expect(run('   ').output).toEqual([])
  })
})
