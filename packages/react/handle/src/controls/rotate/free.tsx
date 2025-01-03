import { useFrame } from '@react-three/fiber'
import { Control } from '../context.js'
import { MeshControlsMaterial } from '../material.js'
import { createCircleGeometry } from './index.js'
import { useRef } from 'react'
import { Mesh, Vector3 } from 'three'

const freeRotateCircleGeometry = createCircleGeometry(0.5, 1)
const vector1Helper = new Vector3()
const vector2Helper = new Vector3()
const xAxis = new Vector3(1, 0, 0)

export function FreeRotateControl() {
  const ref = useRef<Mesh>(null)
  useFrame((state) => {
    if (ref.current == null) {
      return
    }
    state.camera.getWorldPosition(vector1Helper)
    ref.current.getWorldPosition(vector2Helper).sub(vector1Helper)
    ref.current.quaternion.setFromUnitVectors(xAxis, vector2Helper.normalize())
  })
  return (
    <>
      <Control tag="xyze" scale={false} translate="as-rotate" multitouch={false}>
        <mesh visible={false}>
          <sphereGeometry args={[0.25, 10, 8]} />
        </mesh>
      </Control>
      <mesh ref={ref} geometry={freeRotateCircleGeometry}>
        <MeshControlsMaterial tag="xyz" color={0xffffff} opacity={0.25} hoverOpacity={1} hoverColor={0xffff00} />
      </mesh>
    </>
  )
}
