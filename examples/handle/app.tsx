import { Canvas } from '@react-three/fiber'
import { createXRStore, noEvents, PointerEvents, XR, XROrigin } from '@react-three/xr'
import { Environment } from '@react-three/drei'
import { Door } from './door.js'
import { Spaceship } from './spaceship.js'

const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas camera={{ position: [1, 1, 1] }} events={noEvents} style={{ width: '100%', flexGrow: 1 }}>
        <PointerEvents />
        <XR store={store}>
          <Environment preset="city" />
          <Door scale={0.01} />
          <Spaceship scale={1.5} position-y={-2.7} position-z={-1} />
          <XROrigin position={[0, 0, -2.7]} rotation-y={Math.PI} />
        </XR>
      </Canvas>
    </>
  )
}
