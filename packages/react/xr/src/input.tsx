import {
  bindXRInputSourceEvent,
  XRGazeState,
  XRInputSourceState,
  XRInputSourceStateMap,
  XRScreenInputState,
  XRTransientPointerState,
} from '@pmndrs/xr/internals'
import { useXR } from './xr.js'
import { xrInputSourceStateContext } from './contexts.js'
import { useContext, useEffect } from 'react'

export type { XRTransientPointerState, XRScreenInputState, XRGazeState }

export function useXRInputSourceStates() {
  return useXR((xr) => xr.inputSourceStates)
}

export function useXRInputSourceState<T extends keyof XRInputSourceStateMap>(
  type: T,
  handedness?: XRHandedness,
): XRInputSourceStateMap[T] | undefined {
  return useXR((s) =>
    s.inputSourceStates.find<XRInputSourceStateMap[T]>(
      (state): state is XRInputSourceStateMap[T] =>
        state.type === type && (handedness == null || state.inputSource.handedness === handedness),
    ),
  )
}

export function useXRInputSourceStateContext<T extends keyof XRInputSourceStateMap>(type: T): XRInputSourceStateMap[T]

export function useXRInputSourceStateContext(): XRInputSourceState

export function useXRInputSourceStateContext<T extends keyof XRInputSourceStateMap>(
  type?: T,
): XRInputSourceStateMap[T] {
  const state = useContext(xrInputSourceStateContext)
  if (state == null || (type != null && state.type != type)) {
    throw new Error(`useXRInputSourceStateContext() can only be used inside a the xr store config`)
  }
  return state as XRInputSourceStateMap[T]
}

/**
 * hook for listening to xr input source events
 */
export function useXRInputSourceEvent(
  inputSource: XRInputSource | 'all' | undefined,
  event: Parameters<typeof bindXRInputSourceEvent>[2],
  fn: (event: XRInputSourceEvent) => void,
  deps: Array<any>,
) {
  const session = useXR((xr) => xr.session)
  useEffect(() => {
    if (session == null || inputSource == null) {
      return
    }
    return bindXRInputSourceEvent(session, inputSource, event, fn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, inputSource, session, ...deps])
}
