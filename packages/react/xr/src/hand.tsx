import {
  XRHandModelOptions,
  cloneXRHandGltf,
  configureXRHandModel,
  createUpdateXRHandVisuals,
} from '@pmndrs/xr/internals'
import { useFrame, useLoader } from '@react-three/fiber'
import { ReactNode, forwardRef, useImperativeHandle, useMemo } from 'react'
import { Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useXRInputSourceStateContext } from './input.js'
import { XRSpace, useXRSpace } from './space.js'

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
  state.object = model
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
 * @deprecated use `<XRSpace space="wrist">` instead of `<XRHandJoint joint="wrist">`
 * component for placing content in the hand anchored at a specific joint such as the index finger tip
 *
 * properties
 * - `joint` is the name of the joint (e.g. `"wrist"`)
 *
 * the component allows children to be placed inside for e.g. visualizing a tooltip over the index finger tip
 *
 */
export const XRHandJoint = forwardRef<Object3D, { joint: XRHandJoint; children?: ReactNode }>(
  ({ joint, children }, ref) => {
    return (
      <XRSpace ref={ref} space={joint}>
        {children}
      </XRSpace>
    )
  },
)
