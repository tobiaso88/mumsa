import { useEffect, useRef, type RefObject } from 'react'

/** Så långt (px) arket måste dras ner för att stängas när man släpper. */
const CLOSE_DISTANCE = 100
/** Ett snabbt svep (px/ms) stänger även om det är kort. */
const CLOSE_VELOCITY = 0.5
const MIN_FLICK_DISTANCE = 20
const DURATION_MS = 200

type Options = {
  /**
   * Arket är en hel skärm som scrollar med sidan i stället för i sig självt.
   * Då räknas sidans scrollposition och bakgrunden tonas inte ut.
   */
  page?: boolean
}

/**
 * Låter användaren dra ner ett ark för att stänga det. Draget börjar bara när arket
 * är scrollat till toppen, så att vanlig scrollning i innehållet fungerar som förut.
 */
export function useSwipeToClose(ref: RefObject<HTMLElement | null>, onClose: () => void, { page = false }: Options = {}) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const sheet = ref.current
    if (!sheet) return
    const backdrop = page ? null : sheet.parentElement
    const scrolled = () => (page ? window.scrollY : sheet.scrollTop) > 0

    let startY = 0
    let startTime = 0
    let offset = 0
    let tracking = false
    let dragging = false
    let closing = false

    const place = (y: number, animate: boolean) => {
      const transition = animate ? `transform ${DURATION_MS}ms ease-out` : 'none'
      sheet.style.transition = transition
      sheet.style.transform = y > 0 ? `translateY(${y}px)` : ''
      if (backdrop) {
        backdrop.style.transition = animate ? `opacity ${DURATION_MS}ms ease-out` : 'none'
        backdrop.style.opacity = y > 0 ? String(Math.max(0, 1 - y / Math.max(sheet.offsetHeight, 1))) : ''
      }
    }

    const onStart = (e: TouchEvent) => {
      tracking = !closing && e.touches.length === 1
      dragging = false
      offset = 0
      startY = e.touches[0]?.clientY ?? 0
      startTime = Date.now()
    }

    const onMove = (e: TouchEvent) => {
      if (!tracking) return
      const dy = (e.touches[0]?.clientY ?? startY) - startY
      if (!dragging) {
        // Uppåt eller mitt i en scrollning: låt webbläsaren scrolla som vanligt
        if (dy < 0 || scrolled()) {
          tracking = dy === 0
          return
        }
        if (dy === 0) return
        dragging = true
        // Inlinestilar vinner inte över en CSS-animation, så stäng av intoningen
        sheet.style.animation = 'none'
      }
      e.preventDefault()
      offset = Math.max(0, dy)
      place(offset, false)
    }

    const onEnd = () => {
      if (!dragging) {
        tracking = false
        return
      }
      tracking = dragging = false
      const velocity = offset / Math.max(Date.now() - startTime, 1)
      if (offset > CLOSE_DISTANCE || (velocity > CLOSE_VELOCITY && offset > MIN_FLICK_DISTANCE)) {
        closing = true
        place(sheet.offsetHeight || window.innerHeight, true)
        window.setTimeout(() => onCloseRef.current(), DURATION_MS)
      } else {
        place(0, true)
      }
    }

    sheet.addEventListener('touchstart', onStart, { passive: true })
    sheet.addEventListener('touchmove', onMove, { passive: false })
    sheet.addEventListener('touchend', onEnd)
    sheet.addEventListener('touchcancel', onEnd)
    return () => {
      sheet.removeEventListener('touchstart', onStart)
      sheet.removeEventListener('touchmove', onMove)
      sheet.removeEventListener('touchend', onEnd)
      sheet.removeEventListener('touchcancel', onEnd)
    }
  }, [ref, page])
}
