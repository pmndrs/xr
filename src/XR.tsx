import * as React from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { XRController } from './XRController'
import { Props as ContainerProps } from '@react-three/fiber/dist/declarations/src/web/Canvas'
import { InteractionManager, InteractionsContext } from './Interactions'
import {
  XRSessionInit,
  Group,
  Matrix4,
  XRFrame,
  XRHandedness,
  XRHitTestResult,
  XRHitTestSource,
  XRReferenceSpace,
  XRSession,
  WebXRManager,
  XRControllerEventType,
  XRInputSource,
  XRReferenceSpaceType,
  XRSessionMode,
  Navigator
} from 'three'
import create, { GetState, SetState } from 'zustand'

export interface XRContextValue {
  session: XRSession | null
  controllers: XRController[]
  isPresenting: boolean
  player: Group
  isHandTracking: boolean
}
const XRContext = React.createContext<XRContextValue>({} as any)

const useControllers = (group: Group): XRController[] => {
  const { gl } = useThree()
  const [controllers, setControllers] = React.useState<XRController[]>([])

  React.useEffect(() => {
    const ids = [0, 1]
    ids.forEach((id) => {
      XRController.make(
        id,
        gl,
        (controller) => {
          group.add(controller.controller)
          group.add(controller.grip)
          group.add(controller.hand)
          setControllers((it) => [...it, controller])
        },
        (controller) => {
          group.remove(controller.controller)
          group.remove(controller.grip)
          group.remove(controller.hand)
          setControllers((existing) => existing.filter((it) => it !== controller))
        }
      )
    })
  }, [gl, group])

  return controllers
}

const hitMatrix = new Matrix4()

export function useHitTest(hitTestCallback: (hitMatrix: Matrix4, hit: XRHitTestResult) => void) {
  const { gl } = useThree()

  const hitTestSource = React.useRef<XRHitTestSource | undefined>()
  const hitTestSourceRequested = React.useRef(false)

  useFrame(() => {
    if (!gl.xr.isPresenting) return

    const session = gl.xr.getSession()
    if (!session) return

    if (!hitTestSourceRequested.current) {
      session.requestReferenceSpace('viewer').then((referenceSpace: XRReferenceSpace) => {
        session.requestHitTestSource({ space: referenceSpace }).then((source: XRHitTestSource) => {
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

    if (hitTestSource.current && gl.xr.isPresenting) {
      const referenceSpace = gl.xr.getReferenceSpace()

      if (referenceSpace) {
        // This raf is unnecesary, we should get XRFrame from r3f but it's not implemented yet
        session.requestAnimationFrame((time: DOMHighResTimeStamp, frame: XRFrame) => {
          const hitTestResults = frame.getHitTestResults(hitTestSource.current as XRHitTestSource)
          if (hitTestResults.length) {
            const hit = hitTestResults[0]
            const pose = hit.getPose(referenceSpace)

            if (pose) {
              hitMatrix.fromArray(pose.transform.matrix)
              hitTestCallback(hitMatrix, hit)
            }
          }
        })
      }
    }
  })
}

interface SessionStoreState {
  set: SetState<SessionStoreState>
  get: GetState<SessionStoreState>
  session: XRSession | null
}
const XRStore = create<SessionStoreState>((set, get) => ({ get, set, session: null }))

export interface XRManagerEvent {
  type: 'sessionstart' | 'sessionend'
  target: WebXRManager
}
export interface XRControllerEvent {
  type: XRControllerEventType
  data?: XRInputSource
}
export interface XRSessionEvent extends Event {
  session: XRSession
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

export function XR({
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
  const session = XRStore((state) => state.session)
  const set = XRStore((state) => state.set)
  const [isPresenting, setIsPresenting] = React.useState(() => gl.xr.isPresenting)
  const [isHandTracking, setHandTracking] = React.useState(false)
  const [player] = React.useState(() => new Group())
  const controllers = useControllers(player)

  React.useEffect(() => void gl.xr.setSession(session!), [gl.xr, session])
  React.useEffect(() => void gl.xr.setFoveation?.(foveation), [gl.xr, foveation])
  React.useEffect(() => void gl.xr.setReferenceSpaceType?.(referenceSpace), [gl.xr, referenceSpace])

  React.useEffect(() => {
    if (!session) return

    const handleSessionStart = (nativeEvent: XRManagerEvent) => {
      setIsPresenting(true)
      onSessionStart?.({ nativeEvent, session })
    }
    const handleSessionEnd = (nativeEvent: XRManagerEvent) => {
      setIsPresenting(false)
      set(() => ({ session: null }))
      onSessionEnd?.({ nativeEvent, session })
    }
    const handleVisibilityChange = (nativeEvent: XRSessionEvent) => {
      onVisibilityChange?.({ nativeEvent, session })
    }
    const handleInputSourcesChange = (nativeEvent: XRSessionEvent) => {
      setHandTracking(Object.values(session.inputSources).some((source) => source.hand))
      onInputSourcesChange?.({ nativeEvent, session })
    }

    gl.xr.addEventListener('sessionstart', handleSessionStart)
    gl.xr.addEventListener('sessionend', handleSessionEnd)
    session.addEventListener('visibilitychange', handleVisibilityChange as any)
    session.addEventListener('inputsourceschange', handleInputSourcesChange as any)

    return () => {
      gl.xr.removeEventListener('sessionstart', handleSessionStart)
      gl.xr.removeEventListener('sessionend', handleSessionEnd)
      session.removeEventListener('visibilitychange', handleVisibilityChange as any)
      session.removeEventListener('inputsourceschange', handleInputSourcesChange as any)
    }
  }, [session, set, gl.xr, onSessionStart, onSessionEnd, onVisibilityChange, onInputSourcesChange])

  const value = React.useMemo(
    () => ({ session, controllers, isPresenting, isHandTracking, player }),
    [session, controllers, isPresenting, isHandTracking, player]
  )

  return (
    <XRContext.Provider value={value}>
      <primitive object={player} dispose={null}>
        <primitive object={camera} dispose={null} />
      </primitive>
      {children}
    </XRContext.Provider>
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
  children?: React.ReactNode | ((status: XRButtonStatus) => React.ReactNode)
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
    if (!(navigator as Navigator)?.xr) return void setStatus('unsupported')
    ;(navigator as Navigator)
      .xr!.isSessionSupported(sessionMode)
      .then((supported: boolean) => setStatus(supported ? 'exited' : 'unsupported'))
  }, [sessionMode])

  React.useEffect(
    () =>
      XRStore.subscribe((state) => {
        if (state.session) {
          setStatus('entered')
        } else if (status !== 'unsupported') {
          setStatus('exited')
        }
      }),
    [status]
  )

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
      } else {
        session = await (navigator as Navigator).xr!.requestSession(sessionMode, sessionInit)
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
export function XRCanvas({
  foveation,
  referenceSpace,
  onSessionStart,
  onSessionEnd,
  onVisibilityChange,
  onInputSourcesChange,
  children,
  ...rest
}: XRCanvasProps) {
  return (
    <Canvas vr {...rest}>
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
}

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

export const useXR = () => {
  const xrValue = React.useContext(XRContext)
  const interactionsValue = React.useContext(InteractionsContext)

  const contextValue = React.useMemo(() => ({ ...xrValue, ...interactionsValue }), [xrValue, interactionsValue])

  return contextValue
}

/**
 * @deprecated R3F v8's built-in `useFrame` extends the `XRSession.requestAnimationFrame` signature:
 *
 * `useFrame((state, delta, xrFrame) => void)`
 *
 * @see https://mdn.io/XRFrame
 */
export const useXRFrame = (callback: (time: DOMHighResTimeStamp, xrFrame: XRFrame) => void) => {
  const { gl } = useThree()
  const requestRef = React.useRef<number>()
  const previousTimeRef = React.useRef<number>()

  const loop = React.useCallback(
    (time: DOMHighResTimeStamp, xrFrame: XRFrame) => {
      if (previousTimeRef.current !== undefined) {
        callback(time, xrFrame)
      }

      previousTimeRef.current = time
      requestRef.current = gl.xr.getSession()!.requestAnimationFrame(loop)
    },
    [gl.xr, callback]
  )

  React.useEffect(() => {
    const handleSessionChange = () => {
      if (!gl.xr?.isPresenting) return

      if (requestRef.current) {
        gl.xr.getSession()!.cancelAnimationFrame(requestRef.current)
      }

      requestRef.current = gl.xr.getSession()!.requestAnimationFrame(loop)
    }
    handleSessionChange()

    gl.xr.addEventListener('sessionstart', handleSessionChange)
    gl.xr.addEventListener('sessionend', handleSessionChange)

    return () => {
      gl.xr.removeEventListener('sessionstart', handleSessionChange)
      gl.xr.removeEventListener('sessionend', handleSessionChange)

      if (requestRef.current) {
        gl.xr.getSession()!.cancelAnimationFrame(requestRef.current)
      }
    }
  }, [loop, gl.xr])
}

export const useController = (handedness: XRHandedness) => {
  const { controllers } = useXR()
  const controller = React.useMemo(() => controllers.find((it) => it.inputSource.handedness === handedness), [handedness, controllers])

  return controller
}
