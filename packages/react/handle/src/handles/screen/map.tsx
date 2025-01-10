import { useScreenCameraRotateHandle } from './rotate.js'
import { StoreApi } from 'zustand'
import { Camera, useStore } from '@react-three/fiber'
import { useMemo } from 'react'
import { useScreenCameraZoomHandle } from './zoom.js'
import { useScreenCameraPanHandle } from './pan.js'
import {
  createScreenCameraStore,
  defaultScreenCameraApply,
  ScreenCameraState,
  useApplyScreenCameraState,
} from './camera.js'
import { filterForOnePointerLeftClick, filterForOnePointerRightClickOrTwoPointer } from './index.js'

export type MapHandlesProperties = {
  camera?: Camera
  rotation?: { speed?: number; enabled?: boolean } | boolean
  zoom?: { speed?: number; enabled?: boolean } | boolean
  pan?: { speed?: number; enabled?: boolean } | boolean
  store?: StoreApi<ScreenCameraState>
  apply?: typeof defaultScreenCameraApply
  enabled?: boolean
}

export function useMapHandles({
  apply = defaultScreenCameraApply,
  rotation,
  zoom,
  pan,
  store: providedStore,
  camera,
  enabled,
}: MapHandlesProperties) {
  const fiberStore = useStore()
  const store = useMemo(() => {
    if (providedStore != null) {
      return providedStore
    }
    const newStore = createScreenCameraStore()
    newStore.getState().setPositionAndOrigin((camera ?? fiberStore.getState().camera).position.toArray(), [0, 0, 0])
    return newStore
  }, [camera, fiberStore, providedStore])
  useScreenCameraRotateHandle(
    store,
    filterForOnePointerRightClickOrTwoPointer,
    typeof rotation === 'boolean' ? undefined : rotation?.speed,
    enabled && ((typeof rotation === 'boolean' ? rotation : rotation?.enabled) ?? true),
    apply,
  )
  useScreenCameraZoomHandle(
    store,
    typeof zoom === 'boolean' ? undefined : zoom?.speed,
    enabled && ((typeof zoom === 'boolean' ? zoom : zoom?.enabled) ?? true),
    true,
    apply,
  )
  useScreenCameraPanHandle(
    store,
    filterForOnePointerLeftClick,
    typeof pan === 'boolean' ? undefined : pan?.speed,
    enabled && ((typeof pan === 'boolean' ? pan : pan?.enabled) ?? true),
    'xz',
    apply,
  )
  useApplyScreenCameraState(store, camera, enabled)
}

export function MapHandles(props: MapHandlesProperties) {
  useMapHandles(props)
  return null
}

/**
 * @deprecated use MapHandles instead
 */
export const MapControls = MapHandles
