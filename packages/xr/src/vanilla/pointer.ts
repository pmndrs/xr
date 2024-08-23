import { Pointer } from '@pmndrs/pointer-events'
import { BoxGeometry, Mesh, PlaneGeometry } from 'three'
import { onXRFrame } from './utils.js'
import { PointerRayMaterial, PointerRayModelOptions, updatePointerRayModel } from '../pointer/ray.js'
import { PointerCursorMaterial, PointerCursorModelOptions, updatePointerCursorModel } from '../pointer/cursor.js'

const pointerRayGeometry = new BoxGeometry()

export class PointerRayModel extends Mesh {
  constructor(pointer: Pointer, options: PointerRayModelOptions = {}) {
    const material = new PointerRayMaterial()
    super(pointerRayGeometry, material)
    this.name = 'PointerRayModel'
    this.renderOrder = options.renderOrder ?? 2
    onXRFrame(() => updatePointerRayModel(this, material, pointer, options))
  }
}

const pointerCursorGeometry = new PlaneGeometry()

export class PointerCursorModel extends Mesh {
  constructor(pointer: Pointer, options: PointerCursorModelOptions = {}) {
    const material = new PointerCursorMaterial()
    super(pointerCursorGeometry, material)
    this.name = 'PointerCursorModel'
    this.renderOrder = options.renderOrder ?? 1
    onXRFrame(() => updatePointerCursorModel(this, material, pointer, options))
  }
}
