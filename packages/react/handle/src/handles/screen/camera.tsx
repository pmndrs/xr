import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Camera, Euler, Quaternion, Vector3, Vector3Tuple } from 'three'
import { createStore, StoreApi } from 'zustand/vanilla'

export function defaultScreenCameraApply(update: Partial<ScreenCameraState>, store: StoreApi<ScreenCameraState>) {
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

export type ScreenCameraStateAndFunctions = ScreenCameraState & {
  setCameraPosition(x: number, y: number, z: number, keepOffsetToOrigin?: boolean): void
  getCameraPosition(target: Vector3): void
  setOriginPosition(x: number, y: number, z: number, keepOffsetToCamera?: boolean): void
}

function computeOriginToCameraOffset(target: Vector3, state: ScreenCameraState): void {
  eHelper.set(state.rotationX, state.rotationY, 0, 'YXZ')
  target.copy(negZAxis).applyEuler(eHelper).multiplyScalar(state.distance)
}

function buildCameraPositionUpdate(
  update: Partial<ScreenCameraState>,
  x: number,
  y: number,
  z: number,
  origin: Readonly<Vector3Tuple>,
): void {
  v1Helper.set(x, y, z)
  v2Helper.set(...origin)
  v1Helper.sub(v2Helper)
  const distance = v1Helper.length()
  v1Helper.divideScalar(distance)
  qHelper.setFromUnitVectors(negZAxis, v1Helper)
  eHelper.setFromQuaternion(qHelper, 'YXZ')
  update.distance = distance
  update.rotationX = eHelper.x
  update.rotationY = eHelper.y
}

const offsetHelper = new Vector3()

export function createScreenCameraStore({
  distance = 5,
  origin = [0, 0, 0],
  rotationX = 0,
  rotationY = 0,
}: Partial<ScreenCameraState> = {}) {
  return createStore<ScreenCameraStateAndFunctions>((set, get) => ({
    distance,
    origin,
    rotationX,
    rotationY,
    activeHandle: undefined,
    getCameraPosition(target) {
      const state = get()
      computeOriginToCameraOffset(target, state)
      const [x, y, z] = state.origin
      target.x += x
      target.y += y
      target.z += z
    },
    setCameraPosition(x, y, z, keepOffsetToOrigin) {
      const update: Partial<ScreenCameraState> = {}
      buildCameraPositionUpdate(update, x, y, z, get().origin)
      if (keepOffsetToOrigin === true) {
        computeOriginToCameraOffset(offsetHelper, get())
        offsetHelper.x -= x
        offsetHelper.y -= y
        offsetHelper.z -= z
        update.origin = offsetHelper.toArray()
      }
      set(update)
    },
    setOriginPosition(x, y, z, keepOffsetToCamera) {
      const origin: Vector3Tuple = [x, y, z]
      const update: Partial<ScreenCameraState> = {
        origin,
      }
      if (keepOffsetToCamera === true) {
        computeOriginToCameraOffset(offsetHelper, get())
        offsetHelper.x += x
        offsetHelper.y += y
        offsetHelper.z += z
        buildCameraPositionUpdate(update, offsetHelper.x, offsetHelper.y, offsetHelper.z, origin)
      }
      set(update)
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
