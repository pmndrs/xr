import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

import { HandModel } from './webxr/HandModel.js'
import { useXR } from './XR'

export function Hands(props: {
    modelLeft?:string
    modelRight?:string
  }) {
  const { scene, gl } = useThree()
  const { controllers } = useXR()

  useEffect(() => {
    controllers.forEach(({ hand, inputSource }) => {
      if (hand.children.length === 0) {
        hand.add(new HandModel(hand,[props.modelLeft,props.modelRight]))

        // throwing fake event for the Oculus Hand Model so it starts loading
        hand.dispatchEvent({ type: 'connected', data: inputSource, fake: true })
      }
    })
  }, [scene, gl, controllers])

  return null
}
