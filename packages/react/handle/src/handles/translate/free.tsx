import { HandleTransformOptions } from '@pmndrs/handle'
import { RegisteredHandle } from '../context.js'
import { MeshHandlesContextMaterial } from '../material.js'
import { Vector3Tuple } from 'three'
import { useExtractHandleTransformOptions } from '../utils.js'

export function FreeTranslateHandle({ enabled }: { enabled?: Exclude<HandleTransformOptions, Array<Vector3Tuple>> }) {
  const translateOptions = useExtractHandleTransformOptions('xyz', enabled)
  if (translateOptions === false) {
    return null
  }
  return (
    <>
      <RegisteredHandle tag="xyz" translate={translateOptions} scale={false} rotate={false} multitouch={false}>
        <mesh visible={false}>
          <octahedronGeometry args={[0.2, 0]} />
        </mesh>
      </RegisteredHandle>
      <mesh>
        <octahedronGeometry args={[0.1, 0]} />
        <MeshHandlesContextMaterial tag="xyz" color={0xffffff} opacity={0.25} hoverOpacity={1} hoverColor={0xffff00} />
      </mesh>
    </>
  )
}
