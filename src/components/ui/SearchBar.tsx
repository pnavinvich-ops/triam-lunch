import { Search, X } from 'lucide-react'
import { useRef } from 'react'

export default function SearchBar({ value, onChange, placeholder="ค้นหาร้านค้า เมนู..." }: { value:string; onChange:(v:string)=>void; placeholder?:string }){
  const ref=useRef<HTMLInputElement>(null)
  return (
    <label className="flex flex-1 items-center gap-2 rounded-full bg-[#F3F4F6] px-3.5 py-2.5 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-[var(--color-border)] focus-within:shadow-sm">
      <Search size={16} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-3)]" />
      <input ref={ref} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-[var(--color-text-3)]" />
      {value && <button onClick={()=>onChange('')} aria-label="ล้างคำค้น" className="pressable flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-[var(--color-border)] active:scale-[0.97]"><X size={12} /></button>}
    </label>
  )
}
