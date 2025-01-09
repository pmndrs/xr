import { Euler, Quaternion, Vector3, Vector3Tuple } from 'three'
import { OrbitRotateHandleProperties, useOrbitRotateHandle } from './rotate.js'
import { createStore, StoreApi } from 'zustand'
import { Camera, useStore, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { OrbitZoomHandleProperties, useOrbitZoomHandle } from './zoom.js'
import { OrbitPanHandleProperties, useOrbitPanHandle } from './pan.js'

export type OrbitHandlesProperties = {
  camera?: Camera
  rotation?: OrbitRotateHandleProperties
  zoom?: OrbitZoomHandleProperties
  pan?: OrbitPanHandleProperties
  store?: StoreApi<OrbitHandlesState>
  apply?(newState: Partial<OrbitHandlesState>, store: StoreApi<OrbitHandlesState>): void
}

export const defaultOrbitHandlesApply: Exclude<OrbitHandlesProperties['apply'], undefined> = (newState, store) => {
  store.setState(newState)
}

export type OrbitHandlesState = {
  distance: number
  origin: Readonly<Vector3Tuple>
  rotationY: number
  rotationX: number
}

const v1Helper = new Vector3()
const v2Helper = new Vector3()
const eHelper = new Euler()
const qHelper = new Quaternion()

export function createOrbitHandlesStore({
  distance = 5,
  origin = [0, 0, 0],
  rotationX = 0,
  rotationY = 0,
}: Partial<OrbitHandlesState> = {}) {
  return createStore<
    OrbitHandlesState & { setPositionAndOrigin: (position: Vector3Tuple, origin: Vector3Tuple) => void }
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

export function useOrbitHandles({
  apply = defaultOrbitHandlesApply,
  rotation,
  zoom,
  pan,
  store: providedStore,
  camera,
}: OrbitHandlesProperties) {
  const fiberStore = useStore()
  const store = useMemo(() => {
    if (providedStore != null) {
      return providedStore
    }
    const newStore = createOrbitHandlesStore()
    newStore.getState().setPositionAndOrigin((camera ?? fiberStore.getState().camera).position.toArray(), [0, 0, 0])
    return newStore
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providedStore])
  useOrbitRotateHandle(rotation, store, apply, false)
  useOrbitZoomHandle(zoom, store, apply, false)
  useOrbitPanHandle(pan, store, apply, false)
  useApplyOrbitHandlesState(store, camera)
}

export function OrbitHandles(props: OrbitHandlesProperties) {
  useOrbitHandles(props)
  return null
}

/**
 * @deprecated use OrbitHandles instead
 */
export const OrbitControls = OrbitHandles

const eulerHelper = new Euler()
const quaternionHelper = new Quaternion()
const negZAxis = new Vector3(0, 0, -1)
const cameraRotationOffset = new Quaternion().setFromAxisAngle({ x: 0, y: 1, z: 0 }, Math.PI)
const vectorHelper = new Vector3()

export function computeOrbitCameraTransformation(
  state: OrbitHandlesState,
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

export function useApplyOrbitHandlesState(
  store: StoreApi<OrbitHandlesState>,
  providedCamera?: Camera,
  enabled: boolean = true,
) {
  const camera = useThree((s) => providedCamera ?? s.camera)
  useEffect(() => {
    if (!enabled) {
      return
    }
    const fn = (state: OrbitHandlesState) => computeOrbitCameraTransformation(state, camera.position, camera.quaternion)
    fn(store.getState())
    return store.subscribe(fn)
  }, [camera, store, enabled])
}
