import { useEffect } from 'react'

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'click',
]

/**
 * Calls `onIdle` after `timeoutMinutes` of no mouse/keyboard activity.
 * Pass `enabled: false` (e.g. while locked) to disable the timer entirely.
 */
export function useIdleTimer(timeoutMinutes: number, onIdle: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled || timeoutMinutes <= 0) return

    let timer: ReturnType<typeof setTimeout>

    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(onIdle, timeoutMinutes * 60_000)
    }

    reset()
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }))

    return () => {
      clearTimeout(timer)
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [timeoutMinutes, onIdle, enabled])
}
