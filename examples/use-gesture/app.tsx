import { Canvas } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { noEvents, PointerEvents } from '@react-three/xr'
import { useRef } from 'react'

export function App() {
  return (
    <Canvas style={{ width: '100%', flexGrow: 1 }} events={noEvents}>
      <DragCube />
      <PointerEvents />
    </Canvas>
  )
}

function DragCube() {
  const ref = useRef<Mesh>(null)
  const bind = useDrag(({ movement, xy, delta }) => console.log(...xy, 'movement', ...movement, 'delta', ...delta))
  return (
    <mesh {...(bind() as any)} position={[0, 1, -1]} scale={0.1}>
      <boxGeometry />
      <meshBasicMaterial color="blue" />
    </mesh>
  )
}
