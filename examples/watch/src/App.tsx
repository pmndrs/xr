import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { IfInSessionMode, XR, createXRStore } from '@react-three/xr'
import React from 'react'
import { HandWithWatch, Watch } from './Hand.jsx'

const store = createXRStore({
  hand: {
    right: HandWithWatch,
    left: { model: { colorWrite: false, renderOrder: -1 }, grabPointer: false, rayPointer: false },
  },
  foveation: 0,
  bounded: false,
})

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
      <Canvas shadows camera={{ position: [0, 0, 0.3], fov: 25 }}>
        <XR store={store}>
          <IfInSessionMode deny="immersive-ar">
            <OrbitControls />
            <group position={[-0.057, 0, 0]} rotation={[-Math.PI / 2, 0, (-0.85 * Math.PI) / 2, 'XYZ']}>
              <Watch />
            </group>
          </IfInSessionMode>
          <ambientLight intensity={2} />
          <directionalLight intensity={2} position={[10, 10, 10]} />
        </XR>
      </Canvas>
    </>
  )
}
