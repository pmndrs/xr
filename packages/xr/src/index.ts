import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export const DefaultGltfLoader = new GLTFLoader()
export const DefaultAssetBasePath = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/'

export {
  getXRControllerComponentObject,
  configureXRControllerModel,
  createUpdateXRControllerVisuals,
  loadXRControllerModel,
  type XRControllerModelOptions,
  type XRControllerComponent,
  type XRControllerGamepadComponentId,
  type XRControllerGamepadComponentState,
  type XRControllerGamepadState,
  type XRControllerLayout,
  type XRControllerLayoutLoader,
  type XRControllerLayoutLoaderOptions,
  type XRControllerVisualResponse,
} from './controller/index.js'
export type { XRHandInputSource, XRHandLoaderOptions, XRHandPoseState, XRHandPoseUrls } from './hand/index.js'
export {
  type XRControllerState,
  type XRHandState,
  type XRGazeState,
  type XRInputSourceState,
  type XRScreenInputState,
  type XRTransientPointerState,
  isXRInputSourceState,
} from './input.js'
export type { WithRecord, XRElementImplementations, XRState, XRStore, XRStoreOptions } from './store.js'
export * from './visible.js'
export * from './pointer/index.js'
export type * from './default.js'
export * from './vanilla/index.js'
export * from './misc.js'
export * from './teleport.js'
export * from './hit-test.js'
export * from './anchor.js'
export * from './layer.js'
