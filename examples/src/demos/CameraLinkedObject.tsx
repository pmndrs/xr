import { Box } from '@react-three/drei'
import { Canvas, createPortal, useThree } from '@react-three/fiber'
import { VRButton, XR } from '@react-three/xr'
import { ComponentProps } from 'react'

function Object(props: ComponentProps<typeof Box>) {
  return (
    <Box {...props} args={[0.4, 0.1, 0.1]}>
      <meshStandardMaterial color="blue" />
    </Box>
  )
}

function CameraLinkedObject() {
  const camera = useThree((state) => state.camera)
  return createPortal(<Object position={[0, 0.6, -1]} />, camera)
}

export default function () {
  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} />
          <CameraLinkedObject />
        </XR>
      </Canvas>
    </>
  )
}
