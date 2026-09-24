// Screen geometry shared by the window manager and the shell. Values mirror
// the tokens in src/styles/tokens.css (--menubar-h, --dock-reserved).
export const MENU_BAR_H = 24
export const DOCK_RESERVED = 78
export const TITLE_BAR_H = 28
/** Minimum horizontal strip of a window that must stay on screen. */
export const MIN_VISIBLE_X = 80
export const CASCADE_STEP = 26

export type Bounds = { x: number; y: number; w: number; h: number }
export type Viewport = { w: number; h: number }

/** The area a zoomed window fills: between the menu bar and the dock. */
export function workArea(vp: Viewport): Bounds {
  return { x: 0, y: MENU_BAR_H, w: vp.w, h: Math.max(200, vp.h - MENU_BAR_H - DOCK_RESERVED) }
}

/**
 * Keeps a window reachable: the title bar never goes above the menu bar or
 * below the bottom edge, and at least MIN_VISIBLE_X px stay on screen.
 */
export function clampPosition(b: Bounds, vp: Viewport): Bounds {
  const x = Math.min(Math.max(b.x, MIN_VISIBLE_X - b.w), vp.w - MIN_VISIBLE_X)
  const y = Math.min(Math.max(b.y, MENU_BAR_H), vp.h - TITLE_BAR_H)
  return { ...b, x, y }
}

/** Fits a size into the viewport, respecting the minimum size. */
export function clampSize(b: Bounds, min: { w: number; h: number }, vp: Viewport): Bounds {
  const area = workArea(vp)
  return {
    ...b,
    w: Math.max(min.w, Math.min(b.w, area.w)),
    h: Math.max(min.h, Math.min(b.h, area.h)),
  }
}
