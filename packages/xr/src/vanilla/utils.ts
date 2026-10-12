import { Mesh, Object3D, Texture } from 'three'
import { xrUpdatesListContext } from './elements.js'

export function onXRFrame(fn: (frame: XRFrame, delta: number) => void) {
  if (xrUpdatesListContext == null) {
    throw new Error(`XR instances can only be created inside definitions of implementations`)
  }
  xrUpdatesListContext.push(fn)
}

export function disposeModel(model: Object3D) {
  model.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return
    }
    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof Texture) {
          value.dispose()
        }
      }
      material.dispose()
    }
  })
}
