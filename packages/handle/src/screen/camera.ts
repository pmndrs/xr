import { ArrayCamera, Euler, Object3D, Quaternion, Vector3, Vector3Tuple } from 'three'
import { damp } from 'three/src/math/MathUtils.js'
import { createStore, StoreApi } from 'zustand/vanilla'

const zAxis = new Vector3(0, 0, 1)
const yAxis = new Vector3(0, 1, 0)

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
  cameraDistanceToOrigin: number,
  cameraRotation: Euler,
  zToUp: Quaternion,
): void {
  target.copy(zAxis).applyEuler(cameraRotation).applyQuaternion(zToUp).multiplyScalar(cameraDistanceToOrigin)
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

const vectorHelper = new Vector3()

const zToUpHelper = new Quaternion()

export function computeScreenCameraStoreTransformation(
  pitch: number,
  yaw: number,
  cameraDistanceToOrigin: number,
  origin: Readonly<Vector3Tuple>,
  position?: Vector3,
  rotation?: Quaternion,
  up = Object3D.DEFAULT_UP,
) {
  zToUpHelper.setFromUnitVectors(yAxis, up)
  eHelper.set(pitch, yaw, 0, 'YXZ')
  if (position != null) {
    computeOriginToCameraOffset(position, cameraDistanceToOrigin, eHelper, zToUpHelper)
    const [x, y, z] = origin
    position.x += x
    position.y += y
    position.z += z
  }
  if (rotation != null) {
    rotation.setFromEuler(eHelper).premultiply(zToUpHelper)
  }
}

export function createScreenCameraStore(
  { distance = 5, origin = [0, 0, 0], pitch: rotationX = 0, yaw: rotationY = 0 }: Partial<ScreenCameraState> = {},
  up = Object3D.DEFAULT_UP,
) {
  const upToZ = new Quaternion().setFromUnitVectors(up, yAxis)
  const zToUp = upToZ.clone().invert()
  return createStore<ScreenCameraStateAndFunctions>((set, get) => ({
    distance,
    origin,
    pitch: rotationX,
    yaw: rotationY,
    activeHandle: undefined,
    getCameraTransformation(position, rotation) {
      const { pitch, distance, yaw, origin } = get()
      computeScreenCameraStoreTransformation(pitch, yaw, distance, origin, position, rotation, up)
    },
    setCameraPosition(x, y, z, keepOffsetToOrigin = false) {
      const update: Partial<ScreenCameraState> = {}
      buildCameraPositionUpdate(update, x, y, z, get().origin, upToZ)
      if (keepOffsetToOrigin === true) {
        const state = get()
        eHelper.set(state.pitch, state.yaw, 0, 'YXZ')
        computeOriginToCameraOffset(vectorHelper, state.distance, eHelper, zToUp)
        vectorHelper.x -= x
        vectorHelper.y -= y
        vectorHelper.z -= z
        update.origin = vectorHelper.toArray()
      }
      set(update)
    },
    setOriginPosition(x, y, z, keepOffsetToCamera = false) {
      const origin: Vector3Tuple = [x, y, z]
      const update: Partial<ScreenCameraState> = {
        origin,
      }
      if (keepOffsetToCamera === false) {
        const { pitch, distance, origin: oldOrigin, yaw } = get()
        computeScreenCameraStoreTransformation(pitch, yaw, distance, oldOrigin, vectorHelper, undefined, up)
        buildCameraPositionUpdate(update, vectorHelper.x, vectorHelper.y, vectorHelper.z, origin, upToZ)
      }
      set(update)
    },
  }))
}

export function applyScreenCameraState(
  store: StoreApi<ScreenCameraStateAndFunctions>,
  getTarget: () => Object3D | undefined | null,
) {
  const fn = (state: ScreenCameraStateAndFunctions) => {
    const target = getTarget()
    if (target == null) {
      return
    }
    state.getCameraTransformation(target.position, target.quaternion)
  }
  fn(store.getState())
  return store.subscribe(fn)
}

export function applyDampedScreenCameraState(
  store: StoreApi<ScreenCameraStateAndFunctions>,
  getTarget: () => Object3D | undefined | null,
  getDamping: () => number | boolean,
  up = Object3D.DEFAULT_UP,
) {
  let {
    distance,
    yaw,
    origin: [originX, originY, originZ],
    pitch,
  } = store.getState()

  return (deltaTime: number) => {
    const target = getTarget()
    //if the target is a array camera (which is used for XR stuff, we dont apply)
    if (target == null || target instanceof ArrayCamera) {
      return
    }
    let damping = getDamping()
    if (damping === false) {
      return
    }
    if (damping === true) {
      damping = 0.01
    }
    const {
      distance: targetDistance,
      yaw: targetYaw,
      origin: [targetOriginX, targetOriginY, targetOriginZ],
      pitch: targetPitch,
    } = store.getState()
    distance = damp(distance, targetDistance, damping, deltaTime)
    let angleDistance: number
    while (Math.abs((angleDistance = targetYaw - yaw)) > Math.PI) {
      yaw += (angleDistance > 0 ? 2 : -2) * Math.PI
    }
    yaw = damp(yaw, targetYaw, damping, deltaTime)
    pitch = damp(pitch, targetPitch, damping, deltaTime)
    originX = damp(originX, targetOriginX, damping, deltaTime)
    originY = damp(originY, targetOriginY, damping, deltaTime)
    originZ = damp(originZ, targetOriginZ, damping, deltaTime)
    computeScreenCameraStoreTransformation(
      pitch,
      yaw,
      distance,
      [originX, originY, originZ],
      target.position,
      target.quaternion,
      up,
    )
  }
}
