import { Pointer } from '@pmndrs/pointer-events'
import {
  ColorRepresentation,
  Vector3Tuple,
  MeshBasicMaterial,
  WebGLProgramParametersWithUniforms,
  WebGLRenderer,
  Mesh,
} from 'three'

export type PointerRayModelOptions = {
  /**
   * @default 2
   */
  renderOrder?: number
  /**
   * @default white
   */
  color?: ColorRepresentation | Vector3Tuple | ((pointer: Pointer) => ColorRepresentation | Vector3Tuple)
  /**
   * @default 0.4
   */
  opacity?: number | ((pointer: Pointer) => number)
  /**
   * @default 1
   */
  maxLength?: number
  /**
   * @default 0.005
   */
  size?: number
  /**
   * @default PointerRayMaterial
   */
  materialClass?: { new (): MeshBasicMaterial }
}

export class PointerRayMaterial extends MeshBasicMaterial {
  constructor() {
    super({ transparent: true, toneMapped: false })
  }

  onBeforeCompile(parameters: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer): void {
    super.onBeforeCompile(parameters, renderer)
    parameters.vertexShader = `varying float vFade;\n` + parameters.vertexShader
    parameters.vertexShader = parameters.vertexShader.replace(
      `#include <color_vertex>`,
      `#include <color_vertex>
            vFade = position.z + 0.5;`,
    )
    parameters.fragmentShader = `varying float vFade;\n` + parameters.fragmentShader
    parameters.fragmentShader = parameters.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
              diffuseColor.a *= vFade;`,
    )
  }
}

export function updatePointerRayModel(
  mesh: Mesh,
  material: MeshBasicMaterial,
  pointer: Pointer,
  options: PointerRayModelOptions,
) {
  if (!pointer.getEnabled()) {
    mesh.visible = false
    return
  }
  mesh.visible = true
  const intersection = pointer.getIntersection()
  const color = typeof options.color === 'function' ? options.color(pointer) : options.color
  if (Array.isArray(color)) {
    material.color.set(...color)
  } else {
    material.color.set(color ?? 'white')
  }
  material.opacity = typeof options.opacity === 'function' ? options.opacity(pointer) : (options.opacity ?? 0.4)

  let length = options.maxLength ?? 1
  if (intersection != null) {
    length = Math.min(length, intersection.distance)
  }
  mesh.position.z = -length / 2
  const size = options.size ?? 0.005
  mesh.scale.set(size, size, length)
  mesh.updateMatrix()
}
