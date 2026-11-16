import type { CharmType } from '../types'
import { charmDef } from '../three/charms'

/** Small flat icons for the palette (24×24 viewBox). */
const ICONS: Record<CharmType, (c: string) => React.ReactNode> = {
  pearl: (c) => (
    <>
      <circle cx="12" cy="12" r="7" fill={c} stroke="#cdbfae" />
      <circle cx="9.5" cy="9.5" r="2" fill="white" opacity="0.8" />
    </>
  ),
  stud: (c) => (
    <>
      <circle cx="12" cy="12" r="5.5" fill={c} stroke="#b08d47" />
      <circle cx="10.5" cy="10.5" r="1.4" fill="white" opacity="0.7" />
    </>
  ),
  gem: (c) => (
    <path d="M12 4 L19 9 L16.5 18 L7.5 18 L5 9 Z M5 9 H19 M9 9 L12 18 L15 9" fill={c} stroke="#b9708f" strokeLinejoin="round" />
  ),
  heart: (c) => (
    <path d="M12 19 C7 15 4 12.5 4 9.3 C4 6.8 6 5 8.2 5 C9.8 5 11.2 6 12 7.3 C12.8 6 14.2 5 15.8 5 C18 5 20 6.8 20 9.3 C20 12.5 17 15 12 19 Z" fill={c} stroke="#b8466a" />
  ),
  star: (c) => (
    <path d="M12 3.5 L14.4 9.2 L20.5 9.6 L15.8 13.5 L17.3 19.5 L12 16.2 L6.7 19.5 L8.2 13.5 L3.5 9.6 L9.6 9.2 Z" fill={c} stroke="#b08d47" strokeLinejoin="round" />
  ),
  bow: (c) => (
    <>
      <path d="M12 12 C9 8 4 6 4 10.5 C4 15 9 15 12 12 C15 15 20 15 20 10.5 C20 6 15 8 12 12 Z" fill={c} stroke="#c47f96" />
      <circle cx="12" cy="12" r="2" fill={c} stroke="#c47f96" />
    </>
  ),
  crescent: (c) => (
    <path d="M14 4.5 A7.5 7.5 0 1 0 14 19.5 A6 7.5 0 1 1 14 4.5 Z" fill={c} stroke="#8e93a3" />
  ),
  flower: (c) => (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="12" cy="7.3" rx="3" ry="4.2" fill={c} stroke="#d39aae" transform={`rotate(${a} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="2.3" fill="#f3c86b" />
    </>
  ),
}

export function CharmIcon({ type, className }: { type: CharmType; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={0.8} aria-hidden>
      {ICONS[type](charmDef(type).color)}
    </svg>
  )
}
