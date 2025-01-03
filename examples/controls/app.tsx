import { Canvas } from '@react-three/fiber'
import { createXRStore, noEvents, PointerEvents, XR, XROrigin } from '@react-three/xr'
import { Environment, OrbitControls } from '@react-three/drei'
import { RotateControls, TranslateControls } from '@react-three/handle'

const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas camera={{ position: [1, 1, 1] }} events={noEvents} style={{ width: '100%', flexGrow: 1 }}>
        <PointerEvents />
        <XR store={store}>
          <color args={[0x0]} attach="background" />
          <Environment preset="city" />
          <RotateControls>
            <mesh>
              <boxGeometry />
              <meshStandardMaterial color="red" />
            </mesh>
          </RotateControls>
        </XR>
      </Canvas>
    </>
  )
}
