import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { MapPin, Star, Heart, ChevronRight, Home as HomeIcon, ReceiptText, Search as SearchIcon, User as UserIcon, SlidersHorizontal, Clock3, RotateCcw, Bookmark, Ticket, Crown, UtensilsCrossed, Check, Copy, Store as StoreIcon } from 'lucide-react'
import { supabase, type Store as StoreType, type MenuItem } from './lib/supabase'
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
const U = (id:string)=>`https://images.unsplash.com/photo-${id}?w=200&q=70&auto=format&fit=crop`

// Photo-tile categories (Grab/LINE MAN style). `match` aligns with real menu
// category names in the DB — the old icon-chip ids matched nothing.
const CAT_DEFS: { id: string; label: string; match: string[]; img: string | null }[] = [
  { id:'all', label:'ทั้งหมด', match:[], img:null },
  { id:'rice', label:'ข้าว', match:['ข้าว'], img:U('1512058564366-18510be2db19') },
  { id:'noodle', label:'ก๋วยเตี๋ยว', match:['ก๋วยเตี๋ยว','บะหมี่'], img:U('1569718212165-3a8278d5f624') },
  { id:'fried', label:'ไก่ทอด', match:['ไก่ทอด','ข้าวหมก','ข้าวเหนียว','ของทอด'], img:U('1562967914-608f82629710') },
  { id:'drink', label:'เครื่องดื่ม', match:['ชานม','ชาเขียว','โกโก้','น้ำ','ชาไทย','เครื่องดื่ม'], img:U('1579954115545-a95591f28bfc') },
  { id:'dessert', label:'ของหวาน', match:['ขนม','ของหวาน','ของทานเล่น'], img:U('1563805042-7684c019e1cb') },
]

const onImgErr=(e:React.SyntheticEvent<HTMLImageElement>)=>{(e.currentTarget.style.display='none'); const p=e.currentTarget.nextElementSibling as HTMLElement|null; if(p) p.style.display='flex'}

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
      <main className={`mx-auto max-w-[480px] ${view.page!=='home'?'pb-24':'pb-[76px]'}`}>
        {view.page==='store' && <StorePage id={view.id} onBack={()=>setView({page:'home'})} onTrack={()=>{ setView({page:'home'}); setTab('orders') }} />}
        {view.page==='owner' && <OwnerHome onBackHome={()=>setView({page:'home'})} />}
        {view.page==='home' && tab==='home' && <Home stores={stores} loading={loading} loadErr={loadErr} onRetry={loadStores} onOpen={id=>setView({page:'store',id})} onGoOrders={()=>setTab('orders')} />}
        {view.page==='home' && tab==='search' && <SearchView stores={stores} onOpen={id=>setView({page:'store',id})} />}
        {view.page==='home' && tab==='orders' && <TrackOrderView />}
        {view.page==='home' && tab==='favs' && <FavsView stores={stores} onOpen={id=>setView({page:'store',id})} onBrowse={()=>setTab('home')} />}
        {view.page==='home' && tab==='account' && <AccountView onOrders={()=>setTab('orders')} onOwner={()=>setView({page:'owner'})} onHome={()=>setTab('home')} />}
      </main>
      {view.page==='home' && (
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-[var(--color-border)] bg-white pb-safe">
          <div className="grid grid-cols-5">
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
    <button onClick={onClick} aria-label={label} className={`pressable flex min-h-[44px] flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition active:scale-[0.97] ${active?'text-[var(--color-text)]':'text-[var(--color-text-3)]'}`}>
      <span className="relative"><Icon size={20} strokeWidth={1.8} />{badge!=null && <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">{badge}</span>}</span>
      {label}
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

  return (
    <div className="bg-[var(--color-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/90 px-4 pb-3 pt-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        {/* Row 1: location pill + cart */}
        <div className="flex items-center justify-between gap-2">
          <button onClick={()=>setShowLocation(true)} aria-label="เลือกจุดรับอาหาร" className="pressable flex min-h-[44px] items-center gap-2 text-left transition active:scale-[0.97]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-text)] text-white"><MapPin size={18} strokeWidth={1.8} /></span>
            <span className="leading-tight">
              <span className="block text-[11px] font-medium text-[var(--color-text-2)]">ส่งที่</span>
              <span className="flex items-center gap-1 text-[13px] font-semibold">อาคารโรงอาหาร · ม.4–ม.6 <ChevronRight size={12} strokeWidth={1.8} className="text-[var(--color-text-3)]" /></span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-ink)] ring-1 ring-[var(--color-accent)]/15">{stores.filter(s=>s.is_open).length} ร้านเปิด</span>
            <button aria-label={`ตะกร้า ${cartCount} รายการ`} onClick={()=>onGoOrders?.()} className="pressable relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white transition active:scale-[0.97]">
              <ReceiptText size={18} strokeWidth={1.8} />{cartCount>0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[11px] font-bold text-white">{cartCount}</span>}
            </button>
          </div>
        </div>
        {/* Row 2: SearchBar pill + filter */}
        <div className="mt-3 flex items-center gap-2">
          <SearchBar value={q} onChange={onSearch} placeholder="ค้นหาร้านค้า เมนู..." />
          <button onClick={()=>setShowFilter(true)} aria-label="ตัวกรอง" className={`pressable flex h-10 w-10 items-center justify-center rounded-full border bg-white transition active:scale-[0.97] ${filterOpenOnly||sortBy!=='default'||favOnly?'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]':'border-[var(--color-border)]'}`}><SlidersHorizontal size={18} strokeWidth={1.8} /></button>
        </div>
        {/* Row 3: segmented control */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex gap-1 rounded-full bg-[var(--color-bg-subtle)] p-1">
            {(['pickup','preorder'] as const).map(m=>(
              <button key={m} onClick={()=>setMode(m)} className={`pressable min-h-[44px] rounded-full px-4 py-2 text-xs font-semibold transition active:scale-[0.97] ${mode===m?'bg-[var(--color-text)] text-white shadow-sm':'text-[var(--color-text-2)]'}`}>{m==='pickup'?'รับที่ร้าน':'สั่งล่วงหน้า'}</button>
            ))}
          </div>
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--color-text-2)]"><Clock3 size={18} strokeWidth={1.8} /> รอบ {pickupSlotsDisplay}</span>
        </div>
        {recent.length>0 && !qDebounced && (
          <div className="mt-2 flex flex-wrap gap-1.5" role="list" aria-label="ค้นหาล่าสุด">
            {recent.map(r=> <button key={r} onClick={()=>setQ(r)} className="pressable min-h-[44px] rounded-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-xs font-medium text-[var(--color-text-2)] transition active:scale-[0.97]">{r}</button>)}
            <button onClick={()=>{ setRecent([]); try{localStorage.removeItem('tl_recent_q')}catch{} }} className="pressable min-h-[44px] px-2 text-xs font-medium text-[var(--color-text-2)] transition active:scale-[0.97]">ล้าง</button>
          </div>
        )}
      </header>

      {/* Quick actions — now all functional buttons */}
      <section className="bg-white px-4 pb-3 pt-3">
        <div className="grid grid-cols-4 gap-3">
          <button onClick={()=>{ if(lastOrder){ const st=stores.find(x=>x.name===lastOrder.store); if(st) onOpen(st.id); else alert('ไม่พบร้านของออเดอร์ล่าสุด')} else alert('ยังไม่มีประวัติการสั่ง — สั่งอาหารก่อนแล้วจะสั่งซ้ำได้เลย')}} aria-label="สั่งซ้ำ" className="pressable flex flex-col items-center transition active:scale-[0.97]"><Quick Icon={RotateCcw} label="สั่งซ้ำ" sub={lastOrder ? lastOrder.store.slice(0,8) : 'ยังไม่มี'} /></button>
          <button onClick={()=>{
            if(favs.size===0) alert('ยังไม่มีร้านโปรด — กดหัวใจที่ร้านเพื่อบันทึก')
            else { setFavOnly(v=>!v); document.getElementById('store-list')?.scrollIntoView({behavior:'smooth'}) }
          }} aria-label={`รายการโปรด ${favs.size} ร้าน`} className="pressable flex flex-col items-center transition active:scale-[0.97]"><Quick Icon={Bookmark} label="รายการโปรด" sub={favOnly? 'กำลังกรอง' : `${favs.size} ร้าน`} /></button>
          <button onClick={()=>setShowCoupon(true)} aria-label="ดูคูปอง" className="pressable flex flex-col items-center transition active:scale-[0.97]"><Quick Icon={Ticket} label="คูปอง" sub="ลด 10฿" accent /></button>
          <button onClick={()=>alert('Triam Lunch Premium — เร็วๆ นี้: ฟรีค่าส่งทุกออเดอร์ + ส่วนลดพิเศษ')} aria-label="พรีเมียม" className="pressable flex flex-col items-center transition active:scale-[0.97]"><Quick Icon={Crown} label="พรีเมียม" sub="ฟรีค่าส่ง" /></button>
        </div>
      </section>

      {/* Promo carousel — swipeable + auto-advance like GrabFood/LINE MAN */}
      <section className="bg-white px-4 pb-3">
        <div
          ref={promoRef}
          onScroll={e=>{ const el=e.currentTarget; const i=Math.min(2, Math.round(el.scrollLeft/Math.max(1,el.clientWidth))); promoIdxRef.current=i; setPromoIdx(i) }}
          className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1"
        >
          <button onClick={()=>setShowCoupon(true)} className="flex w-full shrink-0 snap-center items-center gap-4 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-accent-soft)] p-4 text-left">
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-wide text-[var(--color-accent-ink)]">โปรรอบเที่ยง</p>
              <p className="mt-0.5 text-[15px] font-bold leading-tight text-[var(--color-text)]">สั่งล่วงหน้าก่อน 11:30<br/>ลดทันที 10 บาท</p>
              <p className="mt-1 text-xs font-medium text-[var(--color-text-2)]">แตะเพื่อดูเงื่อนไข · จ่ายเงินสดที่ร้าน</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-white ring-1 ring-[var(--color-border)]"><UtensilsCrossed size={20} strokeWidth={1.8} className="text-[var(--color-accent)]" /></div>
          </button>
          <button onClick={()=>document.getElementById('store-list')?.scrollIntoView({behavior:'smooth'})} className="flex w-full shrink-0 snap-center items-center gap-4 rounded-[16px] bg-neutral-900 p-4 text-left text-white">
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-wide text-white/60">รับที่ร้าน · ไม่รอคิว</p>
              <p className="mt-0.5 text-[15px] font-bold leading-tight">เลือกรอบ {pickupSlotsDisplay}<br/>มารับตรงเวลาได้เลย</p>
              <p className="mt-1 text-xs font-medium text-white/60">แตะเพื่อดูร้านทั้งหมด</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-white/10 ring-1 ring-white/15"><Clock3 size={20} strokeWidth={1.8} className="text-white" /></div>
          </button>
          <button onClick={()=>{ if(favs.size>0){ setFavOnly(true); document.getElementById('store-list')?.scrollIntoView({behavior:'smooth'}) } else alert('ยังไม่มีร้านโปรด — กดหัวใจที่ร้านเพื่อบันทึก') }} className="flex w-full shrink-0 snap-center items-center gap-4 rounded-[16px] border border-[var(--color-border)] bg-white p-4 text-left card-shadow">
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-wide text-[var(--color-text-2)]">ร้านโปรดของคุณ</p>
              <p className="mt-0.5 text-[15px] font-bold leading-tight text-[var(--color-text)]">{favs.size>0 ? `${favs.size} ร้านที่บันทึกไว้` : 'ยังไม่มีร้านโปรด'}<br/>{favs.size>0 ? 'แตะเพื่อดูเฉพาะร้านโปรด' : 'กดหัวใจเพื่อบันทึก'}</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-red-50 ring-1 ring-[var(--color-border)]"><Heart size={20} strokeWidth={1.8} className="text-red-500" fill="currentColor" /></div>
          </button>
        </div>
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
          {[0,1,2].map(i=> <span key={i} className={`h-1.5 rounded-full transition-all ${promoIdx===i?'w-5 bg-[var(--color-text)]':'w-1.5 bg-[var(--color-border-strong)]'}`} />)}
        </div>
      </section>

      {/* Reorder — history */}
      {lastOrder && (
        <section className="bg-white px-4 pb-3 pt-1">
          <SectionHead title="สั่งอีกครั้ง" action="ดูทั้งหมด" onAction={()=>{ const s=stores.find(x=>x.name===lastOrder.store); if(s) onOpen(s.id)}} />
          <div className="card-shadow flex items-center gap-3 rounded-[16px] border border-[var(--color-border)] bg-white p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-text)] text-sm font-bold text-white">{lastOrder.store.slice(0,1)}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{lastOrder.store}</p><p className="text-xs text-[var(--color-text-2)]">รหัส {lastOrder.code} · แตะเพื่อสั่งซ้ำ</p></div>
            <button onClick={()=>{ const s=stores.find(x=>x.name===lastOrder.store); if(s) onOpen(s.id) }} className="pressable rounded-full bg-[var(--color-text)] px-4 py-2 text-xs font-semibold text-white transition active:scale-[0.97]">สั่งซ้ำ</button>
          </div>
        </section>
      )}

      {/* Categories — big photo tiles like Grab/LINE MAN */}
      <section className="bg-white px-4 pb-3 pt-3">
        <SectionHead title="หมวดหมู่" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1" style={{scrollbarWidth:'none'}}>
          {CAT_DEFS.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} aria-pressed={cat===c.id} className="pressable flex w-[72px] shrink-0 snap-start flex-col items-center gap-1.5 transition active:scale-[0.97]">
              {c.img ? (
                <span className={`block h-16 w-16 overflow-hidden rounded-[16px] ring-2 transition ${cat===c.id?'ring-[var(--color-text)]':'ring-[var(--color-border)]'}`}>
                  <img src={c.img} alt={c.label} className="h-full w-full object-cover" loading="lazy" onError={onImgErr} /><span style={{display:'none'}} className="flex h-full w-full items-center justify-center bg-[var(--color-bg-subtle)] text-sm font-bold text-[var(--color-text-2)]">{c.label.slice(0,1)}</span>
                </span>
              ) : (
                <span className={`flex h-16 w-16 items-center justify-center rounded-[16px] transition ${cat===c.id?'bg-neutral-900 text-white':'bg-[var(--color-bg-subtle)] text-[var(--color-text)]'}`}><UtensilsCrossed size={20} strokeWidth={1.8} /></span>
              )}
              <span className={`text-[11px] font-semibold leading-none ${cat===c.id?'text-[var(--color-text)]':'text-[var(--color-text-2)]'}`}>{c.label}</span>
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
              <button key={m.id} onClick={()=> onOpen(m.store_id)} aria-label={`เปิดร้านของ ${m.name}`} className="pressable w-[148px] shrink-0 overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-white text-left card-shadow transition active:scale-[0.97]">
                <>{m.image_url ? <><div className="relative h-[96px] w-full overflow-hidden bg-[var(--color-bg-subtle)]"><img src={m.image_url} alt={m.name} className="h-full w-full object-cover" loading="lazy" onError={onImgErr} /><div style={{display:"none"}} className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-subtle)] text-sm font-bold text-[var(--color-text-2)]">{m.name.slice(0,2)}</div><span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white backdrop-blur"><Star size={10} strokeWidth={1.8} className="fill-amber-400 text-amber-400" /> 4.8</span></div></> : <div className="flex h-[96px] items-center justify-center bg-[var(--color-bg-subtle)] text-sm font-bold text-[var(--color-text-3)]">{m.name.slice(0,2)}</div>}</>
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
      <section id="store-list" className="bg-[var(--color-bg)] px-3 pb-6 pt-3">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-display text-[14px]" style={{fontFamily:'var(--font-display)'}}>ร้านแนะนำ</h2>
           <button onClick={()=>setShowFilter(true)} className="pressable inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-[var(--color-text-2)] transition active:scale-[0.97]"><SlidersHorizontal size={18} strokeWidth={1.8} /> ตัวกรอง</button>
        </div>
        <p className="mb-2 px-1 text-xs text-[var(--color-text-2)]">{filtered.length} ร้าน · {cat==='all' ? 'ทั้งหมด' : CAT_DEFS.find(c=>c.id===cat)?.label}{filterOpenOnly?' · เปิดอยู่':''}{favOnly?' · ร้านโปรด':''}</p>
        {loadErr && <div className="rounded-[16px] border border-[var(--color-border)] bg-white p-8 text-center card-shadow"><StoreIcon size={28} strokeWidth={1.8} className="mx-auto text-[var(--color-text-3)]" /><p className="mt-2 text-sm font-semibold">โหลดร้านไม่สำเร็จ</p><p className="mt-1 text-xs text-[var(--color-text-2)]">{loadErr}</p><button onClick={onRetry} className="pressable mt-3 rounded-full bg-[var(--color-text)] px-5 py-2.5 text-xs font-semibold text-white transition active:scale-[0.97]">ลองใหม่</button></div>}
        {loading && !loadErr && <div className="grid gap-3">{[0,1,2,3].map(i=> <SkeletonCard key={i} />)}</div>}
        {!loading && !loadErr && filtered.length===0 && <EmptyState onClear={()=>{setQ('');setCat('all');setFilterOpenOnly(false); setFavOnly(false)}} />}
        <div className="grid gap-3">
          {filtered.map(s=>{
            const r=ratingFor(s.id), rev=reviewsFor(s.id); const isFav=favs.has(s.id)
            return (
              <div key={s.id} className="pressable group relative overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-white card-shadow transition active:scale-[0.97]">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-bg-subtle)]">
                  <button onClick={()=> s.is_open ? onOpen(s.id) : alert('ร้านปิดรับออเดอร์ — ดูเมนูได้อย่างเดียว')} aria-label={`เปิดร้าน ${s.name}`} className="pressable block h-full w-full text-left transition active:scale-[0.97]">
                    {s.image_url ? <><img src={s.image_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" onError={onImgErr} /><span style={{display:"none"}} className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-subtle)] text-lg font-bold text-[var(--color-text-2)]">{s.name.slice(0,2)}</span><div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" /></> : <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[var(--color-text-2)]">{s.name.slice(0,2)}</div>}
                    {!s.is_open && <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-bold backdrop-blur-[1px]">ปิด</span>}
                  </button>
                  <button onClick={e=>{e.stopPropagation(); e.preventDefault(); toggleFav(s.id)}} aria-label={isFav?'ลบโปรด':'โปรด'} className={`pressable absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur ring-1 ring-black/5 transition active:scale-[0.97] ${isFav?'bg-white text-red-500':'bg-white/90 text-[var(--color-text-3)]'}`}><Heart size={18} strokeWidth={1.8} fill={isFav?'currentColor':'none'} /></button>
                  {s.is_open && <span className="absolute left-2.5 top-2.5 rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">ลด 10฿</span>}
                  <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold tabular-nums shadow-sm backdrop-blur"><Star size={11} strokeWidth={1.8} className="fill-amber-400 text-amber-400" /> {r} · {rev}+</span>
                </div>
                <button onClick={()=> s.is_open ? onOpen(s.id) : alert('ร้านปิดรับออเดอร์ — ดูเมนูได้อย่างเดียว')} className="pressable block w-full p-3.5 text-left transition active:scale-[0.97]">
                  <h3 className="line-clamp-1 text-[16px] font-semibold leading-tight" style={{fontFamily:'var(--font-display)'}}>{s.name}</h3>
                  {s.description && <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-2)]">{s.description}</p>}
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--color-text-2)]"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.is_open?'bg-[var(--color-accent)]':'bg-[var(--color-text-3)]'}`} />{s.is_open?'เปิด':'ปิด'} · <Clock3 size={18} strokeWidth={1.8} /> 15 นาที · {s.pickup_slots?.[0]??'11:50'} รับที่ร้าน</p>
                  {s.location && <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[var(--color-text-3)]"><MapPin size={18} strokeWidth={1.8} className="shrink-0" />{s.location}</p>}
                </button>
              </div>
            )
          })}
        </div>
        <p className="pt-6 text-center text-[11px] font-medium tracking-wide text-[var(--color-text-3)]">TRIAM LUNCH · โรงเรียนเตรียมอุดมศึกษาพัฒนาการ</p>
      </section>

      <BottomSheet open={showFilter} onClose={()=>setShowFilter(false)} title="ตัวกรอง">
        <div className="grid gap-3">
          <div className="flex items-center justify-between rounded-[12px] border border-[var(--color-border)] bg-[#fafafa] px-3.5 py-3">
            <span className="text-sm font-medium">แสดงเฉพาะร้านที่เปิด</span>
            <button onClick={()=>setFilterOpenOnly(v=>!v)} role="switch" aria-checked={filterOpenOnly} aria-label="แสดงเฉพาะร้านที่เปิด" className={`pressable flex h-6 w-11 items-center rounded-full p-0.5 transition active:scale-[0.97] ${filterOpenOnly?'bg-[var(--color-accent)]':'bg-[#e5e5e5]'}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition ${filterOpenOnly?'translate-x-5':''}`} /></button>
          </div>
          <div className="flex items-center justify-between rounded-[12px] border border-[var(--color-border)] bg-[#fafafa] px-3.5 py-3">
            <span className="text-sm font-medium">เฉพาะร้านโปรด</span>
            <button onClick={()=>setFavOnly(v=>!v)} role="switch" aria-checked={favOnly} aria-label="เฉพาะร้านโปรด" className={`pressable flex h-6 w-11 items-center rounded-full p-0.5 transition active:scale-[0.97] ${favOnly?'bg-[var(--color-accent)]':'bg-[#e5e5e5]'}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition ${favOnly?'translate-x-5':''}`} /></button>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">เรียงตาม</p>
            <div className="flex gap-2">
              {([{id:'default',label:'แนะนำ'},{id:'rating',label:'เรตติ้งสูงสุด'},{id:'reviews',label:'ยอดนิยม'}] as const).map(o=>(
                <button key={o.id} onClick={()=>setSortBy(o.id)} className={`pressable flex-1 rounded-full px-3 py-2 text-sm font-semibold ring-1 transition active:scale-[0.97] ${sortBy===o.id?'bg-[var(--color-text)] text-white ring-[var(--color-text)]':'bg-white ring-[var(--color-border)]'}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={()=>{ setFilterOpenOnly(false); setSortBy('default'); setCat('all'); setFavOnly(false)}} className="pressable rounded-full border border-[var(--color-border)] bg-white py-3 text-sm font-semibold transition active:scale-[0.97]">ล้างทั้งหมด</button>
            <button onClick={()=>setShowFilter(false)} className="pressable rounded-full bg-[var(--color-text)] py-3 text-sm font-semibold text-white transition active:scale-[0.97]">ดู {filtered.length} ร้าน</button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={showCoupon} onClose={()=>setShowCoupon(false)} title="คูปองของคุณ">
        <div className="rounded-[12px] border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-bold text-[var(--color-accent-ink)]">LUNCH10</p><p className="text-xs text-[var(--color-text-2)]">ลด 10฿ เมื่อสั่งล่วงหน้าก่อน 11:30</p><p className="mt-1 text-[11px] text-[var(--color-text-3)]">รับที่ร้าน · จ่ายเงินสด · ใช้ได้ 1 ครั้ง/วัน</p></div>
            <button onClick={()=>{ navigator.clipboard.writeText('LUNCH10'); alert('คัดลอกโค้ด LUNCH10 แล้ว')}} className="pressable shrink-0 rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-bold text-white transition active:scale-[0.97]">คัดลอก</button>
          </div>
        </div>
        <button onClick={()=>setShowCoupon(false)} className="pressable mt-4 w-full rounded-full bg-[var(--color-text)] py-3 text-sm font-semibold text-white transition active:scale-[0.97]">ปิด</button>
      </BottomSheet>

      <BottomSheet open={showLocation} onClose={()=>setShowLocation(false)} title="จุดรับอาหาร">
        <div className="rounded-[12px] border border-[var(--color-border)] bg-[#fafafa] p-3.5">
          <p className="flex items-center gap-2 text-sm font-semibold"><MapPin size={18} strokeWidth={1.8} /> อาคารโรงอาหาร ชั้น 1</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-2)]">โรงเรียนเตรียมอุดมศึกษาพัฒนาการ · ม.4–ม.6<br/>เปิด 10:00–13:30 · รอบรับ {pickupSlotsDisplay} น.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{[...new Set(stores.flatMap(s=>s.pickup_slots??[]))].slice(0,6).map(s=> <span key={s} className="rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-medium tabular-nums">{s} น.</span>)}</div>
        </div>
        <div className="mt-3 rounded-[12px] bg-[var(--color-accent-soft)] px-3.5 py-3 ring-1 ring-[var(--color-accent)]/15"><p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent-ink)]"><Check size={18} strokeWidth={1.8} /> สั่งล่วงหน้า มารับตรงเวลา ไม่ต้องรอคิว</p></div>
        <button onClick={()=>setShowLocation(false)} className="pressable mt-4 w-full rounded-full bg-[var(--color-text)] py-3 text-sm font-semibold text-white transition active:scale-[0.97]">ตกลง</button>
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
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/90 px-4 pb-3 pt-6 backdrop-blur">
        <h1 className="text-display">ค้นหา</h1>
        <div className="mt-3"><SearchBar value={q} onChange={onSearch} placeholder="ค้นหาร้านค้า เมนู..." /></div>
        {recent.length>0 && !qd && (
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="ค้นหาล่าสุด">
            {recent.map(r=> <button key={r} onClick={()=>setQ(r)} className="pressable min-h-[44px] rounded-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-xs font-medium text-[var(--color-text-2)] transition active:scale-[0.97]">{r}</button>)}
          </div>
        )}
      </header>
      <div className="px-4 pt-4">
        {!qd && (
          <div>
            <p className="mb-2 text-[13px] font-bold">หมวดยอดนิยม</p>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {CAT_DEFS.filter(c=>c.img).map(c=>(
                <div key={c.id} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
                  <span className="block h-16 w-16 overflow-hidden rounded-[16px] ring-1 ring-[var(--color-border)]"><img src={c.img!} alt={c.label} className="h-full w-full object-cover" loading="lazy" onError={onImgErr} /></span>
                  <span className="text-[11px] font-semibold text-[var(--color-text-2)]">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {qd.trim() && <p className="mb-2 px-1 text-xs text-[var(--color-text-2)]">เจอ {results.length} ร้าน · “{qd.trim()}”</p>}
        <div className="grid gap-2.5 pb-6">
          {results.map(({store:s,dishes})=>(
            <button key={s.id} onClick={()=>onOpen(s.id)} className="pressable flex items-center gap-3 rounded-[16px] border border-[var(--color-border)] bg-white p-3 text-left card-shadow transition active:scale-[0.97]">
              <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-[var(--color-bg-subtle)]">
                {s.image_url ? <><img src={s.image_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" onError={onImgErr} /><span style={{display:'none'}} className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[var(--color-text-2)]">{s.name.slice(0,2)}</span></> : <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--color-text-2)]">{s.name.slice(0,2)}</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{s.name}</span>
                {dishes.length>0 && <span className="block truncate text-xs text-[var(--color-text-2)]">มี: {dishes.join(' · ')}</span>}
                <span className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-text-2)]"><Star size={11} strokeWidth={1.8} className="fill-amber-400 text-amber-400" /> {ratingFor(s.id)} · {s.is_open?'เปิด':'ปิด'} · {s.pickup_slots?.[0]??'11:50'}</span>
              </span>
              <ChevronRight size={18} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-3)]" />
            </button>
          ))}
          {qd.trim() && results.length===0 && (
            <div className="rounded-[16px] border border-dashed border-[var(--color-border)] bg-white p-8 text-center card-shadow"><SearchIcon size={24} strokeWidth={1.8} className="mx-auto text-[var(--color-text-3)]" /><p className="mt-2 text-sm font-semibold">ไม่เจอ “{qd.trim()}”</p><p className="text-xs text-[var(--color-text-2)]">ลองคำอื่น เช่น ข้าว ก๋วยเตี๋ยว ชานม</p></div>
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
      <header className="border-b border-[var(--color-border)] bg-white px-4 pb-4 pt-6">
        <h1 className="text-display">ร้านโปรด</h1>
        <p className="mt-0.5 text-sm text-[var(--color-text-2)]">{list.length} ร้านที่บันทึกไว้</p>
      </header>
      <div className="grid gap-2.5 px-4 pt-4 pb-6">
        {list.length===0 && (
          <div className="rounded-[16px] border border-dashed border-[var(--color-border)] bg-white p-8 text-center card-shadow"><Heart size={24} strokeWidth={1.8} className="mx-auto text-[var(--color-text-3)]" /><p className="mt-2 text-sm font-semibold">ยังไม่มีร้านโปรด</p><p className="text-xs text-[var(--color-text-2)]">กดหัวใจที่ร้านเพื่อบันทึกไว้สั่งไวครั้งหน้า</p><button onClick={onBrowse} className="pressable mt-3 rounded-full bg-[var(--color-text)] px-5 py-2.5 text-xs font-semibold text-white transition active:scale-[0.97]">ดูร้านทั้งหมด</button></div>
        )}
        {list.map(s=>(
          <div key={s.id} className="pressable flex items-center gap-3 rounded-[16px] border border-[var(--color-border)] bg-white p-3 card-shadow transition active:scale-[0.97]">
            <button onClick={()=>onOpen(s.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-[var(--color-bg-subtle)]">
                {s.image_url ? <><img src={s.image_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" onError={onImgErr} /><span style={{display:'none'}} className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[var(--color-text-2)]">{s.name.slice(0,2)}</span></> : <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--color-text-2)]">{s.name.slice(0,2)}</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{s.name}</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-text-2)]"><Star size={11} strokeWidth={1.8} className="fill-amber-400 text-amber-400" /> {ratingFor(s.id)} · {s.is_open?'เปิด':'ปิด'}</span>
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
      <header className="border-b border-[var(--color-border)] bg-white px-4 pb-5 pt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-text)] text-xl font-bold text-white">{(name || 'T').slice(0,1)}</span>
          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-bold tracking-tight" style={{fontFamily:'var(--font-display)'}}>{name || 'นักเรียน Triam'}</h1>
            <p className="text-xs text-[var(--color-text-2)]">{phone || 'ยังไม่มีเบอร์ — จะบันทึกตอนสั่งครั้งแรก'}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[12px] border border-[var(--color-border)] bg-[#fafafa] p-3 text-center"><p className="text-xl font-bold tabular-nums">{orders.length}</p><p className="text-[11px] font-medium text-[var(--color-text-2)]">ออเดอร์ทั้งหมด</p></div>
          <div className="rounded-[12px] border border-[var(--color-border)] bg-[#fafafa] p-3 text-center"><p className="text-xl font-bold tabular-nums">1</p><p className="text-[11px] font-medium text-[var(--color-text-2)]">คูปองที่ใช้ได้</p></div>
        </div>
      </header>
      <div className="grid gap-2.5 px-4 pt-4 pb-6">
        <button onClick={onOrders} className="pressable flex items-center gap-3 rounded-[16px] border border-[var(--color-border)] bg-white p-4 text-left card-shadow transition active:scale-[0.97]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-subtle)]"><ReceiptText size={20} strokeWidth={1.8} /></span>
          <span className="flex-1"><span className="block text-sm font-semibold">คำสั่งซื้อของฉัน</span><span className="block text-xs text-[var(--color-text-2)]">ติดตามสถานะแบบเรียลไทม์</span></span>
          <ChevronRight size={18} strokeWidth={1.8} className="text-[var(--color-text-3)]" />
        </button>
        <div className="overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-white card-shadow">
          <button onClick={()=>setShowCoupon(v=>!v)} className="pressable flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.97]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"><Ticket size={20} strokeWidth={1.8} /></span>
            <span className="flex-1"><span className="block text-sm font-semibold">คูปองของฉัน</span><span className="block text-xs text-[var(--color-text-2)]">LUNCH10 · ลด 10฿</span></span>
            <ChevronRight size={18} strokeWidth={1.8} className={`text-[var(--color-text-3)] transition ${showCoupon?'rotate-90':''}`} />
          </button>
          {showCoupon && (
            <div className="mx-4 mb-4 rounded-[12px] border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-bold text-[var(--color-accent-ink)]">LUNCH10</p><p className="text-xs text-[var(--color-text-2)]">ลด 10฿ เมื่อสั่งก่อน 11:30 · จ่ายเงินสดที่ร้าน</p></div>
                <button onClick={()=>{ navigator.clipboard.writeText('LUNCH10'); alert('คัดลอกโค้ด LUNCH10 แล้ว')}} className="pressable inline-flex min-h-[44px] items-center gap-1 rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-bold text-white transition active:scale-[0.97]"><Copy size={18} strokeWidth={1.8} /> คัดลอก</button>
              </div>
            </div>
          )}
        </div>
        <button onClick={onOwner} className="pressable flex items-center gap-3 rounded-[16px] bg-neutral-900 p-4 text-left text-white transition active:scale-[0.97]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><StoreIcon size={20} strokeWidth={1.8} /></span>
          <span className="flex-1"><span className="block text-sm font-semibold">สำหรับร้านค้า</span><span className="block text-xs text-white/60">จัดการเมนู · ออเดอร์ · เปิด/ปิดร้าน</span></span>
          <ChevronRight size={18} strokeWidth={1.8} className="text-white/60" />
        </button>
        <button onClick={()=>alert('Triam Lunch Premium — เร็วๆ นี้: ส่วนลดพิเศษ + สิทธิ์สั่งก่อน')} className="pressable flex items-center gap-3 rounded-[16px] border border-[var(--color-border)] bg-white p-4 text-left card-shadow transition active:scale-[0.97]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Crown size={20} strokeWidth={1.8} /></span>
          <span className="flex-1"><span className="block text-sm font-semibold">Triam Premium</span><span className="block text-xs text-[var(--color-text-2)]">สิทธิพิเศษสำหรับสมาชิก</span></span>
          <ChevronRight size={18} strokeWidth={1.8} className="text-[var(--color-text-3)]" />
        </button>
        <button onClick={onHome} className="pressable mt-1 rounded-full border border-[var(--color-border)] bg-white py-3 text-sm font-semibold transition active:scale-[0.97]">กลับหน้าแรก</button>
        <p className="pt-2 text-center text-[11px] font-medium tracking-wide text-[var(--color-text-3)]">TRIAM LUNCH v1.0 · โรงเรียนเตรียมอุดมศึกษาพัฒนาการ</p>
      </div>
    </div>
  )
}

function SectionHead({title, action, onAction}:{title:string; action?:string; onAction?:()=>void}){
  return <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-[13px] font-bold tracking-tight" style={{fontFamily:'var(--font-display)'}}>{title}</h2>{action && (onAction ? <button onClick={onAction} className="pressable text-xs font-semibold text-[var(--color-text-2)] transition active:scale-[0.97]">{action} <ChevronRight size={12} strokeWidth={1.8} className="inline" /></button> : <span className="text-xs font-semibold text-[var(--color-text-2)]">{action} <ChevronRight size={12} strokeWidth={1.8} className="inline" /></span>)}</div>
}
function Quick({Icon,label,sub,accent}:{Icon:typeof RotateCcw;label:string;sub:string;accent?:boolean}){
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span className={`flex h-12 w-12 items-center justify-center rounded-full ring-1 ${accent ? 'bg-[var(--color-accent)] text-white ring-[var(--color-accent)]' : 'bg-white text-[var(--color-text)] ring-[var(--color-border)]'}`}><Icon size={20} strokeWidth={1.8} /></span>
      <span className="text-xs font-semibold leading-none">{label}</span>
      <span className="line-clamp-1 text-[11px] leading-none text-[var(--color-text-2)]">{sub}</span>
    </div>
  )
}
function EmptyState({onClear}:{onClear:()=>void}){
  return <div className="rounded-[16px] border border-dashed border-[var(--color-border)] bg-white p-8 text-center card-shadow"><StoreIcon size={24} strokeWidth={1.8} className="mx-auto text-[var(--color-text-3)]" /><p className="mt-2 text-sm font-semibold">ไม่พบร้าน</p><p className="text-xs text-[var(--color-text-2)]">ลองเปลี่ยนคำค้นหรือหมวดหมู่</p><button onClick={onClear} className="pressable mt-3 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-semibold transition active:scale-[0.97]">ล้างตัวกรอง</button></div>
}
