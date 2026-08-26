import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MenuItem } from './supabase'

interface CartItem { item: MenuItem; qty: number }

interface CartState {
  storeId: string | null
  items: CartItem[]
  add: (item: MenuItem) => void
  remove: (itemId: string) => void
  setQty: (itemId: string, qty: number) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      storeId: null,
      items: [],
      add: (item) => {
        const s = get()
        if (s.storeId && s.storeId !== item.store_id) {
          // switching stores clears the cart
          set({ storeId: item.store_id, items: [{ item, qty: 1 }] })
          return
        }
        const existing = s.items.find((i) => i.item.id === item.id)
        if (existing) {
          set({ storeId: item.store_id, items: s.items.map((i) => i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i) })
        } else {
          set({ storeId: item.store_id, items: [...s.items, { item, qty: 1 }] })
        }
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.item.id !== id) })),
      setQty: (id, qty) => set((s) => ({
        items: qty <= 0 ? s.items.filter((i) => i.item.id !== id) : s.items.map((i) => i.item.id === id ? { ...i, qty } : i),
      })),
      clear: () => set({ storeId: null, items: [] }),
    }),
    { name: 'triam-lunch-cart' },
  ),
)
