/**
 * "Duck"
 *
 * https://market.pmnd.rs/model/duck
 *
 * created by: Kay Lousberg
 * license: CC0
 */
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Handle, HandleStore } from '@react-three/handle'
import { useXRRequestHitTest } from '@react-three/xr'
import { useRef, useState } from 'react'
import { Group } from 'three'
import { onResults } from './app.js'
import { Reticle } from './reticle.js'

// const MODEL = 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/duck/model.gltf'
const MODEL = 'duck.gltf'

useGLTF.preload(MODEL)

export const Duck = (props: any) => {
  const { nodes, materials } = useGLTF(MODEL) as any
  const [isBeingGrabbed, setisBeingGrabbed] = useState(false)
  const hitTestRefPoint = useRef<Group>(null)
  const duckGroup = useRef<Group>(null)
  const hitTestRequest = useXRRequestHitTest()
  const handleRef = useRef<HandleStore<unknown>>(null)

  useFrame(async (_, __, frame: XRFrame | undefined) => {
    if (frame && isBeingGrabbed && hitTestRefPoint.current) {
      const requestedHitTest = await hitTestRequest(hitTestRefPoint)
      if (requestedHitTest?.results && requestedHitTest.results.length > 0 && requestedHitTest?.getWorldMatrix) {
        onResults('duck', requestedHitTest?.results ?? [], requestedHitTest?.getWorldMatrix)
      }
    }
  })

  return (
    <>
      <group ref={duckGroup} {...props} dispose={null}>
        <Handle
          ref={handleRef}
          handleRef={duckGroup}
          apply={(state) => {
            if (state.last) {
              setisBeingGrabbed(false)
            } else {
              setisBeingGrabbed(true)
            }

            duckGroup.current?.position.copy(state.current.position)
            duckGroup.current?.quaternion.copy(state.current.quaternion)
          }}
        >
          <mesh
            geometry={nodes.character_duck.geometry}
            material={nodes.character_duck.material}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <mesh
              geometry={nodes.character_duckArmLeft.geometry}
              material={nodes.character_duckArmLeft.material}
              position={[0.2, 0, -0.63]}
            />
            <mesh
              geometry={nodes.character_duckArmRight.geometry}
              material={nodes.character_duckArmRight.material}
              position={[-0.2, 0, -0.63]}
            />

            <group position={[0, 0, -0.7]}>
              <mesh geometry={nodes.Cube1338.geometry} material={nodes.Cube1338.material} />
              <mesh geometry={nodes.Cube1338_1.geometry} material={materials['Yellow.043']} />
              <mesh geometry={nodes.Cube1338_2.geometry} material={materials['Black.027']} />
            </group>
          </mesh>
          <group ref={hitTestRefPoint} />
        </Handle>
      </group>
      {isBeingGrabbed && <Reticle handedness="duck" />}
    </>
  )
}
