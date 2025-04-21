import { PointerEvents, noEvents } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'
import { TransformHandles } from '../transform.js'

export function Default() {
  return (
    <Canvas events={noEvents}>
      <PointerEvents />
      <TransformHandles>
        <mesh />
      </TransformHandles>
    </Canvas>
  )
}

export function Disabled() {
  return (
    <Canvas events={noEvents}>
      <PointerEvents />
      <TransformHandles enabled={false}>
        <mesh />
      </TransformHandles>
    </Canvas>
  )
}
