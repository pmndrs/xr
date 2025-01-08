import { Control } from '../context.js'
import { MeshControlsMaterial } from '../material.js'

export function FreeScaleControl() {
  return (
    <>
      <Control tag="xyz" translate="as-scale" rotate={false} scale={{ uniform: true }} multitouch={false}>
        <mesh visible={false}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
        </mesh>
      </Control>
      <mesh>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <MeshControlsMaterial tag="xyz" color={0xffffff} opacity={0.25} hoverOpacity={1} hoverColor={0xffff00} />
      </mesh>
    </>
  )
}
