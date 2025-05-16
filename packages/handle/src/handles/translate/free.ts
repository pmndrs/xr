import { MeshBasicMaterial, Mesh, OctahedronGeometry } from 'three'
import { HandlesContext } from '../context.js'
import { HandlesProperties } from '../index.js'
import { handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../material.js'
import { RegisteredHandle } from '../registered.js'
import { extractHandleTransformOptions } from '../utils.js'

export class FreeTranslateHandle extends RegisteredHandle {
  constructor(context: HandlesContext) {
    super(context, 'xyz', '', () => ({
      translate: this.options,
      scale: false,
      rotate: false,
      multitouch: false,
    }))
  }

  bind(config?: HandlesProperties) {
    const { options, disabled } = extractHandleTransformOptions(this.axis, config)
    if (options === false) {
      return undefined
    }
    this.options = options

    //visualization
    const material = new MeshBasicMaterial(handleXRayMaterialProperties)
    const cleanupHeadHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
      color: 0xffffff,
      hoverColor: 0xffff00,
      opacity: 0.25,
      hoverOpacity: 1,
      disabled,
    })

    const visualizationMesh = new Mesh(new OctahedronGeometry(0.1, 0), material)
    visualizationMesh.renderOrder = Infinity

    this.add(visualizationMesh)

    //interaction
    const interactionMesh = new Mesh(new OctahedronGeometry(0.2, 0))
    interactionMesh.pointerEventsOrder = Infinity
    interactionMesh.visible = false
    this.add(interactionMesh)

    const unregister = disabled ? undefined : this.context.registerHandle(this.store, interactionMesh, this.tag)

    return () => {
      material.dispose()
      visualizationMesh.geometry.dispose()
      interactionMesh.geometry.dispose()
      unregister?.()
      cleanupHeadHover?.()
      this.remove(visualizationMesh)
      this.remove(interactionMesh)
    }
  }
}
