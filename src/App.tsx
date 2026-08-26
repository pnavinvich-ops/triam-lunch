import { useEffect, useState } from 'react'
import { Home as HomeIcon, ReceiptText, Store, ChevronRight, MapPin, Clock, Search, Flame } from 'lucide-react'
import { supabase, type Store as StoreType } from './lib/supabase'
import { useCart } from './lib/cart'
import StorePage from './pages/StorePage'
import OwnerHome, { TrackOrderView } from './pages/OwnerHome'

type Tab = 'home' | 'track' | 'owner'
export type View = { page: 'home' } | { page: 'store'; id: string }

const STORE_TINTS = [
  'bg-gradient-to-br from-rose-400 to-pink-500',
  'bg-gradient-to-br from-orange-400 to-red-500',
  'bg-gradient-to-br from-emerald-400 to-teal-500',
  'bg-gradient-to-br from-sky-400 to-blue-500',
  'bg-gradient-to-br from-violet-400 to-purple-500',
  'bg-gradient-to-br from-amber-400 to-orange-500',
]
function storeTint(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return STORE_TINTS[h % STORE_TINTS.length]
}
function initials(name: string) {
  return name.replace(/[^(]*\(/, '').slice(0, 2)
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [view, setView] = useState<View>({ page: 'home' })
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const cartCount = useCart((s) => s.items.reduce((a: number, i) => a + i.qty, 0))

  useEffect(() => {
    supabase.from('lunch_stores').select('*').order('name')
      .then(({ data }) => { setStores(data ?? []); setLoading(false) })
  }, [])

  return (
    <div className="min-h-dvh">
      <main className={`mx-auto max-w-[480px] ${view.page === 'store' ? 'pb-24' : 'pb-20'}`}>
        {view.page === 'store' && <StorePage id={view.id} onBack={() => setView({ page: 'home' })} />}
        {view.page === 'home' && tab === 'home' && <Home stores={stores} loading={loading} onOpen={(id) => setView({ page: 'store', id })} />}
        {view.page === 'home' && tab === 'owner' && <OwnerHome onBackHome={() => setTab('home')} />}
        {view.page === 'home' && tab === 'track' && <TrackOrderView />}
      </main>

      {view.page !== 'store' && (
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-neutral-200 bg-white pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-3">
            <TabBtn Icon={HomeIcon} label="หน้าแรก" active={tab === 'home'} onClick={() => setTab('home')} />
            <TabBtn Icon={ReceiptText} label="คำสั่งซื้อ" active={tab === 'track'} onClick={() => setTab('track')} />
            <TabBtn Icon={Store} label="ร้านค้า" active={tab === 'owner'} onClick={() => setTab('owner')} badge={cartCount > 0 ? cartCount : undefined} />
          </div>
        </nav>
      )}
    </div>
  )
}

function TabBtn({ Icon, label, active, onClick, badge }: { Icon: typeof HomeIcon; label: string; active?: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${active ? 'text-brand-600' : 'text-neutral-400'}`}>
      <span className="relative">
        <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
        {badge != null && (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{badge}</span>
        )}
      </span>
      {label}
    </button>
  )
}

function Home({ stores, loading, onOpen }: { stores: StoreType[]; loading: boolean; onOpen: (id: string) => void }) {
  const hour = new Date().getHours()
  const openCount = stores.filter((s) => s.is_open).length
  return (
    <div className="fade-in">
      {/* branded header */}
      <header className="rounded-b-[28px] bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 px-5 pb-14 pt-6 text-white shadow-lg shadow-orange-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-white/80">{hour < 12 ? 'สวัสดีตอนเช้า 👋' : hour < 14 ? 'ถึงเวลากลางวันแล้ว 🍽️' : 'สวัสดี 👋'}</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold tracking-tight">Triam Lunch</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl backdrop-blur">🍱</div>
        </div>

        {/* search bar */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-md shadow-black/5">
          <Search size={17} className="text-neutral-400" />
          <span className="text-sm text-neutral-400">ค้นหาร้านหรือเมนู…</span>
        </div>

        {/* stat chips */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/15 p-3 backdrop-blur">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/90"><Flame size={16} className="text-white" /></span>
            <div><p className="text-lg font-bold leading-none">{openCount}</p><p className="text-[11px] text-white/75">ร้านเปิดอยู่</p></div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-white/15 p-3 backdrop-blur">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-400/90"><Store size={16} className="text-white" /></span>
            <div><p className="text-lg font-bold leading-none">{stores.length}</p><p className="text-[11px] text-white/75">ร้านทั้งหมด</p></div>
          </div>
        </div>
      </header>

      {/* store list */}
      <div className="-mt-7 px-4">
        <h2 className="mb-2.5 flex items-center gap-1.5 px-1 text-base font-bold text-white">🍜 ร้านในโรงอาหาร</h2>

        {loading && <div className="grid gap-2.5">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-[92px]" />)}</div>}

        {!loading && stores.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <Store size={30} className="mx-auto text-neutral-300" />
            <p className="mt-2 text-sm font-semibold">ยังไม่มีร้านในระบบ</p>
            <p className="mt-1 text-xs text-neutral-400">ไปที่แท็บ "ร้านค้า" เพื่อสมัครร้านแรก</p>
          </div>
        )}

        <div className="grid gap-3">
          {stores.map((s) => (
            <button key={s.id} onClick={() => onOpen(s.id)}
              className="card-pop flex items-center gap-3.5 rounded-2xl bg-white p-3.5 text-left shadow-[0_2px_10px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.03]">
              <div className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-xl text-xl font-extrabold text-white shadow-md ${storeTint(s.id)}`}>
                {initials(s.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold">{s.name}</h3>
                  <span className={`chip shrink-0 ${s.is_open ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-neutral-100 text-neutral-400 ring-1 ring-neutral-200'}`}>
                    <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${s.is_open ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                    {s.is_open ? 'เปิด' : 'ปิด'}
                  </span>
                </div>
                {s.description && <p className="mt-0.5 truncate text-[13px] text-neutral-500">{s.description}</p>}
                <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-neutral-400">
                  <MapPin size={11} /> {s.location || '—'}
                  <span className="mx-0.5">·</span>
                  <Clock size={11} /> {s.open_time}–{s.close_time}
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 self-center text-neutral-300" />
            </button>
          ))}
        </div>

        <p className="py-8 text-center text-[11px] text-neutral-400">Triam Lunch · Triam Udom Suksa Pattanakarn School</p>
      </div>
    </div>
  )
}
