import { Vector2Tuple, PerspectiveCamera, OrthographicCamera, Object3D, Vector3 } from 'three'
import type { Axis } from '../state.js'
import type { HandlesProperties } from './index.js'

export function extractHandleTransformOptions(
  key: 'x' | 'y' | 'z' | 'xy' | 'yz' | 'xz' | 'xyz' | 'e',
  properties: HandlesProperties = true,
): {
  options:
    | {
        x: boolean | Vector2Tuple
        y: boolean | Vector2Tuple
        z: boolean | Vector2Tuple
        e: boolean | Vector2Tuple
      }
    | false
  disabled: boolean
} {
  if (properties === false) {
    return { options: false, disabled: true }
  }
  if (properties === true) {
    const result = {
      x: false,
      y: false,
      z: false,
      e: false,
    }
    for (const axis of key) {
      result[axis as Axis] = true
    }
    return { options: result, disabled: false }
  }
  if (properties === 'disabled') {
    return { options: { x: true, y: true, z: true, e: true }, disabled: true }
  }
  if (typeof properties === 'string') {
    return {
      options:
        properties === key
          ? {
              x: false,
              y: false,
              z: false,
              e: false,
              [key]: true,
            }
          : false,
      disabled: false,
    }
  }
  const result = {
    x: false as boolean | Vector2Tuple,
    y: false as boolean | Vector2Tuple,
    z: false as boolean | Vector2Tuple,
    e: false as boolean | Vector2Tuple,
  }
  let disabled = false
  for (const axis of key) {
    let axisOption = properties[axis as Axis] ?? true
    if (axisOption === false) {
      return { options: false, disabled: true }
    }
    if (axisOption === 'disabled') {
      disabled = true
      axisOption = true
    }
    result[axis as Axis] = axisOption
  }
  return { options: result, disabled }
}

const worldPositionHelper = new Vector3()
const cameraPositionHelper = new Vector3()

export function computeHandlesScale(
  handlesCenter: Object3D,
  camera: PerspectiveCamera | OrthographicCamera,
  fixed: boolean,
  size: number,
) {
  if (!fixed) {
    return size
  }

  //from https://github.com/mrdoob/three.js/blob/79497a2c9b86036cfcc0c7ed448574f2d62de64d/examples/jsm/controls/TransformControls.js#L1245
  let factor
  if (camera instanceof OrthographicCamera) {
    factor = (camera.top - camera.bottom) / camera.zoom
  } else {
    camera.getWorldPosition(worldPositionHelper)
    handlesCenter.getWorldPosition(cameraPositionHelper)
    factor =
      worldPositionHelper.distanceTo(cameraPositionHelper) *
      Math.min((1.9 * Math.tan((Math.PI * camera.fov) / 360)) / camera.zoom, 7)
  }

  return (factor * size) / 4
}
