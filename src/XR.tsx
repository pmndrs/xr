/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as React from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree, Props as ContainerProps } from '@react-three/fiber'
import { ARButton } from './webxr/ARButton'
import { VRButton } from './webxr/VRButton'
import { XRController } from './XRController'
import { InteractionManager, InteractionsContext } from './Interactions'

export interface XRContextValue {
  controllers: XRController[]
  isPresenting: boolean
  player: THREE.Group
  isHandTracking: boolean
}
const XRContext = React.createContext<XRContextValue>({} as any)

export type HitTestCallback = (hitMatrix: THREE.Matrix4, hit: XRHitTestResult) => void
export function useHitTest(hitTestCallback: HitTestCallback) {
  const hitTestSource = React.useRef<XRHitTestSource | undefined>()
  const hitTestSourceRequested = React.useRef(false)
  const [hitMatrix] = React.useState(() => new THREE.Matrix4())

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

export interface XRProps {
  foveation?: number
  children: React.ReactNode
}
export function XR({ foveation = 0, children }: XRProps) {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const [isPresenting, setIsPresenting] = React.useState(() => gl.xr.isPresenting)
  const [isHandTracking, setHandTracking] = React.useState(false)
  const [player] = React.useState(() => new THREE.Group())
  const [controllers, setControllers] = React.useState<XRController[]>([])

  React.useLayoutEffect(() => {
    const controllers = [0, 1].map((id) => new XRController(id, gl))
    setControllers(controllers)

    return () => controllers.forEach((controller) => controller.dispose())
  }, [gl.xr])

  React.useLayoutEffect(() => {
    const handleSessionChange = () => setIsPresenting(gl.xr.isPresenting)

    gl.xr.addEventListener('sessionstart', handleSessionChange)
    gl.xr.addEventListener('sessionend', handleSessionChange)

    return () => {
      gl.xr.removeEventListener('sessionstart', handleSessionChange)
      gl.xr.removeEventListener('sessionend', handleSessionChange)
    }
  }, [gl.xr])

  React.useLayoutEffect(() => void gl.xr.setFoveation?.(foveation), [gl, foveation])

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
        <primitive object={camera} />
        {controllers.map((controller, i) => (
          <primitive key={`controller-${i}`} object={controller} />
        ))}
      </primitive>
      {children}
    </XRContext.Provider>
  )
}

export interface XRCanvasProps extends ContainerProps {
  sessionInit?: XRSessionInit
  /**
   * Enables foveated rendering,
   * 0 = no foveation = full resolution,
   * 1 = maximum foveation = the edges render at lower resolution
   */
  foveation?: number
  hideButton?: boolean
}

function XRCanvas({ foveation, children, ...rest }: Omit<XRCanvasProps, 'sessionInit'>) {
  return (
    <Canvas {...rest}>
      <XR foveation={foveation}>
        <InteractionManager>{children}</InteractionManager>
      </XR>
    </Canvas>
  )
}

export function useXRButton(
  mode: 'AR' | 'VR',
  gl: THREE.WebGLRenderer,
  sessionInit?: XRSessionInit,
  container?: React.MutableRefObject<HTMLElement>
) {
  const button = React.useMemo<HTMLButtonElement | HTMLAnchorElement>(() => {
    const target = mode === 'AR' ? ARButton : VRButton
    return target.createButton(gl, sessionInit)
  }, [mode, gl, sessionInit])

  React.useLayoutEffect(() => {
    const parent = container?.current ?? document.body
    parent.appendChild(button)
    return () => void parent.removeChild(button)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [button])

  return button
}

export function XRButton({ mode, sessionInit }: { mode: 'AR' | 'VR'; sessionInit?: XRSessionInit }) {
  const gl = useThree((state) => state.gl)
  useXRButton(mode, gl, sessionInit)

  return null
}

export function VRCanvas({ children, sessionInit, hideButton, ...rest }: XRCanvasProps) {
  return (
    <XRCanvas {...rest}>
      {!hideButton && <XRButton mode="VR" sessionInit={sessionInit} />}
      {children}
    </XRCanvas>
  )
}

export function ARCanvas({ children, sessionInit, hideButton, ...rest }: XRCanvasProps) {
  return (
    <XRCanvas {...rest}>
      {!hideButton && <XRButton mode="AR" sessionInit={sessionInit} />}
      {children}
    </XRCanvas>
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
