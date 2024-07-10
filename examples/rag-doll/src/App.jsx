import { Canvas } from '@react-three/fiber'
import { MeshReflectorMaterial, OrbitControls } from '@react-three/drei'
import { Physics, usePlane } from '@react-three/cannon'
import { Cursor } from './helpers/Drag.js'
import { Guy } from './components/Guy.jsx'
import { Mug, Chair, Table, Lamp } from './components/Furniture.jsx'
import { createXRStore, XR, XROrigin } from '@react-three/xr'
import { Suspense } from 'react'

const store = createXRStore({
  hand: { touchPointer: false },
})

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <Canvas dpr={[1, 2]} shadows camera={{ position: [-40, 40, 40], fov: 25, near: 1, far: 100 }}>
        <OrbitControls />
        <XR store={store}>
          <color attach="background" args={['#171720']} />
          <fog attach="fog" args={['#171720', 60, 90]} />
          <ambientLight intensity={0.2} />
          <pointLight position={[-20, -5, -20]} color="red" />
          <Suspense>
            <Physics allowSleep={false} iterations={15} gravity={[0, -200, 0]}>
              <Cursor />
              <Guy rotation={[-Math.PI / 3, 0, 0]} />
              <Floor position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]} />
              <Chair position={[0, 0, -2.52]} />
              <Table position={[8, 0, 0]} />
              <Mug position={[8, 3, 0]} />
              <Lamp position={[0, 15, 0]} />
            </Physics>
          </Suspense>
          <group position={[0, -5, 0]}>
            <XROrigin scale={10} />
          </group>
        </XR>
      </Canvas>
    </>
  )
}

function Floor(props) {
  const [ref] = usePlane(() => ({ type: 'Static', ...props }))
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshPhongMaterial
        color="#878790"
        blur={[400, 400]}
        resolution={1024}
        mixBlur={1}
        mixStrength={3}
        depthScale={1}
        minDepthThreshold={0.85}
        metalness={0}
        roughness={1}
      />
    </mesh>
  )
}
