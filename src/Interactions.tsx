import React, { useRef, useEffect, useCallback, ReactNode } from 'react'
import { useXR, useXREvent, XRInteractionEvent, XREvent, XRInteractionHandler, XRInteractionType, useControllers } from './XR'
import { XRHandedness } from './webxr'
import { Object3D, Group, Matrix4, Raycaster } from 'three'
import { useFrame } from 'react-three-fiber'
import { XRController } from 'XRController'

export function InteractionManager() {
  const controllers = useControllers()
  const [hoverState] = React.useState<Record<XRHandedness, Set<Object3D>>>(() => ({
    left: new Set(),
    right: new Set(),
    none: new Set()
  }))
  const [interactions] = React.useState(() => ({
    interactable: new Set<Object3D>(),
    handlers: {
      onHover: new Map<Object3D, XRInteractionHandler>(),
      onSelectStart: new Map<Object3D, XRInteractionHandler>(),
      onSelectEnd: new Map<Object3D, XRInteractionHandler>(),
      onSelect: new Map<Object3D, XRInteractionHandler>(),
      onSqueeze: new Map<Object3D, XRInteractionHandler>(),
      onSqueezeEnd: new Map<Object3D, XRInteractionHandler>(),
      onSqueezeStart: new Map<Object3D, XRInteractionHandler>(),
      onBlur: new Map<Object3D, XRInteractionHandler>()
    }
  }))

  const addInteraction = React.useCallback(
    (object: Object3D, eventType: XRInteractionType, handler: any) => {
      interactions.interactable.add(object)
      interactions.handlers[eventType].set(object, handler)
    },
    [interactions]
  )

  const removeInteraction = React.useCallback(
    (object: Object3D, eventType: XRInteractionType, handler: any) => {
      interactions.handlers[eventType].delete(object)

      let stillPresent = false
      Object.values(interactions.handlers).forEach((map) => {
        for (const obj of map.keys()) {
          if (obj === object) {
            stillPresent = true
            return
          }
        }
      })
      if (!stillPresent) {
        interactions.interactable.delete(object)
      }
    },
    [interactions]
  )
  const [raycaster] = React.useState(() => new Raycaster())

  const intersect = React.useCallback(
    (controller: Object3D) => {
      const objects = Array.from(interactions.interactable)
      const tempMatrix = new Matrix4()
      tempMatrix.identity().extractRotation(controller.matrixWorld)
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld)
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)

      return raycaster.intersectObjects(objects, true)
    },
    [interactions, raycaster]
  )

  // Trigger hover and blur events
  useFrame(() => {
    const { handlers, interactable } = interactions

    if (interactable.size === 0) {
      return
    }

    controllers.forEach((it) => {
      const { controller } = it
      const handedness = it.inputSource.handedness
      const hovering = hoverState[handedness]
      const hits = new Set()
      const intersections = intersect(controller)

      intersections.forEach((intersection) => {
        let eventObject: Object3D | null = intersection.object
        while (eventObject) {
          if (handlers.onHover.has(eventObject)) {
            // it.hoverRayLength = Math.min(it.hoverRayLength ?? Infinity, intersection.distance)

            if (!hovering.has(eventObject) && handlers.onHover.has(eventObject)) {
              hoverState[handedness].add(eventObject)
              handlers.onHover.get(eventObject)?.({ controller: it, intersection })
            }
          }
          hits.add(eventObject.id)
          eventObject = eventObject.parent
        }
      })

      hovering.forEach((hovered) => {
        if (!hits.has(hovered.id)) {
          if (handlers.onBlur.has(hovered)) {
            handlers.onBlur.get(hovered)?.({ controller: it })
          }
          hoverState[handedness].delete(hovered)
        }
      })
    })
  })

  const triggerEvent = (interaction: XRInteractionType) => (e: XREvent) => {
    const hovering = hoverState[e.controller.inputSource.handedness]
    for (const hovered of hovering) {
      if (interactions.handlers[interaction].has(hovered)) {
        // @ts-ignore
        interactions.handlers[interaction].get(hovering)({ controller: e.controller })
      }
    }
  }

  useXREvent('select', triggerEvent('onSelect'))
  useXREvent('selectstart', triggerEvent('onSelectStart'))
  useXREvent('selectend', triggerEvent('onSelectEnd'))
  useXREvent('squeeze', triggerEvent('onSqueeze'))
  useXREvent('squeezeend', triggerEvent('onSqueezeEnd'))
  useXREvent('squeezestart', triggerEvent('onSqueezeStart'))
}

// export interface HoverEvent {
//   isHovered: boolean
//   controller: XRController
// }

// export function Hover({ onChange, children }: { children: ReactNode; onChange: (e: HoverEvent) => void }) {
//   const ref = useRef<Object3D>()
//   const { addInteraction } = useXR()
//   const hovering = useRef(new Set<XRHandedness | undefined>())

//   useEffect(() => {
//     addInteraction(ref.current as Object3D, 'onHover', (e: XRInteractionEvent) => {
//       if (hovering.current.size === 0) {
//         onChange({ isHovered: true, controller: e.controller })
//       }
//       hovering.current.add(e.controller.inputSource.handedness)
//     })
//     addInteraction(ref.current as Object3D, 'onBlur', (e: XRInteractionEvent) => {
//       hovering.current.delete(e.controller.inputSource.handedness)
//       if (hovering.current.size === 0) {
//         onChange({ isHovered: false, controller: e.controller })
//       }
//     })
//   }, [onChange, addInteraction])

//   return <group ref={ref}>{children}</group>
// }

// export interface SelectEvent {
//   controller: XRController
// }

// export function Select({ onSelect, children }: { children: ReactNode; onSelect: (e: SelectEvent) => void }) {
//   const ref = useRef<Object3D>()
//   const { addInteraction } = useXR()

//   const hoveredHandedness = useRef<Set<XRHandedness | undefined>>(new Set())

//   const onEnd = useCallback(
//     (e: XREvent) => {
//       if (hoveredHandedness.current.has(e.controller.inputSource.handedness)) {
//         onSelect({ controller: e.controller })
//       }
//     },
//     [onSelect]
//   )

//   useXREvent('selectend', onEnd)

//   useEffect(() => {
//     addInteraction(ref.current as Object3D, 'onHover', (e: XRInteractionEvent) => {
//       hoveredHandedness.current.add(e.controller.inputSource?.handedness)
//     })
//     addInteraction(ref.current as Object3D, 'onBlur', (e: XRInteractionEvent) => {
//       hoveredHandedness.current.delete(e.controller.inputSource?.handedness)
//     })
//   }, [addInteraction])

//   return <group ref={ref}>{children}</group>
// }

export function RayGrab({ children }: { children: ReactNode }) {
  const { addInteraction } = useXR()

  const hoveredHandedness = useRef<Set<XRHandedness | undefined>>(new Set())
  const grabbingController = useRef<Object3D>()
  const groupRef = useRef<Group>()

  const previousTransform = useRef<Matrix4 | undefined>(undefined)

  const onEnd = useCallback((_: XREvent) => {
    grabbingController.current = undefined
    previousTransform.current = undefined
  }, [])

  const onStart = useCallback((e: XREvent) => {
    if (hoveredHandedness.current.has(e.controller.inputSource.handedness)) {
      grabbingController.current = e.controller.controller
      previousTransform.current = new Matrix4().getInverse(e.controller.controller.matrixWorld)
    }
  }, [])

  useXREvent('selectstart', onStart)
  useXREvent('selectend', onEnd)

  useFrame(() => {
    if (!grabbingController.current || !previousTransform.current || !groupRef.current) {
      return
    }

    const controller = grabbingController.current
    const group = groupRef.current

    group.applyMatrix4(previousTransform.current)
    group.applyMatrix4(controller.matrixWorld)
    group.updateWorldMatrix(false, true)

    previousTransform.current.getInverse(controller.matrixWorld)
  })

  useEffect(() => {
    addInteraction(groupRef.current as Object3D, 'onHover', (e: XRInteractionEvent) => {
      hoveredHandedness.current.add(e.controller.inputSource.handedness)
    })
    addInteraction(groupRef.current as Object3D, 'onBlur', (e: XRInteractionEvent) => {
      hoveredHandedness.current.delete(e.controller.inputSource.handedness)
    })
  }, [addInteraction])

  return <group ref={groupRef}>{children}</group>
}

export type InteractionHandler = (e: { controller: XRController }) => void
export function Interactable({
  children
}: {
  children: ReactNode
  onHover?: InteractionHandler
  onBlur?: InteractionHandler
  onSelectStart?: InteractionHandler
  onSelectEnd?: InteractionHandler
  onSelect?: InteractionHandler
  onSqueezeStart?: InteractionHandler
  onSqueezeEnd?: InteractionHandler
  onSqueeze?: InteractionHandler
}) {}
