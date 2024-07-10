import { Object3D } from 'three'
import { PointerEventsMap } from './event.js'

declare module 'three' {
  interface Object3D {
    __r3f?: {
      eventCount: number
      handlers: Record<string, ((e: any) => void) | undefined>
    }
  }
}

export function hasObjectListeners({ _listeners, __r3f }: Object3D): boolean {
  if (_listeners != null && Object.keys(_listeners).length > 0) {
    return true
  }
  if (__r3f != null && __r3f?.eventCount > 0) {
    return true
  }
  return false
}

export function getObjectListeners<E>(
  { _listeners, __r3f }: Object3D,
  forEvent: keyof PointerEventsMap,
): Array<(event: E) => void> | undefined {
  if (_listeners != null && forEvent in _listeners) {
    return _listeners[forEvent]
  }

  //R3F compatibility
  if (__r3f == null) {
    return undefined
  }
  const handler = __r3f.handlers[r3fEventToHandlerMap[forEvent]]
  if (handler == null) {
    return
  }
  return [handler]
}

const r3fEventToHandlerMap: Record<keyof PointerEventsMap, string> = {
  click: 'onClick',
  contextmenu: 'onContextMenu',
  dblclick: 'onDoubleClick',
  pointercancel: 'onPointerCancel',
  pointerdown: 'onPointerDown',
  pointerenter: 'onPointerEnter',
  pointerleave: 'onPointerLeave',
  pointermove: 'onPointerMove',
  pointerout: 'onPointerOut',
  pointerover: 'onPointerOver',
  pointerup: 'onPointerUp',
  wheel: 'onWheel',
}
