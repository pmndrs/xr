import { HandleTransformOptions } from '@pmndrs/handle'
import { RegisteredHandle } from '../context.js'
import { MeshHandlesContextMaterial } from '../material.js'
import { Vector3Tuple } from 'three'
import { useExtractHandleTransformOptions } from '../utils.js'

export function FreeScaleControl({ enabled }: { enabled?: Exclude<HandleTransformOptions, Vector3Tuple> }) {
  const scaleOptions = useExtractHandleTransformOptions('xyz', enabled)
  if (scaleOptions === false) {
    return null
  }
  return (
    <>
      <RegisteredHandle
        tag="xyz"
        translate="as-scale"
        rotate={false}
        scale={{ uniform: true, ...scaleOptions }}
        multitouch={false}
      >
        <mesh visible={false}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
        </mesh>
      </RegisteredHandle>
      <mesh>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <MeshHandlesContextMaterial tag="xyz" color={0xffffff} opacity={0.25} hoverOpacity={1} hoverColor={0xffff00} />
      </mesh>
    </>
  )
}
