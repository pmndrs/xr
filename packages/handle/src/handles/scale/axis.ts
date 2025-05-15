import { BoxGeometry, ColorRepresentation, CylinderGeometry, Euler, Group, Mesh, MeshBasicMaterial } from 'three'
import { Axis } from '../../state.js'
import { HandlesContext } from '../context.js'
import { HandlesProperties } from '../index.js'
import { handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../material.js'
import { RegisteredHandle } from '../registered.js'
import { extractHandleTransformOptions } from '../utils.js'

const normalRotation = new Euler(0, 0, -Math.PI / 2)
const invertedRotation = new Euler(0, 0, Math.PI / 2)

export class AxisScaleHandle extends RegisteredHandle {
  constructor(
    context: HandlesContext,
    axis: Axis,
    tagPrefix: string = '',
    private readonly invert: boolean = false,
    private readonly showHandleLine: boolean = true,
  ) {
    super(context, axis, tagPrefix, () => ({
      scale: this.options,
      rotate: false,
      translate: 'as-scale',
      multitouch: false,
    }))
  }

  bind(defaultColor: ColorRepresentation, defaultHoverColor: ColorRepresentation, config?: HandlesProperties) {
    const { options, disabled } = extractHandleTransformOptions(this.axis, config)
    if (options === false) {
      return undefined
    }
    this.options = options
    const rotation = this.invert ? invertedRotation : normalRotation

    //visualization
    const visualizationHeadGroup = new Group()
    visualizationHeadGroup.position.x = this.invert ? -0.5 : 0.5
    visualizationHeadGroup.rotation.copy(rotation)
    this.add(visualizationHeadGroup)

    const material = new MeshBasicMaterial(handleXRayMaterialProperties)
    const cleanupHeadHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
      color: defaultColor,
      hoverColor: defaultHoverColor,
      disabled,
    })

    const visualizationHeadMesh = new Mesh(new BoxGeometry(0.08, 0.08, 0.08), material)
    visualizationHeadMesh.renderOrder = Infinity
    visualizationHeadMesh.rotation.copy(rotation)

    visualizationHeadGroup.add(visualizationHeadMesh)

    let cleanupLineHover: (() => void) | undefined
    let visualizationLineMesh: Mesh | undefined
    let visualizationLineGroup: Group | undefined
    if (this.showHandleLine) {
      visualizationLineGroup = new Group()
      visualizationLineGroup.rotation.copy(rotation)
      this.add(visualizationLineGroup)

      const material = new MeshBasicMaterial(handleXRayMaterialProperties)
      cleanupLineHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
        color: defaultColor,
        hoverColor: defaultHoverColor,
        disabled,
      })

      visualizationLineMesh = new Mesh(new CylinderGeometry(0.0075, 0.0075, 0.5, 3), material)
      visualizationLineMesh.renderOrder = Infinity
      visualizationLineMesh.position.y = 0.25
      visualizationLineGroup.add(visualizationLineMesh)
    }

    //interaction
    const interactionGroup = new Group()
    interactionGroup.visible = false
    interactionGroup.rotation.copy(rotation)
    interactionGroup.position.x = this.invert ? -0.3 : 0.3
    this.add(interactionGroup)

    const interactionMesh = new Mesh(new CylinderGeometry(0.2, 0, 0.5, 4))
    interactionMesh.pointerEventsOrder = Infinity
    interactionMesh.position.y = 0.04
    interactionGroup.add(interactionMesh)

    const unregister = disabled ? undefined : this.context.registerHandle(this.store, interactionMesh, this.tag)

    return () => {
      material.dispose()
      interactionMesh.geometry.dispose()
      visualizationHeadMesh.geometry.dispose()
      visualizationLineMesh?.geometry.dispose()
      unregister?.()
      cleanupHeadHover?.()
      cleanupLineHover?.()
      if (visualizationLineGroup != null) {
        this.remove(visualizationLineGroup)
      }
      this.remove(interactionGroup)
      this.remove(visualizationHeadGroup)
    }
  }
}
