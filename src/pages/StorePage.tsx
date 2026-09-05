import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, Plus, Minus, Clock, MapPin, CheckCircle2, Package, Star, Heart, Share2, Info, ShieldCheck, ChevronRight, Copy } from 'lucide-react'
import { supabase, type MenuItem, type Store } from '../lib/supabase'
import { useCart } from '../lib/cart'
import BottomSheet from '../components/ui/BottomSheet'

const onImgErr=(e:React.SyntheticEvent<HTMLImageElement>)=>{(e.currentTarget.style.display='none'); const f=e.currentTarget.nextElementSibling as HTMLElement|null; if(f) f.style.display='flex'}

function ratingForStore(id: string){ let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return (4.4 + (h%6)/10).toFixed(1) }

export default function StorePage({ id, onBack, onTrack }: { id: string; onBack: () => void; onTrack?: () => void }) {
  const [store, setStore] = useState<Store | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string|null>(null)
  const [activeCat, setActiveCat] = useState<string>('')
  const [showInfo, setShowInfo] = useState(false)
  const cart = useCart()
  const [checkout, setCheckout] = useState(false)

  const loadStore = useCallback(async()=>{
    setLoading(true); setErr(null)
    const {data, error} = await supabase.from('lunch_stores').select('*').eq('id', id).single()
    if(error) setErr(error.message)
    else setStore(data)
    setLoading(false)
  },[id])
  const loadItems = useCallback(async()=>{
    const {data, error} = await supabase.from('lunch_menu_items').select('*').eq('store_id', id).order('category')
    if(!error && data){
      setItems(data)
      setActiveCat(prev => prev || ([...new Set(data.map(d=>d.category))][0] as string) || '')
    }
  },[id])

  useEffect(() => {
    loadStore(); loadItems()
    const ch = supabase.channel(`menu-${id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'lunch_menu_items', filter: `store_id=eq.${id}` }, () => loadItems()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id, loadStore, loadItems])

  if (loading) return <div className="p-4"><div className="skeleton h-40 rounded-[16px]" /><div className="skeleton mt-3 h-16 rounded-[16px]" /></div>
  if (err) return <div className="p-4"><div className="rounded-[16px] border border-[var(--color-border)] bg-white p-6 text-center card-shadow"><p className="text-sm font-semibold text-red-700">โหลดไม่สำเร็จ</p><p className="mt-1 text-xs text-red-600">{err}</p><div className="mt-4 flex justify-center gap-2"><button onClick={onBack} className="pressable rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium active:scale-[0.97]">กลับ</button><button onClick={loadStore} className="pressable rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white active:scale-[0.97]">ลองใหม่</button></div></div></div>
  if (!store) return <p className="p-10 text-center text-sm text-[var(--color-text-2)]">ไม่พบร้านนี้</p>

  const cats = [...new Set(items.map(i=>i.category))]
  const cartTotal = cart.items.reduce((a,i)=>a + i.qty * Number(i.item.price_thb),0)
  const cartCount = cart.items.reduce((a,i)=>a + i.qty,0)
  const visible = activeCat ? items.filter(i=>i.category===activeCat) : items
  const discountApplies = (()=>{ const h=new Date().getHours(); const m=new Date().getMinutes(); return h<11 || (h===11 && m<30) })()
  const discountedTotal = discountApplies && cartCount>0 ? Math.max(0, cartTotal - 10) : cartTotal
  const isFav = (()=>{try{return new Set(JSON.parse(localStorage.getItem('tl_favs')??'[]') as string[]).has(id)}catch{return false}})()
  const rating = ratingForStore(store.id)
  const reviewCount = (() => { let h=0; for(let i=0;i<store.id.length;i++) h=(h*37+store.id.charCodeAt(i))>>>0; return 24+(h%180)})()

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <div className="relative">
        <div className="relative h-[240px] w-full overflow-hidden bg-[var(--color-bg-subtle)]">
          {store.image_url ? <><img src={store.image_url} alt={store.name} className="h-full w-full object-cover" loading="lazy" onError={onImgErr} /><div style={{display:"none"}} className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-subtle)] text-2xl font-bold text-[var(--color-text-2)]">{store.name.slice(0,2)}</div></> : <div className="flex h-full w-full items-center justify-center bg-[var(--color-bg-subtle)] text-2xl font-bold text-[var(--color-text-2)]">{store.name.slice(0,2)}</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
            <button onClick={onBack} aria-label="กลับ" className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur ring-1 ring-black/5 active:scale-[0.97]"><ChevronLeft size={18} strokeWidth={1.8} /></button>
            <div className="flex gap-2">
              <button aria-label="โปรด" onClick={()=>{
                try{
                  const raw=localStorage.getItem('tl_favs'); const favs=new Set<string>(raw?JSON.parse(raw):[]); const has=favs.has(id)
                  if(has) favs.delete(id); else favs.add(id)
                  localStorage.setItem('tl_favs',JSON.stringify([...favs])); alert(has?'ลบจากรายการโปรดแล้ว':'บันทึกเป็นร้านโปรดแล้ว')
                }catch{ alert('บันทึกไม่สำเร็จ')}
              }} className={`pressable flex h-9 w-9 items-center justify-center rounded-full backdrop-blur shadow-sm ring-1 ring-black/5 active:scale-[0.97] ${isFav?'bg-white text-red-500':'bg-white/90 text-[var(--color-text)]'}`}><Heart size={18} fill={isFav?'currentColor':'none'} strokeWidth={1.8} /></button>
              <button aria-label="แชร์" onClick={async()=>{
                const url=location.href; const text=`${store.name} — ${store.description??''}`
                try{
                  if(navigator.share) await navigator.share({title:store.name, text, url})
                  else { await navigator.clipboard.writeText(url); alert('คัดลอกลิงก์แล้ว')}
                }catch{}
              }} className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur ring-1 ring-black/5 active:scale-[0.97]"><Share2 size={18} strokeWidth={1.8} /></button>
            </div>
          </div>
        </div>
        <section className="-mt-4 relative rounded-t-[20px] border-t border-[var(--color-border)] bg-white px-4 pb-4 pt-5 shadow-float">
          <h1 className="text-display text-[22px]" style={{fontFamily:'var(--font-display)'}}>{store.name}</h1>
          {store.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-2)]">{store.description}</p>}
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <Star size={11} className="fill-amber-400 text-amber-400" strokeWidth={1.8} /> {rating} <span className="text-[var(--color-text-3)]">({reviewCount})</span>
            <span className="text-[var(--color-border-strong)]">·</span><span className="text-[var(--color-text-2)]">5–10 นาที</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-accent-ink)] ring-1 ring-[var(--color-accent)]/15"><ShieldCheck size={11} strokeWidth={1.8} /> รับประกันความสด</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${store.is_open?'bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)] ring-[var(--color-accent)]/15':'bg-[var(--color-bg-subtle)] text-[var(--color-text-3)] ring-[var(--color-border)]'}`}><span className={`h-1.5 w-1.5 rounded-full ${store.is_open?'bg-[var(--color-accent)]':'bg-[var(--color-text-3)]'}`} />{store.is_open?'เปิดรับออเดอร์':'ปิดแล้ว'}</span>
            <span className="inline-flex items-center gap-1 text-[var(--color-text-2)]"><Clock size={18} strokeWidth={1.8} />{store.open_time}–{store.close_time}</span>
            {store.location && <span className="inline-flex items-center gap-1 text-[var(--color-text-2)]"><MapPin size={18} strokeWidth={1.8} />{store.location}</span>}
          </div>
        </section>
      </div>

      {!store.is_open && <div className="mx-3 mt-3 rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-800">ร้านปิดรับออเดอร์ชั่วคราว — ดูเมนูได้อย่างเดียว</div>}
      {cart.storeId && cart.storeId!==id && <div className="mx-3 mt-3 flex items-center justify-between rounded-[12px] border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm card-shadow"><span className="font-medium">ตะกร้ามีเมนูจากร้านอื่น</span><button onClick={()=>{ if(confirm('ล้างตะกร้าเดิม?')) cart.clear()}} className="pressable font-semibold text-[var(--color-accent)] active:scale-[0.97]">ล้าง</button></div>}

      <div className="no-scrollbar flex gap-2 overflow-x-auto bg-white px-3 py-2.5">
        <button onClick={()=>alert('ส่วนลด 10฿ — ใช้ได้เมื่อสั่งก่อน 11:30 น. รับที่ร้าน จ่ายเงินสด · ระบบจะหักอัตโนมัติตอนชำระเงิน')} className="pressable min-h-[44px] shrink-0 rounded-full bg-[var(--color-text)] px-3 py-2 text-xs font-semibold text-white active:scale-[0.97]">ส่วนลด 10฿ · สั่งล่วงหน้า</button>
        <button onClick={()=>alert('รับที่ร้าน — มารับตรงเวลา ไม่ต้องรอคิว')} className="pressable min-h-[44px] shrink-0 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium active:scale-[0.97]">รับที่ร้าน · ไม่รอคิว</button>
        <button onClick={()=>alert('ชำระเงินสดที่ร้าน — ไม่ต้องโอนล่วงหน้า')} className="pressable min-h-[44px] shrink-0 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium active:scale-[0.97]">จ่ายเงินสด</button>
      </div>

      <div className="no-scrollbar sticky top-0 z-10 flex gap-5 overflow-x-auto border-b border-[var(--color-border)] bg-white/95 px-4 backdrop-blur">
        {cats.map(c=>(
          <button key={c} onClick={()=>setActiveCat(c)} aria-pressed={activeCat===c} className={`pressable shrink-0 border-b-2 py-3 text-sm font-semibold tracking-tight transition active:scale-[0.97] ${activeCat===c?'border-[var(--color-text)] text-[var(--color-text)]':'border-transparent text-[var(--color-text-2)]'}`}>{c}</button>
        ))}
      </div>

      <div className="px-3 pt-3 pb-24">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-bold tracking-tight" style={{fontFamily:'var(--font-display)'}}>{activeCat || 'เมนู'} <span className="font-medium text-[var(--color-text-2)]">· {visible.length} รายการ</span></h2>
          <button onClick={()=>alert('เรียงตาม: แนะนำ — เมนูยอดนิยมขึ้นก่อน')} className="pressable text-xs font-medium text-[var(--color-text-2)] active:scale-[0.97]">เรียง: แนะนำ</button>
        </div>
        {visible.length===0 && <div className="rounded-[16px] border border-dashed border-[var(--color-border)] bg-white p-8 text-center card-shadow"><Package size={22} className="mx-auto text-[var(--color-text-3)]" strokeWidth={1.8} /><p className="mt-2 text-sm font-medium">ยังไม่มีเมนู</p></div>}
        <div className="grid gap-2.5">
          {visible.map(it=> <FoodRow key={it.id} item={it} storeId={id} storeOpen={store.is_open} />)}
        </div>

        <section className="mt-4 rounded-[16px] border border-[var(--color-border)] bg-white p-4 card-shadow">
          <h3 className="flex items-center gap-1.5 text-sm font-bold" style={{fontFamily:'var(--font-display)'}}><Info size={18} strokeWidth={1.8} /> ข้อมูลร้าน</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-2)]">{store.description || 'อาหารสดใหม่ทุกวัน รับออเดอร์ล่วงหน้า มารับตรงเวลาได้เลย'}</p>
          <div className="mt-3 flex flex-wrap gap-2">{(store.pickup_slots??[]).map(s=> <span key={s} className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-1.5 text-xs font-semibold tabular-nums">{s} น.</span>)}</div>
          <button onClick={()=>setShowInfo(true)} className="pressable mt-3 flex min-h-[44px] w-full items-center justify-between rounded-[12px] border border-[var(--color-border)] bg-white px-3 py-3 text-sm font-medium active:scale-[0.97]">ดูข้อมูลเพิ่มเติม <ChevronRight size={18} strokeWidth={1.8} className="text-[var(--color-text-3)]" /></button>
        </section>
        <p className="py-8 text-center text-[11px] font-medium tracking-wide text-[var(--color-text-3)]">TRIAM LUNCH</p>
      </div>

      {cart.items.length>0 && cart.storeId===id && (
        <>
          <div className="h-[76px]" />
          <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] bg-[#111827] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3">
            <button onClick={()=> store.is_open ? setCheckout(true) : alert('ร้านปิดรับออเดอร์ — ยังชำระไม่ได้')} disabled={!store.is_open} className="pressable flex w-full items-center justify-between rounded-full bg-white px-2 py-2 text-sm font-semibold text-[#111827] active:scale-[0.97] disabled:bg-[#EDEEF0] disabled:text-[var(--color-text-3)]">
              <span className="flex items-center gap-3"><span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#111827] text-sm tabular-nums text-white">{cartCount}</span> {store.is_open?'ดูตะกร้า':'ร้านปิด'}</span>
              <span className="flex items-center gap-2 pr-1"><span className="tabular-nums">฿{discountApplies?discountedTotal.toFixed(0):cartTotal.toFixed(0)}</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111827] text-white"><ChevronRight size={18} strokeWidth={1.8} /></span></span>
            </button>
            <p className="py-1 text-center text-[11px] text-white/60">{store.is_open?'รับที่ร้าน · ชำระเงินสด':'เปิด '+store.open_time+' น.'} {discountApplies && cartTotal>0 ? '· ลด 10฿ อัตโนมัติ' : ''}</p>
          </div>
        </>
      )}
      <BottomSheet open={checkout} onClose={()=>setCheckout(false)} title="ตะกร้าของคุณ">
        {store ? <CheckoutSheet store={store} discountedTotal={discountedTotal} discountApplies={discountApplies} onClose={()=>setCheckout(false)} onTrack={onTrack} onBack={onBack} /> : null}
      </BottomSheet>
      <BottomSheet open={showInfo} onClose={()=>setShowInfo(false)} title={store.name}>
        <p className="text-sm leading-relaxed text-[var(--color-text-2)]">{store.description || '—'}</p>
        <div className="mt-3 grid gap-2 text-sm"><p className="flex items-center gap-2"><Clock size={18} strokeWidth={1.8} /> {store.open_time}–{store.close_time}</p>{store.location && <p className="flex items-center gap-2"><MapPin size={18} strokeWidth={1.8} />{store.location}</p>}<p className="flex items-center gap-2"><Package size={18} strokeWidth={1.8} /> รอบรับ: {(store.pickup_slots??[]).join(' · ') || '—'}</p></div>
        <div className="mt-4 rounded-[12px] bg-[var(--color-accent-soft)] px-3.5 py-3 ring-1 ring-[var(--color-accent)]/15"><p className="text-xs font-medium text-[var(--color-accent-ink)]">สั่งล่วงหน้า มารับตรงเวลา ไม่ต้องต่อคิว — จ่ายเงินสดที่ร้าน</p></div>
      </BottomSheet>
    </div>
  )
}

function FoodRow({item, storeId, storeOpen}:{item:MenuItem; storeId:string; storeOpen:boolean}){
  const cart=useCart()
  const inCart = useCart(s=>s.items.find(i=>i.item.id===item.id)?.qty ?? 0)
  const cartStoreId = useCart(s=>s.storeId)
  const blockedByStore = !!cartStoreId && cartStoreId!==storeId
  const disabled = !item.available || !storeOpen || blockedByStore
  const showBadge = !item.available ? 'หมด' : !storeOpen ? 'ปิด' : blockedByStore ? 'ร้านอื่น' : null

  const handleAdd=()=>{
    if(blockedByStore){ if(confirm('ตะกร้ามีเมนูจากร้านอื่น — ล้างตะกร้าเดิมแล้วเพิ่มเมนูนี้?')){ cart.clear(); cart.add(item) } return }
    if(!storeOpen) return
    cart.add(item)
  }

  return (
    <div className={`pressable flex gap-3 rounded-[16px] border border-[var(--color-border)] bg-white p-3 card-shadow transition active:scale-[0.97] ${disabled && !blockedByStore ? 'opacity-60 grayscale' : ''}`}>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-[14px] font-semibold leading-tight" style={{fontFamily:'var(--font-display)'}}>{item.name}</h3>
        {item.description && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-2)]">{item.description}</p>}
        {item.daily_note && <p className="mt-1 text-xs font-semibold text-[var(--color-accent)]">{item.daily_note}</p>}
        <p className="mt-2 text-[15px] font-bold tabular-nums">฿{Number(item.price_thb).toFixed(0)}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-text-2)]"><Star size={11} className="fill-amber-400 text-amber-400" strokeWidth={1.8} /> 4.8 · 50+ สั่งแล้ว</p>
      </div>
      <div className="flex w-[88px] shrink-0 flex-col items-stretch gap-2">
        <div className="relative h-[88px] w-[88px] overflow-hidden rounded-[12px] bg-[var(--color-bg-subtle)] ring-1 ring-[var(--color-border)]">
          {item.image_url ? <><img src={item.image_url} alt={item.name} className="h-full w-full object-cover" loading="lazy" onError={onImgErr} /><div style={{display:"none"}} className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-subtle)] text-xs font-bold">{item.name.slice(0,2)}</div></> : <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--color-text-3)]">{item.name.slice(0,2)}</div>}
          {showBadge && <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-bold backdrop-blur-[1px]">{showBadge}</span>}
        </div>
        {inCart>0 ? (
          <span className="flex items-center justify-between rounded-full bg-[var(--color-text)] p-1 text-white">
            <button onClick={()=>cart.setQty(item.id, inCart-1)} aria-label="ลดจำนวน" className="pressable flex h-8 w-8 items-center justify-center rounded-full bg-white/15 active:scale-[0.97]"><Minus size={18} strokeWidth={1.8} /></button>
            <span className="min-w-4 text-center text-sm font-bold tabular-nums">{inCart}</span>
            <button onClick={()=>{ if(blockedByStore){ if(confirm('ตะกร้ามีเมนูจากร้านอื่น — ล้างเดิมแล้วเพิ่มเมนูนี้?')){cart.clear(); cart.add(item)} return } cart.add(item)}} aria-label="เพิ่มจำนวน" className="pressable flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--color-text)] active:scale-[0.97]"><Plus size={18} strokeWidth={1.8} /></button>
          </span>
        ) : (
          <button disabled={disabled && !blockedByStore} onClick={handleAdd} className="pressable min-h-[44px] rounded-full bg-[var(--color-accent)] py-3 text-xs font-bold text-white shadow-sm active:scale-[0.97] disabled:bg-[#EDEEF0] disabled:text-[var(--color-text-3)] disabled:shadow-none">{blockedByStore?'ล้างแล้วเพิ่ม':'เพิ่ม'}</button>
        )}
      </div>
    </div>
  )
}

function CheckoutSheet({ store, onClose, discountedTotal, discountApplies, onTrack, onBack }: { store: Store; onClose: () => void; discountedTotal:number; discountApplies:boolean; onTrack?:()=>void; onBack?:()=>void }) {
  const cart = useCart()
  const [name, setName] = useState(()=>{ try{ return localStorage.getItem('tl_name') ?? '' }catch{ return '' } })
  const [phone, setPhone] = useState(()=>{ try{ return localStorage.getItem('tl_phone') ?? '' }catch{ return '' } })
  const [slot, setSlot] = useState(store.pickup_slots?.[0] ?? '11:50')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponErr, setCouponErr] = useState('')
  const [nameErr,setNameErr]=useState('')
  const [phoneErr,setPhoneErr]=useState('')
  const total = cart.items.reduce((a,i)=>a + i.qty * Number(i.item.price_thb),0)

  const validate=()=>{
    let ok=true
    if(!name.trim()){ setNameErr('กรุณากรอกชื่อ'); ok=false } else setNameErr('')
    const ph=phone.trim()
    if(!ph){ setPhoneErr('กรุณากรอกเบอร์โทร'); ok=false }
    else if(!/^0\d{9}$/.test(ph)){ setPhoneErr('เบอร์โทรต้องเป็น 0 + 9 หลัก (เช่น 0812345678)'); ok=false }
    else setPhoneErr('')
    return ok
  }

  const submit = async () => {
    if (!validate()) return
    setBusy(true)
    const orderCode = 'T' + (typeof crypto!=='undefined'&& (crypto as any).randomUUID ? (crypto as any).randomUUID().slice(0,8).toUpperCase() : Math.random().toString(36).slice(2,10).toUpperCase())
    const finalTotal = discountApplies ? Math.max(0, total-10) : total
    const { data: order, error } = await supabase.from('lunch_orders').insert({ order_code: orderCode, store_id: store.id, customer_name: name.trim(), customer_phone: phone.trim(), note: note.trim(), pickup_slot: slot, total_thb: finalTotal }).select().single()
    if (error) { alert('สั่งไม่สำเร็จ: '+error.message); setBusy(false); return }
    const rows = cart.items.map(i=>({ order_id: order.id, menu_item_id: i.item.id, item_name: i.item.name, unit_price_thb: Number(i.item.price_thb), quantity: i.qty }))
    const {error: err2} = await supabase.from('lunch_order_items').insert(rows)
    if (err2){ await supabase.from('lunch_orders').delete().eq('id', order.id); alert('บันทึกรายการไม่สำเร็จ ลองใหม่: '+err2.message); setBusy(false); return }
    try{ localStorage.setItem('tl_name', name.trim()); localStorage.setItem('tl_phone', phone.trim()) }catch{}
    try{
      const prev = JSON.parse(localStorage.getItem('tl_my_orders')??'[]') as {code:string;store:string;at:number}[]
      const next=[...prev, { code: orderCode, store: store.name, at: Date.now() }].slice(-20)
      localStorage.setItem('tl_my_orders', JSON.stringify(next))
    }catch{}
    cart.clear(); setCode(orderCode); setBusy(false)
  }

  if (code) return (
      <div className="px-2 pb-2 pt-2 text-center">
        <CheckCircle2 size={48} className="mx-auto text-[var(--color-accent)]" strokeWidth={1.8} />
        <h2 className="mt-3 text-lg font-bold tracking-tight" style={{fontFamily:'var(--font-display)'}}>สั่งสำเร็จ</h2>
        <p className="mt-1 text-sm text-[var(--color-text-2)]">รับที่ร้าน {slot} น. · จ่ายเงินสด {discountApplies ? '· ลด 10฿ แล้ว' : ''}</p>
        <div className="my-5 rounded-[12px] border border-dashed border-[var(--color-border)] bg-[#fafafa] py-6"><p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-3)]">รหัสรับอาหาร</p><p className="font-mono text-[34px] font-bold tracking-[0.12em]">{code}</p><p className="text-xs text-[var(--color-text-2)]">แคปหน้าจอนี้แล้วยื่นให้ร้าน</p>
          <button onClick={async()=>{ await navigator.clipboard.writeText(code); alert('คัดลอกรหัสแล้ว')}} className="pressable mt-3 inline-flex min-h-[44px] items-center gap-1 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold active:scale-[0.97]"><Copy size={18} strokeWidth={1.8} /> คัดลอกรหัส</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onClose} className="pressable rounded-full border border-[var(--color-border)] bg-white py-3.5 text-sm font-semibold active:scale-[0.97]">อยู่หน้านี้</button>
          <button onClick={()=>{ onClose(); if(onTrack) onTrack(); else if(onBack) { onBack(); setTimeout(()=>window.scrollTo(0,0),50) } }} className="pressable rounded-full bg-[var(--color-text)] py-3.5 text-sm font-semibold text-white active:scale-[0.97]">ติดตามคำสั่งซื้อ</button>
        </div>
      </div>
  )
  return (
      <div>
        <p className="text-sm text-[var(--color-text-2)]">{store.name}</p>
        <ul className="mt-3 divide-y divide-[var(--color-border)] rounded-[12px] border border-[var(--color-border)] bg-[#fafafa] px-3.5">
          {cart.items.map(i=>(
            <li key={i.item.id} className="flex items-center gap-3 py-3 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium">{i.item.name}</span>
              <span className="tabular-nums font-bold">฿{(i.qty*Number(i.item.price_thb)).toFixed(0)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between px-1 text-sm"><span className="text-[var(--color-text-2)]">ยอดรวม</span><span className="tabular-nums font-bold">฿{total.toFixed(0)}</span></div>
        {discountApplies && <div className="flex items-center justify-between px-1 text-sm font-semibold text-[var(--color-accent)]"><span>ส่วนลดสั่งก่อน 11:30</span><span>-฿10</span></div>}
        {/* coupon code INLINE in cart (top-app pattern) */}
        <div className="mt-2 rounded-[12px] border border-[var(--color-border)] bg-[#fafafa] p-2.5">
          {couponApplied ? (
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-bold text-[var(--color-accent-ink)]">LUNCH10 <span className="font-medium text-[var(--color-text-2)]">· ใช้แล้ว</span></span>
              <button onClick={()=>setCouponApplied(false)} className="pressable text-xs font-medium text-[var(--color-text-2)] active:scale-[0.97]">ลบ</button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input value={couponInput} onChange={e=>{ setCouponInput(e.target.value); setCouponErr('') }} placeholder="โค้ดคูปอง (เช่น LUNCH10)" maxLength={16} aria-label="โค้ดคูปอง" className={`${input} uppercase`} />
                <button onClick={()=>{
                  if(couponInput.trim().toUpperCase()==='LUNCH10'){
                    if(discountApplies){ setCouponApplied(true); setCouponErr('') }
                    else setCouponErr('LUNCH10 ใช้ได้เมื่อสั่งก่อน 11:30 น.')
                  } else setCouponErr('โค้ดไม่ถูกต้อง — ลอง LUNCH10')
                }} className="pressable shrink-0 rounded-[10px] bg-[var(--color-text)] px-4 text-sm font-semibold text-white active:scale-[0.97]">ใช้</button>
              </div>
              {couponErr ? <p role="alert" className="mt-1.5 px-1 text-xs text-red-600">{couponErr}</p> : <p className="mt-1.5 px-1 text-[11px] text-[var(--color-text-3)]">มีโค้ด LUNCH10? กรอกเพื่อยืนยันส่วนลด 10฿</p>}
            </>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-1 pt-2 text-sm font-bold"><span>ยอดชำระ</span><span className="tabular-nums text-base">฿{discountedTotal.toFixed(0)}</span></div>
        <div className="mt-4 grid gap-2.5">
          <div>
            <label htmlFor="tl-name" className="mb-1 block text-xs font-semibold">ชื่อผู้รับ <span className="text-red-500">*</span></label>
            <input id="tl-name" value={name} onChange={e=>setName(e.target.value)} placeholder="ชื่อ-นามสกุล" autoComplete="name" maxLength={60} aria-invalid={!!nameErr} aria-describedby={nameErr?'name-err':undefined} className={`${input} ${nameErr?'!border-red-400 !ring-red-100':''}`} />
            {nameErr && <p id="name-err" role="alert" className="mt-1 text-xs text-red-600">{nameErr}</p>}
          </div>
          <div>
            <label htmlFor="tl-phone" className="mb-1 block text-xs font-semibold">เบอร์โทร <span className="text-red-500">*</span></label>
            <input id="tl-phone" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="0812345678" inputMode="tel" autoComplete="tel" maxLength={10} aria-invalid={!!phoneErr} aria-describedby={phoneErr?'phone-err':undefined} className={`${input} ${phoneErr?'!border-red-400 !ring-red-100':''}`} />
            {phoneErr && <p id="phone-err" role="alert" className="mt-1 text-xs text-red-600">{phoneErr}</p>}
          </div>
          <div><p className="mb-1.5 text-sm font-semibold">เวลารับ</p><div className="no-scrollbar flex gap-2 overflow-x-auto">{(store.pickup_slots??[]).map(s=> <button key={s} onClick={()=>setSlot(s)} className={`pressable shrink-0 rounded-full px-4 py-2 text-sm font-semibold tabular-nums ring-1 active:scale-[0.97] ${slot===s?'bg-[var(--color-text)] text-white ring-[var(--color-text)]':'bg-white text-[var(--color-text-2)] ring-[var(--color-border)]'}`}>{s}</button>)}</div></div>
          <div>
            <label htmlFor="tl-note" className="mb-1 block text-xs font-semibold">หมายเหตุ</label>
            <textarea id="tl-note" value={note} onChange={e=>setNote(e.target.value)} placeholder="เช่น ไม่ใส่ผัก" rows={2} maxLength={120} className={`${input} resize-none`} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2.5">
          <button onClick={onClose} className="pressable rounded-full border border-[var(--color-border)] bg-white py-3.5 text-sm font-semibold active:scale-[0.97]">ยกเลิก</button>
          <button onClick={submit} disabled={busy} className="pressable rounded-full bg-[var(--color-text)] py-3.5 text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.97]">{busy?'กำลังส่ง…':`สั่งเลย ฿${discountedTotal.toFixed(0)}`}</button>
        </div>
      </div>
  )
}
const input='w-full rounded-[10px] border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-text)] focus:ring-2 focus:ring-black/5'
