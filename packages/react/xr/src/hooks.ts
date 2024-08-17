import { useFrame, useThree } from '@react-three/fiber'
import { RefObject, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Group, MathUtils, Object3D, Quaternion, Vector3 } from 'three'
import { useXRControllerState } from './controller'
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
          return () => {}
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

export interface LocomotionOptions {
  handControllingMovement?: 'left' | 'right'
  speed?: number
  numberOfDegreesToSnapTurnBy?: number
  snapTurningDeadZone?: number
  disableSnapTurning?: boolean
}

/**
 * A hook for handling basic locomotion in VR
 * @param options Options that can be provided to customize the locomotion behavior
 * @returns A ref to be assigned to the <XROrigin> component (i.e. <XROrigin ref={locomotionRef}>)
 */
export function useLocomotion(options?: LocomotionOptions) {
  const defaultSpeed = 1;
  const defaultNumberOfDegreesToSnapTurnBy = 45;
  const defaultHandControllingMovement = 'left';
  const defaultSnapTurningDeadZone = 0.5;
  const thumbstickPropName = 'xr-standard-thumbstick';
  const cameraQuaternion = new Quaternion();

  // Assign default values to options that are not provided
  const { handControllingMovement = defaultHandControllingMovement, speed = defaultSpeed, numberOfDegreesToSnapTurnBy = defaultNumberOfDegreesToSnapTurnBy,
    snapTurningDeadZone = defaultSnapTurningDeadZone, disableSnapTurning } = options || {};

  const positionInfo = useRef<Group>(null);
  const canRotate = useRef(true);
  const camera = useThree((s) => s.camera);

  const l_controller = useXRControllerState("left");
  const r_controller = useXRControllerState("right");
  const movementController = handControllingMovement === 'left' ? l_controller : r_controller;
  const viewController = handControllingMovement === 'left' ? r_controller : l_controller;

  useFrame((_, delta) => {
    if (positionInfo.current == null || movementController == null || viewController == null) return;

    const movementThumbstickState = movementController.gamepad[thumbstickPropName];

    const movementXAxisOrDefault = movementThumbstickState?.xAxis ?? 0;
    const movementYAxisOrDefault = movementThumbstickState?.yAxis ?? 0;

    const viewThumbstickState = viewController.gamepad[thumbstickPropName];
    const viewXAxisOrDefault = viewThumbstickState?.xAxis ?? 0;

    // If no joystick input, return
    if (movementXAxisOrDefault === 0 && movementYAxisOrDefault === 0 && viewXAxisOrDefault === 0) return

    // Handle snapping rotation using the viewController
    let rotationQuaternion = null;
    if (!disableSnapTurning) {
      if (viewXAxisOrDefault < -snapTurningDeadZone && canRotate.current) {
        canRotate.current = false;
        rotationQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(numberOfDegreesToSnapTurnBy));
        positionInfo.current.quaternion.multiply(rotationQuaternion);
      }
      else if (viewXAxisOrDefault > snapTurningDeadZone && canRotate.current) {
        canRotate.current = false;
        rotationQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -MathUtils.degToRad(numberOfDegreesToSnapTurnBy));
        positionInfo.current.quaternion.multiply(rotationQuaternion);
      }
      else if (viewXAxisOrDefault > -snapTurningDeadZone && viewXAxisOrDefault < snapTurningDeadZone) {
        canRotate.current = true;
      }
    }

    // Handle movement using the movementController
    const inputVector = new Vector3(movementXAxisOrDefault, 0, movementYAxisOrDefault)
    camera.getWorldQuaternion(cameraQuaternion);
    inputVector.applyQuaternion(cameraQuaternion);

    if (rotationQuaternion) {
      inputVector.applyQuaternion(rotationQuaternion);
    }

    let xChange = positionInfo.current.position.x;
    let zChange = positionInfo.current.position.z;

    if (inputVector.x !== 0) {
      xChange += (inputVector.x) * delta * speed;
    }

    if (inputVector.z !== 0) {
      zChange += (inputVector.z) * delta * speed;
    }

    if (xChange !== positionInfo.current.position.x || zChange !== positionInfo.current.position.z) {
      positionInfo.current.position.x = xChange;
      positionInfo.current.position.z = zChange;
    }
  })

  return positionInfo;
}

