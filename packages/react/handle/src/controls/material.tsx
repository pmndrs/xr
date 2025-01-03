import { controlsMaterialProperties, setupControlsMaterial } from '@pmndrs/handle'
import { useEffect, useRef } from 'react'
import { ColorRepresentation, LineBasicMaterial, MeshBasicMaterial } from 'three'
import { useControlsContext } from './context.js'

export type ControlsMaterialProperties = {
  tag: string
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
}

export function MeshControlsMaterial(props: ControlsMaterialProperties) {
  const ref = useRef<MeshBasicMaterial>(null)
  const context = useControlsContext()
  useEffect(() => {
    if (ref.current == null) {
      return
    }
    return setupControlsMaterial(
      context,
      ref.current,
      props.tag,
      props.color,
      props.opacity,
      props.hoverColor,
      props.hoverOpacity,
    )
  }, [context, props.tag, props.color, props.opacity, props.hoverColor, props.hoverOpacity])
  return <meshBasicMaterial ref={ref} {...controlsMaterialProperties} />
}

export function LineControlsMaterial(props: ControlsMaterialProperties) {
  const ref = useRef<LineBasicMaterial>(null)
  const context = useControlsContext()
  useEffect(() => {
    if (ref.current == null) {
      return
    }
    return setupControlsMaterial(
      context,
      ref.current,
      props.tag,
      props.color,
      props.opacity,
      props.hoverColor,
      props.hoverOpacity,
    )
  }, [context, props.tag, props.color, props.opacity, props.hoverColor, props.hoverOpacity])
  return <lineBasicMaterial ref={ref} {...controlsMaterialProperties} />
}
