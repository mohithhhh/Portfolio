import { beforeEach, describe, expect, it } from 'vitest'
import { createWindowStore } from '@/os/stores/windows'
import { DOCK_RESERVED, MENU_BAR_H, MIN_VISIBLE_X, TITLE_BAR_H } from '@/os/geometry'

const vp = { w: 1440, h: 900 }
let store: ReturnType<typeof createWindowStore>

beforeEach(() => {
  store = createWindowStore()
  store.getState().setViewport(vp)
})

describe('window store', () => {
  it('opens a window, focuses it and makes its app active', () => {
    const id = store.getState().open('finder')
    const s = store.getState()
    expect(s.windows).toHaveLength(1)
    expect(s.focusedId).toBe(id)
    expect(s.activeApp).toBe('finder')
    expect(s.launching).toContain('finder')
  })

  it('focuses the existing window for single-window apps', () => {
    const a = store.getState().open('notes')
    store.getState().open('finder')
    const b = store.getState().open('notes', { payload: { noteSlug: 'coursework' } })
    expect(b).toBe(a)
    expect(store.getState().windows.filter((w) => w.appId === 'notes')).toHaveLength(1)
    expect(store.getState().focusedId).toBe(a)
    expect(store.getState().windows.find((w) => w.id === a)?.payload?.noteSlug).toBe('coursework')
  })

  it('reuses a document window showing the same file, but allows many Finder windows', () => {
    const p1 = store.getState().open('preview', { payload: { nodeId: 'resume' } })
    const p2 = store.getState().open('preview', { payload: { nodeId: 'resume' } })
    expect(p2).toBe(p1)
    store.getState().open('finder', { payload: { nodeId: 'home' } })
    store.getState().open('finder', { payload: { nodeId: 'home' } })
    expect(store.getState().windows.filter((w) => w.appId === 'finder')).toHaveLength(2)
  })

  it('raises z-order on focus', () => {
    const a = store.getState().open('finder')
    const b = store.getState().open('terminal')
    expect(store.getState().windows.find((w) => w.id === b)!.z).toBeGreaterThan(store.getState().windows.find((w) => w.id === a)!.z)
    store.getState().focus(a)
    const s = store.getState()
    expect(s.windows.find((w) => w.id === a)!.z).toBeGreaterThan(s.windows.find((w) => w.id === b)!.z)
    expect(s.activeApp).toBe('finder')
  })

  it('cascades new windows instead of stacking them exactly', () => {
    const a = store.getState().open('finder')
    const b = store.getState().open('finder')
    const wa = store.getState().windows.find((w) => w.id === a)!
    const wb = store.getState().windows.find((w) => w.id === b)!
    expect([wa.x, wa.y]).not.toEqual([wb.x, wb.y])
  })

  it('minimizes, focuses the next window, and restores', () => {
    const a = store.getState().open('finder')
    const b = store.getState().open('terminal')
    store.getState().minimize(b)
    expect(store.getState().windows.find((w) => w.id === b)!.state).toBe('minimized')
    expect(store.getState().focusedId).toBe(a)
    store.getState().restore(b)
    expect(store.getState().windows.find((w) => w.id === b)!.state).toBe('normal')
    expect(store.getState().focusedId).toBe(b)
  })

  it('focusing a minimized window restores it', () => {
    const a = store.getState().open('finder')
    store.getState().minimize(a)
    store.getState().focus(a)
    expect(store.getState().windows.find((w) => w.id === a)!.state).toBe('normal')
  })

  it('toggles zoom to fill the area between menu bar and dock, and back', () => {
    const a = store.getState().open('finder')
    const before = { ...store.getState().windows[0]! }
    store.getState().toggleZoom(a)
    const z = store.getState().windows[0]!
    expect(z.state).toBe('maximized')
    expect(z.y).toBe(MENU_BAR_H)
    expect(z.w).toBe(vp.w)
    expect(z.h).toBe(vp.h - MENU_BAR_H - DOCK_RESERVED)
    store.getState().toggleZoom(a)
    const r = store.getState().windows[0]!
    expect(r.state).toBe('normal')
    expect([r.x, r.y, r.w, r.h]).toEqual([before.x, before.y, before.w, before.h])
  })

  it('clamps moves so the title bar stays below the menu bar and reachable', () => {
    const a = store.getState().open('finder')
    store.getState().move(a, -5000, -300)
    let w = store.getState().windows[0]!
    expect(w.y).toBe(MENU_BAR_H)
    expect(w.x + w.w).toBeGreaterThanOrEqual(MIN_VISIBLE_X)
    store.getState().move(a, 99999, 99999)
    w = store.getState().windows[0]!
    expect(w.x).toBeLessThanOrEqual(vp.w - MIN_VISIBLE_X)
    expect(w.y).toBeLessThanOrEqual(vp.h - TITLE_BAR_H)
  })

  it('enforces minimum size on resize', () => {
    const a = store.getState().open('finder')
    store.getState().resize(a, { x: 100, y: 100, w: 10, h: 10 })
    const w = store.getState().windows[0]!
    expect(w.w).toBe(w.minW)
    expect(w.h).toBe(w.minH)
  })

  it('tiles to the left half and restores on drag', () => {
    const a = store.getState().open('finder')
    const before = { ...store.getState().windows[0]! }
    store.getState().tile(a, 'left')
    let w = store.getState().windows[0]!
    expect(w.state).toBe('tiled-left')
    expect(w.x).toBe(0)
    expect(w.w).toBe(vp.w / 2)
    store.getState().move(a, 200, 200)
    w = store.getState().windows[0]!
    expect(w.state).toBe('normal')
    expect(w.w).toBe(before.w)
  })

  it('closing the focused window focuses the next one; quitting closes all of an app', () => {
    const a = store.getState().open('finder')
    const b = store.getState().open('terminal')
    store.getState().close(b)
    expect(store.getState().focusedId).toBe(a)
    store.getState().open('finder')
    store.getState().quitApp('finder')
    expect(store.getState().windows).toHaveLength(0)
    expect(store.getState().focusedId).toBeNull()
    expect(store.getState().activeApp).toBe('finder')
  })

  it('refits maximized windows when the viewport changes', () => {
    const a = store.getState().open('finder')
    store.getState().toggleZoom(a)
    store.getState().setViewport({ w: 1000, h: 700 })
    const w = store.getState().windows[0]!
    expect(w.w).toBe(1000)
    expect(w.h).toBe(700 - MENU_BAR_H - DOCK_RESERVED)
  })
})
