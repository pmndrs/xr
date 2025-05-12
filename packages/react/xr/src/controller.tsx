import {
  configureXRControllerModel,
  createUpdateXRControllerVisuals,
  loadXRControllerModel,
  XRControllerGamepadComponentId,
  XRControllerGamepadComponentState,
  XRControllerLayout,
  XRControllerLayoutLoader,
  XRControllerLayoutLoaderOptions,
  XRControllerModelOptions,
  XRControllerState,
} from '@pmndrs/xr/internals'
import { createPortal, useFrame } from '@react-three/fiber'
import { forwardRef, ReactNode, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { suspend } from 'suspend-react'
import { Object3D } from 'three'
import { useXRInputSourceStateContext } from './input.js'
import { XRSpace } from './space.js'

/**
 * Component for placing content in the controller anchored at a specific component such as the Thumbstick
 *
 * @param props
 * #### `id` - `XRControllerGamepadComponentId` Is the id of the component where content should be placed (e.g. `"a-button"`)
 * #### `onPress?` - `Function` Is an optional callback to receive when the component is pressed
 * #### `onRelease?` - `Function` Is an optional callback to receive when the component is released
 * #### `children?` - `ReactNode` Children to be placed inside the componenent (e.g. visualizing a tooltip over the button...)
 *
 * @function
 */
export const XRControllerComponent = forwardRef<
  Object3D | undefined,
  {
    onPress?: () => void
    onRelease?: () => void
    id: XRControllerGamepadComponentId
    children?: ReactNode
  }
>(({ id, children, onPress, onRelease }, ref) => {
  const state = useXRInputSourceStateContext('controller')
  const [object, setObject] = useState<Object3D | undefined>(undefined)
  useImperativeHandle(ref, () => object, [object])
  useXRControllerButtonEvent(state, id, (state) => (state === 'pressed' ? onPress?.() : onRelease?.()))
  useFrame(() => setObject(state.gamepad[id]?.object))
  if (object == null) {
    return
  }
  return createPortal(children, object)
})

/**
 * Hook for subscribing to a button state change event on the controller
 * @param id of the button
 * @param onChange callback that gets executed when the state of the button changes
 * @param handedness of the controller
 */
export function useXRControllerButtonEvent(
  controller: XRControllerState,
  id: XRControllerGamepadComponentId,
  onChange: (state: XRControllerGamepadComponentState['state']) => void,
): void {
  const state = useRef<XRControllerGamepadComponentState['state']>(undefined)
  useFrame(() => {
    const currentState = controller?.gamepad[id]?.state
    if (currentState != null && currentState != state.current) {
      onChange(currentState)
    }
    state.current = currentState
  })
}

export type { XRControllerModelOptions, XRControllerState }

const LoadXRControllerModelSymbol = Symbol('loadXRControllerModel')

/**
 * Component for rendering a 3D model for the XRController
 * @param props
 * #### `colorWrite` - Configures the colorWrite property of the model
 * #### `renderOrder` - Configures the render order model
 * @function
 */
export const XRControllerModel = forwardRef<Object3D, XRControllerModelOptions>((options, ref) => {
  const state = useXRInputSourceStateContext('controller')
  const model = suspend(loadXRControllerModel, [state.layout, undefined, LoadXRControllerModelSymbol])
  configureXRControllerModel(model, options)
  state.object = model
  useImperativeHandle(ref, () => model, [model])
  const update = useMemo(
    () => createUpdateXRControllerVisuals(model, state.layout, state.gamepad),
    [model, state.layout, state.gamepad],
  )
  useFrame(update)
  return (
    <XRSpace space="grip-space">
      <primitive object={model} />
    </XRSpace>
  )
})

const LoadXRControllerLayoutSymbol = Symbol('loadXRControllerLayout')

/**
 * For rendering a controller that is not included in WebXR. (e.g controller tutorials/demos)
 *
 * @param profileIds
 * @param handedness
 * @param XRControllerLayoutLoaderOptions
 * @returns Promise<XRControllerLayout>
 */
export function useLoadXRControllerLayout(
  profileIds: string[],
  handedness: XRHandedness,
  { baseAssetPath, defaultControllerProfileId }: XRControllerLayoutLoaderOptions = {},
): XRControllerLayout {
  const loader = useMemo(
    () => new XRControllerLayoutLoader({ baseAssetPath, defaultControllerProfileId }),
    [baseAssetPath, defaultControllerProfileId],
  )
  return suspend(() => {
    const result = loader.loadAsync(profileIds, handedness)
    return result instanceof Promise ? result : Promise.resolve(result)
  }, [LoadXRControllerLayoutSymbol, handedness, ...profileIds])
}

/**
 * Loads the controller model for the given layout. This is a suspendable function, so it can be used with React Suspense.
 * @param layout: XRControllerLayout
 * @returns Promise<THREE.Group>
 */
export function useLoadXRControllerModel(layout: XRControllerLayout) {
  return suspend(loadXRControllerModel, [layout, undefined, LoadXRControllerModelSymbol])
}
