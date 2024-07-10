import { Camera, Object3D, Quaternion, Scene, Vector2, Vector3 } from 'three'
import { Pointer, PointerCapture, PointerOptions } from './pointer.js'
import { NativeEvent, NativeWheelEvent, PointerEvent } from './event.js'
import { intersectRayFromCamera } from './intersections/ray.js'
import { generateUniquePointerId } from './pointer/index.js'
import { IntersectionOptions } from './intersections/index.js'

export type ForwardablePointerEvent = { pointerId?: number; pointerType?: string; pointerState?: any } & NativeEvent

export type ForwardEventsOptions = {
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

const vectorHelper = new Vector3()
const vector2Helper = new Vector2()
const quaternionHelper = new Quaternion()

function htmlEventToCoords(element: HTMLElement, e: unknown, target: Vector2): Vector2 {
  if (!(e instanceof globalThis.MouseEvent)) {
    return target.set(0, 0)
  }
  const { width, height, top, left } = element.getBoundingClientRect()
  const x = e.pageX - left
  const y = e.pageY - top
  return target.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
}

/**
 * sets the `pointerTypePrefix` to `"screen-"`. Therefore, a event with pointerType `touch` is forwarded to the scene as `"screen-touch"`
 */
export function forwardHtmlEvents(
  fromElement: HTMLElement,
  toCamera: Camera,
  toScene: Object3D,
  options?: ForwardEventsOptions,
) {
  return forwardEvents(
    fromElement,
    toCamera,
    toScene,
    htmlEventToCoords.bind(null, fromElement),
    fromElement.setPointerCapture.bind(fromElement),
    fromElement.releasePointerCapture.bind(fromElement),
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
  target.copy(e.uv).multiplyScalar(2).addScalar(-1)
  target.y *= -1
  return target
}

export function forwardObjectEvents(
  fromPortal: Object3D,
  toCamera: Camera,
  toScene: Scene,
  options?: ForwardEventsOptions,
) {
  return forwardEvents(
    fromPortal,
    toCamera,
    toScene,
    portalEventToCoords,
    fromPortal.setPointerCapture.bind(fromPortal),
    fromPortal.releasePointerCapture.bind(fromPortal),
    options,
  )
}

/**
 * @returns cleanup function
 */
function forwardEvents(
  from: {
    addEventListener: (type: string, fn: (e: ForwardablePointerEvent & NativeWheelEvent) => void) => void
    removeEventListener: (type: string, fn: (e: ForwardablePointerEvent & NativeWheelEvent) => void) => void
  },
  toCamera: Camera,
  toScene: Object3D,
  toCoords: (event: unknown, target: Vector2) => Vector2,
  setPointerCapture: (pointerId: number) => void,
  releasePointerCapture: (ponterId: number) => void,
  options: ForwardEventsOptions = {},
): () => void {
  const forwardPointerCapture = options?.forwardPointerCapture ?? true
  const pointerMap = new Map<number, Pointer>()
  const pointerTypePrefix = options.pointerTypePrefix ?? 'forward-'
  const getInnerPointer = ({ pointerId = -1, pointerType = 'mouse', pointerState }: ForwardablePointerEvent) => {
    let innerPointer = pointerMap.get(pointerId)
    if (innerPointer != null) {
      return innerPointer
    }
    pointerType = `${pointerTypePrefix}${pointerType}`
    const computeIntersection = (scene: Object3D, nativeEvent: unknown, pointerCapture: PointerCapture | undefined) =>
      intersectRayFromCamera(
        toCamera,
        toCoords(nativeEvent, vector2Helper),
        toCamera.getWorldPosition(vectorHelper),
        toCamera.getWorldQuaternion(quaternionHelper),
        scene,
        pointerId,
        pointerType,
        pointerState,
        pointerCapture,
        options,
      )
    pointerMap.set(
      pointerId,
      (innerPointer = new Pointer(
        generateUniquePointerId(),
        pointerType,
        pointerState,
        computeIntersection,
        undefined,
        forwardPointerCapture ? setPointerCapture.bind(null, pointerId) : undefined,
        forwardPointerCapture ? releasePointerCapture.bind(null, pointerId) : undefined,
        options,
      )),
    )
    return innerPointer
  }
  const pointerMoveListener = (e: ForwardablePointerEvent) => getInnerPointer(e).move(toScene, e)
  const pointerCancelListener = (e: ForwardablePointerEvent) => getInnerPointer(e).cancel(e)
  const pointerDownListener = (e: ForwardablePointerEvent) => void (hasButton(e) && getInnerPointer(e).down(e))
  const pointerUpListener = (e: ForwardablePointerEvent) => void (hasButton(e) && getInnerPointer(e).up(e))
  const pointerLeaveListener = (e: ForwardablePointerEvent) => getInnerPointer(e).exit(e)
  const wheelListener = (e: ForwardablePointerEvent & NativeWheelEvent) => getInnerPointer(e).wheel(toScene, e, false)

  from.addEventListener('pointermove', pointerMoveListener)
  from.addEventListener('pointercancel', pointerCancelListener)
  from.addEventListener('pointerdown', pointerDownListener)
  from.addEventListener('pointerup', pointerUpListener)
  from.addEventListener('pointerleave', pointerLeaveListener)
  from.addEventListener('wheel', wheelListener)

  return () => {
    from.removeEventListener('pointermove', pointerMoveListener)
    from.removeEventListener('pointercancel', pointerCancelListener)
    from.removeEventListener('pointerdown', pointerDownListener)
    from.removeEventListener('pointerup', pointerUpListener)
    from.removeEventListener('pointerleave', pointerLeaveListener)
    from.removeEventListener('wheel', wheelListener)
  }
}

function hasButton<T extends { button?: number }>(val: T): val is T & { button: number } {
  return val.button != null
}
