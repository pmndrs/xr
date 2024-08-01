import { xrUpdatesListContext } from './elements.js'

export function onXRFrame(fn: (frame: XRFrame, delta: number) => void) {
  if (xrUpdatesListContext == null) {
    throw new Error(`XR instances can only be created inside definitions of implementations`)
  }
  xrUpdatesListContext.push(fn)
}
