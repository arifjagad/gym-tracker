import anime from 'animejs'

/**
 * Easing kustom — definisikan sekali, pakai di mana-mana.
 * Ref: Frontend Design.md § Motion > Setup
 */
export const EASE = {
  /** Berhenti "berat", tanpa overshoot */
  settle: 'cubicBezier(0.22, 1, 0.36, 1)',
  /** Tertahan lalu lepas — efek rack pull */
  pullTension: 'cubicBezier(0.65, 0, 0.35, 1)',
  /** Melambat tajam di akhir */
  outExpo: 'easeOutExpo',
} as const

// ============================================================
// 1. Rack pull — expand card exercise
// ============================================================
export function expandExerciseCard(el: HTMLElement) {
  anime({
    targets: el,
    height: [0, el.scrollHeight],
    opacity: [0, 1],
    duration: 420,
    easing: EASE.pullTension,
  })
}

// ============================================================
// 2. Plate slide — tanda set selesai
// ============================================================
export function markSetComplete(el: HTMLElement) {
  anime({
    targets: el,
    translateX: [-24, 0],
    opacity: [0, 1],
    duration: 320,
    easing: EASE.settle,
  })
}

// ============================================================
// 3. Odometer roll — angka berat berubah
// ============================================================
export function rollNumber(el: HTMLElement, from: number, to: number) {
  const obj = { value: from }
  anime({
    targets: obj,
    value: to,
    duration: 500,
    easing: EASE.outExpo,
    round: 1,
    update: () => {
      el.textContent = obj.value.toFixed(Number.isInteger(to) ? 0 : 1)
    },
  })
}

// ============================================================
// 4. Chalk burst — PR (personal record) baru
// ============================================================
export function chalkBurst(originEl: HTMLElement) {
  const rect = originEl.getBoundingClientRect()
  const particles = Array.from({ length: 10 }, () => {
    const p = document.createElement('span')
    p.className =
      'fixed w-1 h-1 rounded-full bg-[--chalk] pointer-events-none z-50'
    p.style.left = `${rect.left + rect.width / 2}px`
    p.style.top = `${rect.top + rect.height / 2}px`
    document.body.appendChild(p)
    return p
  })

  anime({
    targets: particles,
    translateX: () => anime.random(-40, 40),
    translateY: () => anime.random(-50, -10),
    opacity: [1, 0],
    scale: [1, 0.3],
    duration: () => anime.random(500, 800),
    easing: EASE.outExpo,
    complete: () => particles.forEach((p) => p.remove()),
  })

  // Flash warna --intensity di badge itu sendiri
  anime({
    targets: originEl,
    backgroundColor: [
      'rgba(232,67,44,0)',
      'rgba(232,67,44,0.25)',
      'rgba(232,67,44,0)',
    ],
    duration: 900,
    easing: 'linear',
  })
}

// ============================================================
// 5. Count-up — angka ringkasan di dashboard
// ============================================================
export function countUp(el: HTMLElement, target: number) {
  const obj = { value: 0 }
  anime({
    targets: obj,
    value: target,
    duration: 900,
    easing: EASE.outExpo,
    round: 1,
    update: () => {
      el.textContent = String(obj.value)
    },
  })
}

// ============================================================
// 6. Tap feedback — semua tombol & badge interaktif
// ============================================================
export function tapFeedback(el: HTMLElement) {
  anime({
    targets: el,
    scale: [1, 0.96, 1],
    duration: 180,
    easing: EASE.settle,
  })
}
