import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { SoftShadows, Float, CameraControls, Sky, PerformanceMonitor } from '@react-three/drei'
import { easing } from 'maath'
import { Model as Room } from './Room.jsx'
import { XR, XROrigin, createXRStore } from '@react-three/xr'

function Light() {
  const ref = useRef()
  useFrame((state, delta) => {
    easing.dampE(
      ref.current.rotation,
      [(state.pointer.y * Math.PI) / 50, (state.pointer.x * Math.PI) / 20, 0],
      0.2,
      delta,
    )
  })
  return (
    <group ref={ref}>
      <directionalLight position={[5, 5, -8]} castShadow intensity={5} shadow-mapSize={2048} shadow-bias={-0.001}>
        <orthographicCamera attach="shadow-camera" args={[-8.5, 8.5, 8.5, -8.5, 0.1, 20]} />
      </directionalLight>
    </group>
  )
}

const store = createXRStore()

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
        onClick={() => store.enterVR()}
      >
        Enter VR
      </button>
      <Canvas shadows camera={{ position: [5, 2, 10], fov: 50 }}>
        <XR store={store}>
          <PerformanceMonitor onDecline={() => set(true)} />
          <SoftShadows />
          <CameraControls makeDefault />
          <color attach="background" args={['#d0d0d0']} />
          <fog attach="fog" args={['#d0d0d0', 8, 35]} />
          <ambientLight intensity={0.4} />
          <Light />
          <Room scale={0.5} position={[0, -1, 0]} />
          <Sphere />
          <Sphere position={[2, 4, -8]} scale={0.9} />
          <Sphere position={[-2, 2, -8]} scale={0.8} />
          <Sky inclination={0.52} scale={20} />
          <XROrigin scale={2} position={[-3.5, -1.85, 3.5]} />
        </XR>
      </Canvas>
    </>
  )
}

function Sphere({ color = 'hotpink', floatIntensity = 15, position = [0, 5, -8], scale = 1 }) {
  return (
    <Float floatIntensity={floatIntensity}>
      <mesh castShadow position={position} scale={scale}>
        <sphereGeometry />
        <meshBasicMaterial color={color} roughness={1} />
      </mesh>
    </Float>
  )
}
