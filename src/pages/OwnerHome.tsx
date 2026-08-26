import { useEffect, useState } from 'react'
import { supabase, type Order, type Store } from '../lib/supabase'

const KEY = 'tl_owner_store'

export default function OwnerHome({ onBackHome }: { onBackHome: () => void }) {
  const [store, setStore] = useState<Store | null>(null)
  const [mode, setMode] = useState<'ask' | 'login' | 'dash' | 'register'>('ask')

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
    <div className="fade-in min-h-dvh bg-gradient-to-b from-orange-500 to-red-500">
      <div className="hero px-5 pb-24 pt-6 text-white">
        <button onClick={onBackHome} className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg card-pop">←</button>
        <h1 className="text-2xl font-extrabold">🏪 สำหรับร้านค้า</h1>
        <p className="mt-1 text-sm text-white/80">จัดการเมนูและออเดอร์ของร้านคุณ</p>
      </div>

      <div className="-mt-16 px-4">
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          {mode === 'ask' && (
            <div className="grid gap-3">
              <div className="mb-1 text-center text-4xl">👋</div>
              <p className="text-center text-sm text-slate-500">มีร้านอยู่แล้วหรือยัง?</p>
              <button onClick={() => setMode('login')} className="card-pop rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-3.5 font-bold text-white shadow-lg shadow-orange-500/30">🔐 เข้าสู่ระบบร้านของฉัน</button>
              <div className="flex items-center gap-2 py-1"><span className="h-px flex-1 bg-slate-200" /><span className="text-xs text-slate-400">หรือ</span><span className="h-px flex-1 bg-slate-200" /></div>
              <button onClick={() => setMode('register')} className="card-pop rounded-2xl border-2 border-orange-200 bg-orange-50 py-3.5 font-bold text-orange-600">🎉 เปิดร้านใหม่ฟรี</button>
            </div>
          )}
          {mode === 'login' && <Login onDone={(s) => { localStorage.setItem(KEY, s.id); setStore(s); setMode('dash'); location.reload() }} onCancel={() => setMode('ask')} />}
          {mode === 'register' && <Register onCancel={() => setMode('ask')} />}
        </div>
      </div>
    </div>
  )
}

const input = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100'

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
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อร้าน" className={input} />
      <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="PIN ของร้าน" type="password" inputMode="numeric" className={`${input} tracking-[0.4em]`} />
      {err && <p className="rounded-lg bg-red-50 p-2 text-sm font-medium text-red-600">⚠️ {err}</p>}
      <button onClick={go} className="card-pop mt-1 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-3.5 font-bold text-white shadow-lg shadow-orange-500/30">เข้าสู่ระบบ</button>
      <button onClick={onCancel} className="py-2 text-sm font-medium text-slate-400">← กลับ</button>
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
      <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="ชื่อร้าน *" className={input} />
      <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="คำอธิบายสั้น ๆ เช่น ข้าวราดแกง" className={input} />
      <input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="ตำแหน่ง เช่น โรงอาหารกลาง แถว A" className={input} />
      <div className="grid grid-cols-2 gap-2">
        <input value={f.open_time} onChange={(e) => setF({ ...f, open_time: e.target.value })} placeholder="เปิด 06:00" className={input} />
        <input value={f.close_time} onChange={(e) => setF({ ...f, close_time: e.target.value })} placeholder="ปิด 13:00" className={input} />
      </div>
      <input value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '') })} placeholder="ตั้ง PIN (≥ 4 หลัก) *" type="password" inputMode="numeric" className={`${input} tracking-[0.4em]`} />
      <button onClick={go} disabled={busy} className="card-pop mt-1 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-3.5 font-bold text-white shadow-lg shadow-orange-500/30 disabled:opacity-60">
        {busy ? '⏳ กำลังสร้าง…' : '🎉 เปิดร้านเลย'}
      </button>
      <button onClick={onCancel} className="py-2 text-sm font-medium text-slate-400">← กลับ</button>
    </div>
  )
}

function OwnerDash({ store, onLogout, onStore }: { store: Store; onLogout: () => void; onStore: (s: Store) => void }) {
  const [tab, setTab] = useState<'orders' | 'menu' | 'settings'>('orders')

  const toggleOpen = async () => {
    const { data } = await supabase.from('lunch_stores').update({ is_open: !store.is_open }).eq('id', store.id).select().single()
    if (data) onStore(data)
  }

  return (
    <div className="fade-in pb-24">
      {/* header */}
      <div className="hero px-5 pb-14 pt-5 text-white">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏪</span>
          <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold">{store.name}</h1>
          <button onClick={onLogout} className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur">ออกจากระบบ</button>
        </div>
        <button onClick={toggleOpen} className={`card-pop mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold backdrop-blur ${store.is_open ? 'bg-green-400/90 text-green-950' : 'bg-black/25 text-white'}`}>
          {store.is_open ? '🟢 ร้านกำลังเปิดรับออเดอร์ — กดเพื่อปิด' : '🔴 ร้านปิดอยู่ — กดเพื่อเปิดรับ'}
        </button>
      </div>

      {/* tabs pulled over header */}
      <div className="-mt-8 px-4">
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-white p-1.5 shadow-lg shadow-slate-200/60">
          {([['orders', '📋', 'ออเดอร์'], ['menu', '🍜', 'เมนู'], ['settings', '⚙️', 'ตั้งค่า']] as const).map(([k, ic, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`card-pop rounded-xl py-2.5 text-xs font-bold transition ${tab === k ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30' : 'text-slate-500'}`}>
              <span className="mr-1">{ic}</span>{label}
            </button>
          ))}
        </div>

        {tab === 'orders' && <OrdersBoard storeId={store.id} />}
        {tab === 'menu' && <MenuManager storeId={store.id} />}
        {tab === 'settings' && <Settings store={store} onStore={onStore} />}
      </div>
    </div>
  )
}

function OrdersBoard({ storeId }: { storeId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const load = () =>
    supabase.from('lunch_orders').select('*, lunch_order_items(*)').eq('store_id', storeId)
      .in('status', ['pending', 'confirmed', 'ready']).order('created_at', { ascending: true })
      .then(({ data }) => setOrders((data ?? []) as Order[]))

  useEffect(() => {
    load()
    const ch = supabase.channel(`orders-${storeId}`).on(
      'postgres_changes', { event: '*', schema: 'public', table: 'lunch_orders', filter: `store_id=eq.${storeId}` },
      () => load(),
    ).subscribe()
    const iv = setInterval(load, 15000)
    return () => { supabase.removeChannel(ch); clearInterval(iv) }
  }, [storeId])

  const setStatus = async (o: Order, status: Order['status']) => {
    await supabase.from('lunch_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', o.id)
    load()
  }

  if (orders.length === 0)
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="text-5xl">😴</div>
        <p className="mt-2 font-bold">ไม่มีออเดอร์ที่รออยู่</p>
        <p className="mt-1 text-sm text-slate-400">ออเดอร์ใหม่จะเด้งเข้ามาทันทีเมื่อมีคนสั่ง</p>
      </div>
    )

  return (
    <div className="grid gap-3">
      {orders.map((o) => (
        <div key={o.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${o.status === 'ready' ? 'border-green-300 ring-2 ring-green-100' : 'border-slate-100'}`}>
          {/* status strip */}
          <div className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold ${o.status === 'pending' ? 'bg-amber-50 text-amber-700' : o.status === 'confirmed' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
            <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-white">{o.order_code}</span>
            {statusLabel(o.status)}
            <span className="ml-auto">🕐 รับ {o.pickup_slot}</span>
          </div>
          <div className="p-3.5 pt-2.5">
            <p className="text-sm"><b>{o.customer_name}</b> · 📞 xxx-xxx-{o.customer_phone.slice(-4)}</p>
            <ul className="mt-1.5 space-y-0.5 text-sm text-slate-600">
              {(o.lunch_order_items ?? []).map((i) => (
                <li key={i.id} className="flex justify-between"><span>· {i.item_name}</span><b className="text-slate-800">×{i.quantity}</b></li>
              ))}
            </ul>
            {o.note && <p className="mt-2 rounded-xl bg-amber-50 p-2.5 text-xs font-medium text-amber-800">📝 {o.note}</p>}
            <div className="mt-2 flex items-center justify-between">
              <span className="font-extrabold">฿{Number(o.total_thb).toFixed(0)}<span className="ml-1 text-xs font-normal text-slate-400">(เก็บสด)</span></span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {o.status === 'pending' && <BigAct full onClick={() => setStatus(o, 'confirmed')}>✔ ยืนยัน / เริ่มทำ</BigAct>}
              {o.status === 'confirmed' && <BigAct green full onClick={() => setStatus(o, 'ready')}>🍱 พร้อมรับแล้ว</BigAct>}
              {o.status === 'ready' && <BigAct green full onClick={() => setStatus(o, 'completed')}>💰 ลูกค้าจ่ายแล้ว</BigAct>}
              {o.status !== 'completed' && <BigAct red onClick={() => setStatus(o, 'cancelled')}>✕ ยกเลิก</BigAct>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MenuManager({ storeId }: { storeId: string }) {
  interface MI { id: string; name: string; price_thb: number; category: string; description: string; available: boolean; daily_note: string }
  const [items, setItems] = useState<MI[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [f, setF] = useState({ name: '', price_thb: '', category: 'อาหารจานเดียว', description: '', daily_note: '' })
  const load = () => supabase.from('lunch_menu_items').select('*').eq('store_id', storeId).order('created_at').then(({ data }) => setItems((data ?? []) as never))
  useEffect(() => { load() }, [storeId])

  const add = async () => {
    if (!f.name.trim() || !Number(f.price_thb)) { alert('ต้องมีชื่อและราคา'); return }
    await supabase.from('lunch_menu_items').insert({ store_id: storeId, name: f.name.trim(), price_thb: Number(f.price_thb), category: f.category, description: f.description.trim(), daily_note: f.daily_note.trim() })
    setF({ name: '', price_thb: '', category: f.category, description: '', daily_note: '' })
    setShowAdd(false)
    load()
  }
  const toggle = async (it: MI) => { await supabase.from('lunch_menu_items').update({ available: !it.available }).eq('id', it.id); load() }
  const del = async (id: string) => { if (confirm('ลบรายการนี้?')) { await supabase.from('lunch_menu_items').delete().eq('id', id); load() } }

  return (
    <div>
      {!showAdd && (
        <button onClick={() => setShowAdd(true)} className="card-pop mb-4 w-full rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 py-3.5 font-bold text-orange-600">+ เพิ่มเมนูใหม่</button>
      )}
      {showAdd && (
        <div className="mb-4 grid gap-2.5 rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="ชื่อเมนู *" className={input} />
          <div className="grid grid-cols-2 gap-2">
            <input value={f.price_thb} onChange={(e) => setF({ ...f, price_thb: e.target.value.replace(/\D/g, '') })} placeholder="ราคา (฿) *" inputMode="numeric" className={input} />
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={input}>
              {['อาหารจานเดียว', 'ตำ/ยำ', 'ของทอด', 'น้ำ/เครื่องดื่ม', 'ของหวาน', 'อื่น ๆ'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <input value={f.daily_note} onChange={(e) => setF({ ...f, daily_note: e.target.value })} placeholder="โน้ตประจำวัน เช่น วันนี้หมดแจกัน" className={input} />
          <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="คำอธิบาย (ไม่บังคับ)" className={input} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowAdd(false)} className="card-pop rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-500">ยกเลิก</button>
            <button onClick={add} className="card-pop rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-2.5 text-sm font-bold text-white">+ เพิ่มเมนู</button>
          </div>
        </div>
      )}

      <div className="grid gap-2.5">
        {items.map((it: any) => (
          <div key={it.id} className={`card-pop flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm ${!it.available ? 'opacity-55' : ''}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-50 text-2xl">
              {({ 'อาหารจานเดียว': '🍛', 'ตำ/ยำ': '🥗', 'ของทอด': '🍗', 'น้ำ/เครื่องดื่ม': '🥤', 'ของหวาน': '🍮' } as Record<string,string>)[it.category] ?? '🍽️'}
            </div>
            <div className="min-w-0 flex-1">
              <b className="block truncate">{it.name}</b>
              <p className="text-sm font-extrabold text-orange-600">฿{Number(it.price_thb).toFixed(0)}</p>
              {it.daily_note && <p className="truncate text-xs text-orange-500">📌 {it.daily_note}</p>}
            </div>
            <button onClick={() => toggle(it)} className={`chip ${it.available ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{it.available ? '✓ มีของ' : 'หมด'}</button>
            <button onClick={() => del(it.id)} className="p-1 text-lg text-slate-300 hover:text-red-500">🗑</button>
          </div>
        ))}
        {items.length === 0 && <p className="py-8 text-center text-sm text-slate-400">ยังไม่มีเมนู — กด "+ เพิ่มเมนูใหม่"</p>}
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
    <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <label className="text-sm font-bold">🕐 เวลารับที่เปิดให้จอง <span className="font-normal text-slate-400">(คั่นด้วย ,)</span></label>
      <input value={slots} onChange={(e) => setSlots(e.target.value)} className={input} />
      <button onClick={save} className={`card-pop rounded-xl py-3 text-sm font-bold text-white ${saved ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}>
        {saved ? '✓ บันทึกแล้ว' : 'บันทึกการตั้งค่า'}
      </button>
      <div className="mt-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
        📍 {store.location || '—'} · เปิด {store.open_time}–{store.close_time}
      </div>
    </div>
  )
}

export function TrackOrderView() {
  const mine = JSON.parse(localStorage.getItem('tl_my_orders') ?? '[]') as { code: string; store: string; at: number }[]
  const [results, setResults] = useState<Order[]>([])
  useEffect(() => {
    if (mine.length)
      supabase.from('lunch_orders').select('*, lunch_order_items(*)').in('order_code', mine.map((m) => m.code))
        .then(({ data }) => setResults((data ?? []) as Order[]))
  }, [])
  return (
    <div className="fade-in min-h-dvh bg-gradient-to-b from-orange-500 to-red-500 pb-28">
      <div className="hero px-5 pb-16 pt-8 text-white">
        <h1 className="text-2xl font-extrabold">📦 คำสั่งซื้อของฉัน</h1>
        <p className="mt-1 text-sm text-white/80">ติดตามสถานะได้แบบเรียลไทม์</p>
      </div>
      <div className="-mt-10 px-4">
        {mine.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-5xl">🛍️</div>
            <p className="mt-2 font-bold">ยังไม่มีประวัติการสั่ง</p>
            <p className="mt-1 text-sm text-slate-400">อุปกรณ์นี้ยังไม่เคยสั่งอาหาร</p>
          </div>
        )}
        <div className="grid gap-3">
          {results.map((o) => (
            <div key={o.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold ${o.status === 'pending' ? 'bg-amber-50 text-amber-700' : o.status === 'confirmed' ? 'bg-blue-50 text-blue-700' : o.status === 'ready' ? 'bg-green-50 text-green-700' : o.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-white">{o.order_code}</span>
                {statusLabel(o.status)}
                <span className="ml-auto">🕐 {o.pickup_slot}</span>
              </div>
              <div className="p-3.5 pt-2.5">
                <ul className="space-y-0.5 text-sm text-slate-600">
                  {(o.lunch_order_items ?? []).map((i) => (
                    <li key={i.id} className="flex justify-between"><span>· {i.item_name}</span><b className="text-slate-800">×{i.quantity}</b></li>
                  ))}
                </ul>
                <p className="mt-2 text-right font-extrabold">฿{Number(o.total_thb).toFixed(0)}</p>
                {o.status === 'ready' && <p className="mt-1 rounded-xl bg-green-50 p-2.5 text-center text-xs font-bold text-green-700">✅ พร้อมแล้ว! ไปรับที่ร้านได้เลย</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
function statusLabel(s: Order['status']) {
  return { pending: '⏳ รอยืนยัน', confirmed: '👨‍🍳 กำลังทำ', ready: '✅ พร้อมรับ', completed: '🏁 สำเร็จ', cancelled: '❌ ยกเลิก' }[s]
}
function BigAct({ children, onClick, green, red, full }: { children: React.ReactNode; onClick: () => void; green?: boolean; red?: boolean; full?: boolean }) {
  const c = green ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
    : red ? 'bg-red-50 text-red-500 border border-red-100'
    : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30'
  return <button onClick={onClick} className={`card-pop rounded-xl py-2.5 text-sm font-bold ${c} ${full ? 'col-span-2' : ''}`}>{children}</button>
}
