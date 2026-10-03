import { Matrix4, Object3D, Quaternion, Vector3 } from 'three'
import { SpringJoint, updateSpringJoint } from './springs.js'

export class HumanoidRig {
  readonly restPositions = new Map<string, Vector3>()
  readonly restRotations = new Map<string, Quaternion>()
  readonly restParentRotations = new Map<string, Quaternion>()
  readonly restLocalPositions = new Map<string, Vector3>()
  readonly humanParents = new Map<string, string | undefined>()
  readonly boneOrder: Array<string>
  readonly facingYaw: number
  hideHead = false

  private readonly restLocalRotations = new Map<string, Quaternion>()
  private readonly sceneInverse = new Matrix4()
  private readonly head: Object3D | undefined

  constructor(
    readonly scene: Object3D,
    readonly bones: Map<string, Object3D>,
    private readonly springs: Array<SpringJoint> = [],
  ) {
    scene.traverse((object) => (object.frustumCulled = false))
    scene.updateMatrixWorld(true)
    const sceneInverse = scene.matrixWorld.clone().invert()
    const nodeToBone = new Map<Object3D, string>()
    for (const [name, node] of bones) {
      nodeToBone.set(node, name)
      const { position, quaternion } = decomposeRelative(sceneInverse, node)
      this.restPositions.set(name, position)
      this.restRotations.set(name, quaternion)
      this.restParentRotations.set(name, decomposeRelative(sceneInverse, node.parent!).quaternion)
      this.restLocalPositions.set(name, node.position.clone())
      this.restLocalRotations.set(name, node.quaternion.clone())
    }
    const depth = new Map<string, number>()
    for (const [name, node] of bones) {
      let parent = node.parent
      let count = 0
      while (parent != null && !nodeToBone.has(parent)) {
        parent = parent.parent
      }
      this.humanParents.set(name, parent == null ? undefined : nodeToBone.get(parent))
      for (let ancestor = node.parent; ancestor != null; ancestor = ancestor.parent) {
        count++
      }
      depth.set(name, count)
    }
    this.boneOrder = [...bones.keys()].sort((a, b) => depth.get(a)! - depth.get(b)!)
    this.head = bones.get('head')
    this.facingYaw = computeFacingYaw(this.restPositions)
  }

  resetPose(): void {
    for (const [name, node] of this.bones) {
      node.position.copy(this.restLocalPositions.get(name)!)
      node.quaternion.copy(this.restLocalRotations.get(name)!)
    }
  }

  update(delta: number): void {
    this.head?.scale.setScalar(1)
    this.scene.updateMatrixWorld(true)
    this.sceneInverse.copy(this.scene.matrixWorld).invert()
    const deltaTime = Math.min(delta, 1 / 30)
    for (const joint of this.springs) {
      updateSpringJoint(joint, this.sceneInverse, deltaTime)
    }
    if (this.hideHead && this.head != null) {
      this.head.scale.setScalar(1e-4)
      this.head.updateWorldMatrix(false, true)
    }
  }
}

const matrixHelper = new Matrix4()
const scaleHelper = new Vector3()

function decomposeRelative(inverseRoot: Matrix4, object: Object3D) {
  const position = new Vector3()
  const quaternion = new Quaternion()
  matrixHelper.multiplyMatrices(inverseRoot, object.matrixWorld).decompose(position, quaternion, scaleHelper)
  return { position, quaternion }
}

function computeFacingYaw(restPositions: Map<string, Vector3>): number {
  const [left, right] =
    restPositions.has('leftUpperLeg') && restPositions.has('rightUpperLeg')
      ? [restPositions.get('leftUpperLeg')!, restPositions.get('rightUpperLeg')!]
      : [restPositions.get('leftUpperArm')!, restPositions.get('rightUpperArm')!]
  const side = new Vector3().subVectors(right, left)
  const forward = new Vector3(0, 1, 0).cross(side)
  return Math.PI - Math.atan2(forward.x, forward.z)
}
