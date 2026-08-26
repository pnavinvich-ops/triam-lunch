import { useEffect, useState } from 'react'
import { supabase, type Store } from './lib/supabase'
import { useCart } from './lib/cart'
import StorePage from './pages/StorePage'
import OwnerHome, { TrackOrderView } from './pages/OwnerHome'

type Tab = 'home' | 'owner' | 'track'
export type View = { page: 'home' } | { page: 'store'; id: string }

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [view, setView] = useState<View>({ page: 'home' })
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const cartCount = useCart((s) => s.items.reduce((a: number, i) => a + i.qty, 0))

  const loadStores = () => {
    supabase.from('lunch_stores').select('*').order('name')
      .then(({ data }) => { setStores(data ?? []); setLoading(false) })
  }
  useEffect(() => { loadStores() }, [])

  const openStore = (id: string) => setView({ page: 'store', id })

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      {/* content */}
      <main className={`mx-auto max-w-[480px] ${view.page === 'home' ? 'pb-24' : 'pb-28'}`}>
        {view.page === 'store' && <StorePage id={view.id} onBack={() => setView({ page: 'home' })} />}
        {view.page === 'home' && tab === 'home' && <Home stores={stores} loading={loading} onOpen={openStore} onOwner={() => setTab('owner')} />}
        {view.page === 'home' && tab === 'owner' && <OwnerHome onBackHome={() => setTab('home')} />}
        {view.page === 'home' && tab === 'track' && <TrackOrderView />}
      </main>

      {/* bottom tab bar — hidden inside a store page */}
      {!(view.page === 'store') && (
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-slate-200 bg-white/95 pb-safe backdrop-blur">
          <div className="grid grid-cols-3">
            <TabBtn icon="🏠" label="หน้าแรก" active={tab === 'home'} onClick={() => setTab('home')} />
            <TabBtn icon="📦" label="ออเดอร์ของฉัน" active={tab === 'track'} onClick={() => setTab('track')} />
            <TabBtn icon="🏪" label="สำหรับร้าน" active={tab === 'owner'} onClick={() => setTab('owner')} badge={cartCount || undefined} />
          </div>
        </nav>
      )}
    </div>
  )
}

function TabBtn({ icon, label, active, onClick, badge }: { icon: string; label: string; active?: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${active ? 'text-orange-600' : 'text-slate-400'}`}>
      <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>{icon}</span>
      {label}
      {badge != null && (
        <span className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">{badge}</span>
      )}
      {active && <span className="absolute -top-px h-0.5 w-8 rounded-full bg-orange-500" />}
    </button>
  )
}

function Home({ stores, loading, onOpen, onOwner }: { stores: Store[]; loading: boolean; onOpen: (id: string) => void; onOwner: () => void }) {
  const hour = new Date().getHours()
  const greet = hour < 10 ? 'สวัสดีตอนเช้า ☀️' : hour < 12 ? 'ใกล้เที่ยงแล้ว 🍚' : hour < 17 ? 'สวัสดีตอนบ่าย 🌤️' : 'สวัสดีตอนเย็น 🌙'
  return (
    <div className="fade-in">
      {/* hero header */}
      <div className="hero px-5 pb-14 pt-6 text-white">
        <p className="text-sm font-medium text-white/80">{greet}</p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight">หิวกลางวัน?<br />จองเลย ไม่ต้องรอคิว</h1>
        <div className="mt-3 flex gap-2 text-xs">
          <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">🚫 ไม่ต้องต่อแถว</span>
          <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">⏰ เลือกเวลารับได้</span>
          <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">💵 จ่ายสดปลายทาง</span>
        </div>
      </div>

      {/* store cards pulled up over hero */}
      <div className="-mt-8 px-4">
        <h2 className="mb-2 mt-4 flex items-center gap-2 text-base font-bold">🍜 ร้านในโรงอาหาร <span className="text-xs font-normal text-slate-400">{stores.length} ร้าน</span></h2>

        {loading && (
          <div className="grid gap-3">{[0, 1].map((i) => <div key={i} className="skeleton h-28" />)}</div>
        )}

        {!loading && stores.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div className="text-4xl">🏪</div>
            <p className="mt-2 font-semibold">ยังไม่มีร้านในระบบ</p>
            <p className="mt-1 text-sm text-slate-500">เป็นร้านแรกของโรงอาหาร? เปิดร้านฟรี</p>
            <button onClick={onOwner} className="mt-3 rounded-full bg-orange-500 px-5 py-2 text-sm font-bold text-white card-pop">เปิดร้านของฉัน →</button>
          </div>
        )}

        <div className="grid gap-3">
          {stores.map((s) => (
            <button key={s.id} onClick={() => onOpen(s.id)}
              className="card-pop overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md">
              <div className="flex items-stretch gap-3 p-3.5">
                {/* fake storefront tile */}
                <div className="flex w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-50 text-3xl">
                  🍱
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold">{s.name}</h3>
                    <span className={`chip shrink-0 ${s.is_open ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                      {s.is_open ? '● เปิด' : '● ปิด'}
                    </span>
                  </div>
                  {s.description && <p className="mt-0.5 truncate text-sm text-slate-500">{s.description}</p>}
                  <p className="mt-1 truncate text-xs text-slate-400">📍 {s.location || '—'} · 🕐 {s.open_time}–{s.close_time}</p>
                </div>
                <span className="self-center text-slate-300">›</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
