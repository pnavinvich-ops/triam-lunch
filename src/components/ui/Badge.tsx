export function RatingBadge({ rating, count }: { rating:string; count:number }){
  return <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-bold tabular-nums shadow-sm backdrop-blur">★ {rating} · {count}+</span>
}
export function PromoBadge({ label }: { label:string }){
  return <span className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[11px] font-bold text-white">{label}</span>
}
export function StatusDot({ open }: { open:boolean }){
  return <span className={`h-2 w-2 rounded-full ${open?'bg-[var(--color-accent)]':'bg-[var(--color-text-3)]'}`} />
}
