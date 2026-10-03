import { Matrix4, Quaternion, Vector3 } from 'three'
import { Driver, drivers, Side, torsoDrivers } from './drivers.js'
import { HumanoidRig } from '../rig/humanoid-rig.js'

const minLengthScale = 0.5
const maxLengthScale = 2

const up = new Vector3(0, 1, 0)
const identity = new Quaternion()

const vecA = new Vector3()
const vecB = new Vector3()
const vecC = new Vector3()
const vecD = new Vector3()
const quatA = new Quaternion()
const quatB = new Quaternion()
const matrixHelper = new Matrix4()

function basisQuaternion(primary: Vector3, hint: Vector3, target: Quaternion): Quaternion {
  const y = primary.normalize()
  const x = hint.addScaledVector(y, -hint.dot(y)).normalize()
  const z = vecC.crossVectors(x, y)
  return target.setFromRotationMatrix(matrixHelper.makeBasis(x, y, z))
}

export class BodyRetargeter {
  private readonly restPositions: Map<string, Vector3>
  private readonly restOffsets = new Map<string, Vector3>()
  private readonly positions = new Map<string, Vector3>()
  private readonly lengthScales = new Map<string, number>()
  private readonly restBasisInverse = new Map<string, Quaternion>()
  private readonly parents: Map<string, string | undefined>
  private readonly bones: Array<string>
  private readonly world = new Map<string, Quaternion>()

  private buffer: Float32Array | undefined
  private readonly jointIndices = new Map<XRBodyJoint, number>()

  private readonly hipsPosition = new Vector3()
  private readonly hips = new Quaternion()
  private readonly upperChest = new Quaternion()
  private readonly head = new Quaternion()
  private scale = 1
  private hasScale = false
  private readonly restTorsoLength: number

  private readonly viewerToHead: Quaternion

  constructor(rig: HumanoidRig) {
    this.restPositions = rig.restPositions
    this.parents = rig.humanParents
    this.bones = rig.boneOrder
    this.viewerToHead = new Quaternion().setFromAxisAngle(up, rig.facingYaw)
    for (const bone of this.bones) {
      const parent = this.parents.get(bone)
      const restPosition = this.restPositions.get(bone)!
      this.restOffsets.set(
        bone,
        parent == null ? restPosition.clone() : restPosition.clone().sub(this.restPositions.get(parent)!),
      )
      this.positions.set(bone, new Vector3())
      this.world.set(bone, new Quaternion())
    }
    for (const [bone, driver] of [...Object.entries(torsoDrivers), ...drivers] as Array<[string, Driver]>) {
      if (driver.type != 'basis' || !driver.rest.every((name) => this.restPositions.has(name))) {
        continue
      }
      const [from, to, hintFrom, hintTo] = driver.rest.map((name) => this.restPositions.get(name)!)
      const quaternion = basisQuaternion(vecA.subVectors(to, from), vecB.subVectors(hintTo, hintFrom), new Quaternion())
      this.restBasisInverse.set(bone, quaternion.invert())
    }
    this.restTorsoLength = this.restPositions.get('hips')!.distanceTo(this.restPositions.get('neck')!)
  }

  update(frame: XRFrame, referenceSpace: XRReferenceSpace): boolean {
    const body = frame.body
    const viewerPose = frame.getViewerPose(referenceSpace)
    if (body == null || viewerPose == null) {
      return false
    }
    if (this.buffer == null || this.buffer.length !== body.size * 16) {
      this.buffer = new Float32Array(body.size * 16)
      this.jointIndices.clear()
      let i = 0
      for (const joint of body.keys()) {
        this.jointIndices.set(joint, i++)
      }
    }
    if (!frame.fillPoses(body.values(), referenceSpace, this.buffer)) {
      return false
    }

    if (!this.joint('hips', this.hipsPosition) || !this.joint('neck', vecA)) {
      return false
    }
    const scale = vecA.distanceTo(this.hipsPosition) / this.restTorsoLength
    this.scale = this.hasScale ? this.scale + (scale - this.scale) * 0.05 : scale
    this.hasScale = true

    const { hips, upperChest, head } = this
    if (this.trackedBasis('upperChest', torsoDrivers.upperChest, upperChest) == null) {
      return false
    }
    if (this.trackedBasis('hips', torsoDrivers.hips, hips) == null) {
      hips.copy(upperChest)
    }
    const { x, y, z, w } = viewerPose.transform.orientation
    head.set(x, y, z, w).multiply(this.viewerToHead)

    for (const bone of this.bones) {
      this.lengthScales.set(bone, 1)
    }
    for (const bone of this.bones) {
      const parent = this.parents.get(bone)
      const parentWorld = parent == null ? identity : this.world.get(parent)!
      const world = this.world.get(bone)!
      const position = this.positions.get(bone)!
      if (parent == null) {
        position.copy(this.hipsPosition)
      } else {
        position
          .copy(this.restOffsets.get(bone)!)
          .applyQuaternion(parentWorld)
          .multiplyScalar(this.scale * this.lengthScales.get(bone)!)
          .add(this.positions.get(parent)!)
      }
      switch (bone) {
        case 'hips':
          world.copy(hips)
          continue
        case 'spine':
          world.slerpQuaternions(hips, upperChest, 1 / 3)
          continue
        case 'chest':
          world.slerpQuaternions(hips, upperChest, 2 / 3)
          continue
        case 'upperChest':
          world.copy(upperChest)
          continue
        case 'neck':
          world.slerpQuaternions(upperChest, head, 0.5)
          continue
        case 'head':
          world.copy(head)
          continue
      }
      const driver = drivers.get(bone)
      if (driver?.type === 'basis' && this.trackedBasis(bone, driver, world) != null) {
        continue
      }
      if (driver?.type === 'swing' && this.swing(driver, parentWorld, world)) {
        continue
      }
      if (driver?.type === 'reach' && this.reach(driver, position, parentWorld, world)) {
        continue
      }
      world.copy(parentWorld)
    }

    this.distributeForearmTwist('left')
    this.distributeForearmTwist('right')
    return true
  }

  apply(rig: HumanoidRig): void {
    for (const bone of this.bones) {
      const node = rig.bones.get(bone)
      if (node == null) {
        continue
      }
      const parent = this.parents.get(bone)
      node.quaternion
        .copy(parent == null ? identity : this.world.get(parent)!)
        .multiply(rig.restParentRotations.get(bone)!)
        .invert()
        .multiply(this.world.get(bone)!)
        .multiply(rig.restRotations.get(bone)!)
      node.position.copy(rig.restLocalPositions.get(bone)!).multiplyScalar(this.lengthScales.get(bone) ?? 1)
    }
    const scale = this.scale
    rig.scene.rotation.set(0, 0, 0)
    rig.scene.scale.setScalar(scale)
    rig.scene.position.copy(this.hipsPosition).addScaledVector(this.restPositions.get('hips')!, -scale)
  }

  private joint(joint: XRBodyJoint, target: Vector3): boolean {
    const index = this.jointIndices.get(joint)
    if (index == null || this.buffer == null) {
      return false
    }
    target.fromArray(this.buffer, index * 16 + 12)
    return true
  }

  private trackedBasis(
    bone: string,
    driver: Extract<Driver, { type: 'basis' }>,
    target: Quaternion,
  ): Quaternion | undefined {
    const restInverse = this.restBasisInverse.get(bone)
    const [from, to, hintFrom, hintTo] = driver.tracked
    if (
      restInverse == null ||
      !this.joint(from, vecA) ||
      !this.joint(to, vecB) ||
      !this.joint(hintFrom, vecC) ||
      !this.joint(hintTo, vecD)
    ) {
      return undefined
    }
    return basisQuaternion(vecB.sub(vecA), vecD.sub(vecC), target).multiply(restInverse)
  }

  private swing(driver: Extract<Driver, { type: 'swing' }>, parentWorld: Quaternion, target: Quaternion): boolean {
    const restFrom = this.restPositions.get(driver.rest[0])
    const restTo = this.restPositions.get(driver.rest[1])
    if (
      restFrom == null ||
      restTo == null ||
      !this.joint(driver.tracked[0], vecA) ||
      !this.joint(driver.tracked[1], vecB)
    ) {
      return false
    }
    const trackedDirection = vecB.sub(vecA).normalize()
    const restDirection = vecC.subVectors(restTo, restFrom).normalize().applyQuaternion(parentWorld)
    target.setFromUnitVectors(restDirection, trackedDirection).multiply(parentWorld)
    return true
  }

  private reach(
    driver: Extract<Driver, { type: 'reach' }>,
    position: Vector3,
    parentWorld: Quaternion,
    target: Quaternion,
  ): boolean {
    const restOffset = this.restOffsets.get(driver.child)
    if (restOffset == null || !this.joint(driver.target, vecA)) {
      return false
    }
    const trackedOffset = vecA.sub(position)
    const length = trackedOffset.length()
    const restLength = restOffset.length() * this.scale
    if (length < 1e-5 || restLength < 1e-5) {
      return false
    }
    const restDirection = vecB.copy(restOffset).normalize().applyQuaternion(parentWorld)
    target.setFromUnitVectors(restDirection, trackedOffset.divideScalar(length)).multiply(parentWorld)
    this.lengthScales.set(driver.child, Math.min(maxLengthScale, Math.max(minLengthScale, length / restLength)))
    return true
  }

  private distributeForearmTwist(side: Side): void {
    const lowerArm = this.world.get(`${side}LowerArm`)
    const hand = this.world.get(`${side}Hand`)
    const restLowerArm = this.restPositions.get(`${side}LowerArm`)
    const restHand = this.restPositions.get(`${side}Hand`)
    if (lowerArm == null || hand == null || restLowerArm == null || restHand == null) {
      return
    }
    const axis = vecA.subVectors(restHand, restLowerArm).normalize()
    const handLocal = quatA.copy(lowerArm).invert().multiply(hand)
    const projection = axis.multiplyScalar(axis.dot(vecB.set(handLocal.x, handLocal.y, handLocal.z)))
    const twist = quatB.set(projection.x, projection.y, projection.z, handLocal.w).normalize()
    lowerArm.multiply(twist.slerp(identity, 0.5))
  }
}
