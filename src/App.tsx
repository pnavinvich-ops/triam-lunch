import { useEffect, useMemo, useState } from 'react'
import { Search, MapPin, Star, Heart, ChevronRight, Home as HomeIcon, ReceiptText, Store as StoreIcon, SlidersHorizontal, Clock3, RotateCcw, Bookmark, Ticket, Crown, UtensilsCrossed, Soup, Coffee, Cookie, Beef, Sandwich } from 'lucide-react'
import { supabase, type Store as StoreType, type MenuItem } from './lib/supabase'
import { useCart } from './lib/cart'
import StorePage from './pages/StorePage'
import OwnerHome, { TrackOrderView } from './pages/OwnerHome'

type Tab = 'home' | 'track' | 'owner'
export type View = { page: 'home' } | { page: 'store'; id: string }

// deterministic rating
function ratingFor(id: string){ let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return (4.4 + (h%6)/10).toFixed(1) }
function reviewsFor(id: string){ let h=0; for(let i=0;i<id.length;i++) h=(h*37+id.charCodeAt(i))>>>0; return 24 + (h%180) }

// category → icon + tint (flat, muted — no gradients)
const CAT_DEFS: { id: string; label: string; Icon: typeof UtensilsCrossed; bg: string; fg: string }[] = [
  { id:'all', label:'ทั้งหมด', Icon: UtensilsCrossed, bg:'bg-neutral-900', fg:'text-white' },
  { id:'ข้าว', label:'ข้าว', Icon: Beef, bg:'bg-orange-50', fg:'text-orange-700' },
  { id:'ก๋วยเตี๋ยว', label:'ก๋วยเตี๋ยว', Icon: Soup, bg:'bg-amber-50', fg:'text-amber-700' },
  { id:'ของว่าง', label:'ของว่าง', Icon: Sandwich, bg:'bg-red-50', fg:'text-red-700' },
  { id:'เครื่องดื่ม', label:'เครื่องดื่ม', Icon: Coffee, bg:'bg-sky-50', fg:'text-sky-700' },
  { id:'ของหวาน', label:'ของหวาน', Icon: Cookie, bg:'bg-violet-50', fg:'text-violet-700' },
]

export default function App(){
  const [tab,setTab]=useState<Tab>('home')
  const [view,setView]=useState<View>({page:'home'})
  const [stores,setStores]=useState<StoreType[]>([])
  const [loading,setLoading]=useState(true)
  const cartCount=useCart(s=>s.items.reduce((a,i)=>a+i.qty,0))
  useEffect(()=>{ supabase.from('lunch_stores').select('*').order('name').then(({data})=>{ setStores(data??[]); setLoading(false)}) },[])
  return (
    <div className="min-h-dvh">
      <main className={`mx-auto max-w-[480px] ${view.page==='store'?'pb-24':'pb-[64px]'}`}>
        {view.page==='store' && <StorePage id={view.id} onBack={()=>setView({page:'home'})} />}
        {view.page==='home' && tab==='home' && <Home stores={stores} loading={loading} onOpen={id=>setView({page:'store',id})} />}
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
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold tracking-wide ${active?'text-[var(--color-text)]':'text-[var(--color-text-3)]'}`}>
      <span className="relative"><Icon size={22} strokeWidth={active?2.2:1.7} />{badge!=null && <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">{badge}</span>}</span>
      {label}
    </button>
  )
}

function Home({stores,loading,onOpen}:{stores:StoreType[];loading:boolean;onOpen:(id:string)=>void}){
  const [q,setQ]=useState('')
  const [cat,setCat]=useState('all')
  const [mode,setMode]=useState<'pickup'|'preorder'>('pickup')
  const [favs,setFavs]=useState<Set<string>>(()=>new Set(JSON.parse(localStorage.getItem('tl_favs')??'[]')))
  const [recent,setRecent]=useState<string[]>(()=>JSON.parse(localStorage.getItem('tl_recent_q')??'[]'))
  const [popular,setPopular]=useState<MenuItem[]>([])
  const toggleFav=(id:string)=>{ const n=new Set(favs); n.has(id)?n.delete(id):n.add(id); setFavs(n); localStorage.setItem('tl_favs',JSON.stringify([...n])) }

  // fetch popular items across all stores (for "เมนูขายดี")
  useEffect(()=>{ supabase.from('lunch_menu_items').select('*').eq('available',true).limit(10).then(({data})=> setPopular(data??[])) },[])

  const filtered = useMemo(()=>{
    let r=[...stores]
    if(q.trim()){ const qq=q.toLowerCase(); r=r.filter(s=> s.name.toLowerCase().includes(qq) || (s.description??'').toLowerCase().includes(qq)) }
    if(cat!=='all') r=r.filter(s=> (s.name+s.description).includes(cat))
    return r
  },[stores,q,cat])

  const onSearch=(v:string)=>{ setQ(v); if(v.trim().length>=2){ const n=[v.trim(), ...recent.filter(x=>x!==v.trim())].slice(0,4); setRecent(n); localStorage.setItem('tl_recent_q',JSON.stringify(n)) } }

  const reorder = JSON.parse(localStorage.getItem('tl_my_orders')??'null') as {code:string;store:string;at:number}[] | null
  const lastOrder = reorder?.[reorder.length-1]

  return (
    <div className="bg-[var(--color-bg)]">
      {/* Header: white, flat, 8pt — location + bell */}
      <header className="sticky top-0 z-20 bg-white px-4 pb-3 pt-3 card-shadow">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-text)] text-white"><MapPin size={14} /></span>
            <span className="leading-tight">
              <span className="block text-[11px] font-medium tracking-wide text-[var(--color-text-2)]">รับที่</span>
              <span className="flex items-center gap-1 text-[13px] font-semibold">อาคารโรงอาหาร · ม.4–ม.6 <ChevronRight size={12} className="text-[var(--color-text-3)]" /></span>
            </span>
          </button>
          <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-ink)] ring-1 ring-[var(--color-accent)]/15">{stores.filter(s=>s.is_open).length} ร้านเปิด</span>
        </div>

        {/* Search — solid, no gradient */}
        <div className="mt-3 flex items-center gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[#f3f3f3] px-3.5 py-2.5">
            <Search size={16} className="text-[var(--color-text-3)]" />
            <input value={q} onChange={e=>onSearch(e.target.value)} placeholder="ค้นหาร้าน หรือเมนู" className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-[var(--color-text-3)]" />
          </label>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white"><SlidersHorizontal size={16} /></button>
        </div>

        {/* Mode chips — pill style like Uber */}
        <div className="mt-3 flex gap-2">
          {(['pickup','preorder'] as const).map(m=>(
            <button key={m} onClick={()=>setMode(m)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition ${mode===m ? 'bg-[var(--color-text)] text-white ring-[var(--color-text)]' : 'bg-white text-[var(--color-text)] ring-[var(--color-border)]'}`}>
              {m==='pickup' ? 'รับที่ร้าน' : 'สั่งล่วงหน้า'}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--color-text-2)]"><Clock3 size={12} /> รอบ 11:50 · 12:20</span>
        </div>

        {recent.length>0 && !q && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recent.map(r=> <button key={r} onClick={()=>setQ(r)} className="rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-text-2)]">{r}</button>)}
          </div>
        )}
      </header>

      {/* Quick actions — 4-up, flat, lucide only */}
      <section className="bg-white px-4 pb-3 pt-3">
        <div className="grid grid-cols-4 gap-3">
          <Quick Icon={RotateCcw} label="สั่งซ้ำ" sub={lastOrder ? lastOrder.store : 'ยังไม่มี'} />
          <Quick Icon={Bookmark} label="รายการโปรด" sub={`${favs.size} ร้าน`} />
          <Quick Icon={Ticket} label="คูปอง" sub="ลด 10฿" accent />
          <Quick Icon={Crown} label="พรีเมียม" sub="ฟรีค่าส่ง" />
        </div>
      </section>

      {/* Promo — flat solid, no gradient */}
      <section className="bg-white px-4 pb-3">
        <div className="flex items-center gap-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-accent-soft)] p-4">
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-wide text-[var(--color-accent-ink)]">โปรรอบเที่ยง</p>
            <p className="mt-0.5 text-[15px] font-bold leading-tight text-[var(--color-text)]">สั่งล่วงหน้าก่อน 11:30<br/>ลดทันที 10 บาท</p>
            <p className="mt-1 text-xs font-medium text-[var(--color-text-2)]">รับที่ร้าน · ไม่ต้องรอคิว · จ่ายเงินสด</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white ring-1 ring-[var(--color-border)]"><UtensilsCrossed size={28} className="text-[var(--color-accent)]" /></div>
        </div>
      </section>

      {/* Reorder — if history exists */}
      {lastOrder && (
        <section className="bg-white px-4 pb-3 pt-1">
          <SectionHead title="สั่งอีกครั้ง" action="ดูทั้งหมด" />
          <div className="card-shadow flex items-center gap-3 rounded-[12px] border border-[var(--color-border)] bg-white p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-text)] text-white text-sm font-bold">{lastOrder.store.slice(0,1)}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{lastOrder.store}</p><p className="text-xs text-[var(--color-text-2)]">รหัส {lastOrder.code} · แตะเพื่อสั่งซ้ำ</p></div>
            <button onClick={()=>{ const s=stores.find(x=>x.name===lastOrder.store); if(s) onOpen(s.id) }} className="rounded-full bg-[var(--color-text)] px-4 py-2 text-xs font-semibold text-white">สั่งซ้ำ</button>
          </div>
        </section>
      )}

      {/* Categories — flat icon tiles, no emoji, no gradients */}
      <section className="bg-white px-2 pb-3 pt-3">
        <SectionHead title="หมวดหมู่" />
        <div className="grid grid-cols-4 gap-1">
          {CAT_DEFS.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} className={`flex flex-col items-center gap-1.5 rounded-[12px] py-3 ring-1 transition ${cat===c.id ? 'bg-[var(--color-text)] text-white ring-[var(--color-text)]' : 'bg-white ring-[var(--color-border)]'}`}>
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${cat===c.id ? 'bg-white text-[var(--color-text)]' : `${c.bg} ${c.fg}`}`}><c.Icon size={18} /></span>
              <span className={`text-xs font-semibold ${cat===c.id ? 'text-white' : 'text-[var(--color-text)]'}`}>{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* เมนูขายดี — horizontal, dense */}
      {popular.length>0 && (
        <section className="bg-white px-4 pb-3 pt-3">
          <SectionHead title="เมนูขายดี" action="ดูทั้งหมด" />
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {popular.slice(0,8).map(m=>(
              <div key={m.id} className="w-[148px] shrink-0 overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-white card-shadow">
                {m.image_url ? <img src={m.image_url} alt={m.name} className="h-[96px] w-full object-cover" loading="lazy" /> : <div className="flex h-[96px] items-center justify-center bg-[#f3f3f3] text-sm font-bold text-[var(--color-text-2)]">{m.name.slice(0,2)}</div>}
                <div className="p-2.5">
                  <p className="line-clamp-1 text-sm font-semibold leading-tight">{m.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-2)]">{m.category}</p>
                  <p className="mt-1 text-sm font-bold tabular-nums">฿{Number(m.price_thb).toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stores — the main list, flat cards, proper hierarchy */}
      <section className="bg-white px-3 pb-6 pt-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[14px] font-bold tracking-tight">ร้านในโรงอาหาร</h2>
          <span className="text-xs font-medium text-[var(--color-text-2)]">{filtered.length} ร้าน · {cat==='all' ? 'ทั้งหมด' : CAT_DEFS.find(c=>c.id===cat)?.label}</span>
        </div>
        {loading && <div className="grid gap-3">{[0,1,2].map(i=> <div key={i} className="skeleton h-[108px]" />)}</div>}
        {!loading && filtered.length===0 && <EmptyState />}
        <div className="grid gap-3">
          {filtered.map(s=>{
            const r=ratingFor(s.id), rev=reviewsFor(s.id)
            return (
              <button key={s.id} onClick={()=>onOpen(s.id)} className="card-shadow flex gap-3 rounded-[12px] border border-[var(--color-border)] bg-white p-3 text-left transition hover:card-shadow-hover">
                <div className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#f3f3f3] ring-1 ring-[var(--color-border)]">
                  {s.image_url ? <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" /> : <span className="text-sm font-bold text-[var(--color-text-2)]">{s.name.slice(0,2)}</span>}
                  <span className="absolute bottom-1 left-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-wide ring-1 ring-[var(--color-border)]">฿25 • ส่งฟรี</span>
                  {!s.is_open && <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-bold backdrop-blur-[1px]">ปิด</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 text-[14px] font-semibold leading-tight">{s.name}</h3>
                    <button onClick={e=>{e.stopPropagation(); toggleFav(s.id)}} aria-label="favorite" className={`-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${favs.has(s.id) ? 'border-red-200 bg-red-50 text-red-500' : 'border-[var(--color-border)] bg-white text-[var(--color-text-3)]'}`}>
                      <Heart size={14} fill={favs.has(s.id)?'currentColor':'none'} />
                    </button>
                  </div>
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
            )
          })}
        </div>
        <p className="pt-6 text-center text-[11px] font-medium tracking-wide text-[var(--color-text-3)]">TRIAM LUNCH · โรงเรียนเตรียมอุดมศึกษาพัฒนาการ</p>
      </section>
    </div>
  )
}
function SectionHead({title, action}:{title:string; action?:string}){
  return <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-[13px] font-bold tracking-tight">{title}</h2>{action && <button className="text-xs font-semibold text-[var(--color-text-2)]">{action} <ChevronRight size={12} className="inline" /></button>}</div>
}
function Quick({Icon,label,sub,accent}:{Icon:typeof RotateCcw;label:string;sub:string;accent?:boolean}){
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span className={`flex h-12 w-12 items-center justify-center rounded-full ring-1 ${accent ? 'bg-[var(--color-accent)] text-white ring-[var(--color-accent)]' : 'bg-white text-[var(--color-text)] ring-[var(--color-border)]'}`}><Icon size={18} /></span>
      <span className="text-xs font-semibold leading-none">{label}</span>
      <span className="text-[11px] leading-none text-[var(--color-text-2)]">{sub}</span>
    </div>
  )
}
function EmptyState(){
  return <div className="rounded-[12px] border border-dashed border-[var(--color-border)] bg-white p-8 text-center"><StoreIcon size={24} className="mx-auto text-[var(--color-text-3)]" /><p className="mt-2 text-sm font-semibold">ไม่พบร้าน</p><p className="text-xs text-[var(--color-text-2)]">ลองเปลี่ยนคำค้นหรือหมวดหมู่</p></div>
}
