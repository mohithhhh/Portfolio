import { create } from 'zustand'
import { APPS, type AppId } from '../apps-meta'
import {
  CASCADE_STEP,
  clampPosition,
  clampSize,
  workArea,
  type Bounds,
  type Viewport,
} from '../geometry'

export type WindowState = 'normal' | 'minimized' | 'maximized' | 'tiled-left' | 'tiled-right'

export type WindowPayload = {
  /** Filesystem node this window shows (file for Preview/TextEdit, folder for Finder). */
  nodeId?: string
  [key: string]: unknown
}

export type Win = {
  id: string
  appId: AppId
  title: string
  x: number
  y: number
  w: number
  h: number
  minW: number
  minH: number
  z: number
  state: WindowState
  /** State to return to when un-minimizing. */
  restoreState?: Exclude<WindowState, 'minimized'>
  prevBounds?: Bounds
  payload?: WindowPayload
  /** Screen point the window animates from (the launching icon). */
  origin?: { x: number; y: number }
}

export type OpenOptions = {
  title?: string
  payload?: WindowPayload
  origin?: { x: number; y: number }
}

type State = {
  windows: Win[]
  topZ: number
  focusedId: string | null
  /** App shown in the menu bar. Finder when the desktop is focused. */
  activeApp: AppId
  viewport: Viewport
  launching: AppId[]
  seq: number
}

type Actions = {
  open: (appId: AppId, opts?: OpenOptions) => string
  close: (id: string) => void
  quitApp: (appId: AppId) => void
  focus: (id: string) => void
  focusDesktop: () => void
  minimize: (id: string) => void
  restore: (id: string) => void
  toggleZoom: (id: string) => void
  tile: (id: string, side: 'left' | 'right') => void
  move: (id: string, x: number, y: number) => void
  resize: (id: string, b: Bounds) => void
  setViewport: (vp: Viewport) => void
  setTitle: (id: string, title: string) => void
  setPayload: (id: string, payload: WindowPayload) => void
  markLaunched: (appId: AppId) => void
  reset: () => void
}

export type WindowStore = State & Actions

const initial = (): State => ({
  windows: [],
  topZ: 10,
  focusedId: null,
  activeApp: 'finder',
  viewport: { w: 1440, h: 900 },
  launching: [],
  seq: 0,
})

const visible = (ws: Win[]) => ws.filter((w) => w.state !== 'minimized')
const topWindow = (ws: Win[]) => visible(ws).reduce<Win | undefined>((t, w) => (!t || w.z > t.z ? w : t), undefined)

function cascadePosition(existing: Win[], size: { w: number; h: number }, vp: Viewport) {
  const area = workArea(vp)
  const baseX = Math.round(area.x + (area.w - size.w) / 2 - 60)
  const baseY = Math.round(area.y + Math.max(20, (area.h - size.h) / 2 - 40))
  const open = visible(existing)
  let step = open.length % 8
  for (let tries = 0; tries < 16; tries++) {
    const x = baseX + step * CASCADE_STEP
    const y = baseY + step * CASCADE_STEP
    if (!open.some((w) => w.x === x && w.y === y)) return { x: Math.max(area.x + 8, x), y }
    step = (step + 1) % 8
  }
  return { x: baseX, y: baseY }
}

function boundsForState(state: WindowState, vp: Viewport): Bounds | undefined {
  const area = workArea(vp)
  if (state === 'maximized') return area
  if (state === 'tiled-left') return { ...area, w: Math.floor(area.w / 2) }
  if (state === 'tiled-right') return { ...area, x: area.x + Math.ceil(area.w / 2), w: Math.floor(area.w / 2) }
  return undefined
}

export const createWindowStore = () =>
  create<WindowStore>()((set, get) => {
    const update = (id: string, fn: (w: Win) => Partial<Win>) =>
      set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...fn(w) } : w)) }))

    const refocusTop = () =>
      set((s) => {
        const top = topWindow(s.windows)
        return { focusedId: top?.id ?? null, activeApp: top?.appId ?? 'finder' }
      })

    return {
      ...initial(),

      open(appId, opts = {}) {
        const s = get()
        const meta = APPS[appId]
        const nodeId = opts.payload?.nodeId
        const existing = s.windows.find(
          (w) =>
            w.appId === appId &&
            (meta.singleton || (nodeId !== undefined && w.payload?.nodeId === nodeId && appId !== 'finder')),
        )
        if (existing) {
          if (opts.payload) update(existing.id, (w) => ({ payload: { ...w.payload, ...opts.payload } }))
          if (opts.title) update(existing.id, () => ({ title: opts.title! }))
          get().focus(existing.id)
          return existing.id
        }
        const seq = s.seq + 1
        const id = `${appId}-${seq}`
        const size = clampSize({ x: 0, y: 0, ...meta.defaultSize }, meta.minSize, s.viewport)
        const pos = cascadePosition(s.windows, size, s.viewport)
        const win: Win = {
          id,
          appId,
          title: opts.title ?? meta.name,
          ...clampPosition({ ...pos, w: size.w, h: size.h }, s.viewport),
          minW: meta.minSize.w,
          minH: meta.minSize.h,
          z: s.topZ + 1,
          state: 'normal',
          payload: opts.payload,
          origin: opts.origin,
        }
        set({
          windows: [...s.windows, win],
          topZ: s.topZ + 1,
          focusedId: id,
          activeApp: appId,
          seq,
          launching: s.launching.includes(appId) ? s.launching : [...s.launching, appId],
        })
        return id
      },

      close(id) {
        set((s) => ({ windows: s.windows.filter((w) => w.id !== id) }))
        refocusTop()
      },

      quitApp(appId) {
        set((s) => ({ windows: s.windows.filter((w) => w.appId !== appId) }))
        refocusTop()
      },

      focus(id) {
        const w = get().windows.find((x) => x.id === id)
        if (!w) return
        if (w.state === 'minimized') {
          get().restore(id)
          return
        }
        set((s) => ({
          topZ: s.topZ + 1,
          focusedId: id,
          activeApp: w.appId,
          windows: s.windows.map((x) => (x.id === id ? { ...x, z: s.topZ + 1 } : x)),
        }))
      },

      focusDesktop() {
        set({ focusedId: null, activeApp: 'finder' })
      },

      minimize(id) {
        update(id, (w) => ({
          state: 'minimized',
          restoreState: w.state === 'minimized' ? w.restoreState : w.state,
        }))
        refocusTop()
      },

      restore(id) {
        set((s) => ({
          topZ: s.topZ + 1,
          focusedId: id,
          activeApp: s.windows.find((w) => w.id === id)?.appId ?? s.activeApp,
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, state: w.restoreState ?? 'normal', restoreState: undefined, z: s.topZ + 1 } : w,
          ),
        }))
      },

      toggleZoom(id) {
        const { viewport } = get()
        update(id, (w) => {
          if (w.state === 'maximized' || w.state === 'tiled-left' || w.state === 'tiled-right') {
            const b = w.prevBounds ?? { x: w.x, y: w.y, w: w.w, h: w.h }
            return { state: 'normal', ...clampPosition(b, viewport), prevBounds: undefined }
          }
          return {
            state: 'maximized',
            prevBounds: { x: w.x, y: w.y, w: w.w, h: w.h },
            ...boundsForState('maximized', viewport),
          }
        })
        get().focus(id)
      },

      tile(id, side) {
        const { viewport } = get()
        const state: WindowState = side === 'left' ? 'tiled-left' : 'tiled-right'
        update(id, (w) => ({
          state,
          prevBounds: w.state === 'normal' ? { x: w.x, y: w.y, w: w.w, h: w.h } : w.prevBounds,
          ...boundsForState(state, viewport),
        }))
        get().focus(id)
      },

      move(id, x, y) {
        const { viewport } = get()
        update(id, (w) => {
          // Dragging a zoomed or tiled window restores its previous size.
          const size = w.state !== 'normal' && w.prevBounds ? { w: w.prevBounds.w, h: w.prevBounds.h } : { w: w.w, h: w.h }
          return { state: 'normal', prevBounds: undefined, ...clampPosition({ x, y, ...size }, viewport) }
        })
      },

      resize(id, b) {
        const { viewport } = get()
        // Callers pass edge-aware bounds; the store only enforces the minimum size.
        update(id, (w) => ({
          state: 'normal',
          prevBounds: undefined,
          ...clampPosition({ x: b.x, y: b.y, w: Math.max(w.minW, b.w), h: Math.max(w.minH, b.h) }, viewport),
        }))
      },

      setViewport(vp) {
        set((s) => ({
          viewport: vp,
          windows: s.windows.map((w) => {
            const fitted = boundsForState(w.state, vp)
            if (fitted) return { ...w, ...fitted }
            return { ...w, ...clampPosition(clampSize(w, { w: w.minW, h: w.minH }, vp), vp) }
          }),
        }))
      },

      setTitle(id, title) {
        update(id, () => ({ title }))
      },

      setPayload(id, payload) {
        update(id, (w) => ({ payload: { ...w.payload, ...payload } }))
      },

      markLaunched(appId) {
        set((s) => ({ launching: s.launching.filter((a) => a !== appId) }))
      },

      reset() {
        set({ ...initial(), viewport: get().viewport })
      },
    }
  })

export const useWindows = createWindowStore()

export const selectRunningApps = (s: WindowStore): AppId[] => [...new Set(s.windows.map((w) => w.appId))]
