import { RootState, useFrame } from '@react-three/fiber'
import { RefObject, useMemo } from 'react'
import { Vector3, Object3D } from 'three'
import {
  type XRControllerLocomotionRotationOptions,
  type XRControllerLocomotionTranslationOptions,
  createXRControllerLocomotionUpdate,
} from '@pmndrs/xr/internals'
import { useXRStore } from './xr.js'

/**
 * A hook for handling basic locomotion in VR
 * @param target Either a `THREE.Group` ref, or a callback function. Recieves movement input (required).
 * @param translationOptions Options that control the translation of the user. Set to `false` to disable.
 * @param translationOptions.speed The speed at which the user moves.
 * @param rotationOptions Options that control the rotation of the user. Set to `false` to disable.
 * @param rotationOptions.deadZone How far the joystick must be pushed to trigger a turn.
 * @param rotationOptions.type Controls how rotation using the controller functions. Can be either 'smooth' or 'snap'.
 * @param rotationOptions.degrees If `type` is 'snap', this specifies the number of degrees to snap the user's view by.
 * @param rotationOptions.speed If `type` is 'smooth', this specifies the speed at which the user's view rotates.
 * @param translationControllerHand Specifies which hand will control the movement. Can be either 'left' or 'right'.
 */
export function useXRControllerLocomotion(
  target:
    | RefObject<Object3D | null>
    | ((velocity: Vector3, rotationVelocityY: number, deltaTime: number, state: RootState, frame?: XRFrame) => void),
  translationOptions: XRControllerLocomotionTranslationOptions = {},
  rotationOptions: XRControllerLocomotionRotationOptions = {},
  translationControllerHand: Exclude<XRHandedness, 'none'> = 'left',
) {
  const store = useXRStore()
  const update = useMemo(() => createXRControllerLocomotionUpdate(), [])
  useFrame((state, delta, frame: XRFrame | undefined) =>
    update(
      typeof target === 'function' ? target : target.current,
      store,
      state.camera,
      delta,
      translationOptions,
      rotationOptions,
      translationControllerHand,
      delta,
      state,
      frame,
    ),
  )
}
