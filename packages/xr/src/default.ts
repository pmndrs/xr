import { GrabPointerOptions, RayPointerOptions, TouchPointerOptions } from '@pmndrs/pointer-events'
import { XRControllerModelOptions } from './controller/model.js'
import { XRHandModelOptions } from './hand/model.js'
import { PointerCursorModelOptions } from './pointer/cursor.js'
import { PointerRayModelOptions } from './pointer/ray.js'
import { TeleportPointerRayModelOptions } from './teleport.js'

export type DefaultXRInputSourceGrabPointerOptions = GrabPointerOptions & {
  makeDefault?: boolean
  cursorModel?: boolean | PointerCursorModelOptions
}

export type DefaultXRInputSourceRayPointerOptions = RayPointerOptions & {
  makeDefault?: boolean
  rayModel?: boolean | PointerRayModelOptions
  cursorModel?: boolean | PointerCursorModelOptions
}

export type DefaultXRHandTouchPointerOptions = TouchPointerOptions & {
  makeDefault?: boolean
  cursorModel?: boolean | PointerCursorModelOptions
}

export type DefaultXRControllerOptions = {
  /**
   * provide options to the <XRControllerModel/>
   * `false` disables the model
   * @default true
   */
  model?: boolean | XRControllerModelOptions
  /**
   * provide options to the <DefaultXRInputSourceGrabPointer/>
   * `false` disables the grab pointer
   * @default true
   */
  grabPointer?: boolean | DefaultXRInputSourceGrabPointerOptions
  /**
   * provide options to the <DefaultXRInputSourceRayPointer/>
   * `false` disables the ray pointer
   * @default true
   */
  rayPointer?: boolean | DefaultXRInputSourceRayPointerOptions
  /**
   * provide options to the <DefaultXRInputSourceTeleportPointer/>
   * `false` disables the teleport pointer
   * @default false
   */
  teleportPointer?: boolean | DefaultXRInputSourceTeleportPointerOptions
}

export type DefaultXRHandOptions = {
  model?: boolean | XRHandModelOptions
  grabPointer?: boolean | DefaultXRInputSourceGrabPointerOptions
  rayPointer?: boolean | DefaultXRInputSourceRayPointerOptions
  touchPointer?: boolean | DefaultXRHandTouchPointerOptions
  teleportPointer?: boolean | DefaultXRInputSourceTeleportPointerOptions
}

export type DefaultXRTransientPointerOptions = RayPointerOptions & {
  cursorModel?: boolean | PointerCursorModelOptions
}

export type DefaultXRGazeOptions = RayPointerOptions & {
  cursorModel?: boolean | PointerCursorModelOptions
}

export type DefaultXRScreenInputOptions = RayPointerOptions

export type DefaultXRInputSourceTeleportPointerOptions = Omit<RayPointerOptions, 'lines'> & {
  makeDefault?: boolean
  rayModel?: boolean | TeleportPointerRayModelOptions
  cursorModel?: boolean | PointerCursorModelOptions
}
