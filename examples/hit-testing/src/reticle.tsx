import { ThreeElements, useFrame } from '@react-three/fiber'
import { forwardRef, memo, useRef } from 'react'
import * as THREE from 'three'
import { Mesh } from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js'
import { hitTestMatrices } from './app.js'

const ReticleMesh = forwardRef<Mesh, ThreeElements['mesh']>((props, ref) => {
  const geometry_merged = BufferGeometryUtils.mergeGeometries([
    new THREE.RingGeometry(0.05, 0.06, 30),
    new THREE.CircleGeometry(0.007, 12),
  ]).rotateX(-Math.PI * 0.5)

  return (
    <mesh ref={ref} geometry={geometry_merged} {...props}>
      <meshBasicMaterial side={THREE.DoubleSide} color={props.color} />
    </mesh>
  )
})

export const Reticle = memo(({ handedness }: { handedness: XRHandedness }) => {
  const ref = useRef<Mesh>(undefined)

  useFrame(() => {
    if (ref.current == null) {
      return
    }
    const matrix = hitTestMatrices[handedness]
    if (matrix != null) {
      ref.current.visible = true
      ref.current.position.setFromMatrixPosition(matrix)
      ref.current.quaternion.setFromRotationMatrix(matrix)
    } else {
      ref.current.visible = false
    }
  })

  return <ReticleMesh ref={ref} visible={false} />
})
