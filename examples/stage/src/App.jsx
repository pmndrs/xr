import { Canvas } from '@react-three/fiber'
import { Center, AccumulativeShadows, RandomizedLight, Environment, OrbitControls } from '@react-three/drei'
import { Model } from './Datsun.jsx'
import { XROrigin, XR, createXRStore } from '@react-three/xr'
import { Suspense } from 'react'

const store = createXRStore({ depthSensing: true, hand: false })

export default function App() {
  return (
    <>
      <button
        style={{
          position: 'absolute',
          zIndex: 10000,
          background: 'black',
          borderRadius: '0.5rem',
          border: 'none',
          fontWeight: 'bold',
          color: 'white',
          padding: '1rem 2rem',
          cursor: 'pointer',
          fontSize: '1.5rem',
          bottom: '1rem',
          left: '50%',
          boxShadow: '0px 0px 20px rgba(0,0,0,1)',
          transform: 'translate(-50%, 0)',
        }}
        onClick={() => store.enterAR()}
      >
        Enter AR
      </button>
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
          <Suspense>
            <Environment preset="dawn" blur={1} />
          </Suspense>
        </XR>
      </Canvas>
    </>
  )
}
