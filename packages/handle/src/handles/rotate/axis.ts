import {
  Camera,
  ColorRepresentation,
  Euler,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  TorusGeometry,
  Vector3,
  Vector3Tuple,
} from 'three'
import { Axis } from '../../state.js'
import { HandlesContext } from '../context.js'
import { HandlesProperties, handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '../index.js'
import { RegisteredHandle } from '../registered.js'
import { extractHandleTransformOptions } from '../utils.js'
import { createCircleGeometry } from './index.js'

const config = {
  x: {
    vector1: new Vector3(0, 0, -1),
    vector2: new Vector3(0, -1, 0),
    rotationOffset: new Quaternion(),
    axis: [1, 0, 0] as Vector3Tuple,
  },
  y: {
    vector1: new Vector3(0, 0, -1),
    vector2: new Vector3(-1, 0, -1),
    rotationOffset: new Quaternion().setFromEuler(new Euler(0, 0, Math.PI / 2)),
    axis: [0, 1, 0] as Vector3Tuple,
  },
  z: {
    vector1: new Vector3(-1, 0, 0),
    vector2: new Vector3(0, -1, 0),
    rotationOffset: new Quaternion().setFromEuler(new Euler(0, Math.PI / 2, 0)),
    axis: [0, 0, 1] as Vector3Tuple,
  },
} as const

const vector1Helper = new Vector3()
const vector2Helper = new Vector3()
const vector3Helper = new Vector3()
const vector4Helper = new Vector3()
const quaternionHelper = new Quaternion()

export class AxisRotateHandle extends RegisteredHandle {
  private readonly direction = new Vector3(1, 0, 0)

  constructor(context: HandlesContext, axis: Axis, tagPrefix: string = '') {
    super(context, axis, tagPrefix, () => ({
      scale: false,
      translate: 'as-rotate',
      rotate: [this.direction],
      multitouch: false,
    }))
  }
  update(camera: Camera) {
    const { rotationOffset, vector1, vector2 } = config[this.axis as Axis]
    camera.getWorldPosition(vector1Helper)
    this.getWorldPosition(vector2Helper).sub(vector1Helper)
    vector3Helper.copy(vector1)
    vector4Helper.copy(vector2)
    const target = this.context.getTarget()
    const space = this.context.getSpace()
    if (space === 'local' && target != null) {
      target.getWorldQuaternion(quaternionHelper)
      vector3Helper.applyQuaternion(quaternionHelper)
      vector4Helper.applyQuaternion(quaternionHelper)
    }
    vector4Helper.crossVectors(vector3Helper, vector4Helper)
    const dotProduct = vector2Helper.dot(vector4Helper)
    vector4Helper.multiplyScalar(dotProduct)
    vector2Helper.sub(vector4Helper)
    this.quaternion.setFromUnitVectors(vector3Helper, vector2Helper.normalize())
    if (space === 'local' && target != null) {
      target.getWorldQuaternion(quaternionHelper)
      this.quaternion.multiply(quaternionHelper)
    }
    this.quaternion.multiply(rotationOffset)

    if (target?.parent != null) {
      target.parent.matrixWorld.decompose(vector1Helper, quaternionHelper, vector2Helper)
      quaternionHelper.invert()
      this.quaternion.premultiply(quaternionHelper)
    } else {
      quaternionHelper.identity()
    }

    if (this.store.getState() == null) {
      this.direction.fromArray(config[this.axis as Axis].axis)
      this.direction.applyQuaternion(space === 'local' && target != null ? target?.quaternion : quaternionHelper)
    }

    if (target != null) {
      this.quaternion.premultiply(quaternionHelper.copy(target.quaternion).invert())
    }
  }

  bind(defaultColor: ColorRepresentation, config?: HandlesProperties) {
    const { options, disabled } = extractHandleTransformOptions(this.axis, config)
    if (options === false) {
      return undefined
    }
    this.options = options

    //visualization
    const material = new MeshBasicMaterial(handleXRayMaterialProperties)
    const cleanupHover = setupHandlesContextHoverMaterial(this.context, material, this.tag, {
      color: defaultColor,
      hoverColor: 0xffff00,
      disabled,
    })
    const visualizationMesh = new Mesh(createCircleGeometry(0.5, 0.5), material)
    visualizationMesh.renderOrder = Infinity
    this.add(visualizationMesh)

    //interaction
    const interactionMesh = new Mesh(new TorusGeometry(0.5, 0.1, 4, 24))
    interactionMesh.visible = false
    interactionMesh.pointerEventsOrder = Infinity
    interactionMesh.rotation.set(0, -Math.PI / 2, -Math.PI / 2)
    this.add(interactionMesh)

    const unregister = disabled ? undefined : this.context.registerHandle(this.store, interactionMesh, this.tag)

    return () => {
      material.dispose()
      interactionMesh.geometry.dispose()
      visualizationMesh.geometry.dispose()
      unregister?.()
      cleanupHover?.()
      this.remove(interactionMesh)
      this.remove(visualizationMesh)
    }
  }
}
