import { ColorRepresentation, Mesh, MeshBasicMaterial, SphereGeometry } from 'three'
import { HandlesContext } from '../context.js'
import { handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../material.js'
import { Axis } from '../../state.js'
import { extractHandleTransformOptions } from '../utils.js'
import { RegisteredHandle } from '../registered.js'
import { HandlesProperties } from '../index.js'

export class PivotAxisScaleHandle extends RegisteredHandle {
  constructor(context: HandlesContext, axis: Axis, tagPrefix: string) {
    super(context, axis, tagPrefix, () => ({
      scale: this.options,
      rotate: false,
      translate: 'as-scale',
      multitouch: false,
    }))
  }

  bind(defaultColor: ColorRepresentation, config?: HandlesProperties) {
    const options = extractHandleTransformOptions(this.axis, config)
    if (options === false) {
      return undefined
    }
    this.options = options
    const material = new MeshBasicMaterial(handleXRayMaterialProperties)
    const cleanupHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
      color: defaultColor,
      hoverColor: 0xffff40,
      enabled: options.enabled,
    })

    const mesh = new Mesh(new SphereGeometry(0.04), material)
    mesh.renderOrder = Infinity
    mesh.pointerEventsOrder = Infinity
    mesh.position.x = 0.68

    const unregister = this.context.registerHandle(this.store, mesh, this.tag, options.enabled)

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
