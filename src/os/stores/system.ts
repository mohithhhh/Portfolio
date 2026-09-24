import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from '../storage'
import { THEME_KEY } from '../keys'

export type Theme = 'light' | 'dark' | 'auto'
export type Transparency = 'glass' | 'frosted'
export type MotionPref = 'system' | 'reduce'
export type Shell = 'macos' | 'ios'
export const WALLPAPERS = [
  { id: 'tide', name: 'Tide' },
  { id: 'dune', name: 'Dune' },
  { id: 'grove', name: 'Grove' },
] as const
export type WallpaperId = (typeof WALLPAPERS)[number]['id']

type SystemState = {
  theme: Theme
  wallpaper: WallpaperId
  transparency: Transparency
  motion: MotionPref
  /** Desktop icon positions keyed by filesystem id (persisted). */
  iconPositions: Record<string, { x: number; y: number }>
  /** Set when the frame-rate watchdog forces the frosted fallback. */
  autoFrosted: boolean
  booted: boolean
  shell: Shell | null
  trashEmptied: boolean
  setTheme: (t: Theme) => void
  setWallpaper: (w: WallpaperId) => void
  setTransparency: (t: Transparency) => void
  setMotion: (m: MotionPref) => void
  setIconPosition: (id: string, p: { x: number; y: number }) => void
  resetIconPositions: () => void
  setAutoFrosted: (v: boolean) => void
  setBooted: (v: boolean) => void
  setShell: (s: Shell) => void
  setTrashEmptied: (v: boolean) => void
}


export const useSystem = create<SystemState>()(
  persist(
    (set) => ({
      theme: 'auto',
      wallpaper: 'tide',
      transparency: 'glass',
      motion: 'system',
      iconPositions: {},
      autoFrosted: false,
      booted: false,
      shell: null,
      trashEmptied: false,
      setTheme: (theme) => set({ theme }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setTransparency: (transparency) => set({ transparency }),
      setMotion: (motion) => set({ motion }),
      setIconPosition: (id, p) => set((s) => ({ iconPositions: { ...s.iconPositions, [id]: p } })),
      resetIconPositions: () => set({ iconPositions: {} }),
      setAutoFrosted: (autoFrosted) => set({ autoFrosted }),
      setBooted: (booted) => set({ booted }),
      setShell: (shell) => set({ shell }),
      setTrashEmptied: (trashEmptied) => set({ trashEmptied }),
    }),
    {
      name: THEME_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // Open windows are never persisted: each visit starts from a clean boot.
      partialize: (s) => ({
        theme: s.theme,
        wallpaper: s.wallpaper,
        transparency: s.transparency,
        motion: s.motion,
        iconPositions: s.iconPositions,
      }),
    },
  ),
)
