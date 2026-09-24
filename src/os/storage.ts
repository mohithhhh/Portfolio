import type { StateStorage } from 'zustand/middleware'

/** localStorage that never throws (private mode, blocked storage, SSR). */
export const safeStorage: StateStorage = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem(name, value) {
    try {
      window.localStorage.setItem(name, value)
    } catch {
      /* ignore */
    }
  },
  removeItem(name) {
    try {
      window.localStorage.removeItem(name)
    } catch {
      /* ignore */
    }
  },
}

export function sessionFlag(key: string, value?: boolean): boolean {
  try {
    if (value !== undefined) {
      if (value) window.sessionStorage.setItem(key, '1')
      else window.sessionStorage.removeItem(key)
    }
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}
