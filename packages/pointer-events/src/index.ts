import type { PointerEvent, WheelEvent } from './event.js'
import type { AllowedPointerEvents, AllowedPointerEventsType } from './pointer.js'
import type { R3FInstance } from './r3f-compat.js'

declare module 'three' {
  interface Object3DEventMap {
    pointermove: PointerEvent
    pointercancel: PointerEvent
    pointerdown: PointerEvent
    pointerup: PointerEvent
    pointerenter: PointerEvent
    pointerleave: PointerEvent
    pointerover: PointerEvent
    pointerout: PointerEvent
    click: PointerEvent
    dblclick: PointerEvent
    contextmenu: PointerEvent
    wheel: WheelEvent
  }

  interface Object3D {
    __r3f?: R3FInstance
    /**
     * undefined and true means the transformation is ready
     * false means transformation is not ready
     */
    transformReady?: boolean

    /**
     * @default parent.pointerEvents ?? this.defaultPointerEvents
     */
    pointerEvents?: AllowedPointerEvents
    /**
     * @default "listener"
     */
    defaultPointerEvents?: AllowedPointerEvents
    /**
     * @default "all"
     */
    pointerEventsType?: AllowedPointerEventsType
    /**
     * @default 0
     * sorted by highest number first
     * (just like a higher renderOrder number will result in rendering over the previous - if depthTest is false)
     */
    pointerEventsOrder?: number
    isVoidObject?: boolean
  }
}

export * from './pointer.js'
export * from './event.js'
export * from './intersections/index.js'
export * from './forward.js'
export * from './pointer/index.js'
export * from './combine.js'
