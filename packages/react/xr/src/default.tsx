import {
  defaultGrabPointerOpacity,
  defaultRayPointerOpacity,
  defaultTouchPointerOpacity,
  DefaultXRInputSourceGrabPointerOptions,
  DefaultXRInputSourceRayPointerOptions,
  DefaultXRControllerOptions,
  DefaultXRGazeOptions,
  DefaultXRHandOptions,
  DefaultXRHandTouchPointerOptions,
  DefaultXRScreenInputOptions,
  DefaultXRTransientPointerOptions,
  DefaultXRInputSourceTeleportPointerOptions,
  createTeleportRayLine,
  syncTeleportPointerRayGroup,
  buildTeleportTargetFilter,
} from '@pmndrs/xr/internals'
import { useRef, Suspense, useContext, useMemo } from 'react'
import { Group, Mesh, Object3D } from 'three'
import { XRControllerModel } from './controller.js'
import { XRHandModel } from './hand.js'
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
import { xrInputSourceStateContext } from './contexts.js'
import { TeleportPointerRayModel } from './teleport.js'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useXRInputSourceStateContext } from './input.js'

export {
  type DefaultXRControllerOptions,
  type DefaultXRGazeOptions,
  type DefaultXRHandOptions,
  type DefaultXRHandTouchPointerOptions,
  type DefaultXRInputSourceGrabPointerOptions,
  type DefaultXRInputSourceRayPointerOptions,
  type DefaultXRScreenInputOptions,
  type DefaultXRTransientPointerOptions,
  defaultGrabPointerOpacity,
  defaultRayPointerOpacity,
  defaultTouchPointerOpacity,
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
 * grab pointer for the XRHand
 *
 * properties
 * - `clickThesholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
 * - `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
 * - `contextMenuButton` the button that triggers contextmenu events
 * - `makeDefault` used the set the default pointer inside a combined pointer
 * - `cursorModel` properties for configuring how the cursor should look
 * - `radius` the size of the intersection sphere
 */
export const DefaultXRHandGrabPointer = DefaultXRInputSourceGrabPointer.bind(null, 'select', 'index-finger-tip')

/**
 * grab pointer for the XRController
 *
 * properties
 * - `clickThesholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
 * - `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
 * - `contextMenuButton` the button that triggers contextmenu events
 * - `makeDefault` used the set the default pointer inside a combined pointer
 * - `cursorModel` properties for configuring how the cursor should look
 * - `radius` the size of the intersection sphere
 */
export const DefaultXRControllerGrabPointer = DefaultXRInputSourceGrabPointer.bind(null, 'squeeze', 'grip-space')

/**
 * ray pointer for the XRInputSource
 *
 * properties
 * - `clickThesholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
 * - `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
 * - `contextMenuButton` the button that triggers contextmenu events
 * - `makeDefault` used the set the default pointer inside a combined pointer
 * - `radius` the size of the intersection sphere
 * - `minDistance` minimal distance to trigger interactions
 * - `linePoints` the points thay make up the shape of the ray if undefined the ray goes in a straight line
 * - `direction` the direction of the ray
 * - `rayModel` properties for configuring how the ray should look
 * - `cursorModel` properties for configuring how the cursor should look
 */
export function DefaultXRInputSourceRayPointer(options: DefaultXRInputSourceRayPointerOptions) {
  const state = useXRInputSourceStateContext()
  const ref = useRef<Object3D>(null)
  const pointer = useRayPointer(ref, state, options)
  usePointerXRInputSourceEvents(pointer, state.inputSource, 'select', state.events)
  const rayModelOptions = options.rayModel
  const cursorModelOptions = options.cursorModel
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
 * touch pointer for the XRHand
 *
 * properties
 * - `clickThesholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
 * - `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
 * - `contextMenuButton` the button that triggers contextmenu events
 * - `makeDefault` used the set the default pointer inside a combined pointer
 * - `cursorModel` properties for configuring how the cursor should look
 * - `hoverRadius` the size of the intersection sphere
 * - `downRadius` the distance to the touch center to trigger a pointerdown event
 * - `button` the id of the button that is triggered when touching
 */
export function DefaultXRHandTouchPointer(options: DefaultXRHandTouchPointerOptions) {
  const state = useXRInputSourceStateContext('hand')
  const ref = useRef<Object3D>(null)
  const pointer = useTouchPointer(ref, state, options)
  const cursorModelOptions = options.cursorModel
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
 * default controller implementation with grab and ray pointers
 *
 * properties
 * - `model` options for configuring the controller apperance
 * - `grabPointer` options for configuring the grab pointer
 * - `rayPointer` options for configuring the ray pointer
 */
export function DefaultXRController(options: DefaultXRControllerOptions) {
  const modelOptions = options.model
  const grabPointerOptions = options.grabPointer
  const rayPointerOptions = options.rayPointer
  const teleportPointerOptions = options.teleportPointer ?? false
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
 * default hand implementation with touch, grab and ray pointers
 *
 * properties
 * - `model` options for configuring the hand appearance
 * - `grabPointer` options for configuring the grab pointer
 * - `rayPointer` options for configuring the ray pointer
 * - `touchPointer` options for configuring the touch pointer
 */
export function DefaultXRHand(options: DefaultXRHandOptions) {
  const modelOptions = options.model
  const grabPointerOptions = options.grabPointer
  const rayPointerOptions = options.rayPointer
  const touchPointerOptions = options.touchPointer
  const teleportPointerOptions = options.teleportPointer ?? false
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
 * default transient-pointer implementation with ray pointer
 *
 * properties
 * - `clickThesholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
 * - `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
 * - `contextMenuButton` the button that triggers contextmenu events
 * - `minDistance` minimal distance to trigger interactions
 * - `linePoints` the points thay make up the shape of the ray if undefined the ray goes in a straight line
 * - `direction` the direction of the ray
 * - `cursorModel` properties for configuring how the cursor should look
 */
export function DefaultXRTransientPointer(options: DefaultXRTransientPointerOptions) {
  return <DefaultXRInputSourceRayPointer {...options} rayModel={false} />
}

/**
 * default gaze implementation with ray pointer
 *
 * properties
 * - `clickThesholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
 * - `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
 * - `contextMenuButton` the button that triggers contextmenu events
 * - `minDistance` minimal distance to trigger interactions
 * - `linePoints` the points thay make up the shape of the ray if undefined the ray goes in a straight line
 * - `direction` the direction of the ray
 * - `cursorModel` properties for configuring how the cursor should look
 */
export function DefaultXRGaze(options: DefaultXRGazeOptions) {
  return <DefaultXRInputSourceRayPointer {...options} rayModel={false} />
}

/**
 * default screen-input implementation with ray pointer
 *
 * properties
 * - `clickThesholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
 * - `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
 * - `contextMenuButton` the button that triggers contextmenu events
 * - `minDistance` minimal distance to trigger interactions
 * - `linePoints` the points thay make up the shape of the ray if undefined the ray goes in a straight line
 * - `direction` the direction of the ray
 */
export function DefaultXRScreenInput(options: DefaultXRScreenInputOptions) {
  return <DefaultXRInputSourceRayPointer {...options} cursorModel={false} rayModel={false} />
}

/**
 * telport pointer for the XRInputSource
 * emits a downwards bend ray that only interesects with meshes marked as teleportable
 *
 * properties
 * - `clickThesholdMs` time in milliseconds between pointerdown and pointerup to trigger a click event
 * - `dblClickThresholdMs` time in milliseconds between the first click and the second click to trigger a dblclick event
 * - `contextMenuButton` the button that triggers contextmenu events
 * - `makeDefault` used the set the default pointer inside a combined pointer
 * - `radius` the size of the intersection sphere
 * - `minDistance` minimal distance to trigger interactions
 * - `direction` the direction of the ray
 * - `rayModel` properties for configuring how the ray should look
 * - `cursorModel` properties for configuring how the cursor should look
 */
export function DefaultXRInputSourceTeleportPointer(options: DefaultXRInputSourceTeleportPointerOptions) {
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
      ...options,
      linePoints,
      filter: buildTeleportTargetFilter(options),
    },
    'teleport',
  )
  usePointerXRInputSourceEvents(pointer, state.inputSource, 'select', state.events)
  const rayModelOptions = options.rayModel
  const cursorModelOptions = options.cursorModel
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
