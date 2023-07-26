import { XRController } from './XRController'
import { useXR } from './XR'
import { useCallbackRef, useIsomorphicLayoutEffect } from './utils'

export interface XREventRepresentation {
  type: string
  target: any
}
export interface XREvent<T extends XREventRepresentation> {
  nativeEvent: T
  target: T['target']
}

export type XRControllerEventType = Exclude<THREE.XRControllerEventType, XRSessionEventType>
export interface XRControllerEvent {
  type: XRControllerEventType
  target: XRController
  data?: XRInputSource
  fake?: boolean
}

export type XREventHandler<T extends XREventRepresentation> = (event: XREvent<T>) => void
export interface XREventOptions {
  handedness?: XRHandedness
}

export function useXREvent(event: XRControllerEventType, handler: XREventHandler<XRControllerEvent>, { handedness }: XREventOptions = {}) {
  const handlerRef = useCallbackRef(handler)
  const controllers = useXR((state) => state.controllers)

  useIsomorphicLayoutEffect(() => {
    const listeners = controllers.map((target) => {
      if (handedness && target.inputSource && target.inputSource.handedness !== handedness) return

      const listener = (nativeEvent: XRControllerEvent) => handlerRef.current({ nativeEvent, target })
      target.controller.addEventListener(event, listener)
      return () => target.controller.removeEventListener(event, listener)
    })

    return () => listeners.forEach((cleanup) => cleanup?.())
  }, [controllers, handedness, event])
}
