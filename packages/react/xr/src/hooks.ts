import { PointerEvent, PointerEventsMap } from '@pmndrs/pointer-events'
import { RefObject, useEffect, useState, useSyncExternalStore } from 'react'
import { Object3D, Object3DEventMap } from 'three'
import { useXR } from './xr.js'

/**
 * Used to track the hover state of a 3D object.
 *
 * @param ref The reference to the 3D object.
 * @param onChange `(hover: boolean, event: PointerEvent) => void` Callback for hover state changes.
 */
export function useHover(ref: RefObject<Object3D | null>): boolean

export function useHover(ref: RefObject<Object3D | null>, onChange: (hover: boolean, event: PointerEvent) => void): void

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
    const { current } = ref as RefObject<Object3D | null>
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
 * Gets the visibility state of the XR session.
 *
 * @returns The visibility state of the XR session.
 */
export function useXRSessionVisibilityState() {
  return useXR((xr) => xr.visibilityState)
}

/**
 * Initilizes the room capture process.
 *
 * @returns A function to initiate room capture, or undefined if unavailable.
 */
export function useInitRoomCapture() {
  return useXR((xr) => xr.session?.initiateRoomCapture?.bind(xr.session))
}

// Singleton external store for XR session support
// This lives outside React to properly work with useSyncExternalStore
const sessionSupportStore = (() => {
  const cache = new Map<XRSessionMode, boolean>()
  const listeners = new Map<XRSessionMode, Set<() => void>>()
  const errorHandlers = new Map<XRSessionMode, Set<(error: any) => void>>()
  const pending = new Set<XRSessionMode>()
  let deviceChangeListenerAttached = false

  const recheckAllModes = () => {
    cache.clear()
    pending.clear()

    // Recheck all modes that have listeners
    for (const [mode, modeListeners] of listeners.entries()) {
      if (modeListeners.size > 0) {
        checkSupport(mode)
      }
    }
  }

  const checkSupport = (mode: XRSessionMode) => {
    if (pending.has(mode)) {
      return
    }

    pending.add(mode)

    if (typeof navigator === 'undefined' || !navigator.xr) {
      cache.set(mode, false)
      pending.delete(mode)
      notifyListeners(mode)
    } else {
      navigator.xr
        .isSessionSupported(mode)
        .then((supported) => {
          cache.set(mode, supported)
          pending.delete(mode)
          notifyListeners(mode)
        })
        .catch((error) => {
          cache.set(mode, false)
          pending.delete(mode)
          notifyListeners(mode)
          // Notify all error handlers for this mode
          errorHandlers.get(mode)?.forEach((handler) => handler(error))
        })
    }
  }

  const notifyListeners = (mode: XRSessionMode) => {
    listeners.get(mode)?.forEach((cb) => cb())
  }

  return {
    getSnapshot(mode: XRSessionMode): boolean | undefined {
      return cache.get(mode)
    },

    subscribe(mode: XRSessionMode, callback: () => void, onError?: (error: any) => void) {
      // Set up devicechange listener once
      if (!deviceChangeListenerAttached && typeof navigator !== 'undefined' && navigator.xr) {
        navigator.xr.addEventListener('devicechange', recheckAllModes)
        deviceChangeListenerAttached = true
      }

      // Add listener for this mode
      if (!listeners.has(mode)) {
        listeners.set(mode, new Set())
      }
      listeners.get(mode)!.add(callback)

      // Add error handler if provided
      if (onError) {
        if (!errorHandlers.has(mode)) {
          errorHandlers.set(mode, new Set())
        }
        errorHandlers.get(mode)!.add(onError)
      }

      // Fetch support status if not cached
      if (!cache.has(mode)) {
        checkSupport(mode)
      }

      // Return unsubscribe function
      return () => {
        listeners.get(mode)?.delete(callback)
        if (onError) {
          errorHandlers.get(mode)?.delete(onError)
        }
      }
    },
  }
})()

/**
 * Checks whether a specific XRSessionMode is supported or not
 *
 * @param {XRSessionMode} mode - The `XRSessionMode` to check against.
 * @param {(error: any) => void} onError - Optional callback for errors during support check.
 */
export function useXRSessionModeSupported(mode: XRSessionMode, onError?: (error: any) => void) {
  return useSyncExternalStore(
    (callback) => sessionSupportStore.subscribe(mode, callback, onError),
    () => sessionSupportStore.getSnapshot(mode),
    () => undefined, // SSR: return undefined on server
  )
}

/**
 * @deprecated use `useXRSessionModeSupported` instead
 */
export const useSessionModeSupported = useXRSessionModeSupported

/**
 * Checks if a specific XR session feature is enabled.
 *
 * @param {string} feature - The XR session feature to check against.
 * @returns {boolean} Whether the feature is enabled.
 */
export function useXRSessionFeatureEnabled(feature: string) {
  return useXR(({ session }) => session?.enabledFeatures?.includes(feature) ?? false)
}

/**
 * @deprecated use `useXRSessionFeatureEnabled` instead
 */
export const useSessionFeatureEnabled = useXRSessionFeatureEnabled
