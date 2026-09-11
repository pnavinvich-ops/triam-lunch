import { FOOD_META, USE_PHOTOS, type FoodKind } from '../../lib/food'

/**
 * Matching food illustration — flat, appetizing, on-brand.
 * Replaces mismatched Unsplash hotlinks. If `USE_PHOTOS` is on and the
 * generated photo exists in public/images, the photo is used with SVG fallback.
 */
export default function FoodArt({
  kind,
  title,
  className = '',
  rounded = true,
}: {
  kind: FoodKind
  title?: string
  className?: string
  rounded?: boolean
}) {
  const meta = FOOD_META[kind]
  const photoSrc = `/images/${meta.file}`

  return (
    <span
      role="img"
      aria-label={title ?? meta.label}
      className={`relative block overflow-hidden ${rounded ? 'rounded-[inherit]' : ''} ${className}`}
      style={{ background: `linear-gradient(135deg, ${meta.from} 0%, ${meta.to} 100%)` }}
    >
      {USE_PHOTOS && (
        <img
          src={photoSrc}
          alt={title ?? meta.label}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      {/* soft pattern */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="170" cy="30" r="46" fill="#ffffff" opacity="0.14" />
        <circle cx="22" cy="172" r="34" fill="#ffffff" opacity="0.12" />
        <circle cx="160" cy="165" r="12" fill="#ffffff" opacity="0.16" />
      </svg>
      <svg viewBox="0 0 200 200" className="relative h-full w-full" aria-hidden>
        <ellipse cx="100" cy="164" rx="52" ry="9" fill="#000000" opacity="0.14" />
        <Dish kind={kind} />
      </svg>
      {/* glossy sheen like pro food apps */}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/25" aria-hidden />
    </span>
  )
}

function Dish({ kind }: { kind: FoodKind }) {
  switch (kind) {
    // ——— PLATE DISHES ———
    case 'kaphrao':
      return (
        <g>
          <ellipse cx="100" cy="128" rx="62" ry="30" fill="#ffffff" />
          <ellipse cx="100" cy="124" rx="62" ry="30" fill="#FDFDFD" stroke="#E5E0D8" strokeWidth="2" />
          <ellipse cx="82" cy="118" rx="30" ry="18" fill="#F5F0E6" />
          <ellipse cx="82" cy="114" rx="26" ry="14" fill="#FFFDF6" />
          <g fill="#8D4A2F">
            <ellipse cx="70" cy="112" rx="7" ry="5" /><ellipse cx="82" cy="116" rx="8" ry="5" /><ellipse cx="93" cy="110" rx="7" ry="5" />
          </g>
          <g fill="#2F7D32">
            <ellipse cx="66" cy="118" rx="4" ry="2.4" /><ellipse cx="90" cy="119" rx="4.4" ry="2.4" /><ellipse cx="78" cy="108" rx="3.6" ry="2.2" />
          </g>
          <g fill="#C62828"><circle cx="72" cy="110" r="2.2" /><circle cx="88" cy="112" r="2.2" /></g>
          <ellipse cx="126" cy="108" rx="20" ry="15" fill="#FFB300" />
          <ellipse cx="126" cy="106" rx="20" ry="15" fill="#FFCA28" />
          <ellipse cx="126" cy="105" rx="11" ry="8" fill="#FF8F00" />
          <ellipse cx="126" cy="104" rx="7" ry="5" fill="#FFD54F" />
        </g>
      )
    case 'curry-rice':
      return (
        <g>
          <ellipse cx="100" cy="130" rx="62" ry="28" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <ellipse cx="74" cy="120" rx="24" ry="15" fill="#FFFDF6" stroke="#EDE6D6" strokeWidth="1.5" />
          <ellipse cx="128" cy="116" rx="26" ry="20" fill="#2E7D32" />
          <ellipse cx="128" cy="114" rx="26" ry="20" fill="#388E3C" />
          <ellipse cx="128" cy="114" rx="19" ry="13" fill="#66BB6A" />
          <g fill="#E8F5E9"><ellipse cx="122" cy="112" rx="5" ry="4" /><ellipse cx="134" cy="116" rx="5" ry="4" /><ellipse cx="128" cy="108" rx="4" ry="3" /></g>
          <g fill="#C62828"><circle cx="120" cy="118" r="2" /><circle cx="136" cy="110" r="2" /></g>
        </g>
      )
    case 'fried-chicken':
      return (
        <g>
          <ellipse cx="100" cy="132" rx="60" ry="26" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <g>
            <ellipse cx="82" cy="112" rx="24" ry="17" fill="#B45309" />
            <ellipse cx="82" cy="108" rx="24" ry="17" fill="#D97706" />
            <ellipse cx="82" cy="105" rx="18" ry="12" fill="#F59E0B" />
            <g fill="#FBBF24"><circle cx="72" cy="102" r="2.4" /><circle cx="84" cy="100" r="2.4" /><circle cx="92" cy="106" r="2.4" /><circle cx="76" cy="110" r="2" /></g>
            <ellipse cx="118" cy="116" rx="22" ry="15" fill="#92400E" />
            <ellipse cx="118" cy="112" rx="22" ry="15" fill="#B45309" />
            <ellipse cx="118" cy="109" rx="16" ry="10" fill="#D97706" />
            <g fill="#FDE68A"><circle cx="110" cy="108" r="2.2" /><circle cx="122" cy="106" r="2.2" /><circle cx="128" cy="112" r="2" /></g>
            <g fill="#FEF3C7"><ellipse cx="100" cy="122" rx="3" ry="1.6" /><ellipse cx="110" cy="124" rx="3" ry="1.6" /><ellipse cx="90" cy="124" rx="3" ry="1.6" /></g>
          </g>
        </g>
      )
    case 'biryani':
      return (
        <g>
          <ellipse cx="100" cy="130" rx="62" ry="28" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <ellipse cx="92" cy="116" rx="36" ry="20" fill="#F59E0B" />
          <ellipse cx="92" cy="113" rx="36" ry="20" fill="#FBBF24" />
          <g stroke="#B45309" strokeWidth="1.6" opacity="0.7">
            <line x1="66" y1="110" x2="78" y2="116" /><line x1="84" y1="106" x2="94" y2="114" /><line x1="102" y1="108" x2="112" y2="116" />
          </g>
          <ellipse cx="130" cy="112" rx="18" ry="14" fill="#92400E" />
          <ellipse cx="130" cy="109" rx="18" ry="14" fill="#B45309" />
          <g fill="#15803D"><ellipse cx="70" cy="106" rx="4" ry="2.4" /><ellipse cx="112" cy="104" rx="4" ry="2.4" /></g>
        </g>
      )
    case 'fried-rice':
      return (
        <g>
          <ellipse cx="100" cy="130" rx="62" ry="28" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <ellipse cx="96" cy="114" rx="34" ry="18" fill="#FBBF24" />
          <ellipse cx="96" cy="111" rx="30" ry="15" fill="#FCD34D" />
          <g fill="#F59E0B"><circle cx="84" cy="110" r="2" /><circle cx="100" cy="108" r="2" /><circle cx="110" cy="113" r="2" /></g>
          <g>
            <path d="M126 100 q10 -4 12 4 q2 8 -8 10 q-10 2 -12 -5 q-1 -6 8 -9" fill="#F97316" />
            <path d="M132 96 q6 -8 12 -6" stroke="#F97316" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
          <g fill="#16A34A"><ellipse cx="66" cy="118" rx="6" ry="3" /><ellipse cx="70" cy="122" rx="6" ry="3" /></g>
          <ellipse cx="120" cy="122" rx="7" ry="4" fill="#84CC16" />
        </g>
      )
    case 'omelette': case 'fried-egg':
      return (
        <g>
          <ellipse cx="100" cy="130" rx="60" ry="27" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <path d="M58 118 q10 -18 34 -16 q26 -6 44 6 q10 8 2 16 q-14 10 -40 8 q-30 2 -40 -14z" fill="#F59E0B" />
          <path d="M64 116 q12 -12 32 -11 q24 -4 38 6" fill="#FCD34D" />
          <ellipse cx="100" cy="110" rx="13" ry="10" fill="#FF8F00" />
          <ellipse cx="100" cy="109" rx="8" ry="6" fill="#FFD54F" />
        </g>
      )
    case 'rad-na':
      return (
        <g>
          <ellipse cx="100" cy="130" rx="62" ry="28" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <g stroke="#EAB308" strokeWidth="5" strokeLinecap="round" fill="none">
            <path d="M66 118 q14 -6 28 0 t30 0" /><path d="M68 124 q14 -6 28 0 t30 -2" />
          </g>
          <ellipse cx="100" cy="112" rx="30" ry="12" fill="#B45309" opacity="0.85" />
          <ellipse cx="100" cy="110" rx="26" ry="10" fill="#D97706" opacity="0.9" />
          <g fill="#15803D"><ellipse cx="76" cy="106" rx="6" ry="4" /><ellipse cx="122" cy="108" rx="6" ry="4" /></g>
          <g fill="#92400E"><ellipse cx="92" cy="110" rx="6" ry="4" /><ellipse cx="108" cy="112" rx="6" ry="4" /></g>
        </g>
      )
    case 'sticky-chicken':
      return (
        <g>
          <ellipse cx="100" cy="132" rx="60" ry="26" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <ellipse cx="76" cy="116" rx="22" ry="14" fill="#FDFBF5" stroke="#E7E0D2" strokeWidth="1.5" />
          <g fill="#FFF" stroke="#E7E0D2" strokeWidth="1"><circle cx="70" cy="114" r="2" /><circle cx="78" cy="112" r="2" /><circle cx="84" cy="116" r="2" /></g>
          <ellipse cx="124" cy="112" rx="20" ry="15" fill="#B45309" />
          <ellipse cx="124" cy="109" rx="20" ry="15" fill="#D97706" />
          <ellipse cx="124" cy="106" rx="14" ry="10" fill="#F59E0B" />
        </g>
      )
    case 'dumpling':
      return (
        <g>
          <ellipse cx="100" cy="132" rx="60" ry="26" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <g fill="#F59E0B">
            <ellipse cx="80" cy="114" rx="14" ry="11" /><ellipse cx="104" cy="110" rx="14" ry="11" /><ellipse cx="124" cy="118" rx="12" ry="10" />
          </g>
          <g fill="#FCD34D"><ellipse cx="80" cy="111" rx="9" ry="6" /><ellipse cx="104" cy="107" rx="9" ry="6" /></g>
          <ellipse cx="128" cy="132" rx="14" ry="7" fill="#fff" stroke="#E5E0D8" strokeWidth="1.5" />
          <ellipse cx="128" cy="131" rx="10" ry="4.5" fill="#C2410C" />
        </g>
      )
    case 'suki':
      return (
        <g>
          <ellipse cx="100" cy="130" rx="62" ry="28" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <g stroke="#FDE68A" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M68 116 q12 -8 26 -2 t30 -2" /><path d="M70 122 q14 -6 28 -2 t28 -2" />
          </g>
          <g fill="#F97316"><circle cx="88" cy="112" r="4" /><circle cx="110" cy="114" r="4" /></g>
          <g fill="#16A34A"><ellipse cx="76" cy="108" rx="6" ry="4" /><ellipse cx="124" cy="110" rx="6" ry="4" /></g>
          <ellipse cx="132" cy="132" rx="13" ry="6" fill="#fff" stroke="#E5E0D8" strokeWidth="1.5" />
          <ellipse cx="132" cy="131" rx="9" ry="4" fill="#DC2626" />
        </g>
      )
    case 'veg-side':
      return (
        <g>
          <ellipse cx="100" cy="132" rx="62" ry="26" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <ellipse cx="128" cy="116" rx="18" ry="14" fill="#7C2D12" />
          <ellipse cx="128" cy="114" rx="18" ry="14" fill="#9A3412" />
          <ellipse cx="128" cy="113" rx="12" ry="9" fill="#C2410C" />
          <g fill="#16A34A"><ellipse cx="72" cy="112" rx="10" ry="6" /><ellipse cx="88" cy="120" rx="10" ry="6" /></g>
          <g fill="#84CC16"><ellipse cx="72" cy="110" rx="6" ry="3.4" /><ellipse cx="88" cy="118" rx="6" ry="3.4" /></g>
          <ellipse cx="104" cy="112" rx="8" ry="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        </g>
      )
    case 'toast':
      return (
        <g>
          <ellipse cx="100" cy="132" rx="62" ry="26" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <g>
            <rect x="66" y="100" width="34" height="26" rx="4" fill="#D97706" transform="rotate(-8 83 113)" />
            <rect x="68" y="98" width="34" height="26" rx="4" fill="#F59E0B" transform="rotate(-8 85 111)" />
            <rect x="100" y="100" width="34" height="26" rx="4" fill="#B45309" transform="rotate(8 117 113)" />
            <rect x="102" y="98" width="34" height="26" rx="4" fill="#D97706" transform="rotate(8 119 111)" />
          </g>
          <ellipse cx="134" cy="122" rx="15" ry="11" fill="#fff" stroke="#E5E0D8" strokeWidth="1.5" />
          <ellipse cx="134" cy="121" rx="11" ry="7.5" fill="#15803D" />
          <ellipse cx="134" cy="120" rx="7" ry="4.5" fill="#4ADE80" />
        </g>
      )
    // ——— BOWL DISHES ———
    case 'boat-noodle': case 'soup':
      return (
        <g>
          <path d="M52 118 h96 q0 34 -48 34 q-48 0 -48 -34z" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <ellipse cx="100" cy="118" rx="48" ry="16" fill={kind === 'soup' ? '#FEF3C7' : '#4E342E'} />
          <ellipse cx="100" cy="117" rx="42" ry="12" fill={kind === 'soup' ? '#FDE68A' : '#5D4037'} />
          <g stroke="#F5F5F5" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.9">
            <path d="M74 114 q10 -4 20 0 t22 0" /><path d="M78 119 q10 -4 20 0 t20 0" />
          </g>
          <g fill={kind === 'soup' ? '#fff' : '#D7CCC8'}>
            <ellipse cx="86" cy="114" rx="6" ry="4" /><ellipse cx="114" cy="116" rx="6" ry="4" />
          </g>
          <g fill="#16A34A"><ellipse cx="70" cy="110" rx="5" ry="3" /><ellipse cx="130" cy="112" rx="5" ry="3" /></g>
          <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" fill="none">
            <path d="M88 92 q4 -6 0 -12 q-4 -6 0 -12" /><path d="M104 92 q4 -6 0 -12 q-4 -6 0 -12" />
          </g>
        </g>
      )
    case 'dry-noodle':
      return (
        <g>
          <path d="M52 120 h96 q0 32 -48 32 q-48 0 -48 -32z" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <g stroke="#F59E0B" strokeWidth="4.4" strokeLinecap="round" fill="none">
            <path d="M66 112 q12 -8 26 -2 t30 -2 t14 2" /><path d="M68 118 q14 -6 28 -2 t30 -2" /><path d="M74 123 q12 -5 26 -2 t24 -2" />
          </g>
          <g fill="#DC2626"><ellipse cx="88" cy="106" rx="9" ry="5" /><ellipse cx="108" cy="108" rx="9" ry="5" /></g>
          <g fill="#16A34A"><ellipse cx="126" cy="112" rx="6" ry="4" /><ellipse cx="72" cy="106" rx="5" ry="3.4" /></g>
          <g fill="#FDE68A"><circle cx="98" cy="114" r="1.8" /><circle cx="106" cy="116" r="1.8" /><circle cx="92" cy="118" r="1.8" /></g>
        </g>
      )
    case 'pink-noodle':
      return (
        <g>
          <path d="M52 118 h96 q0 34 -48 34 q-48 0 -48 -34z" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <ellipse cx="100" cy="118" rx="48" ry="16" fill="#F8BBD0" />
          <ellipse cx="100" cy="117" rx="42" ry="12" fill="#F48FB1" />
          <g stroke="#FCE4EC" strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M74 114 q10 -4 20 0 t22 0" /><path d="M78 119 q10 -4 20 0 t20 0" />
          </g>
          <g fill="#fff"><circle cx="88" cy="114" r="5" /><circle cx="112" cy="116" r="5" /></g>
          <g fill="#16A34A"><ellipse cx="70" cy="110" rx="5" ry="3" /><ellipse cx="130" cy="112" rx="5" ry="3" /></g>
          <path d="M120 108 l8 -4 l2 8z" fill="#F59E0B" />
        </g>
      )
    // ——— CUPS ———
    case 'bubble-tea':
      return (
        <g>
          <path d="M74 84 h52 l-6 62 q-.6 6 -7 6 h-26 q-6.4 0 -7 -6z" fill="#fff" opacity="0.92" stroke="#E5E0D8" strokeWidth="2" />
          <path d="M76 100 h48 l-2 20 h-44z" fill="#D7A066" />
          <path d="M74 84 h52 l-1.4 14 h-49.2z" fill="#8D6E63" />
          <g fill="#3E2723">
            <circle cx="84" cy="140" r="5" /><circle cx="95" cy="142" r="5" /><circle cx="106" cy="140" r="5" /><circle cx="116" cy="141" r="5" />
            <circle cx="90" cy="132" r="5" /><circle cx="101" cy="133" r="5" /><circle cx="112" cy="132" r="5" />
          </g>
          <rect x="96" y="58" width="8" height="34" rx="4" fill="#111827" transform="rotate(8 100 75)" />
        </g>
      )
    case 'matcha':
      return (
        <g>
          <path d="M74 84 h52 l-6 62 q-.6 6 -7 6 h-26 q-6.4 0 -7 -6z" fill="#fff" opacity="0.94" stroke="#E5E0D8" strokeWidth="2" />
          <path d="M76 108 h48 l-3 32 q-.5 5 -6 5 h-30 q-5.5 0 -6 -5z" fill="#F8FAFC" />
          <path d="M75 84 h50 l-1.6 22 h-46.8z" fill="#2E7D32" />
          <path d="M75.5 100 h49" stroke="#A5D6A7" strokeWidth="2" opacity="0.8" />
          <rect x="96" y="58" width="8" height="34" rx="4" fill="#16A34A" transform="rotate(8 100 75)" />
        </g>
      )
    case 'cocoa':
      return (
        <g>
          <path d="M74 84 h52 l-6 62 q-.6 6 -7 6 h-26 q-6.4 0 -7 -6z" fill="#fff" opacity="0.94" stroke="#E5E0D8" strokeWidth="2" />
          <path d="M75 96 h50 l-4 44 q-.5 5 -6 5 h-30 q-5.5 0 -6 -5z" fill="#4E342E" />
          <ellipse cx="100" cy="94" rx="20" ry="9" fill="#fff" />
          <ellipse cx="100" cy="92" rx="20" ry="9" fill="#FFF8F0" />
          <path d="M86 88 q14 -6 28 0" stroke="#4E342E" strokeWidth="2.4" fill="none" />
          <rect x="96" y="58" width="8" height="34" rx="4" fill="#111827" transform="rotate(-8 100 75)" />
        </g>
      )
    case 'shaved-ice':
      return (
        <g>
          <path d="M76 106 h48 l-5 40 q-.5 6 -7 6 h-24 q-6.5 0 -7 -6z" fill="#fff" opacity="0.94" stroke="#E5E0D8" strokeWidth="2" />
          <path d="M78 118 h44 l-3 22 h-38z" fill="#FB923C" />
          <ellipse cx="100" cy="104" rx="28" ry="16" fill="#FED7AA" />
          <ellipse cx="100" cy="100" rx="28" ry="16" fill="#FFF7ED" />
          <ellipse cx="100" cy="88" rx="14" ry="10" fill="#fff" />
          <ellipse cx="100" cy="87" rx="14" ry="10" fill="#FFFFFF" stroke="#E5E0D8" strokeWidth="1.5" />
          <rect x="104" y="62" width="6" height="30" rx="3" fill="#F59E0B" transform="rotate(14 107 77)" />
        </g>
      )
    default:
      return (
        <g>
          <ellipse cx="100" cy="130" rx="58" ry="26" fill="#fff" stroke="#E5E0D8" strokeWidth="2" />
          <ellipse cx="100" cy="114" rx="34" ry="18" fill="#FCD34D" />
          <g fill="#16A34A"><ellipse cx="80" cy="108" rx="5" ry="3" /><ellipse cx="120" cy="110" rx="5" ry="3" /></g>
          <g fill="#C2410C"><circle cx="94" cy="113" r="3" /><circle cx="106" cy="115" r="3" /></g>
        </g>
      )
  }
}
