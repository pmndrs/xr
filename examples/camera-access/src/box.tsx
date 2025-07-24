import { useState, useRef, useEffect } from 'react'
import { MeshStandardMaterial, Texture } from 'three'
import { useFrame } from '@react-three/fiber'
import { Box } from '@react-three/drei'
import { createXRStore, useXR } from '@react-three/xr'

const store = createXRStore()

export function RotatingBox() {
  const boxRef = useRef<Box>(null)
  const matRef = useRef<MeshStandardMaterial>(null);

  const cameraTextures = useXR((xr) => xr.cameraImages)
  const [camTexture, setCamTexutre] = useState<Texture>()

  useEffect(() => {
    if (cameraTextures && cameraTextures[0]) {
      setCamTexutre(cameraTextures[0])
    }
  }, [cameraTextures])

  useEffect(() => {
    if (camTexture) {
      matRef.current.map = camTexture
      matRef.current.needsUpdate = true
    }
  }, [camTexture]);

  useFrame((state, delta, xrFrame) => {
    boxRef.current.rotation.x += delta
    boxRef.current.rotation.y += delta
  })

  return (
    <>
      <Box ref={boxRef} position={[0, 0, -3]}>
        <meshStandardMaterial ref={matRef} color={'white'}/>
      </Box>
    </>
  )
}
