import { Canvas } from '@react-three/fiber'
import { useHover, createXRStore, XR, XROrigin, TeleportTarget, useXRInputSourceStates } from '@react-three/xr'
import { useRef, useState } from 'react'
import { Mesh, Vector3 } from 'three'
import { Smoke } from './smoke.js'

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
          {/*<Smoke count={100} maxSize={0.3} minSize={0.1} spawnRate={10} speed={0.1} />
          <TeleportTarget onTeleport={setPosition}>
            <mesh scale={[10, 1, 10]} position={[0, -0.5, 0]}>
              <boxGeometry />
              <meshBasicMaterial color="green" />
            </mesh>
          </TeleportTarget>*/}
        </XR>
      </Canvas>
    </>
  )
}

function Cube() {
  const ref = useRef<Mesh>(null)
  const hover = useHover(ref)
  const [toggle, setToggle] = useState(false)
  return (
    <mesh
      onClick={() => setToggle((x) => !x)}
      position={[0, 1, -1]}
      scale={0.1}
      pointerEventsType={{ deny: 'grab' }}
      ref={ref}
    >
      <boxGeometry />
      <meshBasicMaterial color={toggle ? 'white' : hover ? 'red' : 'blue'} />
    </mesh>
  )
}
