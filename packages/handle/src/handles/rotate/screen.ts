import { Camera, Mesh, MeshBasicMaterial, Quaternion, TorusGeometry, Vector3 } from 'three'
import { HandlesContext } from '../context.js'
import { RegisteredHandle } from '../registered.js'
import { extractHandleTransformOptions } from '../utils.js'
import { HandlesProperties, handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../index.js'
import { createCircleGeometry } from './index.js'

const vector1Helper = new Vector3()
const vector2Helper = new Vector3()
const zAxis = new Vector3(1, 0, 0)
const quaternionHelper = new Quaternion()

export class ScreenSpaceRotateHandle extends RegisteredHandle {
  private readonly direction = new Vector3(1, 0, 0)

  constructor(context: HandlesContext, tagPrefix: string = '') {
    super(context, 'e', tagPrefix, () => ({
      scale: false,
      translate: 'as-rotate',
      rotate: [this.direction],
      multitouch: false,
    }))
  }

  update(camera: Camera) {
    camera.getWorldPosition(vector1Helper)
    this.getWorldPosition(this.direction).sub(vector1Helper).normalize()
    this.quaternion.setFromUnitVectors(zAxis, this.direction)

    const target = this.context.getTarget()
    if (target?.parent != null) {
      target.parent.matrixWorld.decompose(vector1Helper, quaternionHelper, vector2Helper)
      quaternionHelper.invert()
      this.quaternion.premultiply(quaternionHelper)
      this.direction.applyQuaternion(quaternionHelper)
    }
    if (target != null) {
      quaternionHelper.copy(target.quaternion).invert()
      this.quaternion.premultiply(quaternionHelper)
    }
    this.direction.negate()
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
      color: 0xffff00,
      hoverColor: 0xffff00,
      opacity: 0.5,
    })
    const visualizationMesh = new Mesh(createCircleGeometry(0.75, 1), material)
    visualizationMesh.renderOrder = Infinity
    this.add(visualizationMesh)

    //interaction
    const interactionMesh = new Mesh(new TorusGeometry(0.75, 0.1, 2, 24), new MeshBasicMaterial({ color: 'white' }))
    interactionMesh.visible = false
    interactionMesh.rotation.y = Math.PI / 2
    interactionMesh.pointerEventsOrder = Infinity
    this.add(interactionMesh)

    const unregister = this.context.registerHandle(this.store, interactionMesh, this.tag)

    return () => {
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
