import { Axis, HandleTransformOptions } from '@pmndrs/handle'
import { ColorRepresentation, Vector3Tuple } from 'three'
import { useExtractHandleTransformOptions } from '../utils.js'
import { MeshHandlesContextMaterial } from '../material.js'
import { RegisteredHandle } from '../context.js'

export type PivotAxisScaleHandleProperties = {
  enabled?: Exclude<HandleTransformOptions, Array<Vector3Tuple>>
  tag: Axis
  tagPrefix?: string
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
}

export function PivotAxisScaleHandle({
  color,
  opacity,
  tag,

  tagPrefix = '',
  hoverColor,
  hoverOpacity,
  enabled,
  ...props
}: PivotAxisScaleHandleProperties) {
  const scaleOptions = useExtractHandleTransformOptions(tag, enabled)
  if (scaleOptions === false) {
    return null
  }
  return (
    <RegisteredHandle
      tag={tagPrefix + tag}
      scale={scaleOptions}
      rotate={false}
      translate="as-scale"
      multitouch={false}
      {...props}
    >
      <mesh renderOrder={Infinity} pointerEventsOrder={Infinity} position-x={0.68}>
        <sphereGeometry args={[0.04]} />
        <MeshHandlesContextMaterial
          tag={tagPrefix + tag}
          color={color}
          opacity={opacity}
          hoverOpacity={hoverOpacity}
          hoverColor={hoverColor}
        />
      </mesh>
    </RegisteredHandle>
  )
}
