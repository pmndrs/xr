import { Group, Object3D, Texture, XRHandSpace } from 'three'
import { XRInputSourceModel } from './XRControllerModel'
import { MotionController } from 'three-stdlib'

const joints: XRHandJoint[] = [
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

export class XRHandModel extends Group implements XRInputSourceModel {
  connected: boolean
  envMap: Texture | null
  envMapIntensity: number
  // motionController: MotionController | null
  hand: XRHandSpace
  scene: Object3D | null
  bones: Partial<Record<XRHandJoint, Object3D>>
  handedness: XRHandedness

  constructor(hand: XRHandSpace, handedness: XRHandedness) {
    super()

    this.hand = hand
    this.envMap = null
    this.envMapIntensity = 1
    this.scene = null
    this.connected = false
    this.bones = {}
    this.handedness = handedness
  }

  setEnvironmentMap(envMap: Texture, envMapIntensity = 1): XRHandModel {
    if (this.envMap === envMap && this.envMapIntensity === envMapIntensity) {
      return this
    }

    this.envMap = envMap
    this.envMapIntensity = envMapIntensity
    applyEnvironmentMap(envMap, envMapIntensity, this)

    return this
  }

  connectModel(scene: Object3D): void {
    if (!this.motionController) {
      console.warn('scene tried to add, but no motion controller')
      return
    }

    this.scene = scene
    this.add(scene)
    if (this.envMap) {
      applyEnvironmentMap(envMap, envMapIntensity, scene)
    }
    const mesh = scene.getObjectByProperty('type', 'SkinnedMesh')!
    mesh.frustumCulled = false
    mesh.castShadow = true
    mesh.receiveShadow = true
    joints.forEach((jointName) => {
      const bone = scene.getObjectByName(jointName)

      if (bone !== undefined) {
        this.bones[jointName] = bone
      } else {
        console.warn(`Couldn't find ${jointName} in ${handedness} hand mesh`)
      }
    })
    // addAssetSceneToControllerModel(this, scene)
  }

  connectMotionController(_motionController: MotionController): void {
    // this.motionController = motionController
  }

  updateMatrixWorld(force: boolean): void {
    super.updateMatrixWorld(force)

    if (Object.keys(this.bones).length === 0) {
      return
    }

    const XRJoints = this.hand.joints
    let allInvisible = true

    for (const [jointName, bone] of Object.entries(this.bones)) {
      if (bone) {
        const XRJoint = XRJoints[jointName as XRHandJoint]

        if (XRJoint?.visible) {
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

    // if (!this.motionController) return

    // // Cause the MotionController to poll the Gamepad for data
    // this.motionController.updateFromGamepad()

    // // Update the 3D model to reflect the button, thumbstick, and touchpad state
    // Object.values(this.motionController.components).forEach((component) => {
    //   // Update node data based on the visual responses' current states
    //   Object.values(component.visualResponses).forEach((visualResponse) => {
    //     const { valueNode, minNode, maxNode, value, valueNodeProperty } = visualResponse

    //     // Skip if the visual response node is not found. No error is needed,
    //     // because it will have been reported at load time.
    //     if (!valueNode) return

    //     // Calculate the new properties based on the weight supplied
    //     if (valueNodeProperty === MotionControllerConstants.VisualResponseProperty.VISIBILITY && typeof value === 'boolean') {
    //       valueNode.visible = value
    //     } else if (
    //       valueNodeProperty === MotionControllerConstants.VisualResponseProperty.TRANSFORM &&
    //       minNode &&
    //       maxNode &&
    //       typeof value === 'number'
    //     ) {
    //       valueNode.quaternion.slerpQuaternions(minNode.quaternion, maxNode.quaternion, value)

    //       valueNode.position.lerpVectors(minNode.position, maxNode.position, value)
    //     }
    //   })
    // })
  }
}
