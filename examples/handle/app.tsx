import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'
import { useEffect, useRef } from 'react'
import { BufferGeometry, Mesh, Vector3 } from 'three'
import { Handle, HandleTarget, useHandle } from '@react-three/handle'
import { forwardHtmlEvents } from '@pmndrs/pointer-events'
import { Environment } from '@react-three/drei'

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
          <directionalLight position={[1, 1, 1]} />
          <Cube />
          <Cube />
          {/*<Smoke count={100} maxSize={0.3} minSize={0.1} spawnRate={10} speed={0.1} />
          <TeleportTarget onTeleport={setPosition}>
            <mesh scale={[10, 1, 10]} position={[0, -0.5, 0]}>
              <boxGeometry />
              <meshStandardMaterial color="green" />
            </mesh>
          </TeleportTarget>*/}
        </XR>
      </Canvas>
    </>
  )
}

function Cube() {
  return (
    <group position-y={-2}>
      <HandleTarget>
        <Handle>
          <mesh rotation-order="XZY" scale={1} pointerEventsType={{ deny: 'touch' }}>
            <boxGeometry />
            <meshStandardMaterial color="red" />
            <Handle scale="x" translate="as-scale">
              <mesh
                pointerEventsOrder={1}
                renderOrder={1}
                scale={0.1}
                position-x={0.7}
                pointerEventsType={{ deny: 'touch' }}
              >
                <boxGeometry />
                <meshStandardMaterial depthTest={false} color="blue" />
              </mesh>
            </Handle>

            <Handle translate="as-rotate" rotate="x">
              <mesh
                pointerEventsOrder={1}
                renderOrder={1}
                scale={0.1}
                position-y={0.7}
                pointerEventsType={{ deny: 'touch' }}
              >
                <boxGeometry />
                <meshStandardMaterial depthTest={false} color="yellow" />
              </mesh>
            </Handle>

            <Handle translate="as-rotate-and-scale">
              <mesh
                pointerEventsOrder={1}
                renderOrder={1}
                scale={0.1}
                position-z={0.7}
                pointerEventsType={{ deny: 'touch' }}
              >
                <boxGeometry />
                <meshStandardMaterial depthTest={false} color="green" />
              </mesh>
            </Handle>
          </mesh>
        </Handle>
      </HandleTarget>
    </group>
  )
}

export function SwitchToXRPointerEvents() {
  const domElement = useThree((s) => s.gl.domElement)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  useEffect(() => forwardHtmlEvents(domElement, () => camera, scene), [domElement, camera, scene])
  return null
}
