import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { MapPin, Star, Heart, ChevronRight, Home as HomeIcon, ReceiptText, Search as SearchIcon, User as UserIcon, SlidersHorizontal, Clock3, RotateCcw, Bookmark, Ticket, Crown, UtensilsCrossed, Check, Copy, Store as StoreIcon, Flame } from 'lucide-react'
import { supabase, type Store as StoreType, type MenuItem } from './lib/supabase'
import { foodKindFor, storeKindFor, type FoodKind } from './lib/food'
import FoodArt from './components/ui/FoodArt'
import { useCart } from './lib/cart'
import StorePage from './pages/StorePage'
import OwnerHome, { TrackOrderView } from './pages/OwnerHome'
import SearchBar from './components/ui/SearchBar'
import { SkeletonCard } from './components/ui/Skeleton'
import BottomSheet from './components/ui/BottomSheet'

type Tab = 'home' | 'search' | 'orders' | 'favs' | 'account'
export type View = { page: 'home' } | { page: 'store'; id: string } | { page: 'owner' }

// — helpers
function ratingFor(id: string){ let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return (4.4 + (h%6)/10).toFixed(1) }
function reviewsFor(id: string){ let h=0; for(let i=0;i<id.length;i++) h=(h*37+id.charCodeAt(i))>>>0; return 24 + (h%180) }
function safeParse<T>(key:string, fallback:T):T{ try{ const v=localStorage.getItem(key); return v? JSON.parse(v) as T : fallback }catch{ return fallback } }

// Category tiles — art is rendered by <FoodArt kind>, a matching illustration
// per category. (Old Unsplash tiles were mismatched: Japanese ramen for Thai
// boat noodles, Western sundae for Thai dessert — see src/lib/food.ts audit.)
const CAT_DEFS: { id: string; label: string; match: string[]; kind: FoodKind | null }[] = [
  { id:'all', label:'ทั้งหมด', match:[], kind:null },
  { id:'rice', label:'ข้าว', match:['ข้าว'], kind:'kaphrao' },
  { id:'noodle', label:'ก๋วยเตี๋ยว', match:['ก๋วยเตี๋ยว','บะหมี่'], kind:'boat-noodle' },
  { id:'fried', label:'ไก่ทอด', match:['ไก่ทอด','ข้าวหมก','ข้าวเหนียว','ของทอด'], kind:'fried-chicken' },
  { id:'drink', label:'เครื่องดื่ม', match:['ชานม','ชาเขียว','โกโก้','น้ำ','ชาไทย','เครื่องดื่ม'], kind:'bubble-tea' },
  { id:'dessert', label:'ของหวาน', match:['ขนม','ของหวาน','ของทานเล่น'], kind:'shaved-ice' },
]

export function storeMatchesCat(menuIndex:{store_id:string;name:string;category:string}[], catId:string, storeId:string){
  if(catId==='all') return true
  const def = CAT_DEFS.find(c=>c.id===catId)
  if(!def) return true
  return menuIndex.some(m=> m.store_id===storeId && def.match.some(k=> (m.category??'').includes(k) || m.name.includes(k)))
}

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
      <main className={`mx-auto max-w-[480px] ${view.page!=='home'?'pb-24':'pb-[92px]'}`}>
        {view.page==='store' && <StorePage id={view.id} onBack={()=>setView({page:'home'})} onTrack={()=>{ setView({page:'home'}); setTab('orders') }} />}
        {view.page==='owner' && <OwnerHome onBackHome={()=>setView({page:'home'})} />}
        {view.page==='home' && tab==='home' && <Home stores={stores} loading={loading} loadErr={loadErr} onRetry={loadStores} onOpen={id=>setView({page:'store',id})} onGoOrders={()=>setTab('orders')} />}
        {view.page==='home' && tab==='search' && <SearchView stores={stores} onOpen={id=>setView({page:'store',id})} />}
        {view.page==='home' && tab==='orders' && <TrackOrderView />}
        {view.page==='home' && tab==='favs' && <FavsView stores={stores} onOpen={id=>setView({page:'store',id})} onBrowse={()=>setTab('home')} />}
        {view.page==='home' && tab==='account' && <AccountView onOrders={()=>setTab('orders')} onOwner={()=>setView({page:'owner'})} onHome={()=>setTab('home')} />}
      </main>
      {view.page==='home' && (
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-[var(--color-border)] bg-white/95 pb-safe shadow-float backdrop-blur">
          <div className="grid grid-cols-5 px-2 pb-1 pt-1.5">
            <TabBtn Icon={HomeIcon} label="หน้าแรก" active={tab==='home'} onClick={()=>setTab('home')} />
            <TabBtn Icon={SearchIcon} label="ค้นหา" active={tab==='search'} onClick={()=>setTab('search')} />
            <TabBtn Icon={ReceiptText} label="ออเดอร์" active={tab==='orders'} onClick={()=>setTab('orders')} badge={cartCount||undefined} />
            <TabBtn Icon={Heart} label="โปรด" active={tab==='favs'} onClick={()=>setTab('favs')} />
            <TabBtn Icon={UserIcon} label="บัญชี" active={tab==='account'} onClick={()=>setTab('account')} />
          </div>
        </nav>
      )}
    </div>
  )
}
function TabBtn({Icon,label,active,onClick,badge}:{Icon:typeof HomeIcon;label:string;active?:boolean;onClick:()=>void;badge?:number}){
  return (
    <button onClick={onClick} aria-label={label} aria-current={active?'page':undefined} className="pressable flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[14px] py-1.5 text-[10px] font-semibold tracking-wide transition active:scale-[0.96]">
      <span className={`relative flex h-8 items-center justify-center rounded-full px-5 transition ${active?'bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]':'text-[var(--color-text-3)]'}`}>
        <Icon size={20} strokeWidth={active?2.2:1.8} />
        {badge!=null && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-chili)] px-1 text-[10px] font-bold text-white ring-2 ring-white">{badge}</span>}
      </span>
      <span className={active?'text-[var(--color-text)]':'text-[var(--color-text-3)]'}>{label}</span>
      {active && <span className="h-1 w-6 rounded-full bg-[var(--color-accent)]" aria-hidden />}
    </button>
  )
}

function Home({stores,loading,loadErr,onRetry,onOpen,onGoOrders}:{stores:StoreType[];loading:boolean;loadErr:string|null;onRetry:()=>void;onOpen:(id:string)=>void;onGoOrders?:()=>void}){
  const [q,setQ]=useState('')
  const [qDebounced,setQDebounced]=useState('')
  const [cat,setCat]=useState('all')
  const [mode,setMode]=useState<'pickup'|'preorder'>('pickup')
  const [favs,setFavs]=useState<Set<string>>(()=> new Set(safeParse<string[]>('tl_favs',[])))
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
  const [promoIdx,setPromoIdx]=useState(0)
  const promoRef=useRef<HTMLDivElement>(null)
  const promoIdxRef=useRef(0)
  const cartCount = useCart(s=>s.items.reduce((a,i)=>a+i.qty,0))

  const toggleFav=(id:string)=>{ const n=new Set(favs); if(n.has(id)) n.delete(id); else n.add(id); setFavs(n); try{ localStorage.setItem('tl_favs',JSON.stringify([...n])) }catch{} }

  useEffect(()=>{
    supabase.from('lunch_menu_items').select('*').eq('available',true).limit(12).then(({data,error})=>{
      if(error) setPopErr(error.message); else setPopular(data??[])
    })
    supabase.from('lunch_menu_items').select('store_id,name,category').then(({data})=> setMenuIndex((data??[]) as unknown as {store_id:string;name:string;category:string}[]))
  },[])

  // debounce search 200ms
  useEffect(()=>{ const t=setTimeout(()=>setQDebounced(q),200); return ()=>clearTimeout(t)},[q])

  // promo auto-advance (top-app carousel pattern)
  useEffect(()=>{
    const t=setInterval(()=>{
      const el=promoRef.current; if(!el) return
      promoIdxRef.current=(promoIdxRef.current+1)%3
      setPromoIdx(promoIdxRef.current)
      el.scrollTo({left: el.clientWidth*promoIdxRef.current, behavior:'smooth'})
    },4500)
    return ()=>clearInterval(t)
  },[])

  const filtered = useMemo(()=>{
    let r=[...stores]
    if(qDebounced.trim()){
      const qq=qDebounced.toLowerCase()
      const menuMatchStoreIds = new Set(menuIndex.filter(m=> m.name.toLowerCase().includes(qq) || (m.category??'').toLowerCase().includes(qq)).map(m=>m.store_id))
      r=r.filter(s=> s.name.toLowerCase().includes(qq) || (s.description??'').toLowerCase().includes(qq) || menuMatchStoreIds.has(s.id))
    }
    if(cat!=='all') r=r.filter(s=> storeMatchesCat(menuIndex,cat,s.id))
    if(favOnly) r=r.filter(s=> favs.has(s.id))
    if(filterOpenOnly) r=r.filter(s=> s.is_open)
    if(mode==='preorder') r=[...r].sort((a,b)=> Number(b.is_open)-Number(a.is_open))
    if(sortBy==='rating') r=[...r].sort((a,b)=> Number(ratingFor(b.id)) - Number(ratingFor(a.id)))
    if(sortBy==='reviews') r=[...r].sort((a,b)=> reviewsFor(b.id) - reviewsFor(a.id))
    return r
  },[stores,qDebounced,cat,menuIndex,favOnly,favs,filterOpenOnly,mode,sortBy])

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

  const openCount = stores.filter(s=>s.is_open).length

  return (
    <div className="bg-[var(--color-bg)]">
      {/* Header — pro food-app pattern: location row, greeting, search */}
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[#FFFDF9]/95 px-4 pb-3 pt-3 backdrop-blur supports-[backdrop-filter]:bg-[#FFFDF9]/85">
        <div className="flex items-center justify-between gap-2">
          <button onClick={()=>setShowLocation(true)} aria-label="เลือกจุดรับอาหาร" className="pressable flex min-h-[44px] items-center gap-2.5 text-left transition active:scale-[0.97]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-sm"><MapPin size={17} strokeWidth={2} /></span>
            <span className="leading-tight">
              <span className="block text-[11px] font-medium text-[var(--color-text-2)]">รับที่ · โรงอาหาร</span>
              <span className="flex items-center gap-1 text-[13px] font-bold">อาคารโรงอาหาร · ม.4–ม.6 <ChevronRight size={13} strokeWidth={2} className="text-[var(--color-text-3)]" /></span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--color-accent-ink)] ring-1 ring-[var(--color-accent)]/20">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />{openCount} ร้านเปิด
            </span>
            <button aria-label={`ตะกร้า ${cartCount} รายการ`} onClick={()=>onGoOrders?.()} className="pressable relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white shadow-sm transition active:scale-[0.95]">
              <ReceiptText size={18} strokeWidth={2} />{cartCount>0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-chili)] px-1 text-[11px] font-bold text-white ring-2 ring-white">{cartCount}</span>}
            </button>
          </div>
        </div>
        {/* greeting */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight" style={{fontFamily:'var(--font-display)'}}>เที่ยงนี้กินอะไรดี?</h1>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[var(--color-text-2)]"><Clock3 size={13} strokeWidth={2} /> รอบรับ {pickupSlotsDisplay} · สั่งล่วงหน้าไม่รอคิว</p>
          </div>
        </div>
        {/* Search pill + filter */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 shadow-sm"><SearchBar value={q} onChange={onSearch} placeholder="ค้นหาร้านค้า เมนู เช่น กะเพรา..." /></div>
          <button onClick={()=>setShowFilter(true)} aria-label="ตัวกรอง" className={`pressable relative flex h-11 w-11 items-center justify-center rounded-full border bg-white shadow-sm transition active:scale-[0.95] ${filterOpenOnly||sortBy!=='default'||favOnly?'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]':'border-[var(--color-border)]'}`}>
            <SlidersHorizontal size={18} strokeWidth={2} />
            {(filterOpenOnly||sortBy!=='default'||favOnly) && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-accent)] ring-2 ring-white" />}
          </button>
        </div>
        {/* segmented control */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex gap-1 rounded-full border border-[var(--color-border)] bg-white p-1 shadow-sm">
            {(['pickup','preorder'] as const).map(m=>(
              <button key={m} onClick={()=>setMode(m)} className={`pressable min-h-[36px] rounded-full px-4 py-1.5 text-xs font-bold transition active:scale-[0.97] ${mode===m?'bg-[var(--color-brand)] text-white shadow':'text-[var(--color-text-2)]'}`}>{m==='pickup'?'รับที่ร้าน':'สั่งล่วงหน้า'}</button>
            ))}
          </div>
          {favOnly && (
            <button onClick={()=>setFavOnly(false)} className="pressable ml-auto inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[var(--color-chili-soft)] px-3 py-1.5 text-xs font-bold text-[var(--color-chili)] ring-1 ring-[var(--color-chili)]/20 transition active:scale-[0.97]">
              <Heart size={13} strokeWidth={2} fill="currentColor" /> ร้านโปรด ×
            </button>
          )}
        </div>
        {recent.length>0 && !qDebounced && (
          <div className="mt-2 flex flex-wrap gap-1.5" role="list" aria-label="ค้นหาล่าสุด">
            {recent.map(r=> <button key={r} onClick={()=>setQ(r)} className="pressable min-h-[32px] rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-2)] transition active:scale-[0.97]">{r}</button>)}
            <button onClick={()=>{ setRecent([]); try{localStorage.removeItem('tl_recent_q')}catch{} }} className="pressable min-h-[32px] px-2 text-xs font-medium text-[var(--color-text-3)] transition active:scale-[0.97]">ล้าง</button>
          </div>
        )}
      </header>

      {/* Quick actions — pro service grid with tinted tiles */}
      <section className="bg-[#FFFDF9] px-4 pb-2 pt-4">
        <div className="grid grid-cols-4 gap-2">
          <button onClick={()=>{ if(lastOrder){ const st=stores.find(x=>x.name===lastOrder.store); if(st) onOpen(st.id); else alert('ไม่พบร้านของออเดอร์ล่าสุด')} else alert('ยังไม่มีประวัติการสั่ง — สั่งอาหารก่อนแล้วจะสั่งซ้ำได้เลย')}} aria-label="สั่งซ้ำ" className="pressable flex flex-col items-center transition active:scale-[0.96]"><Quick Icon={RotateCcw} label="สั่งซ้ำ" sub={lastOrder ? lastOrder.store.slice(0,8) : 'ยังไม่มี'} tone="bg-orange-100 text-orange-700" /></button>
          <button onClick={()=>{
            if(favs.size===0) alert('ยังไม่มีร้านโปรด — กดหัวใจที่ร้านเพื่อบันทึก')
            else { setFavOnly(v=>!v); document.getElementById('store-list')?.scrollIntoView({behavior:'smooth'}) }
          }} aria-label={`รายการโปรด ${favs.size} ร้าน`} className="pressable flex flex-col items-center transition active:scale-[0.96]"><Quick Icon={Bookmark} label="รายการโปรด" sub={favOnly? 'กำลังกรอง' : `${favs.size} ร้าน`} tone="bg-rose-100 text-rose-600" /></button>
          <button onClick={()=>setShowCoupon(true)} aria-label="ดูคูปอง" className="pressable flex flex-col items-center transition active:scale-[0.96]"><Quick Icon={Ticket} label="คูปอง" sub="ลด 10฿" accent /></button>
          <button onClick={()=>alert('Triam Lunch Premium — เร็วๆ นี้: ฟรีค่าส่งทุกออเดอร์ + ส่วนลดพิเศษ')} aria-label="พรีเมียม" className="pressable flex flex-col items-center transition active:scale-[0.96]"><Quick Icon={Crown} label="พรีเมียม" sub="ฟรีค่าส่ง" tone="bg-amber-100 text-amber-700" /></button>
        </div>
      </section>

      {/* Promo carousel — gradient cards with MATCHING food art */}
      <section className="bg-[#FFFDF9] px-4 pb-2 pt-1">
        <div
          ref={promoRef}
          onScroll={e=>{ const el=e.currentTarget; const i=Math.min(2, Math.round(el.scrollLeft/Math.max(1,el.clientWidth))); promoIdxRef.current=i; setPromoIdx(i) }}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
        >
          <button onClick={()=>setShowCoupon(true)} className="promo-green shadow-lift flex w-full shrink-0 snap-center items-center gap-3 overflow-hidden rounded-[20px] p-4 text-left text-white">
            <div className="flex-1">
              <p className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold tracking-wide"><Flame size={12} strokeWidth={2} /> โปรรอบเที่ยง</p>
              <p className="mt-1.5 text-[17px] font-bold leading-snug" style={{fontFamily:'var(--font-display)'}}>สั่งก่อน 11:30<br/>ลดทันที 10 บาท</p>
              <p className="mt-1 text-xs font-medium text-white/75">แตะเพื่อใช้โค้ด LUNCH10 →</p>
            </div>
            <FoodArt kind="kaphrao" title="ข้าวกะเพราหมูสับไข่ดาว" className="h-24 w-24 shrink-0 rounded-[16px] shadow-float ring-2 ring-white/40" />
          </button>
          <button onClick={()=>document.getElementById('store-list')?.scrollIntoView({behavior:'smooth'})} className="hero-gradient flex w-full shrink-0 snap-center items-center gap-3 overflow-hidden rounded-[20px] p-4 text-left text-white shadow-float">
            <div className="flex-1">
              <p className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white/80"><Clock3 size={12} strokeWidth={2} /> รับที่ร้าน · ไม่รอคิว</p>
              <p className="mt-1.5 text-[17px] font-bold leading-snug" style={{fontFamily:'var(--font-display)'}}>เลือกรอบ {pickupSlotsDisplay}<br/>มารับตรงเวลาได้เลย</p>
              <p className="mt-1 text-xs font-medium text-white/60">แตะเพื่อดูร้านทั้งหมด →</p>
            </div>
            <FoodArt kind="boat-noodle" title="ก๋วยเตี๋ยวเรือน้ำตก" className="h-24 w-24 shrink-0 rounded-[16px] shadow-float ring-2 ring-white/20" />
          </button>
          <button onClick={()=>{ if(favs.size>0){ setFavOnly(true); document.getElementById('store-list')?.scrollIntoView({behavior:'smooth'}) } else alert('ยังไม่มีร้านโปรด — กดหัวใจที่ร้านเพื่อบันทึก') }} className="promo-cream card-shadow flex w-full shrink-0 snap-center items-center gap-3 overflow-hidden rounded-[20px] border border-orange-200/60 p-4 text-left">
            <div className="flex-1">
              <p className="text-[11px] font-bold tracking-wide text-orange-700/70">ร้านโปรดของคุณ</p>
              <p className="mt-1 text-[17px] font-bold leading-snug text-[var(--color-text)]" style={{fontFamily:'var(--font-display)'}}>{favs.size>0 ? `${favs.size} ร้านที่บันทึกไว้` : 'ยังไม่มีร้านโปรด'}<br/><span className="text-[13px] font-semibold text-[var(--color-text-2)]">{favs.size>0 ? 'แตะเพื่อดูเฉพาะร้านโปรด' : 'กดหัวใจเพื่อบันทึก'}</span></p>
            </div>
            <FoodArt kind="bubble-tea" title="ชานมไข่มุก" className="h-24 w-24 shrink-0 rounded-[16px] shadow-float ring-2 ring-white" />
          </button>
        </div>
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
          {[0,1,2].map(i=> <span key={i} className={`h-1.5 rounded-full transition-all ${promoIdx===i?'w-5 bg-[var(--color-brand)]':'w-1.5 bg-[var(--color-border-strong)]'}`} />)}
        </div>
      </section>

      {/* Reorder — history */}
      {lastOrder && (
        <section className="bg-[#FFFDF9] px-4 pb-2 pt-1">
          <SectionHead title="สั่งอีกครั้ง" action="ดูทั้งหมด" onAction={()=>{ const s=stores.find(x=>x.name===lastOrder.store); if(s) onOpen(s.id)}} />
          <div className="card-shadow flex items-center gap-3 rounded-[18px] border border-[var(--color-border)] bg-white p-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-bold text-white">{lastOrder.store.slice(0,1)}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{lastOrder.store}</p><p className="text-xs text-[var(--color-text-2)]">รหัส {lastOrder.code} · แตะเพื่อสั่งซ้ำ</p></div>
            <button onClick={()=>{ const s=stores.find(x=>x.name===lastOrder.store); if(s) onOpen(s.id) }} className="pressable shrink-0 rounded-full bg-[var(--color-accent)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-[0.96]">สั่งซ้ำ</button>
          </div>
        </section>
      )}

      {/* Categories — matching art tiles */}
      <section className="bg-[#FFFDF9] px-4 pb-2 pt-3">
        <SectionHead title="อยากกินอะไร?" />
        <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
          {CAT_DEFS.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} aria-pressed={cat===c.id} className="pressable flex w-[76px] shrink-0 snap-start flex-col items-center gap-1.5 transition active:scale-[0.95]">
              {c.kind ? (
                <span className={`block h-[68px] w-[68px] overflow-hidden rounded-[20px] transition ${cat===c.id?'ring-tasty':'ring-1 ring-[var(--color-border)]'}`}>
                  <FoodArt kind={c.kind} title={c.label} className="h-full w-full" rounded={false} />
                </span>
              ) : (
                <span className={`flex h-[68px] w-[68px] items-center justify-center rounded-[20px] transition ${cat===c.id?'bg-[var(--color-brand)] text-white shadow-float':'bg-white text-[var(--color-text)] ring-1 ring-[var(--color-border)]'}`}><UtensilsCrossed size={22} strokeWidth={2} /></span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-tight ${cat===c.id?'bg-[var(--color-brand)] text-white':'text-[var(--color-text-2)]'}`}>{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* เมนูขายดี — matching art, clickable */}
      {popErr && <p className="bg-[#FFFDF9] px-4 py-2 text-xs text-red-600">โหลดเมนูขายดีไม่สำเร็จ: {popErr}</p>}
      {popular.length>0 && !popErr && (
        <section className="bg-[#FFFDF9] px-4 pb-2 pt-3">
          <SectionHead title="เมนูขายดี" action="ดูทั้งหมด" onAction={()=> document.getElementById('store-list')?.scrollIntoView({behavior:'smooth'})} />
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {popular.slice(0,12).map(m=>{
              const kind = foodKindFor(m.name, m.category)
              return (
              <button key={m.id} onClick={()=> onOpen(m.store_id)} aria-label={`เปิดร้านของ ${m.name}`} className="pressable w-[152px] shrink-0 overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-white text-left card-shadow transition active:scale-[0.96]">
                <div className="relative h-[104px] w-full overflow-hidden">
                  <FoodArt kind={kind} title={m.name} className="h-full w-full" rounded={false} />
                  <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white backdrop-blur"><Star size={10} strokeWidth={2} className="fill-amber-400 text-amber-400" /> 4.8</span>
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-1 text-[13px] font-bold leading-tight">{m.name}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-[var(--color-text-2)]">{m.category}</p>
                  <p className="mt-1 flex items-center justify-between"><span className="text-sm font-bold tabular-nums">฿{Number(m.price_thb).toFixed(0)}</span><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]">+</span></p>
                </div>
              </button>
            )})}
          </div>
        </section>
      )}

      {/* Stores — pro cards with matching covers */}
      <section id="store-list" className="bg-[var(--color-bg)] px-3 pb-6 pt-3">
        <div className="mb-1 flex items-center justify-between px-1">
          <h2 className="text-[16px] font-bold tracking-tight" style={{fontFamily:'var(--font-display)'}}>ร้านแนะนำ</h2>
           <button onClick={()=>setShowFilter(true)} className="pressable inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--color-text-2)] shadow-sm transition active:scale-[0.97]"><SlidersHorizontal size={15} strokeWidth={2} /> ตัวกรอง</button>
        </div>
        <p className="mb-2.5 px-1 text-xs font-medium text-[var(--color-text-2)]">{filtered.length} ร้าน · {cat==='all' ? 'ทั้งหมด' : CAT_DEFS.find(c=>c.id===cat)?.label}{filterOpenOnly?' · เปิดอยู่':''}{favOnly?' · ร้านโปรด':''}</p>
        {loadErr && <div className="rounded-[18px] border border-[var(--color-border)] bg-white p-8 text-center card-shadow"><StoreIcon size={28} strokeWidth={1.8} className="mx-auto text-[var(--color-text-3)]" /><p className="mt-2 text-sm font-bold">โหลดร้านไม่สำเร็จ</p><p className="mt-1 text-xs text-[var(--color-text-2)]">{loadErr}</p><button onClick={onRetry} className="pressable mt-3 rounded-full bg-[var(--color-brand)] px-5 py-2.5 text-xs font-bold text-white transition active:scale-[0.97]">ลองใหม่</button></div>}
        {loading && !loadErr && <div className="grid gap-3">{[0,1,2,3].map(i=> <SkeletonCard key={i} />)}</div>}
        {!loading && !loadErr && filtered.length===0 && <EmptyState onClear={()=>{setQ('');setCat('all');setFilterOpenOnly(false); setFavOnly(false)}} />}
        <div className="grid gap-3.5">
          {filtered.map(s=>{
            const r=ratingFor(s.id), rev=reviewsFor(s.id); const isFav=favs.has(s.id)
            const kind = storeKindFor(s.name)
            return (
              <div key={s.id} className="group relative overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-white card-shadow transition">
                <div className="relative aspect-[16/8.5] w-full overflow-hidden">
                  <button onClick={()=> s.is_open ? onOpen(s.id) : alert('ร้านปิดรับออเดอร์ — ดูเมนูได้อย่างเดียว')} aria-label={`เปิดร้าน ${s.name}`} className="pressable block h-full w-full text-left transition active:scale-[0.99]">
                    <FoodArt kind={kind} title={s.name} className="h-full w-full" rounded={false} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    {!s.is_open && <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-bold backdrop-blur-[1px]">ปิดรับออเดอร์</span>}
                  </button>
                  <button onClick={e=>{e.stopPropagation(); e.preventDefault(); toggleFav(s.id)}} aria-label={isFav?'ลบโปรด':'โปรด'} className={`pressable absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur transition active:scale-[0.92] ${isFav?'bg-white text-red-500':'bg-white/90 text-[var(--color-text-3)]'}`}><Heart size={17} strokeWidth={2} fill={isFav?'currentColor':'none'} /></button>
                  {s.is_open
                    ? <span className="absolute left-2.5 top-2.5 rounded-full bg-[var(--color-chili)] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">ลด 10฿</span>
                    : <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">ปิด</span>}
                  <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold tabular-nums shadow-sm backdrop-blur"><Star size={11} strokeWidth={2} className="fill-amber-400 text-amber-400" /> {r} <span className="font-medium text-[var(--color-text-3)]">({rev}+)</span></span>
                  <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"><Clock3 size={11} strokeWidth={2} /> 5–10 นาที</span>
                </div>
                <button onClick={()=> s.is_open ? onOpen(s.id) : alert('ร้านปิดรับออเดอร์ — ดูเมนูได้อย่างเดียว')} className="pressable block w-full p-3.5 text-left transition active:scale-[0.99]">
                  <h3 className="line-clamp-1 text-[16px] font-bold leading-tight" style={{fontFamily:'var(--font-display)'}}>{s.name}</h3>
                  {s.description && <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-2)]">{s.description}</p>}
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-2)]">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${s.is_open?'bg-[var(--color-accent)]':'bg-[var(--color-text-3)]'}`} />{s.is_open?'เปิดรับออเดอร์':'ปิด'}
                    <span className="text-[var(--color-border-strong)]">·</span>
                    <Clock3 size={13} strokeWidth={2} /> {s.pickup_slots?.[0]??'11:50'} รับที่ร้าน
                  </p>
                  {s.location && <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[var(--color-text-3)]"><MapPin size={13} strokeWidth={2} className="shrink-0" />{s.location}</p>}
                </button>
              </div>
            )
          })}
        </div>
        <p className="pt-6 text-center text-[11px] font-medium tracking-wide text-[var(--color-text-3)]">TRIAM LUNCH · โรงเรียนเตรียมอุดมศึกษาพัฒนาการ</p>
      </section>

      <BottomSheet open={showFilter} onClose={()=>setShowFilter(false)} title="ตัวกรอง">
        <div className="grid gap-3">
          <div className="flex items-center justify-between rounded-[14px] border border-[var(--color-border)] bg-[#fafafa] px-3.5 py-3">
            <span className="text-sm font-medium">แสดงเฉพาะร้านที่เปิด</span>
            <button onClick={()=>setFilterOpenOnly(v=>!v)} role="switch" aria-checked={filterOpenOnly} aria-label="แสดงเฉพาะร้านที่เปิด" className={`pressable flex h-6 w-11 items-center rounded-full p-0.5 transition active:scale-[0.97] ${filterOpenOnly?'bg-[var(--color-accent)]':'bg-[#e5e5e5]'}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition ${filterOpenOnly?'translate-x-5':''}`} /></button>
          </div>
          <div className="flex items-center justify-between rounded-[14px] border border-[var(--color-border)] bg-[#fafafa] px-3.5 py-3">
            <span className="text-sm font-medium">เฉพาะร้านโปรด</span>
            <button onClick={()=>setFavOnly(v=>!v)} role="switch" aria-checked={favOnly} aria-label="เฉพาะร้านโปรด" className={`pressable flex h-6 w-11 items-center rounded-full p-0.5 transition active:scale-[0.97] ${favOnly?'bg-[var(--color-accent)]':'bg-[#e5e5e5]'}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition ${favOnly?'translate-x-5':''}`} /></button>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">เรียงตาม</p>
            <div className="flex gap-2">
              {([{id:'default',label:'แนะนำ'},{id:'rating',label:'เรตติ้งสูงสุด'},{id:'reviews',label:'ยอดนิยม'}] as const).map(o=>(
                <button key={o.id} onClick={()=>setSortBy(o.id)} className={`pressable flex-1 rounded-full px-3 py-2.5 text-sm font-bold ring-1 transition active:scale-[0.97] ${sortBy===o.id?'bg-[var(--color-brand)] text-white ring-[var(--color-brand)]':'bg-white ring-[var(--color-border)]'}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={()=>{ setFilterOpenOnly(false); setSortBy('default'); setCat('all'); setFavOnly(false)}} className="pressable rounded-full border border-[var(--color-border)] bg-white py-3 text-sm font-bold transition active:scale-[0.97]">ล้างทั้งหมด</button>
            <button onClick={()=>setShowFilter(false)} className="pressable rounded-full bg-[var(--color-brand)] py-3 text-sm font-bold text-white transition active:scale-[0.97]">ดู {filtered.length} ร้าน</button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={showCoupon} onClose={()=>setShowCoupon(false)} title="คูปองของคุณ">
        <div className="rounded-[14px] border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-bold text-[var(--color-accent-ink)]">LUNCH10</p><p className="text-xs text-[var(--color-text-2)]">ลด 10฿ เมื่อสั่งล่วงหน้าก่อน 11:30</p><p className="mt-1 text-[11px] text-[var(--color-text-3)]">รับที่ร้าน · จ่ายเงินสด · ใช้ได้ 1 ครั้ง/วัน</p></div>
            <button onClick={()=>{ navigator.clipboard.writeText('LUNCH10'); alert('คัดลอกโค้ด LUNCH10 แล้ว')}} className="pressable shrink-0 rounded-full bg-[var(--color-accent)] px-4 py-2.5 text-xs font-bold text-white transition active:scale-[0.97]">คัดลอก</button>
          </div>
        </div>
        <button onClick={()=>setShowCoupon(false)} className="pressable mt-4 w-full rounded-full bg-[var(--color-brand)] py-3 text-sm font-bold text-white transition active:scale-[0.97]">ปิด</button>
      </BottomSheet>

      <BottomSheet open={showLocation} onClose={()=>setShowLocation(false)} title="จุดรับอาหาร">
        <div className="rounded-[14px] border border-[var(--color-border)] bg-[#fafafa] p-3.5">
          <p className="flex items-center gap-2 text-sm font-bold"><MapPin size={16} strokeWidth={2} /> อาคารโรงอาหาร ชั้น 1</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-2)]">โรงเรียนเตรียมอุดมศึกษาพัฒนาการ · ม.4–ม.6<br/>เปิด 10:00–13:30 · รอบรับ {pickupSlotsDisplay} น.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{[...new Set(stores.flatMap(s=>s.pickup_slots??[]))].slice(0,6).map(s=> <span key={s} className="rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-medium tabular-nums">{s} น.</span>)}</div>
        </div>
        <div className="mt-3 rounded-[14px] bg-[var(--color-accent-soft)] px-3.5 py-3 ring-1 ring-[var(--color-accent)]/15"><p className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent-ink)]"><Check size={16} strokeWidth={2} /> สั่งล่วงหน้า มารับตรงเวลา ไม่ต้องรอคิว</p></div>
        <button onClick={()=>setShowLocation(false)} className="pressable mt-4 w-full rounded-full bg-[var(--color-brand)] py-3 text-sm font-bold text-white transition active:scale-[0.97]">ตกลง</button>
      </BottomSheet>
    </div>
  )
}

// — Search tab: universal search pill + recent chips + compact results
function SearchView({stores,onOpen}:{stores:StoreType[];onOpen:(id:string)=>void}){
  const [q,setQ]=useState('')
  const [qd,setQd]=useState('')
  const [menuIndex,setMenuIndex]=useState<{store_id:string;name:string;category:string}[]>([])
  const [recent,setRecent]=useState<string[]>(()=> safeParse<string[]>('tl_recent_q',[]))
  useEffect(()=>{ const t=setTimeout(()=>setQd(q),200); return ()=>clearTimeout(t)},[q])
  useEffect(()=>{ supabase.from('lunch_menu_items').select('store_id,name,category').then(({data})=> setMenuIndex((data??[]) as unknown as {store_id:string;name:string;category:string}[])) },[])
  const onSearch=(v:string)=>{ setQ(v); if(v.trim().length>=2){ const n=[v.trim(), ...recent.filter(x=>x!==v.trim())].slice(0,4); setRecent(n); try{ localStorage.setItem('tl_recent_q',JSON.stringify(n)) }catch{} } }

  const results = useMemo(()=>{
    if(!qd.trim()) return []
    const qq=qd.toLowerCase()
    const menuHit = new Map<string,string[]>()
    for(const m of menuIndex){
      if(m.name.toLowerCase().includes(qq) || (m.category??'').toLowerCase().includes(qq)){
        if(!menuHit.has(m.store_id)) menuHit.set(m.store_id,[])
        if(menuHit.get(m.store_id)!.length<2) menuHit.get(m.store_id)!.push(m.name)
      }
    }
    return stores
      .filter(s=> s.name.toLowerCase().includes(qq) || (s.description??'').toLowerCase().includes(qq) || menuHit.has(s.id))
      .map(s=> ({store:s, dishes:menuHit.get(s.id)??[]}))
  },[stores,qd,menuIndex])

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[#FFFDF9]/95 px-4 pb-3 pt-6 backdrop-blur">
        <h1 className="text-display">ค้นหา</h1>
        <div className="mt-3"><SearchBar value={q} onChange={onSearch} placeholder="ค้นหาร้านค้า เมนู..." /></div>
        {recent.length>0 && !qd && (
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="ค้นหาล่าสุด">
            {recent.map(r=> <button key={r} onClick={()=>setQ(r)} className="pressable min-h-[36px] rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-2)] transition active:scale-[0.97]">{r}</button>)}
          </div>
        )}
      </header>
      <div className="px-4 pt-4">
        {!qd && (
          <div>
            <p className="mb-2 text-[13px] font-bold">หมวดยอดนิยม</p>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {CAT_DEFS.filter(c=>c.kind).map(c=>(
                <div key={c.id} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
                  <span className="block h-16 w-16 overflow-hidden rounded-[18px] ring-1 ring-[var(--color-border)]">
                    <FoodArt kind={c.kind!} title={c.label} className="h-full w-full" rounded={false} />
                  </span>
                  <span className="text-[11px] font-bold text-[var(--color-text-2)]">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {qd.trim() && <p className="mb-2 px-1 text-xs text-[var(--color-text-2)]">เจอ {results.length} ร้าน · “{qd.trim()}”</p>}
        <div className="grid gap-2.5 pb-6">
          {results.map(({store:s,dishes})=>(
            <button key={s.id} onClick={()=>onOpen(s.id)} className="pressable flex items-center gap-3 rounded-[18px] border border-[var(--color-border)] bg-white p-3 text-left card-shadow transition active:scale-[0.97]">
              <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-[14px]">
                <FoodArt kind={storeKindFor(s.name)} title={s.name} className="h-full w-full" rounded={false} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{s.name}</span>
                {dishes.length>0 && <span className="block truncate text-xs text-[var(--color-text-2)]">มี: {dishes.join(' · ')}</span>}
                <span className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-text-2)]"><Star size={11} strokeWidth={2} className="fill-amber-400 text-amber-400" /> {ratingFor(s.id)} · {s.is_open?'เปิด':'ปิด'} · {s.pickup_slots?.[0]??'11:50'}</span>
              </span>
              <ChevronRight size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-3)]" />
            </button>
          ))}
          {qd.trim() && results.length===0 && (
            <div className="rounded-[18px] border border-dashed border-[var(--color-border)] bg-white p-8 text-center card-shadow"><SearchIcon size={24} strokeWidth={1.8} className="mx-auto text-[var(--color-text-3)]" /><p className="mt-2 text-sm font-bold">ไม่เจอ “{qd.trim()}”</p><p className="text-xs text-[var(--color-text-2)]">ลองคำอื่น เช่น ข้าว ก๋วยเตี๋ยว ชานม</p></div>
          )}
        </div>
      </div>
    </div>
  )
}

// — Favorites tab
function FavsView({stores,onOpen,onBrowse}:{stores:StoreType[];onOpen:(id:string)=>void;onBrowse:()=>void}){
  const [favs,setFavs]=useState<Set<string>>(()=> new Set(safeParse<string[]>('tl_favs',[])))
  const toggleFav=(id:string)=>{ const n=new Set(favs); if(n.has(id)) n.delete(id); else n.add(id); setFavs(n); try{ localStorage.setItem('tl_favs',JSON.stringify([...n])) }catch{} }
  const list = stores.filter(s=> favs.has(s.id))
  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[#FFFDF9] px-4 pb-4 pt-6">
        <h1 className="text-display">ร้านโปรด</h1>
        <p className="mt-0.5 text-sm text-[var(--color-text-2)]">{list.length} ร้านที่บันทึกไว้</p>
      </header>
      <div className="grid gap-2.5 px-4 pt-4 pb-6">
        {list.length===0 && (
          <div className="rounded-[18px] border border-dashed border-[var(--color-border)] bg-white p-8 text-center card-shadow"><Heart size={24} strokeWidth={1.8} className="mx-auto text-[var(--color-text-3)]" /><p className="mt-2 text-sm font-bold">ยังไม่มีร้านโปรด</p><p className="text-xs text-[var(--color-text-2)]">กดหัวใจที่ร้านเพื่อบันทึกไว้สั่งไวครั้งหน้า</p><button onClick={onBrowse} className="pressable mt-3 rounded-full bg-[var(--color-brand)] px-5 py-2.5 text-xs font-bold text-white transition active:scale-[0.97]">ดูร้านทั้งหมด</button></div>
        )}
        {list.map(s=>(
          <div key={s.id} className="flex items-center gap-3 rounded-[18px] border border-[var(--color-border)] bg-white p-3 card-shadow transition">
            <button onClick={()=>onOpen(s.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-[14px]">
                <FoodArt kind={storeKindFor(s.name)} title={s.name} className="h-full w-full" rounded={false} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{s.name}</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-text-2)]"><Star size={11} strokeWidth={2} className="fill-amber-400 text-amber-400" /> {ratingFor(s.id)} · {s.is_open?'เปิด':'ปิด'}</span>
              </span>
            </button>
            <button onClick={()=>toggleFav(s.id)} aria-label="ลบโปรด" className="pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 transition active:scale-[0.97]"><Heart size={18} strokeWidth={1.8} fill="currentColor" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

// — Account tab: profile + coupons + SEPARATE owner entry (top-app pattern)
function AccountView({onOrders,onOwner,onHome}:{onOrders:()=>void;onOwner:()=>void;onHome:()=>void}){
  const name = (()=>{ try{ return localStorage.getItem('tl_name') ?? '' }catch{ return '' } })()
  const phone = (()=>{ try{ return localStorage.getItem('tl_phone') ?? '' }catch{ return '' } })()
  const orders = safeParse<{code:string;store:string;at:number}[]>('tl_my_orders',[])
  const [showCoupon,setShowCoupon]=useState(false)
  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <header className="hero-gradient px-4 pb-5 pt-6 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-bold text-[var(--color-brand)] ring-2 ring-white/40">{(name || 'T').slice(0,1)}</span>
          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-bold tracking-tight" style={{fontFamily:'var(--font-display)'}}>{name || 'นักเรียน Triam'}</h1>
            <p className="text-xs text-white/70">{phone || 'ยังไม่มีเบอร์ — จะบันทึกตอนสั่งครั้งแรก'}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[14px] bg-white/10 p-3 text-center ring-1 ring-white/15 backdrop-blur"><p className="text-xl font-bold tabular-nums">{orders.length}</p><p className="text-[11px] font-medium text-white/70">ออเดอร์ทั้งหมด</p></div>
          <div className="rounded-[14px] bg-white/10 p-3 text-center ring-1 ring-white/15 backdrop-blur"><p className="text-xl font-bold tabular-nums">1</p><p className="text-[11px] font-medium text-white/70">คูปองที่ใช้ได้</p></div>
        </div>
      </header>
      <div className="grid gap-2.5 px-4 pt-4 pb-6">
        <button onClick={onOrders} className="pressable flex items-center gap-3 rounded-[18px] border border-[var(--color-border)] bg-white p-4 text-left card-shadow transition active:scale-[0.97]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-subtle)]"><ReceiptText size={20} strokeWidth={1.8} /></span>
          <span className="flex-1"><span className="block text-sm font-bold">คำสั่งซื้อของฉัน</span><span className="block text-xs text-[var(--color-text-2)]">ติดตามสถานะแบบเรียลไทม์</span></span>
          <ChevronRight size={18} strokeWidth={1.8} className="text-[var(--color-text-3)]" />
        </button>
        <div className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-white card-shadow">
          <button onClick={()=>setShowCoupon(v=>!v)} className="pressable flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.97]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"><Ticket size={20} strokeWidth={1.8} /></span>
            <span className="flex-1"><span className="block text-sm font-bold">คูปองของฉัน</span><span className="block text-xs text-[var(--color-text-2)]">LUNCH10 · ลด 10฿</span></span>
            <ChevronRight size={18} strokeWidth={1.8} className={`text-[var(--color-text-3)] transition ${showCoupon?'rotate-90':''}`} />
          </button>
          {showCoupon && (
            <div className="mx-4 mb-4 rounded-[14px] border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-bold text-[var(--color-accent-ink)]">LUNCH10</p><p className="text-xs text-[var(--color-text-2)]">ลด 10฿ เมื่อสั่งก่อน 11:30 · จ่ายเงินสดที่ร้าน</p></div>
                <button onClick={()=>{ navigator.clipboard.writeText('LUNCH10'); alert('คัดลอกโค้ด LUNCH10 แล้ว')}} className="pressable inline-flex min-h-[44px] items-center gap-1 rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-bold text-white transition active:scale-[0.97]"><Copy size={15} strokeWidth={2} /> คัดลอก</button>
              </div>
            </div>
          )}
        </div>
        <button onClick={onOwner} className="hero-gradient pressable flex items-center gap-3 rounded-[18px] p-4 text-left text-white shadow-float transition active:scale-[0.97]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><StoreIcon size={20} strokeWidth={1.8} /></span>
          <span className="flex-1"><span className="block text-sm font-bold">สำหรับร้านค้า</span><span className="block text-xs text-white/60">จัดการเมนู · ออเดอร์ · เปิด/ปิดร้าน</span></span>
          <ChevronRight size={18} strokeWidth={1.8} className="text-white/60" />
        </button>
        <button onClick={()=>alert('Triam Lunch Premium — เร็วๆ นี้: ส่วนลดพิเศษ + สิทธิ์สั่งก่อน')} className="pressable flex items-center gap-3 rounded-[18px] border border-[var(--color-border)] bg-white p-4 text-left card-shadow transition active:scale-[0.97]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Crown size={20} strokeWidth={1.8} /></span>
          <span className="flex-1"><span className="block text-sm font-bold">Triam Premium</span><span className="block text-xs text-[var(--color-text-2)]">สิทธิพิเศษสำหรับสมาชิก</span></span>
          <ChevronRight size={18} strokeWidth={1.8} className="text-[var(--color-text-3)]" />
        </button>
        <button onClick={onHome} className="pressable mt-1 rounded-full border border-[var(--color-border)] bg-white py-3 text-sm font-bold transition active:scale-[0.97]">กลับหน้าแรก</button>
        <p className="pt-2 text-center text-[11px] font-medium tracking-wide text-[var(--color-text-3)]">TRIAM LUNCH v2.0 · โรงเรียนเตรียมอุดมศึกษาพัฒนาการ</p>
      </div>
    </div>
  )
}

function SectionHead({title, action, onAction}:{title:string; action?:string; onAction?:()=>void}){
  return <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-[14px] font-bold tracking-tight" style={{fontFamily:'var(--font-display)'}}>{title}</h2>{action && (onAction ? <button onClick={onAction} className="pressable text-xs font-bold text-[var(--color-accent-ink)] transition active:scale-[0.97]">{action} <ChevronRight size={12} strokeWidth={2} className="inline" /></button> : <span className="text-xs font-bold text-[var(--color-text-2)]">{action} <ChevronRight size={12} strokeWidth={1.8} className="inline" /></span>)}</div>
}
function Quick({Icon,label,sub,accent,tone}:{Icon:typeof RotateCcw;label:string;sub:string;accent?:boolean;tone?:string}){
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-[16px] py-2 text-center">
      <span className={`flex h-[52px] w-[52px] items-center justify-center rounded-[18px] shadow-sm ring-1 ${accent ? 'bg-[var(--color-accent)] text-white ring-[var(--color-accent)] shadow-lift' : `${tone ?? 'bg-white text-[var(--color-text)]'} ring-[var(--color-border)]`}`}><Icon size={21} strokeWidth={2} /></span>
      <span className="text-xs font-bold leading-none">{label}</span>
      <span className="line-clamp-1 text-[11px] font-medium leading-none text-[var(--color-text-2)]">{sub}</span>
    </div>
  )
}
function EmptyState({onClear}:{onClear:()=>void}){
  return <div className="rounded-[18px] border border-dashed border-[var(--color-border)] bg-white p-8 text-center card-shadow"><StoreIcon size={24} strokeWidth={1.8} className="mx-auto text-[var(--color-text-3)]" /><p className="mt-2 text-sm font-bold">ไม่พบร้าน</p><p className="text-xs text-[var(--color-text-2)]">ลองเปลี่ยนคำค้นหรือหมวดหมู่</p><button onClick={onClear} className="pressable mt-3 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-bold transition active:scale-[0.97]">ล้างตัวกรอง</button></div>
}
