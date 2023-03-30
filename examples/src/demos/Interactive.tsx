import { Box } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Controllers, Interactive, VRButton, XR } from '@react-three/xr'
import React, { ComponentProps } from 'react'

export function Button(props: ComponentProps<typeof Box>) {
  const [hover, setHover] = React.useState(false)
  const [color, setColor] = React.useState(0x123456)

  return (
    <Interactive onSelect={() => setColor((Math.random() * 0xffffff) | 0)} onHover={() => setHover(true)} onBlur={() => setHover(false)}>
      <Box {...props} args={[0.4, 0.1, 0.1]} scale={hover ? 1.5 : 1}>
        <meshStandardMaterial color={color} />
      </Box>
    </Interactive>
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
          <Button position={[0, 0.8, -1]} />
        </XR>
      </Canvas>
    </>
  )
}
