import { Euler, Matrix4, Object3D, Object3DEventMap, Quaternion, Vector2Tuple, Vector3 } from 'three'
import type { PointerEvent, PointerEventsMap } from '@pmndrs/pointer-events'
import { Axis, HandleState, HandleStateImpl } from './state.js'
import { projectOntoSpace, getWorldDirection } from './utils.js'
import { computeHandleTransformState } from './computations/index.js'
import { PointerData } from './computations/one-pointer.js'

export type HandleOptions<T> = {
  fn?: (state: HandleState<T>) => T
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
    //TODO: uniform?: boolean | Axis
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

export class HandleStore<T> {
  //internal out state (will be used to output the state)
  private outputState: HandleStateImpl<T>
  private latestMoveEvent: PointerEvent | undefined

  //internal in state (will be written on save)
  private readonly inputState = new Map<number, PointerData>()
  private readonly capturedObjects = new Map<number, Object3D>()
  private readonly initialTargetPosition = new Vector3()
  private readonly initialTargetQuaternion = new Quaternion()
  private readonly initialTargetRotation = new Euler()
  private readonly initialTargetScale = new Vector3()
  private readonly initialTargetParentWorldMatrix = new Matrix4()

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
      initialPointerToTargetParentOffset: new Matrix4(),
      pointerWorldDirection,
      pointerWorldPoint: event.point,
      pointerWorldQuaternion: event.pointerQuaternion,
      initialPointerWorldPoint: event.point,
      initialPointerWorldDirection: pointerWorldDirection?.clone(),
    })
    this.save()
    if (this.inputState.size !== 1) {
      return
    }
    this.outputState.start(event, {
      pointerAmount: 1,
      time: event.timeStamp,
      position: this.initialTargetPosition.clone(),
      quaternion: this.initialTargetQuaternion.clone(),
      rotation: this.initialTargetRotation.clone(),
      scale: this.initialTargetScale.clone(),
    })
    this.outputState.memo = this.fn(this.outputState)
  }

  private onPointerDown(event: PointerEvent): void {
    this.stopPropagation(event)
    if (!this.capturePointer(event.pointerId, event.object)) {
      return
    }
    this.firstOnPointer(event)
  }

  private onPointerMove(event: PointerEvent): void {
    this.stopPropagation(event)
    const entry = this.inputState.get(event.pointerId)
    if (entry != null) {
      this.latestMoveEvent = event
      entry.pointerWorldPoint = event.point
      entry.pointerWorldQuaternion = event.pointerQuaternion
      if (entry.pointerWorldDirection != null) {
        getWorldDirection(event, entry.pointerWorldDirection)
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
    const target = this.getTarget()
    if (
      target == null ||
      this.inputState.size === 0 ||
      (this.latestMoveEvent == null && (this.getOptions().alwaysUpdate ?? false) === false)
    ) {
      return
    }
    this.outputState.update(
      this.latestMoveEvent,
      computeHandleTransformState(
        time,
        this.inputState,
        this.initialTargetPosition,
        this.initialTargetQuaternion,
        this.initialTargetRotation,
        this.initialTargetScale,
        target.parent?.matrixWorld,
        this.getOptions(),
      ),
    )
    this.fn(this.outputState)
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
    const target = this.getTarget()
    if (target == null) {
      return
    }
    target.updateWorldMatrix(true, false)
    if (target.matrixAutoUpdate) {
      this.initialTargetPosition.copy(target.position)
      this.initialTargetQuaternion.copy(target.quaternion)
      this.initialTargetScale.copy(target.scale)
      this.initialTargetRotation.copy(target.rotation)
    } else {
      target.matrix.decompose(this.initialTargetPosition, this.initialTargetQuaternion, this.initialTargetScale)
      this.initialTargetRotation.setFromQuaternion(this.initialTargetQuaternion, target.rotation.order)
    }
    for (const data of this.inputState.values()) {
      initialPointerWorldPoint.copy(pointerWorldPoint)
      projectOntoSpace(
        pointerWorldPoint,
        vectorHelper.copy(pointerWorldPoint),
        pointerWorldDirection,
        this.getOptions(),
        this.inputState.size,
      )
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
