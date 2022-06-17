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

export interface XRProps {
  /**
   * Enables foveated rendering,
   * 0 = no foveation = full resolution,
   * 1 = maximum foveation = the edges render at lower resolution
   */
  foveation?: number
  /** Type of WebXR reference space to use. */
  referenceSpace?: XRReferenceSpaceType
  children: React.ReactNode
}

export function XR({ foveation = 0, referenceSpace = 'local-floor', children }: XRProps) {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const [isPresenting, setIsPresenting] = React.useState(() => gl.xr.isPresenting)
  const [isHandTracking, setHandTracking] = React.useState(false)
  const [player] = React.useState(() => new Group())
  const controllers = useControllers(player)

  React.useEffect(
    () =>
      sessionStore.subscribe(({ session }) => {
        const activeSession = gl.xr.getSession()
        if (!session || session === activeSession) return

        gl.xr.setSession(session!)
      }),
    [gl.xr]
  )

  React.useEffect(() => void gl.xr.setFoveation?.(foveation), [gl.xr, foveation])
  React.useEffect(() => void gl.xr.setReferenceSpaceType?.(referenceSpace), [gl.xr, referenceSpace])

  React.useEffect(() => {
    const handleSessionChange = () => setIsPresenting(gl.xr.isPresenting)

    gl.xr.addEventListener('sessionstart', handleSessionChange)
    gl.xr.addEventListener('sessionend', handleSessionChange)

    return () => {
      gl.xr.removeEventListener('sessionstart', handleSessionChange)
      gl.xr.removeEventListener('sessionend', handleSessionChange)
    }
  }, [gl.xr])

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
    <button {...props} ref={ref} onClick={status === 'unsupported' ? onClick : toggleSession}>
      {typeof children === 'function' ? children(status) : children ?? label}
    </button>
  )
})

export interface XRCanvasProps extends ContainerProps, XRProps {}
export function XRCanvas({ foveation, referenceSpace, children, ...rest }: XRCanvasProps) {
  return (
    <Canvas {...rest}>
      <XR foveation={foveation} referenceSpace={referenceSpace}>
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

export const useController = (handedness: XRHandedness) => {
  const { controllers } = useXR()
  const controller = React.useMemo(() => controllers.find((it) => it.inputSource.handedness === handedness), [handedness, controllers])

  return controller
}
