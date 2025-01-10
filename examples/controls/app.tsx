import { Canvas } from '@react-three/fiber'
import { createXRStore, noEvents, PointerEvents, XR } from '@react-three/xr'
import { Environment } from '@react-three/drei'
import { OrbitHandles, PivotControls, MapControls, OrbitControls, TransformControls } from '@react-three/handle'

const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas camera={{ position: [1, 1, 1] }} events={noEvents} style={{ width: '100%', flexGrow: 1 }}>
        <PointerEvents />
        <OrbitControls />
        <XR store={store}>
          <color args={[0x0]} attach="background" />
          <Environment preset="city" />
          <mesh position-z={-3}>
            <boxGeometry />
            <meshStandardMaterial color="green" />
          </mesh>
          <PivotControls>
            <mesh>
              <boxGeometry />
              <meshStandardMaterial color="red" />
            </mesh>
          </PivotControls>

          <mesh position={[0, -1, 0]} rotation-x={-Math.PI / 2} scale={10}>
            <planeGeometry />
            <meshStandardMaterial color="blue" />
          </mesh>
        </XR>
      </Canvas>
    </>
  )
}
