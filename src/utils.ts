import * as React from 'react'

/**
 * Filters to unique entries of an array.
 */
export const uniq = <T>(arr: T[]): T[] => Array.from(new Set<T>(arr))

/**
 * An SSR-friendly useLayoutEffect.
 *
 * React currently throws a warning when using useLayoutEffect on the server.
 * To get around it, we can conditionally useEffect on the server (no-op) and
 * useLayoutEffect elsewhere.
 *
 * @see https://github.com/facebook/react/issues/14927
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' && (window.document?.createElement || window.navigator?.product === 'ReactNative')
    ? React.useLayoutEffect
    : React.useEffect

/**
 * Returns a mutable callback function for event handlers.
 */
export function useCallbackRef<T>(fn: T): React.MutableRefObject<T> {
  const ref = React.useRef<T>(fn)
  useIsomorphicLayoutEffect(() => void (ref.current = fn), [fn])
  return ref
}
