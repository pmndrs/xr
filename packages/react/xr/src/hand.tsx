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
 * Component for rendering a 3D model for the XRHand
 *
 * @param props
 * #### `colorWrite` - Configures color writing
 * #### `renderOrder` - Configures the render order of the model
 * @function
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
 * Component for placing content in the hand anchored at a specific joint such as the index finger tip.
 *
 * @param props
 * #### `joint` - [XRHandJoint](https://developer.mozilla.org/en-US/docs/Web/API/XRHand#hand_joints) Is the name of the joint where content should be placed (e.g. `"wrist"`)
 * #### `children` - Components to be placed inside the joint (e.g. For visualizing a tooltip over the index finger tip)
 *
 * @function
 * @deprecated use `<XRSpace space="wrist">` instead of `<XRHandJoint joint="wrist">`
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
