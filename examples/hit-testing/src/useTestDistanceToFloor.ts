import { Camera, useThree } from '@react-three/fiber'
import { useXRRequestHitTest } from '@react-three/xr'
import { useCallback } from 'react'
import { Matrix4, Quaternion, Vector3 } from 'three'

const matrixHelper = new Matrix4()
const positionHelper = new Vector3()
const quaternionHelper = new Quaternion()
const scaleHelper = new Vector3()
const cameraPositionHelper = new Vector3()

const isCameraFacingDown = (camera: Camera) => {
  // Get camera's forward direction
  const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
  // World down direction
  const down = new Vector3(0, -1, 0)
  // Dot product
  const dot = forward.dot(down)
  // If dot < 0.75, camera is NOT facing down
  console.log('dot:', dot)
  if (dot < 0.75) {
    return false
  }
  return true
}

export const useTestDistanceToFloor = () => {
  const requestHitTest = useXRRequestHitTest()
  const camera = useThree().camera

  const testDistanceToFloor = useCallback(async () => {
    if (isCameraFacingDown(camera)) {
      const hitTestResult = await requestHitTest('viewer')
      if (!hitTestResult) {
        return undefined
      }
      const { results, getWorldMatrix } = hitTestResult

      console.log('results:', results)
      if (results && results.length > 0 && results[0]) {
        getWorldMatrix(matrixHelper, results[0])
        matrixHelper.decompose(positionHelper, quaternionHelper, scaleHelper)
        camera.getWorldPosition(cameraPositionHelper)

        const distanceToFloor = cameraPositionHelper.y - positionHelper.y
        return distanceToFloor
      }
    }
    return undefined
  }, [camera, requestHitTest])

  return testDistanceToFloor
}
