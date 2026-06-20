import gsap from 'gsap'

// Respect prefers-reduced-motion everywhere (prototype parity).
export function motionOk() {
  return typeof window !== 'undefined'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export { gsap }
