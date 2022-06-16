import * as React from 'react'
import { XRController } from './XRController'
import { useXR } from './XR'

export interface XREvent {
  originalEvent: any
  controller: XRController
}

export type XREventType = 'select' | 'selectstart' | 'selectend' | 'squeeze' | 'squeezestart' | 'squeezeend'

export function useXREvent(event: XREventType, handler: (e: XREvent) => any, handedness?: XRHandedness) {
  const handlerRef = React.useRef<(e: XREvent) => any>(handler)
  React.useLayoutEffect(() => void (handlerRef.current = handler), [handler])

  const { controllers } = useXR()
  const targets = React.useMemo(
    () => (handedness ? controllers.filter((controller) => controller.inputSource.handedness === handedness) : controllers),
    [handedness, controllers]
  )

  React.useLayoutEffect(() => {
    const cleanups: (() => void)[] = []

    targets.forEach((target) => {
      const listener = (e: any) => handlerRef.current({ originalEvent: e, controller: target })
      target.controller.addEventListener(event, listener)
      cleanups.push(() => target.controller.removeEventListener(event, listener))
    })

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [targets, event])
}
