import { Quaternion, Vector3 } from 'three'

export function toDOMPointInit(
  value: Vector3 | Quaternion | undefined,
  defaultW: number = 1,
): DOMPointInit | undefined {
  if (value == null) {
    return undefined
  }
  return { x: value.x, y: value.y, z: value.z, w: 'w' in value ? value.w : defaultW }
}
