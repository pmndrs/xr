import * as React from 'react'
import { Object3D, Matrix4, Raycaster, Intersection, Color } from 'three'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory'
import { useThree, useFrame, Canvas } from 'react-three-fiber'
import { XRHandedness } from './webxr'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'
import { XRController } from './XRController'
import { ContainerProps } from 'react-three-fiber/targets/shared/web/ResizeContainer'

export const XRContext = React.createContext<{
  controllers: XRController[]
  addInteraction: (object: Object3D, eventType: XRInteractionType, handler: XRInteractionHandler) => any
}>({
  controllers: []
} as any)

export interface XRInteractionEvent {
  intersection?: Intersection
  controller: XRController
}

export type XRInteractionType = 'onHover' | 'onBlur'

export type XRInteractionHandler = (event: XRInteractionEvent) => any

export function XRContextProvider(props: { children: React.ReactNode }) {
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

      it.hoverRayLength = undefined

      intersections.forEach((intersection) => {
        let eventObject: Object3D | null = intersection.object
        while (eventObject) {
          if (handlers.onHover.has(eventObject)) {
            it.hoverRayLength = Math.min(it.hoverRayLength ?? Infinity, intersection.distance)

            if (!hovering.has(eventObject) && handlers.onHover.has(eventObject)) {
              hovering.add(eventObject)
              handlers.onHover.get(eventObject)?.({ controller: it, intersection })
            }
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

export function XRCanvas({ children, ...rest }: ContainerProps) {
  return (
    <Canvas
      vr
      colorManagement
      onCreated={({ gl }) => {
        document.body.appendChild(VRButton.createButton(gl))
      }}
      {...rest}>
      <XRContextProvider>{children}</XRContextProvider>
    </Canvas>
  )
}

export const useXR = () => React.useContext(XRContext)

export interface XREvent {
  originalEvent: any
  controller: XRController
}

export type XREventType = 'select' | 'selectstart' | 'selectend' | 'squeeze' | 'squeezestart' | 'squeezeend'

export const useXREvent = (
  event: XREventType,
  handler: (e: XREvent) => any,
  {
    handedness
  }: {
    handedness?: XRHandedness
  } = {}
) => {
  const { controllers: allControllers } = useXR()

  const handleEvent = React.useCallback(
    (controller: XRController) => (e: any) => {
      handler({ originalEvent: e, controller })
    },
    [handler]
  )

  React.useEffect(() => {
    const controllers = handedness ? allControllers.filter((it) => it.inputSource?.handedness === handedness) : allControllers

    const cleanups: any[] = []

    controllers.forEach((it) => {
      const listener = handleEvent(it)
      it.controller.addEventListener(event, listener)
      cleanups.push(() => it.controller.removeEventListener(event, listener))
    })

    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [event, handleEvent, allControllers, handedness])
}

export function DefaultXRControllers() {
  const { controllers } = useXR()

  const modelFactory = React.useMemo(() => new XRControllerModelFactory(), [])

  const [modelMap] = React.useState(new Map())
  const [rays] = React.useState(new Map<number, Object3D>())

  useFrame(() => {
    controllers.forEach((it) => {
      const ray = rays.get(it.controller.id)
      if (!ray) {
        return
      }

      if (it.hoverRayLength === undefined) {
        ray.visible = false
        return
      }

      ray.visible = true
      ray.scale.y = it.hoverRayLength
      ray.position.z = -it.hoverRayLength / 2
    })
  })

  useXREvent('selectstart', (e: XREvent) => {
    const ray = rays.get(e.controller.controller.id)
    if (!ray) return
    ;(ray as any).material.color = new Color(0x192975)
  })

  useXREvent('selectend', (e: XREvent) => {
    const ray = rays.get(e.controller.controller.id)
    if (!ray) return
    ;(ray as any).material.color = new Color(0xffffff)
  })

  const models = React.useMemo(
    () =>
      controllers.map(({ controller, grip }) => {
        // Model factory listens for 'connect' event so we can only create models on inital render
        const model = modelMap.get(controller) ?? modelFactory.createControllerModel(controller)

        if (modelMap.get(controller) === undefined) {
          modelMap.set(controller, model)
        }

        return (
          <React.Fragment key={controller.id}>
            <primitive object={controller}>
              <mesh rotation={[Math.PI / 2, 0, 0]} ref={(ref) => rays.set(controller.id, ref as any)}>
                <meshBasicMaterial attach="material" color="#FFF" opacity={0.8} transparent />
                <boxBufferGeometry attach="geometry" args={[0.002, 1, 0.002]} />
              </mesh>
            </primitive>
            <primitive object={grip} dispose={null} key={grip.id}>
              <primitive object={model} />
            </primitive>
          </React.Fragment>
        )
      }),
    [controllers, modelFactory, modelMap, rays]
  )

  return <group>{models}</group>
}
