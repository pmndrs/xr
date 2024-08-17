import {
  XRState as BaseXRState,
  XRStore as BaseXRStore,
  XRStoreOptions as BaseXRStoreOptions,
  createXRStore as createXRStoreImpl,
  DefaultXRHandOptions,
  DefaultXRControllerOptions,
  DefaultXRTransientPointerOptions,
  DefaultXRGazeOptions,
  DefaultXRScreenInputOptions,
} from '@pmndrs/xr/internals'
import { Camera, useFrame, useThree, useStore as useRootStore } from '@react-three/fiber'
import { ComponentType, ReactNode, useContext, useEffect } from 'react'
import { useStore } from 'zustand'
import { xrContext } from './contexts.js'
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
 * starting point for each XR application
 * allows to configure the session's features and defaults such as what controllers are rendered and how they can interact with the scene
 * @returns an xr store
 */
export function createXRStore(options?: XRStoreOptions) {
  return createXRStoreImpl<XRElementImplementation>(options)
}

export type XRProperties = {
  children?: ReactNode
  store: XRStore
}

/**
 * core XR component for connectin the xr store with the scene
 * requires the xr store which it will provide to its children
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
      <XRElements />
      {children}
    </xrContext.Provider>
  )
}

/**
 * hook for getting the xr store from the context
 */
export function useXRStore() {
  const store = useContext(xrContext)
  if (store == null) {
    throw new Error(`XR features can only be used inside the <XR> component`)
  }
  return store
}

/**
 * hook for reading the state from the xr store
 */
export function useXR<T = XRState>(
  selector: (s: XRState) => T = (state) => state as unknown as T,
  equalityFn?: (a: T, b: T) => boolean,
) {
  return useStore(useXRStore(), selector, equalityFn)
}
