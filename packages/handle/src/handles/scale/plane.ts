import { ColorRepresentation, MeshBasicMaterial, Mesh, BoxGeometry } from 'three'
import { HandlesProperties } from '../index.js'
import { HandlesContext } from '../context.js'
import { handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../material.js'
import { RegisteredHandle } from '../registered.js'
import { extractHandleTransformOptions } from '../utils.js'

export class PlaneScaleHandle extends RegisteredHandle {
  constructor(context: HandlesContext, tag: 'xy' | 'yz' | 'xz', tagPrefix: string = '') {
    super(context, tag, tagPrefix, () => ({
      translate: 'as-scale',
      scale: this.options,
      rotate: false,
      multitouch: false,
    }))
  }

  bind(defaultColor: ColorRepresentation, defaultHoverColor: ColorRepresentation, config?: HandlesProperties) {
    const options = extractHandleTransformOptions(this.axis, config)
    if (options === false) {
      return undefined
    }
    this.options = options
    const material = new MeshBasicMaterial(handleXRayMaterialProperties)
    const cleanupHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
      opacity: 0.5,
      hoverOpacity: 1,
      color: defaultColor,
      hoverColor: defaultHoverColor,
    })

    const mesh = new Mesh(new BoxGeometry(0.2, 0.2, 0.01), material)
    mesh.renderOrder = Infinity
    mesh.pointerEventsOrder = Infinity
    mesh.position.set(0.15, 0.15, 0)

    const unregister = this.context.registerHandle(this.store, mesh, this.tag)

    this.add(mesh)

    return () => {
      material.dispose()
      mesh.geometry.dispose()
      unregister()
      cleanupHover?.()
      this.remove(mesh)
    }
  }
}
