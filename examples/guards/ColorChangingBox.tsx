import { Box } from '@react-three/drei'
import { useXRSessionVisibilityState } from '@react-three/xr'
import { useEffect, useState } from 'react'
import * as THREE from 'three'

interface ColorChangingBoxProps {
  position?: [number, number, number]
}

export const ColorChangingBox = ({ position }: ColorChangingBoxProps) => {
  const [color, setColor] = useState(new THREE.Color('blue'))
  const visState = useXRSessionVisibilityState()

  useEffect(() => {
    if (visState === 'hidden') {
      setColor(new THREE.Color(Math.random() * 0xffffff))
    }
  }, [visState])

  return (
    <Box position={position} args={[0.5, 0.5, 0.5]}>
      <meshBasicMaterial color={color} />
    </Box>
  )
}
