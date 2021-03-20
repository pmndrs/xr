import * as React from 'react'
import { Canvas, useFrame, useThree } from 'react-three-fiber'
import { ARButton } from 'three/examples/jsm/webxr/ARButton'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'
import { XRHandedness, XRReferenceSpace, XRFrame, XRHitTestSource, XRHitTestResult } from './webxr'
import { XRController } from './XRController'
import { ContainerProps } from 'react-three-fiber/targets/shared/web/ResizeContainer'
import { InteractionManager, InteractionsContext } from './Interactions'
import { Group, Matrix4 } from 'three'

export interface XRContextValue {
  controllers: XRController[]
  isPresenting: boolean
  player: Group
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
          setControllers((it) => [...it, controller])
        },
        (controller) => {
          group.remove(controller.controller)
          group.remove(controller.grip)
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

  useFrame(() => {
    if (!gl.xr.isPresenting) return

    const session = gl.xr.getSession()
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
      // This raf is unnecesary, we should get XRFrame from r3f but it's not implemented yet
      session.requestAnimationFrame((_time: DOMHighResTimeStamp, xrFrame: XRFrame) => {
        const hitTestResults = xrFrame.getHitTestResults(hitTestSource.current as XRHitTestSource)
        if (hitTestResults.length) {
          const hit = hitTestResults[0]
          hitMatrix.fromArray(hit.getPose(referenceSpace).transform.matrix)
          hitTestCallback(hitMatrix, hit)
        }
      })
    }
  })
}

export function XR(props: { children: React.ReactNode }) {
  const { gl, camera } = useThree()
  const [isPresenting, setIsPresenting] = React.useState(() => gl.xr.isPresenting)
  const [player] = React.useState(() => new Group())
  const controllers = useControllers(player)

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

  const value = React.useMemo(() => ({ controllers, isPresenting, player }), [controllers, isPresenting, player])

  return (
    <XRContext.Provider value={value}>
      <primitive object={player} dispose={null}>
        <primitive object={camera} dispose={null} />
      </primitive>
      {props.children}
    </XRContext.Provider>
  )
}

function XRCanvas({ children, ...rest }: ContainerProps) {
  return (
    <Canvas vr {...rest}>
      <XR>
        <InteractionManager>{children}</InteractionManager>
      </XR>
    </Canvas>
  )
}

export function VRCanvas({ children, ...rest }: ContainerProps) {
  return (
    <XRCanvas onCreated={({ gl }) => void document.body.appendChild(VRButton.createButton(gl))} {...rest}>
      {children}
    </XRCanvas>
  )
}

export function ARCanvas({ children, sessionInit, ...rest }: ContainerProps & { sessionInit?: any }) {
  return (
    <XRCanvas onCreated={({ gl }) => void document.body.appendChild(ARButton.createButton(gl, sessionInit))} {...rest}>
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

export const useXRFrame = (callback: (time: DOMHighResTimeStamp, xrFrame: XRFrame) => void) => {
  const { gl } = useThree()
  const requestRef = React.useRef()
  const previousTimeRef = React.useRef()

  const loop = React.useCallback((time: DOMHighResTimeStamp, xrFrame: XRFrame) => {
    if (previousTimeRef.current !== undefined) {
      callback(time, xrFrame)
    }

    previousTimeRef.current = time
    requestRef.current = gl.xr.getSession().requestAnimationFrame(loop)
  }, [gl.xr, callback])

  React.useEffect(() => {
    if (!gl.xr?.isPresenting) {
      return
    }

    requestRef.current = gl.xr.getSession().requestAnimationFrame(loop)

    return () => {
      gl.xr.getSession().cancelAnimationFrame(requestRef.current )
    }
  }, [gl.xr.isPresenting, loop])
}

export const useController = (handedness: XRHandedness) => {
  const { controllers } = useXR()
  const controller = React.useMemo(() => controllers.find((it) => it.inputSource.handedness === handedness), [handedness, controllers])

  return controller
}
