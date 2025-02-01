import { ColorRepresentation, Mesh, MeshBasicMaterial, TorusGeometry, Vector3, Vector3Tuple } from 'three'
import { HandlesContext } from '../context.js'
import { Axis } from '../../state.js'
import { handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../material.js'
import { extractHandleTransformOptions } from '../utils.js'
import { RegisteredHandle } from '../registered.js'
import { HandlesProperties } from '../index.js'

export class PivotAxisRotationHandle extends RegisteredHandle {
  constructor(context: HandlesContext, axis: Axis, tagPrefix: string, axisVector?: Vector3) {
    super(context, axis, tagPrefix, () => ({
      scale: false,
      translate: 'as-rotate',
      rotate: axisVector != null ? [axisVector] : this.options,
      multitouch: false,
    }))
  }

  bind(defaultColor: ColorRepresentation, config?: HandlesProperties) {
    const options = extractHandleTransformOptions(this.axis, config)
    if (options === false) {
      return undefined
    }
    this.options = options

    //visualization
    const material = new MeshBasicMaterial(handleXRayMaterialProperties)
    const cleanupHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
      color: defaultColor,
      hoverColor: 0xffff40,
    })

    const visualizationMesh = new Mesh(new TorusGeometry(0.45, 0.0075, 3, 64, Math.PI / 2), material)
    visualizationMesh.renderOrder = Infinity
    visualizationMesh.rotation.set(0, Math.PI / 2, Math.PI / 2)
    this.add(visualizationMesh)

    //interaction
    const interactionMesh = new Mesh(new TorusGeometry(0.45, 0.05, 4, 24, Math.PI / 2))
    interactionMesh.pointerEventsOrder = Infinity
    interactionMesh.visible = false
    interactionMesh.rotation.set(0, Math.PI / 2, Math.PI / 2)
    this.add(interactionMesh)

    const unregister = this.context.registerHandle(this.store, interactionMesh, this.tag)

    return () => {
      material.dispose()
      interactionMesh.geometry.dispose()
      visualizationMesh.geometry.dispose()
      unregister()
      cleanupHover?.()
      this.remove(visualizationMesh)
      this.remove(interactionMesh)
    }
  }
}
