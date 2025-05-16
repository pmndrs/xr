import { PointerEventsMap, PointerEvent } from '@pmndrs/pointer-events'
import { Object3D, Object3DEventMap } from 'three'
import { HandleState } from '../state.js'
import { defaultApply, HandleOptions, HandleStore } from '../store.js'
import { TransformHandlesSpace } from './index.js'

export class HandlesContext {
  private handles: Array<{
    store: HandleStore<unknown>
    tag: string
    object: Object3D
  }> = []
  private hoveredTagMap = new Map<number, string>()
  private hoverSubscriptions: Array<(tags: Array<string>) => void> = []
  private applySubscriptions: Array<(tag: string, state: HandleState<unknown>, target: Object3D) => void> = []

  public space?: TransformHandlesSpace

  constructor(
    public readonly target: Object3D | { current?: Object3D | null },
    private readonly getOptions?: () => HandleOptions<unknown>,
  ) {}

  public getSpace() {
    return this.space ?? 'world'
  }

  public getTarget() {
    if (this.target instanceof Object3D) {
      return this.target
    }
    return this.target.current
  }

  getHandleOptions<T>(tag: string, getOverrideOptions?: () => HandleOptions<unknown>): HandleOptions<T> {
    const providedOptions = this.getOptions?.()
    const overrideOptions = getOverrideOptions?.()
    return {
      ...providedOptions,
      ...overrideOptions,
      apply: (state, target) => {
        this.onApply(tag, state, target)
        return (overrideOptions?.apply ?? providedOptions?.apply ?? defaultApply)?.(state, target)
      },
    }
  }

  registerHandle(
    store: HandleStore<unknown>,
    object: Object3D<PointerEventsMap & Object3DEventMap>,
    tag: string,
  ): () => void {
    const entry: (typeof this.handles)[number] = {
      object,
      store,
      tag,
    }
    this.handles.push(entry)
    const unbind = store.bind(object)

    const enterListener = this.onPointerEnter.bind(this, tag)
    const leaveListener = this.onPointerLeave.bind(this)
    object.addEventListener('pointerenter', enterListener)
    object.addEventListener('pointerleave', leaveListener)

    return () => {
      const index = this.handles.indexOf(entry)
      if (index != -1) {
        this.handles.splice(index, 1)
      }
      unbind()
      store.cancel()
    }
  }

  subscribeHover(fn: (tags: Array<string>) => void): () => void {
    this.hoverSubscriptions.push(fn)
    fn(Array.from(this.hoveredTagMap.values()))
    return () => {
      const index = this.hoverSubscriptions.indexOf(fn)
      if (index === -1) {
        return
      }
      this.hoverSubscriptions.splice(index, 1)
    }
  }

  subscribeApply(fn: (tag: string, state: HandleState<unknown>, target: Object3D) => void): () => void {
    this.applySubscriptions.push(fn)
    return () => {
      const index = this.applySubscriptions.indexOf(fn)
      if (index === -1) {
        return
      }
      this.applySubscriptions.splice(index, 1)
    }
  }

  update(time: number): void {
    for (const { store } of this.handles) {
      store.update(time)
    }
  }

  private onPointerEnter(tag: string, e: PointerEvent) {
    this.hoveredTagMap.set(e.pointerId, tag)
    this.updateHover()
  }

  private onPointerLeave(e: PointerEvent) {
    this.hoveredTagMap.delete(e.pointerId)
    this.updateHover()
  }

  private updateHover() {
    const tags = Array.from(this.hoveredTagMap.values())
    for (const hoverSubscription of this.hoverSubscriptions) {
      hoverSubscription(tags)
    }
  }

  private onApply(tag: string, state: HandleState<any>, target: Object3D): void {
    for (const applySubscription of this.applySubscriptions) {
      applySubscription(tag, state, target)
    }
  }
}
