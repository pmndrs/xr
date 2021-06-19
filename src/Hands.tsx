import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

import { OculusHandModel } from './webxr/OculusHandModel.js'
import { useXR } from './XR'

export function Hands() {
  const { scene, gl } = useThree()
  const { controllers } = useXR()

  useEffect(() => {
    controllers.forEach(({ hand, inputSource }) => {
      if (hand.children.length === 0) {
        hand.add(new OculusHandModel(hand))

        // throwing fake event for the Oculus Hand Model so it starts loading
        hand.dispatchEvent({ type: 'connected', data: inputSource, fake: true })
      }
    })
  }, [scene, gl, controllers])

  return null
}
