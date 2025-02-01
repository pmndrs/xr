import { Vector3 } from 'three'
import { PointerEvent } from '@pmndrs/pointer-events'

export function getWorldDirection(event: PointerEvent, target: Vector3): boolean {
  if (event.details.type === 'sphere') {
    return false
  }
  if (event.details.type === 'lines') {
    const { line } = event.details
    target.copy(line.end).sub(line.start).normalize()
    return true
  }
  if (event.details.type === 'screen-ray') {
    target.copy(event.details.direction)
    return true
  }
  target.set(0, 0, -1).applyQuaternion(event.pointerQuaternion)
  return true
}
