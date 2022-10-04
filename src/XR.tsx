import * as React from 'react'
import * as THREE from 'three'
import create, { EqualityChecker, GetState, SetState, StateSelector, UseBoundStore } from 'zustand'
import { useThree } from '@react-three/fiber'
import { XRController } from './XRController'
import { InteractionManager, XRInteractionHandler, XRInteractionType } from './Interactions'
import { XREventHandler } from './XREvents'
import { uniq } from './utils'

export interface XRState {
  set: SetState<XRState>
  get: GetState<XRState>

  controllers: XRController[]
  isPresenting: boolean
  isHandTracking: boolean
  player: THREE.Group
  session: XRSession | null
  foveation: number
  referenceSpace: XRReferenceSpaceType

  hoverState: Record<XRHandedness, Map<THREE.Object3D, THREE.Intersection>>
  interactions: Map<THREE.Object3D, Record<XRInteractionType, React.RefObject<XRInteractionHandler>[]>>
  hasInteraction: (object: THREE.Object3D, eventType: XRInteractionType) => boolean
  getInteraction: (object: THREE.Object3D, eventType: XRInteractionType) => XRInteractionHandler[] | undefined
  addInteraction: (object: THREE.Object3D, eventType: XRInteractionType, handlerRef: React.RefObject<XRInteractionHandler>) => void
  removeInteraction: (object: THREE.Object3D, eventType: XRInteractionType, handlerRef: React.RefObject<XRInteractionHandler>) => void
}
const XRContext = React.createContext<UseBoundStore<XRState>>(null!)

interface GlobalSessionState {
  set: SetState<GlobalSessionState>
  get: GetState<GlobalSessionState>
  session: XRSession | null
  referenceSpaceType: XRReferenceSpaceType | null
}
const globalSessionStore = create<GlobalSessionState>((set, get) => ({ set, get, session: null, referenceSpaceType: null }))

export type XRManagerEventType = 'sessionstart' | 'sessionend'
export interface XRManagerEvent {
  type: XRManagerEventType
  target: XRSession
}
export interface XRProps {
  /**
   * Enables foveated rendering. `Default is `0`
   * 0 = no foveation, full resolution
   * 1 = maximum foveation, the edges render at lower resolution
   */
  foveation?: number
  /** Type of WebXR reference space to use. Default is `local-space` */
  referenceSpace?: XRReferenceSpaceType
  /** Called as an XRSession is requested */
  onSessionStart?: XREventHandler<XRManagerEvent>
  /** Called after an XRSession is terminated */
  onSessionEnd?: XREventHandler<XRManagerEvent>
  /** Called when an XRSession is hidden or unfocused. */
  onVisibilityChange?: XREventHandler<XRSessionEvent>
  /** Called when available inputsources change */
  onInputSourcesChange?: XREventHandler<XRSessionEvent>
  children: React.ReactNode
}
function XRManager({
  foveation = 0,
  referenceSpace = 'local-floor',
  onSessionStart,
  onSessionEnd,
  onVisibilityChange,
  onInputSourcesChange,
  children
}: XRProps) {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const player = useXR((state) => state.player)
  const set = useXR((state) => state.set)
  const session = useXR((state) => state.session)
  const controllers = useXR((state) => state.controllers)

  React.useEffect(() => {
    const handlers = [0, 1].map((id) => {
      const target = new XRController(id, gl)
      const onConnected = () => set((state) => ({ controllers: [...state.controllers, target] }))
      const onDisconnected = () => set((state) => ({ controllers: state.controllers.filter((it) => it !== target) }))

      target.addEventListener('connected', onConnected)
      target.addEventListener('disconnected', onDisconnected)

      return () => {
        target.removeEventListener('connected', onConnected)
        target.removeEventListener('disconnected', onDisconnected)
      }
    })

    return () => handlers.forEach((cleanup) => cleanup())
  }, [gl, set])

  React.useEffect(
    () =>
      globalSessionStore.subscribe(({ session }) => {
        set(() => ({ session }))
        gl.xr.setSession(session!)
      }),
    [gl.xr, set]
  )

  React.useEffect(() => {
    gl.xr.setFoveation(foveation)
    set(() => ({ foveation }))
  }, [gl, foveation, set])

  React.useEffect(() => {
    const globalSessionState = globalSessionStore.getState()
    gl.xr.setReferenceSpaceType(referenceSpace)
    set(() => ({ referenceSpace }))
    globalSessionState.set({ referenceSpaceType: referenceSpace })
  }, [gl.xr, referenceSpace, set])

  React.useEffect(() => {
    if (!session) return

    const handleSessionStart = (nativeEvent: XRManagerEvent) => {
      set(() => ({ isPresenting: true }))
      onSessionStart?.({ nativeEvent: { ...nativeEvent, target: session }, target: session })
    }
    const handleSessionEnd = (nativeEvent: XRManagerEvent) => {
      set(() => ({ isPresenting: false, session: null }))
      globalSessionStore.setState(() => ({ session: null }))
      onSessionEnd?.({ nativeEvent: { ...nativeEvent, target: session }, target: session })
    }
    const handleVisibilityChange = (nativeEvent: XRSessionEvent) => {
      onVisibilityChange?.({ nativeEvent, target: session })
    }
    const handleInputSourcesChange = (nativeEvent: XRSessionEvent) => {
      set(() => ({ isHandTracking: Object.values(session.inputSources).some((source) => source.hand) }))
      onInputSourcesChange?.({ nativeEvent, target: session })
    }

    gl.xr.addEventListener('sessionstart', handleSessionStart)
    gl.xr.addEventListener('sessionend', handleSessionEnd)
    session.addEventListener('visibilitychange', handleVisibilityChange)
    session.addEventListener('inputsourceschange', handleInputSourcesChange)

    // Eagerly call sessionstart when late
    if (gl.xr.isPresenting) handleSessionStart({ type: 'sessionstart', target: session })

    return () => {
      gl.xr.removeEventListener('sessionstart', handleSessionStart)
      gl.xr.removeEventListener('sessionend', handleSessionEnd)
      session.removeEventListener('visibilitychange', handleVisibilityChange)
      session.removeEventListener('inputsourceschange', handleInputSourcesChange)
    }
  }, [session, gl.xr, set, onSessionStart, onSessionEnd, onVisibilityChange, onInputSourcesChange])

  return (
    <InteractionManager>
      <primitive object={player}>
        <primitive object={camera} />
        {controllers.map((controller, i) => (
          <primitive key={i} object={controller} />
        ))}
      </primitive>
      {children}
    </InteractionManager>
  )
}

export function XR(props: XRProps) {
  const store = React.useMemo(
    () =>
      create<XRState>((set, get) => ({
        set,
        get,

        controllers: [],
        isPresenting: false,
        isHandTracking: false,
        player: new THREE.Group(),
        session: null,
        foveation: 0,
        referenceSpace: 'local-floor',

        hoverState: {
          left: new Map(),
          right: new Map(),
          none: new Map()
        },
        interactions: new Map(),
        hasInteraction(object: THREE.Object3D, eventType: XRInteractionType) {
          return !!get()
            .interactions.get(object)
            ?.[eventType].some((handlerRef) => handlerRef.current)
        },
        getInteraction(object: THREE.Object3D, eventType: XRInteractionType) {
          return get()
            .interactions.get(object)
            ?.[eventType].reduce((result, handlerRef) => {
              if (handlerRef.current) {
                result.push(handlerRef.current)
              }
              return result
            }, [] as XRInteractionHandler[])
        },
        addInteraction(object: THREE.Object3D, eventType: XRInteractionType, handlerRef: React.RefObject<XRInteractionHandler>) {
          const interactions = get().interactions
          if (!interactions.has(object)) {
            interactions.set(object, {
              onHover: [],
              onBlur: [],
              onSelect: [],
              onSelectEnd: [],
              onSelectStart: [],
              onSelectMissed: [],
              onSqueeze: [],
              onSqueezeEnd: [],
              onSqueezeStart: [],
              onSqueezeMissed: [],
              onMove: []
            })
          }

          const target = interactions.get(object)!
          target[eventType].push(handlerRef)
        },
        removeInteraction(object: THREE.Object3D, eventType: XRInteractionType, handlerRef: React.RefObject<XRInteractionHandler>) {
          const target = get().interactions.get(object)
          if (target) {
            const interactionIndex = target[eventType].indexOf(handlerRef)
            if (interactionIndex !== -1) target[eventType].splice(interactionIndex, 1)
          }
        }
      })),
    []
  )

  return (
    <XRContext.Provider value={store}>
      <XRManager {...props} />
    </XRContext.Provider>
  )
}

export type XRButtonStatus = 'unsupported' | 'exited' | 'entered'
export interface XRButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The type of `XRSession` to create */
  mode: 'AR' | 'VR' | 'inline'
  /**
   * `XRSession` configuration options
   * @see https://immersive-web.github.io/webxr/#feature-dependencies
   */
  sessionInit?: XRSessionInit
  /** Whether this button should only enter an `XRSession`. Default is `false` */
  enterOnly?: boolean
  /** Whether this button should only exit an `XRSession`. Default is `false` */
  exitOnly?: boolean
  /** React children, can also accept a callback returning an `XRButtonStatus` */
  children?: React.ReactNode | ((status: XRButtonStatus) => React.ReactNode)
}

const getSessionOptions = (
  globalStateReferenceSpaceType: XRReferenceSpaceType | null,
  sessionInit: XRSessionInit | undefined
): XRSessionInit | undefined => {
  if (!globalStateReferenceSpaceType && !sessionInit) {
    return undefined
  }

  if (globalStateReferenceSpaceType && !sessionInit) {
    return { optionalFeatures: [globalStateReferenceSpaceType] }
  }

  if (globalStateReferenceSpaceType && sessionInit) {
    return { ...sessionInit, optionalFeatures: uniq([...(sessionInit.optionalFeatures ?? []), globalStateReferenceSpaceType]) }
  }

  return sessionInit
}

export const XRButton = React.forwardRef<HTMLButtonElement, XRButtonProps>(function XRButton(
  { mode, sessionInit, enterOnly = false, exitOnly = false, onClick, children, ...props },
  ref
) {
  const [status, setStatus] = React.useState<XRButtonStatus>('exited')
  const label = status === 'unsupported' ? `${mode} unsupported` : `${status === 'entered' ? 'Exit' : 'Enter'} ${mode}`
  const sessionMode = (mode === 'inline' ? mode : `immersive-${mode.toLowerCase()}`) as XRSessionMode

  React.useEffect(() => {
    if (!navigator?.xr) return void setStatus('unsupported')
    navigator.xr!.isSessionSupported(sessionMode).then((supported) => setStatus(supported ? 'exited' : 'unsupported'))
  }, [sessionMode])

  React.useEffect(
    () =>
      globalSessionStore.subscribe((state) => {
        if (state.session) {
          setStatus('entered')
        } else if (status !== 'unsupported') {
          setStatus('exited')
        }
      }),
    [status]
  )

  const toggleSession = React.useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      onClick?.(event)

      const xrState = globalSessionStore.getState()

      // Bail if button only configures exit/enter
      if (xrState.session && enterOnly) return
      if (!xrState.session && exitOnly) return

      let session: XRSession | null = null

      // Exit/enter session
      if (xrState.session) {
        await xrState.session.end()
      } else {
        const options = getSessionOptions(xrState.referenceSpaceType, sessionInit)
        session = await navigator.xr!.requestSession(sessionMode, options)
      }

      xrState.set(() => ({ session }))
    },
    [onClick, enterOnly, exitOnly, sessionMode, sessionInit]
  )

  return (
    <button {...props} ref={ref} onClick={status === 'unsupported' ? onClick : toggleSession}>
      {typeof children === 'function' ? children(status) : children ?? label}
    </button>
  )
})

const buttonStyles: any = {
  position: 'absolute',
  bottom: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '12px 24px',
  border: '1px solid white',
  borderRadius: '4px',
  background: 'rgba(0, 0, 0, 0.1)',
  color: 'white',
  font: 'normal 0.8125rem sans-serif',
  outline: 'none',
  zIndex: 99999,
  cursor: 'pointer'
}

export const ARButton = React.forwardRef<HTMLButtonElement, Omit<XRButtonProps, 'mode'>>(
  (
    {
      sessionInit = {
        // @ts-ignore
        domOverlay: typeof document !== 'undefined' ? { root: document.body } : undefined,
        optionalFeatures: ['hit-test', 'dom-overlay', 'dom-overlay-for-handheld-ar']
      },
      children,
      ...rest
    },
    ref
  ) => (
    <XRButton {...rest} ref={ref} mode="AR" style={buttonStyles} sessionInit={sessionInit}>
      {children}
    </XRButton>
  )
)

export const VRButton = React.forwardRef<HTMLButtonElement, Omit<XRButtonProps, 'mode'>>(
  ({ sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'] }, children, ...rest }, ref) => (
    <XRButton {...rest} ref={ref} mode="VR" style={buttonStyles} sessionInit={sessionInit}>
      {children}
    </XRButton>
  )
)

export function useXR<T = XRState>(
  selector: StateSelector<XRState, T> = (state) => state as unknown as T,
  equalityFn?: EqualityChecker<T>
) {
  const store = React.useContext(XRContext)
  if (!store) throw new Error('useXR must be used within an <XR /> component!')
  return store(selector, equalityFn)
}

export function useController(handedness: XRHandedness) {
  const controllers = useXR((state) => state.controllers)
  const controller = React.useMemo(
    () => controllers.find(({ inputSource }) => inputSource.handedness === handedness),
    [handedness, controllers]
  )

  return controller
}
