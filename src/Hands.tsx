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
  const handModels = React.useMemo(
    () => controllers.map(({ hand }) => [hand, new OculusHandModel(hand, modelLeft, modelRight)]),
    [controllers, modelLeft, modelRight]
  )

  // Dispatch fake connected event to start loading models on mount
  React.useEffect(
    () => void controllers.forEach(({ hand, inputSource }) => hand.dispatchEvent({ type: 'connected', data: inputSource, fake: true })),
    [controllers]
  )

  return handModels.map(([hand, model], i) => (
    <React.Fragment key={`hand-${i}`}>{createPortal(<primitive object={model} />, hand)}</React.Fragment>
  ))
}
