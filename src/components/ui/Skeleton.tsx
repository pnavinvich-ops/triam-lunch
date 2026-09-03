export function SkeletonCard(){ return <div className="skeleton h-[220px] rounded-[16px]" /> }
export function SkeletonRow(){ return <div className="skeleton h-[96px] rounded-[16px]" /> }
export function SkeletonChip(){ return <div className="skeleton h-8 w-20 rounded-full" /> }
export default function Skeleton({ className="" }: { className?:string }){ return <div className={`skeleton ${className}`} /> }
