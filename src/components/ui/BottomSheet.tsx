import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function BottomSheet({ open, onClose, title, children }: { open:boolean; onClose:()=>void; title?:string; children:ReactNode }){
  useEffect(()=>{ const h=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }; if(open) window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h)},[open,onClose])
  if(!open) return null
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose} className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-[2px]">
      <div onClick={e=>e.stopPropagation()} className="max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[20px] bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-float">
        <div className="mx-auto mb-3 h-1.5 w-9 rounded-full bg-[var(--color-border)]" />
        {title && <div className="mb-3 flex items-center justify-between"><h3 className="text-[15px] font-bold tracking-tight" style={{fontFamily:'var(--font-display)'}}>{title}</h3><button onClick={onClose} aria-label="ปิด" className="pressable flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] active:scale-[0.97]"><X size={18} strokeWidth={1.8} /></button></div>}
        {children}
      </div>
    </div>
  )
}
export function Overlay({ children, onClose, label="dialog" }: { children:ReactNode; onClose:()=>void; label?:string }){
  return <div role="dialog" aria-modal="true" aria-label={label} onClick={onClose} className="fixed inset-0 z-40 flex items-end justify-center bg-black/40"><div onClick={e=>e.stopPropagation()} className="max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[20px] bg-white p-4 pb-8 shadow-float"><div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--color-border)]" />{children}</div></div>
}
