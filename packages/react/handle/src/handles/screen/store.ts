import { getVoidObject, PointerEvent, PointerEventsMap } from '@pmndrs/pointer-events'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Object3D, Object3DEventMap, Scene, Vector2 } from 'three'

export class ScreenHandleStore<T = unknown> {
  private map = new Map<
    number,
    { latestEvent: PointerEvent; initialScreenPosition: Vector2; currentScreenPosition: Vector2 }
  >()
  private initial: T

  constructor(
    private apply: (initial: T, map: ScreenHandleStore['map']) => void,
    private getInitial: () => T,
  ) {
    this.initial = getInitial()
  }

  bind(scene: Scene): () => void {
    const down = this.onPointerDown.bind(this)
    const up = this.onPointerUp.bind(this)
    const move = this.onPointerMove.bind(this)
    const voidObject = getVoidObject(scene) as Object3D<Object3DEventMap & PointerEventsMap>
    voidObject.addEventListener('pointermove', move)
    voidObject.addEventListener('pointerdown', down)
    voidObject.addEventListener('pointerup', up)
    return () => {
      voidObject.removeEventListener('pointermove', move)
      voidObject.removeEventListener('pointerdown', down)
      voidObject.removeEventListener('pointerup', up)
    }
  }

  onPointerDown(e: PointerEvent) {
    if (e.intersection.details.type != 'screen-ray') {
      return
    }
    e.target.setPointerCapture(e.pointerId)
    this.map.set(e.pointerId, {
      initialScreenPosition: new Vector2(),
      currentScreenPosition: e.intersection.details.screenPoint.clone(),
      latestEvent: e,
    })
    this.save()
  }

  onPointerUp(e: PointerEvent) {
    if (!this.map.delete(e.pointerId)) {
      return
    }
    this.save()
  }

  onPointerMove(e: PointerEvent) {
    if (e.intersection.details.type != 'screen-ray') {
      return
    }
    const entry = this.map.get(e.pointerId)
    if (entry == null) {
      return
    }
    entry.latestEvent = e
    entry.currentScreenPosition.copy(e.intersection.details.screenPoint)
  }

  private save(): void {
    for (const entry of this.map.values()) {
      entry.initialScreenPosition.copy(entry.currentScreenPosition)
    }
    this.initial = this.getInitial()
  }

  update(): void {
    if (this.map.size === 0) {
      return
    }
    this.apply(this.initial, this.map)
  }
}

export function useScreenHandleStore<T>(
  apply: (initial: T, map: ScreenHandleStore['map']) => void,
  getInitial: () => T,
  deps: Array<any>,
  enabled: boolean,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => new ScreenHandleStore(apply, getInitial), deps)
  const scene = useThree((s) => s.scene)
  useEffect(() => (enabled ? store.bind(scene) : undefined), [enabled, store, scene])
  useFrame(() => enabled && store.update())
}
