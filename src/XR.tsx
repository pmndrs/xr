import * as React from 'react'
import { Canvas, useFrame, useThree, Props as ContainerProps } from '@react-three/fiber'
import { XRController } from './XRController'
import { InteractionManager, InteractionsContext } from './Interactions'
import { Matrix4, Group } from 'three'
import create, { GetState, SetState } from 'zustand'

export interface XRContextValue {
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

export function useHitTest(hitTestCallback: (hitMatrix: Matrix4, hit: XRHitTestResult) => void) {
  const { gl } = useThree()

  const hitTestSource = React.useRef<XRHitTestSource | undefined>()
  const hitTestSourceRequested = React.useRef(false)
  const [hitMatrix] = React.useState(() => new Matrix4())

  useFrame((_, __, frame) => {
    if (!gl.xr.isPresenting) return

    const session = gl.xr.getSession()
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

    if (hitTestSource.current && gl.xr.isPresenting && frame) {
      const referenceSpace = gl.xr.getReferenceSpace()

      if (referenceSpace) {
        const hitTestResults = frame.getHitTestResults(hitTestSource.current as XRHitTestSource)
        if (hitTestResults.length) {
          const hit = hitTestResults[0]
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

interface SessionStoreState {
  set: SetState<SessionStoreState>
  get: GetState<SessionStoreState>
  session: XRSession | null
}
const sessionStore = create<SessionStoreState>((set, get) => ({ get, set, session: null }))

export function XR({ foveation = 0, children }: { foveation?: number; children: React.ReactNode }) {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const [isPresenting, setIsPresenting] = React.useState(() => gl.xr.isPresenting)
  const [isHandTracking, setHandTracking] = React.useState(false)
  const [player] = React.useState(() => new Group())
  const controllers = useControllers(player)

  React.useEffect(
    () =>
      sessionStore.subscribe((sessionState) => {
        if (!sessionState.session) return

        const session = gl.xr.getSession()
        if (sessionState.session !== session) {
          gl.xr.setSession(sessionState.session!)
        }
      }),
    [gl.xr]
  )

  React.useEffect(() => {
    const xr = gl.xr as any

    const handleSessionChange = () => setIsPresenting(xr.isPresenting)

    xr.addEventListener('sessionstart', handleSessionChange)
    xr.addEventListener('sessionend', handleSessionChange)

    return () => {
      xr.removeEventListener('sessionstart', handleSessionChange)
      xr.removeEventListener('sessionend', handleSessionChange)
    }
  }, [gl])

  React.useEffect(() => {
    const xr = gl.xr as any

    if (xr.setFoveation) {
      xr.setFoveation(foveation)
    }
  }, [gl, foveation])

  React.useEffect(() => {
    const session = gl.xr.getSession()

    const handleInputSourcesChange = (event: Event | XRInputSourceChangeEvent) =>
      setHandTracking(Object.values((event as XRInputSourceChangeEvent).session.inputSources).some((source) => source.hand))

    session?.addEventListener('inputsourceschange', handleInputSourcesChange)

    setHandTracking(Object.values(session?.inputSources ?? []).some((source) => source.hand))

    return () => {
      session?.removeEventListener('inputsourceschange', handleInputSourcesChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresenting])

  const value = React.useMemo(
    () => ({ controllers, isPresenting, isHandTracking, player }),
    [controllers, isPresenting, isHandTracking, player]
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
export interface XRButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The type of `XRSession` to create */
  mode: 'AR' | 'VR' | 'inline'
  /**
   * `XRSession` configuration options.
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
    sessionInit = mode === 'VR' ? { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] } : {},
    enterOnly = false,
    exitOnly = false,
    style = {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: '24px',
      padding: '12px 24px',
      border: '1px solid white',
      borderRadius: '4px',
      background: 'rgba(0, 0, 0, 0.1)',
      color: 'white',
      font: 'normal 0.8125rem sans-serif',
      outline: 'none',
      zIndex: 99999,
      cursor: 'pointer',
      margin: '0 auto'
    },
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

      const sessionState = sessionStore.getState()

      // Bail if button only configures exit/enter
      if (sessionState.session && enterOnly) return
      if (!sessionState.session && exitOnly) return

      // Exit/enter session
      if (sessionState.session) {
        await sessionState.session.end()
        setStatus('exited')
      } else {
        const session = await navigator.xr!.requestSession(sessionMode, sessionInit)
        sessionState.set(() => ({ session }))
        setStatus('entered')
      }
    },
    [onClick, enterOnly, exitOnly, sessionMode, sessionInit]
  )

  return (
    <button {...props} ref={ref} style={style} onClick={status === 'unsupported' ? onClick : toggleSession}>
      {typeof children === 'function' ? children(status) : children ?? label}
    </button>
  )
})

export interface XRCanvasProps extends ContainerProps {
  /**
   * Enables foveated rendering,
   * 0 = no foveation = full resolution,
   * 1 = maximum foveation = the edges render at lower resolution
   */
  foveation?: number
}
export function XRCanvas({ foveation, children, ...rest }: XRCanvasProps) {
  return (
    <Canvas {...rest}>
      <XR foveation={foveation}>
        <InteractionManager>{children}</InteractionManager>
      </XR>
    </Canvas>
  )
}

export interface VRCanvasProps extends XRCanvasProps {
  hideButton?: boolean
  sessionInit?: XRSessionInit
}
export function VRCanvas({ hideButton, sessionInit, children, ...rest }: VRCanvasProps) {
  return (
    <>
      {!hideButton && <XRButton mode="VR" sessionInit={sessionInit} />}
      <XRCanvas {...rest}>{children}</XRCanvas>
    </>
  )
}

export interface ARCanvasProps extends XRCanvasProps {
  hideButton?: boolean
  sessionInit?: XRSessionInit
}
export function ARCanvas({ hideButton, sessionInit, children, ...rest }: ARCanvasProps) {
  return (
    <>
      {!hideButton && <XRButton mode="AR" sessionInit={sessionInit} />}
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

export const useController = (handedness: XRHandedness) => {
  const { controllers } = useXR()
  const controller = React.useMemo(() => controllers.find((it) => it.inputSource.handedness === handedness), [handedness, controllers])

  return controller
}
