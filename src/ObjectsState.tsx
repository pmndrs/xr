import { Object3D } from 'three'

/**
 * Store data associated with some objects in the scene
 *
 * For example storing event handlers:
 *
 * objectA:
 *   onClick: [handler, handler]
 * objectB:
 *   onHover: [handler]
 *   onBlur:  [handler]
 *
 */
export type ObjectsState<Key extends string, Value> = Map<Object3D, Record<Key, Value[]>>
export const ObjectsState = {
  make: function <Key extends string, Value>() {
    return new Map() as ObjectsState<Key, Value>
  },
  add: function <Key extends string, Value>(state: ObjectsState<Key, Value>, object: Object3D, key: Key, value: Value) {
    if (!state.has(object)) {
      state.set(object, { key: [value] } as any)
    }
    const entry = state.get(object) as Record<Key, Value[]>
    if (!entry[key]) {
      entry[key] = []
    }
    entry[key].push(value)
  },
  delete: function <Key extends string, Value>(state: ObjectsState<Key, Value>, object: Object3D, key: Key, value: Value) {
    const entry = state.get(object)
    if (!entry || !entry[key]) return
    entry[key] = entry[key].filter((it) => it !== value)

    if (entry[key].length === 0) {
      delete entry[key]
    }

    // Remove entry if nothing left
    if (Object.keys(entry).length === 0) {
      state.delete(object)
    }
  },
  has: function <Key extends string, Value>(state: ObjectsState<Key, Value>, object: Object3D, key: Key) {
    const entry = state.get(object)
    return !!(entry && entry[key])
  },
  get: function <Key extends string, Value>(state: ObjectsState<Key, Value>, object: Object3D, key: Key) {
    const entry = state.get(object)
    return entry && entry[key]
  }
}
