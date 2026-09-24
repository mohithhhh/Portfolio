import { create } from 'zustand'
import { back, forward, navigate, newHistory, type NavHistory } from '../fs'

type FsState = {
  /** Selected node ids per surface ("desktop", or a window id). */
  selection: Record<string, string[]>
  /** Back/forward stacks per Finder window. */
  history: Record<string, NavHistory>
  select: (surface: string, ids: string[]) => void
  initHistory: (winId: string, folderId: string) => void
  go: (winId: string, folderId: string) => void
  goBack: (winId: string) => void
  goForward: (winId: string) => void
  drop: (winId: string) => void
}

export const useFs = create<FsState>()((set) => ({
  selection: {},
  history: {},
  select: (surface, ids) => set((s) => ({ selection: { ...s.selection, [surface]: ids } })),
  initHistory: (winId, folderId) =>
    set((s) => (s.history[winId] ? s : { history: { ...s.history, [winId]: newHistory(folderId) } })),
  go: (winId, folderId) =>
    set((s) => ({
      history: { ...s.history, [winId]: navigate(s.history[winId] ?? newHistory(folderId), folderId) },
      selection: { ...s.selection, [winId]: [] },
    })),
  goBack: (winId) => set((s) => (s.history[winId] ? { history: { ...s.history, [winId]: back(s.history[winId]) } } : s)),
  goForward: (winId) =>
    set((s) => (s.history[winId] ? { history: { ...s.history, [winId]: forward(s.history[winId]) } } : s)),
  drop: (winId) =>
    set((s) => {
      const history = { ...s.history }
      const selection = { ...s.selection }
      delete history[winId]
      delete selection[winId]
      return { history, selection }
    }),
}))
