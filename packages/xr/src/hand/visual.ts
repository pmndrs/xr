import { Object3D } from 'three'
import { GetXRSpace } from '../space.js'

const joints: Array<XRHandJoint> = [
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
  'pinky-finger-tip',
]

export function createUpdateXRHandVisuals(
  hand: XRHand,
  handModel: Object3D,
  referenceSpace: GetXRSpace,
): (frame: XRFrame | undefined) => void {
  const buffer = new Float32Array(hand.size * 16)
  const jointObjects = joints.map((joint) => {
    const jointObject = handModel.getObjectByName(joint)
    if (jointObject == null) {
      throw new Error(`missing joint "${joint}" in hand model`)
    }
    jointObject.matrixAutoUpdate = false
    return jointObject
  })
  return (frame) => {
    if (frame == null) {
      return
    }
    const resolvedReferenceSpace = typeof referenceSpace === 'function' ? referenceSpace() : referenceSpace
    if (resolvedReferenceSpace == null) {
      return
    }
    frame.fillPoses(hand.values(), resolvedReferenceSpace, buffer)
    const length = jointObjects.length
    for (let i = 0; i < length; i++) {
      jointObjects[i].matrix.fromArray(buffer, i * 16)
    }
  }
}
