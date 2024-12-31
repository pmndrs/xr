import { Canvas } from '@react-three/fiber'
import { createXRStore, noEvents, PointerEvents, XR, XROrigin } from '@react-three/xr'
import { Environment } from '@react-three/drei'
import { TranslateControls } from '@react-three/handle'

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
          <TranslateControls>
            <mesh>
              <boxGeometry />
              <meshStandardMaterial color="red" />
            </mesh>
          </TranslateControls>
        </XR>
      </Canvas>
    </>
  )
}
