import {
  XRHandModelOptions,
  cloneXRHandGltf,
  configureXRHandModel,
  createUpdateXRHandVisuals,
} from '@pmndrs/xr/internals'
import { ReactNode, forwardRef, useImperativeHandle, useMemo } from 'react'
import { XRSpace, useXRSpace } from './space.js'
import { useFrame, useLoader } from '@react-three/fiber'
import { Object3D } from 'three'
import { useXRInputSourceStateContext } from './input.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export type { XRHandModelOptions }

/**
 * component for rendering a 3D model for the XRHand
 *
 * properties
 * - `colorWrite`
 * - `renderOrder`
 */
export const XRHandModel = forwardRef<Object3D, XRHandModelOptions>((options, ref) => {
  const state = useXRInputSourceStateContext('hand')
  const gltf = useLoader(GLTFLoader, state.assetPath)
  const model = useMemo(() => cloneXRHandGltf(gltf), [gltf])
  configureXRHandModel(model, options)
  useImperativeHandle(ref, () => model, [model])
  const referenceSpace = useXRSpace()
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
    const state = useXRInputSourceStateContext('hand')
    return (
      <XRSpace ref={ref} space={state.inputSource.hand.get(joint)!}>
        {children}
      </XRSpace>
    )
  },
)
