-- Triam Lunch: lunch pre-order app (separate from ArmLog tables)
create extension if not exists pgcrypto;

-- Stores registered by owners
create table if not exists lunch_stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  location text default '',
  open_time text default '06:00',
  close_time text default '13:00',
  pickup_slots text[] default '{11:20,11:50,12:20}',
  pin_hash text not null,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

-- Menu items per store
create table if not exists lunch_menu_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references lunch_stores(id) on delete cascade,
  name text not null,
  price_thb numeric not null check (price_thb >= 0),
  category text default 'อาหารจานเดียว',
  description text default '',
  available boolean not null default true,
  daily_note text default '',
  created_at timestamptz not null default now()
);

-- Orders placed by customers (no auth)
create table if not exists lunch_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  store_id uuid not null references lunch_stores(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  note text default '',
  pickup_slot text not null,
  total_thb numeric not null check (total_thb >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','ready','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lunch_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references lunch_orders(id) on delete cascade,
  menu_item_id uuid references lunch_menu_items(id) on delete set null,
  item_name text not null,
  unit_price_thb numeric not null,
  quantity int not null check (quantity > 0)
);

alter table lunch_stores enable row level security;
alter table lunch_menu_items enable row level security;
alter table lunch_orders enable row level security;
alter table lunch_order_items enable row level security;

-- Public read for stores + menus; create allowed for owner registration & ordering
create policy "public read stores" on lunch_stores for select using (true);
create policy "public insert stores" on lunch_stores for insert with check (true);
create policy "public update stores" on lunch_stores for update using (true) with check (true);
create policy "public read items" on lunch_menu_items for select using (true);
create policy "public write items" on lunch_menu_items for insert with check (true);
create policy "public update items" on lunch_menu_items for update using (true) with check (true);
create policy "public delete items" on lunch_menu_items for delete using (true);
create policy "public read orders" on lunch_orders for select using (true);
create policy "public insert orders" on lunch_orders for insert with check (true);
create policy "public update orders" on lunch_orders for update using (true) with check (true);
create policy "public read order items" on lunch_order_items for select using (true);
create policy "public insert order items" on lunch_order_items for insert with check (true);
