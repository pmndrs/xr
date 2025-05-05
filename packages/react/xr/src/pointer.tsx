import {
  CombinedPointer as CombinedPointerImpl,
  GrabPointerOptions,
  LinesPointerOptions,
  Pointer,
  RayPointerOptions,
  TouchPointerOptions,
  createGrabPointer,
  createLinesPointer,
  createRayPointer,
  createTouchPointer,
} from '@pmndrs/pointer-events'
import {
  PointerCursorMaterial,
  PointerCursorModelOptions,
  PointerRayMaterial,
  PointerRayModelOptions,
  bindPointerXRInputSourceEvent,
  updatePointerCursorModel,
  updatePointerRayModel,
} from '@pmndrs/xr/internals'
import { createPortal, useFrame, useStore, useThree } from '@react-three/fiber'
import { ReactNode, RefObject, forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { Group, Mesh, Object3D } from 'three'
import { combinedPointerContext } from './contexts.js'
import { useXR } from './xr.js'

//for checking if `event.pointerState` is from an xr input source
export { isXRInputSourceState, type XRInputSourceState } from '@pmndrs/xr/internals'

/**
 * Component for combining multiple Pointers into one so that only one pointer is active at a time
 * @param props `children`: `Pointer[]` Pointer components to combine
 */
export function CombinedPointer({ children }: { children?: ReactNode }) {
  const pointer = useMemo(() => new CombinedPointerImpl(false), [])
  useSetupPointer(pointer)
  return <combinedPointerContext.Provider value={pointer}>{children}</combinedPointerContext.Provider>
}

function clearObject(object: Record<string, unknown>): void {
  for (const key of Object.keys(object)) {
    delete object[key]
  }
}

/**
 * Hook for creating a grab pointer
 */
export function useGrabPointer(
  spaceRef: RefObject<Object3D | null>,
  pointerState: any,
  currentOptions?: GrabPointerOptions & { makeDefault?: boolean },
  pointerType?: string,
): Pointer {
  const options = useMemo<GrabPointerOptions>(() => ({}), [])
  clearObject(options)
  Object.assign(options, currentOptions)
  const store = useStore()
  const pointer = useMemo(
    () => createGrabPointer(() => store.getState().camera, spaceRef, pointerState, options, pointerType),
    [store, spaceRef, pointerState, options, pointerType],
  )
  useSetupPointer(pointer, currentOptions?.makeDefault)
  return pointer
}

/**
 * Hook for creating a ray pointer
 */
export function useRayPointer(
  spaceRef: RefObject<Object3D | null>,
  pointerState: any,
  currentOptions?: RayPointerOptions & { makeDefault?: boolean },
  pointerType?: string,
): Pointer {
  const options = useMemo<RayPointerOptions>(() => ({}), [])
  clearObject(options)
  Object.assign(options, currentOptions)
  const store = useStore()
  const pointer = useMemo(
    () => createRayPointer(() => store.getState().camera, spaceRef, pointerState, options, pointerType),
    [store, spaceRef, pointerState, options, pointerType],
  )
  useSetupPointer(pointer, currentOptions?.makeDefault)
  return pointer
}

/**
 * Hook for creating a ray pointer
 */
export function useLinesPointer(
  spaceRef: RefObject<Object3D | null>,
  pointerState: any,
  currentOptions?: LinesPointerOptions & { makeDefault?: boolean },
  pointerType?: string,
): Pointer {
  const options = useMemo<LinesPointerOptions>(() => ({}), [])
  clearObject(options)
  Object.assign(options, currentOptions)
  const store = useStore()
  const pointer = useMemo(
    () => createLinesPointer(() => store.getState().camera, spaceRef, pointerState, options, pointerType),
    [store, spaceRef, pointerState, options, pointerType],
  )
  useSetupPointer(pointer, currentOptions?.makeDefault)
  return pointer
}

/**
 * Hook for creating a touch pointer
 */
export function useTouchPointer(
  spaceRef: RefObject<Object3D | null>,
  pointerState: any,
  currentOptions?: TouchPointerOptions & { makeDefault?: boolean },
  pointerType?: string,
): Pointer {
  const options = useMemo<TouchPointerOptions>(() => ({}), [])
  clearObject(options)
  Object.assign(options, currentOptions)
  const store = useStore()
  const pointer = useMemo(
    () => createTouchPointer(() => store.getState().camera, spaceRef, pointerState, options, pointerType),
    [store, spaceRef, pointerState, options, pointerType],
  )
  useSetupPointer(pointer, currentOptions?.makeDefault)
  return pointer
}

/**
 * Component for rendering a ray for a pointer
 * @param props
 * * `materialClass`: Material to use for the ray
 * * `pointer`: Pointer to use for the ray
 * * `renderOrder`: Render order for the ray
 * @function
 */
export const PointerRayModel = forwardRef<Mesh, PointerRayModelOptions & { pointer: Pointer }>((props, ref) => {
  const material = useMemo(() => {
    const MaterialClass = props.materialClass ?? PointerRayMaterial
    return new MaterialClass()
  }, [props.materialClass])
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
 * Component for rendering a cursor as a pointer
 *
 * @param props
 * * `materialClass`: Class of the material to use for the cursor
 * * `pointer`: Pointer to use for the cursor
 * * `renderOrder`: Render order for the cursor
 * @function
 */
export const PointerCursorModel = forwardRef<Mesh, PointerCursorModelOptions & { pointer: Pointer }>((props, ref) => {
  const material = useMemo(() => {
    const MaterialClass = props.materialClass ?? PointerCursorMaterial
    return new MaterialClass()
  }, [props.materialClass])
  const internalRef = useRef<Mesh>(null)
  const groupRef = useRef<Group>(null)
  useImperativeHandle(ref, () => internalRef.current!, [])
  useFrame(
    () =>
      internalRef.current != null &&
      groupRef.current != null &&
      updatePointerCursorModel(groupRef.current, internalRef.current, material, props.pointer, props),
  )
  const scene = useThree((s) => s.scene)
  return (
    <>
      <group ref={groupRef} />
      {createPortal(
        <mesh renderOrder={props.renderOrder ?? 1} ref={internalRef} matrixAutoUpdate={false} material={material}>
          <planeGeometry />
        </mesh>,
        scene,
      )}
    </>
  )
})

/**
 * Hook for binding the xr session events such as `selectstart` to the provided pointer down/up events
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

function useSetupPointer(pointer: Pointer | CombinedPointerImpl, makeDefault: boolean = false) {
  const combinedPointer = useContext(combinedPointerContext)
  if (combinedPointer == null) {
    throw new Error(`xr pointers can only be used inside the XR component`)
  }
  useEffect(() => {
    const unregister = combinedPointer.register(pointer, makeDefault)
    return () => {
      unregister()
    }
  }, [combinedPointer, pointer, makeDefault])
  useEffect(() => {
    if (!(pointer instanceof Pointer)) {
      return
    }
    return () => pointer.exit({ timeStamp: performance.now() })
  }, [pointer])
}
