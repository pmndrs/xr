import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { forwardHtmlEvents } from '@pmndrs/pointer-events'
import { useDrag } from '@use-gesture/react'

export function App() {
  return (
    <Canvas style={{ width: '100%', flexGrow: 1 }} events={() => ({ enabled: false, priority: 0 })}>
      <DragCube />
      <SwitchToXRPointerEvents />
    </Canvas>
  )
}

function DragCube() {
  const bind = useDrag(({ movement, xy, delta }) => console.log(...xy, 'movement', ...movement, 'delta', ...delta))
  return (
    <mesh {...(bind() as any)} position={[0, 1, -1]} scale={0.1}>
      <boxGeometry />
      <meshBasicMaterial color="blue" />
    </mesh>
  )
}

export function SwitchToXRPointerEvents() {
  const domElement = useThree((s) => s.gl.domElement)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  useEffect(() => forwardHtmlEvents(domElement, camera, scene), [domElement, camera, scene])
  return null
}
