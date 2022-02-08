import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

import { HandModel } from './webxr/HandModel.js'
import { useXR } from './XR'

export function Hands(props: { modelLeft?: string; modelRight?: string }) {
  const { scene, gl } = useThree()
  const { controllers } = useXR()

  useEffect(() => {
    controllers.forEach(({ hand, inputSource }) => {
      const handModel = hand.children.find((child) => child instanceof HandModel) as HandModel | undefined
      if (handModel) {
        hand.remove(handModel)
        handModel.dispose()
      }

      hand.add(new HandModel(hand, [props.modelLeft, props.modelRight]))

      // throwing fake event for the Oculus Hand Model so it starts loading
      hand.dispatchEvent({ type: 'connected', data: inputSource, fake: true })
    })

    return () => {
      controllers.forEach(({ hand }) => {
        const handModel = hand.children.find((child) => child instanceof HandModel) as HandModel | undefined
        if (handModel) {
          hand.remove(handModel)
          handModel.dispose()
        }
      })
    }
  }, [scene, gl, controllers, props.modelLeft, props.modelRight])

  return null
}
