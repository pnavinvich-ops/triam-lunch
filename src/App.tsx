import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Search, MapPin, Star, Heart, ChevronRight, Home as HomeIcon, ReceiptText, Store as StoreIcon, SlidersHorizontal, Clock3, RotateCcw, Bookmark, Ticket, Crown, UtensilsCrossed, Soup, Coffee, Cookie, Beef, Sandwich, X, Check } from 'lucide-react'
import { supabase, type Store as StoreType, type MenuItem } from './lib/supabase'
import { useCart } from './lib/cart'
import StorePage from './pages/StorePage'
import OwnerHome, { TrackOrderView } from './pages/OwnerHome'

type Tab = 'home' | 'track' | 'owner'
export type View = { page: 'home' } | { page: 'store'; id: string }

// — helpers
function ratingFor(id: string){ let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return (4.4 + (h%6)/10).toFixed(1) }
function reviewsFor(id: string){ let h=0; for(let i=0;i<id.length;i++) h=(h*37+id.charCodeAt(i))>>>0; return 24 + (h%180) }
function safeParse<T>(key:string, fallback:T):T{ try{ const v=localStorage.getItem(key); return v? JSON.parse(v) as T : fallback }catch{ return fallback } }

const CAT_DEFS: { id: string; label: string; Icon: typeof UtensilsCrossed; bg: string; fg: string }[] = [
  { id:'all', label:'ทั้งหมด', Icon: UtensilsCrossed, bg:'bg-neutral-900', fg:'text-white' },
  { id:'ข้าว', label:'ข้าว', Icon: Beef, bg:'bg-orange-50', fg:'text-orange-700' },
  { id:'ก๋วยเตี๋ยว', label:'ก๋วยเตี๋ยว', Icon: Soup, bg:'bg-amber-50', fg:'text-amber-700' },
  { id:'ของว่าง', label:'ของว่าง', Icon: Sandwich, bg:'bg-red-50', fg:'text-red-700' },
  { id:'เครื่องดื่ม', label:'เครื่องดื่ม', Icon: Coffee, bg:'bg-sky-50', fg:'text-sky-700' },
  { id:'ของหวาน', label:'ของหวาน', Icon: Cookie, bg:'bg-violet-50', fg:'text-violet-700' },
]

const onImgErr=(e:React.SyntheticEvent<HTMLImageElement>)=>{(e.currentTarget.style.display='none'); const p=e.currentTarget.nextElementSibling as HTMLElement|null; if(p) p.style.display='flex'}

export default function App(){
  const [tab,setTab]=useState<Tab>('home')
  const [view,setView]=useState<View>({page:'home'})
  const [stores,setStores]=useState<StoreType[]>([])
  const [loading,setLoading]=useState(true)
  const [loadErr,setLoadErr]=useState<string|null>(null)
  const cartCount=useCart(s=>s.items.reduce((a,i)=>a+i.qty,0))

  const loadStores=useCallback(async()=>{
    setLoading(true); setLoadErr(null)
    const {data, error} = await supabase.from('lunch_stores').select('*').order('name')
    if(error) setLoadErr(error.message)
    else setStores(data??[])
    setLoading(false)
  },[])
  useEffect(()=>{ loadStores() },[loadStores])

  return (
    <div className="min-h-dvh">
      <main className={`mx-auto max-w-[480px] ${view.page==='store'?'pb-24':'pb-[64px]'}`}>
        {view.page==='store' && <StorePage id={view.id} onBack={()=>setView({page:'home'})} onTrack={()=>{ setView({page:'home'}); setTab('track') }} />}
        {view.page==='home' && tab==='home' && <Home stores={stores} loading={loading} loadErr={loadErr} onRetry={loadStores} onOpen={id=>setView({page:'store',id})} />}
        {view.page==='home' && tab==='track' && <TrackOrderView />}
        {view.page==='home' && tab==='owner' && <OwnerHome onBackHome={()=>setTab('home')} />}
      </main>
      {view.page!=='store' && (
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-[var(--color-border)] bg-white pb-safe">
          <div className="grid grid-cols-3">
            <TabBtn Icon={HomeIcon} label="หน้าแรก" active={tab==='home'} onClick={()=>setTab('home')} />
            <TabBtn Icon={ReceiptText} label="คำสั่งซื้อ" active={tab==='track'} onClick={()=>setTab('track')} badge={cartCount||undefined} />
            <TabBtn Icon={StoreIcon} label="จัดการร้าน" active={tab==='owner'} onClick={()=>setTab('owner')} />
          </div>
        </nav>
      )}
    </div>
  )
}
function TabBtn({Icon,label,active,onClick,badge}:{Icon:typeof HomeIcon;label:string;active?:boolean;onClick:()=>void;badge?:number}){
  return (
    <button onClick={onClick} aria-label={label} className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold tracking-wide ${active?'text-[var(--color-text)]':'text-[var(--color-text-3)]'}`}>
      <span className="relative"><Icon size={22} strokeWidth={active?2.2:1.7} />{badge!=null && <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">{badge}</span>}</span>
      {label}
    </button>
  )
}

function Home({stores,loading,loadErr,onRetry,onOpen}:{stores:StoreType[];loading:boolean;loadErr:string|null;onRetry:()=>void;onOpen:(id:string)=>void}){
  const [q,setQ]=useState('')
  const [qDebounced,setQDebounced]=useState('')
  const [cat,setCat]=useState('all')
  const [mode,setMode]=useState<'pickup'|'preorder'>('pickup')
  const [favs,setFavs]=useState<Set<string>>(()=> safeParse<string[]>('tl_favs',[] ) as unknown as Set<string> && new Set(safeParse<string[]>('tl_favs',[])))
  const [recent,setRecent]=useState<string[]>(()=> safeParse<string[]>('tl_recent_q',[]))
  const [popular,setPopular]=useState<MenuItem[]>([])
  const [popErr,setPopErr]=useState<string|null>(null)
  const [menuIndex,setMenuIndex]=useState<{store_id:string;name:string;category:string}[]>([])
  const [showFilter,setShowFilter]=useState(false)
  const [showCoupon,setShowCoupon]=useState(false)
  const [showLocation,setShowLocation]=useState(false)
  const [filterOpenOnly,setFilterOpenOnly]=useState(false)
  const [sortBy,setSortBy]=useState<'default'|'rating'|'reviews'>('default')
  const [favOnly,setFavOnly]=useState(false)
  const qInputRef=useRef<HTMLInputElement>(null)

  const toggleFav=(id:string)=>{ const n=new Set(favs); n.has(id)?n.delete(id):n.add(id); setFavs(n); try{ localStorage.setItem('tl_favs',JSON.stringify([...n])) }catch{} }

  useEffect(()=>{
    supabase.from('lunch_menu_items').select('*').eq('available',true).limit(12).then(({data,error})=>{
      if(error) setPopErr(error.message); else setPopular(data??[])
    })
    supabase.from('lunch_menu_items').select('store_id,name,category').then(({data})=> setMenuIndex((data??[]) as any))
  },[])

  // debounce search 200ms
  useEffect(()=>{ const t=setTimeout(()=>setQDebounced(q),200); return ()=>clearTimeout(t)},[q])

  const filtered = useMemo(()=>{
    let r=[...stores]
    if(qDebounced.trim()){
      const qq=qDebounced.toLowerCase()
      // search stores + also match via popular menu names (menu search promise fulfilled)
      const menuMatchStoreIds = new Set(menuIndex.filter(m=> m.name.toLowerCase().includes(qq) || (m.category??'').toLowerCase().includes(qq)).map(m=>m.store_id))
      r=r.filter(s=> s.name.toLowerCase().includes(qq) || (s.description??'').toLowerCase().includes(qq) || menuMatchStoreIds.has(s.id))
    }
    if(cat!=='all'){
      // filter by store's menu category — check if any menu item for that store matches cat
      // fallback to name/description includes for stores without menu fetched yet
      const catStoreIds = new Set(menuIndex.filter(m=> (m.category??'').includes(cat) || m.name.includes(cat)).map(m=>m.store_id))
      r=r.filter(s=> catStoreIds.has(s.id))
    }
    if(favOnly) r=r.filter(s=> favs.has(s.id))
    if(filterOpenOnly) r=r.filter(s=> s.is_open)
    if(mode==='preorder') r=[...r].sort((a,b)=> Number(b.is_open)-Number(a.is_open)) // preorder: open first
    if(sortBy==='rating') r=[...r].sort((a,b)=> Number(ratingFor(b.id)) - Number(ratingFor(a.id)))
    if(sortBy==='reviews') r=[...r].sort((a,b)=> reviewsFor(b.id) - reviewsFor(a.id))
    return r
  },[stores,qDebounced,cat,popular,filterOpenOnly,mode,sortBy])

  const onSearch=(v:string)=>{ setQ(v); if(v.trim().length>=2){ const n=[v.trim(), ...recent.filter(x=>x!==v.trim())].slice(0,4); setRecent(n); try{ localStorage.setItem('tl_recent_q',JSON.stringify(n)) }catch{} } }
  useEffect(()=>{ const h=(e:KeyboardEvent)=>{ if(e.key==='Escape'){ setShowFilter(false); setShowCoupon(false); setShowLocation(false)} }; window.addEventListener('keydown',h); return ()=> window.removeEventListener('keydown',h)},[])

  const reorder = safeParse<{code:string;store:string;at:number}[]>('tl_my_orders',[]) 
  const lastOrder = reorder.length ? reorder[reorder.length-1] : null

  const pickupSlotsDisplay = useMemo(()=>{
    const all = stores.flatMap(s=> s.pickup_slots ?? [])
    if(!all.length) return '11:50 · 12:20'
    const uniq=[...new Set(all)].sort()
    return uniq.slice(0,2).join(' · ')
  },[stores])

  return (
    <div className="bg-[var(--color-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white px-4 pb-3 pt-3 card-shadow">
        <div className="flex items-center justify-between">
          <button onClick={()=>setShowLocation(true)} aria-label="เลือกจุดรับอาหาร" className="flex items-center gap-2 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-text)] text-white"><MapPin size={14} /></span>
            <span className="leading-tight">
              <span className="block text-[11px] font-medium tracking-wide text-[var(--color-text-2)]">รับที่</span>
              <span className="flex items-center gap-1 text-[13px] font-semibold">อาคารโรงอาหาร · ม.4–ม.6 <ChevronRight size={12} className="text-[var(--color-text-3)]" /></span>
            </span>
          </button>
          <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-ink)] ring-1 ring-[var(--color-accent)]/15">{stores.filter(s=>s.is_open).length} ร้านเปิด</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[#f3f3f3] px-3.5 py-2.5">
            <Search size={16} className="text-[var(--color-text-3)] shrink-0" />
            <input ref={qInputRef} id="home-search" value={q} onChange={e=>onSearch(e.target.value)} placeholder="ค้นหาร้าน หรือเมนู" aria-label="ค้นหาร้านหรือเมนู" autoComplete="off" maxLength={60} className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-[var(--color-text-3)]" />
            {q && <button onClick={()=>setQ('')} aria-label="ล้างคำค้น" className="rounded-full bg-white p-1 ring-1 ring-[var(--color-border)]"><X size={12} /></button>}
          </div>
          <button onClick={()=>setShowFilter(true)} aria-label="ตัวกรอง" className={`flex h-10 w-10 items-center justify-center rounded-full border bg-white ${filterOpenOnly||sortBy!=='default'?'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]':'border-[var(--color-border)]'}`}><SlidersHorizontal size={16} /></button>
        </div>

        <div className="mt-3 flex gap-2">
          {(['pickup','preorder'] as const).map(m=>(
            <button key={m} onClick={()=>setMode(m)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition ${mode===m ? 'bg-[var(--color-text)] text-white ring-[var(--color-text)]' : 'bg-white text-[var(--color-text)] ring-[var(--color-border)]'}`}>
              {m==='pickup' ? 'รับที่ร้าน' : 'สั่งล่วงหน้า'}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--color-text-2)]"><Clock3 size={12} /> รอบ {pickupSlotsDisplay}</span>
        </div>
        {recent.length>0 && !qDebounced && (
          <div className="mt-2 flex flex-wrap gap-1.5" role="list" aria-label="ค้นหาล่าสุด">
            {recent.map(r=> <button key={r} onClick={()=>setQ(r)} className="rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-text-2)]">{r}</button>)}
            <button onClick={()=>{ setRecent([]); localStorage.removeItem('tl_recent_q')}} className="px-1 text-xs text-[var(--color-text-3)]">ล้าง</button>
          </div>
        )}
      </header>

      {/* Quick actions — now all functional buttons */}
      <section className="bg-white px-4 pb-3 pt-3">
        <div className="grid grid-cols-4 gap-3">
          <button onClick={()=>{ if(lastOrder){ const st=stores.find(x=>x.name===lastOrder.store); if(st) onOpen(st.id); else alert('ไม่พบร้านของออเดอร์ล่าสุด')} else alert('ยังไม่มีประวัติการสั่ง — สั่งอาหารก่อนแล้วจะสั่งซ้ำได้เลย')}} aria-label="สั่งซ้ำ" className="flex flex-col items-center"><Quick Icon={RotateCcw} label="สั่งซ้ำ" sub={lastOrder ? lastOrder.store.slice(0,8) : 'ยังไม่มี'} /></button>
          <button onClick={()=>{
            if(favs.size===0) alert('ยังไม่มีร้านโปรด — กดหัวใจที่ร้านเพื่อบันทึก')
            else { setFavOnly(v=>!v); document.getElementById('store-list')?.scrollIntoView({behavior:'smooth'}) }
          }} aria-label={`รายการโปรด ${favs.size} ร้าน`} className="flex flex-col items-center"><Quick Icon={Bookmark} label="รายการโปรด" sub={favOnly? 'กำลังกรอง' : `${favs.size} ร้าน`} /></button>
          <button onClick={()=>setShowCoupon(true)} aria-label="ดูคูปอง" className="flex flex-col items-center"><Quick Icon={Ticket} label="คูปอง" sub="ลด 10฿" accent /></button>
          <button onClick={()=>alert('Triam Lunch Premium — เร็วๆ นี้: ฟรีค่าส่งทุกออเดอร์ + ส่วนลดพิเศษ')} aria-label="พรีเมียม" className="flex flex-col items-center"><Quick Icon={Crown} label="พรีเมียม" sub="ฟรีค่าส่ง" /></button>
        </div>
      </section>

      {/* Promo — actionable */}
      <section className="bg-white px-4 pb-3">
        <button onClick={()=>setShowCoupon(true)} className="flex w-full items-center gap-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-accent-soft)] p-4 text-left transition active:scale-[0.99]">
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-wide text-[var(--color-accent-ink)]">โปรรอบเที่ยง</p>
            <p className="mt-0.5 text-[15px] font-bold leading-tight text-[var(--color-text)]">สั่งล่วงหน้าก่อน 11:30<br/>ลดทันที 10 บาท</p>
            <p className="mt-1 text-xs font-medium text-[var(--color-text-2)]">แตะเพื่อดูเงื่อนไข · จ่ายเงินสดที่ร้าน</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white ring-1 ring-[var(--color-border)]"><UtensilsCrossed size={28} className="text-[var(--color-accent)]" /></div>
        </button>
      </section>

      {/* Reorder — history */}
      {lastOrder && (
        <section className="bg-white px-4 pb-3 pt-1">
          <SectionHead title="สั่งอีกครั้ง" action="ดูทั้งหมด" onAction={()=>{ const s=stores.find(x=>x.name===lastOrder.store); if(s) onOpen(s.id)}} />
          <div className="card-shadow flex items-center gap-3 rounded-[12px] border border-[var(--color-border)] bg-white p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-text)] text-white text-sm font-bold">{lastOrder.store.slice(0,1)}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{lastOrder.store}</p><p className="text-xs text-[var(--color-text-2)]">รหัส {lastOrder.code} · แตะเพื่อสั่งซ้ำ</p></div>
            <button onClick={()=>{ const s=stores.find(x=>x.name===lastOrder.store); if(s) onOpen(s.id) }} className="rounded-full bg-[var(--color-text)] px-4 py-2 text-xs font-semibold text-white">สั่งซ้ำ</button>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="bg-white px-2 pb-3 pt-3">
        <SectionHead title="หมวดหมู่" />
        <div className="grid grid-cols-4 gap-1">
          {CAT_DEFS.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} aria-pressed={cat===c.id} className={`flex flex-col items-center gap-1.5 rounded-[12px] py-3 ring-1 transition ${cat===c.id ? 'bg-[var(--color-text)] text-white ring-[var(--color-text)]' : 'bg-white ring-[var(--color-border)]'}`}>
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${cat===c.id ? 'bg-white text-[var(--color-text)]' : `${c.bg} ${c.fg}`}`}><c.Icon size={18} /></span>
              <span className={`text-xs font-semibold ${cat===c.id ? 'text-white' : 'text-[var(--color-text)]'}`}>{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* เมนูขายดี — now clickable */}
      {popErr && <p className="bg-white px-4 py-2 text-xs text-red-600">โหลดเมนูขายดีไม่สำเร็จ: {popErr}</p>}
      {popular.length>0 && !popErr && (
        <section className="bg-white px-4 pb-3 pt-3">
          <SectionHead title="เมนูขายดี" action="ดูทั้งหมด" onAction={()=> document.getElementById('store-list')?.scrollIntoView({behavior:'smooth'})} />
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {popular.slice(0,12).map(m=>(
              <button key={m.id} onClick={()=> onOpen(m.store_id)} aria-label={`เปิดร้านของ ${m.name}`} className="w-[148px] shrink-0 overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-white text-left card-shadow">
                <>{m.image_url ? <><img src={m.image_url} alt={m.name} className="h-[96px] w-full object-cover" loading="lazy" onError={onImgErr} /><div style={{display:"none"}} className="flex h-[96px] items-center justify-center bg-[#f3f3f3] text-sm font-bold text-[var(--color-text-2)]">{m.name.slice(0,2)}</div></> : <div className="flex h-[96px] items-center justify-center bg-[#f3f3f3] text-sm font-bold text-[var(--color-text-2)]">{m.name.slice(0,2)}</div>}</>
                <div className="p-2.5">
                  <p className="line-clamp-1 text-sm font-semibold leading-tight">{m.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-2)]">{m.category}</p>
                  <p className="mt-1 text-sm font-bold tabular-nums">฿{Number(m.price_thb).toFixed(0)}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Stores */}
      <section id="store-list" className="bg-white px-3 pb-6 pt-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[14px] font-bold tracking-tight">ร้านในโรงอาหาร</h2>
          <span className="text-xs font-medium text-[var(--color-text-2)]">{filtered.length} ร้าน · {cat==='all' ? 'ทั้งหมด' : CAT_DEFS.find(c=>c.id===cat)?.label}{filterOpenOnly?' · เปิดอยู่':''}</span>
        </div>
        {loadErr && <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-center"><p className="text-sm font-semibold text-red-700">โหลดร้านไม่สำเร็จ</p><p className="mt-1 text-xs text-red-600">{loadErr}</p><button onClick={onRetry} className="mt-3 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white">ลองใหม่</button></div>}
        {loading && !loadErr && <div className="grid gap-3">{[0,1,2].map(i=> <div key={i} className="skeleton h-[108px] rounded-[12px]" />)}</div>}
        {!loading && !loadErr && filtered.length===0 && <EmptyState onClear={()=>{setQ('');setCat('all');setFilterOpenOnly(false)}} />}
        <div className="grid gap-3">
          {filtered.map(s=>{
            const r=ratingFor(s.id), rev=reviewsFor(s.id); const isFav=favs.has(s.id)
            return (
              <div key={s.id} className="card-shadow flex gap-3 rounded-[12px] border border-[var(--color-border)] bg-white p-3">
                <button onClick={()=> s.is_open ? onOpen(s.id) : alert('ร้านปิดรับออเดอร์ — ดูเมนูได้อย่างเดียว')} aria-label={`เปิดร้าน ${s.name}`} className="flex flex-1 gap-3 text-left">
                  <div className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#f3f3f3] ring-1 ring-[var(--color-border)]">
                    {s.image_url ? <><img src={s.image_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" onError={onImgErr} /><span style={{display:"none"}} className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[var(--color-text-2)] bg-[#f3f3f3]">{s.name.slice(0,2)}</span></> : <span className="text-sm font-bold text-[var(--color-text-2)]">{s.name.slice(0,2)}</span>}
                    {!s.is_open && <span className="absolute inset-0 flex items-center justify-center bg-white/85 text-xs font-bold backdrop-blur-[1px]">ปิด</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-[14px] font-semibold leading-tight">{s.name}</h3>
                    {s.description && <p className="line-clamp-1 text-xs leading-relaxed text-[var(--color-text-2)]">{s.description}</p>}
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      <span className="font-semibold tabular-nums">{r}</span>
                      <span className="text-[var(--color-text-3)]">({rev})</span>
                      <span className="text-[var(--color-border-strong)]">·</span>
                      <span className="text-[var(--color-text-2)]">{s.is_open ? '5–10 นาที' : 'ปิดอยู่'}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${s.is_open ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)] ring-[var(--color-accent)]/20' : 'bg-[#f3f3f3] text-[var(--color-text-3)] ring-[var(--color-border)]'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.is_open?'bg-[var(--color-accent)]':'bg-[var(--color-text-3)]'}`} />{s.is_open ? 'เปิด' : 'ปิด'}
                      </span>
                      <span className="rounded-full bg-[#f3f3f3] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--color-text-2)]">{s.pickup_slots?.[0] ?? '11:50'} รับที่ร้าน</span>
                    </div>
                  </div>
                </button>
                <button onClick={e=>{e.stopPropagation(); toggleFav(s.id)}} aria-label={isFav?'ลบจากรายการโปรด':'บันทึกเป็นร้านโปรด'} className={`self-start flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${isFav ? 'border-red-200 bg-red-50 text-red-500' : 'border-[var(--color-border)] bg-white text-[var(--color-text-3)]'}`}>
                  <Heart size={14} fill={isFav?'currentColor':'none'} />
                </button>
              </div>
            )
          })}
        </div>
        <p className="pt-6 text-center text-[11px] font-medium tracking-wide text-[var(--color-text-3)]">TRIAM LUNCH · โรงเรียนเตรียมอุดมศึกษาพัฒนาการ</p>
      </section>

      {showFilter && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={()=>setShowFilter(false)} role="dialog" aria-modal="true" aria-label="ตัวกรอง">
          <div onClick={e=>e.stopPropagation()} className="w-full max-w-[480px] rounded-t-[16px] bg-white p-4 pb-8">
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--color-border)]" />
            <div className="flex items-center justify-between"><h3 className="text-[15px] font-bold">ตัวกรอง</h3><button onClick={()=>setShowFilter(false)} aria-label="ปิด" className="rounded-full border border-[var(--color-border)] p-1.5"><X size={16} /></button></div>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-[12px] border border-[var(--color-border)] bg-[#fafafa] px-3.5 py-3">
                <span className="text-sm font-medium">แสดงเฉพาะร้านที่เปิด</span>
                <button onClick={()=>setFilterOpenOnly(v=>!v)} role="switch" aria-checked={filterOpenOnly} aria-label="แสดงเฉพาะร้านที่เปิด" className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${filterOpenOnly?'bg-[var(--color-accent)]':'bg-[#e5e5e5]'}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition ${filterOpenOnly?'translate-x-5':''}`} /></button>
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[var(--color-border)] bg-[#fafafa] px-3.5 py-3">
                <span className="text-sm font-medium">เฉพาะร้านโปรด</span>
                <button onClick={()=>setFavOnly(v=>!v)} role="switch" aria-checked={favOnly} aria-label="เฉพาะร้านโปรด" className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${favOnly?'bg-[var(--color-accent)]':'bg-[#e5e5e5]'}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition ${favOnly?'translate-x-5':''}`} /></button>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">เรียงตาม</p>
                <div className="flex gap-2">
                  {([{id:'default',label:'แนะนำ'},{id:'rating',label:'เรตติ้งสูงสุด'},{id:'reviews',label:'ยอดนิยม'}] as const).map(o=>(
                    <button key={o.id} onClick={()=>setSortBy(o.id)} className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ring-1 ${sortBy===o.id?'bg-[var(--color-text)] text-white ring-[var(--color-text)]':'bg-white ring-[var(--color-border)]'}`}>{o.label}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button onClick={()=>{ setFilterOpenOnly(false); setSortBy('default'); setCat('all')}} className="rounded-full border border-[var(--color-border)] bg-white py-3 text-sm font-semibold">ล้างทั้งหมด</button>
                <button onClick={()=>setShowFilter(false)} className="rounded-full bg-[var(--color-text)] py-3 text-sm font-semibold text-white">ดู {filtered.length} ร้าน</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCoupon && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={()=>setShowCoupon(false)} role="dialog" aria-modal="true" aria-label="คูปอง">
          <div onClick={e=>e.stopPropagation()} className="w-full max-w-[480px] rounded-t-[16px] bg-white p-4 pb-8">
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--color-border)]" />
            <h3 className="text-[15px] font-bold">คูปองของคุณ</h3>
            <div className="mt-4 rounded-[12px] border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-bold text-[var(--color-accent-ink)]">LUNCH10</p><p className="text-xs text-[var(--color-text-2)]">ลด 10฿ เมื่อสั่งล่วงหน้าก่อน 11:30</p><p className="mt-1 text-[11px] text-[var(--color-text-3)]">รับที่ร้าน · จ่ายเงินสด · ใช้ได้ 1 ครั้ง/วัน</p></div>
                <button onClick={()=>{ navigator.clipboard.writeText('LUNCH10'); alert('คัดลอกโค้ด LUNCH10 แล้ว')}} className="shrink-0 rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-bold text-white">คัดลอก</button>
              </div>
            </div>
            <button onClick={()=>setShowCoupon(false)} className="mt-4 w-full rounded-full bg-[var(--color-text)] py-3 text-sm font-semibold text-white">ปิด</button>
          </div>
        </div>
      )}

      {showLocation && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={()=>setShowLocation(false)} role="dialog" aria-modal="true" aria-label="จุดรับอาหาร">
          <div onClick={e=>e.stopPropagation()} className="w-full max-w-[480px] rounded-t-[16px] bg-white p-4 pb-8">
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--color-border)]" />
            <h3 className="text-[15px] font-bold">จุดรับอาหาร</h3>
            <div className="mt-3 rounded-[12px] border border-[var(--color-border)] bg-[#fafafa] p-3.5">
              <p className="flex items-center gap-2 text-sm font-semibold"><MapPin size={14} /> อาคารโรงอาหาร ชั้น 1</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-2)]">โรงเรียนเตรียมอุดมศึกษาพัฒนาการ · ม.4–ม.6<br/>เปิด 10:00–13:30 · รอบรับ {pickupSlotsDisplay} น.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{[...new Set(stores.flatMap(s=>s.pickup_slots??[]))].slice(0,6).map(s=> <span key={s} className="rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-medium tabular-nums">{s} น.</span>)}</div>
            </div>
            <div className="mt-3 rounded-[12px] bg-[var(--color-accent-soft)] px-3.5 py-3 ring-1 ring-[var(--color-accent)]/15"><p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent-ink)]"><Check size={14} /> สั่งล่วงหน้า มารับตรงเวลา ไม่ต้องรอคิว</p></div>
            <button onClick={()=>setShowLocation(false)} className="mt-4 w-full rounded-full bg-[var(--color-text)] py-3 text-sm font-semibold text-white">ตกลง</button>
          </div>
        </div>
      )}
    </div>
  )
}
function SectionHead({title, action, onAction}:{title:string; action?:string; onAction?:()=>void}){
  return <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-[13px] font-bold tracking-tight">{title}</h2>{action && (onAction ? <button onClick={onAction} className="text-xs font-semibold text-[var(--color-text-2)]">{action} <ChevronRight size={12} className="inline" /></button> : <span className="text-xs font-semibold text-[var(--color-text-2)]">{action} <ChevronRight size={12} className="inline" /></span>)}</div>
}
function Quick({Icon,label,sub,accent}:{Icon:typeof RotateCcw;label:string;sub:string;accent?:boolean}){
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span className={`flex h-12 w-12 items-center justify-center rounded-full ring-1 ${accent ? 'bg-[var(--color-accent)] text-white ring-[var(--color-accent)]' : 'bg-white text-[var(--color-text)] ring-[var(--color-border)]'}`}><Icon size={18} /></span>
      <span className="text-xs font-semibold leading-none">{label}</span>
      <span className="line-clamp-1 text-[11px] leading-none text-[var(--color-text-2)]">{sub}</span>
    </div>
  )
}
function EmptyState({onClear}:{onClear:()=>void}){
  return <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-white p-8 text-center"><StoreIcon size={24} className="mx-auto text-[var(--color-text-3)]" /><p className="mt-2 text-sm font-semibold">ไม่พบร้าน</p><p className="text-xs text-[var(--color-text-2)]">ลองเปลี่ยนคำค้นหรือหมวดหมู่</p><button onClick={onClear} className="mt-3 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-semibold">ล้างตัวกรอง</button></div>
}
