import { Camera, useFrame, useStore, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { PerspectiveCamera, Quaternion, Vector2, Vector3, Vector3Tuple } from 'three'
import { StoreApi } from 'zustand'
import {
  computeOrbitCameraTransformation,
  createOrbitHandlesStore,
  defaultOrbitHandlesApply,
  OrbitHandlesState,
  useApplyOrbitHandlesState,
} from './index.js'
import { useScreenHandleStore } from './store.js'

const vector2Helper = new Vector2()

export type OrbitPanHandleProperties = { speed?: number; enabled?: boolean } | boolean

const vectorHelper = new Vector3()
const resultHelper = new Vector3()
const quaternionHelper = new Quaternion()

export function useOrbitPanHandle(
  properties: OrbitPanHandleProperties = true,
  providedStore: StoreApi<OrbitHandlesState>,
  apply = defaultOrbitHandlesApply,
  applyOrbitHandlesStateToCamera?: Camera | false,
) {
  const store = useMemo(() => providedStore ?? createOrbitHandlesStore(), [providedStore])
  const speed = (typeof properties === 'boolean' ? undefined : properties.speed) ?? 1
  const speedRef = useRef(speed)
  speedRef.current = speed

  const applyRef = useRef(apply)
  applyRef.current = apply

  const enabled = (typeof properties === 'boolean' ? properties : properties.enabled) ?? true

  const canvas = useThree((s) => s.gl.domElement)
  useEffect(
    () => (enabled ? canvas.addEventListener('contextmenu', (e) => e.preventDefault()) : undefined),
    [enabled, canvas],
  )

  const fiberStore = useStore()

  useScreenHandleStore<Readonly<Vector3Tuple>>(
    (initial, map) => {
      if (map.size === 1) {
        const [p] = map.values()
        if (p.latestEvent.buttons != 2) {
          return
        }
        vector2Helper.copy(p.currentScreenPosition).sub(p.initialScreenPosition)
      } else {
        const [p1, p2] = map.values()
        vector2Helper
          .copy(p1.currentScreenPosition)
          .add(p2.currentScreenPosition)
          .sub(p1.initialScreenPosition)
          .sub(p2.initialScreenPosition)
          .multiplyScalar(0.5)
      }
      const state = store.getState()

      const camera = fiberStore.getState().camera
      const cameraHeightAtDistance =
        camera instanceof PerspectiveCamera
          ? state.distance * 2 * Math.tan(((camera.fov / 2) * Math.PI) / 180.0)
          : (camera.top - camera.bottom) / camera.zoom

      resultHelper.set(...initial)

      vector2Helper.multiplyScalar(-0.5 * speedRef.current * cameraHeightAtDistance)
      computeOrbitCameraTransformation(state, undefined, quaternionHelper)

      const cameraRatio =
        camera instanceof PerspectiveCamera
          ? camera.aspect
          : (camera.right - camera.left) / (camera.top - camera.bottom)

      //x
      vectorHelper
        .set(1, 0, 0)
        .applyQuaternion(quaternionHelper)
        .multiplyScalar(vector2Helper.x * cameraRatio)
      resultHelper.add(vectorHelper)

      //y
      vectorHelper.set(0, 1, 0).applyQuaternion(quaternionHelper).multiplyScalar(vector2Helper.y)
      resultHelper.add(vectorHelper)

      applyRef.current({ origin: resultHelper.toArray() }, store)
    },
    () => store.getState().origin,
    [store, fiberStore],
    enabled,
  )

  useApplyOrbitHandlesState(
    store,
    applyOrbitHandlesStateToCamera === false ? undefined : applyOrbitHandlesStateToCamera,
    applyOrbitHandlesStateToCamera !== false,
  )
}
