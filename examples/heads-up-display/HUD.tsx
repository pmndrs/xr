import { useThree } from '@react-three/fiber'
import { Container, Text } from '@react-three/uikit'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGetTime } from './useGetTime.js'

export function HUD({ distance = 1.5 }: Readonly<{ distance?: number }>) {
  const { camera } = useThree()

  const time = useGetTime()
  const groupRef = useRef<THREE.Group | null>(null)

  const baseOffset = useMemo(() => new THREE.Vector3(-0.6, 0.4, -distance), [distance])

  useEffect(() => {
    const g = groupRef.current
    if (!g) return

    g.position.copy(baseOffset)
    g.quaternion.set(0, 0, 0, 1)

    camera.add(g)
    return () => {
      camera.remove(g)
    }
  }, [camera, baseOffset])

  const formatted = time.toLocaleTimeString()

  return (
    <group ref={groupRef} renderOrder={1000}>
      <Container depthTest={false}>
        <Text>{`Time: ${formatted}`}</Text>
      </Container>
    </group>
  )
}

export default HUD
