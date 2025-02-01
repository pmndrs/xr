import { Camera, Mesh, MeshBasicMaterial, Quaternion, SphereGeometry, TorusGeometry, Vector3 } from 'three'
import { HandlesContext } from '../context.js'
import { RegisteredHandle } from '../registered.js'
import { HandlesProperties, handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../index.js'
import { extractHandleTransformOptions } from '../utils.js'
import { createCircleGeometry } from './index.js'

const vector1Helper = new Vector3()
const vector2Helper = new Vector3()
const xAxis = new Vector3(1, 0, 0)
const quaternionHelper = new Quaternion()

export class FreeRotateHandle extends RegisteredHandle {
  constructor(context: HandlesContext, tagPrefix: string = '') {
    super(context, 'xyz', tagPrefix, () => ({
      scale: false,
      translate: 'as-rotate',
      rotate: this.options,
      multitouch: false,
    }))
  }

  update(camera: Camera) {
    camera.getWorldPosition(vector1Helper)
    this.getWorldPosition(vector2Helper).sub(vector1Helper)
    this.quaternion.setFromUnitVectors(xAxis, vector2Helper.normalize())

    const target = this.context.getTarget()
    if (target?.parent != null) {
      target.parent.matrixWorld.decompose(vector1Helper, quaternionHelper, vector2Helper)
      quaternionHelper.invert()
      this.quaternion.premultiply(quaternionHelper)
    }
    if (target != null) {
      quaternionHelper.copy(target.quaternion).invert()
      this.quaternion.premultiply(quaternionHelper)
    }
  }

  bind(config?: HandlesProperties) {
    const options = extractHandleTransformOptions(this.axis, config)
    if (options === false) {
      return undefined
    }
    this.options = options

    //visualization
    const material = new MeshBasicMaterial(handleXRayMaterialProperties)
    const cleanupHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
      color: 0xffffff,
      hoverColor: 0xffff00,
      opacity: 0.25,
    })
    const visualizationMesh = new Mesh(createCircleGeometry(0.5, 1), material)
    visualizationMesh.renderOrder = Infinity
    this.add(visualizationMesh)

    //interaction
    const interactionMesh = new Mesh(new SphereGeometry(0.25, 10, 8))
    interactionMesh.visible = false
    interactionMesh.pointerEventsOrder = Infinity
    this.add(interactionMesh)

    const unregister = this.context.registerHandle(this.store, interactionMesh, this.tag)

    return () => {
      this.pointerEvents = 'none'
      material.dispose()
      interactionMesh.geometry.dispose()
      visualizationMesh.geometry.dispose()
      unregister()
      cleanupHover?.()
      this.remove(interactionMesh)
      this.remove(visualizationMesh)
    }
  }
}
