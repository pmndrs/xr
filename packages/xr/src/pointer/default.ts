import { Pointer } from '@pmndrs/pointer-events'

export function defaultGrabPointerOpacity(pointer: Pointer) {
  if (pointer.getButtonsDown().size > 0) {
    return 0.6
  }
  return map(pointer.getIntersection()?.distance ?? Infinity, 0.07, 0, 0.2, 0.4)
}

export function defaultRayPointerOpacity(pointer: Pointer) {
  if (pointer.getButtonsDown().size > 0) {
    return 0.6
  }
  return 0.4
}

export function defaultTouchPointerOpacity(pointer: Pointer) {
  return map(pointer.getIntersection()?.distance ?? Infinity, 0.1, 0.03, 0.2, 0.6)
}

function map(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) {
  return toMin + Math.max(0, Math.min(1, (value - fromMin) / (fromMax - fromMin))) * (toMax - toMin)
}
