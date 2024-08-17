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

  const controllerLeft = useXRControllerState('left')
  const controllerRight = useXRControllerState('right')

  useFrame((state, delta) => {
    const thumbstickRight = controllerRight?.gamepad?.['xr-standard-thumbstick']
    if (originRef.current != null && thumbstickRight?.xAxis != null && thumbstickRight.xAxis != 0) {
      originRef.current.rotateY((thumbstickRight.xAxis < 0 ? 1 : -1) * TURN_SPEED * delta)
    }

    if (controllerRight?.gamepad?.['a-button']?.state === 'pressed') {
      playerJump?.()
    }

    const thumbstickLeft = controllerLeft?.gamepad['xr-standard-thumbstick']
    if (thumbstickLeft?.xAxis != null && thumbstickLeft.yAxis != null) {
      state.camera.getWorldQuaternion(helpers.quaternion)

      playerMove?.({
        forward: thumbstickLeft.yAxis < 0,
        backward: thumbstickLeft.yAxis > 0,
        left: thumbstickLeft.xAxis < -THUMBSTICK_X_WIGGLE,
        right: thumbstickLeft.xAxis > THUMBSTICK_X_WIGGLE,

        // rotation: state.camera.rotation
        rotation: helpers.euler.setFromQuaternion(helpers.quaternion),
      })
    }
  })

  return <XROrigin ref={originRef} position={[0, -1.25, 0]} />
}
