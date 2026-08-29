import { useEffect, useState } from 'react'
import { ChevronLeft, Plus, Minus, Clock, MapPin, CheckCircle2, Package, Star, Heart, Share2, Info, Flame } from 'lucide-react'
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
  if (!store) return <p className="p-10 text-center text-sm text-neutral-400">ไม่พบร้านนี้</p>

  const cats = [...new Set(items.map(i=>i.category))]
  const cartTotal = cart.items.reduce((a,i)=>a + i.qty * Number(i.item.price_thb),0)
  const cartCount = cart.items.reduce((a,i)=>a + i.qty,0)
  const visibleItems = activeCat ? items.filter(i=>i.category===activeCat) : items

  return (
    <div className="min-h-dvh bg-[#f5f5f5]">
      {/* HERO — image placeholder like Grab */}
      <div className="relative">
        <div className="h-[168px] bg-gradient-to-br from-orange-400 via-red-500 to-pink-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <button onClick={onBack} className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow"><ChevronLeft size={20} /></button>
        <div className="absolute right-3 top-3 flex gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow"><Heart size={16} /></button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow"><Share2 size={16} /></button>
        </div>
        <div className="absolute inset-x-4 bottom-3 flex items-end gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-extrabold shadow-lg">{store.name.slice(0,2)}</div>
          <div className="min-w-0 flex-1 pb-1 text-white drop-shadow">
            <h1 className="truncate text-[18px] font-extrabold leading-tight">{store.name}</h1>
            <p className="flex items-center gap-1 text-xs text-white/90"><Star size={11} className="fill-amber-300 text-amber-300" /> 4.8 (120) • 5–10 นาที • โรงอาหาร</p>
          </div>
        </div>
      </div>

      {/* INFO BAR */}
      <div className="flex items-center gap-2 bg-white px-4 py-2.5 text-xs">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${store.is_open?'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200':'bg-neutral-100 text-neutral-500'}`}><span className={`h-1.5 w-1.5 rounded-full ${store.is_open?'bg-emerald-500':'bg-neutral-400'}`} />{store.is_open?'เปิดรับออเดอร์':'ปิดแล้ว'}</span>
        <span className="flex items-center gap-1 text-neutral-500"><Clock size={12} />{store.open_time}–{store.close_time}</span>
        {store.location && <span className="flex items-center gap-1 truncate text-neutral-500"><MapPin size={12} />{store.location}</span>}
      </div>
      {!store.is_open && <div className="mx-3 mt-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-800 ring-1 ring-amber-200">ร้านปิดรับออเดอร์ชั่วคราว — เลือกเมนูไว้ก่อนได้</div>}
      {cart.storeId && cart.storeId!==id && <div className="mx-3 mt-2 flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-sm shadow ring-1 ring-black/5"><span>ตะกร้ามีเมนูจากร้านอื่น</span><button onClick={()=>cart.clear()} className="font-bold text-[#ff5722]">ล้างตะกร้า</button></div>}

      {/* PROMO STRIP like Grab */}
      <div className="mt-2 flex gap-2 overflow-x-auto bg-white px-3 py-2.5 no-scrollbar">
        <span className="shrink-0 rounded-full bg-[#ff5722] px-3 py-1.5 text-xs font-bold text-white">🔥 ลด 10฿ เมื่อสั่งล่วงหน้า</span>
        <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold">รับที่ร้าน • ไม่ต้องรอคิว</span>
        <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">✓ จ่ายเงินสดตอนรับ</span>
      </div>

      {/* CATEGORY TABS — sticky like Foodpanda */}
      <div className="sticky top-0 z-10 mt-2 flex gap-2 overflow-x-auto bg-white px-3 py-2 shadow-sm no-scrollbar">
        {cats.map(c=>(
          <button key={c} onClick={()=>setActiveCat(c)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${activeCat===c?'bg-[#ff5722] text-white shadow':'bg-neutral-100 text-neutral-600'}`}>{c}</button>
        ))}
      </div>

      {/* POPULAR / MENU LIST — card with image like real apps */}
      <div className="px-3 pt-3">
        <h2 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-extrabold"><Flame size={14} className="text-[#ff5722]" /> {activeCat || 'เมนูทั้งหมด'} <span className="font-normal text-neutral-400">({visibleItems.length})</span></h2>
        {visibleItems.length===0 && <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5"><Package size={28} className="mx-auto text-neutral-300" /><p className="mt-2 text-sm font-semibold">ยังไม่มีเมนูในหมวดนี้</p></div>}
        <div className="grid gap-2.5">
          {visibleItems.map(it=> <FoodCard key={it.id} item={it} disabled={!it.available || !store.is_open} />)}
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-black/5">
          <h3 className="flex items-center gap-1.5 text-sm font-bold"><Info size={14} /> ข้อมูลร้าน</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{store.description || 'อาหารสดใหม่ทุกวัน รับออเดอร์ล่วงหน้า มารับตรงเวลาได้เลย'}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {(store.pickup_slots??[]).map(s=> <span key={s} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold tabular-nums">{s} น.</span>)}
          </div>
        </div>
        <p className="py-8 text-center text-[11px] text-neutral-400">Triam Lunch</p>
      </div>

      {cartCount>0 && cart.storeId===id && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] bg-white px-4 pb-safe pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <button onClick={()=>setCheckout(true)} className="flex w-full items-center justify-between rounded-full bg-[#ff5722] px-2 py-2 font-bold text-white shadow-lg">
            <span className="flex items-center gap-3"><span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white/20 text-sm">{cartCount}</span><span className="text-sm">ดูตะกร้า</span></span>
            <span className="flex items-center gap-2 pr-1"><span className="tabular-nums">฿{cartTotal.toFixed(0)}</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#ff5722]"><ChevronLeft size={16} className="rotate-180" /></span></span>
          </button>
        </div>
      )}
      {checkout && store && <CheckoutSheet store={store} onClose={()=>setCheckout(false)} />}
    </div>
  )
}

function FoodCard({item,disabled}:{item:MenuItem;disabled?:boolean}){
  const inCart = useCart(s=>s.items.find(i=>i.item.id===item.id)?.qty ?? 0)
  return (
    <div className={`flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5 ${!item.available || disabled ? 'opacity-50':''}`}>
      <div className="h-[84px] w-[84px] shrink-0 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 ring-1 ring-black/5 flex items-center justify-center text-2xl">{item.name.charAt(0)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[14px] font-bold leading-tight">{item.name}</h3>
          <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">ขายดี</span>
        </div>
        {item.description && <p className="line-clamp-1 text-xs text-neutral-500">{item.description}</p>}
        {item.daily_note && <p className="text-xs font-semibold text-[#ff5722]">{item.daily_note}</p>}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-[15px] font-extrabold tabular-nums">฿{Number(item.price_thb).toFixed(0)}</span>
          <span className="text-xs text-neutral-400 line-through">฿{(Number(item.price_thb)+10).toFixed(0)}</span>
          <span className="rounded bg-red-500 px-1 py-0.5 text-[10px] font-bold text-white">-10฿</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400"><Star size={10} className="fill-amber-400 text-amber-400" /> 4.8 • 50+ สั่งแล้ว</div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between">
        {inCart>0 ? (
          <div className="flex items-center gap-1 rounded-full bg-[#ff5722] p-1 text-white">
            <button onClick={()=>useCart.getState().setQty(item.id, inCart-1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20"><Minus size={14} /></button>
            <span className="min-w-5 text-center text-sm font-bold tabular-nums">{inCart}</span>
            <button onClick={()=>useCart.getState().add(item)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#ff5722]"><Plus size={14} /></button>
          </div>
        ) : (
          <button disabled={disabled} onClick={()=>useCart.getState().add(item)} className="rounded-full bg-[#ff5722] px-4 py-2 text-xs font-extrabold text-white shadow disabled:bg-neutral-200 disabled:text-neutral-400">เพิ่ม</button>
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
    <Overlay><div className="sheet-in px-2 pb-2 pt-6 text-center">
      <CheckCircle2 size={56} className="mx-auto text-emerald-500" strokeWidth={1.6} />
      <h2 className="mt-3 text-lg font-extrabold">สั่งสำเร็จ!</h2>
      <p className="mt-1 text-sm text-neutral-500">รับที่ร้าน {slot} น. · จ่ายเงินสด</p>
      <div className="my-5 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 py-6"><p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">รหัสรับอาหาร</p><p className="font-mono text-[36px] font-black tracking-[0.12em]">{code}</p><p className="text-xs text-neutral-500">แคปหน้าจอนี้แล้วยื่นให้ร้าน</p></div>
      <button onClick={onClose} className="w-full rounded-full bg-[#ff5722] py-3.5 text-sm font-extrabold text-white">เสร็จสิ้น</button>
    </div></Overlay>
  )
  return (
    <Overlay><div className="sheet-in">
      <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-neutral-200" />
      <h2 className="text-lg font-extrabold">ตะกร้าของคุณ</h2><p className="text-sm text-neutral-500">{store.name}</p>
      <ul className="mt-3 divide-y divide-neutral-100 rounded-2xl bg-neutral-50 px-3.5">
        {cart.items.map(i=>(
          <li key={i.item.id} className="flex items-center gap-3 py-3 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium">{i.item.name}</span>
            <span className="tabular-nums font-bold">฿{(i.qty*Number(i.item.price_thb)).toFixed(0)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between px-1 text-sm font-extrabold"><span>ยอดรวม</span><span className="tabular-nums text-[#ff5722]">฿{total.toFixed(0)}</span></div>
      <div className="mt-4 grid gap-2.5">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="ชื่อ-นามสกุล" className={input} />
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="เบอร์โทร" inputMode="tel" className={input} />
        <div><p className="mb-1.5 text-sm font-bold">เวลารับ</p><div className="no-scrollbar flex gap-2 overflow-x-auto">{(store.pickup_slots??[]).map(s=> <button key={s} onClick={()=>setSlot(s)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold tabular-nums ${slot===s?'bg-[#ff5722] text-white':'bg-neutral-100 text-neutral-600'}`}>{s}</button>)}</div></div>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="หมายเหตุ เช่น ไม่ใส่ผัก" rows={2} className={`${input} resize-none`} />
      </div>
      <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2.5">
        <button onClick={onClose} className="rounded-full bg-neutral-100 py-3.5 text-sm font-bold">ยกเลิก</button>
        <button onClick={submit} disabled={busy} className="rounded-full bg-[#ff5722] py-3.5 text-sm font-extrabold text-white disabled:opacity-50">{busy?'กำลังส่ง…':`สั่งเลย ฿${total.toFixed(0)}`}</button>
      </div>
    </div></Overlay>
  )
}
const input='w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#ff5722] focus:ring-2 focus:ring-orange-100'
function Overlay({children}:{children:React.ReactNode}){ return <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40"><div className="max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl bg-white p-4 pb-8">{children}</div></div> }
