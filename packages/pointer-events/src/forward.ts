import { Object3D, OrthographicCamera, PerspectiveCamera, Scene, Vector2 } from 'three'
import { NativeEvent, NativeWheelEvent, PointerEvent } from './event.js'
import { IntersectionOptions } from './intersections/index.js'
import { ScreenRayIntersector } from './intersections/ray.js'
import { generateUniquePointerId } from './pointer/index.js'
import { GetCamera, Pointer, PointerOptions } from './pointer.js'

export type ForwardablePointerEvent = { pointerId: number; pointerType: string; pointerState?: any } & NativeEvent

export type ForwardEventsOptions = {
  /**
   * @default true
   * batches events per frame and limits scene intersections to one intersection per frame per pointer
   * if the scene is not rendered on every frame. this option should be disabled so that events are emitted directly without waiting for the next frame
   *
   * If you are having issues when executing functions that require a user action, e.g., uploading a file through a input element in a safari, please set this to `false`.
   */
  batchEvents?: boolean
  /**
   * @default false
   * intersections can either be done when the pointer is moved, or on every frame
   */
  intersectEveryFrame?: boolean
  /**
   * @default true
   */
  forwardPointerCapture?: boolean
  /**
   * @default "forward-"
   */
  pointerTypePrefix?: string
} & PointerOptions &
  IntersectionOptions

function htmlEventToCoords(element: HTMLElement, e: unknown, target: Vector2): Vector2 {
  if (!(e instanceof globalThis.MouseEvent)) {
    return target.set(0, 0)
  }
  const { width, height, top, left } = element.getBoundingClientRect()
  const x = e.clientX - left
  const y = e.clientY - top
  return target.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
}

/**
 * sets the `pointerTypePrefix` to `"screen-"`. Therefore, a event with pointerType `touch` is forwarded to the scene as `"screen-touch"`
 */
export function forwardHtmlEvents(
  fromElement: HTMLElement,
  getCamera: GetCamera | OrthographicCamera | PerspectiveCamera,
  scene: Object3D,
  options?: ForwardEventsOptions,
) {
  return forwardEvents(
    fromElement,
    //backwards compatibility
    typeof getCamera === 'function' ? getCamera : () => getCamera,
    scene,
    htmlEventToCoords.bind(null, fromElement),
    fromElement.setPointerCapture.bind(fromElement),
    (pointerId) => {
      try {
        fromElement.releasePointerCapture(pointerId)
      } catch {
        // Pointer may have already been released (e.g., left window)
      }
    },
    {
      pointerTypePrefix: 'screen-',
      ...options,
    },
  )
}

function portalEventToCoords(e: unknown, target: Vector2): Vector2 {
  if (!(e instanceof PointerEvent)) {
    return target.set(0, 0)
  }
  if (e.uv == null) {
    return target.set(0, 0)
  }
  return target.copy(e.uv).multiplyScalar(2).addScalar(-1)
}

export function forwardObjectEvents(
  fromPortal: Object3D,
  getCamera: GetCamera,
  scene: Scene,
  options?: ForwardEventsOptions,
) {
  return forwardEvents(
    fromPortal as any,
    getCamera,
    scene,
    portalEventToCoords,
    fromPortal.setPointerCapture.bind(fromPortal),
    fromPortal.releasePointerCapture.bind(fromPortal),
    options,
  )
}

type InternalEventType = 'cancel' | 'down' | 'move' | 'up' | 'wheel' | 'exit'

/**
 * @returns cleanup function
 */
function forwardEvents(
  from: {
    addEventListener: (type: string, fn: (e: ForwardablePointerEvent & NativeWheelEvent) => void) => void
    removeEventListener: (type: string, fn: (e: ForwardablePointerEvent & NativeWheelEvent) => void) => void
  },
  getCamera: GetCamera,
  scene: Object3D,
  toCoords: (event: unknown, target: Vector2) => void,
  setPointerCapture: (pointerId: number) => void,
  releasePointerCapture: (ponterId: number) => void,
  options: ForwardEventsOptions = {},
): { destroy: () => void; update: () => void } {
  const forwardPointerCapture = options?.forwardPointerCapture ?? true
  const pointerMap = new Map<number, Pointer>()
  const pointerTypePrefix = options.pointerTypePrefix ?? 'forward-'
  const getInnerPointer = (event: ForwardablePointerEvent, eventType: InternalEventType) => {
    let innerPointer = pointerMap.get(event.pointerId)
    if (innerPointer != null) {
      return innerPointer
    }
    innerPointer = new Pointer(
      generateUniquePointerId(),
      `${pointerTypePrefix}${event.pointerType}`,
      event.pointerState,
      new ScreenRayIntersector((nativeEvent, coords) => {
        toCoords(nativeEvent, coords)
        return getCamera()
      }, options),
      getCamera,
      undefined,
      forwardPointerCapture ? setPointerCapture.bind(null, event.pointerId) : undefined,
      forwardPointerCapture ? releasePointerCapture.bind(null, event.pointerId) : undefined,
      options,
    )
    if (eventType != 'move' && eventType != 'wheel') {
      //if we start with a non-move event no, we intersect and commit
      //this allows enter, down, ... events to be forwarded to the scene even when they dont come with a move event
      innerPointer.setIntersection(innerPointer.computeIntersection('pointer', scene, event))
      innerPointer.commit(event, false)
    }
    pointerMap.set(event.pointerId, innerPointer)
    return innerPointer
  }

  const latestWheelEventMap: Map<Pointer, ForwardablePointerEvent> = new Map()
  const latestMoveEventMap: Map<Pointer, ForwardablePointerEvent> = new Map()
  const movedPointerList: Array<Pointer> = []
  const eventList: Array<{ type: InternalEventType; event: ForwardablePointerEvent }> = []

  const emitEvent = (type: InternalEventType, event: ForwardablePointerEvent, pointer: Pointer) => {
    switch (type) {
      case 'move':
        pointer.move(scene, event)
        return
      case 'wheel':
        pointer.wheel(scene, event as any)
        return
      case 'cancel':
        pointer.cancel(event)
        return
      case 'down':
        if (!hasButton(event)) {
          return
        }
        pointer.down(event)
        return
      case 'up':
        if (!hasButton(event)) {
          return
        }
        pointer.up(event)
        return
      case 'exit':
        latestMoveEventMap.delete(pointer)
        latestWheelEventMap.delete(pointer)
        pointer.exit(event)
        return
    }
  }

  const onEvent = (type: InternalEventType, event: ForwardablePointerEvent) => {
    const pointer = getInnerPointer(event, type)
    if (type === 'move') {
      latestMoveEventMap.set(pointer, event)
    }
    if (type === 'wheel') {
      latestWheelEventMap.set(pointer, event)
    }
    if (options.batchEvents ?? true) {
      eventList.push({ type, event })
    } else {
      emitEvent(type, event, pointer)
    }
  }

  const pointerMoveListener = (event: ForwardablePointerEvent) => {
    const capture = pointerMap.get(event.pointerId)?.getPointerCapture()
    if (capture != null && forwardPointerCapture) {
      setPointerCapture(event.pointerId)
    }
    onEvent('move', event)
  }
  const pointerCancelListener = onEvent.bind(null, 'cancel')
  const pointerDownListener = onEvent.bind(null, 'down')
  const pointerUpListener = onEvent.bind(null, 'up')
  const wheelListener = onEvent.bind(null, 'wheel')
  const pointerLeaveListener = (event: ForwardablePointerEvent & { buttons?: number }) => {
    const capture = pointerMap.get(event.pointerId)?.getPointerCapture()
    if (capture != null && event.buttons) {
      return
    }
    onEvent('exit', event)
  }

  from.addEventListener('pointermove', pointerMoveListener)
  from.addEventListener('pointercancel', pointerCancelListener)
  from.addEventListener('pointerdown', pointerDownListener)
  from.addEventListener('pointerup', pointerUpListener)
  from.addEventListener('wheel', wheelListener)
  from.addEventListener('pointerleave', pointerLeaveListener)

  return {
    destroy() {
      from.removeEventListener('pointermove', pointerMoveListener)
      from.removeEventListener('pointercancel', pointerCancelListener)
      from.removeEventListener('pointerdown', pointerDownListener)
      from.removeEventListener('pointerup', pointerUpListener)
      from.removeEventListener('wheel', wheelListener)
      from.removeEventListener('pointerleave', pointerLeaveListener)
      latestMoveEventMap.clear()
      latestWheelEventMap.clear()
    },
    update() {
      const length = eventList.length
      for (let i = 0; i < length; i++) {
        const { type, event } = eventList[i]
        const pointer = getInnerPointer(event, type)
        if (type === 'move') {
          movedPointerList.push(pointer)
          if (latestMoveEventMap.get(pointer) != event) {
            //not the last move => move wihout recomputing the intersection
            pointer.emitMove(event)
            continue
          }
        }
        if (type === 'wheel' && latestWheelEventMap.get(pointer) != event) {
          pointer.emitWheel(event as any)
          continue
        }
        emitEvent(type, event, pointer)
      }
      eventList.length = 0
      if (options.intersectEveryFrame ?? false) {
        for (const [pointer, event] of latestMoveEventMap.entries()) {
          if (movedPointerList.includes(pointer)) {
            continue
          }
          pointer.move(scene, event)
        }
      }
      movedPointerList.length = 0
    },
  }
}

function hasButton<T extends { button?: number }>(val: T): val is T & { button: number } {
  return val.button != null
}
