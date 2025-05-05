import { CombinedPointer } from '@pmndrs/pointer-events'
import { setupSyncIsVisible } from '@pmndrs/xr'
import {
  XRState as BaseXRState,
  XRStore as BaseXRStore,
  XRStoreOptions as BaseXRStoreOptions,
  createXRStore as createXRStoreImpl,
  DefaultXRControllerOptions,
  DefaultXRGazeOptions,
  DefaultXRHandOptions,
  DefaultXRScreenInputOptions,
  DefaultXRTransientPointerOptions,
} from '@pmndrs/xr/internals'
import { Camera, useFrame, useStore as useRootStore, useThree } from '@react-three/fiber'
import { ComponentType, ReactNode, useContext, useEffect, useMemo } from 'react'
import { useStore } from 'zustand'
import { combinedPointerContext, xrContext } from './contexts.js'
import { XRElements } from './elements.js'

type XRElementImplementation = {
  /**
   * @default true
   */
  hand: ComponentType | boolean | DefaultXRHandOptions
  /**
   * @default true
   */
  controller: ComponentType | boolean | DefaultXRControllerOptions
  /**
   * @default true
   */
  transientPointer: ComponentType | boolean | DefaultXRTransientPointerOptions
  /**
   * @default true
   */
  gaze: ComponentType | boolean | DefaultXRGazeOptions
  /**
   * @default true
   */
  screenInput: ComponentType | boolean | DefaultXRScreenInputOptions
  /**
   * @default false
   */
  detectedMesh: ComponentType | false
  /**
   * @default false
   */
  detectedPlane: ComponentType | false
}

export type XRStore = BaseXRStore<XRElementImplementation>

export type XRStoreOptions = BaseXRStoreOptions<XRElementImplementation>

export type XRState = BaseXRState<XRElementImplementation>

/**
 * Starting point for each XR application.
 * Allows to configure the session's features and defaults such as what controllers are rendered and how they can interact with the scene
 * @returns A new XR store
 */
export function createXRStore(options?: XRStoreOptions) {
  return createXRStoreImpl<XRElementImplementation>(options)
}

export type XRProperties = {
  children?: ReactNode
  store: XRStore
}

/**
 * Core XR component for connecting the `XRStore` with the scene.
 * Requires the `XRStore` which it will provide to its children.
 */
export function XR({ children, store }: XRProperties) {
  store.setWebXRManager(useThree((s) => s.gl.xr))
  const rootStore = useRootStore()
  useEffect(() => {
    let initialCamera: Camera | undefined
    return store.subscribe((state, prevState) => {
      if (state.session === prevState.session) {
        return
      }
      //session has changed
      if (state.session != null) {
        const { camera, gl } = rootStore.getState()
        initialCamera = camera
        rootStore.setState({ camera: gl.xr.getCamera() })
        return
      }
      if (initialCamera == null) {
        //we always were in xr?
        return
      }
      rootStore.setState({ camera: initialCamera })
    })
  }, [rootStore, store])
  useFrame((state, _delta, frame) => store.onBeforeFrame(state.scene, state.camera, frame), -1000)
  useFrame(() => store.onBeforeRender())
  return (
    <xrContext.Provider value={store}>
      <RootCombinedPointer>
        <XRElements />
        {children}
      </RootCombinedPointer>
    </xrContext.Provider>
  )
}

/**
 * Component for hiding the xr context to all child components. Can be used to create virtual displays and similar allowing the components inside the display to think they are not inside an XR environment, making them behave like when outside XR.
 *
 * @param props `children`: `ReactNode` Children to be rendered inside the context.
 */
export function NotInXR({ children }: { children?: ReactNode }) {
  const emptyStore = useMemo(() => createXRStore(), [])
  return <xrContext.Provider value={emptyStore}>{children}</xrContext.Provider>
}

export function RootCombinedPointer({ children }: { children?: ReactNode }) {
  const store = useXRStore()
  const pointer = useMemo(() => new CombinedPointer(true), [])
  useEffect(
    () => setupSyncIsVisible(store, (visible) => pointer.setEnabled(visible, { timeStamp: performance.now() })),
    [store, pointer],
  )
  useFrame((state) => pointer.move(state.scene, { timeStamp: performance.now() }), -50)
  return <combinedPointerContext.Provider value={pointer}>{children}</combinedPointerContext.Provider>
}

/**
 * Hook for getting the xr store from the context
 */
export function useXRStore() {
  const store = useContext(xrContext)
  if (store == null) {
    throw new Error(`XR features can only be used inside the <XR> component`)
  }
  return store
}

/**
 * Hook for reading the state from the xr store
 */
export function useXR<T = XRState>(
  selector: (s: XRState) => T = (state) => state as unknown as T,
  equalityFn?: (a: T, b: T) => boolean,
) {
  return useStore(useXRStore(), selector, equalityFn)
}
