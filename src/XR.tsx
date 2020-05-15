import * as React from 'react'
import { Object3D, Matrix4, Raycaster, Intersection } from 'three'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory'
import { useThree, useFrame } from 'react-three-fiber'
import { XRHandedness } from './webxr'
import { XRController } from './XRController'

const XRContext = React.createContext<{
  controllers: XRController[]
  addInteraction: any
}>({
  controllers: []
} as any)

export interface XRInteractionEvent {
  intersection?: Intersection
  controller: XRController
}

export type XRInteractionType = 'onHover' | 'onBlur'

export type XRInteractionHandler = (event: XRInteractionEvent) => any

export function XR(props: { children: React.ReactNode }) {
  const { gl } = useThree()
  const [controllers, setControllers] = React.useState<XRController[]>([])

  const state = React.useRef({
    interactable: new Set<Object3D>(),
    handlers: {
      onHover: new WeakMap<Object3D, XRInteractionHandler>(),
      onBlur: new WeakMap<Object3D, XRInteractionHandler>()
    }
  })

  const addInteraction = React.useCallback((object: Object3D, eventType: XRInteractionType, handler: any) => {
    state.current.interactable.add(object)
    state.current.handlers[eventType].set(object, handler)
  }, [])

  React.useEffect(() => {
    const initialControllers = [0, 1].map((id) => XRController.make(id, gl))

    setControllers(initialControllers)

    // Once they are connected update them with obtained inputSource
    const updateController = (index: number) => (event: any) => {
      setControllers((existingControllers) => {
        const copy = [...existingControllers]
        copy[index] = { ...copy[index], inputSource: event.data }
        return copy
      })
    }

    initialControllers.forEach(({ controller }, i) => {
      controller.addEventListener('connected', updateController(i))
    })
  }, [gl])

  const [raycaster] = React.useState(() => new Raycaster())

  useFrame(() => {
    const intersect = (controller: Object3D) => {
      const objects = Array.from(state.current.interactable)
      const tempMatrix = new Matrix4()
      tempMatrix.identity().extractRotation(controller.matrixWorld)
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld)
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)

      return raycaster.intersectObjects(objects, true)
    }

    const { handlers } = state.current

    controllers.forEach((it) => {
      const { controller, hovering } = it
      const hits = new Set()
      const intersections = intersect(controller)

      intersections.forEach((intersection) => {
        let eventObject: Object3D | null = intersection.object
        while (eventObject) {
          if (!hovering.has(eventObject) && handlers.onHover.has(eventObject)) {
            hovering.add(eventObject)
            handlers.onHover.get(eventObject)?.({
              controller: it,
              intersection
            })
          }
          hits.add(eventObject.id)
          eventObject = eventObject.parent
        }
      })

      hovering.forEach((object) => {
        if (!hits.has(object.id)) {
          hovering.delete(object)
          if (handlers.onBlur.has(object)) {
            handlers.onBlur.get(object)?.({ controller: it })
          }
        }
      })
    })
  })

  return <XRContext.Provider value={{ controllers, addInteraction }}>{props.children}</XRContext.Provider>
}

export const useXR = () => React.useContext(XRContext)

export const useXREvent = (
  event: string,
  handler: (e: any) => any,
  {
    handedness
  }: {
    handedness?: XRHandedness
  } = {}
) => {
  const { controllers: allControllers } = useXR()

  React.useEffect(() => {
    const controllers = handedness ? allControllers.filter((it) => it.inputSource?.handedness === handedness) : allControllers

    controllers.forEach((it) => it.controller.addEventListener(event, handler))

    return () => {
      controllers.forEach((it) => it.controller.removeEventListener(event, handler))
    }
  }, [event, handler, allControllers, handedness])
}

export function DefaultXRControllers() {
  const { controllers } = useXR()

  const modelFactory = React.useMemo(() => new XRControllerModelFactory(), [])

  const [modelMap] = React.useState(() => new WeakMap())

  const models = React.useMemo(
    () =>
      controllers.map(({ controller, grip }) => {
        // Model factory listens for 'connect' event so we can only create models on inital render
        const model = modelMap.get(controller) ?? modelFactory.createControllerModel(controller)

        if (modelMap.get(controller) === undefined) {
          modelMap.set(controller, model)
        }

        return (
          <primitive object={grip} dispose={null} key={grip.id}>
            <primitive object={model} />
          </primitive>
        )
      }),
    [controllers, modelFactory, modelMap]
  )

  return <group>{models}</group>
}
