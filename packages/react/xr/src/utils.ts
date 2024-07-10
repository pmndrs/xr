let i = 0
const map = new Map<unknown, number>()

export function objectToKey(object: unknown): number {
  let key = map.get(object)
  if (key == null) {
    map.set(object, (key = i++))
  }
  return key
}
