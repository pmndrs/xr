import { GrabPointerOptions, RayPointerOptions, TouchPointerOptions } from '@pmndrs/pointer-events'
import { PointerCursorModelOptions } from './pointer/cursor.js'
import { PointerRayModelOptions } from './pointer/ray.js'
import { XRControllerModelOptions } from './controller/model.js'
import { XRHandModelOptions } from './hand/model.js'
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
  model?: boolean | XRControllerModelOptions
  grabPointer?: boolean | DefaultXRInputSourceGrabPointerOptions
  rayPointer?: boolean | DefaultXRInputSourceRayPointerOptions
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
