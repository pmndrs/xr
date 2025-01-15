import { Camera, Euler, Quaternion, Vector3, Vector3Tuple } from 'three'
import { createStore, StoreApi } from 'zustand/vanilla'

const negZAxis = new Vector3(0, 0, -1)

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
  getCameraTransformation(position?: Vector3, rotation?: Quaternion): void
  setOriginPosition(x: number, y: number, z: number, keepOffsetToCamera?: boolean): void
}

function computeOriginToCameraOffset(target: Vector3, state: ScreenCameraState, cameraRotation: Euler): void {
  target.copy(negZAxis).applyEuler(cameraRotation).multiplyScalar(state.distance)
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
const cameraRotationOffset = new Quaternion().setFromAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI)

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
    getCameraTransformation(position, rotation) {
      const state = get()
      eHelper.set(state.rotationX, state.rotationY, 0, 'YXZ')
      if (position != null) {
        computeOriginToCameraOffset(position, state, eHelper)
        const [x, y, z] = state.origin
        position.x += x
        position.y += y
        position.z += z
      }
      if (rotation != null) {
        rotation.setFromEuler(eHelper).multiply(cameraRotationOffset)
      }
    },
    setCameraPosition(x, y, z, keepOffsetToOrigin) {
      const update: Partial<ScreenCameraState> = {}
      buildCameraPositionUpdate(update, x, y, z, get().origin)
      if (keepOffsetToOrigin === true) {
        const state = get()
        eHelper.set(state.rotationX, state.rotationY, 0, 'YXZ')
        computeOriginToCameraOffset(offsetHelper, state, eHelper)
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
        const state = get()
        eHelper.set(state.rotationX, state.rotationY, 0, 'YXZ')
        computeOriginToCameraOffset(offsetHelper, state, eHelper)
        offsetHelper.x += x
        offsetHelper.y += y
        offsetHelper.z += z
        buildCameraPositionUpdate(update, offsetHelper.x, offsetHelper.y, offsetHelper.z, origin)
      }
      set(update)
    },
  }))
}

//TODO: enable damping
export function applyScreenCameraState(store: StoreApi<ScreenCameraStateAndFunctions>, getCamera: () => Camera) {
  const fn = (state: ScreenCameraStateAndFunctions) => {
    const camera = getCamera()
    state.getCameraTransformation(camera.position, camera.quaternion)
  }
  fn(store.getState())
  return store.subscribe(fn)
}
