import * as React from 'react'
import * as THREE from 'three'
import create, { EqualityChecker, GetState, SetState, StateSelector } from 'zustand'
import { Canvas, useFrame, useThree, Props as ContainerProps } from '@react-three/fiber'
import { XRController } from './XRController'
import { InteractionManager, XRInteractionHandler, XRInteractionType } from './Interactions'

export interface XRState {
  set: SetState<XRState>
  get: GetState<XRState>

  controllers: XRController[]
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
        onSelectStart: [],
        onSelectEnd: [],
        onSelect: [],
        onSqueeze: [],
        onSqueezeEnd: [],
        onSqueezeStart: []
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
  const hitTestSource = React.useRef<XRHitTestSource | undefined>()
  const hitTestSourceRequested = React.useRef(false)

  useFrame((state, _, frame) => {
    if (!state.gl.xr.isPresenting) return

    const session = state.gl.xr.getSession()
    if (!session) return

    if (!hitTestSourceRequested.current) {
      session.requestReferenceSpace('viewer').then((referenceSpace: XRReferenceSpace) => {
        session.requestHitTestSource?.({ space: referenceSpace })?.then((source: XRHitTestSource) => {
          hitTestSource.current = source
        })
      })
      session.addEventListener(
        'end',
        () => {
          hitTestSourceRequested.current = false
          hitTestSource.current = undefined
        },
        { once: true }
      )
      hitTestSourceRequested.current = true
    }

    if (hitTestSource.current && state.gl.xr.isPresenting && frame) {
      const referenceSpace = state.gl.xr.getReferenceSpace()

      if (referenceSpace) {
        const [hit] = frame.getHitTestResults(hitTestSource.current as XRHitTestSource)
        if (hit) {
          const pose = hit.getPose(referenceSpace)

          if (pose) {
            hitMatrix.fromArray(pose.transform.matrix)
            hitTestCallback(hitMatrix, hit)
          }
        }
      }
    }
  })
}

export interface XRManagerEvent {
  type: 'sessionstart' | 'sessionend'
  target: THREE.WebXRManager
}
export interface XRControllerEvent {
  type: THREE.XRControllerEventType
  data?: XRInputSource
}
export interface XRCanvasEvent {
  readonly nativeEvent: XRManagerEvent | XRControllerEvent | XRSessionEvent
  readonly session: XRSession
}
export interface XRProps {
  /**
   * Enables foveated rendering
   * 0 = no foveation = full resolution
   * 1 = maximum foveation = the edges render at lower resolution
   */
  foveation?: number
  /** Type of WebXR reference space to use */
  referenceSpace?: XRReferenceSpaceType
  /** Called as an XRSession is requested */
  onSessionStart?: (event: XRCanvasEvent) => void
  /** Called after an XRSession is terminated */
  onSessionEnd?: (event: XRCanvasEvent) => void
  /** Called when an XRSession is hidden or unfocused. */
  onVisibilityChange?: (event: XRCanvasEvent) => void
  /** Called when available inputsources change */
  onInputSourcesChange?: (event: XRCanvasEvent) => void
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

  React.useEffect(() => {
    const handlers = [0, 1].map((id) => {
      const controller = new XRController(id, gl)
      const onConnected = () => set((state) => ({ controllers: [...state.controllers, controller] }))
      const onDisconnected = () => set((state) => ({ controllers: state.controllers.filter((it) => it !== controller) }))

      controller.addEventListener('connected', onConnected)
      controller.addEventListener('disconnected', onDisconnected)
      player.add(controller)

      return () => {
        controller.removeEventListener('connected', onConnected)
        controller.removeEventListener('disconnected', onDisconnected)
        player.remove(controller)
      }
    })

    return () => {
      handlers.forEach((cleanup) => cleanup())
    }
  }, [gl, set, player])

  React.useEffect(() => void gl.xr.setSession(session!), [gl.xr, session])

  React.useEffect(() => {
    if (gl.xr.getFoveation() !== foveation) {
      gl.xr.setFoveation(foveation)
      set(() => ({ foveation }))
    }
  }, [gl, foveation, set])

  React.useEffect(() => {
    gl.xr.setReferenceSpaceType(referenceSpace)
    set(() => ({ referenceSpace }))
  }, [gl.xr, referenceSpace, set])

  React.useEffect(() => {
    if (!session) return

    const handleSessionStart = (nativeEvent: XRManagerEvent) => onSessionStart?.({ nativeEvent, session })
    const handleSessionEnd = (nativeEvent: XRManagerEvent) => onSessionEnd?.({ nativeEvent, session })
    const handleVisibilityChange = (nativeEvent: XRSessionEvent) => onVisibilityChange?.({ nativeEvent, session })
    const handleInputSourcesChange = (nativeEvent: XRSessionEvent) => onInputSourcesChange?.({ nativeEvent, session })

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

  return (
    <>
      <primitive object={player} dispose={null}>
        {camera && <primitive object={camera} />}
      </primitive>
      {children}
    </>
  )
}

// React currently throws a warning when using useLayoutEffect on the server.
// To get around it, we can conditionally useEffect on the server (no-op) and
// useLayoutEffect on the client.
const isSSR = typeof window === 'undefined' || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent)
const useIsomorphicLayoutEffect = isSSR ? React.useEffect : React.useLayoutEffect

export type XRButtonStatus = 'unsupported' | 'exited' | 'entered'
export interface XRButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The type of `XRSession` to create */
  mode: 'AR' | 'VR' | 'inline'
  /**
   * `XRSession` configuration options
   * @see https://immersive-web.github.io/webxr/#feature-dependencies
   */
  sessionInit?: XRSessionInit
  /** Whether this button should only enter an `XRSession` */
  enterOnly?: boolean
  /** Whether this button should only exit an `XRSession` */
  exitOnly?: boolean
  /** React children, can also accept a callback returning an `XRButtonStatus` */
  children?: React.ReactNode | ((status: React.ReactNode) => React.ReactNode)
}

export const XRButton = React.forwardRef<HTMLButtonElement, XRButtonProps>(function XRButton(
  {
    mode,
    sessionInit = {
      // @ts-ignore
      domOverlay: { root: document.body },
      optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar', 'local-floor', 'bounded-floor', 'hand-tracking']
    },
    enterOnly = false,
    exitOnly = false,
    onClick,
    children,
    ...props
  },
  ref
) {
  const [status, setStatus] = React.useState<XRButtonStatus>('exited')
  const label = status === 'unsupported' ? `${mode} unsupported` : `${status === 'entered' ? 'Exit' : 'Enter'} ${mode}`
  const sessionMode = (mode === 'inline' ? mode : `immersive-${mode.toLowerCase()}`) as XRSessionMode

  useIsomorphicLayoutEffect(() => {
    if (!navigator?.xr) return void setStatus('unsupported')
    navigator.xr!.isSessionSupported(sessionMode).then((supported) => setStatus(supported ? 'exited' : 'unsupported'))
  }, [sessionMode])

  const toggleSession = React.useCallback(
    async (event: any) => {
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
export function VRCanvas({ sessionInit, children, ...rest }: VRCanvasProps) {
  return (
    <>
      <XRButton mode="VR" style={buttonStyles} sessionInit={sessionInit} />
      <XRCanvas {...rest}>{children}</XRCanvas>
    </>
  )
}

export interface ARCanvasProps extends XRCanvasProps, Pick<XRButtonProps, 'sessionInit'> {}
export function ARCanvas({ sessionInit, children, ...rest }: ARCanvasProps) {
  return (
    <>
      <XRButton mode="AR" style={buttonStyles} sessionInit={sessionInit} />
      <XRCanvas {...rest}>{children}</XRCanvas>
    </>
  )
}

export function useXR<T = XRState>(
  selector: StateSelector<XRState, T> = (state) => state as unknown as T,
  equalityFn?: EqualityChecker<T>
) {
  return XRStore(selector, equalityFn)
}

export function useController(handedness: XRHandedness) {
  const controllers = useXR((state) => state.controllers)
  const controller = React.useMemo(() => controllers.find((it) => it.inputSource.handedness === handedness), [handedness, controllers])

  return controller
}
