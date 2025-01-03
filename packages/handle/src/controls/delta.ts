import { BufferGeometry, Float32BufferAttribute, Object3D } from 'three'
import { ControlsContext } from './context.js'

export function createTranslateControlsDeltaLineGeometry() {
  // from https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/TransformControls.js
  // Special geometry for transform helper. If scaled with position vector it spans from [0,0,0] to position
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3))
  return geometry
}

export function setupTranslateControlsDelta(context: ControlsContext, start: Object3D, line: Object3D, end: Object3D) {
  const hideObjects = () => {
    start.visible = false
    line.visible = false
    end.visible = false
  }
  hideObjects()
  const unsubscribe = context.subscribeApply((_, state) => {
    end.position.set(0, 0, 0)
    start.position.copy(state.initial.position).sub(state.current.position)
    line.position.set(0, 0, 0)
    line.scale.copy(start.position)
    if (state.last) {
      hideObjects()
    } else {
      //show objects
      start.visible = true
      line.visible = true
      end.visible = true
    }
  })
  return () => {
    unsubscribe()
    hideObjects()
  }
}
