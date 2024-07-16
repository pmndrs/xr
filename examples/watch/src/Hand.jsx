import { useGLTF } from '@react-three/drei'
import { XRHandModel } from '@react-three/xr'
import { Suspense } from 'react'

export function HandWithWatch() {
  return (
    <>
      <Suspense>
        <XRHandModel colorWrite={false} renderOrder={-1} />
      </Suspense>
      <Suspense>
        <Watch rotation={[-0.2, Math.PI / 2, Math.PI]} position={[0, -0.01, -0.02]} scale={0.00011} />
      </Suspense>
    </>
  )
}

function Watch(props) {
  const { nodes, materials } = useGLTF('watch-v1.glb')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Object005_glass_0.geometry} material={materials.glass}></mesh>
      <mesh castShadow receiveShadow geometry={nodes.Object006_watch_0.geometry} material={materials.watch} />
    </group>
  )
}
