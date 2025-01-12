import { RefObject, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Object3D, Object3DEventMap } from 'three'
import { useXR } from './xr.js'
import { PointerEventsMap } from '@pmndrs/pointer-events'

export function useHover(ref: RefObject<Object3D>): boolean

export function useHover(ref: RefObject<Object3D>, onChange: (hover: boolean) => void): void

export function useHover(ref: RefObject<Object3D>, onChange?: (hover: boolean) => void): boolean | undefined {
  let setHover: (hover: boolean) => void
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
    const { current } = ref as RefObject<Object3D<PointerEventsMap & Object3DEventMap>>
    if (current == null) {
      return
    }
    const set = new Set<number>()
    const enter = (e: { pointerId: number }) => {
      if (set.size === 0) {
        setHover(true)
      }
      set.add(e.pointerId)
    }
    const leave = (e: { pointerId: number }) => {
      set.delete(e.pointerId)
      if (set.size === 0) {
        setHover(false)
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
 * hook for getting the session visibility state
 */
export function useXRSessionVisibilityState() {
  return useXR((xr) => xr.visibilityState)
}

/**
 * hook for getting the function to initialize the room capture for scanning the room
 */
export function useInitRoomCapture() {
  return useXR((xr) => xr.session?.initiateRoomCapture?.bind(xr.session))
}

/**
 * hook for checking if a session mode is supported
 * @param onError callback executed when an error happens while checking if the session mode is supported
 */
export function useSessionModeSupported(mode: XRSessionMode, onError?: (error: any) => void) {
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

export function useSessionFeatureEnabled(feature: string) {
  return useXR(({ session }) => session?.enabledFeatures?.includes(feature) ?? false)
}
