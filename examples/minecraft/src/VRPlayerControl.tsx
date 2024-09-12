import { useFrame } from '@react-three/fiber'
import { Vector3Object } from '@react-three/rapier'
import { useControllerLocomotion, useXRInputSourceState, XROrigin } from '@react-three/xr'
import * as THREE from 'three'

const helpers = {
  euler: new THREE.Euler(),
  quaternion: new THREE.Quaternion(),
}

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
    rotation: THREE.Euler
    velocity?: Vector3Object
    newVelocity?: THREE.Vector3
  }) => void
}) {
  const controllerRight = useXRInputSourceState('controller', 'right')

  const physicsMove = (velocity: THREE.Vector3) => {
    playerMove({
      forward: false,
      backward: false,
      left: false,
      right: false,
      rotation: helpers.euler,
      velocity: undefined,
      newVelocity: velocity,
    })
  }

  const originRef = useControllerLocomotion({ motionCallback: physicsMove, speed: 5, disableRefTranslation: true })

  useFrame(() => {
    if (controllerRight?.gamepad?.['a-button']?.state === 'pressed') {
      playerJump?.()
    }
  })

  return <XROrigin ref={originRef} position={[0, -1.25, 0]} />
}
