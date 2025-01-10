import { Euler, PerspectiveCamera, Quaternion, Vector2, Vector3 } from 'three'
import type { ScreenHandleStore } from './store.js'
import { computeScreenCameraTransformation, ScreenCameraState } from './camera.js'
import { Camera } from '@react-three/fiber'

export function average(
  target: Vector2,
  map: ScreenHandleStore['map'],
  key: 'currentScreenPosition' | 'initialScreenPosition',
): void {
  target.set(0, 0)
  let count = 0
  for (const value of map.values()) {
    target.add(value[key])
    count++
  }
  if (count === 0) {
    return
  }
  target.divideScalar(count)
}

const vector2Helper = new Vector2()
const quaternionHelper = new Quaternion()
const vectorHelper = new Vector3()
const forwardHelper = new Vector3()
const upwardHelper = new Vector3()

export function convertScreenSpaceMovementToGlobalPan(
  state: ScreenCameraState,
  camera: Camera,
  screenSpaceMovement: Vector2,
  target: Vector3,
  speed: number,
  space: 'screen' | 'xz',
): void {
  target.set(0, 0, 0)

  const cameraHeightAtDistance =
    camera instanceof PerspectiveCamera
      ? state.distance * 2 * Math.tan(((camera.fov / 2) * Math.PI) / 180.0)
      : (camera.top - camera.bottom) / camera.zoom

  vector2Helper.copy(screenSpaceMovement).multiplyScalar(-0.5 * speed * cameraHeightAtDistance)
  computeScreenCameraTransformation(state, undefined, quaternionHelper)

  const cameraRatio =
    camera instanceof PerspectiveCamera ? camera.aspect : (camera.right - camera.left) / (camera.top - camera.bottom)

  if (space === 'screen') {
    //x
    vectorHelper
      .set(1, 0, 0)
      .applyQuaternion(quaternionHelper)
      .multiplyScalar(vector2Helper.x * cameraRatio)
    target.add(vectorHelper)

    //y
    vectorHelper.set(0, 1, 0).applyQuaternion(quaternionHelper).multiplyScalar(vector2Helper.y)
    target.add(vectorHelper)
  } else {
    forwardHelper.set(0, 0, -1).applyQuaternion(quaternionHelper)
    upwardHelper.set(0, 1, 0).applyQuaternion(quaternionHelper)

    vectorHelper
      .copy(Math.abs(forwardHelper.y) < Math.abs(upwardHelper.y) ? forwardHelper : upwardHelper)
      .setComponent(1, 0)
      .normalize()

    target.addScaledVector(vectorHelper, vector2Helper.y)

    vectorHelper
      .set(1, 0, 0)
      .applyQuaternion(quaternionHelper)
      .setComponent(1, 0)
      .normalize()
      .multiplyScalar(vector2Helper.x * cameraRatio)
    target.add(vectorHelper)
  }
}
