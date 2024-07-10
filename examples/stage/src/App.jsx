import { Canvas } from '@react-three/fiber'
import { Center, AccumulativeShadows, RandomizedLight, Environment, OrbitControls } from '@react-three/drei'
import { Model } from './Datsun.jsx'
import { XROrigin, XR, createXRStore } from '@react-three/xr'
import { Suspense } from 'react'

const store = createXRStore()

export default function App() {
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas shadows camera={{ position: [4, 0, 6], fov: 35 }}>
        <XR store={store}>
          <group position={[0, -0.75, 0]}>
            <Suspense>
              <Center top>
                <Model />
              </Center>
            </Suspense>
            <directionalLight position={[1, 8, 1]} castShadow />
            <ambientLight />
            <mesh receiveShadow rotation-x={-Math.PI / 2} scale={100}>
              <shadowMaterial opacity={0.7} />
              <planeGeometry />
            </mesh>
            <group position={[0, 0, 2.6]}>
              <XROrigin />
            </group>
          </group>
          <OrbitControls />
          <Environment preset="dawn" blur={1} />
        </XR>
      </Canvas>
    </>
  )
}
