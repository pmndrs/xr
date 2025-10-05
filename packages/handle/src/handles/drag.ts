import { HandleOptions, HandleStore } from '../store.js'
import type { Object3D } from 'three'

export class DragHandle<T = unknown> {
  private connections: Array<{ store: HandleStore<T>; unbind: () => void }>

  constructor(objects: Array<Object3D>, getOptions?: () => HandleOptions<T>) {
    this.connections = objects.map((object) => {
      const store = new HandleStore(object, () => ({
        multitouch: false,
        scale: false,
        ...getOptions?.(),
      }))
      return {
        store,
        unbind: store.bind(object as Object3D),
      }
    })
  }

  update(time: number): void {
    for (const { store } of this.connections) {
      store.update(time)
    }
  }

  dispose(): void {
    for (const { unbind } of this.connections) {
      unbind()
    }
    this.connections.length = 0
  }
}
