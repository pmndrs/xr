import { Matrix4, Object3D, Quaternion, Vector3 } from 'three'

export type SpringCollider = { node: Object3D; offset: Vector3; radius: number; tail: Vector3 | undefined }

export type SpringJoint = {
  node: Object3D
  axis: Vector3
  length: number
  initialRotation: Quaternion
  hitRadius: number
  stiffness: number
  gravityPower: number
  gravityDir: Vector3
  dragForce: number
  colliders: Array<SpringCollider>
  currentTail: Vector3
  previousTail: Vector3
  initialized: boolean
}

const parentMatrix = new Matrix4()
const colliderMatrix = new Matrix4()
const parentRotation = new Quaternion()
const restRotation = new Quaternion()
const headPosition = new Vector3()
const nextTail = new Vector3()
const inertia = new Vector3()
const direction = new Vector3()
const colliderPosition = new Vector3()
const colliderTail = new Vector3()
const closest = new Vector3()
const segment = new Vector3()
const positionHelper = new Vector3()
const scaleHelper = new Vector3()

export function updateSpringJoint(joint: SpringJoint, sceneInverse: Matrix4, deltaTime: number): void {
  const { node } = joint
  parentMatrix.multiplyMatrices(sceneInverse, node.parent!.matrixWorld)
  headPosition.copy(node.position).applyMatrix4(parentMatrix)
  parentMatrix.decompose(positionHelper, parentRotation, scaleHelper)
  restRotation.multiplyQuaternions(parentRotation, joint.initialRotation)

  if (!joint.initialized) {
    joint.currentTail.copy(joint.axis).applyQuaternion(restRotation).multiplyScalar(joint.length).add(headPosition)
    joint.previousTail.copy(joint.currentTail)
    joint.initialized = true
  }

  inertia.subVectors(joint.currentTail, joint.previousTail).multiplyScalar(1 - joint.dragForce)
  nextTail
    .copy(joint.currentTail)
    .add(inertia)
    .addScaledVector(direction.copy(joint.axis).applyQuaternion(restRotation), joint.stiffness * deltaTime)
    .addScaledVector(joint.gravityDir, joint.gravityPower * deltaTime)
  constrainLength(joint, nextTail)

  for (const collider of joint.colliders) {
    colliderMatrix.multiplyMatrices(sceneInverse, collider.node.matrixWorld)
    colliderPosition.copy(collider.offset).applyMatrix4(colliderMatrix)
    if (collider.tail == null) {
      closest.copy(colliderPosition)
    } else {
      colliderTail.copy(collider.tail).applyMatrix4(colliderMatrix)
      segment.subVectors(colliderTail, colliderPosition)
      const lengthSq = segment.lengthSq()
      const t =
        lengthSq < 1e-10
          ? 0
          : Math.min(1, Math.max(0, direction.subVectors(nextTail, colliderPosition).dot(segment) / lengthSq))
      closest.copy(colliderPosition).addScaledVector(segment, t)
    }
    direction.subVectors(nextTail, closest)
    const distance = direction.length()
    const radius = collider.radius + joint.hitRadius
    if (distance < radius && distance > 1e-8) {
      nextTail.copy(closest).addScaledVector(direction, radius / distance)
      constrainLength(joint, nextTail)
    }
  }

  joint.previousTail.copy(joint.currentTail)
  joint.currentTail.copy(nextTail)

  direction.subVectors(nextTail, headPosition).applyQuaternion(restRotation.invert()).normalize()
  node.quaternion.setFromUnitVectors(joint.axis, direction).premultiply(joint.initialRotation)
  node.updateWorldMatrix(false, true)
}

function constrainLength(joint: SpringJoint, tail: Vector3): void {
  tail.sub(headPosition).normalize().multiplyScalar(joint.length).add(headPosition)
}
