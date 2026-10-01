import {
  type XRControllerLocomotionRotationOptions,
  type XRControllerLocomotionTranslationOptions,
  createXRControllerLocomotionUpdate,
} from '@pmndrs/xr/internals'
import { RootState, useFrame } from '@react-three/fiber'
import { RefObject, useMemo } from 'react'
import { Object3D, Vector3 } from 'three'
import { useXRStore } from './xr.js'

/**
 * A hook for handling basic locomotion in VR
 * @param target Either a `THREE.Group` ref, or a callback function. Recieves movement input (required).
 * @param translationOptions Options that control the translation of the user. Set to `false` to disable.
 *
 * #### `translationOptions.speed` - The speed at which the user moves.
 *
 * @param rotationOptions Options that control the rotation of the user. Set to `false` to disable.
 *
 * #### `rotationOptions.deadZone` - How far the joystick must be pushed to trigger a turn.
 * #### `rotationOptions.type` - Controls how rotation using the controller functions. Can be either 'smooth' or 'snap'.
 * #### `rotationOptions.degrees` - If `type` is 'snap', this specifies the number of degrees to snap the user's view by.
 * #### `rotationOptions.speed` - If `type` is 'smooth', this specifies the speed at which the user's view rotates.
 *
 * @param translationControllerHand Specifies which hand will control the movement. Can be either 'left' or 'right'.
 * @example 
 * // Example showing basic usage
 * export const userMovement = () => {
 *   const originRef = useRef<THREE.Group>(null);
 *   useXRControllerLocomotion(originRef);
 *   return <XROrigin ref={originRef} />
 * }
 *
 * // Example using rapier physics
 * export const userMovementWithPhysics = () => {
 *   const userRigidBodyRef = useRef<RapierRigidBody>(null);
 *
 *   const userMove = (inputVector: Vector3, rotationInfo: Euler) => {
 *   if (userRigidBodyRef.current) {
 *      const currentLinvel = userRigidBodyRef.current.linvel()
 *      const newLinvel = { x: inputVector.x, y: currentLinvel.y, z: inputVector.z }
 *      userRigidBodyRef.current.setLinvel(newLinvel, true)
 *      userRigidBodyRef.current.setRotation(new Quaternion().setFromEuler(rotationInfo), true)
 *    }
 *  }

 *  useXRControllerLocomotion(userMove)

 *  return <>
 *    <RigidBody
 *      ref={userRigidBodyRef}
 *      colliders={false}
 *      type='dynamic'
 *      position={[0, 2, 0]}
 *      enabledRotations={[false, false, false]}
 *      canSleep={false}
 *    >
 *      <CapsuleCollider args={[.3, .5]} />
 *      <XROrigin position={[0, -1, 0]} />
 *    </RigidBody>
 *  </>
 * } 
 * 
 * @see {@link https://pmndrs.github.io/xr/examples/minecraft/ | demo}
 * @see {@link https://github.com/pmndrs/xr/blob/main/examples/minecraft/src/VRPlayerControl.tsx | source for demo}
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
