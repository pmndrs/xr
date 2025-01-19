import { Camera, Euler, Object3D, Quaternion, Vector3, Vector3Tuple } from 'three'
import { createStore, StoreApi } from 'zustand/vanilla'

const zAxis = new Vector3(0, 0, 1)

export function defaultScreenCameraApply(update: Partial<ScreenCameraState>, store: StoreApi<ScreenCameraState>) {
  store.setState(update)
}

export type ScreenCameraState = {
  distance: number
  origin: Readonly<Vector3Tuple>
  yaw: number
  pitch: number
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

function computeOriginToCameraOffset(
  target: Vector3,
  state: ScreenCameraState,
  cameraRotation: Euler,
  zToUp: Quaternion,
): void {
  target.copy(zAxis).applyEuler(cameraRotation).applyQuaternion(zToUp).multiplyScalar(state.distance)
}

function buildCameraPositionUpdate(
  update: Partial<ScreenCameraState>,
  x: number,
  y: number,
  z: number,
  origin: Readonly<Vector3Tuple>,
  upToZ: Quaternion,
): void {
  v1Helper.set(x, y, z)
  v2Helper.set(...origin)
  v1Helper.sub(v2Helper)
  v1Helper.applyQuaternion(upToZ)
  const distance = v1Helper.length()
  v1Helper.divideScalar(distance)
  qHelper.setFromUnitVectors(zAxis, v1Helper)
  eHelper.setFromQuaternion(qHelper, 'YXZ')
  update.distance = distance
  update.pitch = eHelper.x
  update.yaw = eHelper.y
}

const offsetHelper = new Vector3()

export function createScreenCameraStore(
  { distance = 5, origin = [0, 0, 0], pitch: rotationX = 0, yaw: rotationY = 0 }: Partial<ScreenCameraState> = {},
  up = Object3D.DEFAULT_UP,
) {
  const upToZ = new Quaternion().setFromUnitVectors(up, new Vector3(0, 1, 0))
  const zToUp = upToZ.clone().invert()
  return createStore<ScreenCameraStateAndFunctions>((set, get) => ({
    distance,
    origin,
    pitch: rotationX,
    yaw: rotationY,
    activeHandle: undefined,
    getCameraTransformation(position, rotation) {
      const state = get()
      eHelper.set(state.pitch, state.yaw, 0, 'YXZ')
      if (position != null) {
        computeOriginToCameraOffset(position, state, eHelper, zToUp)
        const [x, y, z] = state.origin
        position.x += x
        position.y += y
        position.z += z
      }
      if (rotation != null) {
        rotation.setFromEuler(eHelper).premultiply(zToUp)
      }
    },
    setCameraPosition(x, y, z, keepOffsetToOrigin) {
      const update: Partial<ScreenCameraState> = {}
      buildCameraPositionUpdate(update, x, y, z, get().origin, upToZ)
      if (keepOffsetToOrigin === true) {
        const state = get()
        eHelper.set(state.pitch, state.yaw, 0, 'YXZ')
        computeOriginToCameraOffset(offsetHelper, state, eHelper, zToUp)
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
        eHelper.set(state.pitch, state.yaw, 0, 'YXZ')
        computeOriginToCameraOffset(offsetHelper, state, eHelper, zToUp)
        offsetHelper.x += x
        offsetHelper.y += y
        offsetHelper.z += z
        buildCameraPositionUpdate(update, offsetHelper.x, offsetHelper.y, offsetHelper.z, origin, upToZ)
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
