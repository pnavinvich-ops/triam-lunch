import { useEffect, useState } from 'react'
import { ChevronLeft, CheckCircle2, ChefHat, ClipboardList, Plus, Store as StoreIcon, Package } from 'lucide-react'
import { supabase, type Order, type Store, type MenuItem } from '../lib/supabase'

const KEY = 'tl_owner_store'

export default function OwnerHome({ onBackHome }: { onBackHome: () => void }) {
  const [store, setStore] = useState<Store | null>(null)
  const [mode, setMode] = useState<'ask' | 'login' | 'register' | 'dash'>('ask')

  useEffect(() => {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      supabase.from('lunch_stores').select('*').eq('id', saved).single().then(({ data }) => {
        if (data) { setStore(data); setMode('dash') } else setMode('ask')
      })
    }
  }, [])

  if (store && mode === 'dash') return <OwnerDash store={store} onLogout={() => { localStorage.removeItem(KEY); setStore(null); setMode('ask') }} onStore={setStore} />

  return (
    <div className="fade-in min-h-dvh">
      <header className="bg-white px-4 pb-4 pt-3">
        <button onClick={onBackHome} className="-ml-1 flex items-center gap-1 py-1 pr-2 text-[15px] font-medium text-neutral-600">
          <ChevronLeft size={20} /> กลับ
        </button>
        <h1 className="mt-1 text-xl font-bold tracking-tight">สำหรับร้านค้า</h1>
        <p className="mt-0.5 text-sm text-neutral-500">จัดการเมนูและออเดอร์ของร้านคุณ</p>
      </header>

      {mode === 'ask' && (
        <div className="grid grid-cols-2 gap-2.5 p-4">
          <button onClick={() => setMode('login')} className="card-pop flex flex-col gap-2 rounded-xl bg-white p-5 text-left ring-1 ring-neutral-200/70">
            <StoreIcon size={22} className="text-orange-600" />
            <span className="text-sm font-semibold">เข้าสู่ระบบ</span>
            <span className="text-xs leading-snug text-neutral-400">มีร้านอยู่แล้ว</span>
          </button>
          <button onClick={() => setMode('register')} className="card-pop flex flex-col gap-2 rounded-xl bg-white p-5 text-left ring-1 ring-neutral-200/70">
            <ClipboardList size={22} className="text-orange-600" />
            <span className="text-sm font-semibold">สมัครร้านใหม่</span>
            <span className="text-xs leading-snug text-neutral-400">ฟรี ใช้เวลาไม่ถึงนาที</span>
          </button>
        </div>
      )}

      {(mode === 'login' || mode === 'register') && (
        <div className="px-4 pt-1">
          <div className="rounded-xl bg-white p-5 ring-1 ring-neutral-200/70">
            {mode === 'login' ? <Login onCancel={() => setMode('ask')} onDone={(s) => { localStorage.setItem(KEY, s.id); setStore(s); setMode('dash') }} /> : <Register onCancel={() => setMode('ask')} />}
          </div>
        </div>
      )}
    </div>
  )
}

const input = 'w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100'

function Login({ onDone, onCancel }: { onDone: (s: Store) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const go = async () => {
    setErr('')
    const { data: store } = await supabase.from('lunch_stores').select('*').ilike('name', name.trim()).maybeSingle()
    if (!store) { setErr('ไม่พบชื่อร้านนี้'); return }
    const hash = await sha256(pin + store.id)
    const ok = await supabase.from('lunch_stores').select('id').eq('id', store.id).eq('pin_hash', hash).maybeSingle()
    if (!ok.data) { setErr('PIN ไม่ถูกต้อง'); return }
    onDone(store)
  }
  return (
    <div className="grid gap-2.5">
      <h2 className="mb-1 text-base font-bold">เข้าสู่ระบบร้าน</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อร้าน" className={input} />
      <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="PIN ของร้าน" type="password" inputMode="numeric" className={`${input} tracking-[0.35em]`} />
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">{err}</p>}
      <button onClick={go} className="card-pop mt-1 rounded-xl bg-orange-600 py-3 text-[15px] font-semibold text-white">เข้าสู่ระบบ</button>
      <button onClick={onCancel} className="py-1 text-sm font-medium text-neutral-400">ยกเลิก</button>
    </div>
  )
}

function Register({ onCancel }: { onCancel: () => void }) {
  const [f, setF] = useState({ name: '', description: '', location: '', pin: '', open_time: '06:00', close_time: '13:00' })
  const [busy, setBusy] = useState(false)
  const go = async () => {
    if (!f.name.trim() || f.pin.length < 4) { alert('ต้องมีชื่อร้าน และ PIN อย่างน้อย 4 หลัก'); return }
    setBusy(true)
    const tmpId = crypto.randomUUID()
    const pin_hash = await sha256(f.pin + tmpId)
    const { data, error } = await supabase.from('lunch_stores').insert({
      id: tmpId, name: f.name.trim(), description: f.description.trim(), location: f.location.trim(),
      open_time: f.open_time, close_time: f.close_time, pin_hash,
    }).select().single()
    if (error) { alert('สมัครไม่สำเร็จ: ' + error.message); setBusy(false); return }
    localStorage.setItem(KEY, data.id)
    location.reload()
  }
  return (
    <div className="grid gap-2.5">
      <h2 className="mb-1 text-base font-bold">สมัครร้านใหม่</h2>
      <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="ชื่อร้าน" className={input} />
      <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="คำอธิบายสั้น ๆ เช่น ข้าวราดแกง" className={input} />
      <input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="ตำแหน่ง เช่น ตึก A ชั้น 1" className={input} />
      <div className="grid grid-cols-2 gap-2">
        <input value={f.open_time} onChange={(e) => setF({ ...f, open_time: e.target.value })} placeholder="เปิด 06:00" className={input} />
        <input value={f.close_time} onChange={(e) => setF({ ...f, close_time: e.target.value })} placeholder="ปิด 13:00" className={input} />
      </div>
      <input value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '') })} placeholder="ตั้ง PIN (ตัวเลข 4 หลักขึ้นไป)" type="password" inputMode="numeric" className={`${input} tracking-[0.35em]`} />
      <button onClick={go} disabled={busy} className="card-pop mt-1 rounded-xl bg-orange-600 py-3 text-[15px] font-semibold text-white disabled:opacity-50">
        {busy ? 'กำลังสร้าง…' : 'สร้างร้าน'}
      </button>
      <button onClick={onCancel} className="py-1 text-sm font-medium text-neutral-400">ยกเลิก</button>
    </div>
  )
}

function OwnerDash({ store, onLogout, onStore }: { store: Store; onLogout: () => void; onStore: (s: Store) => void }) {
  const [tab, setTab] = useState<'orders' | 'menu' | 'settings'>('orders')
  const [pending, setPending] = useState(0)

  const toggleOpen = async () => {
    const { data } = await supabase.from('lunch_stores').update({ is_open: !store.is_open }).eq('id', store.id).select().single()
    if (data) onStore(data)
  }

  return (
    <div className="fade-in min-h-dvh pb-24">
      <header className="bg-white px-4 pb-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">{store.name}</h1>
            <p className="text-xs text-neutral-400">โหมดร้านค้า</p>
          </div>
          <button onClick={onLogout} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500">ออกจากระบบ</button>
        </div>
        <button onClick={toggleOpen}
          className={`card-pop mt-3 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left ${store.is_open ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-neutral-100'}`}>
          <span>
            <span className={`block text-sm font-bold ${store.is_open ? 'text-emerald-700' : 'text-neutral-500'}`}>
              {store.is_open ? 'ร้านเปิดรับออเดอร์' : 'ร้านปิดรับออเดอร์'}
            </span>
            <span className={`text-xs ${store.is_open ? 'text-emerald-600' : 'text-neutral-400'}`}>กดเพื่อ{store.is_open ? 'ปิด' : 'เปิด'}รับออเดอร์</span>
          </span>
          {/* iOS-style switch */}
          <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${store.is_open ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${store.is_open ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </button>
      </header>

      <div className="px-4 pt-3">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
          {([['orders', 'ออเดอร์'], ['menu', 'เมนู'], ['settings', 'ตั้งค่า']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`relative rounded-lg py-2 text-[13px] font-semibold transition ${tab === k ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}>
              {label}
              {k === 'orders' && pending > 0 && (
                <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">{pending}</span>
              )}
            </button>
          ))}
        </div>

        <div className="pt-3.5">
          {tab === 'orders' && <OrdersBoard storeId={store.id} onPendingChange={setPending} />}
          {tab === 'menu' && <MenuManager storeId={store.id} />}
          {tab === 'settings' && <Settings store={store} onStore={onStore} />}
        </div>
      </div>
    </div>
  )
}

function OrdersBoard({ storeId, onPendingChange }: { storeId: string; onPendingChange: (n: number) => void }) {
  interface OI { id: string; item_name: string; quantity: number; unit_price_thb: number }
  interface Ord extends Omit<Order, 'lunch_order_items'> { lunch_order_items?: OI[] }
  const [orders, setOrders] = useState<Ord[]>([])
  const load = () =>
    supabase.from('lunch_orders').select('*, lunch_order_items(*)').eq('store_id', storeId)
      .in('status', ['pending', 'confirmed', 'ready']).order('created_at', { ascending: true })
      .then(({ data }) => {
        const list = (data ?? []) as Ord[]
        setOrders(list)
        onPendingChange(list.filter((o) => o.status === 'pending').length)
      })

  useEffect(() => {
    load()
    const ch = supabase.channel(`orders-${storeId}`).on(
      'postgres_changes', { event: '*', schema: 'public', table: 'lunch_orders', filter: `store_id=eq.${storeId}` },
      () => load(),
    ).subscribe()
    const iv = setInterval(load, 15000)
    return () => { supabase.removeChannel(ch); clearInterval(iv) }
  }, [storeId])

  const setStatus = async (o: Ord, status: Order['status']) => {
    await supabase.from('lunch_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', o.id)
    load()
  }

  if (orders.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
        <ChefHat size={30} className="mx-auto text-neutral-300" />
        <p className="mt-2 text-sm font-medium">ไม่มีออเดอร์ที่รออยู่</p>
        <p className="mt-1 text-xs text-neutral-400">ออเดอร์ใหม่จะแสดงทันทีเมื่อลูกค้าสั่ง</p>
      </div>
    )

  const STEPS: Record<string, { label: string; next?: Order['status']; nextLabel?: string }> = {
    pending: { label: 'รอยืนยัน', next: 'confirmed', nextLabel: 'ยืนยันออเดอร์' },
    confirmed: { label: 'กำลังเตรียม', next: 'ready', nextLabel: 'พร้อมรับแล้ว' },
    ready: { label: 'พร้อมรับ', next: 'completed', nextLabel: 'ลูกค้ารับแล้ว' },
  }

  return (
    <div className="grid gap-3">
      {orders.map((o) => {
        const step = STEPS[o.status]
        return (
          <div key={o.id} className="overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200/70">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2.5">
              <span className="font-mono text-[13px] font-bold tracking-wider">{o.order_code}</span>
              <span className={`ml-auto text-xs font-semibold ${o.status === 'pending' ? 'text-amber-600' : o.status === 'confirmed' ? 'text-blue-600' : 'text-emerald-600'}`}>{step.label}</span>
              <span className="text-xs tabular-nums text-neutral-400">{o.pickup_slot}</span>
            </div>
            <div className="px-4 py-3">
              <ul className="divide-y divide-neutral-100">
                {(o.lunch_order_items ?? []).map((i) => (
                  <li key={i.id} className="flex justify-between py-1 text-sm">
                    <span>{i.item_name} <span className="font-medium text-neutral-400">×{i.quantity}</span></span>
                    <span className="tabular-nums">฿{(i.quantity * Number(i.unit_price_thb)).toFixed(0)}</span>
                  </li>
                ))}
              </ul>
              {o.note && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">หมายเหตุ: {o.note}</p>}
              <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-neutral-200 pt-2.5 text-sm">
                <span className="text-neutral-400">{o.customer_name} · {o.customer_phone.slice(-4)}</span>
                <b className="tabular-nums">฿{Number(o.total_thb).toFixed(0)}</b>
              </div>
              <div className="mt-3 grid grid-cols-[2fr_1fr] gap-2">
                {step.next
                  ? <button onClick={() => setStatus(o, step.next!)} className="card-pop col-span-2 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white">{step.nextLabel}</button>
                  : null}
                {o.status !== 'completed' && (
                  <button onClick={() => setStatus(o, 'cancelled')} className="col-span-full rounded-lg py-2 text-xs font-medium text-neutral-400">ยกเลิกออเดอร์นี้</button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MenuManager({ storeId }: { storeId: string }) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [f, setF] = useState({ name: '', price_thb: '', category: 'อาหารจานเดียว', description: '', daily_note: '' })
  const load = () => supabase.from('lunch_menu_items').select('*').eq('store_id', storeId).order('created_at').then(({ data }) => setItems(data ?? []))
  useEffect(() => { load() }, [storeId])

  const add = async () => {
    if (!f.name.trim() || !Number(f.price_thb)) { alert('ต้องมีชื่อและราคา'); return }
    await supabase.from('lunch_menu_items').insert({ store_id: storeId, name: f.name.trim(), price_thb: Number(f.price_thb), category: f.category, description: f.description.trim(), daily_note: f.daily_note.trim() })
    setF({ name: '', price_thb: '', category: f.category, description: '', daily_note: '' })
    setShowAdd(false)
    load()
  }
  const toggle = async (it: MenuItem) => { await supabase.from('lunch_menu_items').update({ available: !it.available }).eq('id', it.id); load() }
  const del = async (id: string) => { if (confirm('ลบรายการนี้?')) { await supabase.from('lunch_menu_items').delete().eq('id', id); load() } }

  return (
    <div>
      {!showAdd && (
        <button onClick={() => setShowAdd(true)} className="card-pop mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white py-3.5 text-sm font-semibold text-orange-600">
          <Plus size={16} /> เพิ่มเมนูใหม่
        </button>
      )}
      {showAdd && (
        <div className="mb-3 grid gap-2.5 rounded-xl bg-white p-4 ring-1 ring-neutral-200/70">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="ชื่อเมนู" className={input} />
          <div className="grid grid-cols-2 gap-2">
            <input value={f.price_thb} onChange={(e) => setF({ ...f, price_thb: e.target.value.replace(/\D/g, '') })} placeholder="ราคา (฿)" inputMode="numeric" className={input} />
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={input}>
              {['อาหารจานเดียว', 'ตำ/ยำ', 'ของทอด', 'น้ำ/เครื่องดื่ม', 'ของหวาน', 'อื่น ๆ'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <input value={f.daily_note} onChange={(e) => setF({ ...f, daily_note: e.target.value })} placeholder="โน้ตประจำวัน (ไม่บังคับ)" className={input} />
          <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="คำอธิบาย (ไม่บังคับ)" className={input} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowAdd(false)} className="rounded-lg bg-neutral-100 py-2.5 text-sm font-semibold text-neutral-500">ยกเลิก</button>
            <button onClick={add} className="card-pop rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white">บันทึกเมนู</button>
          </div>
        </div>
      )}

      <div className="grid overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200/70">
        {items.map((it, idx) => (
          <div key={it.id} className={`flex items-center gap-3 p-3.5 ${idx > 0 ? 'border-t border-neutral-100' : ''} ${!it.available ? 'opacity-45' : ''}`}>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-sm font-medium">{it.name}</b>
              <p className="text-sm font-semibold tabular-nums text-neutral-700">฿{Number(it.price_thb).toFixed(0)}</p>
              {it.daily_note && <p className="truncate text-xs text-orange-600">{it.daily_note}</p>}
            </div>
            <button onClick={() => toggle(it)} className={`chip ${it.available ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-400'}`}>{it.available ? 'มีของ' : 'หมด'}</button>
            <button onClick={() => del(it.id)} className="p-1 text-neutral-300 hover:text-red-500" aria-label="ลบ">✕</button>
          </div>
        ))}
        {items.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">ยังไม่มีเมนู</p>}
      </div>
    </div>
  )
}

function Settings({ store, onStore }: { store: Store; onStore: (s: Store) => void }) {
  const [slots, setSlots] = useState((store.pickup_slots ?? []).join(', '))
  const [saved, setSaved] = useState(false)
  const save = async () => {
    const clean = slots.split(',').map((x) => x.trim()).filter(Boolean)
    const { data } = await supabase.from('lunch_stores').update({ pickup_slots: clean }).eq('id', store.id).select().single()
    if (data) { onStore(data); setSaved(true); setTimeout(() => setSaved(false), 1500) }
  }
  return (
    <div className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-neutral-200/70">
      <label className="text-[13px] font-bold">เวลารับที่เปิดให้จอง <span className="font-normal text-neutral-400">(คั่นด้วย ,)</span></label>
      <input value={slots} onChange={(e) => setSlots(e.target.value)} className={input} />
      <button onClick={save} className={`card-pop rounded-lg py-3 text-sm font-semibold text-white transition ${saved ? 'bg-emerald-600' : 'bg-orange-600'}`}>
        {saved ? 'บันทึกแล้ว ✓' : 'บันทึก'}
      </button>
      <div className="rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-500">
        📍 {store.location || '—'}<br />🕐 เปิด {store.open_time}–{store.close_time}
      </div>
    </div>
  )
}

export function TrackOrderView() {
  const mine = JSON.parse(localStorage.getItem('tl_my_orders') ?? '[]') as { code: string; at: number }[]
  const [results, setResults] = useState<Order[]>([])
  useEffect(() => {
    if (mine.length)
      supabase.from('lunch_orders').select('*, lunch_order_items(*)').in('order_code', mine.map((m) => m.code))
        .order('created_at', { ascending: false })
        .then(({ data }) => setResults(data ?? []))
  }, [])
  const STATUS = { pending: ['รอยืนยัน', 'text-amber-600 bg-amber-50'], confirmed: ['กำลังเตรียม', 'text-blue-600 bg-blue-50'], ready: ['พร้อมรับ', 'text-emerald-600 bg-emerald-50'], completed: ['สำเร็จ', 'text-neutral-500 bg-neutral-100'], cancelled: ['ยกเลิก', 'text-red-500 bg-red-50'] } as const

  return (
    <div className="fade-in min-h-dvh">
      <header className="bg-white px-4 pb-4 pt-6">
        <h1 className="text-[22px] font-bold tracking-tight">คำสั่งซื้อของฉัน</h1>
        <p className="mt-0.5 text-sm text-neutral-500">ติดตามสถานะแบบเรียลไทม์</p>
      </header>
      <div className="px-4 pt-4">
        {mine.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <ReceiptIcon size={30} className="mx-auto text-neutral-300" />
            <p className="mt-2 text-sm font-medium">ยังไม่มีคำสั่งซื้อ</p>
            <p className="mt-1 text-xs text-neutral-400">อุปกรณ์นี้ยังไม่เคยสั่งอาหาร</p>
          </div>
        )}
        <div className="grid gap-2.5">
          {results.map((o) => {
            const [label, cls] = STATUS[o.status]
            return (
              <div key={o.id} className="overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200/70">
                <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2.5">
                  <span className="font-mono text-[13px] font-bold tracking-wider">{o.order_code}</span>
                  <span className={`ml-auto rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
                </div>
                <div className="px-4 py-3">
                  <ul className="space-y-1 text-sm">
                    {(o.lunch_order_items ?? []).map((i) => (
                      <li key={i.id} className="flex justify-between"><span>{i.item_name} <span className="text-neutral-400">×{i.quantity}</span></span><span className="tabular-nums">฿{(i.quantity * Number(i.unit_price_thb)).toFixed(0)}</span></li>
                    ))}
                  </ul>
                  <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-[13px] text-neutral-500">
                    <span>รับ {o.pickup_slot} น.</span><b className="text-neutral-900 tabular-nums">฿{Number(o.total_thb).toFixed(0)}</b>
                  </div>
                  {o.status === 'ready' && (
                    <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={14} /> พร้อมแล้ว — ไปรับที่ร้านได้เลย
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
function ReceiptIcon(props: { size?: number; className?: string }) { return <Package {...props} /> }

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
