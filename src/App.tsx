import { useEffect, useState } from 'react'
import { supabase, type Store } from './lib/supabase'
import { useCart } from './lib/cart'
import StorePage from './pages/StorePage'
import OwnerHome, { TrackOrderView } from './pages/OwnerHome'

type Tab = 'home' | 'track' | 'owner'
export type View = { page: 'home' } | { page: 'store'; id: string }

// deterministic emoji per store id (so tiles look varied, not a random 3D box)
const STORE_EMOJIS = ['🍛', '🍜', '🍗', '🥗', '☕', '🧋', '🍱', '🍲']
function storeEmoji(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return STORE_EMOJIS[h % STORE_EMOJIS.length]
}

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
      <main className={`mx-auto max-w-[480px] ${view.page === 'store' ? 'pb-28' : 'pb-24'}`}>
        {view.page === 'store' && <StorePage id={view.id} onBack={() => setView({ page: 'home' })} />}
        {view.page === 'home' && tab === 'home' && <Home stores={stores} loading={loading} onOpen={openStore} />}
        {view.page === 'home' && tab === 'owner' && <OwnerHome onBackHome={() => setTab('home')} />}
        {view.page === 'home' && tab === 'track' && <TrackOrderView />}
      </main>

      {view.page !== 'store' && (
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-slate-200 bg-white/95 pb-safe backdrop-blur">
          <div className="grid grid-cols-3">
            <TabBtn icon="🏠" label="หน้าแรก" active={tab === 'home'} onClick={() => setTab('home')} />
            <TabBtn icon="📦" label="ออเดอร์ของฉัน" active={tab === 'track'} onClick={() => setTab('track')} />
            <TabBtn icon="🏪" label="ร้านค้า" active={tab === 'owner'} onClick={() => setTab('owner')} badge={cartCount > 0 ? cartCount : undefined} />
          </div>
        </nav>
      )}
    </div>
  )
}

function TabBtn({ icon, label, active, onClick, badge }: { icon: string; label: string; active?: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className={`relative flex flex-col items-center justify-center gap-0 py-2 text-[11px] font-semibold leading-tight transition ${active ? 'text-orange-600' : 'text-slate-400'}`}>
      <span className={`relative text-[22px] leading-none transition-transform ${active ? 'scale-110' : ''}`}>
        {icon}
        {badge != null && (
          <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{badge}</span>
        )}
      </span>
      <span className="mt-0.5 whitespace-nowrap">{label}</span>
      {active && <span className="absolute top-0 h-0.5 w-10 rounded-b-full bg-orange-500" />}
    </button>
  )
}

function Home({ stores, loading, onOpen }: { stores: Store[]; loading: boolean; onOpen: (id: string) => void }) {
  const hour = new Date().getHours()
  const greet = hour < 10 ? 'สวัสดีตอนเช้า ☀️' : hour < 12 ? 'ใกล้เที่ยงแล้ว 🍚' : hour < 17 ? 'สวัสดีตอนบ่าย 🌤️' : 'สวัสดีตอนเย็น 🌙'
  return (
    <div className="fade-in">
      {/* hero — generous bottom padding so nothing gets clipped */}
      <div className="hero px-5 pb-16 pt-7 text-white">
        <p className="text-sm font-medium text-white/85">{greet}</p>
        <h1 className="mt-1.5 text-[26px] font-extrabold leading-snug">หิวกลางวัน?<br />จองเลย ไม่ต้องรอคิว</h1>
        <div className="mt-3.5 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">🚫 ไม่ต้องต่อแถว</span>
          <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">⏰ เลือกเวลารับได้</span>
          <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">💵 จ่ายสดปลายทาง</span>
        </div>
      </div>

      {/* store list pulled over hero */}
      <div className="-mt-10 px-4">
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="text-lg font-extrabold">🍜 ร้านในโรงอาหาร</h2>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-500 shadow-sm">{stores.length} ร้าน</span>
        </div>

        {loading && <div className="grid gap-3">{[0, 1].map((i) => <div key={i} className="skeleton h-[104px]" />)}</div>}

        {!loading && stores.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-5xl">🏪</div>
            <p className="mt-2 font-bold">ยังไม่มีร้านในระบบ</p>
            <p className="mt-1 text-sm text-slate-400">เป็นร้านแรกของโรงอาหาร? ไปที่แท็บ 🏪 ร้านค้า</p>
          </div>
        )}

        <div className="grid gap-3">
          {stores.map((s) => (
            <button key={s.id} onClick={() => onOpen(s.id)}
              className="card-pop flex items-center gap-3.5 rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 via-amber-50 to-red-50 text-[34px] shadow-inner">
                {storeEmoji(s.id)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="min-w-0 flex-1 truncate text-[15px] font-extrabold">{s.name}</h3>
                  <span className={`chip shrink-0 ${s.is_open ? 'bg-green-50 text-green-600 ring-1 ring-green-200' : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.is_open ? 'bg-green-500' : 'bg-slate-300'}`} />
                    {s.is_open ? 'เปิด' : 'ปิด'}
                  </span>
                </div>
                {s.description && <p className="mt-0.5 truncate text-[13px] text-slate-500">{s.description}</p>}
                <p className="mt-1 truncate text-[11px] text-slate-400">
                  📍 {s.location || '—'}
                  <span className="mx-1">·</span>
                  🕐 {s.open_time}–{s.close_time}
                </p>
              </div>
              <span className="shrink-0 self-center text-lg text-slate-300">›</span>
            </button>
          ))}
        </div>

        <p className="py-8 text-center text-[11px] text-slate-300">Triam Lunch · ตร.อุปถัมภ์ฯ</p>
      </div>
    </div>
  )
}
