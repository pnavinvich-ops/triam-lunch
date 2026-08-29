import { useEffect, useMemo, useState } from 'react'
import { Search, MapPin, Star, Heart, ChevronRight, Home as HomeIcon, ReceiptText, Store as StoreIcon, SlidersHorizontal, Flame, Award } from 'lucide-react'
import { supabase, type Store as StoreType } from './lib/supabase'
import { useCart } from './lib/cart'
import StorePage from './pages/StorePage'
import OwnerHome, { TrackOrderView } from './pages/OwnerHome'

type Tab = 'home' | 'track' | 'owner'
export type View = { page: 'home' } | { page: 'store'; id: string }

// deterministic helpers
const TINTS = [
  'from-rose-400 to-pink-500',
  'from-orange-400 to-red-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
]
function tint(id: string) { let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return TINTS[h%TINTS.length] }
function ratingFor(id: string) { let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return (4.4 + (h%6)/10).toFixed(1) }
function reviewsFor(id: string) { let h=0; for(let i=0;i<id.length;i++) h=(h*37+id.charCodeAt(i))>>>0; return 20 + (h%180) }

const CATS = [
  { id:'all', label:'ทั้งหมด', emoji:'🍱', bg:'bg-orange-50', ring:'ring-orange-200' },
  { id:'ข้าว', label:'ข้าว', emoji:'🍛', bg:'bg-amber-50', ring:'ring-amber-200' },
  { id:'ก๋วยเตี๋ยว', label:'ก๋วยเตี๋ยว', emoji:'🍜', bg:'bg-yellow-50', ring:'ring-yellow-200' },
  { id:'ของว่าง', label:'ของว่าง', emoji:'🍟', bg:'bg-red-50', ring:'ring-red-200' },
  { id:'เครื่องดื่ม', label:'เครื่องดื่ม', emoji:'🧃', bg:'bg-sky-50', ring:'ring-sky-200' },
  { id:'ของหวาน', label:'ของหวาน', emoji:'🍧', bg:'bg-pink-50', ring:'ring-pink-200' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [view, setView] = useState<View>({ page: 'home' })
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const cartCount = useCart(s=>s.items.reduce((a:number,i)=>a+i.qty,0))
  useEffect(()=>{ supabase.from('lunch_stores').select('*').order('name').then(({data})=>{ setStores(data??[]); setLoading(false) }) },[])
  return (
    <div className="min-h-dvh bg-[#f5f5f5]">
      <main className={`mx-auto max-w-[480px] ${view.page==='store' ? 'pb-24' : 'pb-[68px]'}`}>
        {view.page==='store' && <StorePage id={view.id} onBack={()=>setView({page:'home'})} />}
        {view.page==='home' && tab==='home' && <Home stores={stores} loading={loading} onOpen={id=>setView({page:'store',id})} />}
        {view.page==='home' && tab==='track' && <TrackOrderView />}
        {view.page==='home' && tab==='owner' && <OwnerHome onBackHome={()=>setTab('home')} />}
      </main>
      {view.page!=='store' && (
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-neutral-200 bg-white pb-safe">
          <div className="grid grid-cols-3">
            <TabBtn Icon={HomeIcon} label="หน้าแรก" active={tab==='home'} onClick={()=>setTab('home')} />
            <TabBtn Icon={ReceiptText} label="ออเดอร์" active={tab==='track'} onClick={()=>setTab('track')} badge={cartCount||undefined} />
            <TabBtn Icon={StoreIcon} label="ร้านค้า" active={tab==='owner'} onClick={()=>setTab('owner')} />
          </div>
        </nav>
      )}
    </div>
  )
}
function TabBtn({Icon,label,active,onClick,badge}:{Icon:typeof HomeIcon;label:string;active?:boolean;onClick:()=>void;badge?:number}){
  return (
    <button onClick={onClick} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold tracking-wide ${active?'text-[#ff5722]':'text-neutral-400'}`}>
      <span className="relative"><Icon size={22} strokeWidth={active?2.3:1.7} />{badge!=null && <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{badge}</span>}</span>
      {label}
    </button>
  )
}

function Home({stores,loading,onOpen}:{stores:StoreType[];loading:boolean;onOpen:(id:string)=>void}){
  const [q,setQ]=useState('')
  const [cat,setCat]=useState('all')
  const [favs,setFavs]=useState<Set<string>>(()=>new Set(JSON.parse(localStorage.getItem('tl_favs')??'[]')))
  const toggleFav=(id:string)=>{ const n=new Set(favs); n.has(id)?n.delete(id):n.add(id); setFavs(n); localStorage.setItem('tl_favs',JSON.stringify([...n])) }

  const filtered = useMemo(()=>{
    let r=[...stores]
    if(q.trim()){ const qq=q.toLowerCase(); r=r.filter(s=>s.name.toLowerCase().includes(qq) || (s.description??'').toLowerCase().includes(qq)) }
    // cat filter: match store name/description containing category word OR show all for 'all'
    if(cat!=='all') r=r.filter(s=> (s.name+s.description).includes(cat))
    return r
  },[stores,q,cat])
  const openCount = stores.filter(s=>s.is_open).length

  return (
    <div>
      {/* TOP BAR — like Grab/LineMan: location + icons */}
      <div className="sticky top-0 z-20 bg-white px-4 pb-3 pt-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff5722] text-white"><MapPin size={14} /></span>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">จัดส่งที่</p>
              <p className="flex items-center gap-1 text-[13px] font-bold">โรงเรียนเตรียมอุดมฯ พัฒนาการ <ChevronRight size={12} className="text-neutral-400" /></p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">{openCount} ร้านเปิด</span>
        </div>
        {/* search */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-neutral-100 px-4 py-2.5">
            <Search size={16} className="text-neutral-400" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาร้าน เมนู" className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400" />
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white"><SlidersHorizontal size={16} className="text-neutral-600" /></button>
        </div>
      </div>

      {/* BANNER — promo carousel like Foodpanda */}
      <div className="px-4 pt-3">
        <div className="no-scrollbar flex gap-3 overflow-x-auto snap-x">
          <div className="grab-pink flex h-[132px] w-[88%] shrink-0 snap-center items-center gap-3 rounded-2xl px-5 text-white">
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">โปรวันนี้</p>
              <p className="mt-1 text-[20px] font-extrabold leading-none">สั่งล่วงหน้า<br/>ลด 10 บาท</p>
              <p className="mt-1.5 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#ff5722]">สั่งเลย →</p>
            </div>
            <div className="text-6xl leading-none drop-shadow">🍱</div>
          </div>
          <div className="flex h-[132px] w-[88%] shrink-0 snap-center items-center gap-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-5 text-white">
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">มาใหม่</p>
              <p className="mt-1 text-[18px] font-extrabold leading-tight">เมนูใหม่ทุกวัน<br/>จากโรงอาหาร</p>
              <p className="mt-1 text-xs text-white/90">รับที่ร้าน 11:50 / 12:20</p>
            </div>
            <div className="text-6xl">🍜</div>
          </div>
        </div>
        <div className="mt-2 flex justify-center gap-1.5"><span className="h-1.5 w-5 rounded-full bg-[#ff5722]" /><span className="h-1.5 w-1.5 rounded-full bg-neutral-300" /></div>
      </div>

      {/* CATEGORY GRID — 4x2 like Grab */}
      <div className="mt-3 bg-white px-2 py-3">
        <div className="grid grid-cols-4 gap-2">
          {CATS.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} className={`flex flex-col items-center gap-1.5 rounded-xl py-2.5 ${cat===c.id?'ring-2 ring-[#ff5722] bg-orange-50':''}`}>
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${c.bg} ring-1 ${c.ring}`}>{c.emoji}</span>
              <span className={`text-xs font-semibold ${cat===c.id?'text-[#ff5722]':'text-neutral-700'}`}>{c.label}</span>
            </button>
          ))}
          <button className="flex flex-col items-center gap-1.5 rounded-xl py-2.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-lg">•••</span>
            <span className="text-xs font-semibold text-neutral-700">ดูเพิ่ม</span>
          </button>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="mt-2 bg-white px-4 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-[15px] font-extrabold"><Flame size={16} className="text-[#ff5722]" /> ร้านแนะนำ</h2>
          <span className="text-xs font-semibold text-neutral-400">{filtered.length} ร้าน</span>
        </div>
      </div>

      {/* RESTAURANT CARDS — Foodpanda/Grab style: 80px image left, info right, rating row, promo pill */}
      <div className="bg-white px-3 pb-4">
        {loading && <div className="grid gap-3">{[0,1,2].map(i=> <div key={i} className="skeleton h-[108px]" />)}</div>}
        {!loading && filtered.length===0 && (
          <div className="rounded-2xl border border-dashed bg-white p-8 text-center"><StoreIcon size={28} className="mx-auto text-neutral-300" /><p className="mt-2 text-sm font-semibold">ไม่พบร้าน</p><p className="text-xs text-neutral-400">ลองเปลี่ยนคำค้นหรือหมวดหมู่</p></div>
        )}
        <div className="grid gap-3">
          {filtered.map(s=>{
            const rating = ratingFor(s.id)
            const reviews = reviewsFor(s.id)
            const minPrice = 25
            return (
              <button key={s.id} onClick={()=>onOpen(s.id)} className="card-pop store-card-shadow flex gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-black/[0.04]">
                <div className={`relative flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-lg font-extrabold text-white ${tint(s.id)}`}>
                  {s.name.slice(0,2)}
                  {!s.is_open && <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-bold">ปิดรับออเดอร์</span>}
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-neutral-700 shadow">฿{minPrice} • ส่งฟรี</span>
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 text-[15px] font-bold leading-tight">{s.name}</h3>
                    <button onClick={e=>{e.stopPropagation(); toggleFav(s.id)}} className={`-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${favs.has(s.id)?'text-red-500':'text-neutral-300'}`}><Heart size={16} fill={favs.has(s.id)?'currentColor':'none'} /></button>
                  </div>
                  {s.description && <p className="line-clamp-1 text-xs text-neutral-500">{s.description}</p>}
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold">{rating}</span>
                    <span className="text-neutral-400">({reviews})</span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-neutral-500">{s.is_open ? '5–10 นาที' : 'ปิดอยู่'}</span>
                    <span className="text-neutral-300">•</span>
                    <span className="flex items-center gap-0.5 text-neutral-500"><Award size={11} /> โรงอาหาร</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${s.is_open?'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200':'bg-neutral-100 text-neutral-400'}`}><span className={`h-1.5 w-1.5 rounded-full ${s.is_open?'bg-emerald-500':'bg-neutral-300'}`} />{s.is_open?'เปิด':'ปิด'}</span>
                    <span className="rounded-full bg-[#fff3e0] px-2 py-0.5 text-[11px] font-bold text-[#ff5722]">รับที่ร้าน • {s.pickup_slots?.[0] ?? '11:50'}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <p className="pt-6 text-center text-[11px] text-neutral-400">Triam Lunch · Triam Udom Suksa Pattanakarn</p>
      </div>
    </div>
  )
}
