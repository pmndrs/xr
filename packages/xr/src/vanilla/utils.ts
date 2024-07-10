import { Object3D } from 'three'
import { GetXRSpace } from '../space.js'
import { xrUpdatesListContext } from './elements.js'

export function onXRFrame(fn: (frame: XRFrame, delta: number) => void) {
  if (xrUpdatesListContext == null) {
    throw new Error(`XR instances can only be created inside definitions of implementations`)
  }
  xrUpdatesListContext.push(fn)
}

const provideReferenceSpaceSymbol = Symbol('provide-xr-space')

declare module 'three' {
  interface Object3D {
    [provideReferenceSpaceSymbol]?: GetXRSpace
  }
}

export function setupConsumeReferenceSpace(object: Object3D): GetXRSpace {
  let referenceSpace: GetXRSpace | undefined
  return () => {
    if (referenceSpace == null) {
      referenceSpace = getReferenceSpaceFromAncestors(object)
      if (referenceSpace == null) {
        throw new Error(`this ${object} can only be rendered as a descendant of a XROrigin`)
      }
    }
    return typeof referenceSpace === 'function' ? referenceSpace() : referenceSpace
  }
}

export function setupProvideReferenceSpace(object: Object3D, space: GetXRSpace): void {
  object[provideReferenceSpaceSymbol] = space
}

function getReferenceSpaceFromAncestors({ parent }: Object3D): GetXRSpace | undefined {
  if (parent == null) {
    return undefined
  }
  if (provideReferenceSpaceSymbol in parent) {
    return parent[provideReferenceSpaceSymbol]
  }
  return getReferenceSpaceFromAncestors(parent)
}
