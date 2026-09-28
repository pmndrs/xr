import { expect } from 'chai'
import { Euler, Matrix4, MeshBasicMaterial, Quaternion, Vector3 } from 'three'
import { computeHandleTransformState } from '../src/computations/utils.js'
import { PivotHandles } from '../src/index.js'

describe('uniform scale limits', () => {
  function computeScale(initialScale: Vector3, factor: number, scale: object) {
    const storeData = {
      initialTargetPosition: new Vector3(),
      initialTargetQuaternion: new Quaternion(),
      initialTargetRotation: new Euler(),
      initialTargetScale: initialScale,
    }
    const matrix = new Matrix4().makeScale(initialScale.x * factor, initialScale.y * factor, initialScale.z * factor)
    return computeHandleTransformState(0, 1, matrix, storeData, undefined, { scale: { uniform: true, ...scale } }).scale
  }

  it('should keep the scale uniform when clamping to the max limit', () => {
    const scale = computeScale(new Vector3(1, 1, 1), 3, { x: [0.5, 2], y: true, z: true })
    expect(scale.toArray()).to.deep.equal([2, 2, 2])
  })

  it('should keep the scale uniform when clamping to the min limit', () => {
    const scale = computeScale(new Vector3(1, 2, 1), 0.1, { x: true, y: [0.5, 4], z: true })
    expect(scale.toArray()).to.deep.equal([0.25, 0.5, 0.25])
  })

  it('should use the most restrictive limit across all axes', () => {
    const scale = computeScale(new Vector3(1, 1, 1), 3, { x: [0.5, 2], y: [0.5, 1.5], z: true })
    expect(scale.toArray()).to.deep.equal([1.5, 1.5, 1.5])
  })

  it('should not change the scale when it is within the limits', () => {
    const scale = computeScale(new Vector3(1, 1, 1), 1.5, { x: [0.5, 2], y: [0.5, 2], z: [0.5, 2] })
    expect(scale.x).to.be.closeTo(1.5, 1e-9)
    expect(scale.y).to.be.closeTo(1.5, 1e-9)
    expect(scale.z).to.be.closeTo(1.5, 1e-9)
  })
})

describe('PivotHandles uniform scale handle', () => {
  it('should only highlight itself when hovered', () => {
    const pivot = new PivotHandles()
    const unbind = pivot.bind()
    const { scaleX, scaleY, scaleZ, scaleXYZ } = pivot.handles
    const getColor = (handle: typeof scaleX | typeof scaleXYZ) =>
      ((handle.children[0] as any).material as MeshBasicMaterial).color.getHex()
    const colorsBefore = [scaleX, scaleY, scaleZ].map(getColor)

    scaleXYZ.children[0].dispatchEvent({ type: 'pointerenter', pointerId: 1 } as any)

    expect(getColor(scaleXYZ)).to.equal(0xffff40)
    expect([scaleX, scaleY, scaleZ].map(getColor)).to.deep.equal(colorsBefore)
    unbind()
  })

  it('should be hidden when scaling is restricted to a subset of the axes', () => {
    const pivot = new PivotHandles()
    const unbind = pivot.bind(undefined, undefined, { x: false })
    expect(pivot.handles.scaleXYZ.children).to.have.length(0)
    unbind()
  })
})
