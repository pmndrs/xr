import * as React from 'react'
import { Canvas, useThree } from 'react-three-fiber'
import { ARButton } from 'three/examples/jsm/webxr/ARButton'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'
import { XRHandedness } from './webxr'
import { XRController } from './XRController'
import { ContainerProps } from 'react-three-fiber/targets/shared/web/ResizeContainer'
import { InteractionManager, InteractionsContext } from './Interactions'
import { Group } from 'three'

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
    <Canvas vr colorManagement {...rest}>
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

export function ARCanvas({ children, ...rest }: ContainerProps) {
  return (
    <XRCanvas onCreated={({ gl }) => void document.body.appendChild(ARButton.createButton(gl))} {...rest}>
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
