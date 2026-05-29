import { Canvas } from '@react-three/fiber'
import { Handle, MapHandles } from '@react-three/handle'
import { noEvents, PointerEvents } from '@react-three/xr'
import { createRoot } from 'react-dom/client'

function App() {
  return (
    <Canvas camera={{ position: [0, 5, 5] }} events={noEvents}>
      <PointerEvents />
      <MapHandles damping />
      <gridHelper args={[20, 20]} />
      <mesh position={[0, 0.25, 0]}>
        <coneGeometry args={[0.3, 0.5, 16]} />
        <meshNormalMaterial />
      </mesh>
      <Handle>
        <mesh position={[1, 0.5, 1]}>
          <boxGeometry />
          <meshNormalMaterial />
        </mesh>
      </Handle>
    </Canvas>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
