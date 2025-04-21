import { RefObject, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Object3D, Object3DEventMap } from 'three'
import { useXR } from './xr.js'
import { PointerEventsMap, PointerEvent } from '@pmndrs/pointer-events'

/**
 * A hook for detecting hover state on a 3D object.
 *
 * @param {RefObject<Object3D | null>} ref - The reference to the 3D object.
 * @param {(hover: boolean, event: PointerEvent) => void} [onChange] - Callback for hover state changes.
 * @returns {boolean | undefined} - The hover state if no callback is provided.
 */
export function useHover(
  ref: RefObject<Object3D | null>,
  onChange?: (hover: boolean, event: PointerEvent) => void,
): boolean | undefined {
  let setHover: (hover: boolean, event: PointerEvent) => void
  let hover: boolean | undefined
  if (onChange == null) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [_hover, _setHover] = useState(false)
    setHover = _setHover
    hover = _hover
  } else {
    setHover = onChange
  }
  useEffect(() => {
    const { current } = ref as RefObject<Object3D<PointerEventsMap & Object3DEventMap> | null>
    if (current == null) {
      return
    }
    const set = new Set<number>()
    const enter = (e: PointerEvent) => {
      if (set.size === 0) {
        setHover(true, e)
      }
      set.add(e.pointerId)
    }
    const leave = (e: PointerEvent) => {
      set.delete(e.pointerId)
      if (set.size === 0) {
        setHover(false, e)
      }
    }
    current.addEventListener('pointerenter', enter as any)
    current.addEventListener('pointerleave', leave as any)
    return () => {
      current.removeEventListener('pointerenter', enter as any)
      current.removeEventListener('pointerleave', leave as any)
    }
  }, [ref, setHover])
  return hover
}

/**
 * Hook for getting the session visibility state.
 *
 * @returns {string} - The visibility state of the XR session.
 */
export function useXRSessionVisibilityState() {
  return useXR((xr) => xr.visibilityState)
}

/**
 * Hook for initializing room capture for scanning the room.
 *
 * @returns {Function | undefined} - A function to initiate room capture, or undefined if unavailable.
 */
export function useInitRoomCapture() {
  return useXR((xr) => xr.session?.initiateRoomCapture?.bind(xr.session))
}

/**
 * Hook for checking if a session mode is supported.
 *
 * @param {XRSessionMode} mode - The session mode to check.
 * @param {(error: any) => void} [onError] - Callback executed when an error occurs.
 * @returns {boolean | undefined} - Whether the session mode is supported.
 */
export function useXRSessionModeSupported(mode: XRSessionMode, onError?: (error: any) => void) {
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const [subscribe, getSnapshot] = useMemo(() => {
    let sessionSupported: boolean | undefined = undefined
    return [
      (onChange: () => void) => {
        let canceled = false
        if (typeof navigator === 'undefined' || navigator.xr == null) {
          sessionSupported = false
          return () => {}
        }

        navigator.xr
          .isSessionSupported(mode)
          .then((isSupported) => {
            sessionSupported = isSupported
            if (canceled) {
              return
            }
            onChange()
          })
          .catch((e) => {
            if (canceled) {
              return
            }
            onErrorRef.current?.(e)
          })
        return () => (canceled = true)
      },
      () => sessionSupported,
    ]
  }, [mode])
  return useSyncExternalStore(subscribe, getSnapshot)
}

/**
 * @deprecated use useXRSessionModeSupported instead
 */
export const useSessionModeSupported = useXRSessionModeSupported

/**
 * Hook for checking if a session feature is enabled.
 *
 * @param {string} feature - The feature to check.
 * @returns {boolean} - Whether the feature is enabled.
 */
export function useXRSessionFeatureEnabled(feature: string) {
  return useXR(({ session }) => session?.enabledFeatures?.includes(feature) ?? false)
}

/**
 * @deprecated use useXRSessionFeatureEnabled instead
 */
export const useSessionFeatureEnabled = useXRSessionFeatureEnabled
