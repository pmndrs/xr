import { ColorRepresentation, LineBasicMaterial, MeshBasicMaterial } from 'three'
import { ControlsContext } from './context.js'

export const controlsMaterialProperties = {
  depthTest: false,
  depthWrite: false,
  fog: false,
  toneMapped: false,
  transparent: true,
}

export function setupControlsMaterial(
  context: ControlsContext,
  material: MeshBasicMaterial | LineBasicMaterial,
  tag: string,
  color: ColorRepresentation,
  opacity: number,
  hoverColor?: ColorRepresentation,
  hoverOpacity?: number,
) {
  if (hoverColor == null && hoverOpacity == null) {
    return
  }
  hoverColor ??= color
  hoverOpacity ??= opacity
  return context.subscribeHover((tags) => {
    const isHovered = tags.some((activeTag) => activeTag.includes(tag))
    material.color.set(isHovered ? hoverColor : color)
    material.opacity = isHovered ? hoverOpacity : opacity
  })
}
