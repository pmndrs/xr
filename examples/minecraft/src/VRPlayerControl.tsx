import { useFrame } from '@react-three/fiber'
import { Vector3Object } from '@react-three/rapier'
import { useControllerLocomotion, useXRInputSourceState, XROrigin } from '@react-three/xr'
import * as THREE from 'three'

export function VRPlayerControl({
  playerJump,
  playerMove,
}: {
  playerJump?: () => void
  playerMove: (params: {
    forward: boolean
    backward: boolean
    left: boolean
    right: boolean
    rotationVelocity: number
    velocity?: Vector3Object
    newVelocity?: THREE.Vector3
  }) => void
}) {
  const controllerRight = useXRInputSourceState('controller', 'right')

  const physicsMove = (velocity: THREE.Vector3, rotationVelocity: number) => {
    playerMove({
      forward: false,
      backward: false,
      left: false,
      right: false,
      rotationVelocity,
      velocity: undefined,
      newVelocity: velocity,
    })
  }

  useControllerLocomotion(physicsMove, { speed: 5 })

  useFrame(() => {
    if (controllerRight?.gamepad?.['a-button']?.state === 'pressed') {
      playerJump?.()
    }
  })

  return <XROrigin position={[0, -1.25, 0]} />
}
