import { ReactNode, forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { suspend } from 'suspend-react'
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
import { Object3D } from 'three'
import { useXRInputSourceStateContext } from './input.js'
import { XRSpace } from './space.js'

/**
 * component for placing content in the controller anchored at a specific component such as the Thumbstick
 *
 * properties
 * - `id` is the id of the component (e.g. `"a-button"`)
 * - `onPress` is an optional callback to receive when the component is pressed
 * - `onRelease` is an optional callback to receive when the component is released
 *
 * the component allows children to be placed inside for e.g. visualizing a tooltip over the button/...
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
 * hook for subscribing to a button state change event on the controller
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

export type { XRControllerState, XRControllerModelOptions }

const LoadXRControllerModelSymbol = Symbol('loadXRControllerModel')
/**
 * component for rendering a 3D model for the XRController
 *
 * properties
 * - `colorWrite`
 * - `renderOrder`
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

export function useLoadXRControllerModel(layout: XRControllerLayout) {
  return suspend(loadXRControllerModel, [layout, undefined, LoadXRControllerModelSymbol])
}
