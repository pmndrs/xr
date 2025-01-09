import { GroupProps } from '@react-three/fiber'
import { ColorRepresentation, Vector3Tuple } from 'three'
import { RegisteredHandle } from '../context.js'
import { MeshHandlesContextMaterial } from '../material.js'
import { HandleTransformOptions } from '@pmndrs/handle'
import { useExtractHandleTransformOptions } from '../utils.js'

export type PlaneTranslateHandleProperties = {
  tag: 'xy' | 'yz' | 'xz'
  enabled?: Exclude<HandleTransformOptions, Vector3Tuple>
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
} & GroupProps

export function PlaneTranslateHandle({
  tag,
  color,
  hoverColor,
  opacity,
  hoverOpacity,
  enabled,
  ...props
}: PlaneTranslateHandleProperties) {
  const translateOptions = useExtractHandleTransformOptions(tag, enabled)
  if (translateOptions === false) {
    return null
  }
  return (
    <RegisteredHandle {...props} translate={translateOptions} tag={tag} scale={false} rotate={false} multitouch={false}>
      <mesh position={[0.15, 0.15, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.01]} />
        <MeshHandlesContextMaterial
          tag={tag}
          color={color}
          opacity={opacity}
          hoverOpacity={hoverOpacity}
          hoverColor={hoverColor}
        />
      </mesh>
    </RegisteredHandle>
  )
}
