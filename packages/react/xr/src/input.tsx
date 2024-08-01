import { bindXRInputSourceEvent, XRGazeState, XRScreenInputState, XRTransientPointerState } from '@pmndrs/xr/internals'
import { useXR } from './xr.js'
import { xrInputSourceStateContext } from './contexts.js'
import { useContext, useEffect } from 'react'

export type { XRTransientPointerState, XRScreenInputState, XRGazeState }

/**
 * hook for listening to xr input source events
 */
export function useXRInputSourceEvent(
  inputSource: XRInputSource | undefined,
  event: Parameters<typeof bindXRInputSourceEvent>[2],
  fn: () => void,
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

/**
 * hook for getting the transient-pointer state
 * @param handedness the handedness that the XRHandState should have
 */
export function useXRTransientPointerState(handedness: XRHandedness): XRTransientPointerState | undefined

/**
 * hook for getting the transient-pointer state
 */
export function useXRTransientPointerState(): XRTransientPointerState

export function useXRTransientPointerState(handedness?: XRHandedness): XRTransientPointerState | undefined {
  if (handedness != null) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useXR((s) => s.transientPointerStates.find((state) => state.inputSource.handedness === handedness))
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const state = useContext(xrInputSourceStateContext)
  if (state == null || state.type != 'transientPointer') {
    throw new Error(`useXRTransientPointerState() can only be used inside a <XRHand> or with using useXRHand("left")`)
  }
  return state
}
/**
 * hook for getting the gaze state
 */
export function useXRGazeState(): XRGazeState {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const state = useContext(xrInputSourceStateContext)
  if (state == null || state.type != 'gaze') {
    throw new Error(`useXRGazeState() can only be used inside a <XRGaze>`)
  }
  return state
}

/**
 * hook for getting the screen-input state
 */
export function useXRScreenInputState(): XRScreenInputState {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const state = useContext(xrInputSourceStateContext)
  if (state == null || state.type != 'screenInput') {
    throw new Error(`useXRScreenInputState() can only be used inside a <XRGaze>`)
  }
  return state
}
