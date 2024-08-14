import { useCallback, useRef, useState } from 'react'
import { useTexture } from '@react-three/drei'
import { interactionGroups, RapierRigidBody, RigidBody, RigidBodyProps } from '@react-three/rapier'
import { create } from 'zustand'
import { Vector3Tuple } from 'three'
import { ThreeEvent } from '@react-three/fiber'

// This is a naive implementation and wouldn't allow for more than a few thousand boxes.
// In order to make this scale this has to be one instanced mesh, then it could easily be
// hundreds of thousands.

const useCubeStore = create<{ cubes: Array<Vector3Tuple>; addCube: (x: number, y: number, z: number) => void }>(
  (set) => ({
    cubes: [],
    addCube: (x: number, y: number, z: number) => set((state) => ({ cubes: [...state.cubes, [x, y, z]] })),
  }),
)

export const Cubes = () => {
  const cubes = useCubeStore((state) => state.cubes)
  return cubes.map((coords, index) => <Cube key={index} position={coords} />)
}

export function Cube(props: RigidBodyProps) {
  const ref = useRef<RapierRigidBody>(null)
  const [hover, set] = useState<number | null>(null)
  const addCube = useCubeStore((state) => state.addCube)
  const texture = useTexture('dirt.jpg')
  const onMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.faceIndex == null) {
      return
    }
    e.stopPropagation()
    set(Math.floor(e.faceIndex / 2))
  }, [])
  const onOut = useCallback(() => set(null), [])
  const onClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (ref.current == null || e.faceIndex == null) {
      return
    }
    e.stopPropagation()
    const { x, y, z } = ref.current.translation()
    const dir = [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1],
    ] as const
    addCube(...dir[Math.floor(e.faceIndex / 2)])
  }, [])
  return (
    <RigidBody {...props} type="fixed" colliders="cuboid" collisionGroups={interactionGroups([0, 1], [0])} ref={ref}>
      <mesh receiveShadow castShadow onPointerMove={onMove} onPointerOut={onOut} onClick={onClick}>
        {[...Array(6)].map((_, index) => (
          <meshStandardMaterial
            attach={`material-${index}`}
            key={index}
            map={texture}
            color={hover === index ? 'hotpink' : 'white'}
          />
        ))}
        <boxGeometry />
      </mesh>
    </RigidBody>
  )
}
