import { Canvas } from '@react-three/fiber'
import {
  useHover,
  createXRStore,
  XR,
  XROrigin,
  TeleportTarget,
  UnboundController,
  UnboundControllerComponent,
} from '@react-three/xr'
import { useRef, useState } from 'react'
import { Mesh, Vector3 } from 'three'

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
