import { Canvas, createPortal, useThree } from '@react-three/fiber'
import { createXRStore, XR, XRDomOverlay, XROrigin } from '@react-three/xr'
import { useState } from 'react'
import {} from '@react-three/drei'

const store = createXRStore()

export function App() {
  const [bool, setBool] = useState(false)
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas style={{ width: '100%', flexGrow: 1 }}>
        <XR store={store}>
          <XROrigin />

          <XRDomOverlay
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              style={{ backgroundColor: bool ? 'red' : 'green', padding: '1rem 2rem' }}
              onClick={() => setBool((b) => !b)}
            >
              Hello World
            </div>
          </XRDomOverlay>
        </XR>
      </Canvas>
    </>
  )
}
