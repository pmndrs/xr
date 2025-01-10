import { Vector2, Vector3 } from 'three'
import type { ScreenHandleStore } from './store.js'

export function filterForOnePointerRightClickOrTwoPointer(map: ScreenHandleStore['map']): boolean {
  if (map.size != 1) {
    return map.size === 2
  }
  const [p] = map.values()
  return p.latestEvent.buttons === 2
}

export function filterForOnePointerLeftClick(map: ScreenHandleStore['map']): boolean {
  if (map.size != 1) {
    return false
  }
  const [p] = map.values()
  return p.latestEvent.buttons === 1
}

export * from './camera.js'
export * from './store.js'
export * from './pan.js'
export * from './zoom.js'
export * from './rotate.js'
export * from './pan.js'
export * from './orbit.js'
export * from './map.js'
