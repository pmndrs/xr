let i = 0
const map = new WeakMap<object, number>()

export function objectToKey(object: object): number {
  let key = map.get(object)
  if (key == null) {
    map.set(object, (key = i++))
  }
  return key
}
