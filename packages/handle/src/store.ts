import { Euler, Matrix4, Object3D, Object3DEventMap, Quaternion, Vector2Tuple, Vector3 } from 'three'
import type { PointerEvent, PointerEventsMap } from '@pmndrs/pointer-events'
import { Axis, HandleState, HandleStateImpl, HandleTransformState } from './state.js'
import { getWorldDirection } from './utils.js'
import {
  computeOnePointerHandleTransformState,
  OnePointerHandlePointerData,
  OnePointerHandleStoreData,
} from './computations/one-pointer.js'
import {
  computeTwoPointerHandleTransformState,
  TwoPointerHandlePointerData,
  TwoPointerHandleStoreData,
} from './computations/two-pointer.js'
import { computeTranslateAsHandleTransformState } from './computations/index.js'

export type HandleOptions<T> = {
  /**
   * function that allows to modify and apply the state to the target
   * @default (state, target) => {target.position.copy(state.current.position);target.quaternion.copy(state.current.quaternion);target.scale.copy(state.current.scale);}
   */
  apply?: (state: HandleState<T>, target: Object3D) => T
  /**
   * @default false
   * necassary if the relative space (e.g. when using the default relativeTo="local") changes often (e.g. every frame)
   */
  alwaysUpdate?: boolean
  ///**
  // * @default false
  // */
  //TODO rubberband?: boolean
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
    uniform?: boolean
  }
  //TODO: filter
  /**
   * @default true
   */
  stopPropagation?: boolean
}

export type HandleTransformOptions =
  | {
      x?: boolean | Vector2Tuple
      y?: boolean | Vector2Tuple
      z?: boolean | Vector2Tuple
    }
  | boolean
  | Axis

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

export class HandleStore<T> implements OnePointerHandleStoreData, TwoPointerHandleStoreData {
  //internal out state (will be used to output the state)
  private outputState: HandleStateImpl<T>
  private latestMoveEvent: PointerEvent | undefined

  //internal in state (will be written on save)
  readonly inputState = new Map<number, OnePointerHandlePointerData & TwoPointerHandlePointerData>()
  readonly capturedObjects = new Map<number, Object3D>()
  readonly initialTargetPosition = new Vector3()
  readonly initialTargetQuaternion = new Quaternion()
  readonly initialTargetRotation = new Euler()
  readonly initialTargetScale = new Vector3()
  initialTargetParentWorldMatrix: Matrix4 | undefined

  //prev state
  prevTwoPointerDeltaRotation: Quaternion | undefined
  prevAngle: number | undefined

  public readonly handlers = {
    onPointerDown: this.onPointerDown.bind(this),
    onPointerMove: this.onPointerMove.bind(this),
    onPointerUp: this.onPointerUp.bind(this),
  }

  constructor(
    private readonly target: Object3D | { current?: Object3D | null },
    public readonly getOptions: () => HandleOptions<T> = () => ({}),
  ) {
    this.outputState = new HandleStateImpl<T>(this.cancel.bind(this))
  }

  /**
   * @requires that the pointerId is in this.capturedSet
   */
  private firstOnPointer(event: PointerEvent): void {
    const target = this.getTarget()
    if (target == null) {
      return
    }
    const pointerWorldDirection = getWorldDirection(event, vectorHelper) ? vectorHelper.clone() : undefined
    this.inputState.set(event.pointerId, {
      pointerWorldDirection,
      pointerWorldPoint: event.point,
      pointerWorldQuaternion: event.pointerQuaternion,
      initialPointerWorldPoint: event.point.clone(),
      initialPointerWorldDirection: pointerWorldDirection?.clone(),
      initialPointerWorldQuaternion: event.pointerQuaternion.clone(),
      prevPointerWorldQuaternion: event.pointerQuaternion,
    })
    this.save()
    if (this.inputState.size === 1) {
      this.outputState.start(event, {
        pointerAmount: 1,
        time: event.timeStamp,
        position: this.initialTargetPosition.clone(),
        quaternion: this.initialTargetQuaternion.clone(),
        rotation: this.initialTargetRotation.clone(),
        scale: this.initialTargetScale.clone(),
      })
    } else {
      //TODO: add
    }
    this.outputState.memo = this.apply(target)
  }

  private onPointerDown(event: PointerEvent): void {
    this.stopPropagation(event)
    if (!this.capturePointer(event.pointerId, event.object)) {
      return
    }
    this.firstOnPointer(event)
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.capturedObjects.has(event.pointerId)) {
      return
    }
    this.stopPropagation(event)
    const entry = this.inputState.get(event.pointerId)
    if (entry == null) {
      this.firstOnPointer(event)
      return
    }
    this.latestMoveEvent = event
    entry.pointerWorldPoint = event.point
    entry.prevPointerWorldQuaternion = entry.pointerWorldQuaternion
    entry.pointerWorldQuaternion = event.pointerQuaternion
    if (entry.pointerWorldDirection != null) {
      getWorldDirection(event, entry.pointerWorldDirection)
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
    const target = this.getTarget()
    if (target != null) {
      this.apply(target)
    }
  }

  private onPointerUp(event: PointerEvent): void {
    if (!this.capturedObjects.has(event.pointerId)) {
      return
    }
    this.stopPropagation(event)
    this.releasePointer(event.pointerId, event.object, event)
  }

  update(time: number) {
    const target = this.getTarget()
    if (
      target == null ||
      this.inputState.size === 0 ||
      (this.latestMoveEvent == null && (this.getOptions().alwaysUpdate ?? false) === false)
    ) {
      return
    }

    const options = this.getOptions()
    let transformState: HandleTransformState

    if (
      options.translate === 'as-rotate' ||
      options.translate === 'as-rotate-and-scale' ||
      options.translate === 'as-scale'
    ) {
      this.prevTwoPointerDeltaRotation = undefined
      this.prevAngle = undefined
      const [p1] = this.inputState.values()
      transformState = computeTranslateAsHandleTransformState()
    } else if (this.inputState.size === 1) {
      this.prevTwoPointerDeltaRotation = undefined
      this.prevAngle = undefined
      const [p1] = this.inputState.values()
      transformState = computeOnePointerHandleTransformState(time, p1, this, target.parent?.matrixWorld, options)
    } else {
      const [p1, p2] = this.inputState.values()
      transformState = computeTwoPointerHandleTransformState(time, p1, p2, this, target.parent?.matrixWorld, options)
    }

    this.outputState.update(this.latestMoveEvent, transformState)
    this.outputState.memo = this.apply(target)
    this.latestMoveEvent = undefined
  }

  private getTarget() {
    return this.target instanceof Object3D ? this.target : this.target?.current
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
    const target = this.getTarget()
    if (target == null || !this.capturedObjects.delete(pointerId)) {
      return
    }
    this.inputState.delete(pointerId)
    object.releasePointerCapture(pointerId)
    if (this.inputState.size > 0) {
      this.save()
      return
    }
    this.outputState.end(event)
    this.apply(target)
  }

  private stopPropagation(event: PointerEvent | undefined) {
    if (event == null || !(this.getOptions()?.stopPropagation ?? true)) {
      return
    }
    event.stopPropagation()
  }

  private apply(target: Object3D): T {
    const apply = this.getOptions().apply ?? defaultApply
    return apply(this.outputState, target)
  }

  getState(): HandleState<T> | undefined {
    return this.inputState.size === 0 ? undefined : this.outputState
  }

  save(): void {
    const target = this.getTarget()
    if (target == null) {
      return
    }
    target.updateWorldMatrix(true, false)
    //reset prev
    this.prevAngle = undefined
    this.prevTwoPointerDeltaRotation = undefined
    //update initial
    this.initialTargetParentWorldMatrix = target.parent?.matrixWorld.clone()
    if (target.matrixAutoUpdate) {
      this.initialTargetPosition.copy(target.position)
      this.initialTargetQuaternion.copy(target.quaternion)
      this.initialTargetRotation.copy(target.rotation)
      this.initialTargetScale.copy(target.scale)
    } else {
      target.matrix.decompose(this.initialTargetPosition, this.initialTargetQuaternion, this.initialTargetScale)
      this.initialTargetRotation.setFromQuaternion(this.initialTargetQuaternion, target.rotation.order)
    }
    for (const data of this.inputState.values()) {
      if (data.pointerWorldDirection != null) {
        data.initialPointerWorldDirection?.copy(data.pointerWorldDirection)
      }
      data.initialPointerWorldPoint.copy(data.pointerWorldPoint)
      data.initialPointerWorldQuaternion.copy(data.pointerWorldQuaternion)
    }
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

function defaultApply(state: HandleState<unknown>, target: Object3D): any {
  target.position.copy(state.current.position)
  target.quaternion.copy(state.current.quaternion)
  target.scale.copy(state.current.scale)
}
