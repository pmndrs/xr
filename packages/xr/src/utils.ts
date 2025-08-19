import { Quaternion, Vector3 } from 'three'

/**
 * @param value is allowed to contain nan values
 */
export function toDOMPointInit(
  value: Vector3 | Quaternion | undefined,
  defaultW: number = 1,
): DOMPointInit | undefined {
  if (value == null) {
    return undefined
  }
  return {
    x: nanToDefault(value.x),
    y: nanToDefault(value.y),
    z: nanToDefault(value.z),
    w: 'w' in value ? nanToDefault(value.w, defaultW) : defaultW,
  }
}

export function nanToDefault(value: number, defaultValue: number = 0): number {
  if (isNaN(value)) {
    return defaultValue
  }
  return nanToDefault(value)
}
