// The Clockwork logo mark used in sidebar-brand + topnav.
export default function BrandMark({ size = 28 }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill="oklch(58% 0.16 145)" />
      <path d="M8 12h6v2H8v-2zm0 5h16v2H8v-2zm0 5h12v2H8v-2z" fill="#fff" />
    </svg>
  )
}
