import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useXRControllerState, XROrigin } from '@react-three/xr'

const TURN_SPEED = 1.5,
  THUMBSTICK_X_WIGGLE = 0.5

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
  }) => void
}) {
  const originRef = useRef<THREE.Group>(null)

  const controllerLeft = useXRControllerState('right')
  const controllerRight = useXRControllerState('left')

  useFrame((state, delta) => {
    if (controllerRight != null) {
      const thumbstick = controllerRight.gamepad?.['xr-standard-thumbstick']
      if (originRef.current != null && thumbstick?.xAxis != null && thumbstick.xAxis != 0) {
        originRef.current.rotateY((thumbstick.xAxis < 0 ? 1 : -1) * TURN_SPEED * delta)
      }
    }

    if (controllerLeft?.gamepad?.['a-button']?.state === 'pressed') {
      playerJump?.()
    }

    const thumbstick = controllerLeft?.gamepad['xr-standard-thumbstick']
    if (thumbstick?.xAxis != null && thumbstick.yAxis != null) {
      state.camera.getWorldQuaternion(helpers.quaternion)

      playerMove?.({
        forward: thumbstick.yAxis < 0,
        backward: thumbstick.yAxis > 0,
        left: thumbstick.xAxis < -THUMBSTICK_X_WIGGLE,
        right: thumbstick.xAxis > THUMBSTICK_X_WIGGLE,

        // rotation: state.camera.rotation
        rotation: helpers.euler.setFromQuaternion(helpers.quaternion),
      })
    }
  })

  return <XROrigin ref={originRef} position={[0, -1.25, 0]} />
}
