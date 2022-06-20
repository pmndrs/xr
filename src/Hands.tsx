import * as React from 'react'
import { useThree } from '@react-three/fiber'
import { OculusHandModel } from 'three-stdlib'
import { useXR } from './XR'

export interface HandsProps {
  modelLeft?: string
  modelRight?: string
}
export function Hands(props: HandsProps) {
  const scene = useThree((state) => state.scene)
  const gl = useThree((state) => state.gl)
  const controllers = useXR((state) => state.controllers)

  React.useEffect(() => {
    controllers.forEach(({ hand, inputSource }) => {
      const handModel = hand.children.find((child) => child instanceof OculusHandModel) as OculusHandModel | undefined
      if (handModel) {
        hand.remove(handModel)
        handModel.dispose()
      }

      hand.add(new OculusHandModel(hand, props.modelLeft, props.modelRight))

      // throwing fake event for the Oculus Hand Model so it starts loading
      hand.dispatchEvent({ type: 'connected', data: inputSource, fake: true })
    })

    return () => {
      controllers.forEach(({ hand }) => {
        const handModel = hand.children.find((child) => child instanceof OculusHandModel) as OculusHandModel | undefined
        if (handModel) {
          hand.remove(handModel)
          handModel.dispose()
        }
      })
    }
  }, [scene, gl, controllers, props.modelLeft, props.modelRight])

  return null
}
