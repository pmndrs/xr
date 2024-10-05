import { Camera, Object3D, OrthographicCamera, PerspectiveCamera, WebXRManager } from 'three'
import { XRStore, XRStoreOptions, createXRStore as createXRStoreImpl } from '../store.js'
import { setupSyncXRElements } from './elements.js'
import type {
  XRControllerState,
  XRGazeState,
  XRHandState,
  XRScreenInputState,
  XRTransientPointerState,
} from '../input.js'
import { ForwardEventsOptions, forwardHtmlEvents, GetCamera } from '@pmndrs/pointer-events'
import {
  DefaultXRControllerOptions,
  DefaultXRGazeOptions,
  DefaultXRHandOptions,
  DefaultXRScreenInputOptions,
  DefaultXRTransientPointerOptions,
} from '../default.js'

export type XRElementImplementationCleanup = (() => void) | void

export type XRUpdatesList = Array<(frame: XRFrame, delta: number) => void>

export type XRElementImplementations = {
  hand:
    | ((
        store: XRStore<XRElementImplementations>,
        handSpace: Object3D,
        state: XRHandState,
        session: XRSession,
      ) => XRElementImplementationCleanup)
    | boolean
    | DefaultXRHandOptions
  gaze:
    | ((
        store: XRStore<XRElementImplementations>,
        handSpace: Object3D,
        state: XRGazeState,
        session: XRSession,
      ) => XRElementImplementationCleanup)
    | boolean
    | DefaultXRGazeOptions
  screenInput:
    | ((
        store: XRStore<XRElementImplementations>,
        handSpace: Object3D,
        state: XRScreenInputState,
        session: XRSession,
      ) => XRElementImplementationCleanup)
    | boolean
    | DefaultXRScreenInputOptions
  transientPointer:
    | ((
        store: XRStore<XRElementImplementations>,
        handSpace: Object3D,
        state: XRTransientPointerState,
        session: XRSession,
      ) => XRElementImplementationCleanup)
    | boolean
    | DefaultXRTransientPointerOptions
  controller:
    | ((
        store: XRStore<XRElementImplementations>,
        controllerSpace: Object3D,
        state: XRControllerState,
        session: XRSession,
      ) => XRElementImplementationCleanup)
    | boolean
    | DefaultXRControllerOptions
  detectedPlane:
    | ((
        store: XRStore<XRElementImplementations>,
        detectedPlaneSpace: Object3D,
        plane: XRPlane,
        session: XRSession,
      ) => XRElementImplementationCleanup)
    | false
  detectedMesh:
    | ((
        store: XRStore<XRElementImplementations>,
        detecedMeshSpace: Object3D,
        mesh: XRMesh,
        session: XRSession,
      ) => XRElementImplementationCleanup)
    | false
}

export function createXRStore(
  canvas: HTMLCanvasElement,
  scene: Object3D,
  getCamera: GetCamera,
  xr: WebXRManager,
  options?: XRStoreOptions<XRElementImplementations> & { htmlInput?: ForwardEventsOptions | false },
) {
  const cleanupHtmlEventForward =
    options?.htmlInput === false ? undefined : forwardHtmlEvents(canvas, getCamera, scene, options?.htmlInput)
  const updatesList: XRUpdatesList = []
  const store = createXRStoreImpl<XRElementImplementations>(options)
  store.setWebXRManager(xr)
  let cleanupSyncElements: (() => void) | undefined
  const unsubscribeOrigin = store.subscribe((state, prevState) => {
    if (state.origin === prevState.origin) {
      return
    }
    cleanupSyncElements?.()
    cleanupSyncElements =
      state.origin != null ? setupSyncXRElements(scene, getCamera, store, state.origin, updatesList) : undefined
  })
  return Object.assign(store, {
    destroy() {
      unsubscribeOrigin()
      cleanupHtmlEventForward?.()
      cleanupSyncElements?.()
      store.destroy()
    },
    update(frame: XRFrame | undefined, delta: number) {
      if (frame == null) {
        return
      }
      store.onBeforeFrame(scene, getCamera(), frame)
      const length = updatesList.length
      for (let i = 0; i < length; i++) {
        updatesList[i](frame, delta)
      }
      store.onBeforeRender()
    },
  })
}
