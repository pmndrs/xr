import { Box } from '@react-three/drei'
import { IfSessionVisible } from '@react-three/xr'
import { useRef } from 'react'
import * as THREE from 'three'

interface ShyBoxProps {
  position?: [number, number, number]
}

export const ShyBox = ({ position }: ShyBoxProps) => {
  const boxRef = useRef<THREE.Mesh>(null)

  return (
    <IfSessionVisible>
      <Box ref={boxRef} args={[0.5, 0.5, 0.5]} position={position}>
        <meshBasicMaterial color="#268594" />
      </Box>
    </IfSessionVisible>
  )
}
