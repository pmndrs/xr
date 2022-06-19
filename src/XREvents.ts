import * as React from 'react'
import { XRController } from './XRController'
import { useXR } from './XR'

export type XREventRepresentation = { type: string; target: any }
export interface XREvent<T extends XREventRepresentation> {
  nativeEvent: T
  target: T['target']
}

export type XRControllerEventType = Exclude<THREE.XRControllerEventType, XRSessionEventType>
export interface XRControllerEvent {
  type: XRControllerEventType
  target: XRController
}

export type XREventHandler<T extends XREventRepresentation> = (event: XREvent<T>) => void

export function useXREvent(event: XRControllerEventType, handler: XREventHandler<XRControllerEvent>, handedness?: XRHandedness) {
  const handlerRef = React.useRef<XREventHandler<XRControllerEvent>>(handler)
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
