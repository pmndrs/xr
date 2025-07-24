import { Canvas, useFrame } from '@react-three/fiber'
import { createXRStore, XR, XRDomOverlay, XROrigin } from '@react-three/xr'
import { useState, useRef } from 'react'
import { Box } from '@react-three/drei'
import { Mesh } from 'three'

const store = createXRStore()

export function RotatingBox() {
  const boxRef = useRef<Mesh>(null)

  useFrame((state, delta, xrFrame) => {
    boxRef.current.rotation.x += delta
    boxRef.current.rotation.y += delta
  })

  return (
    <>
      <Box ref={boxRef} position={[0, 0, -3]}>
        <meshStandardMaterial color={'white'}/>
      </Box>
    </>
  )
}
