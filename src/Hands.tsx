import * as React from 'react'
import { Object3DNode, extend, createPortal } from '@react-three/fiber'
import { OculusHandModel } from './OculusHandModel'
import { useXR } from './XR'
import { useIsomorphicLayoutEffect } from './utils'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      oculusHandModel: Object3DNode<OculusHandModel, typeof OculusHandModel>
    }
  }
}

export interface HandsProps {
  modelLeft?: string
  modelRight?: string
}
export function Hands({ modelLeft, modelRight }: HandsProps) {
  const controllers = useXR((state) => state.controllers)
  React.useMemo(() => extend({ OculusHandModel }), [])

  // Send fake connected event (no-op) so models start loading
  useIsomorphicLayoutEffect(() => {
    for (const target of controllers) {
      target.hand.dispatchEvent({ type: 'connected', data: target.inputSource, fake: true })
    }
  }, [controllers, modelLeft, modelRight])

  return <>{controllers.map(({ hand }) => createPortal(<oculusHandModel args={[hand, modelLeft, modelRight]} />, hand))}</>
}
