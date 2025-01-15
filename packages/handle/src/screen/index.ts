import { ScreenHandleStore } from './store.js'

export function filterForOnePointerRightClickOrTwoPointer(map: ScreenHandleStore['map']): boolean {
  if (map.size != 1) {
    return map.size === 2
  }
  const [p] = map.values()
  return p.initialEvent.button === 2
}

export function filterForOnePointerLeftClick(map: ScreenHandleStore['map']): boolean {
  if (map.size != 1) {
    return false
  }
  const [p] = map.values()
  return p.initialEvent.button === 0
}

export * from './camera.js'
export * from './store.js'
export * from './pan.js'
export * from './zoom.js'
export * from './rotate.js'
export * from './pan.js'
export * from './orbit.js'
export * from './map.js'
