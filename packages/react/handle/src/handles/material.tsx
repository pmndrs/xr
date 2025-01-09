import { handleXRayMaterialProperties, setupHandlesContextHoverMaterial } from '@pmndrs/handle'
import { useEffect, useRef } from 'react'
import { ColorRepresentation, LineBasicMaterial, MeshBasicMaterial } from 'three'
import { useHandlesContext } from './context.js'

export type MeshHeandlesContextMaterialProperties = {
  tag: string
  color: ColorRepresentation
  opacity: number
  hoverColor?: ColorRepresentation
  hoverOpacity?: number
}

export function MeshHandlesContextMaterial(props: MeshHeandlesContextMaterialProperties) {
  const ref = useRef<MeshBasicMaterial>(null)
  const context = useHandlesContext()
  useEffect(() => {
    if (ref.current == null) {
      return
    }
    return setupHandlesContextHoverMaterial(
      context,
      ref.current,
      props.tag,
      props.color,
      props.opacity,
      props.hoverColor,
      props.hoverOpacity,
    )
  }, [context, props.tag, props.color, props.opacity, props.hoverColor, props.hoverOpacity])
  return <meshBasicMaterial ref={ref} {...handleXRayMaterialProperties} />
}

export function LineHandlesContextMaterial(props: MeshHeandlesContextMaterialProperties) {
  const ref = useRef<LineBasicMaterial>(null)
  const context = useHandlesContext()
  useEffect(() => {
    if (ref.current == null) {
      return
    }
    return setupHandlesContextHoverMaterial(
      context,
      ref.current,
      props.tag,
      props.color,
      props.opacity,
      props.hoverColor,
      props.hoverOpacity,
    )
  }, [context, props.tag, props.color, props.opacity, props.hoverColor, props.hoverOpacity])
  return <lineBasicMaterial ref={ref} {...handleXRayMaterialProperties} />
}
