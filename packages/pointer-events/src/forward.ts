import { Camera, Mesh, Object3D, OrthographicCamera, PerspectiveCamera, Scene, Vector2 } from 'three'
import { GetCamera, Pointer, PointerOptions } from './pointer.js'
import { NativeEvent, NativeWheelEvent, PointerEvent } from './event.js'
import { CameraRayIntersector } from './intersections/ray.js'
import { generateUniquePointerId } from './pointer/index.js'
import { IntersectionOptions } from './intersections/index.js'
import { getClosestUV } from './utils.js'

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
  if (!(e.object instanceof Mesh)) {
    return target.set(0, 0)
  }
  getClosestUV(target, e.point, e.object)
  target.multiplyScalar(2).addScalar(-1)
  return target
}

export function forwardObjectEvents(
  fromPortal: Object3D,
  getCamera: GetCamera,
  scene: Scene,
  options?: ForwardEventsOptions,
) {
  return forwardEvents(
    fromPortal,
    getCamera,
    scene,
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
  getCamera: GetCamera,
  scene: Object3D,
  toCoords: (event: unknown, target: Vector2) => void,
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
    pointerMap.set(
      pointerId,
      (innerPointer = new Pointer(
        generateUniquePointerId(),
        `${pointerTypePrefix}${pointerType}`,
        pointerState,
        new CameraRayIntersector((nativeEvent, coords) => {
          toCoords(nativeEvent, coords)
          return getCamera()
        }, options),
        getCamera,
        undefined,
        forwardPointerCapture ? setPointerCapture.bind(null, pointerId) : undefined,
        forwardPointerCapture ? releasePointerCapture.bind(null, pointerId) : undefined,
        options,
      )),
    )
    return innerPointer
  }
  const pointerMoveListener = (e: ForwardablePointerEvent) => getInnerPointer(e).move(scene, e)
  const pointerCancelListener = (e: ForwardablePointerEvent) => getInnerPointer(e).cancel(e)
  const pointerDownListener = (e: ForwardablePointerEvent) => void (hasButton(e) && getInnerPointer(e).down(e))
  const pointerUpListener = (e: ForwardablePointerEvent) => void (hasButton(e) && getInnerPointer(e).up(e))
  const pointerLeaveListener = (e: ForwardablePointerEvent) => getInnerPointer(e).exit(e)
  const wheelListener = (e: ForwardablePointerEvent & NativeWheelEvent) => getInnerPointer(e).wheel(scene, e, false)

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
