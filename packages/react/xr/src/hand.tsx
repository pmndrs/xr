import {
  XRHandModelOptions,
  XRHandState,
  configureXRHandModel,
  createUpdateXRHandVisuals,
  loadXRHandModel,
} from '@pmndrs/xr/internals'
import { ReactNode, forwardRef, useContext, useImperativeHandle, useMemo } from 'react'
import { XRSpace, useXRReferenceSpace } from './space.js'
import { useXR } from './xr.js'
import { suspend } from 'suspend-react'
import { useFrame } from '@react-three/fiber'
import { xrInputSourceStateContext } from './contexts.js'
import { Object3D } from 'three'

/**
 * hook for getting the XRHandState
 * @param handedness the handedness that the XRHandState should have
 */
export function useXRHandState(handedness: XRHandedness): XRHandState | undefined

/**
 * hook for getting the XRHandState
 */
export function useXRHandState(): XRHandState

export function useXRHandState(handedness?: XRHandedness): XRHandState | undefined {
  if (handedness != null) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useXR((s) => s.handStates.find((state) => state.inputSource.handedness === handedness))
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const state = useContext(xrInputSourceStateContext)
  if (state == null || state.type != 'hand') {
    throw new Error(`useXRHandState() can only be used inside a <XRHand> or with using useXRHandState("left")`)
  }
  return state
}

const LoadXRHandModelSymbol = Symbol('loadXRHandModel')

export type { XRHandModelOptions }

/**
 * component for rendering a 3D model for the XRHand
 *
 * properties
 * - `colorWrite`
 * - `renderOrder`
 */
export const XRHandModel = forwardRef<Object3D, XRHandModelOptions>((options, ref) => {
  const state = useXRHandState()
  const model = suspend(loadXRHandModel, [state.assetPath, undefined, LoadXRHandModelSymbol])
  configureXRHandModel(model, options)
  useImperativeHandle(ref, () => model, [model])
  const referenceSpace = useXRReferenceSpace()
  const update = useMemo(
    () => createUpdateXRHandVisuals(state.inputSource.hand, model, referenceSpace),
    [state.inputSource, model, referenceSpace],
  )
  useFrame((_state, _delta, frame) => update(frame))
  return <primitive object={model} />
})

/**
 * component for placing content in the hand anchored at a specific joint such as the index finger tip
 *
 * properties
 * - `joint` is the name of the joint (e.g. `"wrist"`)
 *
 * the component allows children to be placed inside for e.g. visualizing a tooltip over the index finger tip
 */
export const XRHandJoint = forwardRef<Object3D, { joint: XRHandJoint; children?: ReactNode }>(
  ({ joint, children }, ref) => {
    const state = useXRHandState()
    return (
      <XRSpace ref={ref} space={() => state.inputSource.hand.get(joint)}>
        {children}
      </XRSpace>
    )
  },
)
