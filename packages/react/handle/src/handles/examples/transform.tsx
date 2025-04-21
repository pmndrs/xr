import { TransformHandles } from '../transform.js'

export function Default() {
  return (
    <TransformHandles>
      <mesh />
    </TransformHandles>
  )
}

export function Disabled() {
  return (
    <TransformHandles enabled={false}>
      <mesh />
    </TransformHandles>
  )
}
