import { useCallback, useRef, useState } from 'react'
import { useTexture } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import create from 'zustand'

// This is a naive implementation and wouldn't allow for more than a few thousand boxes.
// In order to make this scale this has to be one instanced mesh, then it could easily be
// hundreds of thousands.

const useCubeStore = create((set) => ({
  cubes: [],
  addCube: (x, y, z) => set((state) => ({ cubes: [...state.cubes, [x, y, z]] })),
}))

export const Cubes = () => {
  const cubes = useCubeStore((state) => state.cubes)
  return cubes.map((coords, index) => <Cube key={index} position={coords} />)
}

export function Cube(props) {
  const ref = useRef()
  const [hover, set] = useState(null)
  const addCube = useCubeStore((state) => state.addCube)
  const texture = useTexture('dirt.jpg')
  const onMove = useCallback((e) => {
    e.stopPropagation()
    set(Math.floor(e.faceIndex / 2))
  }, [])
  const onOut = useCallback(() => set(null), [])
  const onClick = useCallback((e) => {
    e.stopPropagation()
    const { x, y, z } = ref.current.translation()
    const dir = [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1],
    ]
    addCube(...dir[Math.floor(e.faceIndex / 2)])
  }, [])
  return (
    <RigidBody {...props} type="fixed" colliders="cuboid" ref={ref}>
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
