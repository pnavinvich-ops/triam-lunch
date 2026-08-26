import { useEffect, useState } from 'react'
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

  if (loading) return <div className="p-4"><div className="skeleton h-40" /><div className="skeleton mt-3 h-16" /><div className="skeleton mt-3 h-16" /></div>
  if (!store) return <p className="p-8 text-center text-slate-400">ไม่พบร้านนี้</p>

  // group by category
  const cats = [...new Set(items.map((i) => i.category))]
  const cartTotal = cart.items.reduce((a: number, i) => a + i.qty * Number(i.item.price_thb), 0)
  const cartCount = cart.items.reduce((a: number, i) => a + i.qty, 0)

  return (
    <div className="fade-in">
      {/* header */}
      <div className="hero px-5 pb-12 pt-4 text-white">
        <button onClick={onBack} className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg backdrop-blur card-pop">←</button>
        <h1 className="text-2xl font-extrabold">{store.name}</h1>
        {store.description && <p className="mt-0.5 text-sm text-white/80">{store.description}</p>}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">🕐 {store.open_time}–{store.close_time}</span>
          {store.location && <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">📍 {store.location}</span>}
        </div>
      </div>

      <div className="-mt-6 rounded-t-3xl bg-slate-50 px-4 pt-4">
        {!store.is_open && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
            <span className="text-lg">🚫</span> ร้านปิดรับออเดอร์อยู่ — ลองกลับมาใหม่ภายหลัง
          </div>
        )}
        {cart.storeId && cart.storeId !== id && (
          <div className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            🛒 ตะกร้ามีเมนูจากร้านอื่นอยู่
            <button onClick={() => cart.clear()} className="ml-1 font-bold underline">เคลียร์ตะกร้า</button>
          </div>
        )}

        {items.length === 0 && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-4xl">🍽️</div>
            <p className="mt-2 font-semibold">ร้านนี้ยังไม่มีเมนู</p>
          </div>
        )}

        {cats.map((cat) => (
          <section key={cat} className="mb-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{cat} · {items.filter((i) => i.category === cat).length}</h2>
            <div className="grid gap-2.5">
              {items.filter((i) => i.category === cat).map((it) => (
                <MenuRow key={it.id} item={it} disabled={!it.available || !store.is_open} onAdd={() => cart.add(it)} />
              ))}
            </div>
          </section>
        ))}

        {/* pickup slots info */}
        <div className="mb-6 rounded-2xl bg-orange-50 p-4">
          <p className="text-sm font-bold text-orange-700">🕐 เวลารับที่ร้านรับจอง</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(store.pickup_slots ?? []).map((s) => (
              <span key={s} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-600 shadow-sm">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* floating cart bar */}
      {cartCount > 0 && cart.storeId === id && (
        <div className="fixed inset-x-0 bottom-20 z-20 mx-auto max-w-[480px] px-4">
          <button onClick={() => setCheckout(true)} className="card-pop flex w-full items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 py-3.5 pl-5 pr-2 font-bold text-white shadow-xl shadow-orange-500/30">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/25 text-sm">{cartCount}</span>
            <span className="flex-1 text-left">ดูตะกร้า</span>
            <span className="text-lg">฿{cartTotal.toFixed(0)}</span>
          </button>
        </div>
      )}

      {checkout && store && <CheckoutSheet store={store} onClose={() => setCheckout(false)} />}
    </div>
  )
}

function MenuRow({ item, disabled, onAdd }: { item: MenuItem; disabled?: boolean; onAdd: () => void }) {
  const inCart = useCart((s) => s.items.find((i) => i.item.id === item.id)?.qty ?? 0)
  return (
    <div className={`card-pop flex items-stretch gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm ${!item.available || disabled ? 'opacity-55' : ''}`}>
      <div className="flex w-[72px] shrink-0 items-center justify-center self-stretch rounded-xl bg-gradient-to-br from-orange-100 via-red-50 to-amber-50 text-3xl">
        {{ 'อาหารจานเดียว': '🍛', 'ตำ/ยำ': '🥗', 'ของทอด': '🍗', 'น้ำ/เครื่องดื่ม': '🥤', 'ของหวาน': '🍮' }[item.category] ?? '🍽️'}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold leading-snug">{item.name}</h3>
        {item.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{item.description}</p>}
        {item.daily_note && <p className="mt-0.5 line-clamp-1 text-xs font-medium text-orange-600">📌 {item.daily_note}</p>}
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-base font-extrabold text-orange-600">฿{Number(item.price_thb).toFixed(0)}</span>
          {inCart > 0 ? (
            <QtyStepper qty={inCart} onMinus={() => useCart.getState().setQty(item.id, inCart - 1)} onPlus={onAdd} />
          ) : (
            <button disabled={disabled} onClick={onAdd}
              className="card-pop rounded-full bg-orange-500 px-4 py-1.5 text-sm font-bold text-white disabled:bg-slate-200">
              + หยิบใส่ตะกร้า
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function QtyStepper({ qty, onMinus, onPlus }: { qty: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full bg-orange-500 px-2 py-1">
      <button onClick={onMinus} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-sm font-bold text-white">−</button>
      <span className="min-w-4 text-center text-sm font-extrabold text-white">{qty}</span>
      <button onClick={onPlus} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-sm font-bold text-white">+</button>
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
        <div className="sheet-in p-2 text-center">
          <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">✅</div>
          <h2 className="mt-3 text-xl font-extrabold">สั่งสำเร็จ!</h2>
          <p className="mt-1 text-sm text-slate-500">ชำระเงินสดตอนมารับ · เวลารับ {slot} น.</p>
          <div className="my-4 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 py-5">
            <p className="text-xs font-semibold text-orange-500">รหัสคำสั่งซื้อ</p>
            <p className="font-mono text-4xl font-extrabold tracking-[0.15em] text-orange-600">{code}</p>
          </div>
          <p className="rounded-xl bg-slate-100 p-3 text-xs text-slate-500">📸 แคปหน้าจอนี้ไว้ แล้วยื่นรหัสให้ร้านตอนมารับอาหาร</p>
          <button onClick={onClose} className="card-pop mt-4 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-3.5 font-bold text-white">เสร็จสิ้น</button>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay>
      <div className="sheet-in">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
        <h2 className="text-lg font-extrabold">🛒 ยืนยันคำสั่งซื้อ</h2>
        <p className="text-sm text-slate-400">{store.name}</p>

        <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-3">
          {cart.items.map((i) => (
            <div key={i.item.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 truncate">{i.item.name}</span>
              <button onClick={() => cart.setQty(i.item.id, i.qty - 1)} className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 font-bold">−</button>
              <span className="w-5 text-center font-bold">{i.qty}</span>
              <button onClick={() => cart.setQty(i.item.id, i.qty + 1)} className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 font-bold">+</button>
              <span className="w-14 text-right font-bold">฿{(i.qty * Number(i.item.price_thb)).toFixed(0)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-slate-200 pt-2 font-extrabold">
            <span>รวม (จ่ายสด)</span><span className="text-orange-600">฿{total.toFixed(0)}</span>
          </div>
        </div>

        <div className="mt-3 space-y-2.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อ-นามสกุล *" className={input} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เบอร์โทรศัพท์ *" inputMode="tel" className={input} />
          <div>
            <p className="mb-1.5 text-sm font-semibold">เลือกเวลารับ *</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {(store.pickup_slots ?? []).map((s) => (
                <button key={s} onClick={() => setSlot(s)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${slot === s ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30' : 'bg-slate-100 text-slate-600'}`}>
                  🕐 {s}
                </button>
              ))}
            </div>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุถึงร้าน เช่น ไม่ใส่ผักชี" rows={2} className={`${input} resize-none`} />
        </div>

        <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
          <button onClick={onClose} className="card-pop rounded-2xl bg-slate-100 py-3.5 font-bold text-slate-600">ปิด</button>
          <button onClick={submit} disabled={busy} className="card-pop rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-3.5 font-bold text-white shadow-lg shadow-orange-500/30 disabled:opacity-60">
            {busy ? 'กำลังส่ง…' : `ยืนยันสั่ง ฿${total.toFixed(0)}`}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

const input = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100'

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-in fixed inset-0 z-40 flex items-end justify-center bg-black/45 sm:items-center">
      <div className="max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-white p-4 pb-8 shadow-2xl sm:rounded-3xl">{children}</div>
    </div>
  )
}
