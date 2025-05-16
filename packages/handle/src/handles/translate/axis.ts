import { ColorRepresentation, CylinderGeometry, Euler, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { Axis } from '../../state.js'
import { HandlesContext } from '../context.js'
import { HandlesProperties } from '../index.js'
import { handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../material.js'
import { RegisteredHandle } from '../registered.js'
import { extractHandleTransformOptions } from '../utils.js'

const arrowHeadGeometry = new CylinderGeometry(0, 0.04, 0.1, 12)
arrowHeadGeometry.translate(0, 0.05, 0)

const arrowBodyGeometry = new CylinderGeometry(0.0075, 0.0075, 0.5, 3)
arrowBodyGeometry.translate(0, 0.25, 0)

const normalRotation = new Euler(0, 0, -Math.PI / 2)
const invertedRotation = new Euler(0, 0, Math.PI / 2)

export class AxisTranslateHandle extends RegisteredHandle {
  constructor(
    context: HandlesContext,
    axis: Axis,
    tagPrefix: string = '',
    axisVector?: Vector3,
    private readonly invert: boolean = false,
    private readonly showArrowBody: boolean = true,
  ) {
    super(context, axis, tagPrefix, () => ({
      scale: false,
      rotate: false,
      translate: axisVector != null ? [axisVector] : this.options,
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
    const material = new MeshBasicMaterial(handleXRayMaterialProperties)

    const cleanupHeadHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
      color: defaultColor,
      hoverColor: defaultHoverColor,
      disabled,
    })

    const visualizationHeadMesh = new Mesh(arrowHeadGeometry, material)
    visualizationHeadMesh.renderOrder = Infinity
    visualizationHeadMesh.position.x = this.invert ? -0.5 : 0.5
    visualizationHeadMesh.rotation.copy(rotation)

    this.add(visualizationHeadMesh)

    let cleanupBodyHover: (() => void) | undefined
    let visualizationBodyMesh: Mesh | undefined
    if (this.showArrowBody) {
      const material = new MeshBasicMaterial(handleXRayMaterialProperties)

      cleanupBodyHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
        color: defaultColor,
        hoverColor: 0xffff40,
        disabled,
      })

      visualizationBodyMesh = new Mesh(arrowBodyGeometry, material)
      visualizationBodyMesh.renderOrder = Infinity
      visualizationBodyMesh.rotation.copy(rotation)

      this.add(visualizationBodyMesh)
    }

    //interaction
    const interactionMesh = new Mesh(new CylinderGeometry(0.13, 0, 0.6, 4))
    interactionMesh.pointerEventsOrder = Infinity
    interactionMesh.position.x = this.invert ? -0.3 : 0.3
    interactionMesh.rotation.copy(rotation)
    interactionMesh.visible = false
    this.add(interactionMesh)

    const unregister = disabled ? undefined : this.context.registerHandle(this.store, interactionMesh, this.tag)

    return () => {
      material.dispose()
      unregister?.()
      cleanupHeadHover?.()
      cleanupBodyHover?.()
      this.remove(visualizationHeadMesh)
      if (visualizationBodyMesh != null) {
        this.remove(visualizationBodyMesh)
      }
      this.remove(interactionMesh)
    }
  }
}
