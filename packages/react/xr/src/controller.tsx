import { ReactNode, forwardRef, useContext, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { suspend } from 'suspend-react'
import {
  XRControllerGamepadComponentId,
  XRControllerGamepadComponentState,
  XRControllerModelOptions,
  XRControllerState,
  configureXRControllerModel,
  createUpdateXRControllerVisuals,
  loadXRControllerModel,
} from '@pmndrs/xr/internals'
import { createPortal, useFrame } from '@react-three/fiber'
import { useXR } from './xr.js'
import { Object3D } from 'three'
import { xrInputSourceStateContext } from './contexts.js'

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
  const state = useXRControllerState()
  const [object, setObject] = useState<Object3D | undefined>(undefined)
  useImperativeHandle(ref, () => object, [object])
  useXRControllerButtonEvent(id, (state) => (state === 'pressed' ? onPress?.() : onRelease?.()))
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
  id: XRControllerGamepadComponentId,
  onChange: (state: XRControllerGamepadComponentState['state']) => void,
  handedness?: XRHandedness,
): void {
  //making typescript happy (seems anti recreate but thats okay since its them same function)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const controller = handedness == null ? useXRControllerState() : useXRControllerState(handedness)
  const state = useRef<XRControllerGamepadComponentState['state']>()
  useFrame(() => {
    const currentState = controller?.gamepad[id]?.state
    if (currentState != null && currentState != state.current) {
      onChange(currentState)
    }
    state.current = currentState
  })
}

export type { XRControllerState }

/**
 * hook for getting the XRControllerState
 * @param handedness the handedness that the XRControllerState should have
 */
export function useXRControllerState(handedness: XRHandedness): XRControllerState | undefined

/**
 * hook for getting the XRControllerState
 */
export function useXRControllerState(): XRControllerState

export function useXRControllerState(handedness?: XRHandedness): XRControllerState | undefined {
  if (handedness != null) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useXR((s) => s.controllerStates.find((state) => state.inputSource.handedness === handedness))
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useContext(xrInputSourceStateContext)
  if (context == null || context.type != 'controller') {
    throw new Error(
      `useXRControllerState() can only be used inside a <XRController> or using useXRControllerState("left")`,
    )
  }
  return context
}

const LoadXRControllerModelSymbol = Symbol('loadXRControllerModel')

export type { XRControllerModelOptions }

/**
 * component for rendering a 3D model for the XRController
 *
 * properties
 * - `colorWrite`
 * - `renderOrder`
 */
export const XRControllerModel = forwardRef<Object3D, XRControllerModelOptions>((options, ref) => {
  const state = useXRControllerState()
  const model = suspend(loadXRControllerModel, [state.layout, undefined, LoadXRControllerModelSymbol])
  configureXRControllerModel(model, options)
  state.object = model
  useImperativeHandle(ref, () => model, [model])
  const update = useMemo(
    () => createUpdateXRControllerVisuals(model, state.layout, state.gamepad),
    [model, state.layout, state.gamepad],
  )
  useFrame(update)
  return <primitive object={model} />
})
