import LRU from 'lru-cache'

export default {
  store: new LRU({
    max: 10000,
    ttl: 1000 * 60 * 60 * 24 * 2,
    // updateAgeOnGet: true,
  }),

  get<T = any>(key: string) {
    return this.store.get(key) as T | null
  },

  set(key: string, value: any) {
    return this.store.set(key, value)
  },

  has(key: string) {
    return this.store.has(key)
  },

  delete(key: string) {
    return this.store.delete(key)
  },

  clear() {
    this.store.clear()
  },
}
