# Triam Lunch 🍱

Lunch pre-order app for Triam Udom Suksa Pattanakarn School — customers order from canteen stores, pick a pickup time slot, and pay cash at the counter. No queue.

**Stack:** Vite · React 18 · TypeScript · Tailwind v4 · zustand · Supabase (real-time)

## Features
- **Customers (no login):** browse stores → menu → cart → pickup time slot → get an order code. Track order status.
- **Store owners:** register a store with a PIN, manage menu items (price/category/availability/daily note), open/close the store, live incoming-orders board (confirm → ready → paid), configure pickup slots.

## Dev
```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev
```

## DB schema
`supabase/schema.sql` — tables `lunch_stores`, `lunch_menu_items`, `lunch_orders`, `lunch_order_items` (+ RLS policies). Apply via Supabase SQL editor.
