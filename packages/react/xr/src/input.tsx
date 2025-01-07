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
  if (state == null) {
    throw new Error(`useXRInputSourceStateContext() can only be used inside the xr store config`)
  }
  if (type != null && state.type != type) {
    throw new Error(
      `useXRInputSourceStateContext(${type}) can not be used inside a component for input type "${state.type}"`,
    )
  }
  return state as XRInputSourceStateMap[T]
}

/**
 * Hook for listening to xr input source events
 * @param inputSource The input source to listen to, or 'all' to listen to all input sources
 * @param event The event to listen to. ([List of events](https://developer.mozilla.org/en-US/docs/Web/API/XRInputSourceEvent))
 * @param fn Callback function called when the event is triggered.
 * @param deps Retriggers the binding of the event when the dependencies change.
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
