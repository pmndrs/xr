/**
 * "Duck"
 *
 * https://market.pmnd.rs/model/duck
 *
 * created by: Kay Lousberg
 * license: CC0
 */
import { useGLTF } from '@react-three/drei'

// const MODEL = 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/duck/model.gltf'
const MODEL = 'duck.gltf'

useGLTF.preload(MODEL)

export const Duck = (props: any) => {
  const { nodes, materials } = useGLTF(MODEL) as any

  return (
    <group {...props} dispose={null}>
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
    </group>
  )
}
