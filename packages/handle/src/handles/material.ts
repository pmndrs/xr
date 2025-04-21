import { Color, ColorRepresentation, LineBasicMaterial, MeshBasicMaterial } from 'three'
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
    enabled = true,
  }: {
    color: ColorRepresentation
    enabled?: boolean
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
    const isHovered = enabled ? tags.some((activeTag) => activeTag.includes(tag)) : false
    material.color.set(isHovered ? hoverColor : color)
    material.opacity = (isHovered ? hoverOpacity : opacity) ?? 1

    if (!enabled) {
      material.opacity *= enabled ? 1 : 0.5
      material.color.lerp(new Color(1, 1, 1), 0.5)
    }
  })
}
