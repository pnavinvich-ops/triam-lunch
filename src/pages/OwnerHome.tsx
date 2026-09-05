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

  if (store && mode === 'dash') return <OwnerDash store={store} onLogout={() => { localStorage.removeItem(KEY); setStore(null); setMode('ask') }} onStore={setStore} onHome={onBackHome} />

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-white px-4 pb-4 pt-3">
        <button onClick={onBackHome} className="pressable -ml-1 flex min-h-[44px] items-center gap-1 py-1 pr-2 text-[15px] font-medium text-[var(--color-text-2)] transition active:scale-[0.97]">
          <ChevronLeft size={18} strokeWidth={1.8} /> กลับ
        </button>
        <h1 className="text-display mt-1">สำหรับร้านค้า</h1>
        <p className="mt-0.5 text-sm text-[var(--color-text-2)]">จัดการเมนูและออเดอร์ของร้านคุณ</p>
      </header>

      {mode === 'ask' && (
        <div className="grid grid-cols-2 gap-2.5 p-4">
          <button onClick={() => setMode('login')} className="pressable flex flex-col gap-2 rounded-[16px] border border-[var(--color-border)] bg-white p-5 text-left card-shadow transition active:scale-[0.97]">
            <StoreIcon size={20} strokeWidth={1.8} className="text-[#111827]" />
            <span className="text-sm font-semibold">เข้าสู่ระบบ</span>
            <span className="text-xs leading-snug text-[var(--color-text-2)]">มีร้านอยู่แล้ว</span>
          </button>
          <button onClick={() => setMode('register')} className="pressable flex flex-col gap-2 rounded-[16px] border border-[var(--color-border)] bg-white p-5 text-left card-shadow transition active:scale-[0.97]">
            <ClipboardList size={20} strokeWidth={1.8} className="text-[#111827]" />
            <span className="text-sm font-semibold">สมัครร้านใหม่</span>
            <span className="text-xs leading-snug text-[var(--color-text-2)]">ฟรี ใช้เวลาไม่ถึงนาที</span>
          </button>
        </div>
      )}

      {(mode === 'login' || mode === 'register') && (
        <div className="px-4 pt-4">
          <div className="rounded-[16px] border border-[var(--color-border)] bg-white p-5 card-shadow">
            {mode === 'login' ? <Login onCancel={() => setMode('ask')} onDone={(s) => { localStorage.setItem(KEY, s.id); setStore(s); setMode('dash') }} /> : <Register onCancel={() => setMode('ask')} />}
          </div>
        </div>
      )}
    </div>
  )
}

const input = 'w-full rounded-[12px] border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-border)] placeholder:text-[var(--color-text-3)]'

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
      <h2 className="mb-1 text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>เข้าสู่ระบบร้าน</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อร้าน" className={input} />
      <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="PIN ของร้าน" type="password" inputMode="numeric" className={`${input} tracking-[0.35em]`} />
      {err && <p className="rounded-[12px] bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">{err}</p>}
      <button onClick={go} className="pressable mt-1 min-h-[44px] rounded-[12px] bg-[#111827] py-3 text-[15px] font-semibold text-white transition active:scale-[0.97]">เข้าสู่ระบบ</button>
      <button onClick={onCancel} className="pressable min-h-[44px] py-2 text-sm font-medium text-[var(--color-text-2)] transition active:scale-[0.97]">ยกเลิก</button>
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
      <h2 className="mb-1 text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>สมัครร้านใหม่</h2>
      <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="ชื่อร้าน" className={input} />
      <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="คำอธิบายสั้น ๆ เช่น ข้าวราดแกง" className={input} />
      <input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="ตำแหน่ง เช่น ตึก A ชั้น 1" className={input} />
      <div className="grid grid-cols-2 gap-2">
        <input value={f.open_time} onChange={(e) => setF({ ...f, open_time: e.target.value })} placeholder="เปิด 06:00" className={input} />
        <input value={f.close_time} onChange={(e) => setF({ ...f, close_time: e.target.value })} placeholder="ปิด 13:00" className={input} />
      </div>
      <input value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '') })} placeholder="ตั้ง PIN (ตัวเลข 4 หลักขึ้นไป)" type="password" inputMode="numeric" className={`${input} tracking-[0.35em]`} />
      <button onClick={go} disabled={busy} className="pressable mt-1 min-h-[44px] rounded-[12px] bg-[#111827] py-3 text-[15px] font-semibold text-white transition active:scale-[0.97] disabled:opacity-50">
        {busy ? 'กำลังสร้าง…' : 'สร้างร้าน'}
      </button>
      <button onClick={onCancel} className="pressable min-h-[44px] py-2 text-sm font-medium text-[var(--color-text-2)] transition active:scale-[0.97]">ยกเลิก</button>
    </div>
  )
}

function OwnerDash({ store, onLogout, onStore, onHome }: { store: Store; onLogout: () => void; onStore: (s: Store) => void; onHome: () => void }) {
  const [tab, setTab] = useState<'orders' | 'menu' | 'settings'>('orders')
  const [pending, setPending] = useState(0)
  const [menuCount, setMenuCount] = useState(0)

  const toggleOpen = async () => {
    const { data } = await supabase.from('lunch_stores').update({ is_open: !store.is_open }).eq('id', store.id).select().single()
    if (data) onStore(data)
  }

  useEffect(() => {
    supabase.from('lunch_menu_items').select('*', { count: 'exact', head: true }).eq('store_id', store.id).then(({ count }) => {
      if (count != null) setMenuCount(count)
    })
  }, [store.id])

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] pb-24">
      <header className="border-b border-[var(--color-border)] bg-white px-4 pb-4 pt-3">
        <div className="flex items-center justify-between">
          <button onClick={onHome} className="pressable -ml-1 flex min-h-[44px] items-center gap-1 py-1 pr-2 text-[15px] font-medium text-[var(--color-text-2)] transition active:scale-[0.97]">
            <ChevronLeft size={18} strokeWidth={1.8} /> หน้าแรก
          </button>
          <button onClick={onLogout} className="pressable min-h-[44px] rounded-[12px] border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-text-2)] transition active:scale-[0.97]">ออกจากระบบ</button>
        </div>
        <div className="min-w-0 pt-1">
          <h1 className="truncate text-[20px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>{store.name}</h1>
          <p className="text-xs text-[var(--color-text-2)]">โหมดร้านค้า</p>
        </div>
        <button onClick={toggleOpen}
          className={`pressable mt-3 flex w-full items-center justify-between rounded-[16px] border px-4 py-3 text-left transition active:scale-[0.97] ${store.is_open ? 'border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)]' : 'border-[var(--color-border)] bg-[var(--color-bg-subtle)]'}`}>
          <span>
            <span className={`block text-sm font-bold ${store.is_open ? 'text-[var(--color-accent-ink)]' : 'text-[var(--color-text-2)]'}`}>
              {store.is_open ? 'ร้านเปิดรับออเดอร์' : 'ร้านปิดรับออเดอร์'}
            </span>
            <span className={`text-xs ${store.is_open ? 'text-[var(--color-accent-ink)]/70' : 'text-[var(--color-text-3)]'}`}>กดเพื่อ{store.is_open ? 'ปิด' : 'เปิด'}รับออเดอร์</span>
          </span>
          {/* iOS-style switch */}
          <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${store.is_open ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-strong)]'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${store.is_open ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </button>
        {/* stats cards row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[16px] border border-[var(--color-border)] bg-white p-3 card-shadow">
            <p className="text-[11px] font-semibold tracking-wide text-[var(--color-text-3)]">ออเดอร์รอ</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{pending}</p>
          </div>
          <div className="rounded-[16px] border border-[var(--color-border)] bg-white p-3 card-shadow">
            <p className="text-[11px] font-semibold tracking-wide text-[var(--color-text-3)]">เมนูทั้งหมด</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{menuCount}</p>
          </div>
          <div className="rounded-[16px] border border-[var(--color-border)] bg-white p-3 card-shadow">
            <p className="text-[11px] font-semibold tracking-wide text-[var(--color-text-3)]">วันนี้</p>
            <p className="mt-1 text-[13px] font-semibold leading-tight">{new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-3">
        <div className="grid grid-cols-3 gap-1 rounded-[12px] bg-[var(--color-bg-subtle)] p-1">
          {([['orders', 'ออเดอร์'], ['menu', 'เมนู'], ['settings', 'ตั้งค่า']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`pressable relative min-h-[44px] rounded-[10px] py-2.5 text-[13px] font-semibold transition active:scale-[0.97] ${tab === k ? 'bg-white text-[var(--color-text)] shadow-sm border border-[var(--color-border)]' : 'text-[var(--color-text-2)]'}`}>
              {label}
              {k === 'orders' && pending > 0 && (
                <span className="absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#111827] px-1 text-[10px] font-bold text-white">{pending}</span>
              )}
            </button>
          ))}
        </div>

        <div className="pt-3.5">
          {tab === 'orders' && <OrdersBoard storeId={store.id} onPendingChange={setPending} />}
          {tab === 'menu' && <MenuManager storeId={store.id} onCount={setMenuCount} />}
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
      <div className="rounded-[16px] border border-dashed border-[var(--color-border)] bg-white p-12 text-center card-shadow">
        <ChefHat size={30} strokeWidth={1.8} className="mx-auto text-[var(--color-text-3)]" />
        <p className="mt-2 text-sm font-semibold">ไม่มีออเดอร์ที่รออยู่</p>
        <p className="mt-1 text-xs text-[var(--color-text-2)]">ออเดอร์ใหม่จะแสดงทันทีเมื่อลูกค้าสั่ง</p>
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
          <div key={o.id} className="overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-white card-shadow">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-white px-4 py-2.5">
              <span className="font-mono text-[13px] font-bold tracking-wider">{o.order_code}</span>
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${o.status === 'pending' ? 'bg-amber-500' : o.status === 'confirmed' ? 'bg-blue-500' : 'bg-[var(--color-accent)]'}`} />
                <span className={`text-xs font-semibold ${o.status === 'pending' ? 'text-amber-600' : o.status === 'confirmed' ? 'text-blue-600' : 'text-[var(--color-accent-ink)]'}`}>{step.label}</span>
              </span>
              <span className="ml-auto text-xs tabular-nums text-[var(--color-text-2)]">{o.pickup_slot}</span>
            </div>
            <div className="px-4 py-3">
              <ul className="divide-y divide-[var(--color-border)]">
                {(o.lunch_order_items ?? []).map((i) => (
                  <li key={i.id} className="flex justify-between py-1.5 text-sm">
                    <span className="text-[var(--color-text)]">{i.item_name} <span className="font-medium text-[var(--color-text-3)]">×{i.quantity}</span></span>
                    <span className="tabular-nums font-medium">฿{(i.quantity * Number(i.unit_price_thb)).toFixed(0)}</span>
                  </li>
                ))}
              </ul>
              {o.note && <p className="mt-2 rounded-[12px] bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">หมายเหตุ: {o.note}</p>}
              <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-[var(--color-border)] pt-2.5 text-sm">
                <span className="text-[var(--color-text-2)]">{o.customer_name} · {o.customer_phone.slice(-4)}</span>
                <b className="tabular-nums">฿{Number(o.total_thb).toFixed(0)}</b>
              </div>
              <div className="mt-3 grid gap-2">
                {step.next
                  ? <button onClick={() => setStatus(o, step.next!)} className="pressable min-h-[44px] rounded-[12px] bg-[#111827] py-3 text-sm font-semibold text-white transition active:scale-[0.97]">{step.nextLabel}</button>
                  : null}
                {o.status !== 'completed' && (
                  <button onClick={() => setStatus(o, 'cancelled')} className="pressable min-h-[44px] rounded-[12px] py-2 text-xs font-medium text-[var(--color-text-2)] transition active:scale-[0.97]">ยกเลิกออเดอร์นี้</button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MenuManager({ storeId, onCount }: { storeId: string; onCount?: (n: number) => void }) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [f, setF] = useState({ name: '', price_thb: '', category: 'อาหารจานเดียว', description: '', daily_note: '' })
  const load = () => supabase.from('lunch_menu_items').select('*').eq('store_id', storeId).order('created_at').then(({ data }) => {
    const list = data ?? []
    setItems(list)
    onCount?.(list.length)
  })
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
          <button onClick={() => setShowAdd(true)} className="pressable mb-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--color-border)] bg-white py-3.5 text-sm font-semibold text-[#111827] transition active:scale-[0.97]">
            <Plus size={18} strokeWidth={1.8} /> เพิ่มเมนูใหม่
          </button>
      )}
      {showAdd && (
        <div className="mb-3 grid gap-2.5 rounded-[16px] border border-[var(--color-border)] bg-white p-4 card-shadow">
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
            <button onClick={() => setShowAdd(false)} className="pressable min-h-[44px] rounded-[12px] bg-[var(--color-bg-subtle)] py-3 text-sm font-semibold text-[var(--color-text-2)] transition active:scale-[0.97]">ยกเลิก</button>
            <button onClick={add} className="pressable min-h-[44px] rounded-[12px] bg-[#111827] py-3 text-sm font-semibold text-white transition active:scale-[0.97]">บันทึกเมนู</button>
          </div>
        </div>
      )}

      <div className="grid overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-white card-shadow">
        {items.map((it, idx) => (
          <div key={it.id} className={`flex items-center gap-3 p-3.5 ${idx > 0 ? 'border-t border-[var(--color-border)]' : ''} ${!it.available ? 'opacity-45' : ''}`}>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-sm font-medium" style={{ fontFamily: 'var(--font-display)' }}>{it.name}</b>
              <p className="text-sm font-semibold tabular-nums text-[var(--color-text)]">฿{Number(it.price_thb).toFixed(0)}</p>
              {it.daily_note && <p className="truncate text-xs font-medium text-[var(--color-accent)]">{it.daily_note}</p>}
            </div>
            <button onClick={() => toggle(it)} className={`pressable min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold transition active:scale-[0.97] ${it.available ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)] ring-1 ring-[var(--color-accent)]/15' : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-2)] ring-1 ring-[var(--color-border)]'}`}>{it.available ? 'มีของ' : 'หมด'}</button>
            <button onClick={() => del(it.id)} className="pressable flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-2)] transition hover:text-red-500 active:scale-[0.97]" aria-label="ลบ">✕</button>
          </div>
        ))}
        {items.length === 0 && <p className="py-8 text-center text-sm text-[var(--color-text-3)]">ยังไม่มีเมนู</p>}
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
    <div className="grid gap-3 rounded-[16px] border border-[var(--color-border)] bg-white p-4 card-shadow">
      <label className="text-[13px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>เวลารับที่เปิดให้จอง <span className="font-normal text-[var(--color-text-3)]">(คั่นด้วย ,)</span></label>
      <input value={slots} onChange={(e) => setSlots(e.target.value)} className={input} />
      <button onClick={save} className={`pressable min-h-[44px] rounded-[12px] py-3 text-sm font-semibold text-white transition active:scale-[0.97] ${saved ? 'bg-[var(--color-accent)]' : 'bg-[#111827]'}`}>
        {saved ? 'บันทึกแล้ว ✓' : 'บันทึก'}
      </button>
      <div className="rounded-[12px] bg-[var(--color-bg-subtle)] p-3 text-xs leading-relaxed text-[var(--color-text-2)]">
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
        .then(({ data }) => setResults((data ?? []) as Order[]))
  }, [])
  const STATUS = { pending: ['รอยืนยัน', 'text-amber-600 bg-amber-50'], confirmed: ['กำลังเตรียม', 'text-blue-600 bg-blue-50'], ready: ['พร้อมรับ', 'text-emerald-600 bg-emerald-50'], completed: ['สำเร็จ', 'text-neutral-500 bg-neutral-100'], cancelled: ['ยกเลิก', 'text-red-500 bg-red-50'] } as const
  const STEPS = ['รอยืนยัน', 'กำลังเตรียม', 'พร้อมรับ', 'สำเร็จ'] as const
  function statusIndex(s: Order['status']) { return ({ pending: 0, confirmed: 1, ready: 2, completed: 3, cancelled: -1 } as Record<string, number>)[s] ?? -1 }

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-white px-4 pb-4 pt-6">
        <h1 className="text-display">คำสั่งซื้อของฉัน</h1>
        <p className="mt-0.5 text-sm text-[var(--color-text-2)]">ติดตามสถานะแบบเรียลไทม์</p>
      </header>
      <div className="px-4 pt-4">
        {mine.length === 0 && (
          <div className="rounded-[16px] border border-dashed border-[var(--color-border)] bg-white p-12 text-center card-shadow">
            <Package size={30} strokeWidth={1.8} className="mx-auto text-[var(--color-text-3)]" />
            <p className="mt-3 text-sm font-semibold">ยังไม่มีคำสั่งซื้อ</p>
            <p className="mt-1 text-xs text-[var(--color-text-2)]">อุปกรณ์นี้ยังไม่เคยสั่งอาหาร</p>
          </div>
        )}
        {mine.length > 0 && results.length === 0 && (
          <div className="rounded-[16px] border border-dashed border-[var(--color-border)] bg-white p-12 text-center card-shadow">
            <Package size={30} strokeWidth={1.8} className="mx-auto text-[var(--color-text-3)]" />
            <p className="mt-3 text-sm font-semibold">กำลังโหลดคำสั่งซื้อ…</p>
            <p className="mt-1 text-xs text-[var(--color-text-2)]">หรือยังไม่มีข้อมูลบนเซิร์ฟเวอร์</p>
          </div>
        )}
        <div className="grid gap-3">
          {results.map((o) => {
            const [label, cls] = STATUS[o.status]
            const idx = statusIndex(o.status)
            const cancelled = o.status === 'cancelled'
            return (
              <div key={o.id} className="overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-white card-shadow">
                <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
                  <span className="font-mono text-[13px] font-bold tracking-wider">{o.order_code}</span>
                  <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
                  <span className="text-xs tabular-nums text-[var(--color-text-2)]">{o.pickup_slot}</span>
                </div>
                {!cancelled && o.status!=='completed' && (
                  <div className="border-b border-dashed border-[var(--color-border)] bg-[#fafafa] px-4 py-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-3)]">รหัสรับอาหาร</p>
                    <p className="font-mono text-[28px] font-bold tracking-[0.12em]">{o.order_code}</p>
                  </div>
                )}
                <div className="px-4 py-3">
                  {/* stepper */}
                  <div className="flex items-center gap-1">
                    {STEPS.map((sLabel, i) => {
                      const past = i < idx
                      const current = i === idx
                      return (
                        <div key={sLabel} className="flex flex-1 items-center gap-1">
                          <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${cancelled ? 'border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-text-3)]' : past ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : current ? 'border-[var(--color-accent)] bg-white text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-white text-[var(--color-text-3)]'}`}>{past && !cancelled ? '✓' : i + 1}{current && !cancelled && <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-accent)] opacity-30" />}</span>
                          <span className={`text-[10px] font-semibold leading-tight ${cancelled ? 'text-[var(--color-text-3)]' : current ? 'text-[var(--color-accent)]' : past ? 'text-[var(--color-text)]' : 'text-[var(--color-text-3)]'}`}>{sLabel}</span>
                          {i < STEPS.length - 1 && <span className={`mx-1 h-0.5 flex-1 ${cancelled ? 'bg-[var(--color-border)]' : past || current ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />}
                        </div>
                      )
                    })}
                  </div>
                  {cancelled && <p className="mt-2 rounded-[12px] bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">ออเดอร์ถูกยกเลิก</p>}
                  <ul className="mt-3 space-y-1 text-sm">
                    {(o.lunch_order_items ?? []).map((it) => (
                      <li key={it.id} className="flex justify-between"><span className="text-[var(--color-text)]">{it.item_name} <span className="text-[var(--color-text-3)]">×{it.quantity}</span></span><span className="tabular-nums font-medium">฿{(it.quantity * Number(it.unit_price_thb)).toFixed(0)}</span></li>
                    ))}
                  </ul>
                  <div className="mt-2 flex justify-between border-t border-[var(--color-border)] pt-2 text-[13px] text-[var(--color-text-2)]">
                    <span>รับ {o.pickup_slot} น.</span><b className="tabular-nums text-[var(--color-text)]">฿{Number(o.total_thb).toFixed(0)}</b>
                  </div>
                  {o.status === 'ready' && (
                    <p className="mt-2 flex items-center gap-1.5 rounded-[12px] bg-[var(--color-accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-ink)] ring-1 ring-[var(--color-accent)]/15">
                      <CheckCircle2 size={18} strokeWidth={1.8} /> พร้อมแล้ว — ไปรับที่ร้านได้เลย
                    </p>
                  )}
                  {o.status === 'completed' && (
                    <p className="mt-2 rounded-[12px] bg-[var(--color-bg-subtle)] px-3 py-2 text-center text-xs font-medium text-[var(--color-text-2)]">สำเร็จแล้ว · ขอบคุณที่ใช้บริการ</p>
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
async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
