import * as React from 'react'
import * as THREE from 'three'
import create, { EqualityChecker, GetState, SetState, StateSelector } from 'zustand'
import { Canvas, useFrame, useThree, Props as ContainerProps } from '@react-three/fiber'
import { XRController } from './XRController'
import { InteractionManager, XRInteractionHandler, XRInteractionType } from './Interactions'
import { XREvent } from './XREvents'

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
  interactions: Map<THREE.Object3D, Record<XRInteractionType, XRInteractionHandler[]>>
  hasInteraction: (object: THREE.Object3D, eventType: XRInteractionType) => boolean
  getInteraction: (object: THREE.Object3D, eventType: XRInteractionType) => XRInteractionHandler[] | undefined
  addInteraction: (object: THREE.Object3D, eventType: XRInteractionType, handler: XRInteractionHandler) => void
  removeInteraction: (object: THREE.Object3D, eventType: XRInteractionType, handler: XRInteractionHandler) => void
}
const XRStore = create<XRState>((set, get) => ({
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
    return !!get().interactions.get(object)?.[eventType].length
  },
  getInteraction(object: THREE.Object3D, eventType: XRInteractionType) {
    return get().interactions.get(object)?.[eventType]
  },
  addInteraction(object: THREE.Object3D, eventType: XRInteractionType, handler: XRInteractionHandler) {
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
        onSqueezeMissed: []
      })
    }

    const target = interactions.get(object)!
    target[eventType].push(handler)
  },
  removeInteraction(object: THREE.Object3D, eventType: XRInteractionType, handler: XRInteractionHandler) {
    const target = get().interactions.get(object)
    if (target) {
      const interactionIndex = target[eventType].indexOf(handler)
      if (interactionIndex !== -1) target[eventType].splice(interactionIndex, 1)
    }
  }
}))

const hitMatrix = new THREE.Matrix4()

export type HitTestCallback = (hitMatrix: THREE.Matrix4, hit: XRHitTestResult) => void

export function useHitTest(hitTestCallback: HitTestCallback) {
  const session = useXR((state) => state.session)
  const hitTestSource = React.useRef<XRHitTestSource | undefined>()

  React.useEffect(() => {
    if (!session) return void (hitTestSource.current = undefined)

    session.requestReferenceSpace('viewer').then(async (referenceSpace) => {
      hitTestSource.current = await session?.requestHitTestSource?.({ space: referenceSpace })
    })
  }, [session])

  useFrame((state, _, frame) => {
    if (!frame || !hitTestSource.current) return

    const [hit] = frame.getHitTestResults(hitTestSource.current)
    if (hit) {
      const referenceSpace = state.gl.xr.getReferenceSpace()!
      const pose = hit.getPose(referenceSpace)

      if (pose) {
        hitMatrix.fromArray(pose.transform.matrix)
        hitTestCallback(hitMatrix, hit)
      }
    }
  })
}

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
  onSessionStart?: (event: XREvent<XRManagerEvent>) => void
  /** Called after an XRSession is terminated */
  onSessionEnd?: (event: XREvent<XRManagerEvent>) => void
  /** Called when an XRSession is hidden or unfocused. */
  onVisibilityChange?: (event: XREvent<XRSessionEvent>) => void
  /** Called when available inputsources change */
  onInputSourcesChange?: (event: XREvent<XRSessionEvent>) => void
  children: React.ReactNode
}
function XR({
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

  React.useEffect(() => void gl.xr.setSession(session!), [gl.xr, session])

  React.useEffect(() => {
    gl.xr.setFoveation(foveation)
    set(() => ({ foveation }))
  }, [gl, foveation, set])

  React.useEffect(() => {
    gl.xr.setReferenceSpaceType(referenceSpace)
    set(() => ({ referenceSpace }))
  }, [gl.xr, referenceSpace, set])

  React.useEffect(() => {
    if (!session) return

    const handleSessionStart = (nativeEvent: XRManagerEvent) =>
      onSessionStart?.({ nativeEvent: { ...nativeEvent, target: session }, target: session })
    const handleSessionEnd = (nativeEvent: XRManagerEvent) =>
      onSessionEnd?.({ nativeEvent: { ...nativeEvent, target: session }, target: session })
    const handleVisibilityChange = (nativeEvent: XRSessionEvent) => onVisibilityChange?.({ nativeEvent, target: session })
    const handleInputSourcesChange = (nativeEvent: XRSessionEvent) => onInputSourcesChange?.({ nativeEvent, target: session })

    gl.xr.addEventListener('sessionstart', handleSessionStart)
    gl.xr.addEventListener('sessionend', handleSessionEnd)
    session.addEventListener('visibilitychange', handleVisibilityChange)
    session.addEventListener('inputsourceschange', handleInputSourcesChange)

    return () => {
      gl.xr.removeEventListener('sessionstart', handleSessionStart)
      gl.xr.removeEventListener('sessionend', handleSessionEnd)
      session.removeEventListener('visibilitychange', handleVisibilityChange)
      session.removeEventListener('inputsourceschange', handleInputSourcesChange)
    }
  }, [session, gl.xr, onSessionStart, onSessionEnd, onVisibilityChange, onInputSourcesChange])

  React.useEffect(() => {
    const handleSessionChange = () => set(() => ({ isPresenting: gl.xr.isPresenting }))

    gl.xr.addEventListener('sessionstart', handleSessionChange)
    gl.xr.addEventListener('sessionend', handleSessionChange)

    return () => {
      gl.xr.removeEventListener('sessionstart', handleSessionChange)
      gl.xr.removeEventListener('sessionend', handleSessionChange)
    }
  }, [set, gl.xr])

  React.useEffect(() => {
    if (!session) return

    const handleInputSourcesChange = (event: { session: XRSession }) =>
      set(() => ({
        isHandTracking: Object.values(event.session.inputSources).some((source) => source.hand)
      }))
    session.addEventListener('inputsourceschange', handleInputSourcesChange)
    handleInputSourcesChange({ session })

    return () => session.removeEventListener('inputsourceschange', handleInputSourcesChange)
  }, [set, session])

  return (
    <>
      <primitive object={player}>
        <primitive object={camera} />
        {controllers.map((controller, i) => (
          <primitive key={i} object={controller} />
        ))}
      </primitive>
      {children}
    </>
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

  const toggleSession = React.useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      onClick?.(event)

      const xrState = XRStore.getState()

      // Bail if button only configures exit/enter
      if (xrState.session && enterOnly) return
      if (!xrState.session && exitOnly) return

      let session: XRSession | null = null

      // Exit/enter session
      if (xrState.session) {
        await xrState.session.end()
        setStatus('exited')
      } else {
        session = await navigator.xr!.requestSession(sessionMode, sessionInit)
        setStatus('entered')
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

export interface XRCanvasProps extends ContainerProps, XRProps {}
export const XRCanvas = React.forwardRef<HTMLCanvasElement, XRCanvasProps>(function XRCanvas(
  { foveation, referenceSpace, onSessionStart, onSessionEnd, onVisibilityChange, onInputSourcesChange, children, ...rest },
  forwardedRef
) {
  return (
    <Canvas {...rest} ref={forwardedRef}>
      <XR
        foveation={foveation}
        referenceSpace={referenceSpace}
        onSessionStart={onSessionStart}
        onSessionEnd={onSessionEnd}
        onVisibilityChange={onVisibilityChange}
        onInputSourcesChange={onInputSourcesChange}
      >
        <InteractionManager>{children}</InteractionManager>
      </XR>
    </Canvas>
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

export interface VRCanvasProps extends XRCanvasProps, Pick<XRButtonProps, 'sessionInit'> {}
export const VRCanvas = React.forwardRef<HTMLCanvasElement, VRCanvasProps>(function VRCanvas(
  {
    sessionInit = {
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers']
    },
    children,
    ...rest
  },
  ref
) {
  return (
    <>
      <XRButton mode="VR" style={buttonStyles} sessionInit={sessionInit} />
      <XRCanvas ref={ref} {...rest}>
        {children}
      </XRCanvas>
    </>
  )
})

export interface ARCanvasProps extends XRCanvasProps, Pick<XRButtonProps, 'sessionInit'> {}
export const ARCanvas = React.forwardRef<HTMLCanvasElement, ARCanvasProps>(function ARCanvas(
  {
    sessionInit = {
      // @ts-ignore
      domOverlay: { root: document.body },
      optionalFeatures: ['hit-test', 'dom-overlay', 'dom-overlay-for-handheld-ar']
    },
    children,
    ...rest
  },
  ref
) {
  return (
    <>
      <XRButton mode="AR" style={buttonStyles} sessionInit={sessionInit} />
      <XRCanvas ref={ref} {...rest}>
        {children}
      </XRCanvas>
    </>
  )
})

export function useXR<T = XRState>(
  selector: StateSelector<XRState, T> = (state) => state as unknown as T,
  equalityFn?: EqualityChecker<T>
) {
  return XRStore(selector, equalityFn)
}

export function useController(handedness: XRHandedness) {
  const controllers = useXR((state) => state.controllers)
  const controller = React.useMemo(
    () => controllers.find(({ inputSource }) => inputSource.handedness === handedness),
    [handedness, controllers]
  )

  return controller
}
