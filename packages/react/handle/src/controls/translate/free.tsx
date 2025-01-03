import { HandleStore } from '@pmndrs/handle'
import { Control } from '../context.js'
import { MeshControlsMaterial } from '../material.js'

export function FreeTranslateControl() {
  return (
    <>
      <Control tag="xyz" scale={false} rotate={false} multitouch={false}>
        <mesh visible={false}>
          <octahedronGeometry args={[0.2, 0]} />
        </mesh>
      </Control>
      <mesh>
        <octahedronGeometry args={[0.1, 0]} />
        <MeshControlsMaterial tag="xyz" color={0xffffff} opacity={0.25} hoverOpacity={1} hoverColor={0xffff00} />
      </mesh>
    </>
  )
}
