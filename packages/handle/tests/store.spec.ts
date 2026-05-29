import { expect } from 'chai'
import { getVoidObject } from '@pmndrs/pointer-events'
import { Object3D, Quaternion, Scene, Vector2, Vector3 } from 'three'
import { HandleStore, ScreenHandleStore } from '../src/index.js'

describe('HandleStore pointer cancellation', () => {
  it('should release an active object handle on pointercancel', () => {
    const object = new Object3D()
    const store = new HandleStore(object)
    const unbind = store.bind(object)

    object.dispatchEvent(createPointerEvent('pointerdown', object) as any)
    expect(store.getState()).to.not.equal(undefined)

    object.dispatchEvent(createPointerEvent('pointercancel', object) as any)
    expect(store.getState()).to.equal(undefined)

    unbind()
  })
})

describe('ScreenHandleStore pointer cancellation', () => {
  it('should release an active screen handle on pointercancel', () => {
    const scene = new Scene()
    const voidObject = getVoidObject(scene)
    const appliedSizes: Array<number> = []
    const store = new ScreenHandleStore(
      (_initial: number, map) => appliedSizes.push(map.size),
      () => 0,
    )
    const unbind = store.bind(scene)

    voidObject.dispatchEvent(createPointerEvent('pointerdown', voidObject, true) as any)
    store.update()
    expect(appliedSizes).to.deep.equal([1])

    voidObject.dispatchEvent(createPointerEvent('pointercancel', voidObject, true) as any)
    store.update()
    expect(appliedSizes).to.deep.equal([1])

    unbind()
  })
})

function createPointerEvent(type: string, object: Object3D, screen = false) {
  const point = new Vector3()
  const details = screen
    ? {
        type: 'screen-ray',
        distanceViewPlane: 0,
        direction: new Vector3(0, 0, -1),
        screenPoint: new Vector2(),
      }
    : { type: 'ray' }
  return {
    type,
    pointerId: 1,
    button: 0,
    object,
    timeStamp: 0,
    point,
    details,
    pointerPosition: new Vector3(),
    pointerQuaternion: new Quaternion(),
    intersection: {
      object,
      distance: 0,
      point,
      pointerPosition: new Vector3(),
      pointerQuaternion: new Quaternion(),
      pointOnFace: point.clone(),
      localPoint: point.clone(),
      details,
    },
    stopPropagation() {},
  }
}
