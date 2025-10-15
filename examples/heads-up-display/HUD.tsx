import { Box } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Container, Text } from '@react-three/uikit'
import { XROrigin } from '@react-three/xr'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGetTime } from './useGetTime.js'

export function HUD({ distance = 1.5 }: Readonly<{ distance?: number }>) {
  const { camera } = useThree()
  const time = useGetTime()
  const groupRef = useRef<THREE.Group | null>(null)
  const originRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    const g = groupRef.current
    if (!g) return

    // Important: set the position BEFORE adding to camera
    g.position.set(-0.2, 0, -0.2)
    g.quaternion.identity()

    originRef.current?.children[0].add(g)
    return () => {
      originRef.current?.children[0].remove(g)
    }
  }, [camera, distance])

  const hudUI = (
    <Container width={200} depthTest={false} color={'black'}>
      <Text
        height={20}
        flexWrap={'no-wrap'}
        depthTest={false}
        color={'white'}
      >{`Time: ${time.toLocaleTimeString()}`}</Text>
    </Container>
  )

  return (
    <>
      <XROrigin ref={originRef} />
      <group ref={groupRef} renderOrder={1000}>
        <Box args={[0.2, 0.2, 0.01]} position={[0, 0, 0]}>
          <meshBasicMaterial color="red" depthTest={false} />
        </Box>
        <group position={[0, 0, 0]}>{hudUI}</group>
      </group>
    </>
  )
}

export default HUD
