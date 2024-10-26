import { Vector3, Quaternion, Euler } from 'three'
import { PointerEvent } from '@pmndrs/pointer-events'

export type HandleTransformState = Readonly<{
  /**
   * time (or delta time) in ms
   */
  time: number
  position: Vector3
  /**
   * can not be used with axis locked rotation
   */
  quaternion: Quaternion
  rotation: Euler
  scale: Vector3
  pointerAmount: number
}>

export type Axis = 'x' | 'y' | 'z'

class SubtractedHandleTransformStateImpl implements Omit<HandleTransformState, 'pointerAmount'> {
  private _position?: Vector3
  private _quaternion?: Quaternion
  private _rotation?: Euler
  private _scale?: Vector3

  constructor(
    private t1: HandleTransformState,
    private t2: HandleTransformState,
  ) {}

  get time(): number {
    return this.t1.time - this.t2.time
  }

  get position(): Vector3 {
    return (this._position ??= this.t1.position.clone().sub(this.t2.position))
  }
  get quaternion(): Quaternion {
    return (this._quaternion ??= this.t2.quaternion.clone().invert().premultiply(this.t1.quaternion))
  }
  get rotation(): Euler {
    return (this._rotation ??= new Euler().setFromQuaternion(this.quaternion))
  }
  get scale(): Vector3 {
    return (this._scale ??= this.t1.scale.clone().sub(this.t2.scale))
  }
}

export type HandleState<T> = Readonly<{
  /**
   * the current event that caused the current transformation
   * is undefined for imperative non-event driven changes like cancelling the interaction
   */
  readonly event: PointerEvent | undefined
  readonly initial: HandleTransformState
  /**
   * undefined for the first time
   */
  readonly previous?: HandleTransformState
  readonly current: HandleTransformState
  /**
   * undefined for the first time
   */
  readonly delta?: Omit<HandleTransformState, 'pointerAmount'>
  readonly offset: Omit<HandleTransformState, 'pointerAmount'>
  readonly first: boolean
  readonly last: boolean
  readonly memo: T | undefined
  readonly cancel: () => void
}>

export class HandleStateImpl<T> implements HandleState<T> {
  public previous: HandleTransformState | undefined
  public memo: T | undefined
  public event: PointerEvent | undefined

  //will be set by start before the first read
  public initial!: HandleTransformState
  public current!: HandleTransformState
  public first!: boolean
  public last!: boolean

  //cache
  private _delta?: Omit<HandleTransformState, 'pointerAmount'>
  private _offset?: Omit<HandleTransformState, 'pointerAmount'>

  constructor(public readonly cancel: () => void) {}

  start(event: PointerEvent, current: HandleTransformState) {
    this.event = event
    this.previous = undefined
    this.current = current
    this.initial = current
    this.first = true
    this.last = false
    this.memo = undefined
  }

  update(event: PointerEvent | undefined, current: HandleTransformState) {
    this.event = event
    this.previous = this.current
    this.current = current
    this.first = false
    this.last = false
  }

  end(event: PointerEvent | undefined) {
    this.event = event
    this.previous = this.current
    this.first = false
    this.last = true
  }

  get delta(): Omit<HandleTransformState, 'pointerAmount'> | undefined {
    if (this.previous == null) {
      return undefined
    }
    return (this._delta ??= new SubtractedHandleTransformStateImpl(this.current, this.previous))
  }

  get offset(): Omit<HandleTransformState, 'pointerAmount'> {
    return (this._offset ??= new SubtractedHandleTransformStateImpl(this.current, this.initial))
  }
}
