import { Camera, Object3D, Quaternion, Vector3 } from 'three'

const vectorHelper = new Vector3()
const directionHelper = new Vector3()
const positionHelper = new Vector3()
const quaternionHelper = new Quaternion()

export function isFacingCamera(camera: Camera, object: Object3D, direction: Vector3, angle: number) {
  //compute object world direction -> directionHelper
  object.getWorldQuaternion(quaternionHelper)
  directionHelper.copy(direction).applyQuaternion(quaternionHelper)

  //compute guardToCamera direction (guard - camera) -> vectorHelper
  object.getWorldPosition(positionHelper)
  camera.getWorldPosition(vectorHelper)
  vectorHelper.sub(positionHelper)

  //compute the angle between guardToCamera and object world direction
  return vectorHelper.angleTo(directionHelper) < angle / 2
}

export function isAppleVisionPro() {
  return navigator.userAgent.includes('Macintosh') && navigator.xr != null
}
