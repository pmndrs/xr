import {
  BoxGeometry,
  BufferGeometry,
  ColorRepresentation,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  Object3D,
  OctahedronGeometry,
} from 'three'
import { ControlsElement, ControlsElementParts } from './element.js'
import { Axis } from '../state.js'
import type { PointerEvent } from '@pmndrs/pointer-events'
import { HandleOptions } from '../store.js'

type ElementType = 'x' | 'y' | 'z' | 'xyz' //| 'xy' | 'yz' | 'xz' | 'xyz'

export function createTranslateControlsElements<T>(
  group: Object3D,
  getOptions?: () => HandleOptions<T>,
): Record<ElementType, ControlsElement<T>> {
  const x = new AxisTranslateControls<T>(group, getOptions, 'x')
  group.add(x)

  const y = new AxisTranslateControls<T>(group, getOptions, 'y')
  group.add(y)

  const z = new AxisTranslateControls<T>(group, getOptions, 'z')
  group.add(z)

  const xyz = new FreeTranslateControls<T>(group, getOptions)
  group.add(xyz)

  return { x, y, z, xyz }
}

export function updateTranslateControlsElements(elements: Record<ElementType, ControlsElement<any>>, time: number) {
  for (const key in elements) {
    elements[key as keyof typeof elements].update(time)
  }
}

export function bindTranslateControlsElements(elements: Record<ElementType, ControlsElement<any>>) {
  const hoveredStateMap = new Map<number, ElementType>()

  const updateHover = () => {
    for (const key in elements) {
      elements[key as keyof typeof elements].setHighlighted(false)
    }
    for (const type of hoveredStateMap.values()) {
      for (const key in elements) {
        if (type.includes(key) && (key.length != 2 || type.length != 3)) {
          elements[key as keyof typeof elements].setHighlighted(true)
        }
      }
    }
  }

  const cleanupFunctions = Object.entries(elements).map(([type, element]) => {
    const enterListener = (e: PointerEvent) => {
      hoveredStateMap.set(e.pointerId, type as ElementType)
      updateHover()
    }
    const leaveListener = (e: PointerEvent) => {
      hoveredStateMap.delete(e.pointerId)
      updateHover()
    }
    const unbind = element.store.bind(element.handleGroup)
    element.addEventListener('pointerenter', enterListener)
    element.addEventListener('pointerleave', leaveListener)
    return () => {
      unbind()
      element.removeEventListener('pointerenter', enterListener)
      element.removeEventListener('pointerleave', leaveListener)
    }
  })

  return () => {
    for (const cleanupFunction of cleanupFunctions) {
      cleanupFunction()
    }
  }
}

export class TranslateControls extends Object3D {
  public readonly dispose: () => void
  private readonly elements: ReturnType<typeof createTranslateControlsElements>

  constructor(getOptions?: () => HandleOptions<unknown>) {
    super()
    this.elements = createTranslateControlsElements(this, getOptions)
    this.dispose = bindTranslateControlsElements(this.elements)
  }

  update(time: number) {
    updateTranslateControlsElements(this.elements, time)
  }
}

class PlaneTranslateControls {}

const arrowGeometry = new CylinderGeometry(0, 0.04, 0.1, 12)
arrowGeometry.translate(0, 0.05, 0)

const scaleHandleGeometry = new BoxGeometry(0.08, 0.08, 0.08)
scaleHandleGeometry.translate(0, 0.04, 0)

const lineGeometry = new BufferGeometry()
lineGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3))

const lineGeometry2 = new CylinderGeometry(0.0075, 0.0075, 0.5, 3)
lineGeometry2.translate(0, 0.25, 0)

const axisTranslateVisualizationParts: Record<Axis, ControlsElementParts> = {
  x: [
    { geometry: arrowGeometry, position: [0.5, 0, 0], rotation: [0, 0, -Math.PI / 2] },
    { geometry: arrowGeometry, position: [-0.5, 0, 0], rotation: [0, 0, Math.PI / 2] },
    { geometry: lineGeometry2, position: [0, 0, 0], rotation: [0, 0, -Math.PI / 2] },
  ],
  y: [
    { geometry: arrowGeometry, position: [0, 0.5, 0] },
    { geometry: arrowGeometry, position: [0, -0.5, 0], rotation: [Math.PI, 0, 0] },
    { geometry: lineGeometry2 },
  ],
  z: [
    { geometry: arrowGeometry, position: [0, 0, 0.5], rotation: [Math.PI / 2, 0, 0] },
    { geometry: arrowGeometry, position: [0, 0, -0.5], rotation: [-Math.PI / 2, 0, 0] },
    { geometry: lineGeometry2, rotation: [Math.PI / 2, 0, 0] },
  ],
}

const axisTranslateInteractionParts: Record<Axis, ControlsElementParts> = {
  x: [
    { geometry: new CylinderGeometry(0.2, 0, 0.6, 4), position: [0.3, 0, 0], rotation: [0, 0, -Math.PI / 2] },
    { geometry: new CylinderGeometry(0.2, 0, 0.6, 4), position: [-0.3, 0, 0], rotation: [0, 0, Math.PI / 2] },
  ],
  y: [
    { geometry: new CylinderGeometry(0.2, 0, 0.6, 4), position: [0, 0.3, 0] },
    { geometry: new CylinderGeometry(0.2, 0, 0.6, 4), position: [0, -0.3, 0], rotation: [0, 0, Math.PI] },
  ],
  z: [
    { geometry: new CylinderGeometry(0.2, 0, 0.6, 4), position: [0, 0, 0.3], rotation: [Math.PI / 2, 0, 0] },
    { geometry: new CylinderGeometry(0.2, 0, 0.6, 4), position: [0, 0, -0.3], rotation: [-Math.PI / 2, 0, 0] },
  ],
}

const axisTranslateColor: Record<Axis, ColorRepresentation> = {
  x: 0xff0000,
  y: 0x00ff00,
  z: 0x0000ff,
}

class AxisTranslateControls<T> extends ControlsElement<T> {
  constructor(target: Object3D, getOptions: (() => HandleOptions<T>) | undefined, axis: Axis) {
    super(
      target,
      () => ({
        ...getOptions?.(),
        multitouch: false,
        rotate: false,
        scale: false,
        translate: axis,
      }),
      axisTranslateColor[axis],
      1,
      axisTranslateVisualizationParts[axis],
      axisTranslateInteractionParts[axis],
    )
  }
}

class FreeTranslateControls<T> extends ControlsElement<T> {
  constructor(target: Object3D, getOptions: (() => HandleOptions<T>) | undefined) {
    super(
      target,
      () => ({
        ...getOptions?.(),
        multitouch: false,
        rotate: false,
        scale: false,
        translate: true,
      }),
      0xffffff,
      0.25,
      [{ geometry: new OctahedronGeometry(0.1, 0), position: [0, 0, 0] }],
      [{ geometry: new OctahedronGeometry(0.2, 0) }],
    )
  }
}

/*
const gizmoTranslate = {
  X: [
    [new Mesh(arrowGeometry, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
    [new Mesh(arrowGeometry, matRed), [-0.5, 0, 0], [0, 0, Math.PI / 2]],
    [new Mesh(lineGeometry2, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
  ],
  Y: [
    [new Mesh(arrowGeometry, matGreen), [0, 0.5, 0]],
    [new Mesh(arrowGeometry, matGreen), [0, -0.5, 0], [Math.PI, 0, 0]],
    [new Mesh(lineGeometry2, matGreen)],
  ],
  Z: [
    [new Mesh(arrowGeometry, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
    [new Mesh(arrowGeometry, matBlue), [0, 0, -0.5], [-Math.PI / 2, 0, 0]],
    [new Mesh(lineGeometry2, matBlue), null, [Math.PI / 2, 0, 0]],
  ],
  XYZ: [[new Mesh(new OctahedronGeometry(0.1, 0), matWhiteTransparent.clone()), [0, 0, 0]]],
  XY: [[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matBlueTransparent.clone()), [0.15, 0.15, 0]]],
  YZ: [[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matRedTransparent.clone()), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
  XZ: [
    [new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matGreenTransparent.clone()), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]],
  ],
}

const pickerTranslate = {
  X: [
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0.3, 0, 0], [0, 0, -Math.PI / 2]],
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [-0.3, 0, 0], [0, 0, Math.PI / 2]],
  ],
  Y: [
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0.3, 0]],
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, -0.3, 0], [0, 0, Math.PI]],
  ],
  Z: [
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, 0.3], [Math.PI / 2, 0, 0]],
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, -0.3], [-Math.PI / 2, 0, 0]],
  ],
  XYZ: [[new Mesh(new OctahedronGeometry(0.2, 0), matInvisible)]],
  XY: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0.15, 0]]],
  YZ: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
  XZ: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
}

const helperTranslate = {
  START: [[new Mesh(new OctahedronGeometry(0.01, 2), matHelper), null, null, null, 'helper']],
  END: [[new Mesh(new OctahedronGeometry(0.01, 2), matHelper), null, null, null, 'helper']],
  DELTA: [[new Line(TranslateHelperGeometry(), matHelper), null, null, null, 'helper']],
  X: [[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']],
  Y: [[new Line(lineGeometry, matHelper.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']],
  Z: [[new Line(lineGeometry, matHelper.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], 'helper']],
}

const gizmoRotate = {
  XYZE: [[new Mesh(CircleGeometry(0.5, 1), matGray), null, [0, Math.PI / 2, 0]]],
  X: [[new Mesh(CircleGeometry(0.5, 0.5), matRed)]],
  Y: [[new Mesh(CircleGeometry(0.5, 0.5), matGreen), null, [0, 0, -Math.PI / 2]]],
  Z: [[new Mesh(CircleGeometry(0.5, 0.5), matBlue), null, [0, Math.PI / 2, 0]]],
  E: [[new Mesh(CircleGeometry(0.75, 1), matYellowTransparent), null, [0, Math.PI / 2, 0]]],
}

const helperRotate = {
  AXIS: [[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']],
}

const pickerRotate = {
  XYZE: [[new Mesh(new SphereGeometry(0.25, 10, 8), matInvisible)]],
  X: [[new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, -Math.PI / 2, -Math.PI / 2]]],
  Y: [[new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]]],
  Z: [[new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]]],
  E: [[new Mesh(new TorusGeometry(0.75, 0.1, 2, 24), matInvisible)]],
}

const gizmoScale = {
  X: [
    [new Mesh(scaleHandleGeometry, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
    [new Mesh(lineGeometry2, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
    [new Mesh(scaleHandleGeometry, matRed), [-0.5, 0, 0], [0, 0, Math.PI / 2]],
  ],
  Y: [
    [new Mesh(scaleHandleGeometry, matGreen), [0, 0.5, 0]],
    [new Mesh(lineGeometry2, matGreen)],
    [new Mesh(scaleHandleGeometry, matGreen), [0, -0.5, 0], [0, 0, Math.PI]],
  ],
  Z: [
    [new Mesh(scaleHandleGeometry, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
    [new Mesh(lineGeometry2, matBlue), [0, 0, 0], [Math.PI / 2, 0, 0]],
    [new Mesh(scaleHandleGeometry, matBlue), [0, 0, -0.5], [-Math.PI / 2, 0, 0]],
  ],
  XY: [[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matBlueTransparent), [0.15, 0.15, 0]]],
  YZ: [[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matRedTransparent), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
  XZ: [[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matGreenTransparent), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
  XYZ: [[new Mesh(new BoxGeometry(0.1, 0.1, 0.1), matWhiteTransparent.clone())]],
}

const pickerScale = {
  X: [
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0.3, 0, 0], [0, 0, -Math.PI / 2]],
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [-0.3, 0, 0], [0, 0, Math.PI / 2]],
  ],
  Y: [
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0.3, 0]],
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, -0.3, 0], [0, 0, Math.PI]],
  ],
  Z: [
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, 0.3], [Math.PI / 2, 0, 0]],
    [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, -0.3], [-Math.PI / 2, 0, 0]],
  ],
  XY: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0.15, 0]]],
  YZ: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]],
  XZ: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]],
  XYZ: [[new Mesh(new BoxGeometry(0.2, 0.2, 0.2), matInvisible), [0, 0, 0]]],
}

const helperScale = {
  X: [[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']],
  Y: [[new Line(lineGeometry, matHelper.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']],
  Z: [[new Line(lineGeometry, matHelper.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], 'helper']],
}
*/
