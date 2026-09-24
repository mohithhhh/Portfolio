'use client'
// Finder logic shared by the macOS Finder window, Trash and the iOS Files app.
import { useEffect, useMemo } from 'react'
import type { FSNode } from '@/content/schema'
import { canBack, canForward, currentOf, isFolder, listChildren, sortNodes, type SortKey } from '@/os/fs'
import { useFs } from '@/os/stores/fs'
import { vfs } from '@/os/vfs'

export function useFinderLocation(key: string, initialFolder: string) {
  const initHistory = useFs((s) => s.initHistory)
  const history = useFs((s) => s.history[key])
  useEffect(() => {
    initHistory(key, initialFolder)
  }, [key, initialFolder, initHistory])
  const folderId = history ? currentOf(history) : initialFolder
  const folder = vfs.byId.get(folderId)
  return {
    folderId,
    folder: isFolder(folder) ? folder : undefined,
    canBack: history ? canBack(history) : false,
    canForward: history ? canForward(history) : false,
    go: (id: string) => useFs.getState().go(key, id),
    back: () => useFs.getState().goBack(key),
    forward: () => useFs.getState().goForward(key),
  }
}

/** Items in a folder, or name matches under the home folder when searching. */
export function useFolderItems(folderId: string, query: string, sort: SortKey, dir: 'asc' | 'desc'): FSNode[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sortNodes(listChildren(vfs, folderId), sort, dir)
    const out: FSNode[] = []
    for (const n of vfs.byId.values()) {
      if (n.id === 'root' || n.name.startsWith('.')) continue
      if (n.name.toLowerCase().includes(q)) out.push(n)
    }
    return sortNodes(out, sort, dir)
  }, [folderId, query, sort, dir])
}

export const formatDate = (iso: string) => {
  if (!iso) return '--'
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
