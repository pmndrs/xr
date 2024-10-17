import { Matrix4, Object3D, Object3DEventMap, Quaternion, Vector2Tuple, Vector3 } from 'three'
import type { PointerEvent, PointerEventsMap } from '@pmndrs/pointer-events'
import { computeGlobalTransformation } from './transformation.js'
import { Axis, HandleState, HandleStateImpl, HandleTransformStateImpl } from './state.js'
import { getWorldDirection, Object3DRef, resolveRef } from './utils.js'

export type HandleOptions = {
  /**
   * @default false
   * necassary if the relative space (e.g. when using the default relativeTo="local") changes often (e.g. every frame)
   */
  alwaysUpdate?: boolean
  ///**
  // * @default false
  // */
  //rubberband?: boolean
  /**
   * @default true
   */
  multitouch?: boolean
  /**
   * @default true
   */
  rotate?: HandleTransformOptions
  /**
   * @default true
   */
  translate?: HandleTransformOptions | 'as-rotate' | 'as-scale' | 'as-rotate-and-scale'
  /**
   * @default true
   */
  scale?: HandleTransformOptions & {
    /**
     * @default false
     */
    uniform?: boolean | Axis
  }
  //TBD: filter
  /**
   * @default true
   */
  stopPropagation?: boolean
}

//TODO: add rubberband option
export type HandleTransformOptions =
  | {
      x?: boolean | Vector2Tuple
      y?: boolean | Vector2Tuple
      z?: boolean | Vector2Tuple
      lockAxis?: boolean
    }
  | boolean
  | Axis

const OneVector = new Vector3(1, 1, 1)
const matrixHelper = new Matrix4()
const vectorHelper = new Vector3()

/**
 * 2 ways of using HandleStore
 *
 * 1. bind it using "bind"
 * const handleStore = new HandleStore(() => {}, target)
 * const stop = handleStore.bind(handle)
 *
 * 2. capture it yourself
 * const handleStore = new HandleStore(() => {}, target)
 * const stop = handleStore.capture(pointerId, handle)
 */

export class HandleStore<T> {
  //internal out state (will be used to output the state)
  private outputState: HandleStateImpl<T>
  private latestMoveEvent: PointerEvent | undefined

  //internal in state (will be written on save)
  private readonly inputState = new Map<
    number,
    {
      offset: Matrix4
      worldMatrix: Matrix4
      worldDirection: Vector3 | undefined
      initialWorldMatrix: Matrix4
      initialWorldDirection: Vector3 | undefined
    }
  >()
  private readonly capturedObjects = new Map<number, Object3D>()
  //relation of the following variables
  //initialWorldMatrix =
  //    initialRelativeToParentWorldMatrix *
  //    initialRelativeToPosition *
  //    initialRealtiveToQuaternion *
  //    initialMatrixInRelativeToOriginSpace
  private initialRelativeToParentWorldMatrix: Matrix4 | undefined
  private initialRelativeToPosition = new Vector3()
  private initialRealtiveToQuaternion = new Quaternion()
  private initialMatrixInRelativeToOriginSpace = new Matrix4()

  public readonly handlers = {
    onPointerDown: this.onPointerDown.bind(this),
    onPointerMove: this.onPointerMove.bind(this),
    onPointerUp: this.onPointerUp.bind(this),
  }

  constructor(
    private readonly fn: (state: HandleState<T>) => T,
    private readonly target: Object3DRef,
    private readonly relativeTo: Object3DRef = target,
    public readonly getOptions: () => HandleOptions = () => ({}),
  ) {
    this.outputState = new HandleStateImpl<T>(this.cancel.bind(this))
  }

  /**
   * @requires that the pointerId is in this.capturedSet
   */
  private firstOnPointer(event: PointerEvent): void {
    const target = this.getTarget()
    const relativeTo = this.getRelativeTo()
    if (target == null || relativeTo == null) {
      return
    }
    const worldMatrix = new Matrix4().compose(event.point, event.pointerQuaternion, OneVector)
    const worldDirection = getWorldDirection(event, vectorHelper) ? vectorHelper.clone() : undefined
    this.inputState.set(event.pointerId, {
      offset: new Matrix4(),
      worldMatrix,
      initialWorldMatrix: worldMatrix.clone(),
      worldDirection,
      initialWorldDirection: worldDirection?.clone(),
    })
    if (this.inputState.size !== 1) {
      this.updateOffsets(this.outputState.current.globalMatrix)
      return
    }
    target.updateWorldMatrix(true, false)
    this.updateOffsets(target.matrixWorld)
    relativeTo.matrix.decompose(this.initialRelativeToPosition, this.initialRealtiveToQuaternion, vectorHelper)
    matrixHelper.compose(this.initialRelativeToPosition, this.initialRealtiveToQuaternion, OneVector)
    const relativeToParentWorldMatrix = this.getRelativeToParentWorldMatrix(relativeTo)
    this.initialRelativeToParentWorldMatrix = relativeToParentWorldMatrix?.clone()
    if (relativeToParentWorldMatrix != null) {
      matrixHelper.premultiply(relativeToParentWorldMatrix)
    }
    this.initialMatrixInRelativeToOriginSpace = target.matrixWorld.clone().premultiply(matrixHelper.invert())
    const current = new HandleTransformStateImpl(
      event.timeStamp,
      this.inputState.size,
      target.matrixWorld,
      this.getRelativeToParentWorldMatrix(relativeTo),
      this.getOptions,
    )
    this.outputState.start(event, current)
    this.outputState.memo = this.fn(this.outputState)
  }

  private onPointerDown(event: PointerEvent): void {
    this.stopPropagation(event)
    if (!this.capturePointer(event.pointerId, event.object)) {
      return
    }
    this.firstOnPointer(event)
  }

  private getRelativeToParentWorldMatrix(relativeTo: Object3D) {
    if (relativeTo.parent == null) {
      return undefined
    }
    relativeTo.parent.updateWorldMatrix(true, false)
    return relativeTo.parent.matrixWorld
  }

  private updateOffsets(targetWorldMatrix: Matrix4): void {
    for (const { worldMatrix: transformation, offset, initialWorldMatrix } of this.inputState.values()) {
      //offset = transformation-1 * targetWorldMatrix
      offset.copy(transformation).invert().multiply(targetWorldMatrix)
      initialWorldMatrix.copy(transformation)
    }
  }

  private onPointerMove(event: PointerEvent): void {
    this.stopPropagation(event)
    const entry = this.inputState.get(event.pointerId)
    if (entry != null) {
      this.latestMoveEvent = event
      entry.worldMatrix.compose(event.point, event.pointerQuaternion, OneVector)
      if (entry.worldDirection != null) {
        getWorldDirection(event, entry.worldDirection)
      }
      return
    }
    if (this.capturedObjects.has(event.pointerId)) {
      this.firstOnPointer(event)
    }
  }

  public cancel(): void {
    if (this.capturedObjects.size === 0) {
      return
    }
    for (const [pointerId, object] of this.capturedObjects) {
      object.releasePointerCapture(pointerId)
    }
    this.capturedObjects.clear()
    this.inputState.clear()
    this.outputState.end(undefined)
    this.fn(this.outputState)
  }

  private onPointerUp(event: PointerEvent): void {
    this.stopPropagation(event)
    this.releasePointer(event.pointerId, event.object, event)
  }

  update(time: number) {
    if (
      this.inputState.size === 0 ||
      (this.latestMoveEvent == null && (this.getOptions().alwaysUpdate ?? false) === false)
    ) {
      return
    }
    const relativeTo = this.getRelativeTo()
    if (relativeTo == null) {
      return
    }
    const relativeToParentWorldMatrix = this.getRelativeToParentWorldMatrix(relativeTo)
    const matrix = computeGlobalTransformation(
      this.inputState,
      this.initialRelativeToParentWorldMatrix,
      this.initialRelativeToPosition,
      this.initialRealtiveToQuaternion,
      this.initialMatrixInRelativeToOriginSpace,
      relativeToParentWorldMatrix,
      this.getOptions(),
    )
    this.outputState.update(
      this.latestMoveEvent,
      new HandleTransformStateImpl(time, this.inputState.size, matrix, relativeToParentWorldMatrix, this.getOptions),
    )
    this.fn(this.outputState)
    this.latestMoveEvent = undefined
  }

  private getTarget() {
    return resolveRef(this.target)
  }

  private getRelativeTo() {
    return resolveRef(this.relativeTo)
  }

  private capturePointer(pointerId: number, object: Object3D): boolean {
    if (this.capturedObjects.has(pointerId)) {
      return false
    }
    const { multitouch, translate } = this.getOptions()
    if (((multitouch ?? true) === false || typeof translate === 'string') && this.capturedObjects.size === 1) {
      return false
    }
    this.capturedObjects.set(pointerId, object)
    object.setPointerCapture(pointerId)
    return true
  }

  private releasePointer(pointerId: number, object: Object3D, event: PointerEvent | undefined): void {
    if (!this.capturedObjects.delete(pointerId)) {
      return
    }
    this.inputState.delete(pointerId)
    object.releasePointerCapture(pointerId)
    if (this.inputState.size > 0) {
      this.updateOffsets(this.outputState.current.globalMatrix)
      return
    }
    this.outputState.end(event)
    this.fn(this.outputState)
  }

  private stopPropagation(event: PointerEvent | undefined) {
    if (event == null || !(this.getOptions()?.stopPropagation ?? true)) {
      return
    }
    event.stopPropagation()
  }

  getState(): HandleState<T> | undefined {
    return this.inputState.size === 0 ? undefined : this.outputState
  }

  save(): void {
    //TODO: re-write all internal store information
  }

  bind(object: Object3D<PointerEventsMap & Object3DEventMap>): () => void {
    const { onPointerDown, onPointerMove, onPointerUp } = this.handlers
    object.addEventListener('pointerdown', onPointerDown)
    object.addEventListener('pointermove', onPointerMove)
    object.addEventListener('pointerup', onPointerUp)
    return () => {
      object.removeEventListener('pointerdown', onPointerDown)
      object.removeEventListener('pointermove', onPointerMove)
      object.removeEventListener('pointerup', onPointerUp)
      this.cancel()
    }
  }

  capture(pointerId: number, object: Object3D): () => void {
    if (!this.capturePointer(pointerId, object)) {
      return noop
    }
    return () => this.releasePointer(pointerId, object, undefined)
  }
}

function noop() {}
