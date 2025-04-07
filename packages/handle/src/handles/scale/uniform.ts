import { BoxGeometry, ColorRepresentation, CylinderGeometry, Euler, Group, Mesh, MeshBasicMaterial } from 'three'
import { RegisteredHandle } from '../registered.js'
import { HandlesContext } from '../context.js'
import { HandlesProperties } from '../index.js'
import { handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../material.js'
import { extractHandleTransformOptions } from '../utils.js'
import { Axis } from '../../state.js'

const normalRotation = new Euler(0, 0, -Math.PI / 2)
const invertedRotation = new Euler(0, 0, Math.PI / 2)

export class UniformAxisScaleHandle extends RegisteredHandle {
  constructor(
    context: HandlesContext,
    tagPrefix: string = '',
    private readonly actualAxis: Axis,
    private readonly invert: boolean = false,
  ) {
    super(context, 'xyz', tagPrefix, () => ({
      scale: { uniform: true, ...this.options },
      rotate: false,
      translate: 'as-scale',
      multitouch: false,
    }))
  }

  bind(defaultColor: ColorRepresentation, defaultHoverColor: ColorRepresentation, config?: HandlesProperties) {
    const options = extractHandleTransformOptions(this.actualAxis, config)
    if (options === false) {
      return undefined
    }
    this.options = options
    const rotation = this.invert ? invertedRotation : normalRotation

    //visualization
    const headGroup = new Group()
    headGroup.position.x = this.invert ? -0.7 : 0.7
    headGroup.rotation.copy(rotation)
    this.add(headGroup)

    const material = new MeshBasicMaterial(handleXRayMaterialProperties)
    const cleanupHeadHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
      color: defaultColor,
      hoverColor: defaultHoverColor,
      opacity: 0.5,
      hoverOpacity: 1,
    })

    const visualizationHeadMesh = new Mesh(new BoxGeometry(0.08, 0.08, 0.08), material)
    visualizationHeadMesh.renderOrder = Infinity
    visualizationHeadMesh.rotation.copy(rotation)

    headGroup.add(visualizationHeadMesh)

    const interactionHeadMesh = new Mesh(new BoxGeometry(0.15, 0.15, 0.15), material)
    interactionHeadMesh.visible = false
    interactionHeadMesh.pointerEventsOrder = Infinity
    interactionHeadMesh.rotation.copy(rotation)

    headGroup.add(interactionHeadMesh)

    const unregister = this.context.registerHandle(this.store, interactionHeadMesh, this.tag)

    return () => {
      material.dispose()
      visualizationHeadMesh.geometry.dispose()
      unregister()
      cleanupHeadHover?.()
      this.remove(headGroup)
    }
  }
}
