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
    disabled = false,
  }: {
    color: ColorRepresentation
    disabled?: boolean
    opacity?: number
    hoverColor?: ColorRepresentation
    hoverOpacity?: number
  },
) {
  if ((hoverColor == null && hoverOpacity == null) || disabled) {
    material.color.set(color)
    material.opacity = opacity ?? 1
    if (disabled) {
      material.opacity *= 0.5
      material.color.lerp(new Color(1, 1, 1), 0.5)
    }
    return
  }
  hoverColor ??= color
  return context.subscribeHover((tags) => {
    const isHovered = tags.some((activeTag) => activeTag === tag)
    material.color.set(isHovered ? hoverColor : color)
    material.opacity = (isHovered ? hoverOpacity : opacity) ?? 1
  })
}
