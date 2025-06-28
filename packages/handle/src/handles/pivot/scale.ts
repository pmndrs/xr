import { ColorRepresentation, Mesh, MeshBasicMaterial, SphereGeometry } from 'three'
import { Axis } from '../../state.js'
import { HandlesContext } from '../context.js'
import { HandlesProperties } from '../index.js'
import { handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../material.js'
import { RegisteredHandle } from '../registered.js'
import { extractHandleTransformOptions } from '../utils.js'

export class PivotAxisScaleHandle extends RegisteredHandle {
  constructor(context: HandlesContext, axis: Axis | 'xyz', tagPrefix: string) {
    super(context, axis, tagPrefix, () => ({
      scale: axis === 'xyz' ? { uniform: true, ...this.options } : this.options,
      rotate: false,
      translate: 'as-scale',
      multitouch: false,
    }))
  }

  bind(defaultColor: ColorRepresentation, config?: HandlesProperties) {
    const { options, disabled } = extractHandleTransformOptions(this.axis, config)
    if (options === false) {
      return undefined
    }
    this.options = options
    const material = new MeshBasicMaterial(handleXRayMaterialProperties)
    const cleanupHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
      color: defaultColor,
      hoverColor: 0xffff40,
      disabled,
    })

    let handleSize = 0.04
    let handleOffset = 0.68
    if (this.axis === 'xyz') {
      handleSize = 0.08
      handleOffset = 0
    }
    const mesh = new Mesh(new SphereGeometry(handleSize), material)
    mesh.renderOrder = Infinity
    mesh.pointerEventsOrder = Infinity
    mesh.position.x = handleOffset

    const unregister = disabled ? undefined : this.context.registerHandle(this.store, mesh, this.tag)

    this.add(mesh)

    return () => {
      material.dispose()
      mesh.geometry.dispose()
      unregister?.()
      cleanupHover?.()
      this.remove(mesh)
    }
  }
}
