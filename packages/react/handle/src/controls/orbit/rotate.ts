import { getVoidObject, PointerEventsMap } from '@pmndrs/pointer-events'
import { Camera, useStore, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Object3D, Object3DEventMap, Vector2, Vector2Tuple } from 'three'
import { StoreApi } from 'zustand'
import {
  createOrbitHandlesStore,
  defaultOrbitHandlesApply,
  OrbitHandlesState,
  useApplyOrbitHandlesState,
} from './index.js'
import { useScreenHandleStore } from './store.js'

const vector2Helper = new Vector2()

export type OrbitRotateHandleProperties = { speed?: number; enabled?: boolean } | boolean

export function useOrbitRotateHandle(
  properties: OrbitRotateHandleProperties = true,
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
  const fiberStore = useStore()

  useScreenHandleStore<Readonly<Vector2Tuple>>(
    ([initialRotationX, initialRotationY], map) => {
      if (map.size > 1) {
        return
      }
      const [p] = map.values()
      if (p.latestEvent.buttons !== 1) {
        return
      }
      vector2Helper
        .copy(p.currentScreenPosition)
        .sub(p.initialScreenPosition)
        .multiplyScalar(-Math.PI * speedRef.current)

      apply(
        {
          rotationX: vector2Helper.y + initialRotationX,
          rotationY: vector2Helper.x * fiberStore.getState().viewport.aspect + initialRotationY,
        },
        store,
      )
    },
    () => [store.getState().rotationX, store.getState().rotationY],
    [store, fiberStore],
    enabled,
  )

  useApplyOrbitHandlesState(
    store,
    applyOrbitHandlesStateToCamera === false ? undefined : applyOrbitHandlesStateToCamera,
    applyOrbitHandlesStateToCamera !== false,
  )
}
