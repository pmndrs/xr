import { HandleTransformOptions, Axis } from '@pmndrs/handle'
import { config } from 'chai'
import { Vector3Tuple, ColorRepresentation } from 'three'
import { RegisteredHandle } from '../context.js'
import { MeshHandlesContextMaterial } from '../material.js'
import { useExtractHandleTransformOptions } from '../utils.js'

export type PivotAxisScaleHandleProperties = {
  enabled?: Exclude<HandleTransformOptions, Vector3Tuple>
  tag: Axis
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
}

export function PivotAxisRotateHandle({
  color,
  opacity,
  tag,
  hoverColor,
  hoverOpacity,
  enabled,
  ...props
}: PivotAxisScaleHandleProperties) {
  const rotateOptions = useExtractHandleTransformOptions(tag, enabled)
  if (rotateOptions === false) {
    return null
  }
  return (
    <group {...props}>
      <RegisteredHandle tag={tag} scale={false} translate="as-rotate" rotate={rotateOptions} multitouch={false}>
        <mesh visible={false} rotation={[0, Math.PI / 2, Math.PI / 2]}>
          <torusGeometry args={[0.45, 0.1, 4, 24, Math.PI / 2]} />
        </mesh>
      </RegisteredHandle>
      <mesh rotation={[0, Math.PI / 2, Math.PI / 2]}>
        <torusGeometry args={[0.45, 0.0075, 3, 64, Math.PI / 2]} />
        <MeshHandlesContextMaterial
          color={color}
          opacity={opacity}
          tag={tag}
          hoverColor={hoverColor}
          hoverOpacity={hoverOpacity}
        />
      </mesh>
    </group>
  )
}
