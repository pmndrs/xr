import {
  applyDampedScreenCameraState,
  applyScreenCameraState,
  defaultMapHandlesScreenCameraApply,
  defaultOrbitHandlesScreenCameraApply,
  defaultScreenCameraApply,
  filterForOnePointerLeftClick,
  filterForOnePointerRightClickOrTwoPointer,
  MapHandles as MapHandlesImpl,
  OrbitHandles as OrbitHandlesImpl,
  ScreenCameraStateAndFunctions,
} from '@pmndrs/handle'
import { Camera, useFrame, useStore, useThree } from '@react-three/fiber'
import { useRef, useCallback, useMemo, useEffect } from 'react'
import type { StoreApi } from 'zustand'

export type ScreenHandlesProperties = {
  damping?: boolean | number
  camera?: Camera
  rotate?: { speed?: number; filter?: typeof filterForOnePointerLeftClick } | boolean
  zoom?: { speed?: number; filter?: typeof filterForOnePointerLeftClick } | boolean
  pan?: { speed?: number; filter?: typeof filterForOnePointerLeftClick } | boolean
  store?: StoreApi<ScreenCameraStateAndFunctions>
  apply?: typeof defaultScreenCameraApply
  disabled?: boolean
}

function useScreenHandles(
  HandlesClass: typeof OrbitHandlesImpl | typeof MapHandlesImpl,
  defaultRotateFilter: typeof filterForOnePointerLeftClick,
  defaultPanFilter: typeof filterForOnePointerLeftClick,
  defaultRotateCustomApply: typeof defaultOrbitHandlesScreenCameraApply,
  {
    apply,
    rotate,
    zoom,
    pan,
    store: providedStore,
    camera: providedCamera,
    damping,
    disabled,
  }: ScreenHandlesProperties,
) {
  const fiberStore = useStore()
  const cameraRef = useRef(providedCamera)
  cameraRef.current = providedCamera
  const getCamera = useCallback(() => cameraRef.current ?? fiberStore.getState().camera, [fiberStore])
  const canvas = useThree((s) => s.gl.domElement)
  const handles = useMemo(
    () => new HandlesClass(canvas, getCamera, providedStore),
    [canvas, HandlesClass, getCamera, providedStore],
  )

  useApplyScreenCameraState(handles.getStore(), disabled, damping, providedCamera)

  useFrame((_, deltaTime) => handles.update(deltaTime * 1000))
  const scene = useThree((s) => s.scene)
  //pan
  const panEnabled = !disabled && (typeof pan === 'boolean' ? pan : true)
  useEffect(() => (panEnabled ? handles.pan.bind(scene) : undefined), [handles, panEnabled, scene])
  handles.pan.customApply = apply
  handles.pan.speed = typeof pan === 'boolean' ? undefined : pan?.speed
  handles.pan.filter = (typeof pan === 'boolean' ? undefined : pan?.filter) ?? defaultPanFilter

  //rotate
  const rotateEnabled = !disabled && (typeof rotate === 'boolean' ? rotate : true)
  useEffect(() => (rotateEnabled ? handles.rotate.bind(scene) : undefined), [handles, rotateEnabled, scene])
  handles.rotate.customApply = apply ?? defaultRotateCustomApply
  handles.rotate.speed = typeof rotate === 'boolean' ? undefined : rotate?.speed
  handles.rotate.filter = (typeof rotate === 'boolean' ? undefined : rotate?.filter) ?? defaultRotateFilter

  //zoom
  const zoomEnabled = !disabled && (typeof zoom === 'boolean' ? zoom : true)
  useEffect(() => (zoomEnabled ? handles.zoom.bind(scene) : undefined), [handles, zoomEnabled, scene])
  handles.zoom.customApply = apply
  handles.zoom.speed = typeof zoom === 'boolean' ? undefined : zoom?.speed
  handles.zoom.filter = typeof zoom === 'boolean' ? undefined : zoom?.filter
}

export function useApplyScreenCameraState(
  store: StoreApi<ScreenCameraStateAndFunctions>,
  disabled: boolean = false,
  damping: boolean | number = false,
  camera?: Camera,
) {
  const fiberStore = useStore()
  const cameraRef = useRef(camera)
  cameraRef.current = camera
  const getCamera = useCallback(() => cameraRef.current ?? fiberStore.getState().camera, [fiberStore])
  const dampingEnabled = damping !== false
  useEffect(
    () => (!disabled && !dampingEnabled ? applyScreenCameraState(store, getCamera) : undefined),
    [dampingEnabled, disabled, getCamera, store],
  )
  const dampingRef = useRef(damping)
  dampingRef.current = damping
  const update = useMemo(
    () => applyDampedScreenCameraState(store, getCamera, () => dampingRef.current),
    [store, getCamera],
  )
  useFrame((_, deltaTime) => update(deltaTime * 1000))
}

export const useMapHandles = useScreenHandles.bind(
  null,
  MapHandlesImpl,
  filterForOnePointerRightClickOrTwoPointer,
  filterForOnePointerLeftClick,
  defaultMapHandlesScreenCameraApply,
)

export function MapHandles(props: ScreenHandlesProperties) {
  useMapHandles(props)
  return null
}

/**
 * @deprecated use MapHandles instead
 */
export const MapControls = MapHandles

export const useOrbitHandles = useScreenHandles.bind(
  null,
  OrbitHandlesImpl,
  filterForOnePointerLeftClick,
  filterForOnePointerRightClickOrTwoPointer,
  defaultOrbitHandlesScreenCameraApply,
)

export function OrbitHandles(props: ScreenHandlesProperties) {
  useOrbitHandles(props)
  return null
}

/**
 * @deprecated use OrbitHandles instead
 */
export const OrbitControls = OrbitHandles

export {
  createScreenCameraStore,
  type ScreenCameraStateAndFunctions,
  defaultMapHandlesScreenCameraApply,
  defaultOrbitHandlesScreenCameraApply,
  defaultScreenCameraApply,
  filterForOnePointerLeftClick,
  filterForOnePointerRightClickOrTwoPointer,
} from '@pmndrs/handle'
