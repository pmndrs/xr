import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'
import { useEffect, useMemo, useRef } from 'react'
import { Group, Mesh } from 'three'
import { useHandle } from '@react-three/handle'
import { forwardHtmlEvents } from '@pmndrs/pointer-events'

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
          <ambientLight />
          <directionalLight position={[1, 1, 1]} />
          <Cube />
          <Cube />
          {/*<Smoke count={100} maxSize={0.3} minSize={0.1} spawnRate={10} speed={0.1} />
          <TeleportTarget onTeleport={setPosition}>
            <mesh scale={[10, 1, 10]} position={[0, -0.5, 0]}>
              <boxGeometry />
              <meshBasicMaterial color="green" />
            </mesh>
          </TeleportTarget>*/}
        </XR>
      </Canvas>
    </>
  )
}

function Cube() {
  const ref = useRef<Mesh>(null)
  const xHandleRef = useRef<Mesh>(null)
  const yHandleRef = useRef<Mesh>(null)
  const zHandleRef = useRef<Mesh>(null)
  useHandle(
    (state) => {
      const mesh = ref.current
      if (mesh == null) {
        return
      }
      mesh.scale.x = state.current.scale.x
      if (xHandleRef.current != null) {
        xHandleRef.current.scale.x = 0.1 / mesh.scale.x
      }
      if (yHandleRef.current != null) {
        yHandleRef.current.scale.x = 0.1 / mesh.scale.x
      }
      if (zHandleRef.current != null) {
        zHandleRef.current.scale.x = 0.1 / mesh.scale.x
      }
    },
    {
      target: ref,
      handle: xHandleRef,
      translate: 'as-scale',
      scale: 'x',
    },
  )
  useHandle(
    (state) => {
      const mesh = ref.current
      if (mesh == null) {
        return
      }
      mesh.scale.y = state.current.scale.y
      if (xHandleRef.current != null) {
        xHandleRef.current.scale.y = 0.1 / mesh.scale.y
      }
      if (yHandleRef.current != null) {
        yHandleRef.current.scale.y = 0.1 / mesh.scale.y
      }
      if (zHandleRef.current != null) {
        zHandleRef.current.scale.y = 0.1 / mesh.scale.y
      }
    },
    {
      target: ref,
      handle: yHandleRef,
      translate: 'as-scale',
      scale: 'y',
    },
  )
  useHandle(
    (state) => {
      const mesh = ref.current
      if (mesh == null) {
        return
      }
      mesh.rotation.x = state.current.rotation.x
    },
    {
      target: ref,
      handle: zHandleRef,
      translate: 'as-rotate',
      rotate: 'x',
    },
  )
  useHandle(
    (state) => {
      ref.current?.position.copy(state.current.position)
      ref.current?.quaternion.copy(state.current.quaternion)
      if (state.current.pointerAmount > 1) {
        ref.current?.scale.copy(state.current.scale)
        if (ref.current != null) {
          xHandleRef.current?.scale.setScalar(0.1).divide(ref.current.scale)
          yHandleRef.current?.scale.setScalar(0.1).divide(ref.current.scale)
          zHandleRef.current?.scale.setScalar(0.1).divide(ref.current.scale)
        }
      }
    },
    {
      target: ref,
      translate: 'x',
      rotate: false,
    },
  )
  return (
    <group position-y={-2}>
      <mesh
        rotation-x={Math.PI / 2}
        rotation-y={Math.PI / 2}
        rotation-z={Math.PI / 2}
        rotation-order="XZY"
        scale={1}
        pointerEventsType={{ deny: 'touch' }}
        ref={ref}
      >
        <boxGeometry />
        <meshPhongMaterial color="red" />
        <mesh
          pointerEventsOrder={1}
          renderOrder={1}
          scale={0.1}
          position-x={0.7}
          pointerEventsType={{ deny: 'touch' }}
          ref={xHandleRef}
        >
          <boxGeometry />
          <meshBasicMaterial depthTest={false} color="blue" />
        </mesh>

        <mesh
          pointerEventsOrder={1}
          renderOrder={1}
          scale={0.1}
          position-y={0.7}
          pointerEventsType={{ deny: 'touch' }}
          ref={yHandleRef}
        >
          <boxGeometry />
          <meshBasicMaterial depthTest={false} color="yellow" />
        </mesh>

        <mesh
          pointerEventsOrder={1}
          renderOrder={1}
          scale={0.1}
          position-z={0.7}
          pointerEventsType={{ deny: 'touch' }}
          ref={zHandleRef}
        >
          <boxGeometry />
          <meshBasicMaterial depthTest={false} color="green" />
        </mesh>
      </mesh>
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
