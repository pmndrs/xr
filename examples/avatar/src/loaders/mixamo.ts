import { Bone, Group, Object3D, Vector3 } from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { HumanoidRig } from '../rig/humanoid-rig.js'

export const mixamoGLTFLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)

const mixamoBones: Record<string, string> = {
  Hips: 'hips',
  Spine: 'spine',
  Spine1: 'chest',
  Spine2: 'upperChest',
  Neck: 'neck',
  Head: 'head',
}

for (const [mixamoSide, side] of [
  ['Left', 'left'],
  ['Right', 'right'],
]) {
  Object.assign(mixamoBones, {
    [`${mixamoSide}Shoulder`]: `${side}Shoulder`,
    [`${mixamoSide}Arm`]: `${side}UpperArm`,
    [`${mixamoSide}ForeArm`]: `${side}LowerArm`,
    [`${mixamoSide}Hand`]: `${side}Hand`,
    [`${mixamoSide}UpLeg`]: `${side}UpperLeg`,
    [`${mixamoSide}Leg`]: `${side}LowerLeg`,
    [`${mixamoSide}Foot`]: `${side}Foot`,
    [`${mixamoSide}ToeBase`]: `${side}Toes`,
    [`${mixamoSide}HandThumb1`]: `${side}ThumbMetacarpal`,
    [`${mixamoSide}HandThumb2`]: `${side}ThumbProximal`,
    [`${mixamoSide}HandThumb3`]: `${side}ThumbDistal`,
  })
  for (const [mixamoFinger, finger] of [
    ['Index', 'Index'],
    ['Middle', 'Middle'],
    ['Ring', 'Ring'],
    ['Pinky', 'Little'],
  ]) {
    Object.assign(mixamoBones, {
      [`${mixamoSide}Hand${mixamoFinger}1`]: `${side}${finger}Proximal`,
      [`${mixamoSide}Hand${mixamoFinger}2`]: `${side}${finger}Intermediate`,
      [`${mixamoSide}Hand${mixamoFinger}3`]: `${side}${finger}Distal`,
    })
  }
}

const mixamoName = /^mixamorig\d*[:_]?(.+)$/

export function createMixamoRig(source: Object3D): HumanoidRig {
  const model = clone(source)
  const bones = new Map<string, Object3D>()
  model.traverse((object) => {
    if (!(object instanceof Bone)) {
      return
    }
    const name = mixamoName.exec(object.name)?.[1]
    const bone = name == null ? undefined : mixamoBones[name]
    if (bone != null && !bones.has(bone)) {
      bones.set(bone, object)
    }
  })
  const missing = ['hips', 'neck', 'head', 'leftUpperArm', 'rightUpperArm'].filter((bone) => !bones.has(bone))
  if (missing.length > 0) {
    throw new Error(`not a mixamo rig, missing bones: ${missing.join(', ')}`)
  }
  model.updateMatrixWorld(true)
  const hipsHeight = new Vector3().setFromMatrixPosition(bones.get('hips')!.matrixWorld).y
  if (hipsHeight > 10) {
    model.scale.multiplyScalar(0.01)
  }
  const root = new Group()
  root.add(model)
  return new HumanoidRig(root, bones)
}
