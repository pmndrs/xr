import * as React from 'react'
import * as THREE from 'three'
import { Object3DNode, extend, createPortal } from '@react-three/fiber'
import { OculusHandModel } from 'three-stdlib'
import { useXR } from './XR'
import { XRController } from './XRController'

class HandModel extends THREE.Group {
  readonly target: XRController

  constructor(target: XRController, modelLeft?: string, modelRight?: string) {
    super()
    this.target = target
    this.add(new OculusHandModel(target.hand, modelLeft, modelRight))

    // Send fake connected event (no-op) so model starts loading
    this.target.hand.dispatchEvent({ type: 'connected', data: this.target.inputSource, fake: true })
  }

  dispose() {
    this.target.hand.dispatchEvent({ type: 'disconnected', data: this.target.inputSource, fake: true })
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      handModel: Object3DNode<HandModel, typeof HandModel>
    }
  }
}

export interface HandsProps {
  modelLeft?: string
  modelRight?: string
}
export function Hands({ modelLeft, modelRight }: HandsProps) {
  const controllers = useXR((state) => state.controllers)
  React.useMemo(() => extend({ HandModel }), [])

  return controllers.map((target) => createPortal(<handModel args={[target, modelLeft, modelRight]} />, target.hand))
}
