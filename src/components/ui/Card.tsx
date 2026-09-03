import type { ReactNode } from 'react'

export default function Card({ children, className="", hover=false, onClick }: { children: ReactNode; className?: string; hover?: boolean; onClick?:()=>void }){
  return <div onClick={onClick} className={`pressable rounded-[16px] border border-[var(--color-border)] bg-white card-shadow ${hover?'hover:shadow-float hover:-translate-y-0.5':''} ${onClick?'cursor-pointer active:scale-[0.97]':''} ${className}`}>{children}</div>
}
