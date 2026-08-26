import { useEffect, useState } from 'react'
import { ChevronLeft, Plus, Minus, Clock, MapPin, CheckCircle2, Package } from 'lucide-react'
import { supabase, type MenuItem, type Store } from '../lib/supabase'
import { useCart } from '../lib/cart'

export default function StorePage({ id, onBack }: { id: string; onBack: () => void }) {
  const [store, setStore] = useState<Store | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const cart = useCart()
  const [checkout, setCheckout] = useState(false)

  useEffect(() => {
    supabase.from('lunch_stores').select('*').eq('id', id).single().then(({ data }) => { setStore(data); setLoading(false) })
    loadItems()
    const ch = supabase.channel(`menu-${id}`).on(
      'postgres_changes', { event: '*', schema: 'public', table: 'lunch_menu_items', filter: `store_id=eq.${id}` },
      () => loadItems(),
    ).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id])

  const loadItems = () =>
    supabase.from('lunch_menu_items').select('*').eq('store_id', id).order('category').then(({ data }) => setItems(data ?? []))

  if (loading) return <div className="p-4"><div className="skeleton h-32" /><div className="skeleton mt-3 h-16" /><div className="skeleton mt-2 h-16" /></div>
  if (!store) return <p className="p-10 text-center text-sm text-neutral-400">ไม่พบร้านนี้</p>

  const cats = [...new Set(items.map((i) => i.category))]
  const cartTotal = cart.items.reduce((a: number, i) => a + i.qty * Number(i.item.price_thb), 0)
  const cartCount = cart.items.reduce((a: number, i) => a + i.qty, 0)

  return (
    <div className="fade-in min-h-dvh">
      {/* flat header */}
      <header className="bg-white px-4 pb-4 pt-3">
        <button onClick={onBack} className="-ml-1 flex items-center gap-1 py-1 pr-2 text-[15px] font-medium text-neutral-600">
          <ChevronLeft size={20} /> กลับ
        </button>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">{store.name}</h1>
            {store.description && <p className="mt-0.5 truncate text-[13px] text-neutral-500">{store.description}</p>}
          </div>
          <span className={`mt-1 flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${store.is_open ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${store.is_open ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
            {store.is_open ? 'เปิดรับ' : 'ปิดแล้ว'}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1"><Clock size={13} /> {store.open_time}–{store.close_time}</span>
          {store.location && <span className="flex min-w-0 items-center gap-1"><MapPin size={13} /><span className="truncate">{store.location}</span></span>}
        </div>
      </header>

      {!store.is_open && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] font-medium text-amber-800">
          ร้านปิดรับออเดอร์ชั่วคราว
        </div>
      )}
      {cart.storeId && cart.storeId !== id && (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-lg bg-neutral-100 px-3.5 py-2.5 text-[13px]">
          <span>ตะกร้ามีเมนูจากร้านอื่น</span>
          <button onClick={() => cart.clear()} className="font-semibold text-orange-600">เคลียร์ตะกร้า</button>
        </div>
      )}

      <div className="px-4 pt-4">
        {items.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <Package size={28} className="mx-auto text-neutral-300" />
            <p className="mt-2 text-sm font-medium">ยังไม่มีเมนู</p>
          </div>
        )}

        {cats.map((cat) => (
          <section key={cat} className="mb-6">
            <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wider text-neutral-400">{cat}</h2>
            <div className="grid overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200/70">
              {items.filter((i) => i.category === cat).map((it, idx) => (
                <MenuRow key={it.id} item={it} disabled={!it.available || !store.is_open} onAdd={() => cart.add(it)} divide={idx > 0} />
              ))}
            </div>
          </section>
        ))}

        {/* pickup slots */}
        <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-200/70">
          <h3 className="flex items-center gap-1.5 text-[13px] font-bold"><Clock size={14} /> เวลารับที่รับจอง</h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {(store.pickup_slots ?? []).map((s) => (
              <span key={s} className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold tabular-nums text-neutral-700">{s}</span>
            ))}
          </div>
        </div>

        <p className="py-8 text-center text-[11px] text-neutral-400">Triam Lunch</p>
      </div>

      {/* floating checkout bar */}
      {cartCount > 0 && cart.storeId === id && (
        <div className="fixed inset-x-0 bottom-4 z-20 mx-auto max-w-[480px] px-4 pb-safe">
          <button onClick={() => setCheckout(true)} className="card-pop flex w-full items-center gap-3 rounded-full bg-orange-600 py-3 pl-4 pr-1.5 font-semibold text-white shadow-lg shadow-orange-600/25">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold">{cartCount}</span>
            <span className="flex-1 text-left text-[15px]">ดูตะกร้า</span>
            <span className="tabular-nums">฿{cartTotal.toFixed(0)}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"><ChevronLeft size={18} className="rotate-180" /></span>
          </button>
        </div>
      )}

      {checkout && store && <CheckoutSheet store={store} onClose={() => setCheckout(false)} />}
    </div>
  )
}

function MenuRow({ item, disabled, onAdd, divide }: { item: MenuItem; disabled?: boolean; onAdd: () => void; divide?: boolean }) {
  const inCart = useCart((s) => s.items.find((i) => i.item.id === item.id)?.qty ?? 0)
  return (
    <div className={`flex items-center gap-3 p-3.5 ${divide ? 'border-t border-neutral-100' : ''} ${!item.available || disabled ? 'opacity-45' : ''}`}>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-medium leading-snug">{item.name}</h3>
        {item.description && <p className="mt-0.5 line-clamp-1 text-xs text-neutral-400">{item.description}</p>}
        {item.daily_note && <p className="mt-0.5 line-clamp-1 text-xs font-medium text-orange-600">{item.daily_note}</p>}
        <p className="mt-1 text-[15px] font-semibold tabular-nums">฿{Number(item.price_thb).toFixed(0)}</p>
      </div>
      {inCart > 0 ? (
        <QtyStepper qty={inCart} onMinus={() => useCart.getState().setQty(item.id, inCart - 1)} onPlus={onAdd} />
      ) : (
        <button disabled={disabled} onClick={onAdd}
          className="card-pop flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-600 text-orange-600 disabled:border-neutral-200 disabled:text-neutral-300"
          aria-label={`เพิ่ม ${item.name}`}>
          <Plus size={18} />
        </button>
      )}
    </div>
  )
}

function QtyStepper({ qty, onMinus, onPlus }: { qty: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex h-8 shrink-0 items-center rounded-lg bg-orange-600 text-white">
      <button onClick={onMinus} className="flex h-full w-8 items-center justify-center" aria-label="ลด"><Minus size={16} /></button>
      <span className="min-w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
      <button onClick={onPlus} className="flex h-full w-8 items-center justify-center" aria-label="เพิ่ม"><Plus size={16} /></button>
    </div>
  )
}

function CheckoutSheet({ store, onClose }: { store: Store; onClose: () => void }) {
  const cart = useCart()
  const [name, setName] = useState(localStorage.getItem('tl_name') ?? '')
  const [phone, setPhone] = useState(localStorage.getItem('tl_phone') ?? '')
  const [slot, setSlot] = useState(store.pickup_slots?.[0] ?? '11:50')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const total = cart.items.reduce((a: number, i) => a + i.qty * Number(i.item.price_thb), 0)

  const submit = async () => {
    if (!name.trim() || !phone.trim()) { alert('กรุณากรอกชื่อและเบอร์โทร'); return }
    setBusy(true)
    const orderCode = 'T' + Math.random().toString(36).slice(2, 6).toUpperCase() + String(new Date().getMinutes()).padStart(2, '0')
    const { data: order, error } = await supabase.from('lunch_orders').insert({
      order_code: orderCode, store_id: store.id, customer_name: name.trim(),
      customer_phone: phone.trim(), note: note.trim(), pickup_slot: slot, total_thb: total,
    }).select().single()
    if (error) { alert('สั่งไม่สำเร็จ: ' + error.message); setBusy(false); return }

    const rows = cart.items.map((i) => ({
      order_id: order.id, menu_item_id: i.item.id, item_name: i.item.name,
      unit_price_thb: Number(i.item.price_thb), quantity: i.qty,
    }))
    const err2 = (await supabase.from('lunch_order_items').insert(rows)).error
    if (err2) alert('บันทึกรายการไม่ครบ: ' + err2.message)

    localStorage.setItem('tl_name', name.trim())
    localStorage.setItem('tl_phone', phone.trim())
    localStorage.setItem('tl_my_orders', JSON.stringify([...JSON.parse(localStorage.getItem('tl_my_orders') ?? '[]'), { code: orderCode, store: store.name, at: Date.now() }]))
    cart.clear()
    setCode(orderCode)
    setBusy(false)
  }

  if (code) {
    return (
      <Overlay>
        <div className="sheet-in px-2 pb-2 pt-6 text-center">
          <CheckCircle2 size={56} className="mx-auto text-emerald-500" strokeWidth={1.6} />
          <h2 className="mt-3 text-lg font-bold">สั่งซื้อสำเร็จ</h2>
          <p className="mt-1 text-sm text-neutral-500">ไปรับที่ร้านตอน {slot} น. · ชำระเงินสด</p>
          <div className="my-5 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">รหัสคำสั่งซื้อ</p>
            <p className="font-mono text-[34px] font-bold tracking-[0.12em] text-neutral-900">{code}</p>
          </div>
          <p className="text-xs leading-relaxed text-neutral-400">แคปหน้าจอนี้ไว้<br />แล้วยื่นรหัสให้ร้านตอนมารับอาหาร</p>
          <button onClick={onClose} className="card-pop mt-5 w-full rounded-xl bg-orange-600 py-3.5 text-[15px] font-semibold text-white">เสร็จสิ้น</button>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay>
      <div className="sheet-in">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-neutral-200" />
        <h2 className="text-lg font-bold">ยืนยันคำสั่งซื้อ</h2>
        <p className="text-[13px] text-neutral-400">{store.name}</p>

        <ul className="mt-3 divide-y divide-neutral-100 rounded-xl bg-neutral-50 px-3.5">
          {cart.items.map((i) => (
            <li key={i.item.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate">{i.item.name}</span>
              <QtyStepper qty={i.qty} onMinus={() => cart.setQty(i.item.id, i.qty - 1)} onPlus={() => cart.setQty(i.item.id, i.qty + 1)} />
              <span className="w-14 text-right font-semibold tabular-nums">฿{(i.qty * Number(i.item.price_thb)).toFixed(0)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between px-1 text-[15px] font-bold">
          <span>ยอดรวม</span><span className="tabular-nums">฿{total.toFixed(0)}</span>
        </div>

        <div className="mt-4 grid gap-2.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อ-นามสกุล" className={input} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เบอร์โทรศัพท์" inputMode="tel" className={input} />
          <div>
            <p className="mb-1.5 text-[13px] font-semibold">เวลารับ</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
              {(store.pickup_slots ?? []).map((s) => (
                <button key={s} onClick={() => setSlot(s)}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold tabular-nums transition ${slot === s ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุถึงร้าน เช่น ไม่ใส่ผักชี" rows={2} className={`${input} resize-none`} />
        </div>

        <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2.5">
          <button onClick={onClose} className="card-pop rounded-xl bg-neutral-100 py-3.5 text-[15px] font-semibold text-neutral-600">ยกเลิก</button>
          <button onClick={submit} disabled={busy} className="card-pop rounded-xl bg-orange-600 py-3.5 text-[15px] font-semibold text-white disabled:opacity-50">
            {busy ? 'กำลังส่ง…' : `สั่งอาหาร ฿${total.toFixed(0)}`}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

const input = 'w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100'

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-in fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl bg-white p-4 pb-8 sm:rounded-2xl">{children}</div>
    </div>
  )
}
