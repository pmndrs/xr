import { Object3D } from 'three'
import { GLTFLoader } from 'three-stdlib'

const DEFAULT_HAND_PROFILE_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/'

class XRHandMeshModel {
  controller: Object3D
  handModel: Object3D
  bones: Object3D[]
  scene?: Object3D

  constructor(
    handModel: Object3D,
    controller: Object3D,
    path: string = DEFAULT_HAND_PROFILE_PATH,
    handedness: string,
    customModelPath?: string
  ) {
    this.controller = controller
    this.handModel = handModel

    this.bones = []

    const loader = new GLTFLoader()
    if (!customModelPath) loader.setPath(path)
    loader.load(customModelPath ?? `${handedness}.glb`, (gltf: { scene: Object3D }) => {
      const object = gltf.scene.children[0]
      this.handModel.add(object)
      this.scene = object

      const mesh = object.getObjectByProperty('type', 'SkinnedMesh')!
      mesh.frustumCulled = false
      mesh.castShadow = true
      mesh.receiveShadow = true

      const joints = [
        'wrist',
        'thumb-metacarpal',
        'thumb-phalanx-proximal',
        'thumb-phalanx-distal',
        'thumb-tip',
        'index-finger-metacarpal',
        'index-finger-phalanx-proximal',
        'index-finger-phalanx-intermediate',
        'index-finger-phalanx-distal',
        'index-finger-tip',
        'middle-finger-metacarpal',
        'middle-finger-phalanx-proximal',
        'middle-finger-phalanx-intermediate',
        'middle-finger-phalanx-distal',
        'middle-finger-tip',
        'ring-finger-metacarpal',
        'ring-finger-phalanx-proximal',
        'ring-finger-phalanx-intermediate',
        'ring-finger-phalanx-distal',
        'ring-finger-tip',
        'pinky-finger-metacarpal',
        'pinky-finger-phalanx-proximal',
        'pinky-finger-phalanx-intermediate',
        'pinky-finger-phalanx-distal',
        'pinky-finger-tip'
      ]

      joints.forEach((jointName) => {
        const bone = object.getObjectByName(jointName) as any

        if (bone !== undefined) {
          bone.jointName = jointName
        } else {
          console.warn(`Couldn't find ${jointName} in ${handedness} hand mesh`)
        }

        this.bones.push(bone)
      })
    })
  }

  updateMesh(): void {
    // XR Joints
    const XRJoints = (this.controller as any).joints
    let allInvisible = true

    for (let i = 0; i < this.bones.length; i++) {
      const bone = this.bones[i]

      if (bone) {
        const XRJoint = XRJoints[(bone as any).jointName]

        if (XRJoint.visible) {
          const position = XRJoint.position
          bone.position.copy(position)
          bone.quaternion.copy(XRJoint.quaternion)
          allInvisible = false
        }
      }
    }

    // Hide hand mesh if all joints are invisible in case hand loses tracking
    if (allInvisible && this.scene) {
      this.scene.visible = false
    } else if (this.scene) {
      this.scene.visible = true
    }
  }

  dispose(): void {
    if (this.scene) {
      this.handModel.remove(this.scene)
    }
  }
}

export { XRHandMeshModel }
