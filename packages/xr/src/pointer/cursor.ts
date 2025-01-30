import { Pointer } from '@pmndrs/pointer-events'
import {
  ColorRepresentation,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  Vector3,
  Vector3Tuple,
  WebGLProgramParametersWithUniforms,
  WebGLRenderer,
} from 'three'

export type PointerCursorModelOptions = {
  /**
   * @default "white"
   */
  color?: ColorRepresentation | Vector3Tuple | ((pointer: Pointer) => ColorRepresentation | Vector3Tuple)
  /**
   * @default 0.4
   */
  opacity?: number | ((pointer: Pointer) => number)
  /**
   * @default 0.1
   */
  size?: number
  /**
   * @default 1
   */
  renderOrder?: number
  /**
   * @default 0.01
   */
  cursorOffset?: number
  /**
   * @default PointerCursorMaterial
   */
  materialClass?: { new (): MeshBasicMaterial }
}

export class PointerCursorMaterial extends MeshBasicMaterial {
  constructor() {
    super({ transparent: true, toneMapped: false, depthWrite: false })
  }
  onBeforeCompile(parameters: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer): void {
    super.onBeforeCompile(parameters, renderer)
    parameters.vertexShader = `varying vec2 vLocalPosition;\n` + parameters.vertexShader
    parameters.vertexShader = parameters.vertexShader.replace(
      `#include <color_vertex>`,
      `#include <color_vertex>
        vLocalPosition = position.xy * 2.0;`,
    )
    parameters.fragmentShader = `varying vec2 vLocalPosition;\n` + parameters.fragmentShader
    parameters.fragmentShader = parameters.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
          float value = max(0.0, 1.0 - sqrt(dot(vLocalPosition, vLocalPosition)));
          diffuseColor.a = diffuseColor.a * value * value;`,
    )
  }
}

const ZAxis = new Vector3(0, 0, 1)
const quaternionHelper = new Quaternion()
const offsetHelper = new Vector3()

export function updatePointerCursorModel(
  pointerGroup: Object3D,
  mesh: Mesh,
  material: MeshBasicMaterial,
  pointer: Pointer,
  options: PointerCursorModelOptions,
) {
  const intersection = pointer.getIntersection()
  if (
    intersection == null ||
    !pointer.getEnabled() ||
    intersection.object.isVoidObject === true ||
    !isVisble(pointerGroup)
  ) {
    mesh.visible = false
    return
  }
  mesh.visible = true

  const color = typeof options.color === 'function' ? options.color(pointer) : options.color
  if (Array.isArray(color)) {
    material.color.set(...color)
  } else {
    material.color.set(color ?? 'white')
  }
  material.opacity = typeof options.opacity === 'function' ? options.opacity(pointer) : (options.opacity ?? 0.4)

  mesh.position.copy(intersection.pointOnFace)
  mesh.scale.setScalar(options.size ?? 0.1)
  if (intersection.face.normal != null) {
    quaternionHelper.setFromUnitVectors(ZAxis, intersection.face.normal)
    intersection.object.getWorldQuaternion(mesh.quaternion)
    mesh.quaternion.multiply(quaternionHelper)
    offsetHelper.set(0, 0, options.cursorOffset ?? 0.01)
    offsetHelper.applyQuaternion(mesh.quaternion)
    mesh.position.add(offsetHelper)
  }
  mesh.updateMatrix()
}

function isVisble({ visible, parent }: Object3D): boolean {
  if (!visible) {
    return false
  }
  if (parent == null) {
    return true
  }
  return isVisble(parent)
}
