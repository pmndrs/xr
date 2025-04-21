import { PivotHandles } from '../pivot.js'

export function Default() {
  return (
    <PivotHandles>
      <mesh />
    </PivotHandles>
  )
}

export function Disabled() {
  return (
    <PivotHandles enabled={false}>
      <mesh />
    </PivotHandles>
  )
}
