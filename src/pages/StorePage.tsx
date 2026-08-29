import { useEffect, useState } from 'react'
import { ChevronLeft, Plus, Minus, Clock, MapPin, CheckCircle2, Package, Star, Heart, Share2, Info, ShieldCheck, ChevronRight } from 'lucide-react'
import { supabase, type MenuItem, type Store } from '../lib/supabase'
import { useCart } from '../lib/cart'

export default function StorePage({ id, onBack }: { id: string; onBack: () => void }) {
  const [store, setStore] = useState<Store | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState<string>('')
  const cart = useCart()
  const [checkout, setCheckout] = useState(false)

  useEffect(() => {
    supabase.from('lunch_stores').select('*').eq('id', id).single().then(({ data }) => { setStore(data); setLoading(false) })
    loadItems()
    const ch = supabase.channel(`menu-${id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'lunch_menu_items', filter: `store_id=eq.${id}` }, () => loadItems()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id])
  const loadItems = () => supabase.from('lunch_menu_items').select('*').eq('store_id', id).order('category').then(({ data }) => {
    setItems(data ?? []); if(data?.length && !activeCat) setActiveCat([...new Set(data.map(d=>d.category))][0] as string)
  })

  if (loading) return <div className="p-4"><div className="skeleton h-40" /><div className="skeleton mt-3 h-16" /></div>
  if (!store) return <p className="p-10 text-center text-sm text-[var(--color-text-2)]">ไม่พบร้านนี้</p>

  const cats = [...new Set(items.map(i=>i.category))]
  const cartTotal = cart.items.reduce((a,i)=>a + i.qty * Number(i.item.price_thb),0)
  const cartCount = cart.items.reduce((a,i)=>a + i.qty,0)
  const visible = activeCat ? items.filter(i=>i.category===activeCat) : items

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      {/* Top bar — white, flat */}
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-[var(--color-border)] bg-white px-3 py-2.5">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-white"><ChevronLeft size={18} /></button>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{store.name}</p>
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-white"><Heart size={16} /></button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-white"><Share2 size={16} /></button>
      </div>

      {/* Store header — flat white card, no hero gradient */}
      <section className="border-b border-[var(--color-border)] bg-white px-4 pb-4 pt-4">
        <div className="flex gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] border border-[var(--color-border)] bg-[#f3f3f3] text-sm font-bold text-[var(--color-text-2)]">{store.name.slice(0,2)}</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[16px] font-bold leading-tight tracking-tight">{store.name}</h1>
            {store.description && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-2)]">{store.description}</p>}
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold"><Star size={12} className="fill-amber-400 text-amber-400" /> 4.8</span>
              <span className="text-[var(--color-text-3)]">(120)</span>
              <span className="text-[var(--color-border-strong)]">·</span>
              <span className="text-[var(--color-text-2)]">5–10 นาที</span>
              <span className="text-[var(--color-border-strong)]">·</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-accent-ink)] ring-1 ring-[var(--color-accent)]/15"><ShieldCheck size={11} /> รับประกันความสด</span>
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${store.is_open?'bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)] ring-[var(--color-accent)]/15':'bg-[#f3f3f3] text-[var(--color-text-3)] ring-[var(--color-border)]'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${store.is_open?'bg-[var(--color-accent)]':'bg-[var(--color-text-3)]'}`} />{store.is_open?'เปิดรับออเดอร์':'ปิดแล้ว'}
          </span>
          <span className="inline-flex items-center gap-1 text-[var(--color-text-2)]"><Clock size={12} />{store.open_time}–{store.close_time}</span>
          {store.location && <span className="inline-flex items-center gap-1 text-[var(--color-text-2)]"><MapPin size={12} />{store.location}</span>}
        </div>
      </section>

      {!store.is_open && <div className="mx-3 mt-3 rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-800">ร้านปิดรับออเดอร์ชั่วคราว</div>}
      {cart.storeId && cart.storeId!==id && <div className="mx-3 mt-3 flex items-center justify-between rounded-[12px] border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm card-shadow"><span className="font-medium">ตะกร้ามีเมนูจากร้านอื่น</span><button onClick={()=>cart.clear()} className="font-semibold text-[var(--color-accent)]">ล้าง</button></div>}

      {/* Promo row — flat pills */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto bg-white px-3 py-2.5">
        <span className="shrink-0 rounded-full bg-[var(--color-text)] px-3 py-1.5 text-xs font-semibold text-white">ส่วนลด 10฿ · สั่งล่วงหน้า</span>
        <span className="shrink-0 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium">รับที่ร้าน · ไม่รอคิว</span>
        <span className="shrink-0 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium">จ่ายเงินสด</span>
      </div>

      {/* Category tabs — underline indicator, not pills (professional) */}
      <div className="sticky top-[52px] z-10 flex gap-5 overflow-x-auto border-b border-[var(--color-border)] bg-white px-4 no-scrollbar">
        {cats.map(c=>(
          <button key={c} onClick={()=>setActiveCat(c)} className={`shrink-0 border-b-2 py-3 text-sm font-semibold tracking-tight transition ${activeCat===c ? 'border-[var(--color-text)] text-[var(--color-text)]' : 'border-transparent text-[var(--color-text-2)]'}`}>{c}</button>
        ))}
      </div>

      {/* Menu */}
      <div className="px-3 pt-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-bold tracking-tight">{activeCat || 'เมนู'} <span className="font-medium text-[var(--color-text-2)]">· {visible.length} รายการ</span></h2>
          <span className="text-xs font-medium text-[var(--color-text-2)]">เรียง: แนะนำ</span>
        </div>
        {visible.length===0 && <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-white p-8 text-center"><Package size={22} className="mx-auto text-[var(--color-text-3)]" /><p className="mt-2 text-sm font-medium">ยังไม่มีเมนู</p></div>}
        <div className="grid gap-2.5">
          {visible.map(it=> <FoodRow key={it.id} item={it} disabled={!it.available || !store.is_open} />)}
        </div>

        <section className="mt-4 rounded-[12px] border border-[var(--color-border)] bg-white p-4 card-shadow">
          <h3 className="flex items-center gap-1.5 text-sm font-bold"><Info size={14} /> ข้อมูลร้าน</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-2)]">{store.description || 'อาหารสดใหม่ทุกวัน รับออเดอร์ล่วงหน้า มารับตรงเวลาได้เลย'}</p>
          <div className="mt-3 flex flex-wrap gap-2">{(store.pickup_slots??[]).map(s=> <span key={s} className="rounded-full border border-[var(--color-border)] bg-[#f3f3f3] px-3 py-1.5 text-xs font-semibold tabular-nums">{s} น.</span>)}</div>
          <button className="mt-3 flex w-full items-center justify-between rounded-[10px] border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm font-medium">ดูข้อมูลเพิ่มเติม <ChevronRight size={16} className="text-[var(--color-text-3)]" /></button>
        </section>
        <p className="py-8 text-center text-[11px] font-medium tracking-wide text-[var(--color-text-3)]">TRIAM LUNCH</p>
      </div>

      {cartCount>0 && cart.storeId===id && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] border-t border-[var(--color-border)] bg-white px-4 pb-safe pt-3">
          <button onClick={()=>setCheckout(true)} className="flex w-full items-center justify-between rounded-full bg-[var(--color-text)] px-2 py-2 text-sm font-semibold text-white">
            <span className="flex items-center gap-3"><span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white/15 text-sm tabular-nums">{cartCount}</span> ดูตะกร้า</span>
            <span className="flex items-center gap-2 pr-1"><span className="tabular-nums">฿{cartTotal.toFixed(0)}</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[var(--color-text)]"><ChevronRight size={14} /></span></span>
          </button>
          <p className="py-1 text-center text-[11px] text-[var(--color-text-3)]">รับที่ร้าน · ชำระเงินสด</p>
        </div>
      )}
      {checkout && store && <CheckoutSheet store={store} onClose={()=>setCheckout(false)} />}
    </div>
  )
}

function FoodRow({item,disabled}:{item:MenuItem;disabled?:boolean}){
  const inCart = useCart(s=>s.items.find(i=>i.item.id===item.id)?.qty ?? 0)
  return (
    <div className={`flex gap-3 rounded-[12px] border border-[var(--color-border)] bg-white p-3 card-shadow ${!item.available || disabled ? 'opacity-50':''}`}>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-[14px] font-semibold leading-tight">{item.name}</h3>
        {item.description && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-2)]">{item.description}</p>}
        {item.daily_note && <p className="mt-1 text-xs font-semibold text-[var(--color-accent)]">{item.daily_note}</p>}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[15px] font-bold tabular-nums">฿{Number(item.price_thb).toFixed(0)}</span>
          <span className="rounded-full bg-[#f3f3f3] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-2)] line-through">฿{(Number(item.price_thb)+10).toFixed(0)}</span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-text-3)]"><Star size={10} className="fill-amber-400 text-amber-400" /> 4.8 · 50+ สั่งแล้ว</p>
      </div>
      <div className="flex w-[96px] shrink-0 flex-col items-stretch gap-2">
        <div className="flex h-[72px] items-center justify-center rounded-[10px] bg-[#f3f3f3] text-xs font-bold text-[var(--color-text-3)] ring-1 ring-[var(--color-border)]">{item.name.slice(0,2)}</div>
        {inCart>0 ? (
          <span className="flex items-center justify-between rounded-full bg-[var(--color-text)] p-1 text-white">
            <button onClick={()=>useCart.getState().setQty(item.id, inCart-1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15"><Minus size={14} /></button>
            <span className="min-w-4 text-center text-sm font-bold tabular-nums">{inCart}</span>
            <button onClick={()=>useCart.getState().add(item)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[var(--color-text)]"><Plus size={14} /></button>
          </span>
        ) : (
          <button disabled={disabled} onClick={()=>useCart.getState().add(item)} className="rounded-full bg-[var(--color-text)] py-2 text-xs font-bold text-white disabled:bg-[#e8e8e8] disabled:text-[var(--color-text-3)]">เพิ่ม</button>
        )}
      </div>
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
  const total = cart.items.reduce((a,i)=>a + i.qty * Number(i.item.price_thb),0)
  const submit = async () => {
    if (!name.trim() || !phone.trim()) { alert('กรุณากรอกชื่อและเบอร์โทร'); return }
    setBusy(true)
    const orderCode = 'T' + Math.random().toString(36).slice(2,6).toUpperCase() + String(new Date().getMinutes()).padStart(2,'0')
    const { data: order, error } = await supabase.from('lunch_orders').insert({ order_code: orderCode, store_id: store.id, customer_name: name.trim(), customer_phone: phone.trim(), note: note.trim(), pickup_slot: slot, total_thb: total }).select().single()
    if (error) { alert('สั่งไม่สำเร็จ: '+error.message); setBusy(false); return }
    const rows = cart.items.map(i=>({ order_id: order.id, menu_item_id: i.item.id, item_name: i.item.name, unit_price_thb: Number(i.item.price_thb), quantity: i.qty }))
    const err2 = (await supabase.from('lunch_order_items').insert(rows)).error
    if (err2) alert('บันทึกรายการไม่ครบ: '+err2.message)
    localStorage.setItem('tl_name', name.trim()); localStorage.setItem('tl_phone', phone.trim())
    localStorage.setItem('tl_my_orders', JSON.stringify([...JSON.parse(localStorage.getItem('tl_my_orders')??'[]'), { code: orderCode, store: store.name, at: Date.now() }]))
    cart.clear(); setCode(orderCode); setBusy(false)
  }
  if (code) return (
    <Overlay><div className="px-2 pb-2 pt-6 text-center">
      <CheckCircle2 size={48} className="mx-auto text-[var(--color-accent)]" strokeWidth={1.7} />
      <h2 className="mt-3 text-lg font-bold tracking-tight">สั่งสำเร็จ</h2>
      <p className="mt-1 text-sm text-[var(--color-text-2)]">รับที่ร้าน {slot} น. · จ่ายเงินสด</p>
      <div className="my-5 rounded-[12px] border border-dashed border-[var(--color-border)] bg-[#fafafa] py-6"><p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-3)]">รหัสรับอาหาร</p><p className="font-mono text-[34px] font-bold tracking-[0.12em]">{code}</p><p className="text-xs text-[var(--color-text-2)]">แคปหน้าจอนี้แล้วยื่นให้ร้าน</p></div>
      <button onClick={onClose} className="w-full rounded-full bg-[var(--color-text)] py-3.5 text-sm font-semibold text-white">เสร็จสิ้น</button>
    </div></Overlay>
  )
  return (
    <Overlay><div>
      <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--color-border)]" />
      <h2 className="text-[15px] font-bold tracking-tight">ตะกร้าของคุณ</h2><p className="text-sm text-[var(--color-text-2)]">{store.name}</p>
      <ul className="mt-3 divide-y divide-[var(--color-border)] rounded-[12px] border border-[var(--color-border)] bg-[#fafafa] px-3.5">
        {cart.items.map(i=>(
          <li key={i.item.id} className="flex items-center gap-3 py-3 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium">{i.item.name}</span>
            <span className="tabular-nums font-bold">฿{(i.qty*Number(i.item.price_thb)).toFixed(0)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between px-1 text-sm font-bold"><span>ยอดรวม</span><span className="tabular-nums">฿{total.toFixed(0)}</span></div>
      <div className="mt-4 grid gap-2.5">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="ชื่อ-นามสกุล" className={input} />
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="เบอร์โทร" inputMode="tel" className={input} />
        <div><p className="mb-1.5 text-sm font-semibold">เวลารับ</p><div className="no-scrollbar flex gap-2 overflow-x-auto">{(store.pickup_slots??[]).map(s=> <button key={s} onClick={()=>setSlot(s)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold tabular-nums ring-1 ${slot===s?'bg-[var(--color-text)] text-white ring-[var(--color-text)]':'bg-white text-[var(--color-text-2)] ring-[var(--color-border)]'}`}>{s}</button>)}</div></div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="หมายเหตุ เช่น ไม่ใส่ผัก" rows={2} className={`${input} resize-none`} />
      </div>
      <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2.5">
        <button onClick={onClose} className="rounded-full border border-[var(--color-border)] bg-white py-3.5 text-sm font-semibold">ยกเลิก</button>
        <button onClick={submit} disabled={busy} className="rounded-full bg-[var(--color-text)] py-3.5 text-sm font-semibold text-white disabled:opacity-50">{busy?'กำลังส่ง…':`สั่งเลย ฿${total.toFixed(0)}`}</button>
      </div>
    </div></Overlay>
  )
}
const input='w-full rounded-[10px] border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-text)] focus:ring-2 focus:ring-black/5'
function Overlay({children}:{children:React.ReactNode}){ return <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40"><div className="max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[16px] bg-white p-4 pb-8">{children}</div></div> }
