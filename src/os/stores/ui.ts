import { create } from 'zustand'
import type { ReactNode } from 'react'

export type MenuEntry =
  | { type: 'separator' }
  | {
      type?: 'item'
      label: string
      shortcut?: string
      disabled?: boolean
      checked?: boolean
      hint?: string
      action?: () => void
    }

type UiState = {
  spotlightOpen: boolean
  quickLookId: string | null
  contextMenu: { x: number; y: number; items: MenuEntry[]; label: string } | null
  switcherOpen: boolean
  switcherIndex: number
  sheet: { title: string; body: ReactNode } | null
  setSpotlight: (open: boolean) => void
  setQuickLook: (id: string | null) => void
  openContextMenu: (x: number, y: number, items: MenuEntry[], label?: string) => void
  closeContextMenu: () => void
  setSwitcher: (open: boolean, index?: number) => void
  showSheet: (sheet: UiState['sheet']) => void
}

export const useUi = create<UiState>()((set) => ({
  spotlightOpen: false,
  quickLookId: null,
  contextMenu: null,
  switcherOpen: false,
  switcherIndex: 0,
  sheet: null,
  setSpotlight: (spotlightOpen) => set({ spotlightOpen, contextMenu: null }),
  setQuickLook: (quickLookId) => set({ quickLookId }),
  openContextMenu: (x, y, items, label = 'Context menu') => set({ contextMenu: { x, y, items, label } }),
  closeContextMenu: () => set({ contextMenu: null }),
  setSwitcher: (switcherOpen, switcherIndex = 0) => set({ switcherOpen, switcherIndex }),
  showSheet: (sheet) => set({ sheet }),
}))
