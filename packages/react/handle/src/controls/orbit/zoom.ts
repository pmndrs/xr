import { Object3D, Object3DEventMap } from 'three'
import { StoreApi } from 'zustand'
import {
  OrbitHandlesState,
  createOrbitHandlesStore,
  defaultOrbitHandlesApply,
  useApplyOrbitHandlesState,
} from './index.js'
import { getVoidObject, PointerEventsMap, WheelEvent } from '@pmndrs/pointer-events'
import { Camera, useThree } from '@react-three/fiber'
import { useMemo, useRef, useEffect } from 'react'
import { useScreenHandleStore } from './store.js'

export type OrbitZoomHandleProperties = { speed?: number; enabled?: boolean } | boolean

export function useOrbitZoomHandle(
  properties: OrbitZoomHandleProperties = true,
  providedStore: StoreApi<OrbitHandlesState>,
  apply = defaultOrbitHandlesApply,
  applyOrbitHandlesStateToCamera?: Camera | false,
) {
  const store = useMemo(() => providedStore ?? createOrbitHandlesStore(), [providedStore])
  const voidObject = useThree((s) => getVoidObject(s.scene) as Object3D<PointerEventsMap & Object3DEventMap>)
  const speed = (typeof properties === 'boolean' ? undefined : properties.speed) ?? 1
  const speedRef = useRef(speed)
  speedRef.current = speed

  const applyRef = useRef(apply)
  applyRef.current = apply

  const enabled = (typeof properties === 'boolean' ? properties : properties.enabled) ?? true

  useEffect(() => {
    if (!enabled) {
      return
    }

    const onWheel = (e: WheelEvent) => {
      applyRef.current(
        {
          distance: store.getState().distance / Math.pow(0.95, speedRef.current * e.deltaY * 0.01),
        },
        store,
      )
    }
    voidObject.addEventListener('wheel', onWheel)
    return () => voidObject.removeEventListener('wheel', onWheel)
  }, [voidObject, enabled, store])

  useScreenHandleStore(
    (initialDistance, map) => {
      if (map.size < 2) {
        return
      }
      const [p1, p2] = map.values()
      const initialPointerDistance = p1.initialScreenPosition.distanceTo(p2.initialScreenPosition)
      const currentPointerDistance = p1.currentScreenPosition.distanceTo(p2.currentScreenPosition)
      applyRef.current(
        {
          distance: (initialDistance * initialPointerDistance) / currentPointerDistance,
        },
        store,
      )
    },
    () => store.getState().distance,
    [store],
    enabled,
  )

  useApplyOrbitHandlesState(
    store,
    applyOrbitHandlesStateToCamera === false ? undefined : applyOrbitHandlesStateToCamera,
    applyOrbitHandlesStateToCamera !== false,
  )
}
