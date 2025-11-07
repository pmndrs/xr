import { Box } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { IfSessionVisible } from '@react-three/xr'
import { useRef, useState } from 'react'
import * as THREE from 'three'

interface ColorChangingBoxProps {
  position?: [number, number, number]
}

export const ColorChangingBox = ({ position }: ColorChangingBoxProps) => {
  const boxRef = useRef<THREE.Mesh>(null)
  const [color, setColor] = useState(new THREE.Color('blue'))

  useFrame(() => {
    const box = boxRef.current
    if (box) {
      // box.material.color = color
    }
  })

  return (
    <IfSessionVisible>
      <Box ref={boxRef} position={position} onClick={() => setColor(new THREE.Color(Math.random() * 0xffffff))}>
        <meshBasicMaterial color={color} />
      </Box>
    </IfSessionVisible>
  )
}
