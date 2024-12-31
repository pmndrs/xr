import {
  BufferGeometry,
  ColorRepresentation,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Object3DEventMap,
  Vector3Tuple,
} from 'three'
import { HandleOptions, HandleStore } from '../store.js'
import { PointerEventsMap } from '@pmndrs/pointer-events'

export type ControlsElementParts = Array<{
  geometry: BufferGeometry
  position?: Vector3Tuple
  rotation?: Vector3Tuple
  scale?: Vector3Tuple
}>

export abstract class ControlsElement<T> extends Object3D<PointerEventsMap & Object3DEventMap> {
  private material: MeshBasicMaterial

  public readonly store: HandleStore<T>
  public readonly handleGroup: Group

  constructor(
    object: Object3D,
    getOptions: (() => HandleOptions<T>) | undefined,
    private readonly color: ColorRepresentation,
    private readonly opacity: number,
    visualizationParts: ControlsElementParts,
    interactionParts: ControlsElementParts,
  ) {
    super()

    //interaction with handle
    this.handleGroup = new Group()
    createParts(this.handleGroup, interactionParts, undefined, false)
    this.add(this.handleGroup)
    this.store = new HandleStore(object, getOptions)

    //visualization of handle
    this.material = new MeshBasicMaterial({
      color,
      opacity,
      toneMapped: false,
      depthTest: false,
      depthWrite: false,
      fog: false,
      transparent: true,
    })
    createParts(this, visualizationParts, this.material, true)
  }

  setHighlighted(highlighted: boolean): void {
    this.material.color.set(highlighted ? 0xffff00 : this.color)
    this.material.opacity = highlighted ? 1 : this.opacity
  }

  update(time: number): void {
    this.store.update(time)
  }
}

function createParts(group: Object3D, parts: ControlsElementParts, material: Material | undefined, visible: boolean) {
  for (const { geometry, position, rotation, scale } of parts) {
    const mesh = new Mesh(geometry, material)
    mesh.visible = visible
    mesh.matrixAutoUpdate = false
    mesh.renderOrder = Infinity
    mesh.pointerEventsOrder = Infinity
    if (position) {
      mesh.position.set(...position)
    }
    if (rotation) {
      mesh.rotation.set(...rotation)
    }
    if (scale) {
      mesh.scale.set(...scale)
    }
    mesh.updateMatrix()
    group.add(mesh)
  }
}
