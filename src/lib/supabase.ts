import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export interface Store {
  id: string
  name: string
  description: string
  location: string
  open_time: string
  close_time: string
  pickup_slots: string[]
  is_open: boolean
  image_url?: string | null
}

export interface MenuItem {
  id: string
  store_id: string
  name: string
  price_thb: number
  category: string
  description: string
  available: boolean
  daily_note: string
  image_url?: string | null
}

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'

export interface Order {
  id: string
  order_code: string
  store_id: string
  customer_name: string
  customer_phone: string
  note: string
  pickup_slot: string
  total_thb: number
  status: OrderStatus
  payment_status: 'unpaid' | 'paid'
  created_at: string
  lunch_order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string | null
  item_name: string
  unit_price_thb: number
  quantity: number
}
