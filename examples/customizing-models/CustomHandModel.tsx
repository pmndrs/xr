import { Sphere } from '@react-three/drei'

export function CustomHandModel() {
  return (
    <group>
      <Sphere args={[0.05, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="blue" />
      </Sphere>
    </group>
  )
}
