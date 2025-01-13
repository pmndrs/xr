import { Axis, HandleTransformOptions, handleXRayMaterialProperties, setupHandlesAxisHighlight } from '@pmndrs/handle'
import { LineSegmentsProps } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { BufferGeometry, ColorRepresentation, Float32BufferAttribute, LineSegments, Vector3Tuple } from 'three'
import { useHandlesContext } from './context.js'
import { useExtractHandleTransformOptions } from './utils.js'
import type { RotateHandlesProperties } from './rotate/index.js'

export type HandlesAxisHighlightProperties = {
  color?: ColorRepresentation
  opacity?: number
  tag: Axis
  enabled?: RotateHandlesProperties['enabled']
} & LineSegmentsProps

const lineGeometry = new BufferGeometry()
lineGeometry.setAttribute('position', new Float32BufferAttribute([-1e3, 0, 0, 1e3, 0, 0], 3))

export function HandlesAxisHighlight({ tag, color, opacity, enabled, ...props }: HandlesAxisHighlightProperties) {
  const ref = useRef<LineSegments>(null)
  const context = useHandlesContext()
  useEffect(() => {
    if (ref.current == null) {
      return
    }
    return setupHandlesAxisHighlight(ref.current, context, tag)
  }, [context, tag])
  const options = useExtractHandleTransformOptions(tag, enabled)
  if (options === false) {
    return null
  }
  return (
    <lineSegments {...props} renderOrder={Infinity} geometry={lineGeometry} ref={ref}>
      <lineBasicMaterial {...handleXRayMaterialProperties} color={color ?? 'white'} opacity={opacity ?? 1} />
    </lineSegments>
  )
}
