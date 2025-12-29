import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { MapHandles, useDisableGestures } from '@react-three/handle'
import '@react-three/handle/disable-gestures.css'
import { noEvents, PointerEvents } from '@react-three/xr'

function App() {
  useDisableGestures()
  return (
    <Canvas camera={{ position: [0, 5, 5] }} events={noEvents}>
      <PointerEvents />
      <MapHandles damping />
      <gridHelper args={[20, 20]} />
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry />
        <meshNormalMaterial />
      </mesh>
    </Canvas>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
