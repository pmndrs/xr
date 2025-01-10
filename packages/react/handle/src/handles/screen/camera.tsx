import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Camera, Euler, Quaternion, Vector3, Vector3Tuple } from 'three'
import { createStore, StoreApi } from 'zustand/vanilla'

export const defaultScreenCameraApply = (update: Partial<ScreenCameraState>, store: StoreApi<ScreenCameraState>) => {
  store.setState(update)
}

export type ScreenCameraState = {
  distance: number
  origin: Readonly<Vector3Tuple>
  rotationY: number
  rotationX: number
}

const v1Helper = new Vector3()
const v2Helper = new Vector3()
const eHelper = new Euler()
const qHelper = new Quaternion()

export function createScreenCameraStore({
  distance = 5,
  origin = [0, 0, 0],
  rotationX = 0,
  rotationY = 0,
}: Partial<ScreenCameraState> = {}) {
  return createStore<
    ScreenCameraState & { setPositionAndOrigin: (position: Vector3Tuple, origin: Vector3Tuple) => void }
  >((set) => ({
    distance,
    origin,
    rotationX,
    rotationY,
    activeHandle: undefined,
    setPositionAndOrigin: (position, origin) => {
      v1Helper.set(...position)
      v2Helper.set(...origin)
      v1Helper.sub(v2Helper)
      const distance = v1Helper.length()
      v1Helper.divideScalar(distance)
      qHelper.setFromUnitVectors(negZAxis, v1Helper)
      eHelper.setFromQuaternion(qHelper, 'YXZ')
      set({
        distance,
        origin,
        rotationX: eHelper.x,
        rotationY: eHelper.y,
      })
    },
  }))
}

//TODO: apply function (undefined means direct apply not useFrame needed) & add useDampingFunction()
export function useApplyScreenCameraState(
  store: StoreApi<ScreenCameraState>,
  providedCamera?: Camera,
  enabled: boolean = true,
) {
  const camera = useThree((s) => providedCamera ?? s.camera)
  useEffect(() => {
    if (!enabled) {
      return
    }
    const fn = (state: ScreenCameraState) =>
      computeScreenCameraTransformation(state, camera.position, camera.quaternion)
    fn(store.getState())
    return store.subscribe(fn)
  }, [camera, store, enabled])
}

const eulerHelper = new Euler()
const quaternionHelper = new Quaternion()
const negZAxis = new Vector3(0, 0, -1)
const cameraRotationOffset = new Quaternion().setFromAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI)
const vectorHelper = new Vector3()

export function computeScreenCameraTransformation(
  state: ScreenCameraState,
  targetPosition?: Vector3,
  targetRotation?: Quaternion,
): void {
  eulerHelper.set(state.rotationX, state.rotationY, 0, 'YXZ')
  quaternionHelper.setFromEuler(eulerHelper)
  if (targetPosition != null) {
    targetPosition
      .copy(negZAxis)
      .multiplyScalar(state.distance)
      .applyQuaternion(quaternionHelper)
      .add(vectorHelper.set(...state.origin))
  }
  if (targetRotation != null) {
    targetRotation.copy(quaternionHelper).multiply(cameraRotationOffset)
  }
}
