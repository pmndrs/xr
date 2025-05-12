import {
  buildTeleportTargetFilter,
  createTeleportRayLine,
  defaultGrabPointerOpacity,
  defaultRayPointerOpacity,
  defaultTouchPointerOpacity,
  DefaultXRControllerOptions,
  DefaultXRGazeOptions,
  DefaultXRHandOptions,
  DefaultXRHandTouchPointerOptions,
  DefaultXRInputSourceGrabPointerOptions,
  DefaultXRInputSourceRayPointerOptions,
  DefaultXRInputSourceTeleportPointerOptions,
  DefaultXRScreenInputOptions,
  DefaultXRTransientPointerOptions,
  syncTeleportPointerRayGroup,
} from '@pmndrs/xr/internals'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { ReactNode, Suspense, useContext, useMemo, useRef } from 'react'
import { Group, Mesh, Object3D } from 'three'
import { xrInputSourceStateContext } from './contexts.js'
import { XRControllerModel } from './controller.js'
import { XRHandModel } from './hand.js'
import { useXRInputSourceStateContext } from './input.js'
import {
  CombinedPointer,
  PointerCursorModel,
  PointerRayModel,
  useGrabPointer,
  useLinesPointer,
  usePointerXRInputSourceEvents,
  useRayPointer,
  useTouchPointer,
} from './pointer.js'
import { XRSpace as XRSpaceImpl, XRSpaceType } from './space.js'
import { TeleportPointerRayModel } from './teleport.js'

export {
  defaultGrabPointerOpacity,
  defaultRayPointerOpacity,
  defaultTouchPointerOpacity,
  type DefaultXRControllerOptions,
  type DefaultXRGazeOptions,
  type DefaultXRHandOptions,
  type DefaultXRHandTouchPointerOptions,
  type DefaultXRInputSourceGrabPointerOptions,
  type DefaultXRInputSourceRayPointerOptions,
  type DefaultXRScreenInputOptions,
  type DefaultXRTransientPointerOptions,
} from '@pmndrs/xr/internals'

function DefaultXRInputSourceGrabPointer(
  event: 'select' | 'squeeze',
  spaceType: XRSpaceType,
  options: DefaultXRInputSourceGrabPointerOptions,
) {
  const state = useContext(xrInputSourceStateContext)
  if (state == null) {
    throw new Error(`DefaultXRInputSourceGrabPointer can only be used inside a XRInputSource`)
  }
  const ref = useRef<Object3D>(null)
  const pointer = useGrabPointer(ref, state, options)
  usePointerXRInputSourceEvents(pointer, state.inputSource, event, state.events)
  const cursorModelOptions = options.cursorModel
  return (
    <XRSpaceImpl ref={ref} space={spaceType}>
      {cursorModelOptions !== false && (
        <PointerCursorModel pointer={pointer} opacity={defaultGrabPointerOpacity} {...spreadable(cursorModelOptions)} />
      )}
    </XRSpaceImpl>
  )
}

/**
 * Grab pointer for the XRHand
 *
 * @param {DefaultXRInputSourceGrabPointerOptions} props
 * #### `clickThresholdMs` - Time in milliseconds between `pointerdown` and `pointerup` to trigger a click event
 * #### `dblClickThresholdMs` - Time in milliseconds between the first click and the second click to trigger a `dblclick` event
 * #### `contextMenuButton` - The button that triggers context menu events
 * #### `makeDefault` - Used the set the default pointer inside a combined pointer
 * #### `cursorModel` - Properties for configuring how the cursor should look
 * #### `radius` - The size of the intersection sphere
 * #### `customSort` - Overrides the default sort function to use for sorting the intersection results
 */
export const DefaultXRHandGrabPointer: (props: DefaultXRInputSourceGrabPointerOptions) => ReactNode =
  DefaultXRInputSourceGrabPointer.bind(null, 'select', 'index-finger-tip')

/**
 * Grab pointer for the XRController
 *
 * @param {DefaultXRInputSourceGrabPointerOptions} props
 * #### `clickThresholdMs` - Time in milliseconds between `pointerdown` and `pointerup` to trigger a click event
 * #### `dblClickThresholdMs` - Time in milliseconds between the first click and the second click to trigger a `dblclick` event
 * #### `contextMenuButton` - The button that triggers context menu events
 * #### `makeDefault` - Used the set the default pointer inside a combined pointer
 * #### `cursorModel` - Properties for configuring how the cursor should look
 * #### `radius` - The size of the intersection sphere
 * #### `customSort` - Overrides the default sort function to use for sorting the intersection results
 */
export const DefaultXRControllerGrabPointer: (props: DefaultXRInputSourceGrabPointerOptions) => ReactNode =
  DefaultXRInputSourceGrabPointer.bind(null, 'squeeze', 'grip-space')

/**
 * Ray pointer for the XRInputSource
 *
 * @param {DefaultXRInputSourceRayPointerOptions} props
 * #### `clickThresholdMs` - Time in milliseconds between pointerdown and pointerup to trigger a click event
 * #### `dblClickThresholdMs` - Time in milliseconds between the first click and the second click to trigger a dblclick event
 * #### `contextMenuButton` - The button that triggers contextmenu events
 * #### `makeDefault` - Used the set the default pointer inside a combined pointer
 * #### `radius` - The size of the intersection sphere
 * #### `minDistance` - Minimal distance to trigger interactions
 * #### `linePoints` - The points thay make up the shape of the ray if undefined the ray goes in a straight line
 * #### `direction` - The direction of the ray
 * #### `rayModel` - Properties for configuring how the ray should look
 * #### `cursorModel` - Properties for configuring how the cursor should look
 */
export function DefaultXRInputSourceRayPointer(props: DefaultXRInputSourceRayPointerOptions) {
  const state = useXRInputSourceStateContext()
  const ref = useRef<Object3D>(null)
  const pointer = useRayPointer(ref, state, props)
  usePointerXRInputSourceEvents(pointer, state.inputSource, 'select', state.events)
  const rayModelOptions = props.rayModel
  const cursorModelOptions = props.cursorModel
  return (
    <XRSpaceImpl ref={ref} space="target-ray-space">
      {rayModelOptions !== false && (
        <PointerRayModel pointer={pointer} opacity={defaultRayPointerOpacity} {...spreadable(rayModelOptions)} />
      )}
      {cursorModelOptions !== false && (
        <PointerCursorModel pointer={pointer} opacity={defaultRayPointerOpacity} {...spreadable(cursorModelOptions)} />
      )}
    </XRSpaceImpl>
  )
}

/**
 * Touch pointer for the XRHand
 *
 * @param {DefaultXRHandTouchPointerOptions} props
 * #### `clickThresholdMs` - Time in milliseconds between `pointerdown` and `pointerup` to trigger a click event
 * #### `dblClickThresholdMs` - Time in milliseconds between the first click and the second click to trigger a `dblclick` event
 * #### `contextMenuButton` - The button that triggers context menu events
 * #### `makeDefault` - Used the set the default pointer inside a combined pointer
 * #### `cursorModel` - Properties for configuring how the cursor should look
 * #### `hoverRadius` - The size of the intersection sphere
 * #### `downRadius` - The distance to the touch center to trigger a `pointerdown` event
 * #### `button` - The id of the button that is triggered when touching
 */
export function DefaultXRHandTouchPointer(props: DefaultXRHandTouchPointerOptions) {
  const state = useXRInputSourceStateContext('hand')
  const ref = useRef<Object3D>(null)
  const pointer = useTouchPointer(ref, state, props)
  const cursorModelOptions = props.cursorModel
  return (
    <XRSpaceImpl ref={ref} space={state.inputSource.hand.get('index-finger-tip')!}>
      {cursorModelOptions !== false && (
        <PointerCursorModel
          pointer={pointer}
          opacity={defaultTouchPointerOpacity}
          {...spreadable(cursorModelOptions)}
        />
      )}
    </XRSpaceImpl>
  )
}

/**
 * Default controller implementation with grab and ray pointers
 *
 * @param {DefaultXRControllerOptions} props
 * #### `model` - Options for configuring the controller apperance
 * #### `grabPointer` - Options for configuring the grab pointer
 * #### `rayPointer` - Options for configuring the ray pointer
 */
export function DefaultXRController(props: DefaultXRControllerOptions) {
  const modelOptions = props.model
  const grabPointerOptions = props.grabPointer
  const rayPointerOptions = props.rayPointer
  const teleportPointerOptions = props.teleportPointer ?? false
  return (
    <>
      {modelOptions !== false && (
        <Suspense>
          <XRControllerModel {...spreadable(modelOptions)} />
        </Suspense>
      )}
      <CombinedPointer>
        {grabPointerOptions !== false && <DefaultXRControllerGrabPointer {...spreadable(grabPointerOptions)} />}
        {rayPointerOptions !== false && (
          <DefaultXRInputSourceRayPointer makeDefault minDistance={0.2} {...spreadable(rayPointerOptions)} />
        )}
        {teleportPointerOptions !== false && (
          <DefaultXRInputSourceTeleportPointer {...spreadable(teleportPointerOptions)} />
        )}
      </CombinedPointer>
    </>
  )
}

/**
 * Default hand implementation with touch, grab and ray pointers
 *
 * @param {DefaultXRHandOptions} props
 * #### `model` - Options for configuring the hand appearance
 * #### `grabPointer` - Options for configuring the grab pointer
 * #### `rayPointer` - Options for configuring the ray pointer
 * #### `touchPointer` - Options for configuring the touch pointer
 */
export function DefaultXRHand(props: DefaultXRHandOptions) {
  const modelOptions = props.model
  const grabPointerOptions = props.grabPointer
  const rayPointerOptions = props.rayPointer
  const touchPointerOptions = props.touchPointer
  const teleportPointerOptions = props.teleportPointer ?? false
  const rayPointerRayModelOptions = rayPointerOptions === false ? false : spreadable(rayPointerOptions)?.rayModel
  return (
    <>
      {modelOptions !== false && (
        <Suspense>
          <XRHandModel {...spreadable(modelOptions)} />
        </Suspense>
      )}
      <CombinedPointer>
        {grabPointerOptions !== false && <DefaultXRHandGrabPointer {...spreadable(grabPointerOptions)} />}
        {touchPointerOptions !== false && <DefaultXRHandTouchPointer {...spreadable(touchPointerOptions)} />}
        {rayPointerOptions !== false && (
          <DefaultXRInputSourceRayPointer
            makeDefault
            minDistance={0.2}
            {...spreadable(rayPointerOptions)}
            rayModel={
              rayPointerRayModelOptions === false ? false : { maxLength: 0.2, ...spreadable(rayPointerRayModelOptions) }
            }
          />
        )}
        {teleportPointerOptions !== false && (
          <DefaultXRInputSourceTeleportPointer {...spreadable(teleportPointerOptions)} />
        )}
      </CombinedPointer>
    </>
  )
}

/**
 * Default transient-pointer implementation with ray pointer
 *
 * @param {DefaultXRTransientPointerOptions} props
 * #### `clickThresholdMs` - Time in milliseconds between `pointerdown` and `pointerup` to trigger a click event
 * #### `dblClickThresholdMs` - Time in milliseconds between the first click and the second click to trigger a `dblclick` event
 * #### `contextMenuButton` - The button that triggers context menu events
 * #### `minDistance` - Minimal distance to trigger interactions
 * #### `linePoints` - The points thay make up the shape of the ray if undefined the ray goes in a straight line
 * #### `direction` - The direction of the ray
 * #### `cursorModel` - Properties for configuring how the cursor should look
 */
export function DefaultXRTransientPointer(props: DefaultXRTransientPointerOptions) {
  return <DefaultXRInputSourceRayPointer {...props} rayModel={false} />
}

/**
 * Default gaze implementation with ray pointer
 *
 * @param {DefaultXRGazeOptions} props
 * #### `clickThresholdMs` - Time in milliseconds between `pointerdown` and `pointerup` to trigger a click event
 * #### `dblClickThresholdMs` - Time in milliseconds between the first click and the second click to trigger a `dblclick` event
 * #### `contextMenuButton` - The button that triggers context menu events
 * #### `minDistance` - Minimal distance to trigger interactions
 * #### `linePoints` - The points thay make up the shape of the ray if undefined the ray goes in a straight line
 * #### `direction` - The direction of the ray
 * #### `cursorModel` - Properties for configuring how the cursor should look
 */
export function DefaultXRGaze(props: DefaultXRGazeOptions) {
  return <DefaultXRInputSourceRayPointer {...props} rayModel={false} />
}

/**
 * Default screen-input implementation with ray pointer
 *
 * @param {DefaultXRScreenInputOptions} props
 * #### `clickThresholdMs` - Time in milliseconds between `pointerdown` and `pointerup` to trigger a click event
 * #### `dblClickThresholdMs` - Time in milliseconds between the first click and the second click to trigger a `dblclick` event
 * #### `contextMenuButton` - The button that triggers context menu events
 * #### `minDistance` - Minimal distance to trigger interactions
 * #### `linePoints` - The points thay make up the shape of the ray if undefined the ray goes in a straight line
 * #### `direction` - The direction of the ray
 */
export function DefaultXRScreenInput(props: DefaultXRScreenInputOptions) {
  return <DefaultXRInputSourceRayPointer {...props} cursorModel={false} rayModel={false} />
}

/**
 * Telport pointer for the XRInputSource.
 * Emits a downward bend ray that only interesects with meshes marked as teleportable
 *
 * @param {DefaultXRInputSourceTeleportPointerOptions} props
 * #### `clickThresholdMs` - Time in milliseconds between `pointerdown` and `pointerup` to trigger a click event
 * #### `dblClickThresholdMs` - Time in milliseconds between the first click and the second click to trigger a `dblclick` event
 * #### `contextMenuButton` - The button that triggers context menu events
 * #### `makeDefault` - Used the set the default pointer inside a combined pointer
 * #### `radius` - The size of the intersection sphere
 * #### `minDistance` - Minimal distance to trigger interactions
 * #### `direction` - The direction of the ray
 * #### `rayModel` - Properties for configuring how the ray should look
 * #### `cursorModel` - Properties for configuring how the cursor should look
 */
export function DefaultXRInputSourceTeleportPointer(props: DefaultXRInputSourceTeleportPointerOptions) {
  const state = useContext(xrInputSourceStateContext)
  if (state == null) {
    throw new Error(`DefaultXRInputSourceRayPointer can only be used inside a XRInputSource`)
  }
  const ref = useRef<Object3D>(null)
  const groupRef = useRef<Group>(null)
  const linePoints = useMemo(() => createTeleportRayLine(), [])
  const pointer = useLinesPointer(
    groupRef,
    state,
    {
      ...props,
      linePoints,
      filter: buildTeleportTargetFilter(props),
    },
    'teleport',
  )
  usePointerXRInputSourceEvents(pointer, state.inputSource, 'select', state.events)
  const rayModelOptions = props.rayModel
  const cursorModelOptions = props.cursorModel
  const scene = useThree((state) => state.scene)
  const cursorRef = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (cursorRef.current != null) {
      cursorRef.current.visible = pointer.getEnabled() && pointer.getButtonsDown().size > 0
    }
    const target = groupRef.current
    const source = ref.current
    if (target == null || source == null) {
      return
    }
    syncTeleportPointerRayGroup(source, target, delta * 1000)
  })
  return (
    <>
      <XRSpaceImpl ref={ref} space="target-ray-space" />
      {createPortal(
        <group ref={groupRef}>
          {rayModelOptions !== false && (
            <TeleportPointerRayModel
              linePoints={linePoints}
              pointer={pointer}
              opacity={defaultRayPointerOpacity}
              {...spreadable(rayModelOptions)}
            />
          )}
          {cursorModelOptions !== false && (
            <PointerCursorModel
              ref={cursorRef}
              pointer={pointer}
              opacity={defaultRayPointerOpacity}
              {...spreadable(cursorModelOptions)}
            />
          )}
        </group>,
        scene,
      )}
    </>
  )
}

function spreadable<T>(value: true | T): T | undefined {
  if (value === true) {
    return undefined
  }
  return value
}
