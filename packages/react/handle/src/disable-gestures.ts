import { useEffect } from 'react'

/**
 * Prevents browser pinch-zoom by intercepting ctrl+wheel events.
 * Use with disable-gestures.css for full gesture blocking.
 */
export function useDisableGestures() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault()
    }
    addEventListener('wheel', onWheel, { passive: false })
    return () => removeEventListener('wheel', onWheel)
  }, [])
}
