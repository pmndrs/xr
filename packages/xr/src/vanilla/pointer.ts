import { Pointer } from '@pmndrs/pointer-events'
import { BoxGeometry, Mesh, Object3D, PlaneGeometry } from 'three'
import { onXRFrame } from './utils.js'
import { PointerCursorMaterial, PointerCursorModelOptions, updatePointerCursorModel } from '../pointer/cursor.js'
import { PointerRayMaterial, PointerRayModelOptions, updatePointerRayModel } from '../pointer/ray.js'

const pointerRayGeometry = new BoxGeometry()

export class PointerRayModel extends Mesh {
  constructor(pointer: Pointer, options: PointerRayModelOptions = {}) {
    const MaterialClass = options.materialClass ?? PointerRayMaterial
    const material = new MaterialClass()
    super(pointerRayGeometry, material)
    this.renderOrder = options.renderOrder ?? 2
    onXRFrame(() => updatePointerRayModel(this, material, pointer, options))
  }
}

const pointerCursorGeometry = new PlaneGeometry()

export class PointerCursorModel extends Mesh {
  constructor(pointerGroup: Object3D, pointer: Pointer, options: PointerCursorModelOptions = {}) {
    const MaterialClass = options.materialClass ?? PointerCursorMaterial
    const material = new MaterialClass()
    super(pointerCursorGeometry, material)
    this.renderOrder = options.renderOrder ?? 1
    onXRFrame(() => updatePointerCursorModel(pointerGroup, this, material, pointer, options))
  }
}
