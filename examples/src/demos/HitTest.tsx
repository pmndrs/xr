import { Box } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Controllers, useHitTest, ARButton, XR } from '@react-three/xr'
import React, { ComponentProps } from 'react'
import { type Mesh } from 'three'

export function HitTestExample(props: ComponentProps<typeof Box>) {
  const boxRef = React.useRef<Mesh>(null)

  useHitTest((hitMatrix) => {
    if (boxRef.current) {
      hitMatrix.decompose(boxRef.current.position, boxRef.current.quaternion, boxRef.current.scale)
    }
  })

  return <Box ref={boxRef} {...props} args={[0.1, 0.1, 0.1]} />
}

export default function () {
  return (
    <>
      <ARButton />
      <Canvas>
        <XR>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} />
          <Controllers />
          <HitTestExample position={[0, 0.8, -1]} />
        </XR>
      </Canvas>
    </>
  )
}
