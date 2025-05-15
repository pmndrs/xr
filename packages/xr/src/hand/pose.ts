import { Matrix4, WebXRManager } from 'three'

//based on https://github.com/AdaRoseCannon/handy-work/blob/main/src/handpose.js

declare global {
  interface XRFrame {
    /**
     * @returns A boolean indicating if all of the spaces have a valid pose.
     */
    fillPoses(spaces: Iterable<XRSpace>, referenceSpace: XRSpace, target: Float32Array): boolean
  }
}

export type XRHandPoseState = {
  //name: string | undefined
  data: Float32Array
  //distances: Record<string, number | undefined>
}

export type XRHandPoseUrls = Record<string, string>

export function createHandPoseState(hand: XRHand): XRHandPoseState {
  return {
    //distances: {},
    //name: undefined,
    data: new Float32Array(hand.size * 16),
  }
}

export function updateXRHandPoseState(
  state: XRHandPoseState,
  frame: XRFrame | undefined,
  hand: XRHand,
  manager: WebXRManager,
  handedness: XRHandedness,
): void {
  const referenceSpace = manager.getReferenceSpace()

  /*for (const key in poseUrls) {
    state.distances[key] = Infinity
  }*/

  if (
    referenceSpace == null ||
    frame == null ||
    frame.session.visibilityState === 'visible-blurred' ||
    frame.session.visibilityState === 'hidden'
  ) {
    //state.name = undefined
    return
  }

  const validPose = updateXRHandPoseData(frame, referenceSpace, hand, state.data)

  if (!validPose) {
    //state.name = undefined
    return
  }

  let closestPoseName: string | undefined
  let closestPoseDistance: number | undefined

  /*for (const key in poseUrls) {
    const pose = loadXRHandPose(poseUrls[key])
    if (pose == null) {
      continue
    }
    const distance = getXRHandPoseDistance(state.data, pose, handedness === 'left')

    if (closestPoseDistance != null && distance >= closestPoseDistance) {
      continue
    }

    state.distances[key] = distance
    closestPoseDistance = distance
    closestPoseName = key
  }

  state.name = closestPoseName*/
}

const invertedWirstHelper = new Matrix4()
const matrixHelper = new Matrix4()

function updateXRHandPoseData(
  frame: XRFrame,
  referenceSpace: XRSpace,
  hand: XRHand,
  handPoseData: Float32Array,
): boolean {
  const validPose = frame.fillPoses(hand.values(), referenceSpace, handPoseData)

  if (!validPose) {
    return false
  }

  //calculate bone poses in relation to the wrist

  // The first item in hand pose information is the wrist
  invertedWirstHelper.fromArray(handPoseData, 0)
  invertedWirstHelper.invert()

  for (let i = 0; i < handPoseData.length; i += 16) {
    matrixHelper.fromArray(handPoseData, i)
    matrixHelper.premultiply(invertedWirstHelper)
    matrixHelper.toArray(handPoseData, i)
  }

  return true
}

/*
const tempMat2 = new Matrix4()
const tempMat1 = new Matrix4()
const tempQuat2 = new Quaternion()
const tempQuat1 = new Quaternion()

function getXRHandPoseDistance(hpData1: Float32Array, phData2: Float32Array, mirrorHP2: boolean): number {
  const length = Math.min(hpData1.length, phData2.length)
  if (length === 0) {
    return Infinity
  }
  let dist = 0
  for (let i = 0; i < length; i += 16) {

      //TODO: use decompose
    tempQuat1.setFromRotationMatrix(tempMat1.fromArray(hpData1, i))
    tempQuat2.setFromRotationMatrix(tempMat2.fromArray(phData2, i))
    if (mirrorHP2) {
      mirrorQuaterionOnXAxis(tempQuat2)
    }
    dist += tempQuat2.angleTo(tempQuat1)
  }
  return dist / (length * 16)
}

function downloadHandPoseData(handed: XRHandedness, handPoseData: Float32Array) {
  if (handed === 'left') {
    const length = handPoseData.length
    const mirroredHandPoseData = new Float32Array(length)
    for (let i = 0; i < length; i += 16) {
      tempMat2.fromArray(handPoseData, i)
      //TODO: use decompose
      tempQuat2.setFromRotationMatrix(tempMat2)
      mirrorQuaterionOnXAxis(tempQuat2)
      // Copies the rotation component of the supplied matrix m into this matrix rotation component.
      tempMat2.makeRotationFromQuaternion(tempQuat2)
      tempMat2.toArray(mirroredHandPoseData, i)
    }
    handPoseData = mirroredHandPoseData
  }

  const a = window.document.createElement('a')
  a.href = window.URL.createObjectURL(new Blob([handPoseData], { type: 'application/octet-stream' }))
  a.download = 'untitled.handpose'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

//null means that we are currently loading the pose
const poseStorage = new Map<string, Float32Array | undefined | null>()

function loadXRHandPose(path: string): Float32Array | undefined {
  const href = new URL(path, window.location.href).href
  const pose = poseStorage.get(href)
  if (pose != null) {
    return pose
  }
  if (pose === undefined) {
    //loading process was never started
    poseStorage.set(href, null)
    //start loading process and save to poseStorage
    fetch(href)
      .then((response) => response.arrayBuffer())
      .then((buffer) => poseStorage.set(href, new Float32Array(buffer)))
      .catch(console.error)
  }
  return undefined
}

function mirrorQuaterionOnXAxis(quaternion: Quaternion): void {
  quaternion.x = -quaternion.x
  quaternion.w = -quaternion.w
}*/
