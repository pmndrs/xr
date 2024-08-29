import { Canvas, createPortal } from '@react-three/fiber'
import {
  useHover,
  createXRStore,
  XR,
  XROrigin,
  TeleportTarget,
  XRControllerGamepadComponentId,
  XRControllerState,
  useLoadXRControllerLayout,
  useLoadXRControllerModel,
  getXRControllerComponentObject,
} from '@react-three/xr'
import { createContext, FC, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react'
import { Mesh, Object3D, Vector3 } from 'three'

const store = createXRStore({
  hand: { teleportPointer: true },
  controller: { teleportPointer: true },
})

export function App() {
  const [position, setPosition] = useState(new Vector3())
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas style={{ width: '100%', flexGrow: 1 }}>
        <XR store={store}>
          <ambientLight />
          <XROrigin position={position} />
          <Cube />

          <group scale={10} position={[0, 0, 4]} rotation={[Math.PI / 2, 0, -Math.PI / 4]}>
            <DemoController />
          </group>
          <TeleportTarget onTeleport={setPosition}>
            <mesh scale={[10, 1, 10]} position={[0, -0.5, 0]}>
              <boxGeometry />
              <meshBasicMaterial color="green" />
            </mesh>
          </TeleportTarget>
        </XR>
      </Canvas>
    </>
  )
}

const unboundControllerContext = createContext<XRControllerState | undefined>(undefined)

export const UnboundController: FC<PropsWithChildren<{ profileIds: string[] }>> = ({ profileIds, children }) => {
  const layout = useLoadXRControllerLayout(['meta-quest-touch-plus'], 'right')
  const model = useLoadXRControllerModel(layout)

  return model ? (
    <unboundControllerContext.Provider value={{ model, layout }}>
      <primitive object={model} />
      {children}
    </unboundControllerContext.Provider>
  ) : null
}

export const UnboundControllerComponent: FC<PropsWithChildren<{ id: XRControllerGamepadComponentId }>> = ({
  id,
  children,
}) => {
  const [object, setObject] = useState<Object3D | undefined>(undefined)
  const { model, layout } = useContext(unboundControllerContext)

  useEffect(() => {
    if (!model) {
      return
    }
    const component = getXRControllerComponentObject(model, layout, id)

    setObject(component?.object)
  }, [model, layout, id])
  return object ? createPortal(children, object) : null
}

function DemoController() {
  return (
    <UnboundController profileIds={['meta-quest-touch-plus']}>
      <UnboundControllerComponent id={'a-button'}>
        <mesh>
          <sphereGeometry args={[0.01]} />
          <meshBasicMaterial color={0xff0000} />
        </mesh>
      </UnboundControllerComponent>
      <UnboundControllerComponent id={'b-button'}>
        <mesh>
          <sphereGeometry args={[0.01]} />
          <meshBasicMaterial color={0xff0000} />
        </mesh>
      </UnboundControllerComponent>
    </UnboundController>
  )
}

function Cube() {
  const ref = useRef<Mesh>(null)
  const hover = useHover(ref)
  return (
    <mesh
      onClick={() => store.setHand({ rayPointer: { cursorModel: { color: 'green' } } }, 'right')}
      position={[0, 2, 0]}
      pointerEventsType={{ deny: 'grab' }}
      ref={ref}
    >
      <boxGeometry />
      <meshBasicMaterial color={hover ? 'red' : 'blue'} />
    </mesh>
  )
}
