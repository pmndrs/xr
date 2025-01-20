import { Canvas, useFrame } from '@react-three/fiber'
import {
  createXRStore,
  noEvents,
  PointerEvents,
  useXRControllerLocomotion,
  useXRInputSourceState,
  XR,
  XROrigin,
} from '@react-three/xr'
import { Environment, Sky } from '@react-three/drei'
import { Door } from './door.js'
import { Spaceship } from './spaceship.js'
import { Ship } from './ship.js'
import { OrbitHandles } from '@react-three/handle'
import { useRef } from 'react'
import { Group } from 'three'

const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas camera={{ position: [1, 1, 1] }} events={noEvents} style={{ width: '100%', flexGrow: 1 }}>
        <PointerEvents />
        <OrbitHandles />
        <Sky />
        <XR store={store}>
          <Locomotion />
          <Environment preset="city" />
          <Ship frustumCulled={false} scale={3} />
        </XR>
      </Canvas>
    </>
  )
}

function Locomotion() {
  const ref = useRef<Group>(null)
  useXRControllerLocomotion(ref)
  return <XROrigin position-x={6} position-y={4.7} ref={ref} />
}
