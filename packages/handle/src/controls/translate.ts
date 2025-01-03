import {
  BoxGeometry,
  BufferGeometry,
  ColorRepresentation,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OctahedronGeometry,
  Vector3Tuple,
} from 'three'
import { ControlHandle, ControlHandleParts } from './handle.js'
import { Axis } from '../state.js'
import type { PointerEvent } from '@pmndrs/pointer-events'
import { HandleOptions } from '../store.js'

//concept: transform control context (group, bind, onFrame, onHover, onApply(first, last))

type ElementType = 'x' | 'y' | 'z' | 'xyz' | 'xy' | 'yz' | 'xz' | 'xyz'

export function createTranslateControls<T>(
  group: Object3D,
  getOptions?: () => HandleOptions<T>,
): { handles: Record<ElementType, ControlHandle<T>>; lines: Record<Axis, Object3D> } {
  const apply: HandleOptions<T>['apply'] = (state, target) => {
    if(state.first) {
      //set initial position
    }

    if(state.last) {
      //set to invisible
    } else {
      //set to visible
    }
    return getOptions?.().apply?.(state, target) ?? (undefined as any)
  }

  const x = new AxisTranslateHandle<T>(group, getOptions, 'x')
  group.add(x)

  const y = new AxisTranslateHandle<T>(group, getOptions, 'y')
  group.add(y)

  const z = new AxisTranslateHandle<T>(group, getOptions, 'z')
  group.add(z)

  const yz = new PlaneTranslateControls<T>(group, getOptions, 'x')
  group.add(yz)

  const xz = new PlaneTranslateControls<T>(group, getOptions, 'y')
  group.add(xz)

  const xy = new PlaneTranslateControls<T>(group, getOptions, 'z')
  group.add(xy)

  const xyz = new FreeTranslateHandle<T>(group, getOptions)
  group.add(xyz)

  return {
    handles: { x, y, z, xyz, xy, xz, yz },
    lines: {
      x: new HelperLine(group, [-1e3, 0, 0], undefined, [1e6, 1, 1]),
      y: new HelperLine(group, [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1]),
      z: new HelperLine(group, [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1]),
    },
  }
}

const lineMaterial = new LineBasicMaterial({
  color: 'white',
  toneMapped: false,
  depthTest: false,
  depthWrite: false,
  fog: false,
  transparent: true,
})

class HelperLine extends Line {
  constructor(parent: Object3D, position?: Vector3Tuple, rotation?: Vector3Tuple, scale?: Vector3Tuple) {
    super(lineGeometry, lineMaterial)
    parent.add(this)
    if (position != null) {
      this.position.fromArray(position)
    }
    if (rotation != null) {
      this.rotation.fromArray(rotation)
    }
    if (scale != null) {
      this.scale.fromArray(scale)
    }
    this.visible = false
  }
}

export function updateTranslateControlsHandles(handles: Record<ElementType, ControlHandle<any>>, time: number) {
  for (const key in handles) {
    handles[key as keyof typeof handles].update(time)
  }
}

export function bindTranslateControls({ handles, lines }: ReturnType<typeof createTranslateControls<any>>) {
  const hoveredStateMap = new Map<number, ElementType>()

  const updateHover = () => {
    for (const key in handles) {
      handles[key as keyof typeof handles].setHighlighted(false)
    }
    for (const key in lines) {
      lines[key as keyof typeof lines].visible = false
    }
    for (const type of hoveredStateMap.values()) {
      for (const key in lines) {
        lines[key as keyof typeof lines].visible = type.includes(key)
      }
      for (const key in handles) {
        if (type.includes(key) && (key.length != 2 || type.length != 3)) {
          handles[key as keyof typeof handles].setHighlighted(true)
        }
      }
    }
  }

  const cleanupFunctions = Object.entries(handles).map(([type, element]) => {
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
  private readonly elements: ReturnType<typeof createTranslateControls>

  constructor(getOptions?: () => HandleOptions<unknown>) {
    super()
    this.elements = createTranslateControls(this, getOptions)
    this.dispose = bindTranslateControls(this.elements)
  }

  update(time: number) {
    updateTranslateControlsHandles(this.elements.handles, time)
  }
}

const arrowGeometry = new CylinderGeometry(0, 0.04, 0.1, 12)
arrowGeometry.translate(0, 0.05, 0)

const scaleHandleGeometry = new BoxGeometry(0.08, 0.08, 0.08)
scaleHandleGeometry.translate(0, 0.04, 0)

const lineGeometry = new BufferGeometry()
lineGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3))

const lineGeometry2 = new CylinderGeometry(0.0075, 0.0075, 0.5, 3)
lineGeometry2.translate(0, 0.25, 0)

const axisTranslateVisualizationParts: Record<Axis, ControlHandleParts> = {
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

const axisTranslateInteractionParts: Record<Axis, ControlHandleParts> = {
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

class AxisTranslateHandle<T> extends ControlHandle<T> {
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

class FreeTranslateHandle<T> extends ControlHandle<T> {
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

const notAxisTranslateVisualizationParts: Record<Axis, ControlHandleParts> = {
  x: [
    {
      geometry: new BoxGeometry(0.15, 0.15, 0.01),
      position: [0, 0.15, 0.15],
      rotation: [0, Math.PI / 2, 0],
    },
  ],
  y: [
    {
      geometry: new BoxGeometry(0.15, 0.15, 0.01),
      position: [0.15, 0, 0.15],
      rotation: [-Math.PI / 2, 0, 0],
    },
  ],
  z: [
    {
      geometry: new BoxGeometry(0.15, 0.15, 0.01),
      position: [0.15, 0.15, 0],
    },
  ],
}

const notAxisTranslateInteractionParts: Record<Axis, ControlHandleParts> = {
  x: [
    {
      geometry: new BoxGeometry(0.2, 0.2, 0.01),
      position: [0, 0.15, 0.15],
      rotation: [0, Math.PI / 2, 0],
    },
  ],
  y: [
    {
      geometry: new BoxGeometry(0.2, 0.2, 0.01),
      position: [0.15, 0, 0.15],
      rotation: [-Math.PI / 2, 0, 0],
    },
  ],
  z: [
    {
      geometry: new BoxGeometry(0.2, 0.2, 0.01),
      position: [0.15, 0.15, 0],
    },
  ],
}

class PlaneTranslateControls<T> extends ControlHandle<T> {
  constructor(target: Object3D, getOptions: (() => HandleOptions<T>) | undefined, notAxis: Axis) {
    super(
      target,
      () => ({
        ...getOptions?.(),
        multitouch: false,
        rotate: false,
        scale: false,
        translate: {
          [notAxis]: false,
        },
      }),
      axisTranslateColor[notAxis],
      0.5,
      notAxisTranslateVisualizationParts[notAxis],
      notAxisTranslateInteractionParts[notAxis],
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
