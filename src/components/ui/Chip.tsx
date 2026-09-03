import type { LucideIcon } from 'lucide-react'

export default function Chip({ label, Icon, active, onClick }: { label:string; Icon: LucideIcon; active?:boolean; onClick:()=>void }){
  return (
    <button onClick={onClick} aria-pressed={active} className={`pressable inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-[0.97] ${active?'bg-neutral-900 text-white shadow-sm':'bg-white text-[var(--color-text)] border border-[var(--color-border)]'}`}>
      <Icon size={18} strokeWidth={1.8} /> {label}
    </button>
  )
}
