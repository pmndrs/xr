import { ColorRepresentation, LineBasicMaterial, MeshBasicMaterial } from 'three'
import { HandlesContext } from './context.js'

export const handleXRayMaterialProperties = {
  depthTest: false,
  depthWrite: false,
  fog: false,
  toneMapped: false,
  transparent: true,
}

export function setupHandlesContextHoverMaterial(
  context: HandlesContext,
  material: MeshBasicMaterial | LineBasicMaterial,
  tag: string,
  {
    color,
    hoverColor,
    hoverOpacity,
    opacity,
  }: {
    color: ColorRepresentation
    opacity?: number
    hoverColor?: ColorRepresentation
    hoverOpacity?: number
  },
) {
  if (hoverColor == null && hoverOpacity == null) {
    return
  }
  hoverColor ??= color
  return context.subscribeHover((tags) => {
    const isHovered = tags.some((activeTag) => activeTag.includes(tag))
    material.color.set(isHovered ? hoverColor : color)
    material.opacity = (isHovered ? hoverOpacity : opacity) ?? 1
  })
}
