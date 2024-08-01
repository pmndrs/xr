import { Canvas, createPortal, useThree } from '@react-three/fiber'
import { createXRStore, XR, XRDomOverlay, XROrigin } from '@react-three/xr'
import { useEffect, useState } from 'react'
import {} from '@react-three/drei'

const store = createXRStore({})

export function App() {
  const [bool, setBool] = useState(false)
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas style={{ width: '100%', flexGrow: 1 }}>
        <XR store={store}>
          <XROrigin />
          <ambientLight />

          <ViewerBox />
        </XR>
      </Canvas>
    </>
  )
}

function ViewerBox() {
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const [red, setRed] = useState(false)
  return (
    <>
      <primitive object={camera} />
      {createPortal(
        <mesh onClick={() => setRed((r) => !r)} position-z={-5}>
          <boxGeometry />
          <meshBasicMaterial color={red ? 'red' : 'green'} />
        </mesh>,
        camera,
      )}
    </>
  )
}
