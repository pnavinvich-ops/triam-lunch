import { useEffect, useState } from 'react'
import { Home as HomeIcon, ReceiptText, Store as StoreLucide, ChevronRight, MapPin, Clock } from 'lucide-react'
import { supabase, type Store as StoreType } from './lib/supabase'
import { useCart } from './lib/cart'
import StorePage from './pages/StorePage'
import OwnerHome, { TrackOrderView } from './pages/OwnerHome'

type Tab = 'home' | 'track' | 'owner'
export type View = { page: 'home' } | { page: 'store'; id: string }

const STORE_TINTS = ['bg-rose-50 text-rose-700', 'bg-amber-50 text-amber-700', 'bg-emerald-50 text-emerald-700', 'bg-sky-50 text-sky-700', 'bg-violet-50 text-violet-700']
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
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-neutral-200 bg-white pb-safe">
          <div className="grid grid-cols-3">
            <TabBtn Icon={HomeIcon} label="หน้าแรก" active={tab === 'home'} onClick={() => setTab('home')} />
            <TabBtn Icon={ReceiptText} label="คำสั่งซื้อ" active={tab === 'track'} onClick={() => setTab('track')} />
            <TabBtn Icon={StoreLucide} label="ร้านค้า" active={tab === 'owner'} onClick={() => setTab('owner')} badge={cartCount > 0 ? cartCount : undefined} />
          </div>
        </nav>
      )}
    </div>
  )
}

function TabBtn({ Icon, label, active, onClick, badge }: { Icon: typeof HomeIcon; label: string; active?: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${active ? 'text-orange-600' : 'text-neutral-400'}`}>
      <span className="relative">
        <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
        {badge != null && (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">{badge}</span>
        )}
      </span>
      {label}
    </button>
  )
}

function Home({ stores, loading, onOpen }: { stores: StoreType[]; loading: boolean; onOpen: (id: string) => void }) {
  return (
    <div className="fade-in">
      {/* flat header — no gradient */}
      <header className="bg-white px-5 pb-4 pt-6">
        <h1 className="text-[22px] font-bold tracking-tight">สั่งกลางวันล่วงหน้า</h1>
        <p className="mt-0.5 text-sm text-neutral-500">เลือกร้าน เลือกเวลารับ แล้วไปรับที่ร้าน</p>
      </header>

      {/* sticky section bar */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-5 py-3 backdrop-blur">
        <h2 className="text-sm font-semibold">ร้านทั้งหมด</h2>
      </div>

      <div className="px-4 pt-3">
        {loading && <div className="grid gap-2.5">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 bg-white ring-1 ring-neutral-200" />)}</div>}

        {!loading && stores.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <StoreLucide size={28} className="mx-auto text-neutral-300" />
            <p className="mt-2 text-sm font-medium">ยังไม่มีร้านในระบบ</p>
            <p className="mt-1 text-xs text-neutral-400">ร้านสามารถสมัครได้ที่แท็บ "ร้านค้า"</p>
          </div>
        )}

        <div className="grid gap-2.5">
          {stores.map((s) => (
            <button key={s.id} onClick={() => onOpen(s.id)}
              className="card-pop flex items-center gap-3.5 rounded-xl bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-neutral-200/70">
              {/* letter avatar — real-app pattern */}
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-lg font-bold ${storeTint(s.id)}`}>
                {initials(s.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="min-w-0 truncate text-[15px] font-semibold">{s.name}</h3>
                  <span className={`flex shrink-0 items-center gap-1 text-[11px] font-medium ${s.is_open ? 'text-emerald-600' : 'text-neutral-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.is_open ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                    {s.is_open ? 'เปิด' : 'ปิด'}
                  </span>
                </div>
                {s.description && <p className="mt-0.5 truncate text-[13px] text-neutral-500">{s.description}</p>}
                <p className="mt-1 flex items-center gap-1 truncate text-xs text-neutral-400">
                  <MapPin size={12} /> {s.location || '—'}
                  <span className="mx-0.5">·</span>
                  <Clock size={12} /> {s.open_time}–{s.close_time}
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
