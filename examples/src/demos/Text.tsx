import { Box, Text } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Controllers, VRButton, XR } from '@react-three/xr'
import { ComponentProps } from 'react'

export function BoxText(props: ComponentProps<typeof Box>) {
  return (
    <Box {...props} args={[0.4, 0.1, 0.1]}>
      <meshStandardMaterial color={0x0000ff} />
      <Text position={[0, 0, 0.06]} fontSize={0.05} color="#000" anchorX="center" anchorY="middle">
        Hello react-xr!
      </Text>
    </Box>
  )
}

export default function () {
  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} />
          <Controllers />
          <BoxText position={[0, 0.8, -1]} />
        </XR>
      </Canvas>
    </>
  )
}
