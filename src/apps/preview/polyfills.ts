// pdf.js 6 calls Map/WeakMap.prototype.getOrInsert(Computed) (TC39 "upsert"),
// which Safari and older Chromium builds don't ship yet. Minimal spec-shaped shims.
type Upsert<K, V> = {
  getOrInsert?: (key: K, value: V) => V
  getOrInsertComputed?: (key: K, cb: (key: K) => V) => V
}

for (const Ctor of [Map, WeakMap] as unknown as Array<{ prototype: Upsert<object, unknown> & Map<object, unknown> }>) {
  const proto = Ctor.prototype
  if (!proto.getOrInsert) {
    Object.defineProperty(proto, 'getOrInsert', {
      configurable: true,
      writable: true,
      value(this: Map<object, unknown>, key: object, value: unknown) {
        if (!this.has(key)) this.set(key, value)
        return this.get(key)
      },
    })
  }
  if (!proto.getOrInsertComputed) {
    Object.defineProperty(proto, 'getOrInsertComputed', {
      configurable: true,
      writable: true,
      value(this: Map<object, unknown>, key: object, cb: (key: object) => unknown) {
        if (!this.has(key)) this.set(key, cb(key))
        return this.get(key)
      },
    })
  }
}

export {}
