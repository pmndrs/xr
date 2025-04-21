import { Canvas } from '@react-three/fiber'
import { PivotHandles } from '../pivot.js'
import { noEvents, PointerEvents } from '@react-three/xr'

export function Default() {
  return (
    <Canvas events={noEvents}>
      <PointerEvents />
      <PivotHandles>
        <mesh />
      </PivotHandles>
    </Canvas>
  )
}

export function Disabled() {
  return (
    <Canvas events={noEvents}>
      <PointerEvents />
      <PivotHandles enabled={false}>
        <mesh />
      </PivotHandles>
    </Canvas>
  )
}
