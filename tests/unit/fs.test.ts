import { describe, expect, it } from 'vitest'
import {
  back,
  canBack,
  canForward,
  completePath,
  currentOf,
  displayPath,
  forward,
  HOME_ID,
  listChildren,
  navigate,
  newHistory,
  pathOf,
  resolvePath,
  sortNodes,
} from '@/os/fs'
import { vfs } from '@/os/vfs'

describe('virtual filesystem', () => {
  it('computes absolute and display paths', () => {
    expect(pathOf(vfs, HOME_ID)).toBe('/Users/mohith')
    expect(pathOf(vfs, 'resume')).toBe('/Users/mohith/Desktop/Resume.pdf')
    expect(displayPath(vfs, 'desktop')).toBe('~/Desktop')
    expect(displayPath(vfs, HOME_ID)).toBe('~')
    expect(pathOf(vfs, 'root')).toBe('/')
  })

  it('resolves absolute, home, relative and parent paths', () => {
    expect(resolvePath(vfs, HOME_ID, 'Desktop/Resume.pdf')?.id).toBe('resume')
    expect(resolvePath(vfs, 'projects', '..')?.id).toBe(HOME_ID)
    expect(resolvePath(vfs, 'projects', '~/Desktop')?.id).toBe('desktop')
    expect(resolvePath(vfs, 'projects', '/Users/mohith/Documents/Certificates')?.id).toBe('certificates')
    expect(resolvePath(vfs, 'projects', './ArsenicCure/README.md')?.id).toBe('project-arseniccure-readme')
    expect(resolvePath(vfs, HOME_ID, 'desktop')?.id).toBe('desktop') // case-insensitive fallback
    expect(resolvePath(vfs, HOME_ID, 'Nope')).toBeUndefined()
    expect(resolvePath(vfs, HOME_ID, 'Desktop/Resume.pdf/x')).toBeUndefined()
    expect(resolvePath(vfs, 'root', '..')?.id).toBe('root')
  })

  it('hides dotfiles unless asked', () => {
    expect(listChildren(vfs, HOME_ID).some((n) => n.name === '.Trash')).toBe(false)
    expect(listChildren(vfs, HOME_ID, true).some((n) => n.name === '.Trash')).toBe(true)
  })

  it('sorts by name and by kind', () => {
    const names = sortNodes(listChildren(vfs, HOME_ID)).map((n) => n.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
    const desc = sortNodes(listChildren(vfs, HOME_ID), 'name', 'desc').map((n) => n.name)
    expect(desc).toEqual([...names].reverse())
  })

  it('tab-completes paths with escaped spaces', () => {
    expect(completePath(vfs, HOME_ID, 'Des').completed).toBe('Desktop/')
    expect(completePath(vfs, 'projects', 'Temp').completed).toBe('Temporal\\ Belief\\ Dynamics\\ in\\ BERT/')
    const ambiguous = completePath(vfs, HOME_ID, 'D')
    expect(ambiguous.candidates.length).toBeGreaterThan(1)
    expect(completePath(vfs, HOME_ID, 'zzz')).toEqual({ completed: 'zzz', candidates: [] })
  })

  it('keeps back/forward history like a browser', () => {
    let h = newHistory('home')
    h = navigate(h, 'desktop')
    h = navigate(h, 'projects')
    expect(currentOf(h)).toBe('projects')
    h = back(h)
    expect(currentOf(h)).toBe('desktop')
    expect(canForward(h)).toBe(true)
    h = navigate(h, 'documents')
    expect(canForward(h)).toBe(false)
    h = back(back(h))
    expect(currentOf(h)).toBe('home')
    expect(canBack(h)).toBe(false)
    h = forward(h)
    expect(currentOf(h)).toBe('desktop')
    expect(navigate(h, 'desktop')).toBe(h)
  })
})
