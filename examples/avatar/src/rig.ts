import { VRM, VRMHumanBoneList, VRMLoaderPlugin } from '@pixiv/three-vrm'
import { Bone, Object3D, Quaternion, Vector3 } from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// the retargeter writes the raw bones directly, so three-vrm must not overwrite them from the normalized bones
export const loader = new GLTFLoader()
  .setMeshoptDecoder(MeshoptDecoder)
  .register((parser) => new VRMLoaderPlugin(parser, { autoUpdateHumanBones: false }))

export function createRig(gltf: GLTF): HumanoidRig {
  const vrm = gltf.userData.vrm as VRM | undefined
  if (vrm != null) {
    const bones = new Map<string, Object3D>()
    for (const name of VRMHumanBoneList) {
      const node = vrm.humanoid.getRawBoneNode(name)
      if (node != null) {
        bones.set(name, node)
      }
    }
    return new HumanoidRig(vrm.scene, bones, (delta) => vrm.update(delta))
  }
  const bones = new Map<string, Object3D>()
  gltf.scene.traverse((object) => {
    const name = mixamoBones[object.name.replace(/^mixamorig\d*[:_]?/, '')]
    if (object instanceof Bone && name != null && !bones.has(name)) {
      bones.set(name, object)
    }
  })
  return new HumanoidRig(gltf.scene, bones)
}

const mixamoBones: Record<string, string> = {
  Hips: 'hips',
  Spine: 'spine',
  Spine1: 'chest',
  Spine2: 'upperChest',
  Neck: 'neck',
  Head: 'head',
}
for (const [mixamo, side] of [
  ['Left', 'left'],
  ['Right', 'right'],
]) {
  Object.assign(mixamoBones, {
    [`${mixamo}Shoulder`]: `${side}Shoulder`,
    [`${mixamo}Arm`]: `${side}UpperArm`,
    [`${mixamo}ForeArm`]: `${side}LowerArm`,
    [`${mixamo}Hand`]: `${side}Hand`,
    [`${mixamo}UpLeg`]: `${side}UpperLeg`,
    [`${mixamo}Leg`]: `${side}LowerLeg`,
    [`${mixamo}Foot`]: `${side}Foot`,
    [`${mixamo}ToeBase`]: `${side}Toes`,
    [`${mixamo}HandThumb1`]: `${side}ThumbMetacarpal`,
    [`${mixamo}HandThumb2`]: `${side}ThumbProximal`,
    [`${mixamo}HandThumb3`]: `${side}ThumbDistal`,
  })
  for (const [mixamoFinger, finger] of [
    ['Index', 'Index'],
    ['Middle', 'Middle'],
    ['Ring', 'Ring'],
    ['Pinky', 'Little'],
  ]) {
    Object.assign(mixamoBones, {
      [`${mixamo}Hand${mixamoFinger}1`]: `${side}${finger}Proximal`,
      [`${mixamo}Hand${mixamoFinger}2`]: `${side}${finger}Intermediate`,
      [`${mixamo}Hand${mixamoFinger}3`]: `${side}${finger}Distal`,
    })
  }
}

export class HumanoidRig {
  readonly restPositions = new Map<string, Vector3>()
  readonly restRotations = new Map<string, Quaternion>()
  readonly restParentRotations = new Map<string, Quaternion>()
  readonly restLocalPositions = new Map<string, Vector3>()
  readonly restLocalRotations = new Map<string, Quaternion>()
  readonly parents = new Map<string, string | undefined>()
  // parents always come before their children
  readonly order: Array<string> = []
  readonly facingYaw: number
  hideHead = false

  constructor(
    readonly scene: Object3D,
    readonly bones: Map<string, Object3D>,
    private readonly onUpdate?: (delta: number) => void,
  ) {
    scene.updateMatrixWorld(true)
    const names = new Map([...bones].map(([name, node]) => [node, name]))
    scene.traverse((node) => {
      node.frustumCulled = false
      const name = names.get(node)
      if (name == null) {
        return
      }
      let parent = node.parent
      while (parent != null && !names.has(parent)) {
        parent = parent.parent
      }
      this.order.push(name)
      this.parents.set(name, parent == null ? undefined : names.get(parent))
      this.restPositions.set(name, new Vector3().setFromMatrixPosition(node.matrixWorld))
      this.restRotations.set(name, worldRotation(node))
      this.restParentRotations.set(name, worldRotation(node.parent!))
      this.restLocalPositions.set(name, node.position.clone())
      this.restLocalRotations.set(name, node.quaternion.clone())
    })
    const side = new Vector3().subVectors(
      this.restPositions.get('rightUpperLeg')!,
      this.restPositions.get('leftUpperLeg')!,
    )
    const forward = new Vector3(0, 1, 0).cross(side)
    this.facingYaw = Math.PI - Math.atan2(forward.x, forward.z)
  }

  resetPose(): void {
    for (const [name, node] of this.bones) {
      node.position.copy(this.restLocalPositions.get(name)!)
      node.quaternion.copy(this.restLocalRotations.get(name)!)
    }
  }

  update(delta: number): void {
    const head = this.bones.get('head')!
    head.scale.setScalar(1)
    this.scene.updateMatrixWorld(true)
    this.onUpdate?.(Math.min(delta, 1 / 30))
    if (this.hideHead) {
      head.scale.setScalar(1e-4)
      head.updateWorldMatrix(false, true)
    }
  }
}

function worldRotation(object: Object3D): Quaternion {
  const rotation = new Quaternion()
  object.matrixWorld.decompose(new Vector3(), rotation, new Vector3())
  return rotation
}
