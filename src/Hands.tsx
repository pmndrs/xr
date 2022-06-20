import * as React from 'react'
import { createPortal } from '@react-three/fiber'
import { OculusHandModel } from 'three-stdlib'
import { useXR } from './XR'

export interface HandsProps {
  modelLeft?: string
  modelRight?: string
}
export function Hands({ modelLeft, modelRight }: HandsProps) {
  const controllers = useXR((state) => state.controllers)
  const [handModels, setHandModels] = React.useState<OculusHandModel[]>([])

  // Dispatch fake connected event to start loading models on mount
  React.useEffect(() => {
    const hands = controllers.map((controller) => {
      const handModel = new OculusHandModel(controller.hand, modelLeft, modelRight)
      setHandModels((entries) => [...entries, handModel])
      controller.hand.dispatchEvent({ type: 'connected', data: controller.inputSource, fake: true })

      return () => setHandModels((entries) => entries.filter((entry) => entry !== handModel))
    })

    return () => hands.forEach((cleanup) => cleanup())
  }, [controllers, modelLeft, modelRight])

  return handModels.map((model, i) => createPortal(<primitive object={model} />, controllers[i].hand))
}
