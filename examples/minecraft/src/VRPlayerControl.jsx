import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useXRControllerState, XROrigin } from '@react-three/xr'

const
  TURN_SPEED = 1.5,
  THUMBSTICK_X_WIGGLE = 0.5

const helpers = {
  euler: new THREE.Euler(),
  quaternion: new THREE.Quaternion()
}

export function VRPlayerControl({ playerJump, playerMove }) {
  const ref_xr = useRef()

  const
    controller_left = useXRControllerState('left'),
    controller_right = useXRControllerState('right')

  let gamepad_info = {
    connected_right: false,
    connected_left: false,
    thumbstick_left: null,
    thumbstick_right: null,
    a_button: null
  }

  useEffect(() => {
    if (controller_left && controller_left.gamepad) {
      gamepad_info.connected_left = true
      gamepad_info.thumbstick_left = controller_left.gamepad['xr-standard-thumbstick']
    }
    else {
      gamepad_info.connected_left = false
    }

    if (controller_right && controller_right.gamepad) {
      gamepad_info.connected_right = true
      gamepad_info.thumbstick_right = controller_right.gamepad['xr-standard-thumbstick']
      gamepad_info.a_button = controller_right.gamepad['a-button']
    }
    else {
      gamepad_info.connected_right = false
    }
  }, [controller_left, controller_right])

  useFrame((state, delta) => {
    if (playerJump && gamepad_info.connected_right) {
      if (gamepad_info.a_button.state === 'pressed') {
        playerJump()
      }

      if (ref_xr.current && gamepad_info.thumbstick_right.xAxis != 0) {
        if (gamepad_info.thumbstick_right.xAxis < 0) {
          ref_xr.current.rotateY(TURN_SPEED * delta)
        }
        else if (gamepad_info.thumbstick_right.xAxis > 0) {
          ref_xr.current.rotateY(-TURN_SPEED * delta)
        }
      }
    }

    if (playerMove && gamepad_info.connected_left) {
      state.camera.getWorldQuaternion(helpers.quaternion)

      playerMove({
        forward: gamepad_info.thumbstick_left.yAxis < 0,
        backward: gamepad_info.thumbstick_left.yAxis > 0,
        left: gamepad_info.thumbstick_left.xAxis < -THUMBSTICK_X_WIGGLE,
        right: gamepad_info.thumbstick_left.xAxis > THUMBSTICK_X_WIGGLE,

        // rotation: state.camera.rotation
        rotation: helpers.euler.setFromQuaternion(helpers.quaternion)
      })
    }
  })

  return <XROrigin
    ref={ref_xr}
    position={[0, -1.75, 0]}
  />
}
