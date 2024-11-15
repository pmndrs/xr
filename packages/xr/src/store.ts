import { StoreApi, createStore } from 'zustand/vanilla'
import { Camera, Object3D, WebXRManager } from 'three'
import { updateXRHandState } from './hand/state.js'
import { XRControllerLayoutLoaderOptions, updateXRControllerState } from './controller/index.js'
import { XRHandLoaderOptions } from './hand/index.js'
import { XRInputSourceState, XRInputSourceStateMap, createSyncXRInputSourceStates } from './input.js'
import { XRSessionInitOptions, buildXRSessionInit } from './init.js'
import type { EmulatorOptions } from './emulate.js'
import { XRLayerEntry } from './layer.js'
import { XRDevice } from 'iwer'

declare global {
  export interface XRSessionEventMap {
    trackedsourceschange: XRInputSourcesChangeEvent
  }
  export interface XRSession {
    trackedSources?: ReadonlyArray<XRInputSource>
  }
}

declare global {
  type XRBodyJoint =
    | 'root'
    | 'hips'
    | 'spine-lower'
    | 'spine-middle'
    | 'spine-upper'
    | 'chest'
    | 'neck'
    | 'head'
    | 'left-shoulder'
    | 'left-scapula'
    | 'left-arm-upper'
    | 'left-arm-lower'
    | 'left-hand-wrist-twist'
    | 'right-shoulder'
    | 'right-scapula'
    | 'right-arm-upper'
    | 'right-arm-lower'
    | 'right-hand-wrist-twist'
    | 'left-hand-palm'
    | 'left-hand-wrist'
    | 'left-hand-thumb-metacarpal'
    | 'left-hand-thumb-phalanx-proximal'
    | 'left-hand-thumb-phalanx-distal'
    | 'left-hand-thumb-tip'
    | 'left-hand-index-metacarpal'
    | 'left-hand-index-phalanx-proximal'
    | 'left-hand-index-phalanx-intermediate'
    | 'left-hand-index-phalanx-distal'
    | 'left-hand-index-tip'
    | 'left-hand-middle-metacarpal'
    | 'left-hand-middle-phalanx-proximal'
    | 'left-hand-middle-phalanx-intermediate'
    | 'left-hand-middle-phalanx-distal'
    | 'left-hand-middle-tip'
    | 'left-hand-ring-metacarpal'
    | 'left-hand-ring-phalanx-proximal'
    | 'left-hand-ring-phalanx-intermediate'
    | 'left-hand-ring-phalanx-distal'
    | 'left-hand-ring-tip'
    | 'left-hand-little-metacarpal'
    | 'left-hand-little-phalanx-proximal'
    | 'left-hand-little-phalanx-intermediate'
    | 'left-hand-little-phalanx-distal'
    | 'left-hand-little-tip'
    | 'right-hand-palm'
    | 'right-hand-wrist'
    | 'right-hand-thumb-metacarpal'
    | 'right-hand-thumb-phalanx-proximal'
    | 'right-hand-thumb-phalanx-distal'
    | 'right-hand-thumb-tip'
    | 'right-hand-index-metacarpal'
    | 'right-hand-index-phalanx-proximal'
    | 'right-hand-index-phalanx-intermediate'
    | 'right-hand-index-phalanx-distal'
    | 'right-hand-index-tip'
    | 'right-hand-middle-metacarpal'
    | 'right-hand-middle-phalanx-proximal'
    | 'right-hand-middle-phalanx-intermediate'
    | 'right-hand-middle-phalanx-distal'
    | 'right-hand-middle-tip'
    | 'right-hand-ring-metacarpal'
    | 'right-hand-ring-phalanx-proximal'
    | 'right-hand-ring-phalanx-intermediate'
    | 'right-hand-ring-phalanx-distal'
    | 'right-hand-ring-tip'
    | 'right-hand-little-metacarpal'
    | 'right-hand-little-phalanx-proximal'
    | 'right-hand-little-phalanx-intermediate'
    | 'right-hand-little-phalanx-distal'
    | 'right-hand-little-tip'
    | 'left-upper-leg'
    | 'left-lower-leg'
    | 'left-foot-ankle-twist'
    | 'left-foot-ankle'
    | 'left-foot-subtalar'
    | 'left-foot-transverse'
    | 'left-foot-ball'
    | 'right-upper-leg'
    | 'right-lower-leg'
    | 'right-foot-ankle-twist'
    | 'right-foot-ankle'
    | 'right-foot-subtalar'
    | 'right-foot-transverse'
    | 'right-foot-ball'
  interface XRBodySpace extends XRSpace {
    readonly jointName: XRBodyJoint
  }
  interface XRBody extends Map<XRBodyJoint, XRBodySpace> {}
  interface XRFrame {
    readonly body?: XRBody
  }
}

export type XRState<T extends XRElementImplementations> = Readonly<
  {
    body?: XRBody
    /**
     * current `XRSession`
     */
    session?: XRSession
    mediaBinding?: XRMediaBinding
    /**
     * `XRReferenceSpace` of the origin in the current session
     * (this references to the session origin at the floor level)
     */
    originReferenceSpace?: XRReferenceSpace
    /**
     * the 3D object representing the session origin
     * if the origin is undefined it is implicitly at world position 0,0,0
     */
    origin?: Object3D
    /**
     * the HTML element for doing dom overlays in handheld AR experiences
     */
    domOverlayRoot?: Element
    /**
     * the session visibility state
     * e.g. `"visible-blurred"` typically occurs when the user sees an OS overlay
     */
    visibilityState?: XRVisibilityState
    /**
     * the configured xr framerate
     * caution: the actual framerate of the experience may be lower if it cannot keep up
     */
    frameRate?: number
    /**
     * the xr session mode
     */
    mode: XRSessionMode | null
    /**
     * all xr input sources
     */
    inputSourceStates: ReadonlyArray<XRInputSourceState>
    /**
     * the detected `XRPlane`s
     */
    detectedPlanes: ReadonlyArray<XRPlane>
    /**
     * the detected `XRMesh`es
     */
    detectedMeshes: ReadonlyArray<XRMesh>
    /**
     * active additional webxr layers
     */
    layerEntries: ReadonlyArray<XRLayerEntry>
    /**
     * access to the emulator values to change the emulated input device imperatively
     */
    emulator?: XRDevice
  } & WithRecord<T>
>

export type XRElementImplementations = {
  [Key in keyof XRInputSourceStateMap]: unknown
}

export type WithRecord<T extends XRElementImplementations> = {
  /**
   * options for configuring the <DefaultXRController/> or provide your own controller implementation
   * options and implementations can be provided for each handedness individually `{ left: false, right: { ... } }`
   * @example { rayPointer: false, grabPointer: { cursorModel: { color: "red" } } }
   * `false` prevents these controllers from beeing used
   * @default true
   */
  controller: T['controller'] | ({ [Key in XRHandedness]?: T['controller'] } & { default?: T['controller'] })
  /**
   * options for configuring the <DefaultXRTransientPointer/> or provide your own transient pointer implementation
   * options and implementations can be provided for each handedness individually `{ left: false, right: { ... } }`
   * `false` prevents these transient pointers from beeing used
   * @example { rayPointer: { cursorModel: { color: "red" } } }
   * @default true
   */
  transientPointer:
    | T['transientPointer']
    | ({ [Key in XRHandedness]?: T['transientPointer'] } & { default?: T['transientPointer'] })
  /**
   * options for configuring the <DefaultXRHand/> or provide your own hand implementation
   * options and implementations can be provided for each handedness individually `{ left: false, right: { ... } }`
   * `false` prevents these hands from beeing used
   * @example { rayPointer: false, grabPointer: { cursorModel: { color: "red" } } }
   * @default true
   */
  hand: T['hand'] | ({ [Key in XRHandedness]?: T['hand'] } & { default?: T['hand'] })
  /**
   * options for configuring the <DefaultXRGaze/> or provide your own gaze implementation
   * @example { rayPointer: { cursorModel: { color: "red" } } }
   * `false` prevents these controllers from beeing used
   * @default true
   */
  gaze: T['gaze']
  /**
   * options for configuring the <DefaultXRScreenInput/> or provide your own screen input implementation
   * @example { rayPointer: { cursorModel: { color: "red" } } }
   * `false` prevents these controllers from beeing used
   * @default true
   */
  screenInput: T['screenInput']
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
   * emulates a device if WebXR not supported and on localhost
   * @default "metaQuest3"
   */
  emulate?: EmulatorOptions | boolean
  /**
   * sets the WebXR foveation between 0 and 1
   * undefined refers to the default foveation provided by the device/browser
   * @default undefined
   */
  foveation?: number
  /**
   * sets the framerate of the session
   * @default "high"
   */
  frameRate?: FrameRateOption
  /**
   * sets the framebuffer scaling of the session
   * undefined refers to the default framebuffer scaling provided by the device/browser (e.g. 1)
   * @default undefined
   */
  frameBufferScaling?: FrameBufferScalingOption
  /**
   * session modes that can be entered automatically without manually requesting a session when granted by the system
   * @default true
   */
  enterGrantedSession?: boolean | Array<XRSessionMode>
  /**
   * allows to use non primary (tracked) input sources
   * @default false
   */
  secondaryInputSources?: boolean
} & XRControllerLayoutLoaderOptions &
  XRHandLoaderOptions &
  Partial<WithRecord<T>> &
  XRSessionInitOptions

export type XRStore<T extends XRElementImplementations> = Omit<StoreApi<XRState<T>>, 'destroy'> & {
  /**
   * add webxr layer entry
   */
  addLayerEntry(entry: XRLayerEntry): void
  /**
   * remove webxr layer entry
   */
  removeLayerEntry(entry: XRLayerEntry): void
  /**
   * internal function
   */
  setWebXRManager(xr: WebXRManager): void
  /**
   * internal function
   */
  onBeforeFrame(scene: Object3D, camera: Camera, frame: XRFrame | undefined): void
  /**
   * internal function
   */
  onBeforeRender(): void
  /**
   * destroys the store unrepairably (for exiting XR use store.getState().session?.end())
   */
  destroy(): void
  enterXR(mode: XRSessionMode): Promise<XRSession | undefined>
  enterAR(): Promise<XRSession | undefined>
  enterVR(): Promise<XRSession | undefined>
  /**
   * update the hand configuration or implementation for both or only one hand
   */
  setHand(implementation: T['hand'], handedness?: XRHandedness): void
  /**
   * update the controller configuration or implementation for both or only one controller
   */
  setController(implementation: T['controller'], handedness?: XRHandedness): void
  /**
   * update the gaze configuration or implementation
   */
  setGaze(implementation: T['gaze']): void
  /**
   * update the screen input configuration or implementation
   */
  setScreenInput(implementation: T['screenInput']): void
  /**
   * update the transient pointer configuration or implementation for both or only one hand
   */
  setTransientPointer(implementation: T['transientPointer'], handedness?: XRHandedness): void
  setFrameRate(value: FrameRateOption): void
  /**
   * returns a promise that resolves on the next render with the xr frame
   */
  requestFrame(): Promise<XRFrame>
}

declare module 'three' {
  interface Object3D {
    xrSpace?: XRSpace
  }
}

const baseInitialState: Omit<
  XRState<XRElementImplementations>,
  | 'hand'
  | 'controller'
  | 'gaze'
  | 'transientPointer'
  | 'screenInput'
  | 'detectedMesh'
  | 'detectedPlane'
  | 'domOverlayRoot'
> = {
  session: undefined,
  mediaBinding: undefined,
  originReferenceSpace: undefined,
  visibilityState: undefined,
  mode: null,
  frameRate: undefined,
  inputSourceStates: [],
  detectedMeshes: [],
  detectedPlanes: [],
  layerEntries: [],
}

function startEmulate(store: StoreApi<XRState<any>>, emulate: EmulatorOptions | true, alert: boolean) {
  if (typeof navigator === 'undefined') {
    return
  }
  Promise.all([navigator.xr?.isSessionSupported('immersive-vr'), navigator.xr?.isSessionSupported('immersive-ar')])
    .then(([vr, ar]) => (!ar && !vr ? import('./emulate.js') : undefined))
    .then((pkg) => {
      if (pkg == null) {
        return
      }
      if (alert) {
        window.alert(`emulator started`)
      }
      const emulator = pkg.emulate(emulate === true ? 'metaQuest3' : emulate)
      if (emulator == null) {
        return
      }
      store.setState({
        emulator,
      })
    })
}

export function createXRStore<T extends XRElementImplementations>(options?: XRStoreOptions<T>): XRStore<T> {
  const domOverlayRoot =
    typeof HTMLElement === 'undefined'
      ? undefined
      : options?.domOverlay instanceof HTMLElement
        ? options.domOverlay
        : document.createElement('div')
  const store = createStore<XRState<XRElementImplementations>>(() => ({
    ...baseInitialState,
    controller: options?.controller,
    hand: options?.hand,
    gaze: options?.gaze,
    screenInput: options?.screenInput,
    transientPointer: options?.transientPointer,
    domOverlayRoot,
  }))

  //setup emulate
  const emulate = options?.emulate ?? 'metaQuest3'
  let cleanupEmulate: (() => void) | undefined
  if (typeof window !== 'undefined' && emulate != false) {
    if (window.location.hostname === 'localhost') {
      startEmulate(store, emulate, false)
    }
    const keydownListener = (e: KeyboardEvent) => {
      if (e.altKey && e.metaKey && e.code === 'KeyE') {
        startEmulate(store, emulate, true)
      }
    }
    window.addEventListener('keydown', keydownListener)
    cleanupEmulate = () => window.removeEventListener('keydown', keydownListener)
  }

  let cleanupDomOverlayRoot: (() => void) | undefined
  if (domOverlayRoot != null) {
    if (domOverlayRoot.parentNode == null) {
      const setupDisplay = (state: XRState<any>) => {
        domOverlayRoot.style.display = state.session != null ? 'block' : 'none'
      }
      const unsubscribe = store.subscribe(setupDisplay)
      setupDisplay(store.getState())
      document.body.appendChild(domOverlayRoot)
      cleanupDomOverlayRoot = () => {
        domOverlayRoot.remove()
        unsubscribe()
      }
    }
    document.body.append(domOverlayRoot)
  }

  const syncXRInputSourceStates = createSyncXRInputSourceStates(
    (state) => store.setState({ inputSourceStates: [...store.getState().inputSourceStates, state] }),
    options,
  )
  const bindToSession = createBindToSession(store, syncXRInputSourceStates, options?.secondaryInputSources ?? false)
  const cleanupSessionGrantedListener = setupSessionGrantedListener(options?.enterGrantedSession, (mode) =>
    enterXR(domOverlayRoot, mode, options, xrManager),
  )
  let cleanupSessionStartListener: (() => void) | undefined

  const frameRequests: Array<(frame: XRFrame) => void> = []
  let xrManager: WebXRManager | undefined

  return Object.assign(store, {
    addLayerEntry(layerEntry: XRLayerEntry): void {
      if (store.getState().session == null) {
        return
      }
      store.setState({ layerEntries: [...store.getState().layerEntries, layerEntry] })
    },
    removeLayerEntry(layerEntry: XRLayerEntry): void {
      if (store.getState().session == null) {
        return
      }
      store.setState({ layerEntries: store.getState().layerEntries.filter((entry) => entry != layerEntry) })
    },
    requestFrame(): Promise<XRFrame> {
      return new Promise((resolve) => frameRequests.push(resolve))
    },
    setWebXRManager(newXrManager: WebXRManager) {
      if (xrManager === newXrManager) {
        return
      }
      xrManager = newXrManager
      const { foveation, bounded } = options ?? {}
      newXrManager.setReferenceSpaceType(bounded ? 'bounded-floor' : 'local-floor')
      if (foveation != null) {
        newXrManager.setFoveation(foveation)
      }
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
    destroy() {
      cleanupEmulate?.()
      cleanupDomOverlayRoot?.()
      cleanupSessionStartListener?.()
      cleanupSessionGrantedListener?.()
      //unbinding the session
      bindToSession(undefined)
    },
    enterXR: (mode: XRSessionMode) => enterXR(domOverlayRoot, mode, options, xrManager),
    enterAR: () => enterXR(domOverlayRoot, 'immersive-ar', options, xrManager),
    enterVR: () => enterXR(domOverlayRoot, 'immersive-vr', options, xrManager),
    onBeforeFrame(scene: Object3D, camera: Camera, frame: XRFrame | undefined) {
      let update: Partial<Mutable<XRState<T>>> | undefined
      const referenceSpace = xrManager?.getReferenceSpace() ?? undefined
      const state = store.getState()

      //update origin
      const origin = camera.parent ?? scene
      if (state.origin != origin) {
        update ??= {}
        update.origin = origin
      }

      //update reference space
      if (referenceSpace != state.originReferenceSpace) {
        update ??= {}
        update.originReferenceSpace = referenceSpace
      }

      //set xr space on current origin (and reset on previous)
      origin.xrSpace = referenceSpace
      if (state.origin != origin && state.origin != null) {
        state.origin.xrSpace = undefined
      }

      if (frame != null) {
        if (xrManager != null) {
          updateSession(store, frame, xrManager)
        }
        if (state.session == null && referenceSpace != null && frame.session != null) {
          update ??= {}
          Object.assign(update, bindToSession(frame.session))
        }
        if (state.body != frame.body) {
          update ??= {}
          update.body = frame.body
        }
      }

      if (update != null) {
        store.setState(update)
      }

      if (frame != null) {
        const length = frameRequests.length
        for (let i = 0; i < length; i++) {
          frameRequests[i](frame)
        }
        frameRequests.length = 0
      }
    },
    onBeforeRender() {
      const { session, layerEntries } = store.getState()
      if (session == null || xrManager == null) {
        return
      }
      const currentLayers = session?.renderState.layers
      if (currentLayers == null) {
        return
      }
      //TODO: sort by distance to camera
      ;(layerEntries as Array<(typeof layerEntries)[number]>).sort((l1, l2) => l1.renderOrder - l2.renderOrder)
      let changed = false
      const layers = layerEntries.map<XRLayer>(({ layer }, i) => {
        if (layer != currentLayers[i]) {
          changed = true
        }
        return layer
      })
      if (!changed) {
        return
      }
      layers.push(xrManager.getBaseLayer())
      session.updateRenderState({
        layers,
      })
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
  domOverlayRoot: Element | undefined,
  mode: XRSessionMode,
  options: XRStoreOptions<XRElementImplementations> | undefined,
  xrManager: WebXRManager | undefined,
): Promise<XRSession | undefined> {
  if (typeof navigator === 'undefined' || navigator.xr == null) {
    return Promise.reject(new Error(`WebXR not supported`))
  }
  if (xrManager == null) {
    return Promise.reject(new Error(`not connected to three.js. Missing are <XR> component?`))
  }
  const session = await navigator.xr.requestSession(mode, buildXRSessionInit(mode, domOverlayRoot, options))
  setFrameRate(session, options?.frameRate ?? 'high')
  setupXRManager(xrManager, session, options)
  return session
}

function setupXRManager(
  xr: WebXRManager,
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

function setupSessionGrantedListener(
  enterGrantedSession: XRStoreOptions<XRElementImplementations>['enterGrantedSession'] = allSessionModes,
  enterXR: (mode: XRSessionMode) => void,
) {
  if (typeof navigator === 'undefined' || enterGrantedSession === false) {
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
  secondayInputSources: boolean,
) {
  let cleanupSession: (() => void) | undefined
  return (session: XRSession | undefined): Partial<XRState<any>> => {
    cleanupSession?.()
    if (session == null) {
      return {}
    }

    //for debouncing the input source and tracked source changes
    const inputSourceChangesList: Parameters<typeof syncXRInputSourceStates>[2] & Array<unknown> = []
    let inputSourceChangesTimeout: number | undefined

    const applySourcesChange = () => {
      inputSourceChangesTimeout = undefined
      store.setState({
        inputSourceStates: syncXRInputSourceStates(session, store.getState().inputSourceStates, inputSourceChangesList),
      })
      inputSourceChangesList.length = 0
    }
    const onSourcesChange = (isPrimary: boolean, e: XRInputSourcesChangeEvent) => {
      inputSourceChangesList.push({ isPrimary, added: e.added, removed: e.removed })
      if (inputSourceChangesTimeout != null) {
        return
      }
      if (secondayInputSources) {
        inputSourceChangesTimeout = setTimeout(applySourcesChange, 100)
      } else {
        applySourcesChange()
      }
    }

    const onInputSourcesChange = onSourcesChange.bind(null, true)
    session.addEventListener('inputsourceschange', onInputSourcesChange)

    let cleanupSecondaryInputSources: (() => void) | undefined
    if (secondayInputSources) {
      const onTrackedSourcesChange = onSourcesChange.bind(null, false)
      session.addEventListener('trackedsourceschange', onTrackedSourcesChange)
      cleanupSecondaryInputSources = () => session.removeEventListener('trackedsourceschange', onTrackedSourcesChange)
    }

    //frameratechange and visibilitychange handlers
    const onChange = () => store.setState({ frameRate: session.frameRate, visibilityState: session.visibilityState })
    session.addEventListener('frameratechange', onChange)
    session.addEventListener('visibilitychange', onChange)

    //end handler
    const onEnd = () => {
      cleanupSession?.()
      cleanupSession = undefined
      store.setState({
        emulator: store.getState().emulator,
        ...baseInitialState,
      })
    }
    session.addEventListener('end', onEnd)

    const initialChanges: Parameters<typeof syncXRInputSourceStates>[2] & Array<unknown> = [
      { isPrimary: true, added: session.inputSources },
    ]
    if (secondayInputSources) {
      initialChanges.push({ isPrimary: false, added: session.trackedSources })
    }
    const inputSourceStates = syncXRInputSourceStates(session, [], initialChanges)

    cleanupSession = () => {
      //cleanup
      cleanupSecondaryInputSources?.()
      clearTimeout(inputSourceChangesTimeout)
      syncXRInputSourceStates(session, store.getState().inputSourceStates, 'remove-all')
      session.removeEventListener('end', onEnd)
      session.removeEventListener('frameratechange', onChange)
      session.removeEventListener('visibilitychange', onChange)
      session.removeEventListener('inputsourceschange', onInputSourcesChange)
    }

    return {
      inputSourceStates,
      frameRate: session.frameRate,
      visibilityState: session.visibilityState,
      detectedMeshes: [],
      detectedPlanes: [],
      mode: session.environmentBlendMode === 'opaque' ? 'immersive-vr' : 'immersive-ar',
      session,
      mediaBinding: typeof XRMediaBinding == 'undefined' ? undefined : new XRMediaBinding(session),
    }
  }
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

function updateSession(store: StoreApi<XRState<XRElementImplementations>>, frame: XRFrame, manager: WebXRManager) {
  const referenceSpace = manager.getReferenceSpace()
  const { detectedMeshes: prevMeshes, detectedPlanes: prevPlanes, session, inputSourceStates } = store.getState()
  if (referenceSpace == null || session == null) {
    //not in a XR session
    return
  }

  //update detected planes and meshes
  const detectedPlanes = updateDetectedEntities(prevPlanes, frame.detectedPlanes)
  const detectedMeshes = updateDetectedEntities(prevMeshes, frame.detectedMeshes)

  if (prevPlanes != detectedPlanes || prevMeshes != detectedMeshes) {
    store.setState({ detectedPlanes, detectedMeshes })
  }

  //update input sources
  const inputSourceStatesLength = inputSourceStates.length
  for (let i = 0; i < inputSourceStatesLength; i++) {
    const inputSourceState = inputSourceStates[i]
    switch (inputSourceState.type) {
      case 'controller':
        updateXRControllerState(inputSourceState)
        break
      case 'hand':
        updateXRHandState(inputSourceState, frame, manager)
        break
    }
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
