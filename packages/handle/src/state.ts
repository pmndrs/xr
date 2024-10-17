import { Vector3, Quaternion, Euler, Matrix4, EulerOrder } from 'three'
import { applyHandleTransformOptions, getRotateOrderFromOptions, isDefaultOptions } from './utils.js'
import { PointerEvent } from '@pmndrs/pointer-events'
import { HandleOptions } from './store.js'

export type HandleTransformState = Readonly<{
  /**
   * time (or delta time) in ms
   */
  time: number
  position: Vector3
  /**
   * can not be used with axis locked rotation
   */
  quaterion: Quaternion
  rotation: Euler
  scale: Vector3
  pointerAmount: number
}>

export type Axis = 'x' | 'y' | 'z'

const positionHelper = new Vector3()
const quaternionHelper = new Quaternion()
const scaleHelper = new Vector3()

export class HandleTransformStateImpl implements HandleTransformState {
  private _position?: Vector3
  private _quaternion?: Quaternion
  private _rotation?: Euler
  private _scale?: Vector3

  private readonly matrix: Matrix4

  constructor(
    public readonly time: number,
    public readonly pointerAmount: number,
    public readonly globalMatrix: Matrix4,
    relativeParentWorldMatrix: Matrix4 | undefined,
    private readonly getOptions: () => HandleOptions,
  ) {
    //matrix = relativeParentWorldMatrix-1 * globalMatrix
    if (relativeParentWorldMatrix != null) {
      this.matrix = relativeParentWorldMatrix.clone().invert().multiply(globalMatrix)
    } else {
      //relativeParentWorldMatrix is undefined => matrix = globalMatrix
      this.matrix = globalMatrix.clone()
    }
  }

  get position(): Vector3 {
    if (this._position != null) {
      return this._position
    }
    return (this._position = new Vector3().setFromMatrixPosition(this.matrix))
  }
  get quaterion(): Quaternion {
    if (this._quaternion != null) {
      return this._quaternion
    }
    this.matrix.decompose(positionHelper, (this._quaternion = new Quaternion()), scaleHelper)
    return this._quaternion
  }
  get rotation(): Euler {
    if (this._rotation != null) {
      return this._rotation
    }
    const rotateOptions = this.getOptions().rotate ?? true
    this.matrix.decompose(positionHelper, quaternionHelper, scaleHelper)
    return (this._rotation = new Euler().setFromQuaternion(quaternionHelper, getRotateOrderFromOptions(rotateOptions)))
  }

  get scale(): Vector3 {
    if (this._scale != null) {
      return this._scale
    }
    return (this._scale = new Vector3().setFromMatrixScale(this.matrix))
  }
}

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
  get quaterion(): Quaternion {
    return (this._quaternion ??= this.t2.quaterion.clone().invert().premultiply(this.t1.quaterion))
  }
  get rotation(): Euler {
    return (this._rotation ??= new Euler().setFromQuaternion(this.quaterion))
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
  public previous: HandleTransformStateImpl | undefined
  public memo: T | undefined
  public event: PointerEvent | undefined

  //will be set by start before the first read
  public initial!: HandleTransformStateImpl
  public current!: HandleTransformStateImpl
  public first!: boolean
  public last!: boolean

  //cache
  private _delta?: Omit<HandleTransformState, 'pointerAmount'>
  private _offset?: Omit<HandleTransformState, 'pointerAmount'>

  constructor(public readonly cancel: () => void) {}

  start(event: PointerEvent, current: HandleTransformStateImpl) {
    this.event = event
    this.previous = undefined
    this.current = current
    this.initial = current
    this.first = true
    this.last = false
    this.memo = undefined
  }

  update(event: PointerEvent | undefined, current: HandleTransformStateImpl) {
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
