import { ReactNode, RefObject, forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import {
  CombinedPointer as CombinedPointerImpl,
  GrabPointerOptions,
  Pointer,
  RayPointerOptions,
  TouchPointerOptions,
  createGrabPointer,
  createRayPointer,
  createTouchPointer,
  defaultGrabPointerOptions,
  defaultRayPointerOptions,
  defaultTouchPointerOptions,
} from '@pmndrs/pointer-events'
import { Mesh, Object3D } from 'three'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import {
  PointerCursorMaterial,
  PointerCursorModelOptions,
  PointerRayMaterial,
  PointerRayModelOptions,
  bindPointerXRInputSourceEvent,
  updatePointerCursorModel,
  updatePointerRayModel,
} from '@pmndrs/xr/internals'
import { useXR, useXRStore } from './xr.js'
import { setupSyncIsVisible } from '@pmndrs/xr'
import { combinedPointerContext } from './contexts.js'

//for checking if `event.pointerState` is from an xr input source
export { type XRInputSourceState, isXRInputSourceState } from '@pmndrs/xr/internals'

/**
 * component for combining multiple pointer into one so that only one pointer is active at each time
 */
export function CombinedPointer({ children }: { children?: ReactNode }) {
  const pointer = useMemo(() => new CombinedPointerImpl(), [])
  usePointerXRSessionVisibility(pointer)
  useFrame((state) => pointer.move(state.scene, { timeStamp: performance.now() }), -50)
  return <combinedPointerContext.Provider value={pointer}>{children}</combinedPointerContext.Provider>
}

/**
 * hook for creating a grab pointer
 */
export function useGrabPointer(
  spaceRef: RefObject<Object3D>,
  pointerState: any,
  currentOptions?: GrabPointerOptions & { makeDefault?: boolean },
  pointerType?: string,
): Pointer {
  const options = useMemo<GrabPointerOptions>(() => ({}), [])
  Object.assign(options, defaultGrabPointerOptions, currentOptions)
  const pointer = useMemo(
    () => createGrabPointer(spaceRef, pointerState, options, pointerType),
    [spaceRef, pointerState, options, pointerType],
  )
  useSetupPointer(pointer, currentOptions?.makeDefault)
  return pointer
}

/**
 * hook for creating a ray pointer
 */
export function useRayPointer(
  spaceRef: RefObject<Object3D>,
  pointerState: any,
  currentOptions?: RayPointerOptions & { makeDefault?: boolean },
  pointerType?: string,
): Pointer {
  const options = useMemo<RayPointerOptions>(() => ({}), [])
  Object.assign(options, defaultRayPointerOptions, currentOptions)
  const pointer = useMemo(
    () => createRayPointer(spaceRef, pointerState, options, pointerType),
    [spaceRef, pointerState, options, pointerType],
  )
  useSetupPointer(pointer, currentOptions?.makeDefault)
  return pointer
}

/**
 * hook for creating a touch pointer
 */
export function useTouchPointer(
  spaceRef: RefObject<Object3D>,
  pointerState: any,
  currentOptions?: TouchPointerOptions & { makeDefault?: boolean },
  pointerType?: string,
): Pointer {
  const options = useMemo<TouchPointerOptions>(() => ({}), [])
  Object.assign(options, defaultTouchPointerOptions, currentOptions)
  const pointer = useMemo(
    () => createTouchPointer(spaceRef, pointerState, options, pointerType),
    [spaceRef, pointerState, options, pointerType],
  )
  useSetupPointer(pointer, currentOptions?.makeDefault)
  return pointer
}

/**
 * component for rendering a ray for a pointer
 */
export const PointerRayModel = forwardRef<Mesh, PointerRayModelOptions & { pointer: Pointer }>((props, ref) => {
  const material = useMemo(() => new PointerRayMaterial(), [])
  const internalRef = useRef<Mesh>(null)
  useImperativeHandle(ref, () => internalRef.current!, [])
  useFrame(
    () => internalRef.current != null && updatePointerRayModel(internalRef.current, material, props.pointer, props),
  )
  return (
    <mesh matrixAutoUpdate={false} renderOrder={props.renderOrder ?? 2} ref={internalRef} material={material}>
      <boxGeometry />
    </mesh>
  )
})

/**
 * component for rendering a cursor for a pointer
 */
export const PointerCursorModel = forwardRef<Mesh, PointerCursorModelOptions & { pointer: Pointer }>((props, ref) => {
  const material = useMemo(() => new PointerCursorMaterial(), [])
  const internalRef = useRef<Mesh>(null)
  useImperativeHandle(ref, () => internalRef.current!, [])
  useFrame(
    () => internalRef.current != null && updatePointerCursorModel(internalRef.current, material, props.pointer, props),
  )
  const scene = useThree((s) => s.scene)
  return createPortal(
    <mesh renderOrder={props.renderOrder ?? 1} ref={internalRef} matrixAutoUpdate={false} material={material}>
      <planeGeometry />
    </mesh>,
    scene,
  )
})

/**
 * hook for binding the xr session events such as `selectstart` to the provided pointer down/up events
 */
export function usePointerXRInputSourceEvents(
  pointer: Pointer,
  inputSource: XRInputSource,
  event: 'select' | 'squeeze',
  missingEvents: ReadonlyArray<XRInputSourceEvent>,
) {
  const session = useXR((xr) => xr.session)
  useEffect(() => {
    if (session == null) {
      return
    }
    return bindPointerXRInputSourceEvent(pointer, session, inputSource, event, missingEvents)
  }, [event, inputSource, pointer, session, missingEvents])
}

function useSetupPointer(pointer: Pointer, makeDefault: boolean = false) {
  const combinedPointer = useContext(combinedPointerContext)
  if (combinedPointer == null) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePointerXRSessionVisibility(pointer)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useFrame((state) => pointer.move(state.scene, { timeStamp: performance.now() }), -50)
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => combinedPointer.register(pointer, makeDefault), [combinedPointer, pointer, makeDefault])
  }
  useEffect(() => () => pointer.exit({ timeStamp: performance.now() }), [pointer])
}

function usePointerXRSessionVisibility(pointer: Pointer | CombinedPointerImpl) {
  const store = useXRStore()
  useEffect(
    () => setupSyncIsVisible(store, (visible) => pointer.setEnabled(visible, { timeStamp: performance.now() })),
    [store, pointer],
  )
}
