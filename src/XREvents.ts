import * as React from 'react'
import { XRController } from './XRController'
import { useXR } from './XR'

export type XREventType = 'select' | 'selectstart' | 'selectend' | 'squeeze' | 'squeezestart' | 'squeezeend'
export interface XREvent {
  nativeEvent: any
  target: XRController
}
export type XREventHandler = (event: XREvent) => void

export function useXREvent(event: XREventType, handler: XREventHandler, handedness?: XRHandedness) {
  const handlerRef = React.useRef<XREventHandler>(handler)
  React.useEffect(() => void (handlerRef.current = handler), [handler])
  const allControllers = useXR((state) => state.controllers)
  const controllers = React.useMemo(
    () => (handedness ? allControllers.filter((it) => it.inputSource.handedness === handedness) : allControllers),
    [handedness, allControllers]
  )

  React.useEffect(() => {
    const cleanups: any[] = []

    controllers.forEach((target) => {
      const listener = (nativeEvent: any) => handlerRef.current({ nativeEvent, target })
      target.controller.addEventListener(event, listener)
      cleanups.push(() => target.controller.removeEventListener(event, listener))
    })

    return () => cleanups.forEach((fn) => fn())
  }, [controllers, event])
}
