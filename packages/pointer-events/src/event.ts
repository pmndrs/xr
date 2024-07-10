import { BaseEvent, Face, Object3D, Quaternion, Vector2, Vector3 } from 'three'
import { Intersection } from './intersections/index.js'
import { Pointer } from './pointer.js'
import { getObjectListeners } from './utils.js'

export type PointerEventsMap = {
  [Key in keyof PointerEventsHandlers as EventHandlerToEventName<Key>]-?: PointerEventsHandlers[Key]
}

export type EventHandlerToEventName<T> = T extends `on${infer K}` ? Lowercase<K> : never

export type PointerEventsHandlers = {
  onPointerMove?: PointerEvent
  onPointerCancel?: PointerEvent
  onPointerDown?: PointerEvent
  onPointerUp?: PointerEvent
  onPointerEnter?: PointerEvent
  onPointerLeave?: PointerEvent
  onPointerOver?: PointerEvent
  onPointerOut?: PointerEvent
  onClick?: PointerEvent<MouseEvent>
  onDblClick?: PointerEvent<MouseEvent>
  onContextMenu?: PointerEvent<MouseEvent>
  onWheel?: WheelEvent
}

export type NativeEvent = {
  timeStamp: number
  shiftKey?: boolean
  metaKey?: boolean
  ctrlKey?: boolean
  altKey?: boolean
  button?: number
}

export class PointerEvent<E extends NativeEvent = globalThis.PointerEvent>
  implements Intersection, BaseEvent<keyof PointerEventsMap>
{
  //--- pointer events data
  get pointerId(): number {
    return this.pointer.id
  }
  get pointerType(): string {
    return this.pointer.type
  }
  get pointerState(): any {
    return this.pointer.state
  }
  get timeStamp(): number {
    return this.nativeEvent.timeStamp
  }
  get button(): number | undefined {
    return this.nativeEvent.button
  }
  get shiftKey(): boolean {
    return this.nativeEvent.shiftKey ?? false
  }
  get metaKey(): boolean {
    return this.nativeEvent.metaKey ?? false
  }
  get ctrlKey(): boolean {
    return this.nativeEvent.ctrlKey ?? false
  }
  get altKey(): boolean {
    return this.nativeEvent.altKey ?? false
  }

  //--- intersection data
  get distance(): number {
    return this.intersection.distance
  }
  get distanceToRay(): number | undefined {
    return this.intersection.distanceToRay
  }
  get point(): Vector3 {
    return this.intersection.point
  }
  get index(): number | undefined {
    return this.intersection.index
  }
  get face(): Face | null | undefined {
    return this.intersection.face
  }
  get faceIndex(): number | undefined {
    return this.intersection.faceIndex
  }
  get uv(): Vector2 | undefined {
    return this.intersection.uv
  }
  get uv1(): Vector2 | undefined {
    return this.intersection.uv1
  }
  get normal(): Vector3 | undefined {
    return this.intersection.normal
  }
  get instanceId(): number | undefined {
    return this.intersection.instanceId
  }
  get pointOnLine(): Vector3 | undefined {
    return this.intersection.pointOnLine
  }
  get batchId(): number | undefined {
    return this.intersection.batchId
  }
  get pointerPosition(): Vector3 {
    return this.intersection.pointerPosition
  }
  get pointerQuaternion(): Quaternion {
    return this.intersection.pointerQuaternion
  }
  get pointOnFace(): Vector3 {
    return this.intersection.pointOnFace
  }
  get localPoint(): Vector3 {
    return this.intersection.localPoint
  }
  get details(): Intersection['details'] {
    return this.intersection.details
  }

  /** same as target */
  get target(): Object3D {
    return this.object
  }
  /** same as currentTarget */
  get currentTarget(): Object3D {
    return this.currentObject
  }

  //the stop propagation functions will be set while propagating
  stopPropagation!: () => void
  stopImmediatePropagation!: () => void

  constructor(
    public readonly type: keyof PointerEventsMap,
    public readonly bubbles: boolean,
    public readonly nativeEvent: E,
    private pointer: Pointer,
    private readonly intersection: Intersection,
    public readonly currentObject: Object3D = intersection.object,
    public readonly object: Object3D = currentObject,
  ) {}

  /**
   * for internal use
   */
  retarget(currentObject: Object3D) {
    const { type, bubbles, nativeEvent, pointer, intersection, target } = this
    return new PointerEvent(type, bubbles, nativeEvent, pointer, intersection, currentObject, target)
  }
}

export type NativeWheelEvent = {
  deltaX: number
  deltaY: number
  deltaZ: number
} & NativeEvent

export class WheelEvent extends PointerEvent<NativeWheelEvent> {
  get deltaX(): number {
    return this.nativeEvent.deltaX
  }

  get deltaY(): number {
    return this.nativeEvent.deltaY
  }

  get deltaZ(): number {
    return this.nativeEvent.deltaZ
  }

  constructor(nativeEvent: NativeWheelEvent, pointer: Pointer, intersection: Intersection) {
    super('wheel', true, nativeEvent, pointer, intersection)
  }
}

export function emitPointerEvent(event: PointerEvent<NativeEvent>) {
  emitPointerEventRec(event, event.currentObject)
}

function emitPointerEventRec(baseEvent: PointerEvent<NativeEvent>, currentObject: Object3D | null) {
  if (currentObject == null) {
    return
  }
  const listeners = getObjectListeners(currentObject, baseEvent.type)
  let propagationStopped = !baseEvent.bubbles
  if (listeners != null && listeners.length > 0) {
    const event = baseEvent.retarget(currentObject)
    const length = listeners.length
    event.stopPropagation = () => (propagationStopped = true)

    let loopStopped = false
    event.stopImmediatePropagation = () => {
      propagationStopped = true
      loopStopped = true
    }
    for (let i = 0; i < length && !loopStopped; i++) {
      listeners[i](event)
    }
  }
  if (propagationStopped) {
    return
  }
  emitPointerEventRec(baseEvent, currentObject.parent)
}
