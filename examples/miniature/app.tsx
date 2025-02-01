import { Canvas } from '@react-three/fiber'
import { createXRStore, XR, XROrigin } from '@react-three/xr'
import { useEffect, useState } from 'react'
import { Gltf, OrbitControls } from '@react-three/drei'
import { useStore } from 'zustand'

const store = createXRStore({ offerSession: 'immersive-vr' })

export function App() {
  const [miniature, setMinitature] = useState(false)
  const session = useStore(store, (xr) => xr.session)
  useEffect(() => {
    if (session == null) {
      return
    }
    const listener = () => setMinitature((miniature) => !miniature)
    session.addEventListener('select', listener)
    return () => session.removeEventListener('select', listener)
  }, [session])
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <Canvas>
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight intensity={2} position={[1, 1, 1]} />
        <XR store={store}>
          <Gltf frustumCulled={false} src="model.glb" />
          <XROrigin scale={miniature ? 70 : 1} position-y={miniature ? -1 : 0} position-z={miniature ? 70 : 0} />
        </XR>
      </Canvas>
    </>
  )
}
