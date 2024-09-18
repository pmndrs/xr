import { RootState, useFrame } from '@react-three/fiber'
import { RefObject, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Euler, Group, MathUtils, Object3D, Quaternion, Vector3 } from 'three'
import { useXRInputSourceState } from './input'
import { useXR } from './xr.js'

export function useHover(ref: RefObject<Object3D>): boolean

export function useHover(ref: RefObject<Object3D>, onChange: (hover: boolean) => void): void

export function useHover(ref: RefObject<Object3D>, onChange?: (hover: boolean) => void): boolean | undefined {
  let setHover: (hover: boolean) => void
  let hover: boolean | undefined
  if (onChange == null) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [_hover, _setHover] = useState(false)
    setHover = _setHover
    hover = _hover
  } else {
    setHover = onChange
  }
  useEffect(() => {
    const { current } = ref
    if (current == null) {
      return
    }
    const set = new Set<number>()
    const enter = (e: { pointerId: number }) => {
      if (set.size === 0) {
        setHover(true)
      }
      set.add(e.pointerId)
    }
    const leave = (e: { pointerId: number }) => {
      set.delete(e.pointerId)
      if (set.size === 0) {
        setHover(false)
      }
    }
    current.addEventListener('pointerenter', enter as any)
    current.addEventListener('pointerleave', leave as any)
    return () => {
      current.removeEventListener('pointerenter', enter as any)
      current.removeEventListener('pointerleave', leave as any)
    }
  }, [ref, setHover])
  return hover
}

/**
 * hook for getting the session visibility state
 */
export function useXRSessionVisibilityState() {
  return useXR((xr) => xr.visibilityState)
}

/**
 * hook for getting the function to initialize the room capture for scanning the room
 */
export function useInitRoomCapture() {
  return useXR((xr) => xr.session?.initiateRoomCapture?.bind(xr.session))
}

/**
 * hook for checking if a session mode is supported
 * @param onError callback executed when an error happens while checking if the session mode is supported
 */
export function useSessionModeSupported(mode: XRSessionMode, onError?: (error: any) => void) {
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const [subscribe, getSnapshot] = useMemo(() => {
    let sessionSupported: boolean | undefined = undefined
    return [
      (onChange: () => void) => {
        let canceled = false
        if (navigator.xr == null) {
          sessionSupported = false
          return () => { }
        }

        navigator.xr
          .isSessionSupported(mode)
          .then((isSupported) => {
            sessionSupported = isSupported
            if (canceled) {
              return
            }
            onChange()
          })
          .catch((e) => {
            if (canceled) {
              return
            }
            onErrorRef.current?.(e)
          })
        return () => (canceled = true)
      },
      () => sessionSupported,
    ]
  }, [mode])
  return useSyncExternalStore(subscribe, getSnapshot)
}

export function useSessionFeatureEnabled(feature: string) {
  return useXR(({ session }) => session?.enabledFeatures?.includes(feature) ?? false)
}

export interface ControllerLocomotionTranslationOptions {
  speed?: number
}
export type ControllerLocomotionRotationOptions = {
  viewControlDeadZone?: number
  disableControllerBasedRotation?: boolean
} & ({ rotationType?: 'snap'; degrees?: number } | { rotationType?: 'smooth'; speed?: number })

// useControllerLocomotion defaults and constants
const defaultSpeed = 2
const defaultSmoothTurningSpeed = 2
const defaultDisableControllerBasedRotation = false
const defaultRotationType = 'snap'
const defaultNumberOfDegreesToSnapBy = 45
const defaultHandControllingMovement = 'left'
const defaultViewControlDeadZone = 0.5
const thumbstickPropName = 'xr-standard-thumbstick'

/**
 * A hook for handling basic locomotion in VR
 * @param {RefObject<Group> | ((velocity: Vector3, rotationVelocity: Euler, deltaTime: number, state: RootState, frame?: XRFrame) => void)} target Either a `THREE.Group` ref, or a callback function. Recieves movement input (required).
 * @param {Object} translationOptions Options that control the translation of the user.
 * @param {Object} translationOptions.speed The speed at which the user moves.
 * @param {Object} rotationOptions Options that control the rotation of the user.
 * @param {Object} rotationOptions.viewControlDeadZone How far the joystick must be pushed to trigger a turn. 
 * @param {Object} rotationOptions.disableControllerBasedRotation Disables rotation using the controller.
 * @param {Object} rotationOptions.rotationType Controls how rotation using the controller functions. Can be either 'smooth' or 'snap'.
 * @param {Object} rotationOptions.degrees If `rotationType` is 'snap', this specifies the number of degrees to snap the user's view by.
 * @param {Object} rotationOptions.speed If `rotationType` is 'smooth', this specifies the speed at which the user's view rotates.
 * @param {XRHandedness} movementController Specifies which hand will control the movement. Can be either 'left' or 'right'.
 */
export function useControllerLocomotion(
  target:
    | RefObject<Group>
    | ((velocity: Vector3, rotationVelocity: Euler, deltaTime: number, state: RootState, frame?: XRFrame) => void),
  translationOptions?: ControllerLocomotionTranslationOptions,
  rotationOptions?: ControllerLocomotionRotationOptions,
  movementController?: XRHandedness,
) {
  // Assign default values to options that are not provided
  const safeMovementController = movementController ?? defaultHandControllingMovement
  const { speed = defaultSpeed } = translationOptions || {}
  const {
    viewControlDeadZone = defaultViewControlDeadZone,
    rotationType = defaultRotationType,
    disableControllerBasedRotation = defaultDisableControllerBasedRotation,
  } = rotationOptions || {}

  // Get either the speed or the degrees based on the rotationType
  let rotationAmount: number = defaultNumberOfDegreesToSnapBy
  if (rotationOptions?.rotationType === 'snap') {
    rotationAmount = rotationOptions?.degrees ?? defaultNumberOfDegreesToSnapBy
  } else if (rotationOptions?.rotationType === 'smooth') {
    rotationAmount = rotationOptions?.speed ?? defaultSmoothTurningSpeed
  }

  const canRotate = useRef(true)
  const localPositionRef = useRef<Group>(new Group())
  const positionInfo = typeof target === 'object' ? target : localPositionRef

  const l_controller = useXRInputSourceState('controller', 'left')
  const r_controller = useXRInputSourceState('controller', 'right')

  const resolvedMovementController = safeMovementController === 'left' ? l_controller : r_controller
  const viewController = safeMovementController === 'left' ? r_controller : l_controller

  const upVector = new Vector3(0, 1, 0)
  const inputVector = new Vector3()
  const cameraQuaternion = new Quaternion()
  const rotationQuaternion: Quaternion = new Quaternion()

  useFrame((state, delta, frame) => {
    if (movementController === 'none') return
    if (positionInfo.current == null || resolvedMovementController == null || viewController == null) return

    const movementThumbstickState = resolvedMovementController.gamepad[thumbstickPropName]

    const movementXAxisOrDefault = movementThumbstickState?.xAxis ?? 0
    const movementYAxisOrDefault = movementThumbstickState?.yAxis ?? 0

    const viewThumbstickState = viewController.gamepad[thumbstickPropName]
    const viewXAxisOrDefault = viewThumbstickState?.xAxis ?? 0

    // If no joystick input, return
    if (movementXAxisOrDefault === 0 && movementYAxisOrDefault === 0 && viewXAxisOrDefault === 0) return

    // Handle snapping rotation using the viewController
    let rotationQuaternionUpdated = null
    if (!disableControllerBasedRotation) {
      if (rotationType === 'snap') {
        if (viewXAxisOrDefault < -viewControlDeadZone && canRotate.current) {
          canRotate.current = false
          rotationQuaternion.identity().setFromAxisAngle(upVector, MathUtils.degToRad(rotationAmount))
          positionInfo.current.quaternion.multiply(rotationQuaternion)
          rotationQuaternionUpdated = true
        } else if (viewXAxisOrDefault > viewControlDeadZone && canRotate.current) {
          canRotate.current = false
          rotationQuaternion.identity().setFromAxisAngle(upVector, -MathUtils.degToRad(rotationAmount))
          positionInfo.current.quaternion.multiply(rotationQuaternion)
          rotationQuaternionUpdated = true
        } else if (viewXAxisOrDefault > -viewControlDeadZone && viewXAxisOrDefault < viewControlDeadZone) {
          canRotate.current = true
        }
      } else if (rotationType === 'smooth') {
        if (Math.abs(viewXAxisOrDefault) > viewControlDeadZone) {
          positionInfo.current.rotateY((viewXAxisOrDefault < 0 ? 1 : -1) * delta * rotationAmount)
        }
      }
    }

    // Handle movement using the movementController
    inputVector.set(movementXAxisOrDefault * speed, 0, movementYAxisOrDefault * speed)
    state.camera.getWorldQuaternion(cameraQuaternion)
    inputVector.applyQuaternion(cameraQuaternion)

    if (rotationQuaternionUpdated) {
      inputVector.applyQuaternion(rotationQuaternion)
    }

    if (typeof target === 'function') {
      target(inputVector, positionInfo.current.rotation, delta, state, frame)
      return
    }

    let xChange = positionInfo.current.position.x
    let zChange = positionInfo.current.position.z

    if (inputVector.x !== 0) {
      xChange += inputVector.x * delta
    }

    if (inputVector.z !== 0) {
      zChange += inputVector.z * delta
    }

    if (xChange !== positionInfo.current.position.x || zChange !== positionInfo.current.position.z) {
      positionInfo.current.position.x = xChange
      positionInfo.current.position.z = zChange
    }
  })
}
