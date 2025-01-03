import { controlsMaterialProperties, setupControlsAxis } from '@pmndrs/handle'
import { LineSegmentsProps } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { BufferGeometry, ColorRepresentation, Float32BufferAttribute, LineSegments } from 'three'
import { useControlsContext } from './context.js'

export type ControlsAxisHighlightProperties = {
  color?: ColorRepresentation
  opacity?: number
  showWhenHoveringTagsInclude: string
} & LineSegmentsProps

const lineGeometry = new BufferGeometry()
lineGeometry.setAttribute('position', new Float32BufferAttribute([-1e3, 0, 0, 1e3, 0, 0], 3))

export function ControlsAxisHighlight({
  showWhenHoveringTagsInclude,
  color,
  opacity,
  ...props
}: ControlsAxisHighlightProperties) {
  const ref = useRef<LineSegments>(null)
  const context = useControlsContext()
  useEffect(() => {
    if (ref.current == null) {
      return
    }
    return setupControlsAxis(ref.current, context, showWhenHoveringTagsInclude)
  }, [context, showWhenHoveringTagsInclude])
  return (
    <lineSegments {...props} geometry={lineGeometry} ref={ref}>
      <lineBasicMaterial {...controlsMaterialProperties} color={color ?? 'white'} opacity={opacity ?? 1} />
    </lineSegments>
  )
}
