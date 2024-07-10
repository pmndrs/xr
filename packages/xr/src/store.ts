import { StoreApi, createStore } from 'zustand/vanilla'
import type { Camera, Object3D, Scene, WebXRManager } from 'three'
import { updateXRHandState } from './hand/state.js'
import { XRControllerLayoutLoaderOptions, updateXRControllerState } from './controller/index.js'
import { XRHandPoseUrls } from './hand/pose.js'
import { XRHandLoaderOptions } from './hand/index.js'
import { XRInputSourceStateMap, XRInputSourceStates, createSyncXRInputSourceStates } from './input.js'
import { XRSessionInitOptions, buildXRSessionInit } from './init.js'

export type XRState<T extends XRElementImplementations> = Readonly<
  {
    session?: XRSession
    visibilityState?: XRVisibilityState
    frameRate?: number
    mode: XRSessionMode | null
    detectedPlanes: ReadonlyArray<XRPlane>
    detectedMeshes: ReadonlyArray<XRMesh>
    origin?: Object3D
  } & WithRecord<T> &
    XRInputSourceStates
>

export type XRElementImplementations = {
  [Key in keyof XRInputSourceStateMap]: unknown
} & {
  detectedMesh: unknown
  detectedPlane: unknown
}

export type WithRecord<T extends XRElementImplementations> = {
  controller: T['controller'] | ({ [Key in XRHandedness]?: T['controller'] } & { default?: T['controller'] })
  transientPointer:
    | T['transientPointer']
    | ({ [Key in XRHandedness]?: T['transientPointer'] } & { default?: T['transientPointer'] })
  hand: T['hand'] | ({ [Key in XRHandedness]?: T['hand'] } & { default?: T['hand'] })
  gaze: T['gaze']
  screenInput: T['screenInput']
  detectedPlane:
    | T['detectedPlane']
    | ({ [Key in XRSemanticLabel]?: T['detectedPlane'] } & { default?: T['detectedPlane'] })
  detectedMesh: T['detectedMesh'] | ({ [Key in XRSemanticLabel]?: T['detectedMesh'] } & { default?: T['detectedMesh'] })
}

export function resolveInputSourceImplementation<T extends object | Function>(
  implementation: undefined | T | ({ [Key in XRHandedness]?: T | boolean } & { default?: T | boolean }) | boolean,
  handedness: XRHandedness | undefined,
  defaultValue: T | false,
): T | false {
  if (typeof implementation === 'function') {
    return implementation
  }
  if (typeof implementation === 'object') {
    if (handedness != null && hasKey(implementation, handedness)) {
      implementation = implementation[handedness] as T | boolean | undefined
    } else if ('default' in implementation) {
      implementation = implementation.default
    }
  }
  if (implementation === false) {
    return false
  }
  if (implementation === true) {
    return defaultValue
  }
  return (implementation as T | undefined) ?? defaultValue
}

function hasKey<Key extends string>(val: object, key: Key): val is { [K in Key]: unknown } {
  return key in val
}

export function resolveDetectedImplementation<T extends { [Key in XRSemanticLabel | 'default']?: never } | Function>(
  implementation: undefined | T | ({ [Key in XRSemanticLabel]?: T | false } & { default?: T | false }) | false,
  semanticLabel: XRSemanticLabel | undefined,
  defaultValue: T | false,
): T | false {
  implementation ??= defaultValue
  if (implementation === false) {
    return false
  }
  if (typeof implementation === 'function') {
    return implementation
  }
  if (semanticLabel != null && semanticLabel in implementation) {
    return implementation[semanticLabel] ?? defaultValue
  }
  if ('default' in implementation) {
    return implementation.default ?? defaultValue
  }
  return implementation as T
}

export type FrameBufferScalingOption =
  | undefined
  | number
  | ((maxFrameBufferScaling: number) => number | undefined)
  | 'high'
  | 'mid'
  | 'low'

export type FrameRateOption =
  | ((supportedFrameRates: ArrayLike<number>) => number | false)
  | 'high'
  | 'mid'
  | 'low'
  | false

export type XRStoreOptions<T extends XRElementImplementations> = {
  /**
   * @default undefined
   */
  foveation?: number
  /**
   * @default "high"
   */
  frameRate?: FrameRateOption
  /**
   * @default undefined
   */
  frameBufferScaling?: FrameBufferScalingOption
  /**
   * session modes that can be entered automatically without manually requesting a session when granted by the system
   * @default true
   */
  enterGrantedSession?: boolean | Array<XRSessionMode>
} & XRControllerLayoutLoaderOptions &
  XRHandLoaderOptions &
  Partial<WithRecord<T>> &
  XRSessionInitOptions

export type XRStore<T extends XRElementImplementations> = Omit<StoreApi<XRState<T>>, 'destroy'> & {
  setWebXRManager(xr: WebXRManager): void
  destroy(): void
  enterXR(mode: XRSessionMode, options?: XRSessionInitOptions): Promise<XRSession>
  enterAR(options?: XRSessionInitOptions): Promise<XRSession>
  enterVR(options?: XRSessionInitOptions): Promise<XRSession>
  onBeforeFrame(scene: Object3D, camera: Camera, frame: XRFrame | undefined): void
  setHand(implementation: T['hand'], handedness?: XRHandedness): void
  setController(implementation: T['controller'], handedness?: XRHandedness): void
  setGaze(implementation: T['gaze']): void
  setScreenInput(implementation: T['screenInput']): void
  setTransientPointer(implementation: T['transientPointer'], handedness?: XRHandedness): void
  setDetectedPlane(implementation: T['detectedPlane'], semanticLabel?: XRSemanticLabel): void
  setDetectedMesh(implementation: T['detectedMesh'], semanticLabel?: XRSemanticLabel): void
  setFrameRate(value: FrameRateOption): void
}

const baseInitialState: Omit<
  XRState<XRElementImplementations>,
  'hand' | 'controller' | 'gaze' | 'transientPointer' | 'screenInput' | 'detectedMesh' | 'detectedPlane'
> = {
  handStates: [],
  controllerStates: [],
  transientPointerStates: [],
  gazeStates: [],
  screenInputStates: [],
  detectedMeshes: [],
  detectedPlanes: [],
  mode: null,
}

export function createXRStore<T extends XRElementImplementations>(options?: XRStoreOptions<T>): XRStore<T> {
  //TODO nextFrameCallbacks for anchors

  const store = createStore<XRState<XRElementImplementations>>(() => ({
    ...baseInitialState,
    controller: options?.controller,
    hand: options?.hand,
    gaze: options?.gaze,
    screenInput: options?.screenInput,
    transientPointer: options?.transientPointer,
    detectedMesh: options?.detectedMesh,
    detectedPlane: options?.detectedPlane,
  }))

  const syncXRInputSourceStates = createSyncXRInputSourceStates(
    {
      controller: (state) => store.setState({ controllerStates: [...store.getState().controllerStates, state] }),
    },
    options,
  )
  const bindToSession = createBindToSession(store, syncXRInputSourceStates)
  const cleanupSessionGrantedListener = setupSessionGrantedListener(options?.enterGrantedSession, (mode) =>
    enterXR(mode, options, undefined, webxrManager),
  )
  let cleanupSessionStartListener: (() => void) | undefined

  let webxrManager: WebXRManager | undefined

  return Object.assign(store, {
    setWebXRManager(manager: WebXRManager) {
      if (webxrManager === manager) {
        return
      }
      webxrManager = manager
      const { referenceSpaceType = 'local-floor', foveation } = options ?? {}
      webxrManager.setReferenceSpaceType(referenceSpaceType)
      if (foveation != null) {
        webxrManager.setFoveation(foveation)
      }
      const { session } = store.getState()
      if (session != null) {
        setupXRManager(webxrManager, session, options)
      }
      cleanupSessionStartListener?.()
      cleanupSessionStartListener = setupSessionStartListener(manager, bindToSession)
    },
    setFrameRate(value: FrameRateOption) {
      const { session } = store.getState()
      if (session == null) {
        return
      }
      setFrameRate(session, value)
    },
    setHand(implementation: T['hand'], handedness?: XRHandedness) {
      if (handedness == null) {
        store.setState({ hand: implementation })
        return
      }
      const currentImplementation = store.getState().hand
      const newControllerImplementation = {}
      if (typeof currentImplementation === 'object') {
        Object.assign(newControllerImplementation, currentImplementation)
      }
      Object.assign(newControllerImplementation, {
        default: resolveInputSourceImplementation(currentImplementation as any, undefined, {}),
        [handedness]: implementation,
      })
      store.setState({
        hand: newControllerImplementation,
      })
    },
    setController(implementation: T['controller'], handedness?: XRHandedness) {
      if (handedness == null) {
        store.setState({ controller: implementation })
        return
      }
      const currentImplementation = store.getState().controller
      const newControllerImplementation = {}
      if (typeof currentImplementation === 'object') {
        Object.assign(newControllerImplementation, currentImplementation)
      }
      Object.assign(newControllerImplementation, {
        default: resolveInputSourceImplementation(currentImplementation as any, undefined, {}),
        [handedness]: implementation,
      })
      store.setState({
        controller: newControllerImplementation,
      })
    },
    setTransientPointer(implementation: T['transientPointer'], handedness?: XRHandedness) {
      if (handedness == null) {
        store.setState({ transientPointer: implementation })
        return
      }
      const currentImplementation = store.getState().transientPointer
      const newControllerImplementation = {}
      if (typeof currentImplementation === 'object') {
        Object.assign(newControllerImplementation, currentImplementation)
      }
      Object.assign(newControllerImplementation, {
        default: resolveInputSourceImplementation(currentImplementation as any, undefined, {}),
        [handedness]: implementation,
      })
      store.setState({
        transientPointer: newControllerImplementation,
      })
    },
    setGaze(implementation: T['gaze']) {
      store.setState({ gaze: implementation })
    },
    setScreenInput(implementation: T['screenInput']) {
      store.setState({ screenInput: implementation })
    },
    setDetectedPlane(implementation: T['detectedPlane'], semanticLabel?: XRSemanticLabel) {
      if (semanticLabel == null) {
        store.setState({ detectedPlane: implementation })
        return
      }
      const currentImplementation = store.getState().detectedPlane
      const newImplementation = {}
      if (typeof currentImplementation === 'object') {
        Object.assign(newImplementation, currentImplementation)
      }
      Object.assign(newImplementation, {
        default: resolveInputSourceImplementation(currentImplementation as any, undefined, {}),
        [semanticLabel]: implementation,
      })
      store.setState({
        detectedPlane: newImplementation,
      })
    },
    setDetectedMesh(implementation: T['detectedMesh'], semanticLabel?: XRSemanticLabel) {
      if (semanticLabel == null) {
        store.setState({ detectedMesh: implementation })
        return
      }
      const currentImplementation = store.getState().detectedMesh
      const newImplementation = {}
      if (typeof currentImplementation === 'object') {
        Object.assign(newImplementation, currentImplementation)
      }
      Object.assign(newImplementation, {
        default: resolveInputSourceImplementation(currentImplementation as any, undefined, {}),
        [semanticLabel]: implementation,
      })
      store.setState({
        detectedMesh: newImplementation,
      })
    },
    destroy() {
      cleanupSessionStartListener?.()
      cleanupSessionGrantedListener?.()
      //unbinding the session
      bindToSession(undefined, undefined)
    },
    enterXR: (mode: XRSessionMode, enterOptions?: XRSessionInitOptions) =>
      enterXR(mode, options, enterOptions, webxrManager),
    enterAR: (enterOptions?: XRSessionInitOptions) => enterXR('immersive-ar', options, enterOptions, webxrManager),
    enterVR: (enterOptions?: XRSessionInitOptions) => enterXR('immersive-vr', options, enterOptions, webxrManager),
    onBeforeFrame(scene: Object3D, camera: Camera, frame: XRFrame | undefined) {
      //update origin
      const { origin: oldOrigin } = store.getState()
      const origin = camera.parent ?? scene
      if (oldOrigin != origin) {
        store.setState({ origin })
      }

      if (webxrManager != null) {
        updateSession(store, frame, webxrManager)
      }
    },
  })
}

async function setFrameRate(session: XRSession, frameRate: FrameRateOption): Promise<void> {
  if (frameRate === false) {
    return
  }
  const { supportedFrameRates } = session
  if (supportedFrameRates == null || supportedFrameRates.length === 0) {
    return
  }
  if (typeof frameRate === 'function') {
    const value = frameRate(supportedFrameRates)
    if (value === false) {
      return
    }
    return session.updateTargetFrameRate(value)
  }
  const multiplier = frameRate === 'high' ? 1 : frameRate === 'mid' ? 0.5 : 0
  return session.updateTargetFrameRate(supportedFrameRates[Math.ceil((supportedFrameRates.length - 1) * multiplier)])
}

async function enterXR(
  mode: XRSessionMode,
  options: XRStoreOptions<XRElementImplementations> | undefined,
  initOptions: XRSessionInitOptions | undefined,
  xr: WebXRManager | undefined,
): Promise<XRSession> {
  if (navigator.xr == null) {
    throw new Error(`xr not supported`)
  }
  const session = await navigator.xr.requestSession(mode, buildXRSessionInit(Object.assign({}, options, initOptions)))
  setFrameRate(session, options?.frameRate ?? 'high')
  setupXRManager(xr, session, options)
  return session
}

function setupXRManager(
  xr: WebXRManager | undefined,
  session: XRSession,
  options: XRStoreOptions<XRElementImplementations> | undefined,
) {
  if (xr == null) {
    return
  }
  const maxFrameBufferScalingFactor = XRWebGLLayer.getNativeFramebufferScaleFactor(session)
  let frameBufferScaling = options?.frameBufferScaling
  if (typeof frameBufferScaling === 'function') {
    frameBufferScaling = frameBufferScaling(maxFrameBufferScalingFactor)
  }
  if (typeof frameBufferScaling === 'string') {
    frameBufferScaling =
      frameBufferScaling === 'high' ? maxFrameBufferScalingFactor : frameBufferScaling === 'mid' ? 1 : 0.5
  }
  if (frameBufferScaling != null) {
    xr?.setFramebufferScaleFactor(frameBufferScaling)
  }
  xr?.setSession(session)
}

const allSessionModes: Array<XRSessionMode> = ['immersive-ar', 'immersive-vr', 'inline']

function setupSessionStartListener(xr: WebXRManager, bindToSession: ReturnType<typeof createBindToSession>) {
  const sessionStartListener = () => {
    const session = xr.getSession()!
    bindToSession(session, session.environmentBlendMode === 'opaque' ? 'immersive-vr' : 'immersive-ar')
  }
  xr.addEventListener('sessionstart', sessionStartListener)
  return () => xr.removeEventListener('sessionstart', sessionStartListener)
}

function setupSessionGrantedListener(
  enterGrantedSession: XRStoreOptions<XRElementImplementations>['enterGrantedSession'] = allSessionModes,
  enterXR: (mode: XRSessionMode) => void,
) {
  if (enterGrantedSession === false) {
    return
  }
  if (enterGrantedSession === true) {
    enterGrantedSession = allSessionModes
  }
  const sessionGrantedListener = async () => {
    for (const mode of enterGrantedSession) {
      if (!(await navigator.xr?.isSessionSupported(mode))) {
        continue
      }
      enterXR(mode)
    }
  }

  navigator.xr?.addEventListener('sessiongranted', sessionGrantedListener)
  return () => navigator.xr?.removeEventListener('sessiongranted', sessionGrantedListener)
}

function createBindToSession(
  store: StoreApi<XRState<XRElementImplementations>>,
  syncXRInputSourceStates: ReturnType<typeof createSyncXRInputSourceStates>,
) {
  let cleanupSession: (() => void) | undefined
  return (session: XRSession | undefined, mode: XRSessionMode | undefined) => {
    cleanupSession?.()
    if (session == null || mode == null) {
      return
    }
    const onInputSourcesChange = (e: XRInputSourceChangeEvent) =>
      store.setState(syncXRInputSourceStates(e.session, store.getState(), e.added, e.removed))
    session.addEventListener('inputsourceschange', onInputSourcesChange)

    //event handlers
    //trigger re-render just re-evaluating the values read from the session
    const onChange = () => store.setState({ frameRate: session.frameRate, visibilityState: session.visibilityState })
    const onEnd = () => {
      cleanupSession?.()
      cleanupSession = undefined
      store.setState(baseInitialState)
    }
    session.addEventListener('end', onEnd)
    session.addEventListener('frameratechange', onChange)
    session.addEventListener('visibilitychange', onChange)

    store.setState({
      ...syncXRInputSourceStates(session, undefined, session.inputSources, undefined),
      frameRate: session.frameRate,
      visibilityState: session.visibilityState,
      detectedMeshes: [],
      detectedPlanes: [],
      mode,
      session,
    })
    cleanupSession = () => {
      //cleanup
      syncXRInputSourceStates(session, store.getState(), undefined, 'all')
      session.removeEventListener('end', onEnd)
      session.removeEventListener('frameratechange', onChange)
      session.removeEventListener('visibilitychange', onChange)
      session.removeEventListener('inputsourceschange', onInputSourcesChange)
    }
  }
}

function updateSession(
  store: StoreApi<XRState<XRElementImplementations>>,
  frame: XRFrame | undefined,
  manager: WebXRManager,
) {
  const referenceSpace = manager.getReferenceSpace()
  const {
    detectedMeshes: prevMeshes,
    detectedPlanes: prevPlanes,
    session,
    controllerStates: controllers,
    handStates: hands,
  } = store.getState()
  if (frame == null || referenceSpace == null || session == null) {
    //not in a XR session
    return
  }

  //update detected planes and meshes
  const detectedPlanes = updateDetectedEntities(prevPlanes, frame.detectedPlanes)
  const detectedMeshes = updateDetectedEntities(prevMeshes, frame.detectedMeshes)

  if (prevPlanes != detectedPlanes || prevMeshes != detectedMeshes) {
    store.setState({ detectedPlanes, detectedMeshes })
  }

  //update controllers
  const controllersLength = controllers.length
  for (let i = 0; i < controllersLength; i++) {
    updateXRControllerState(controllers[i])
  }

  //update hands
  const handsLength = hands.length
  for (let i = 0; i < handsLength; i++) {
    updateXRHandState(hands[i], frame, manager)
  }
}

const emptyArray: ReadonlyArray<any> = []

function updateDetectedEntities<T>(
  prevDetectedEntities: ReadonlyArray<T> | undefined,
  detectedEntities: ReadonlySet<T> | undefined,
): ReadonlyArray<T> {
  if (detectedEntities == null) {
    return emptyArray
  }
  if (prevDetectedEntities != null && equalContent(detectedEntities, prevDetectedEntities)) {
    return prevDetectedEntities
  }
  return Array.from(detectedEntities)
}

function equalContent<T>(set: ReadonlySet<T>, arr: ReadonlyArray<T>): boolean {
  if (set.size != arr.length) {
    return false
  }
  for (const entry of arr) {
    if (!set.has(entry)) {
      return false
    }
  }
  return true
}
