import { useFrame } from '@react-three/fiber'
import { Control } from '../context.js'
import { MeshControlsMaterial } from '../material.js'
import { createCircleGeometry } from './index.js'
import { useMemo, useRef } from 'react'
import { Mesh, Vector3, Vector3Tuple } from 'three'

const screenSpaceRotateCircleGeometry = createCircleGeometry(0.75, 1)
const vector1Helper = new Vector3()
const vector2Helper = new Vector3()
const zAxis = new Vector3(1, 0, 0)

export function ScreenSpaceRotateControl() {
  const ref = useRef<Mesh>(null)
  const direction = useMemo<Vector3Tuple>(() => [1, 0, 0], [])
  useFrame((state) => {
    if (ref.current == null) {
      return
    }
    state.camera.getWorldPosition(vector1Helper)
    ref.current.getWorldPosition(vector2Helper).sub(vector1Helper)
    vector2Helper.normalize()
    ref.current.quaternion.setFromUnitVectors(zAxis, vector2Helper)
    vector2Helper.negate().toArray(direction)
  })
  return (
    <>
      <Control tag="e" scale={false} translate="as-rotate" rotate={direction} multitouch={false}>
        <mesh visible={false}>
          <torusGeometry args={[0.75, 0.1, 2, 24]} />
        </mesh>
      </Control>
      <mesh ref={ref} geometry={screenSpaceRotateCircleGeometry}>
        <MeshControlsMaterial tag="e" color={0xffff00} opacity={0.5} hoverOpacity={1} hoverColor={0xffff00} />
      </mesh>
    </>
  )
}
