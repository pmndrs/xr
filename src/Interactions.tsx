import React, { useRef, useEffect, ReactNode, forwardRef, useImperativeHandle } from 'react'
import { useXR } from './XR'
import type { Object3D, Group, Intersection } from 'three'
import { Matrix4 } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { XRController } from './XRController'
import { useXREvent, XREvent } from './XREvents'

export interface XRInteractionEvent {
  intersection?: Intersection
  controller: XRController
}

export type XRInteractionType =
  | 'onHover'
  | 'onBlur'
  | 'onSelectStart'
  | 'onSelectEnd'
  | 'onSelect'
  | 'onSqueeze'
  | 'onSqueezeEnd'
  | 'onSqueezeStart'

export type XRInteractionHandler = (event: XRInteractionEvent) => any

export function InteractionManager({ children }: { children: any }) {
  const state = useThree()
  const controllers = useXR((state) => state.controllers)
  const interactions = useXR((state) => state.interactions)
  const hoverState = useXR((state) => state.hoverState)
  const hasInteraction = useXR((state) => state.hasInteraction)
  const getInteraction = useXR((state) => state.getInteraction)

  const intersect = React.useCallback(
    (controller: Object3D) => {
      const objects = Array.from(interactions.keys())
      const tempMatrix = new Matrix4()
      tempMatrix.identity().extractRotation(controller.matrixWorld)
      state.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld)
      state.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)

      return state.raycaster.intersectObjects(objects, true)
    },
    [interactions, state.raycaster]
  )

  // Trigger hover and blur events
  useFrame(() => {
    if (interactions.size === 0) return

    controllers.forEach((it) => {
      const { controller } = it
      const handedness = it.inputSource.handedness
      const hovering = hoverState[handedness]
      const hits = new Set()
      let intersections = intersect(controller)

      if (state.events.filter) {
        // https://github.com/mrdoob/three.js/issues/16031
        // Allow custom userland intersect sort order
        intersections = state.events.filter(intersections, state)
      } else {
        // Otherwise, filter to first hit
        const hit = intersections.find((i) => i?.object)
        if (hit) intersections = [hit]
      }

      intersections.forEach((intersection) => {
        let eventObject: Object3D | null = intersection.object

        while (eventObject) {
          if (hasInteraction(eventObject, 'onHover') && !hovering.has(eventObject)) {
            getInteraction(eventObject, 'onHover')?.forEach((handler) => handler({ controller: it, intersection }))
          }

          hovering.set(eventObject, intersection)
          hits.add(eventObject.id)
          eventObject = eventObject.parent
        }
      })

      // Trigger blur on all the object that were hovered in the previous frame
      // but missed in this one
      for (const eventObject of hovering.keys()) {
        if (!hits.has(eventObject.id)) {
          getInteraction(eventObject, 'onBlur')?.forEach((handler) => handler({ controller: it }))
          hovering.delete(eventObject)
        }
      }
    })
  })

  const triggerEvent = React.useCallback(
    (interaction: XRInteractionType) => (e: XREvent) => {
      const hovering = hoverState[e.controller.inputSource.handedness]
      for (const hovered of hovering.keys()) {
        getInteraction(hovered, interaction)?.forEach((handler) =>
          handler({ controller: e.controller, intersection: hovering.get(hovered) })
        )
      }
    },
    [hoverState, getInteraction]
  )

  useXREvent('select', triggerEvent('onSelect'))
  useXREvent('selectstart', triggerEvent('onSelectStart'))
  useXREvent('selectend', triggerEvent('onSelectEnd'))
  useXREvent('squeeze', triggerEvent('onSqueeze'))
  useXREvent('squeezeend', triggerEvent('onSqueezeEnd'))
  useXREvent('squeezestart', triggerEvent('onSqueezeStart'))

  return children
}

export function useInteraction(ref: any, type: XRInteractionType, handler?: XRInteractionHandler) {
  const addInteraction = useXR((state) => state.addInteraction)
  const removeInteraction = useXR((state) => state.removeInteraction)

  const isPresent = handler !== undefined
  const handlerRef = useRef(handler)
  useEffect(() => void (handlerRef.current = handler), [handler])

  useEffect(() => {
    if (!isPresent) return

    const handlerFn = (e: XRInteractionEvent) => {
      handlerRef.current?.(e)
    }

    addInteraction(ref.current, type, handlerFn)
    const maybeRef = ref.current

    return () => removeInteraction(maybeRef, type, handlerFn)
  }, [type, addInteraction, removeInteraction, isPresent, ref])
}

export const Interactive = forwardRef(function Interactive(
  props: {
    children: ReactNode
    onHover?: XRInteractionHandler
    onBlur?: XRInteractionHandler
    onSelectStart?: XRInteractionHandler
    onSelectEnd?: XRInteractionHandler
    onSelect?: XRInteractionHandler
    onSqueezeStart?: XRInteractionHandler
    onSqueezeEnd?: XRInteractionHandler
    onSqueeze?: XRInteractionHandler
  },
  passedRef
) {
  const ref = useRef<Group>(null!)
  useImperativeHandle(passedRef, () => ref.current)

  useInteraction(ref, 'onHover', props.onHover)
  useInteraction(ref, 'onBlur', props.onBlur)
  useInteraction(ref, 'onSelectStart', props.onSelectStart)
  useInteraction(ref, 'onSelectEnd', props.onSelectEnd)
  useInteraction(ref, 'onSelect', props.onSelect)
  useInteraction(ref, 'onSqueezeStart', props.onSqueezeStart)
  useInteraction(ref, 'onSqueezeEnd', props.onSqueezeEnd)
  useInteraction(ref, 'onSqueeze', props.onSqueeze)

  return <group ref={ref}>{props.children}</group>
})

export function RayGrab({ children }: { children: ReactNode }) {
  const grabbingController = useRef<Object3D>()
  const groupRef = useRef<Group>()
  const previousTransform = useRef<Matrix4 | undefined>(undefined)

  useXREvent('selectend', (e) => {
    if (e.controller.controller === grabbingController.current) {
      grabbingController.current = undefined
      previousTransform.current = undefined
    }
  })

  useFrame(() => {
    if (!grabbingController.current || !previousTransform.current || !groupRef.current) {
      return
    }

    const controller = grabbingController.current
    const group = groupRef.current

    group.applyMatrix4(previousTransform.current)
    group.applyMatrix4(controller.matrixWorld)
    group.updateWorldMatrix(false, true)

    previousTransform.current = controller.matrixWorld.clone().invert()
  })

  return (
    <Interactive
      ref={groupRef}
      onSelectStart={(e) => {
        grabbingController.current = e.controller.controller
        previousTransform.current = e.controller.controller.matrixWorld.clone().invert()
      }}
    >
      {children}
    </Interactive>
  )
}
