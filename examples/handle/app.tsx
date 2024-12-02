import { Canvas, useThree } from '@react-three/fiber'
import { createXRStore, XR, XROrigin } from '@react-three/xr'
import { useEffect } from 'react'
import { forwardHtmlEvents } from '@pmndrs/pointer-events'
import { Environment } from '@react-three/drei'
import { Door } from './door.js'
import { Spaceship } from './spaceship.js'

const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas
        camera={{ position: [1, 1, 1] }}
        events={() => ({ enabled: false, priority: 0 })}
        style={{ width: '100%', flexGrow: 1 }}
      >
        <SwitchToXRPointerEvents />
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

export function SwitchToXRPointerEvents() {
  const domElement = useThree((s) => s.gl.domElement)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  useEffect(() => forwardHtmlEvents(domElement, () => camera, scene), [domElement, camera, scene])
  return null
}
