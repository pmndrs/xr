import { Box } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { IfFacingCamera } from '@react-three/xr'
import { useRef } from 'react'
import * as THREE from 'three'

interface SpinningBoxProps {
  position?: [number, number, number]
}

const cameraDirectionHelper = new THREE.Vector3(0, 0, -1)

export const SpinningBox = ({ position }: SpinningBoxProps) => {
  const boxRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    const box = boxRef.current
    if (box) {
      box.rotation.y += delta
    }
  })

  return (
    <>
      <IfFacingCamera direction={cameraDirectionHelper} angle={Math.PI}>
        <Box ref={boxRef} position={position}>
          <meshBasicMaterial color="orange" />
        </Box>
      </IfFacingCamera>
    </>
  )
}
