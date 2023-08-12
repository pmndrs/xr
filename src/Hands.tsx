import * as React from 'react'
import { Object3DNode, extend, createPortal } from '@react-three/fiber'
import { useXR } from './XR'
import { XRController } from './XRController'
import { XRControllerModelFactory } from './XRControllerModelFactory'
import { XRHandModel } from './XRHandModel'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      xRHandModel: Object3DNode<XRHandModel, typeof XRHandModel>
    }
  }
}

const modelFactory = new XRControllerModelFactory()

const HandModel = ({ target, modelPath }: { target: XRController; modelPath?: string }) => {
  const handleHandModel = React.useCallback(
    (xrHandModel: XRHandModel | null) => {
      if (xrHandModel) {
        target.xrHandModel = xrHandModel
        if (!target.inputSource?.hand) {
          return
        }
        if (target.inputSource) {
          modelFactory.initializeControllerModel(xrHandModel, target.inputSource)
        } else {
          console.warn('no input source on XRController when handleHandModel')
        }
      } else {
        if (!target.inputSource?.hand) {
          return
        }
        // target.xrHandModel?.disconnect()
        target.xrHandModel = null
      }
    },
    [target]
  )

  return <xRHandModel ref={handleHandModel} args={[target.hand!, target.inputSource!.handedness!]} />
}

export interface HandsProps {
  modelLeft?: string
  modelRight?: string
}
export function Hands({ modelLeft, modelRight }: HandsProps) {
  const controllers = useXR((state) => state.controllers.filter((c) => c.inputSource?.hand))
  React.useMemo(() => extend({ XRHandModel }), [])

  // // Send fake connected event (no-op) so models start loading
  // useIsomorphicLayoutEffect(() => {
  //   for (const target of controllers) {
  //     target.hand.dispatchEvent({ type: 'connected', data: target.inputSource, fake: true })
  //   }
  // }, [controllers, modelLeft, modelRight])

  return (
    <>
      {controllers.map((target, i) => (
        <React.Fragment key={i}>
          {createPortal(
            <HandModel target={target} modelPath={target.inputSource?.handedness === 'left' ? modelLeft : modelRight} />,
            target.hand
          )}
          {/* {createPortal(<Ray hideOnBlur={hideRaysOnBlur} target={target} {...rayMaterialProps} />, target.controller)} */}
        </React.Fragment>
      ))}
    </>
  )
}
