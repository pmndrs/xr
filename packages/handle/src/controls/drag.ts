import type { Object3D, Object3DEventMap } from 'three'
import { HandleOptions, HandleStore } from '../store.js'
import type { PointerEventsMap } from '@pmndrs/pointer-events'

export class DragControls<T = unknown> {
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
        unbind: store.bind(object as Object3D<PointerEventsMap & Object3DEventMap>),
      }
    })
  }

  /**
   * only needs to be executed if `options.alwaysUpdate` is set to `true`
   * @param time is the absolute time. NOT the delta time
   */
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
