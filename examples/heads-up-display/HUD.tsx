import { Container, Text } from '@react-three/uikit'
import { XROrigin } from '@react-three/xr'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGetTime } from './useGetTime.js'

export function HUD() {
  const time = useGetTime()
  const groupRef = useRef<THREE.Group | null>(null)
  const originRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    if (!groupRef.current || !originRef.current?.children[0]) return
    const contextSafeGroupRef = groupRef.current
    const contextSafeCameraRef = originRef.current?.children[0]

    contextSafeGroupRef.position.set(-0.2, 0.2, -0.8)
    contextSafeGroupRef.quaternion.identity()

    contextSafeCameraRef.add(contextSafeGroupRef)
    return () => {
      contextSafeCameraRef.remove(contextSafeGroupRef)
    }
  }, [])

  return (
    <>
      <XROrigin ref={originRef} />
      <group ref={groupRef} renderOrder={1000}>
        <Container depthTest={false}>
          <Text fontSize={2} depthTest={false} color={'white'}>
            {time.toLocaleTimeString()}
          </Text>
        </Container>
      </group>
    </>
  )
}
