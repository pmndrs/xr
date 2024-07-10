import { RefObject, useEffect, useRef } from 'react'
import { Group, Intersection, XRControllerEventType as ThreeXRControllerEventType } from 'three'
import { PointerEvent } from '@pmndrs/pointer-events'
import { useXR } from '../xr.js'

const eventTranslations = {
  onBlur: 'pointerleave',
  onHover: 'pointerenter',
  onMove: 'pointermove',
  onSelect: {
    type: 'click',
    filter: (e) => e.pointerType === 'ray',
  },
  onSelectEnd: {
    type: 'pointerup',
    filter: (e) => e.pointerType === 'ray',
  },
  onSelectStart: {
    type: 'pointerdown',
    filter: (e) => e.pointerType === 'ray',
  },
  onSqueeze: {
    type: 'click',
    filter: (e) => e.pointerType === 'grab',
  },
  onSqueezeEnd: {
    type: 'pointerup',
    filter: (e) => e.pointerType === 'grab',
  },
  onSqueezeStart: {
    type: 'pointerdown',
    filter: (e) => e.pointerType === 'grab',
  },
} satisfies Record<string, string | { type: string; filter: (event: PointerEvent) => boolean }>

/**
 * @deprecated
 */
export function useInteraction(
  ref: RefObject<Group>,
  type: keyof typeof eventTranslations,
  handler?: (event: { intersection: Intersection; intersections: Array<Intersection>; target: any }) => void,
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  useEffect(() => {
    const { current } = ref
    if (current == null) {
      return
    }
    const translation = eventTranslations[type]
    const fn =
      typeof translation === 'string'
        ? (event: PointerEvent) =>
            handlerRef.current?.({ intersection: event, intersections: [event], target: event.pointerState })
        : (event: PointerEvent) => {
            if (event instanceof PointerEvent && !translation.filter(event)) {
              return
            }
            handlerRef.current?.({ intersection: event, intersections: [event], target: event.pointerState })
          }
    const eventName = typeof translation === 'string' ? translation : translation.type
    current.addEventListener(eventName as any, fn)
    return () => current.removeEventListener(eventName as any, fn)
  }, [ref, type])
}

/**
 * @deprecated
 */
export function useXREvent(
  type: Exclude<ThreeXRControllerEventType, XRSessionEventType | 'connected' | 'disconnected'>,
  handler: (event: {
    type: Exclude<ThreeXRControllerEventType, XRSessionEventType | 'connected' | 'disconnected'>
    data: XRInputSource
  }) => void,
  { handedness }: { handedness?: XRHandedness } = {},
) {
  const session = useXR((xr) => xr.session)
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  useEffect(() => {
    if (session == null) {
      return
    }
    const fn = (e: XRInputSourceEvent) => {
      handlerRef.current?.({
        type: e.type,
        data: e.inputSource,
      })
    }
    session.addEventListener(type, fn)
    return session.removeEventListener(type, fn)
  }, [session, handedness, type])
}
